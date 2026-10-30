import UserService from "../service/userService.js";
import ProjectAnalyticsService from "../service/ProjectAnalyticsService.js";
import CourseEnrollment from "../models/CourseEnrollment.js"; // <-- Add this import

const userService = new UserService();

export const getAllStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = req.query.search?.trim();
    const filter = { role: 'student' };

    // ✅ Parse filters from query (JSON string)
    if (req.query.filters) {
      const parsedFilters = JSON.parse(req.query.filters);

      if (typeof parsedFilters.isActive !== "undefined") {
        // Convert string to boolean if needed
        filter.isActive =
          parsedFilters.isActive === "true" || parsedFilters.isActive === true;
      }

      // Add any other parsed filters (optional)
      if (parsedFilters.status) {
        filter.status = parsedFilters.status;
      }
    }

    // 🔍 Field-based searches
    if (req.query.fullName) {
      filter.fullName = { $regex: req.query.fullName, $options: 'i' };
    }
    if (req.query.email) {
      filter.email = { $regex: req.query.email, $options: 'i' };
    }
    if (req.query.phone) {
      filter.phone = { $regex: req.query.phone, $options: 'i' };
    }

    // 🔍 General search
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = { createdAt: -1 };

    const { users, total } = await userService.getAllUsers(page, limit, filter, sort);

    if (res.locals) {
      res.locals.docCount = users?.length ?? 0;
    }

    return res.status(200).json({
      success: true,
      message: "✅ Students fetched successfully",
      data: {
        students: users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      },
      err: {}
    });
  } catch (error) {
    console.error("❌ Error in getAllStudents:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch students",
      data: {},
      err: error.message
    });
  }
};



export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await userService.getUserById(id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
        data: {},
        err: {}
      });
    }

    // Fetch enrollments from CourseEnrollment collection
    const enrollments = await CourseEnrollment.find({ userId: student._id })
      .populate({
        path: 'courseId',
        select: 'title slug thumbnail isPublished',
      })
      .lean();

    // Map enrollments to include accessExpiry and enrolledAt, and rename courseId to course
    const mappedEnrollments = enrollments.map(enrollment => ({
      ...enrollment,
      course: enrollment.courseId, // expose as 'course'
      accessExpiry: enrollment.accessExpiry,
      enrolledAt: enrollment.enrolledAt || enrollment.createdAt,
    }));

    // Attach mapped enrollments to student object
    const studentObj = student.toObject ? student.toObject() : student;
    studentObj.enrollments = mappedEnrollments;

    // Attach latest personality test result
    let personality = null;
    try {
      const PersonalitySubmission = (await import('../models/PersonalitySubmission.js')).default;
      personality = await PersonalitySubmission.findOne({ userId: student._id }).sort({ createdAt: -1 }).lean();
    } catch (e) {
      console.error('Error fetching personality submission:', e);
    }
    studentObj.personality = personality ? {
      resultType: personality.resultType,
      scores: personality.scores,
      createdAt: personality.createdAt
    } : null;

    return res.status(200).json({
      success: true,
      message: '✅ Student fetched successfully',
      data: { student: studentObj },
      err: {}
    });
  } catch (error) {
    console.error("❌ Error in getStudentById:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch student",
      data: {},
      err: error.message
    });
  }
};

export const getStudentAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const analytics = await ProjectAnalyticsService.getStudentAnalytics(id);
    if (analytics.error) {
      return res.status(404).json({
        success: false,
        message: analytics.error,
        data: {},
        err: {}
      });
    }
    return res.status(200).json({
      success: true,
      message: "✅ Student analytics fetched successfully",
      data: analytics,
      err: {}
    });
  } catch (error) {
    console.error("❌ Error in getStudentAnalytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch student analytics",
      data: {},
      err: error.message
    });
  }
};
