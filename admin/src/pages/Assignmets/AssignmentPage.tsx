import React, { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import {
  BookOpen,
  Calendar,
  Clock,
  Award,
  FileText,
  User,
  Users,
  AlertCircle,
  CheckCircle,
  Edit,
  ArrowLeft,
  Download,
  Eye,
  Loader2,
  ExternalLink,
  Target,
  Timer,
  RotateCcw,
  Globe,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAssignmentById } from "../../store/slices/assignment";

const AssignmentPage = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, data: assignmentData, error } = useSelector((state) => state.assignment);

  const [assignment, setAssignment] = useState(null);

  useEffect(() => {
    if (assignmentId) {
      dispatch(fetchAssignmentById(assignmentId));
    }
  }, [assignmentId, dispatch]);

  useEffect(() => {
    if (assignmentData?.data) {
      setAssignment(assignmentData.data);
    }
  }, [assignmentData]);

  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewCourse = () => {
    if (assignment?.courseId?._id) {
      navigate(`/courses/edit/${assignment.courseId._id}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "closed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleFileDownload = (filePath, fileName = null) => {
    if (!filePath) return;

    // Create a proper download link
    const baseUrl = (import.meta.env.VITE_BASE_URL || "https://api.dataknowledge.in").replace(/\/+$/, '');
    const fullUrl = `${baseUrl}/${filePath}`;

    // Create a temporary anchor element for download
    const link = document.createElement("a");
    link.href = fullUrl;

    // Extract filename from path if not provided
    const extractedFileName = fileName || filePath.split("/").pop() || "download";
    link.download = extractedFileName;

    // Set proper attributes to force download
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-white/[0.03] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-300">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-white/[0.03] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full mx-4">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-800 text-center mb-2">Error Loading Assignment</h2>
          <p className="text-red-600 text-center mb-4">{error}</p>
          <button
            onClick={() => navigate("/assignments/all")}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-white/[0.03] flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">Assignment Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">The assignment you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/assignments/all")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/[0.03] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/assignments/all")}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Assignment Details</h1>
                  <p className="text-purple-100">View and manage assignment</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {assignment?.courseId?._id && (
                <button
                  onClick={handleViewCourse}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Course
                </button>
              )}
              {/* <button
                onClick={() => navigate(`/assignments/edit/${assignment._id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button> */}
              <button
                onClick={() => navigate("/assignments/submissions")}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Submissions
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.03] rounded-b-lg shadow-lg">
          {/* Assignment Info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assignment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  Assignment Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                      Title
                    </label>
                    <p className="text-gray-900 dark:text-white/70 font-medium text-lg">
                      {assignment.title}
                    </p>
                  </div>
                  {assignment.subject && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                        Subject
                      </label>
                      <p className="text-gray-900 dark:text-white/70">
                        {assignment.subject}
                      </p>
                    </div>
                  )}
                  {assignment.language && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                        Language
                      </label>
                      <p className="text-gray-900 dark:text-white/70 flex items-center gap-1">
                        <Globe className="w-4 h-4 text-gray-500" />
                        {assignment.language}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                        Total Marks
                      </label>
                      <p className="text-gray-900 dark:text-white/70 font-semibold flex items-center gap-1">
                        <Award className="w-4 h-4 text-yellow-500" />
                        {assignment.maxScore} points
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                        Passing Marks
                      </label>
                      <p className="text-gray-900 dark:text-white/70 font-semibold flex items-center gap-1">
                        <Target className="w-4 h-4 text-green-500" />
                        {assignment.score} points
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                        Duration
                      </label>
                      <p className="text-gray-900 dark:text-white/70 flex items-center gap-1">
                        <Timer className="w-4 h-4 text-blue-500" />
                        {assignment.duration} minutes
                      </p>
                    </div>
                    {/* <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                        Max Attempts
                      </label>
                      <p className="text-gray-900 dark:text-white/70 flex items-center gap-1">
                        <RotateCcw className="w-4 h-4 text-orange-500" />
                        {assignment.maxAttempts} attempts
                      </p>
                    </div> */}
                  </div>
                </div>
              </div>

              {/* Course & Lesson Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Course & Lesson
                </h3>
                <div className="space-y-3">
                  {assignment.courseId && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                        Course
                      </label>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-900 dark:text-white/70">
                          {assignment.courseId.title}
                        </p>
                        <button
                          onClick={handleViewCourse}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </button>
                      </div>
                    </div>
                  )}
                  {assignment.lessonId && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                        Lesson
                      </label>
                      <p className="text-gray-900 dark:text-white/70">
                        {assignment.lessonId.title}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                      Created Date
                    </label>
                    <p className="text-gray-900 dark:text-white/70 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      {formatDate(assignment.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Description */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Assignment Description
            </h3>
            {assignment.description ? (
              <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div
                  className="text-gray-900 dark:text-white/70 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(assignment.description) }}
                />
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <p className="text-gray-500 dark:text-white/50 italic">
                  No description provided for this assignment.
                </p>
              </div>
            )}
          </div>

          {/* Assignment Files */}
          {(assignment.documentFile || assignment.attachmentFile) && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-orange-600" />
                Assignment Files
              </h3>
              <div className="space-y-3">
                {assignment.documentFile && (
                  <div className="bg-blue-50 dark:bg-white/[0.03] border border-blue-200 dark:border-blue-600 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-300">
                            Assignment Document
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            {assignment.documentFile.split("/").pop()} • Download assignment materials
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFileDownload(assignment.documentFile)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                )}
                {assignment.attachmentFile && (
                  <div className="bg-green-50 dark:bg-white/[0.03] border border-green-200 dark:border-green-600 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-300">
                            Additional Attachment
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            {assignment.attachmentFile.split("/").pop()} • Download additional materials
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFileDownload(assignment.attachmentFile)}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assignment Statistics Summary */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Assignment Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-300">Total Marks</p>
                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                      {assignment.maxScore}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-300">Passing Marks</p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                      {assignment.score}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                    <Timer className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Duration</p>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                      {assignment.duration}m
                    </p>
                  </div>
                </div>
              </div>

            </div>
            <div className="mt-6 flex gap-3">
              {assignment?.courseId?._id && (
                <button
                  onClick={handleViewCourse}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Course
                </button>
              )}
              <button
                onClick={() => navigate("/assignments/submissions")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View All Submissions
              </button>
              {/* <button
                onClick={() => navigate(`/assignments/edit/${assignment._id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Assignment
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentPage;
