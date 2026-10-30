import TextLessonService from "../service/textLessonService.js";
import NotificationService from "../service/notificationService.js";

export const createTextLesson = async (req, res) => {
  try {
    let attachments = [];

    if (req.file) {
      attachments.push({
        fileName: req.file.originalname,
        uploadedAt: new Date(),
      });
    } else if (req.files && req.files.length > 0) {
      attachments = req.files.map((file) => ({
        fileName: file.originalname,
        uploadedAt: new Date(),
      }));
    }

    const lessonData = {
      ...req.body,
      lesson: req.body.lesson || req.body.lessonId,
      course: req.body.course || req.body.courseId,
      attachments,
    };

    const lesson = await TextLessonService.createTextLesson(lessonData);

    try {
      const courseIdToNotify = lesson.course || lessonData.course;
      if (courseIdToNotify) {
        const notificationData = {
          title: "New File Available",
          body: `A new file titled "${lesson.title}" has been added to your course.`,
        };
        await NotificationService.notifyEnrolledUsers(courseIdToNotify, notificationData);
      }
    } catch (notifErr) {
      console.warn("Notification error during text lesson creation:", notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Text lesson created successfully",
      data: lesson,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllTextLessons = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "asc",
      courseId,
      lessonId,
    } = req.query;

    const filters = {};
    if (courseId) filters.courseId = courseId;
    if (lessonId) filters.lessonId = lessonId;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      sortBy,
      sortOrder,
      filters,
    };

    const lessons = await TextLessonService.getAllTextLessons(options);

    res.status(200).json({
      success: true,
      message: "Text lessons fetched successfully",
      ...lessons,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTextLessonById = async (req, res) => {
  try {
    const lesson = await TextLessonService.getTextLessonById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Text lesson not found" });
    }
    res.json({
      success: true,
      message: "Text lesson fetched successfully",
      data: lesson,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTextLesson = async (req, res) => {
  try {
    const lesson = await TextLessonService.updateTextLesson(req.params.id, req.body);
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Text lesson not found" });
    }

    res.json({
      success: true,
      message: "Text lesson updated successfully",
      data: lesson,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteTextLesson = async (req, res) => {
  try {
    const deleted = await TextLessonService.deleteTextLesson(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Text lesson not found" });
    }

    res.json({ success: true, message: "Text lesson deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
