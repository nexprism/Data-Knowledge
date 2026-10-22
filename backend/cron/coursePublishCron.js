import cron from 'node-cron';
import mongoose from 'mongoose';
import Course from '../models/Course.js';

// Auto-publish scheduled courses
// Runs every minute to check if any course has reached its scheduled publishDate
cron.schedule('* * * * *', async () => {
  try {
    // Skip if MongoDB is not connected yet
    if (mongoose.connection.readyState !== 1) {
      return;
    }

    const now = new Date();
    const result = await Course.updateMany(
      {
        publishDate: { $lte: now, $ne: null },
        isPublished: false,
        isDeleted: false,
      },
      {
        $set: { isPublished: true },
      }
    );

    if (result && result.modifiedCount > 0) {
      console.log(`⏰ [CoursePublishCron] Automatically published ${result.modifiedCount} scheduled course(s) at ${now.toISOString()}`);
    }
  } catch (error) {
    console.error('❌ [CoursePublishCron Error]:', error);
  }
});
