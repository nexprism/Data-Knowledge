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
  ArrowLeft,
  Loader2,
} from "lucide-react";
import axiosInstance from "../../services/axiosConfig";
import { useNavigate, useParams } from "react-router";
import { useDispatch } from "react-redux";
import { fetchAssignmentSubmissions } from "../../store/slices/assignment";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

const AssignmentSubmissionReview = () => {
  const [formData, setFormData] = useState({
    scoreGiven: "",
    feedback: "",
    status: "graded",
  });

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [submission, setSubmission] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const params = useParams();
  const assignmentId = params.id;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "scoreGiven") {
      const numValue = parseFloat(value);
      const maxScore = submission?.assignmentId?.maxScore ?? 100;

      if (numValue > maxScore) {
        setError(`Score cannot exceed ${maxScore} points`);
        setFormData((prev) => ({
          ...prev,
          [name]: maxScore.toString(),
        }));
        setTimeout(() => setError(""), 3000);
        return;
      } else {
        setError("");
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission) return;
    setLoading(true);
    setError("");

    try {
      if (formData.scoreGiven === "" || formData.scoreGiven === undefined) {
        throw new Error("Score is required");
      }

      const score = parseFloat(formData.scoreGiven);
      const maxScore = submission?.assignmentId?.maxScore ?? 100;
      if (isNaN(score) || score < 0 || score > maxScore) {
        throw new Error(`Score must be between 0 and ${maxScore}`);
      }

      if (!formData.feedback.trim()) {
        throw new Error("Feedback is required");
      }

      await axiosInstance.put(
        `/assignment-submissions/${submission._id}/grade`,
        {
          scoreGiven: score,
          feedback: formData.feedback.trim(),
          status: formData.status,
        }
      );

      setShowSuccess(true);
      try {
        dispatch(fetchAssignmentSubmissions() as any);
      } catch (e) {
        // Ignore background refresh errors
      }
      setTimeout(() => {
        navigate("/assignments/submissions");
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to submit grade");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No date recorded";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Invalid date";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "submitted":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "graded":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400";
      case "resubmitted":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getData = async () => {
    if (!assignmentId) {
      setDataLoading(false);
      setError("No submission ID provided.");
      return;
    }
    try {
      setDataLoading(true);
      setError("");
      const response = await axiosInstance.get(
        `/assignment-submissions/byID/${assignmentId}`
      );
      const sub = response.data?.data || null;
      setSubmission(sub);
      if (sub) {
        setFormData({
          scoreGiven: sub.scoreGiven !== null && sub.scoreGiven !== undefined ? String(sub.scoreGiven) : "",
          feedback: sub.feedback || "",
          status: sub.status === "resubmitted" ? "resubmitted" : "graded",
        });
      }
    } catch (err: any) {
      console.error("Error fetching submission data:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to fetch submission data.");
      setSubmission(null);
    } finally {
      setDataLoading(false);
    }
  };

  const handleViewAssignment = () => {
    if (submission?.assignmentId?._id) {
      navigate(`/assignments/${submission.assignmentId._id}`);
    }
  };

  const handleFileDownload = (filePath: string, fileName: string | null = null) => {
    if (!filePath) return;
    const baseUrl = (import.meta.env.VITE_BASE_URL || "https://api.dataknowledge.in").replace(/\/+$/, '');
    const fullUrl = filePath.startsWith('http') ? filePath : `${baseUrl}/${filePath.replace(/^\/+/, '')}`;
    const link = document.createElement("a");
    link.href = fullUrl;
    link.download = fileName || filePath.split("/").pop() || "download";
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    getData();
  }, [assignmentId]);

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-[#1b6294] animate-spin mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Loading submission review...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-8 text-center space-y-4 border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submission Not Found</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {error || "The submission you are looking for does not exist or may have been deleted."}
          </p>
          <button
            onClick={() => navigate("/assignments/submissions")}
            className="w-full py-2.5 bg-[#1b6294] hover:bg-[#16517a] text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            Back to Submissions
          </button>
        </div>
      </div>
    );
  }

  const assignmentTitle = submission.assignmentId?.title || "Untitled Assignment";
  const studentName = submission.submittedBy?.fullName || "Student";
  const studentEmail = submission.submittedBy?.email || "No email available";
  const courseTitle = submission.courseId?.title || "General Course";
  const lessonTitle = submission.lessonId?.title || "No linked lesson";
  const maxScore = submission.assignmentId?.maxScore ?? 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/[0.03] p-4 lg:p-8">
      <PageMeta
        title={`Review - ${studentName} | LMS Admin`}
        description="Review and grade student assignment submission"
      />
      <PageBreadcrumb pageTitle="Submission Review" />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/assignments/submissions")}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Submissions
          </button>

          {submission.assignmentId?._id && (
            <button
              onClick={handleViewAssignment}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[#1b6294] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              View Assignment Spec
            </button>
          )}
        </div>

        {showSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-green-800 dark:text-green-200 font-medium text-sm">
              Assignment graded successfully! Redirecting to submissions list...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-red-800 dark:text-red-200 font-medium text-sm">{error}</p>
          </div>
        )}

        {/* Card Container */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Card Header Banner */}
          <div className="bg-gradient-to-r from-[#1b6294] to-[#16517a] text-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Assignment Review</h1>
                  <p className="text-blue-100 text-sm mt-0.5">
                    Evaluate work submitted by <strong className="text-white">{studentName}</strong>
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  submission.status === "graded"
                    ? "bg-green-500 text-white"
                    : "bg-amber-400 text-slate-900"
                }`}
              >
                {submission.status || "Submitted"}
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Assignment Information */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#1b6294]" />
                  Assignment Information
                </h3>
                <div className="bg-gray-50/70 dark:bg-gray-800/40 rounded-xl p-4 space-y-3 text-sm">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</label>
                    <p className="font-semibold text-gray-900 dark:text-white">{assignmentTitle}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Course</label>
                      <p className="text-gray-800 dark:text-gray-200 font-medium">{courseTitle}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lesson</label>
                      <p className="text-gray-800 dark:text-gray-200 font-medium">{lessonTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Marks</span>
                    <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                      <Award className="w-4 h-4 text-amber-500" />
                      {maxScore} points
                    </span>
                  </div>
                </div>
              </div>

              {/* Student Information */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Student Information
                </h3>
                <div className="bg-gray-50/70 dark:bg-gray-800/40 rounded-xl p-4 space-y-3 text-sm">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                    <p className="font-semibold text-gray-900 dark:text-white">{studentName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</label>
                    <p className="text-gray-800 dark:text-gray-200">{studentEmail}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Submission Date</span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {formatDate(submission.submittedAt || submission.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Text & Attached File */}
          <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800 space-y-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Student's Submitted Work
            </h3>

            {submission.submissionText ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Written Answer</label>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {submission.submissionText}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No written response attached.</p>
            )}

            {submission.submissionFile && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Attached File</label>
                <div className="p-4 bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-6 h-6 text-blue-600 shrink-0" />
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 truncate">
                      {submission.submissionFile.split("/").pop() || "submission_attachment"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFileDownload(submission.submissionFile)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1b6294] hover:bg-[#16517a] text-white rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Grading Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Grade & Feedback
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Score Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Score Given (Max: {maxScore} points) *
                </label>
                <input
                  type="number"
                  name="scoreGiven"
                  value={formData.scoreGiven}
                  onChange={handleInputChange}
                  min="0"
                  max={maxScore}
                  step="0.5"
                  required
                  placeholder={`Enter score 0 - ${maxScore}`}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#1b6294] dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Review Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#1b6294] dark:bg-gray-800 dark:text-white"
                >
                  <option value="graded">Graded (Pass / Evaluated)</option>
                  <option value="resubmitted">Needs Resubmission</option>
                  <option value="submitted">Under Review</option>
                </select>
              </div>
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Instructor Feedback *
              </label>
              <textarea
                name="feedback"
                value={formData.feedback}
                onChange={handleInputChange}
                rows={5}
                required
                placeholder="Write constructive evaluation notes, highlights, and improvements for the student..."
                className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#1b6294] dark:bg-gray-800 dark:text-white resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => navigate("/assignments/submissions")}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1b6294] hover:bg-[#16517a] text-white rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Evaluation...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Save & Submit Evaluation
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignmentSubmissionReview;
