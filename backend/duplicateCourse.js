import mongoose from 'mongoose';
import Course from './models/Course.js';
import Module from './models/Module.js';
import Lesson from './models/Lesson.js';
import Quiz from './models/Quiz.js';
import VideoLesson from './models/video.js';
import Assignment from './models/Assignment.js';
import TextLesson from './models/TextLesson.js';
import File from './models/File.js';
import CoursePlan from './models/CoursePlan.js';
import CoursePricingPlan from './models/coursePricingPlan.js';
import CourseService from './service/CourseService.js';

// Utility to deep clone and remove _id and timestamps
function cloneDoc(doc) {
  const clone = JSON.parse(JSON.stringify(doc));
  delete clone._id;
  delete clone.createdAt;
  delete clone.updatedAt;
  delete clone.__v;
  return clone;
}

export async function duplicateCourse(courseId, options = {}) {
  const { title, slug, startDate, publishDate, isPublished } = options;

  // 1. Fetch original course
  const origCourse = await Course.findById(courseId).lean();
  if (!origCourse) throw new Error('Course not found');

  const courseService = new CourseService();
  const newTitle = title?.trim() || `${origCourse.title} (Batch 2)`;
  let newSlug = slug?.trim();
  if (!newSlug) {
    newSlug = await courseService.generateUniqueSlug(newTitle);
  } else {
    newSlug = await courseService.generateUniqueSlug(newSlug);
  }

  // Parse publishDate and isPublished logic
  let finalPublishDate = null;
  let finalIsPublished = isPublished !== undefined ? Boolean(isPublished) : origCourse.isPublished;

  if (publishDate) {
    const parsedPublish = new Date(publishDate);
    if (!isNaN(parsedPublish.getTime())) {
      finalPublishDate = parsedPublish;
      // If scheduled date is in the future, course must be draft/scheduled until that date!
      if (parsedPublish > new Date()) {
        finalIsPublished = false;
      } else {
        finalIsPublished = true;
      }
    }
  }

  // 2. Clone course document
  const newCourseData = cloneDoc(origCourse);
  newCourseData.title = newTitle;
  newCourseData.slug = newSlug;
  newCourseData.modules = [];
  newCourseData.publishDate = finalPublishDate;
  newCourseData.isPublished = finalIsPublished;

  if (startDate) {
    const parsedStart = new Date(startDate);
    if (!isNaN(parsedStart.getTime())) {
      newCourseData.startDate = parsedStart;
    }
  }

  // Reset metrics & enrollments for new batch
  newCourseData.enrolledStudents = [];
  newCourseData.enrolledStudentsCount = 0;
  newCourseData.currentEnrollments = 0;
  newCourseData.salesCount = 0;
  newCourseData.revenue = 0;
  newCourseData.totalReviews = 0;
  newCourseData.averageRating = 0;
  newCourseData.totalViews = 0;
  newCourseData.isDeleted = false;
  newCourseData.deletedAt = null;

  const newCourse = await Course.create(newCourseData);

  // 3. Duplicate modules
  const origModules = await Module.find({ courseId: origCourse._id, isDeleted: { $ne: true } }).sort({ order: 1 }).lean();
  const moduleIdMap = {};

  for (const origModule of origModules) {
    const newModuleData = cloneDoc(origModule);
    newModuleData.courseId = newCourse._id;
    newModuleData.lessons = [];
    const newModule = await Module.create(newModuleData);
    moduleIdMap[origModule._id] = newModule._id;
    newCourse.modules.push(newModule._id);
  }
  await newCourse.save();

  // 4. Duplicate lessons
  const origModuleIds = origModules.map(m => m._id);
  const origLessons = await Lesson.find({ moduleId: { $in: origModuleIds }, isDeleted: { $ne: true } }).sort({ order: 1 }).lean();
  const lessonIdMap = {};

  for (const origLesson of origLessons) {
    const newLessonData = cloneDoc(origLesson);
    newLessonData.moduleId = moduleIdMap[origLesson.moduleId];
    newLessonData.section = newCourse._id; // Course reference in Lesson schema
    newLessonData.Quiz = undefined;
    newLessonData.Assignment = undefined;
    const newLesson = await Lesson.create(newLessonData);
    lessonIdMap[origLesson._id] = newLesson._id;

    // Add lesson to module
    await Module.findByIdAndUpdate(newLesson.moduleId, { $push: { lessons: newLesson._id } });
  }

  const origLessonIds = origLessons.map(l => l._id);

  // 5. Duplicate quizzes and assign to lessons
  const origQuizzes = await Quiz.find({ lesson: { $in: origLessonIds } }).lean();
  for (const origQuiz of origQuizzes) {
    const newQuizData = cloneDoc(origQuiz);
    newQuizData.course = newCourse._id;
    newQuizData.lesson = lessonIdMap[origQuiz.lesson];
    const newQuiz = await Quiz.create(newQuizData);
    await Lesson.findByIdAndUpdate(newQuiz.lesson, { Quiz: newQuiz._id });
  }

  // 6. Duplicate assignments and assign to lessons
  const origAssignments = await Assignment.find({ lessonId: { $in: origLessonIds } }).lean();
  for (const origAssignment of origAssignments) {
    const newAssignmentData = cloneDoc(origAssignment);
    newAssignmentData.courseId = newCourse._id;
    newAssignmentData.lessonId = lessonIdMap[origAssignment.lessonId];
    const newAssignment = await Assignment.create(newAssignmentData);
    await Lesson.findByIdAndUpdate(newAssignment.lessonId, { Assignment: newAssignment._id });
  }

  // 7. Duplicate video-lessons
  const origVideoLessons = await VideoLesson.find({ lessonId: { $in: origLessonIds } }).lean();
  for (const origVideo of origVideoLessons) {
    const newVideoData = cloneDoc(origVideo);
    newVideoData.lessonId = lessonIdMap[origVideo.lessonId];
    await VideoLesson.create(newVideoData);
  }

  // 8. Duplicate text-lessons
  const origTextLessons = await TextLesson.find({ lesson: { $in: origLessonIds } }).lean();
  for (const origText of origTextLessons) {
    const newTextData = cloneDoc(origText);
    newTextData.course = newCourse._id;
    newTextData.lesson = lessonIdMap[origText.lesson];
    await TextLesson.create(newTextData);
  }

  // 9. Duplicate files/attachments
  const origFiles = await File.find({ courseId: origCourse._id }).lean();
  for (const origFile of origFiles) {
    const newFileData = cloneDoc(origFile);
    newFileData.courseId = newCourse._id;
    if (origFile.lessonId && lessonIdMap[origFile.lessonId]) {
      newFileData.lessonId = lessonIdMap[origFile.lessonId];
    }
    await File.create(newFileData);
  }

  // 10. Duplicate CoursePlans (IAS membership tiers / course plans)
  const origPlans = await CoursePlan.find({ courseId: origCourse._id }).lean();
  for (const origPlan of origPlans) {
    const newPlanData = cloneDoc(origPlan);
    newPlanData.courseId = newCourse._id;
    await CoursePlan.create(newPlanData);
  }

  // 11. Duplicate CoursePricingPlans
  const origPricingPlans = await CoursePricingPlan.find({ course: origCourse._id }).lean();
  for (const origPP of origPricingPlans) {
    const newPPData = cloneDoc(origPP);
    newPPData.course = newCourse._id;
    await CoursePricingPlan.create(newPPData);
  }

  return await Course.findById(newCourse._id).populate('categoryId').populate('modules');
}

// --- Script runner section for ES modules ---
if (process.argv[1] && process.argv[1].endsWith('duplicateCourse.js')) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:yVRiwnUBI7jOh0imOgmuj12MfaqXRmEbgyhgEmaQg3KEtRQPCiWmx3jdiFHJ4GpC@37.187.138.88:9992/Lms?authSource=admin&directConnection=true';
  const COURSE_ID = process.argv[2];

  if (!COURSE_ID) {
    console.log('Usage: node duplicateCourse.js <courseId>');
    process.exit(1);
  }

  (async () => {
    try {
      await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      const newCourse = await duplicateCourse(COURSE_ID);
      console.log('Duplicated course successfully:', newCourse.title, newCourse._id);
    } catch (err) {
      console.error('Error duplicating course:', err);
    } finally {
      await mongoose.disconnect();
      process.exit();
    }
  })();
}
