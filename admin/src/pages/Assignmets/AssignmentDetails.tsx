import React, { useEffect, useState } from "react";
import {
  BookOpen,
  User,
  Calendar,
  FileText,
  Star,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Download,
  Clock,
  Award,
  Send,
  ExternalLink,
} from "lucide-react";
import axiosInstance from "../../services/axiosConfig";
import { useNavigate, useParams } from "react-router";
import { useDispatch } from "react-redux";
import { fetchAssignmentSubmissions } from "../../store/slices/assignment";

const AssignmentSubmissionReview = () => {
  const [formData, setFormData] = useState({
    scoreGiven: "",
    feedback: "",
    status: "graded",
  });

  const [loading, setLoading] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const params = useParams();
  const assignmentId = params.id;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Mock submission data - in real app, this would come from props or API

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "scoreGiven") {
      const numValue = parseFloat(value);
      const maxScore = submission?.assignmentId?.maxScore || 0;

      // Prevent values above maxScore
      if (numValue > maxScore) {
        setError(`Score cannot exceed ${maxScore} points`);
        setFormData((prev) => ({
          ...prev,
          [name]: maxScore.toString(),
        }));
        // Clear error after 3 seconds
        setTimeout(() => setError(""), 3000);
        return;
      } else {
        setError(""); // Clear error if value is valid
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validation
      if (!formData.scoreGiven) {
        throw new Error("Score is required");
      }

      const score = parseFloat(formData.scoreGiven);
      if (score < 0 || score > submission.assignmentId.maxScore) {
        throw new Error(
          `Score must be between 0 and ${submission.assignmentId.maxScore}`
        );
      }

      if (!formData.feedback.trim()) {
        throw new Error("Feedback is required");
      }

      // Simulate API call
      const response = await axiosInstance.put(
        `/assignment-submissions/${submission._id}/grade`,
        {
          scoreGiven: formData.scoreGiven,
          feedback: formData.feedback,
          status: formData.status,
        }
      );

      console.log("Submission graded:", response.data);
      setShowSuccess(true);
      dispatch(fetchAssignmentSubmissions()).unwrap();
      navigate("/assignments/submissions");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "submitted":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "graded":
        return "bg-green-100 text-green-800 border-green-200";
      case "resubmitted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getData = async () => {
    try {
      const response = await axiosInstance.get(
        `/assignment-submissions/byID/${assignmentId}`
      );
      setSubmission(response.data.data);
      setFormData({
        scoreGiven: response.data.data.scoreGiven || "",
        feedback: response.data.data.feedback || "",
        status: response.data.data.status || "graded",
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch submission data.");
    }
  };

  const handleViewAssignment = () => {
    if (submission?.assignmentId?._id) {
      // Navigate directly to the assignment page
      navigate(`/assignments/${submission.assignmentId._id}`);
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

  useEffect(() => {
    getData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/[0.03] p-4">
      <div className="max-w-5xl mx-auto">
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">
              Assignment graded successfully!
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-[#1b6294] to-[#16517a] text-white p-6 rounded-t-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Assignment Review</h1>
              <p className="text-cyan-100 text-sm">Grade & Provide Feedback</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.03] rounded-b-lg shadow-lg">
          {/* Submission Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assignment Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#1b6294]" />
                    Assignment Details
                  </h3>
                  {submission?.assignmentId?._id && (
                    <button
                      onClick={handleViewAssignment}
                      className="flex items-center gap-2 px-3 py-2 bg-[#1b6294] hover:bg-[#16517a] text-white rounded-xl shadow-xs transition-colors text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Assignment
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                      Assignment Title
                    </label>
                    <p className="text-gray-900 dark:text-white/70 font-medium">
                      {submission?.assignmentId.title}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                        Course
                      </label>
                      <p className="text-gray-900 dark:text-white/70">
                        {submission?.courseId.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-white/90">
                        {submission?.courseId.code}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                        Subject
                      </label>
                      <p className="text-gray-900 dark:text-white/70">
                        {submission?.assignmentId?.subject}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                      Lesson
                    </label>
                    <p className="text-gray-900 dark:text-white/70">
                      {submission?.lessonId?.title}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                      Max Score
                    </label>
                    <p className="text-gray-900 dark:text-white/70   font-semibold flex items-center gap-1">
                      <Award className="w-4 h-4 text-yellow-500" />
                      {submission?.assignmentId?.maxScore} points
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Student Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                      Student Name
                    </label>
                    <p className="text-gray-900 font-medium dark:text-white/70">
                      {submission?.submittedBy.fullName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                      Email
                    </label>
                    <p className="text-gray-900 dark:text-white/70">
                      {submission?.submittedBy.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                      Student ID
                    </label>
                    <p className="text-gray-900 dark:text-white/70">
                      {submission?.submittedBy._id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                      Submitted At
                    </label>
                    <p className="text-gray-900 flex items-center gap-1 dark:text-white/70">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {formatDate(submission?.submittedAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-white/90">
                      Status
                    </label>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                        submission?.status
                      )}`}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {submission?.status.charAt(0).toUpperCase() +
                        submission?.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Content */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              Student Submission
            </h3>

            {/* Submission Text */}
            {submission?.submissionText && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 dark:text-white/90 mb-2">
                  Submission Text
                </label>
                <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200   rounded-lg p-4">
                  <p className="text-gray-900 dark:text-white/70 whitespace-pre-wrap">
                    {submission?.submissionText}
                  </p>
                </div>
              </div>
            )}

            {/* Submission File */}
            {submission?.submissionFile && (
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-white/90 mb-2">
                  Submitted File
                </label>
                <div className="bg-blue-50 dark:bg-white/[0.03] border border-blue-200 rounded-lg p-4 flex sm:flex-row items-center sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">
                        {submission.submissionFile.split("/").pop() || "Submitted File"}
                      </p>
                      <p className="text-sm text-blue-600">
                        Click to download and review
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFileDownload(submission.submissionFile)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Grading Section */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              Grade Assignment
            </h3>

            <div className="space-y-6">
              {/* Score Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
                  Score (out of {submission?.assignmentId?.maxScore})*
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="scoreGiven"
                    value={formData.scoreGiven}
                    onChange={handleInputChange}
                    min="0"
                    max={submission?.assignmentId.maxScore}
                    step="0.5"
                    onInput={(e) => {
                      // Additional safety check on input
                      const value = parseFloat(e.target.value);
                      const maxScore = submission?.assignmentId?.maxScore || 0;
                      if (value > maxScore) {
                        e.target.value = maxScore;
                        setFormData(prev => ({ ...prev, scoreGiven: maxScore.toString() }));
                        setError(`Score cannot exceed ${maxScore} points`);
                        setTimeout(() => setError(""), 3000);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Allow navigation and control keys
                      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                      if (allowedKeys.includes(e.key)) {
                        return;
                      }
                      
                      // Allow decimal point and digits
                      if (e.key === '.' || /^\d$/.test(e.key)) {
                        const currentValue = e.target.value;
                        const cursorPosition = e.target.selectionStart;
                        const newValue = currentValue.slice(0, cursorPosition) + e.key + currentValue.slice(e.target.selectionEnd);
                        const numValue = parseFloat(newValue);
                        const maxScore = submission?.assignmentId?.maxScore || 0;
                        
                        if (!isNaN(numValue) && numValue > maxScore) {
                          e.preventDefault();
                          setError(`Score cannot exceed ${maxScore} points`);
                          setTimeout(() => setError(""), 3000);
                        }
                      } else {
                        // Block any other keys
                        e.preventDefault();
                      }
                    }}
                    className="w-full px-4 py-3 dark:text-white/70 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder={`Enter score (0-${submission?.assignmentId.maxScore})`}
                    disabled={loading}
                  />
                  <div className="absolute right-4 top-3 text-gray-500">
                    / {submission?.assignmentId?.maxScore}
                  </div>
                </div>
                {formData.scoreGiven &&
                  parseFloat(formData.scoreGiven) === submission?.assignmentId?.maxScore && (
                    <p className="text-sm text-green-600 mt-1">
                      Maximum score reached
                    </p>
                  )}
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
                  Feedback*
                </label>
                <textarea
                  name="feedback"
                  value={formData.feedback}
                  onChange={handleInputChange}
                  rows={6}
                  maxLength={1000}
                  className="w-full px-4 py-3 border dark:text-white/70 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  placeholder="Provide detailed feedback about the student's work, highlighting strengths and areas for improvement..."
                  disabled={loading}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500 dark:text-white/70">
                    Provide constructive feedback to help the student learn
                  </p>
                  <span className="text-sm text-gray-400">
                    {formData.feedback.length}/1000
                  </span>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border dark:text-white/70 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  disabled={loading}
                >
                  <option className="dark:text-black" value="graded">
                    Graded
                  </option>
                  <option className="dark:text-black" value="resubmitted">
                    Needs Resubmission
                  </option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`px-8 py-3 bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white rounded-xl shadow-md shadow-[#1b6294]/20 hover:shadow-lg focus:ring-2 focus:ring-[#1b6294]/30 transition-all font-medium flex items-center gap-2 cursor-pointer ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving Grade...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Grade & Feedback
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentSubmissionReview;
