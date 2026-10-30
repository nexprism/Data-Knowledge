import QuizService from '../service/quizService.js';
import NotificationService from '../service/notificationService.js'; // Import notification service

const quizService = new QuizService();

export const createQuiz = async (req, res) => {
  try {
    const quizData = { ...req.body };
    const quiz = await quizService.createQuiz(quizData);


    // Notify enrolled students
    const notificationData = {
      title: 'New Quiz Available',
      body: `A new quiz titled "${quiz.title}" has been added to your course.`,
    };
    await NotificationService.notifyEnrolledUsers(quiz.course, notificationData);

    res.status(201).json({ success: true, message: 'Quiz created', data: quiz });
  } catch (err) {
    console?.log('Error creating quiz:', err?.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllQuizzes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'asc',
      courseId,
      lessonId
    } = req.query;

    const filters = {};
    if (courseId) filters.course = courseId;
    if (lessonId) filters.lesson = lessonId;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      sortBy,
      sortOrder,
      filters
    };

    const cacheKey = `quizzes:all:${JSON.stringify(options)}`;


    const quizzes = await quizService.getAllQuizzes(options);

    res.status(200).json({ success: true, message: 'Quizzes fetched', ...quizzes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;


    const quiz = await quizService.getQuizById(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    res.status(200).json({ success: true, data: quiz });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateQuiz = async (req, res) => {
  //console.log('Updating quiz with body:', req.body);
  //console.log('Uploaded files:', req.files);

  try {
    const { quizId } = req.params;

    const quizData = {
      ...req.body,
      image: req.files?.find(f => f.fieldname === 'image')?.buffer || undefined,
    };

    const updated = await quizService.updateQuiz(quizId, quizData);


    res.status(200).json({ success: true, message: 'Quiz updated', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const deleted = await quizService.deleteQuiz(quizId);


    res.status(200).json({ success: true, message: 'Quiz deleted', data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;
    const userId = req.user._id;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Answers are required and must be an array' });
    }

    // Validate that each answer has question and selectedOption (A, B, C, D)
    for (const answer of answers) {
      if (!answer.question || !['A', 'B', 'C', 'D'].includes(answer.selectedOption)) {
        return res.status(400).json({ success: false, message: 'Each answer must have question and selectedOption (A, B, C, or D)' });
      }
    }

    const submission = await quizService.submitQuiz(quizId, userId, answers);


    res.status(201).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        submissionId: submission._id,
        score: submission.score,
        totalMarks: submission.totalMarks,
        passed: submission.passed,
        is_completed: submission.is_completed, // Include is_completed in response
        courseId: submission.courseId,
        lessonId: submission.lessonId,
        totalQuestions: submission.totalQuestions,
        totalCorrectQuestions: submission.totalCorrectQuestions,
        totalWrongQuestions: submission.totalWrongQuestions,
        percentage: submission.percentage
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const mySubmittedQuizzes = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const cacheKey = `submissions:user:${userId}:page:${page}:limit:${limit}`;


    const submissions = await quizService.getMySubmittedQuizzes(userId, options);

    res.status(200).json({ success: true, message: 'Submitted quizzes fetched', ...submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const submittedQuiz = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user._id;

    const submission = await quizService.getSubmittedQuiz(submissionId, userId);
    res.status(200).json({ success: true, message: 'Submission fetched', data: submission });
  } catch (err) {
    const status = err.message?.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

export const getAllSubmissions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'submittedAt',
      sortOrder = 'desc',
      userId,
      quizId,
      courseId,
      lessonId
    } = req.query;

    const filters = {};
    if (userId) filters.user = userId;
    if (quizId) filters.quiz = quizId;
    if (courseId) filters.courseId = courseId;
    if (lessonId) filters.lessonId = lessonId;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      filters
    };

    const cacheKey = `submissions:all:${JSON.stringify(options)}`;


    const submissions = await quizService.getAllSubmissions(options);

    res.status(200).json({ success: true, message: 'All submissions fetched', ...submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};