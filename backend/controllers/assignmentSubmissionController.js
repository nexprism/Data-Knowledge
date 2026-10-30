
import AssignmentSubmissionService from "../service/assignmentSubmissionService.js";
import Assignment from "../models/Assignment.js";
import CourseEnrollment from "../models/CourseEnrollment.js";

const service = new AssignmentSubmissionService();

export const getMyAssignmentArchive = async (req, res) => {
  try {
    const enrollments = await CourseEnrollment.find({
      userId: req.user._id,
      status: "active",
      isWithdrawn: false,
    }).select("courseId");
    const courseIds = enrollments.map(({ courseId }) => courseId);
    const [assignments, submissions] = await Promise.all([
      Assignment.find({ courseId: { $in: courseIds } })
        .populate("courseId", "title")
        .populate("lessonId", "title")
        .sort({ createdAt: -1 }),
      service.getMySubmissions(req.user._id),
    ]);
    const submittedByAssignment = new Map(
      submissions.map((submission) => [submission.assignmentId?._id?.toString(), submission])
    );
    const archive = assignments.map((assignment) => {
      const submission = submittedByAssignment.get(assignment._id.toString());
      return submission || {
        _id: `pending-${assignment._id}`,
        assignmentId: assignment,
        courseId: assignment.courseId,
        lessonId: assignment.lessonId,
        status: "pending",
        scoreGiven: null,
        submittedAt: null,
      };
    });

    res.status(200).json({ success: true, data: archive });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const submissionFile = req.file?.path?.replace(/\\/g, "/");
    const payload = {
      ...req.body,
      submittedBy: req.user._id,
      submissionFile,
    };

    const submission = await service.submit(payload); // Fixed: Call submit on service instance


    res.status(201).json({
      success: true,
      message: "Assignment submitted successfully",
      data: submission,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMySubmissions = async (req, res) => {
  try {
    const submissions = await service.getMySubmissions(req.user._id);

    res.status(200).json({
      success: true,
      message: "Submissions fetched successfully",
      data: submissions,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMySubmissionByAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const submission = await service.getSubmission(req.user._id, assignmentId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found for this user and assignment",
      });
    }

    res.status(200).json({
      success: true,
      message: "Submission fetched successfully",
      data: submission,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllSubmissionsForAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const cacheKey = `submissions:assignment:${assignmentId}`;


    const submissions = await service.getAllByAssignment(assignmentId);

    res.status(200).json({
      success: true,
      message: "Submissions fetched successfully",
      data: submissions,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const gradeSubmission = async (req, res) => {
  try {
    const updated = await service.gradeSubmission(req.params.id, req.body);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }


    res.status(200).json({
      success: true,
      message: "Submission graded successfully",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteSubmission = async (req, res) => {
  try {
    const deleted = await service.deleteSubmission(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }


    res.status(200).json({
      success: true,
      message: "Submission deleted successfully",
      data: deleted,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllSubmissions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    const status = req.query.status;
    const is_complete = req.query.is_complete;

    const { submissions, total } = await service.getAllSubmissions({
      skip,
      limit,
      search,
      filters: { status, is_complete },
    });

    const response = {
      submissions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    res.status(200).json({
      success: true,
      message: "All submissions fetched successfully",
      data: response,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `submission:${id}`;


    const submission = await service.findById(id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Submission fetched successfully",
      data: submission,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
