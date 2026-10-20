import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks/redux";
import {
  fetchAssignmentSubmissions,
  deleteAssignmentSubmission,
} from "../../store/slices/assignment";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import toast from "react-hot-toast";
import {
  Search,
  Eye,
  Trash2,
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  Clock,
  BookOpen,
  User,
  X,
  ExternalLink,
  Award,
} from "lucide-react";

interface SubmissionUser {
  _id?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
}

interface SubmissionAssignment {
  _id: string;
  title: string;
  maxScore?: number;
  score?: number;
}

interface SubmissionCourse {
  _id: string;
  title: string;
}

interface SubmissionLesson {
  _id: string;
  title: string;
}

interface AssignmentSubmissionItem {
  _id: string;
  submittedBy?: SubmissionUser | null;
  assignmentId?: SubmissionAssignment | null;
  courseId?: SubmissionCourse | null;
  lessonId?: SubmissionLesson | null;
  status: "submitted" | "graded" | "resubmitted" | "pending" | string;
  scoreGiven?: number | null;
  submissionText?: string;
  submissionFile?: string;
  feedback?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DeleteSubmissionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submission: AssignmentSubmissionItem | null;
  isDeleting: boolean;
}> = ({ isOpen, onClose, onConfirm, submission, isDeleting }) => {
  if (!isOpen || !submission) return null;

  const studentName = submission.submittedBy?.fullName || submission.submittedBy?.email || "Student";
  const assignmentTitle = submission.assignmentId?.title || "Assignment";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Delete Submission
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <p>
              Are you sure you want to delete the submission from{" "}
              <strong className="text-gray-900 dark:text-white">{studentName}</strong>{" "}
              for assignment{" "}
              <strong className="text-gray-900 dark:text-white">"{assignmentTitle}"</strong>?
            </p>
            <p className="text-xs text-red-500 font-medium">
              This action cannot be undone and will erase grading records.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Submission
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AssignmentSubmissions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Check if filtering by assignment from location state
  const targetAssignmentId = location.state?.assignmentId || "";
  const targetAssignmentTitle = location.state?.assignmentTitle || "";

  const [submissions, setSubmissions] = useState<AssignmentSubmissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAssignmentFilter, setActiveAssignmentFilter] = useState<string>(targetAssignmentId);
  const [filterAssignmentTitle, setFilterAssignmentTitle] = useState<string>(targetAssignmentTitle);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<AssignmentSubmissionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 450);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchInput]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const res = await dispatch(fetchAssignmentSubmissions(params)).unwrap();

      let items: AssignmentSubmissionItem[] = [];
      let totalCount = 0;
      let totalPagesCount = 1;

      if (res?.data?.submissions && Array.isArray(res.data.submissions)) {
        items = res.data.submissions;
        totalCount = res.data.pagination?.total ?? items.length;
        totalPagesCount = res.data.pagination?.totalPages ?? Math.ceil(totalCount / pagination.limit) ?? 1;
      } else if (res?.submissions && Array.isArray(res.submissions)) {
        items = res.submissions;
        totalCount = res.pagination?.total ?? items.length;
        totalPagesCount = res.pagination?.totalPages ?? Math.ceil(totalCount / pagination.limit) ?? 1;
      } else if (Array.isArray(res?.data)) {
        items = res.data;
        totalCount = items.length;
        totalPagesCount = Math.ceil(totalCount / pagination.limit) || 1;
      } else if (Array.isArray(res)) {
        items = res;
        totalCount = items.length;
        totalPagesCount = Math.ceil(totalCount / pagination.limit) || 1;
      }

      // Filter by assignment if active assignment filter is present
      if (activeAssignmentFilter) {
        items = items.filter((sub) => {
          const subAssignId = typeof sub.assignmentId === "object" ? sub.assignmentId?._id : sub.assignmentId;
          return String(subAssignId) === String(activeAssignmentFilter);
        });
        totalCount = items.length;
        totalPagesCount = Math.ceil(totalCount / pagination.limit) || 1;
      }

      setSubmissions(items);
      setPagination((prev) => ({
        ...prev,
        total: totalCount,
        totalPages: totalPagesCount || 1,
      }));
    } catch (err: any) {
      console.error("Failed to load assignment submissions:", err);
      const msg = typeof err === "object" && err?.message ? err.message : String(err || "Failed to load submissions");
      setError(msg);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
    const now = new Date().toISOString();
    localStorage.setItem("admin_assignments_last_viewed_at", now);
    window.dispatchEvent(new Event("assignments:viewed"));
  }, [pagination.page, debouncedSearch, statusFilter, activeAssignmentFilter]);

  const handleClearAssignmentFilter = () => {
    setActiveAssignmentFilter("");
    setFilterAssignmentTitle("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("all");
    handleClearAssignmentFilter();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.page && !loading) {
      setPagination((prev) => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!submissionToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteAssignmentSubmission(submissionToDelete._id)).unwrap();
      toast.success("Submission deleted successfully");
      setDeleteModalOpen(false);
      setSubmissionToDelete(null);
      loadSubmissions();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete submission");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "graded":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200";
      case "submitted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200";
      case "resubmitted":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200";
      case "pending":
      default:
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200";
    }
  };

  return (
    <div>
      <PageMeta
        title="Assignment Submissions | LMS Admin"
        description="Review student assignment submissions and grading"
      />
      <PageBreadcrumb pageTitle="Assignment Submissions" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-8 xl:py-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-[#1b6294]" />
              Assignment Submissions
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Review, grade, and manage student submissions across all courses.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold">
              Total Submissions: {pagination.total}
            </span>
            <button
              onClick={() => navigate("/assignments/all")}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-all"
            >
              Manage Assignments
            </button>
          </div>
        </div>

        {/* Active Assignment Filter Banner */}
        {activeAssignmentFilter && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-900 dark:text-blue-200">
                Filtering submissions for:{" "}
                <strong className="font-semibold">
                  {filterAssignmentTitle || `Assignment ID: ${activeAssignmentFilter}`}
                </strong>
              </p>
            </div>
            <button
              onClick={handleClearAssignmentFilter}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Clear Assignment Filter
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl mb-6 shadow-xs">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by student name, email, assignment, or course..."
                className="pl-10 pr-4 py-2.5 w-full text-sm border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#1b6294] dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-3.5 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#1b6294] dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
                <option value="resubmitted">Resubmitted</option>
                <option value="pending">Pending</option>
              </select>

              <button
                onClick={handleResetFilters}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-800 dark:text-red-300 text-sm">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Course & Lesson
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Submitted Date
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="w-8 h-8 border-3 border-indigo-200 border-t-[#1b6294] rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading submissions...</p>
                    </td>
                  </tr>
                ) : submissions.length > 0 ? (
                  submissions.map((sub, idx) => {
                    const studentName = sub.submittedBy?.fullName || "Student";
                    const studentEmail = sub.submittedBy?.email || "No email";
                    const assignTitle = sub.assignmentId?.title || "Assignment";
                    const courseTitle = sub.courseId?.title || "General Course";
                    const lessonTitle = sub.lessonId?.title || "No specific lesson";
                    const maxScore = sub.assignmentId?.maxScore ?? 100;
                    const dateFormatted = formatDate(sub.submittedAt || sub.createdAt);

                    return (
                      <tr
                        key={sub._id}
                        className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {(pagination.page - 1) * pagination.limit + idx + 1}
                        </td>

                        {/* Student */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#1b6294]/10 dark:bg-[#1b6294]/20 text-[#1b6294] dark:text-blue-300 font-bold flex items-center justify-center text-sm shrink-0">
                              {studentName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {studentName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {studentEmail}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Assignment */}
                        <td className="px-5 py-4">
                          <div className="max-w-xs">
                            <p
                              className="text-sm font-medium text-gray-900 dark:text-white truncate"
                              title={assignTitle}
                            >
                              {assignTitle}
                            </p>
                            {sub.assignmentId?._id && (
                              <button
                                onClick={() => navigate(`/assignments/${sub.assignmentId?._id}`)}
                                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 mt-0.5"
                              >
                                View Assignment <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Course & Lesson */}
                        <td className="px-5 py-4">
                          <div className="max-w-xs space-y-0.5">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate" title={courseTitle}>
                              {courseTitle}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={lessonTitle}>
                              {sub.lessonId?.title ? (
                                `Lesson: ${lessonTitle}`
                              ) : (
                                <span className="italic text-gray-400">Lesson not linked</span>
                              )}
                            </p>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {dateFormatted}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border capitalize ${getStatusBadge(
                              sub.status
                            )}`}
                          >
                            {sub.status || "submitted"}
                          </span>
                        </td>

                        {/* Grade */}
                        <td className="px-5 py-4 text-sm font-semibold">
                          {sub.scoreGiven !== null && sub.scoreGiven !== undefined ? (
                            <span className="text-green-600 dark:text-green-400">
                              {sub.scoreGiven} / {maxScore}
                            </span>
                          ) : (
                            <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                              Not graded
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/assignments/submissions/${sub._id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1b6294] hover:bg-[#16517a] text-white rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
                            title="Review & Grade Submission"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </button>
                          <button
                            onClick={() => {
                              setSubmissionToDelete(sub);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                            title="Delete Submission"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                        No Submissions Found
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                        {debouncedSearch
                          ? "No submissions match your search query. Try another keyword or reset filters."
                          : activeAssignmentFilter
                          ? "There are no student submissions yet for this specific assignment."
                          : "No student assignment submissions are available in the system yet."}
                      </p>
                      {(debouncedSearch || statusFilter !== "all" || activeAssignmentFilter) && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors"
                        >
                          Clear Filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && submissions.length > 0 && pagination.totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50/60 dark:bg-gray-800/40 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total submissions)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pg) => {
                  if (
                    pg === 1 ||
                    pg === pagination.totalPages ||
                    (pg >= pagination.page - 1 && pg <= pagination.page + 1)
                  ) {
                    return (
                      <button
                        key={pg}
                        onClick={() => handlePageChange(pg)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                          pagination.page === pg
                            ? "bg-[#1b6294] text-white"
                            : "border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {pg}
                      </button>
                    );
                  }
                  if (pg === pagination.page - 2 || pg === pagination.page + 2) {
                    return (
                      <span key={pg} className="px-1 text-xs text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteSubmissionModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSubmissionToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        submission={submissionToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default AssignmentSubmissions;
