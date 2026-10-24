import Notification from "../models/Notifications.js";
import FcmToken from "../models/fcmTokens.js";
import fcmService from "../utils/notificationService.js";
import Enrollment from "../models/CourseEnrollment.js";
import User from "../models/user.js";
import mongoose from "mongoose";

class NotificationService {

  async getAll(query, userId) {
    try {
      const { page = 1, limit = 10, sort = "{}" } = query;
      const pageNum = Math.max(parseInt(page) || 1, 1);
      const limitNum = Math.max(parseInt(limit) || 10, 1);
      const skip = (pageNum - 1) * limitNum;

      let parsedSort = {};
      try {
        parsedSort = JSON.parse(sort);
      } catch (err) {
        console.warn("⚠️ Invalid JSON for sort");
      }

      // ✅ Build match condition safely
      const matchConditions = {
        $or: [
          ...(userId ? [{ user_id: mongoose.isValidObjectId(userId) ? userId : new mongoose.Types.ObjectId(userId) }] : []),
          { user_id: null } // admin notifications
        ]
      };

      //console.log("🔍 Match conditions for notifications:", matchConditions);

      const pipeline = [{ $match: matchConditions }];

      // Sorting
      if (Object.keys(parsedSort).length > 0) {
        const sortStage = {};
        for (const [key, val] of Object.entries(parsedSort)) {
          sortStage[key] = val === "asc" ? 1 : -1;
        }
        pipeline.push({ $sort: sortStage });
      } else {
        pipeline.push({ $sort: { created_at: -1 } });
      }

      const userObjId = userId && mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : null;

      // Add isRead field based on status and read_by
      pipeline.push({
        $addFields: {
          isRead: {
            $or: [
              { $eq: ["$status", 0] },
              ...(userObjId ? [{ $in: [userObjId, { $ifNull: ["$read_by", []] }] }] : [])
            ]
          }
        }
      });

      // Normalize status: 0 if read by user, 1 if unread
      pipeline.push({
        $addFields: {
          status: {
            $cond: {
              if: "$isRead",
              then: 0,
              else: 1
            }
          }
        }
      });

      // Pagination
      pipeline.push({
        $facet: {
          data: [{ $skip: skip }, { $limit: limitNum }],
          count: [{ $count: "total" }],
        },
      });

      const [result] = await Notification.aggregate(pipeline);

      const notifications = result?.data || [];
      const total = result?.count[0]?.total || 0;

      return {
        result: notifications,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      };
    } catch (error) {
      console.error("❌ Error fetching notifications:", error.message);
      throw new Error("Cannot fetch notifications");
    }
  }

  async markAllRead(userId, deviceId) {
    try {
      const userObjId = userId && mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId;

      // Mark direct user notifications as read
      const userResult = await Notification.updateMany(
        { user_id: userObjId, status: 1 },
        { 
          $set: { status: 0 },
          $addToSet: { read_by: userObjId }
        }
      );

      // Also mark global broadcast notifications as read for this user
      const broadcastResult = await Notification.updateMany(
        { user_id: null },
        { 
          $addToSet: { read_by: userObjId }
        }
      );

      return {
        matched: (userResult.matchedCount || 0) + (broadcastResult.matchedCount || 0),
        modified: (userResult.modifiedCount || 0) + (broadcastResult.modifiedCount || 0),
      };
    } catch (error) {
      console.error("❌ Error marking notifications as read:", error.message);
      throw new Error("Cannot mark notifications as read");
    }
  }

  // markSingleRead
  async markSingleRead(userId, notificationId) {
    try {
      const userObjId = userId && mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId;
      const notifObjId = mongoose.isValidObjectId(notificationId) ? new mongoose.Types.ObjectId(notificationId) : notificationId;

      const result = await Notification.updateOne(
        {
          _id: notifObjId,
          $or: [
            { user_id: userObjId },
            { user_id: null }
          ]
        },
        { 
          $set: { status: 0 },
          $addToSet: { read_by: userObjId }
        }
      );

      return {
        matched: result.matchedCount,
        modified: result.modifiedCount,
      };
    } catch (error) {
      console.error("❌ Error marking notification as read:", error.message);
      throw new Error("Cannot mark notification as read");
    } 
  }
  
async sendToAllStudents(data, webPushLink = null) {
  try {
    console.log("🔥 sendToAllStudents called with data:", data);

    const notificationPayload = {
      ...data,
      type: data?.type || "general"
    };

    // 1️⃣ Always save a master broadcast notification in database
    // (user_id: null indicates a platform-wide global announcement)
    const masterNotification = new Notification({
      user_id: null,
      device_id: null,
      data: notificationPayload,
      status: 1, // 1 = unread
    });
    await masterNotification.save();
    console.log(`✅ Master global notification saved with ID: ${masterNotification._id}`);

    // 2️⃣ Fetch all registered FCM tokens to attempt web push
    let sent = 0;
    let failed = 0;
    const tokens = await FcmToken.find({}).select("token userId deviceId updatedAt -_id");
    console.log(`🟢 Total FCM tokens fetched: ${tokens.length}`);

    if (tokens && tokens.length > 0) {
      // Group by deviceId+token combination and keep only the latest user for each device
      const deviceTokensMap = new Map();
      
      tokens.forEach(t => {
        if (t.token && t.deviceId) {
          const deviceKey = `${t.deviceId}_${t.token}`;
          if (!deviceTokensMap.has(deviceKey)) {
            deviceTokensMap.set(deviceKey, t);
          } else {
            const existing = deviceTokensMap.get(deviceKey);
            if (new Date(t.updatedAt) > new Date(existing.updatedAt)) {
              deviceTokensMap.set(deviceKey, t);
            }
          }
        }
      });

      console.log(`🟢 Found ${deviceTokensMap.size} unique devices to push via FCM`);

      const sendPromises = Array.from(deviceTokensMap.values()).map(async deviceToken => {
        try {
          const res = await fcmService.sendPushNotification([deviceToken.token], notificationPayload, webPushLink);
          if (res.responses && res.responses[0]?.success) {
            sent++;
          } else {
            failed++;
            if (res.responses && res.responses[0]?.error?.code === "messaging/registration-token-not-registered") {
              await FcmToken.deleteMany({ token: deviceToken.token });
            }
          }
        } catch (err) {
          failed++;
          console.error(`❌ FCM error for device: ${deviceToken.deviceId}`, err.message);
        }
      });

      await Promise.all(sendPromises);
    }

    return {
      success: true,
      message: "Global notification published and recorded successfully",
      notificationId: masterNotification._id,
      sent,
      failed,
      uniqueDevices: tokens ? tokens.length : 0
    };

  } catch (err) {
    console.error("❌ Error sending notification to all students:", err);
    throw new Error("Cannot send notification to all students");
  }
}

async sendToCourseStudents(courseId, data, webPushLink = null) {
  try {
    console.log("🔥 sendToCourseStudents called with courseId:", courseId, "data:", data);

    // 1️⃣ Validate courseId
    if (!mongoose.isValidObjectId(courseId)) {
      throw new Error("Invalid course ID format");
    }

    // 2️⃣ Get all enrolled students for the specific course
    const enrollments = await Enrollment.find({ 
      courseId: new mongoose.Types.ObjectId(courseId) 
    }).select("userId").lean();

    console.log(`🟢 Found ${enrollments.length} enrollments for course ${courseId}`);

    const userIds = enrollments.map(e => e.userId).filter(Boolean);
    const courseNotificationData = {
      ...data,
      courseId: courseId,
      type: data?.type || "course_notification"
    };

    const savedNotifications = [];

    // 3️⃣ Always save in-app notification in database for enrolled students
    if (userIds.length > 0) {
      const notificationsToInsert = userIds.map(uId => ({
        user_id: uId,
        data: courseNotificationData,
        status: 1, // 1 = unread
      }));
      const inserted = await Notification.insertMany(notificationsToInsert);
      savedNotifications.push(...inserted);
    } else {
      // If no students enrolled yet, save course record so it appears in Admin History
      const courseMaster = await Notification.create({
        user_id: null,
        data: courseNotificationData,
        status: 1
      });
      savedNotifications.push(courseMaster);
    }

    console.log(`✅ Saved ${savedNotifications.length} notification record(s) in database`);

    // 4️⃣ If FCM tokens exist for enrolled students, push to their devices
    let sent = 0;
    let failed = 0;

    if (userIds.length > 0) {
      const tokens = await FcmToken.find({
        userId: { $in: userIds }
      }).select("token userId deviceId updatedAt -_id");

      if (tokens && tokens.length > 0) {
        const deviceTokensMap = new Map();
        tokens.forEach(t => {
          if (t.token && t.deviceId) {
            const deviceKey = `${t.deviceId}_${t.token}`;
            if (!deviceTokensMap.has(deviceKey)) {
              deviceTokensMap.set(deviceKey, t);
            } else {
              const existing = deviceTokensMap.get(deviceKey);
              if (new Date(t.updatedAt) > new Date(existing.updatedAt)) {
                deviceTokensMap.set(deviceKey, t);
              }
            }
          }
        });

        const sendPromises = Array.from(deviceTokensMap.values()).map(async deviceToken => {
          try {
            const res = await fcmService.sendPushNotification([deviceToken.token], courseNotificationData, webPushLink);
            if (res.responses && res.responses[0]?.success) {
              sent++;
            } else {
              failed++;
              if (res.responses && res.responses[0]?.error?.code === "messaging/registration-token-not-registered") {
                await FcmToken.deleteMany({ token: deviceToken.token });
              }
            }
          } catch (err) {
            failed++;
            console.error(`❌ FCM error for device: ${deviceToken.deviceId}`, err.message);
          }
        });

        await Promise.all(sendPromises);
      }
    }

    return {
      success: true,
      message: `Course notification published and saved (${savedNotifications.length} records created)`,
      courseId,
      sent,
      failed,
      totalStudents: enrollments.length,
      savedNotifications: savedNotifications.length,
      notificationIds: savedNotifications.map(n => n._id),
      uniqueDevices: deviceTokensMap ? deviceTokensMap.size : 0
    };

  } catch (err) {
    console.error("❌ Error sending notification to course students:", err);
    throw new Error(`Cannot send notification to course students: ${err.message}`);
  }
}

  // Update the existing notifyEnrolledUsers method to be more robust
  async notifyEnrolledUsers(courseId, notificationData) {
    try {
      console.log(`🔔 Notifying enrolled users for course: ${courseId}`);
      
      const enrollments = await Enrollment.find({ 
        courseId: new mongoose.Types.ObjectId(courseId) 
      }).select("userId").lean();

      console.log(`Found ${enrollments.length} enrollments`);

      for (const enrollment of enrollments) {
        const fcmToken = await FcmToken.findOne({ userId: enrollment.userId });
        
        if (fcmToken && fcmToken.token) {
          try {
            await fcmService.sendPushNotification([fcmToken.token], notificationData);

            // Save notification
            await Notification.create({
              user_id: enrollment.userId,
              data: {
                ...notificationData,
                courseId: courseId,
                type: "course_enrollment_notification"
              },
              status: 1, // Fix: 1 = unread
            });

            console.log(`✅ Notification sent to user: ${enrollment.userId}`);
          } catch (pushError) {
            console.error(`❌ Failed to send notification to user ${enrollment.userId}:`, pushError);
          }
        } else {
          console.warn(`⚠️ No FCM token found for user: ${enrollment.userId}`);
        }
      }
    } catch (error) {
      console.error("❌ Error notifying enrolled users:", error);
      throw error;
    }
  }

  async notifyJobApproved(jobPost, adminUser) {
    try {
      console.log(`🟢 Job approved notification for job: ${jobPost.title}`);

      // 1️⃣ Notify ONLY the job creator about approval
      const creatorId = jobPost.createdBy._id || jobPost.createdBy;
      // const creatorNotificationData = {
      //   title: "Job Post Approved!",
      //   description: `Your job post "${jobPost.title}" has been approved by admin and is now live.`,
      //   type: "job_approval",
      //   jobId: jobPost._id.toString(),
      //   jobTitle: jobPost.title
      // };

      // // Send approval notification ONLY to creator
      // await this.sendNotificationToUser(creatorId, creatorNotificationData);
      // console.log(`✅ Job approval notification sent to creator: ${creatorId}`);

      // 2️⃣ Send "New Job Available" alert to ALL OTHER users (exclude creator)
      const allUsersNotificationData = {
        title: "New Job Available!",
        description: `A new job "${jobPost.title}" is now available. Check it out!`,
        type: "new_job_alert",
        jobId: jobPost._id.toString(),
        jobTitle: jobPost.title,
        category: jobPost.category,
        budget: jobPost.budget
      };

      // Send new job alert to everyone EXCEPT the creator
      await this.sendNewJobAlertToAllUsers(allUsersNotificationData);
      console.log(`✅ New job alert sent to all users except creator: ${creatorId}`);

    } catch (error) {
      console.error("❌ Error sending job approval notifications:", error);
      throw error;
    }
  }

  async notifyJobRejected(jobPost, adminUser) {
    try {
      console.log(`🔴 Job rejected notification for job: ${jobPost.title}`);

      // Send rejection notification ONLY to the job creator
      const creatorId = jobPost.createdBy._id || jobPost.createdBy;
      const notificationData = {
        title: "Job Post Rejected",
        description: `Your job post "${jobPost.title}" has been rejected by admin. Please review and resubmit if needed.`,
        type: "job_rejection",
        jobId: jobPost._id.toString(),
        jobTitle: jobPost.title,
        adminName: adminUser.fullName || adminUser.name || "Admin"
      };

      await this.sendNotificationToUser(creatorId, notificationData);
      console.log(`✅ Job rejection notification sent ONLY to creator: ${creatorId}`);

    } catch (error) {
      console.error("❌ Error sending job rejection notification:", error);
      throw error;
    }
  }

  async sendNotificationToUser(userId, notificationData) {
    try {
      // Get user's FCM token
      const fcmToken = await FcmToken.findOne({ userId });
      
      if (fcmToken && fcmToken.token) {
        // Send FCM notification
        const fcmResult = await fcmService.sendPushNotification([fcmToken.token], notificationData);
        
        if (fcmResult.success) {
          // Save to database
          const notification = new Notification({
            user_id: userId,
            data: notificationData,
            status: 1, // unread
          });
          
          await notification.save();
          console.log(`✅ Notification sent and saved for user: ${userId}`);
        } else {
          console.log(`❌ Failed to send FCM notification to user: ${userId}`);
        }
      } else {
        // Still save to database even if no FCM token
        const notification = new Notification({
          user_id: userId,
          data: notificationData,
          status: 1, // unread
        });
        
        await notification.save();
        console.log(`📱 No FCM token for user ${userId}, but notification saved to database`);
      }
    } catch (error) {
      console.error(`❌ Error sending notification to user ${userId}:`, error);
      throw error;
    }
  }

  async sendNewJobAlertToAllUsers(notificationData, excludeUserId = null) {
    try {
      console.log(`🔔 Sending new job alert to all devices (latest user per device)`);

      // Get all FCM tokens, optionally excluding creator
      let query = {};
      if (excludeUserId) {
        query = { userId: { $ne: excludeUserId } };
      }

      const tokens = await FcmToken.find(query).select("token userId deviceId updatedAt -_id");

      console.log(`🟢 Found ${tokens.length} total tokens`);

      if (!tokens || tokens.length === 0) {
        console.warn("⚠️ No users with FCM tokens found for new job alert");
        return { success: false, message: "No users to notify", sent: 0, failed: 0 };
      }

      // Group by deviceId+token combination and keep only the latest user for each device
      const deviceTokensMap = new Map();
      
      tokens.forEach(t => {
        if (t.token && t.deviceId) {
          const deviceKey = `${t.deviceId}_${t.token}`;
          
          if (!deviceTokensMap.has(deviceKey)) {
            deviceTokensMap.set(deviceKey, t);
          } else {
            // Keep the token with the latest updatedAt
            const existing = deviceTokensMap.get(deviceKey);
            if (new Date(t.updatedAt) > new Date(existing.updatedAt)) {
              deviceTokensMap.set(deviceKey, t);
            }
          }
        }
      });

      console.log(`🟢 Found ${deviceTokensMap.size} unique devices with latest users to notify about new job`);

      if (deviceTokensMap.size === 0) {
        console.warn("⚠️ No unique devices with FCM tokens found for new job alert");
        return { success: false, message: "No devices to notify", sent: 0, failed: 0 };
      }

      let sent = 0;
      let failed = 0;

      // Send one notification per unique device (to the latest user)
      const sendPromises = Array.from(deviceTokensMap.values()).map(async deviceToken => {
        try {
          const res = await fcmService.sendPushNotification([deviceToken.token], notificationData);

          if (res.responses && res.responses[0]) {
            if (res.responses[0].success) {
              // Save notification to database for the latest user of this device
              const notification = new Notification({
                user_id: deviceToken.userId,
                device_id: deviceToken.deviceId,
                data: notificationData,
                status: 1, // unread
              });
              await notification.save();

              sent++;
              console.log(`✅ New job alert sent to device: ${deviceToken.deviceId}, latest user: ${deviceToken.userId}, updated: ${deviceToken.updatedAt}`);
            } else {
              failed++;
              console.log(`❌ New job alert FAILED for device: ${deviceToken.deviceId}, error: ${res.responses[0].error?.message}`);

              // Remove invalid FCM token
              if (res.responses[0].error?.code === "messaging/registration-token-not-registered") {
                await FcmToken.deleteMany({ token: deviceToken.token });
                console.log(`🗑 Removed invalid token for device: ${deviceToken.deviceId}`);
              }
            }
          } else {
            failed++;
            console.warn(`⚠️ Unknown FCM response for new job alert to device: ${deviceToken.deviceId}`);
          }
        } catch (err) {
          failed++;
          console.error(`❌ FCM ERROR for new job alert to device: ${deviceToken.deviceId}`, err.message);
        }
      });

      await Promise.all(sendPromises);

      console.log(`📡 New job alert sending finished. Total sent: ${sent}, Failed: ${failed}, Unique devices: ${deviceTokensMap.size}`);
      return { success: true, sent, failed, uniqueDevices: deviceTokensMap.size };

    } catch (error) {
      console.error("❌ Error sending new job alert to all users:", error);
      throw error;
    }
  }
}

export default new NotificationService();
