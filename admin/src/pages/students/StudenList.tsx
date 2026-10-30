import React, { useEffect, useState } from "react";
import {
  fetchAllStudents,
  setSearchQuery,
  setFilters,
  resetFilters,
  deleteStudent,
  banStudent,
  unbanStudent,
  logoutAllSessions,
} from "../../store/slices/students";
import {
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  AlertTriangle,
  Eye,
  Award,
  Ban,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PopupAlert from "../../components/popUpAlert";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { Link, useNavigate } from "react-router-dom";
import EnrollStudentPopup from "../../components/students/EnrollStudentPopup";
import CreateStudentPopup from "../../components/students/CreateStudentPopup";
import BulkUploadPopup from "../../components/students/BulkUploadPopup";

interface Student {
  _id: string;
  name: string;
  fullName: string;
  email: string;
  status: string;
  isActive: boolean;
  profilePicture?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

// Delete Confirmation Modal Component
const DeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  student: Student | null;
  isDeleting: boolean;
}> = ({ isOpen, onClose, onConfirm, student, isDeleting }) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-transparent backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex sm:flex-row items-center sm:items-center justify-between gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Student
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete the student{" "}
              <strong className="text-gray-900 dark:text-white">
                "{student.fullName || student.name}"
              </strong>
              ?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { students, loading, error, pagination, searchQuery, filters } =
    useAppSelector((state) => state.students);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createPopupOpen, setCreatePopupOpen] = useState(false);
  const [enrollPopupOpen, setEnrollPopupOpen] = useState(false);
  const [bulkUploadPopupOpen, setBulkUploadPopupOpen] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [studentToBan, setStudentToBan] = useState<Student | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banType, setBanType] = useState<"ban" | "shadowBan">("ban");
  const [banLoading, setBanLoading] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [studentToLogout, setStudentToLogout] = useState<Student | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [localFilters, setLocalFilters] =
    useState<Record<string, any>>(filters);

  const [popup, setPopup] = useState<{
    message: string;
    type: "success" | "error";
    isVisible: boolean;
  }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        dispatch(setSearchQuery(searchInput));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, dispatch]);

  // Fetch students
  useEffect(() => {
    // Build filters object for API query
    const activeFilters: Record<string, any> = {};

    // Set isActive based on status filter
    if (localFilters.status === "active") {
      activeFilters.isActive = true;
    } else if (localFilters.status === "inactive") {
      activeFilters.isActive = false;
    }

    // If isActive is explicitly set (true/false), override with it
    if (typeof localFilters.isActive === "boolean") {
      activeFilters.isActive = localFilters.isActive;
    }

    dispatch(
      fetchAllStudents({
        page: pagination.page,
        limit: pagination.limit,
        filters: activeFilters,
        searchFields: searchQuery ? { search: searchQuery } : {},
        sort: { createdAt: "desc" },
      })
    );
  }, [dispatch, pagination.page, pagination.limit, searchQuery, localFilters]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      dispatch(
        fetchAllStudents({
          page: newPage,
          limit: pagination.limit,
          filters: {
            ...(localFilters.status ? { status: localFilters.status } : {}),
          },
          searchFields: searchQuery
            ? { name: searchQuery, email: searchQuery }
            : {},
          sort: { createdAt: "desc" },
        })
      );
    }
  };

  const handleLimitChange = (newLimit: number) => {
    dispatch(
      fetchAllStudents({
        page: 1,
        limit: newLimit,
        filters: {
          isDeleted: false,
          ...(localFilters.status ? { status: localFilters.status } : {}),
        },
        searchFields: searchQuery
          ? { name: searchQuery, email: searchQuery }
          : {},
        sort: { createdAt: "desc" },
      })
    );
  };

  const handleFilterChange = (key: string, value: string) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    dispatch(setFilters(updated));
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setLocalFilters({});
    dispatch(resetFilters());
  };

  const openDeleteModal = (student: Student) => {
    setStudentToDelete(student);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setStudentToDelete(null);
    setDeleteModalOpen(false);
    setIsDeleting(false);
  };

  const handleDeleteConfirm = async () => {
    if (studentToDelete) {
      setIsDeleting(true);
      try {
        // Dispatch the delete action
        await dispatch(deleteStudent(studentToDelete._id)).unwrap();

        setPopup({
          message: `Student "${
            studentToDelete.fullName || studentToDelete.name
          }" deleted successfully`,
          type: "success",
          isVisible: true,
        });

        // Close modal and reset state
        closeDeleteModal();

        // Refresh the students list
        const activeFilters = {
          isDeleted: false,
          ...(localFilters.status ? { status: localFilters.status } : {}),
        };

        dispatch(
          fetchAllStudents({
            page: pagination.page,
            limit: pagination.limit,
            filters: activeFilters,
            searchFields: searchQuery
              ? { name: searchQuery, email: searchQuery }
              : {},
            sort: { createdAt: "desc" },
          })
        );
      } catch (error) {
        console.error("Failed to delete student:", error);
        setPopup({
          message: "Failed to delete student. Please try again.",
          type: "error",
          isVisible: true,
        });
        setIsDeleting(false);
      }
    }
  };

  // Ban/Unban handlers
  const openBanModal = (student: Student) => {
    setStudentToBan(student);
    setBanModalOpen(true);
    setBanReason("");
    setBanType("ban");
  };
  const closeBanModal = () => {
    setStudentToBan(null);
    setBanModalOpen(false);
    setBanReason("");
    setBanType("ban");
    setBanLoading(false);
  };
  const handleBanConfirm = async () => {
    if (!studentToBan) return;
    setBanLoading(true);
    try {
      await dispatch(
        banStudent({
          userId: studentToBan._id,
          banType,
          banReason: banReason || "No reason provided",
        })
      ).unwrap();
      setPopup({
        message: `Student "${
          studentToBan.fullName || studentToBan.name
        }" banned successfully`,
        type: "success",
        isVisible: true,
      });
      closeBanModal();
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setPopup({
        message: "Failed to ban student. Please try again.",
        type: "error",
        isVisible: true,
      });
      setBanLoading(false);
    }
  };
  const handleUnban = async (student: Student) => {
    setBanLoading(true);
    try {
      await dispatch(unbanStudent({ userId: student._id })).unwrap();
      setPopup({
        message: `Student "${
          student.fullName || student.name
        }" unbanned successfully`,
        type: "success",
        isVisible: true,
      });
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setPopup({
        message: "Failed to unban student. Please try again.",
        type: "error",
        isVisible: true,
      });
    } finally {
      setBanLoading(false);
    }
  };

  // Logout handlers
  const openLogoutModal = (student: Student) => {
    setStudentToLogout(student);
    setLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    setStudentToLogout(null);
    setLogoutModalOpen(false);
    setLogoutLoading(false);
  };

  const handleLogoutConfirm = async () => {
    if (!studentToLogout) return;
    setLogoutLoading(true);
    try {
      await dispatch(
        logoutAllSessions({ userId: studentToLogout._id })
      ).unwrap();
      setPopup({
        message: `All sessions for "${
          studentToLogout.fullName || studentToLogout.name
        }" have been logged out`,
        type: "success",
        isVisible: true,
      });
      closeLogoutModal();
    } catch (error) {
      setPopup({
        message: "Failed to logout all sessions. Please try again.",
        type: "error",
        isVisible: true,
      });
      setLogoutLoading(false);
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    const totalPages = pagination.totalPages;
    const current = pagination.page;
    const maxPages = 5;

    const start = Math.max(1, current - Math.floor(maxPages / 2));
    const end = Math.min(totalPages, start + maxPages - 1);

    if (start > 1) pages.push(1, "...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push("...", totalPages);

    return pages;
  };

  return (
    <div>
      <PageMeta
        title="Student List | IAS"
        description="List of all students in IAS"
      />
      <PageBreadcrumb pageTitle="Student List" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Students
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm dark:text-gray-400">
              Total: {pagination.total}
            </span>
            {/* Add Student Button */}
            <button
              onClick={() => setCreatePopupOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-md shadow transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              + Add Student
            </button>
            {/* Enroll Student Button */}
            <button
              onClick={() => setEnrollPopupOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-md shadow transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              + Enroll Student
            </button>

            <button
              onClick={() => setBulkUploadPopupOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2 rounded-md shadow transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              Bulk Upload
            </button>

            {/* Delete Student Button */}
            <button
              onClick={() => navigate("/students/delete-requests")}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-md shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Delete Student
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white shadow p-4 rounded-md mb-6 dark:bg-gray-900">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            {/* <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={localFilters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div> */}

            {/* Limit */}
            <div className="flex items-center gap-2">
              <span className="text-sm dark:text-gray-300">Show:</span>
              <select
                value={pagination.limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-x-auto dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Ban Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-900 dark:divide-gray-800">
              {students.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => {
                  if (!student) return null; // Defensive: skip undefined/null student
                  return (
                    <tr
                      key={student._id || idx}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/students/${student._id}`)
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {(pagination.page - 1) * pagination.limit + idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={
                            student?.profilePicture || student?.image
                              ? `${import.meta.env.VITE_IMAGE_URL}/${
                                  student?.profilePicture || student?.image
                                }`
                              : `https://placehold.co/40x40?text=${(
                                  student?.fullName ||
                                  student?.name ||
                                  "S"
                                )?.charAt(0)}`
                          }
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://static.vecteezy.com/system/resources/previews/026/619/142/original/default-avatar-profile-icon-of-social-media-user-photo-image-vector.jpg";
                          }}
                          alt={student?.fullName || student?.name || "Student"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {student?.fullName || student?.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {student?.email || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {student?.isActive ? (
                          <span className="inline-flex items-center">
                            <CheckCircle className="text-green-500 h-5 w-5" />
                            <span className="ml-2 text-green-700 dark:text-green-400">
                              Active
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center">
                            <XCircle className="text-red-500 h-5 w-5" />
                            <span className="ml-2 text-red-700 dark:text-red-400">
                              Inactive
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {student?.createdAt
                          ? new Date(student.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {student.isBanned == true ? (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-700 font-medium">
                            Banned
                            {/* {student.banReason && (
                              <span className="ml-2 text-xs text-red-500">({student.banReason})</span>
                            )} */}
                          </span>
                        ) : student.isShadowBanned == true ? (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-100 text-yellow-700 font-medium">
                            Shadow Banned
                            {/* {student.banReason && (
                              <span className="ml-2 text-xs text-yellow-600">({student.banReason})</span>
                            )} */}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-700 font-medium">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                `/certificates/issue?user=${student._id}`,
                                "_blank"
                              );
                            }}
                            className="text-green-500 hover:text-green-700 transition-colors p-1"
                          >
                            <Award className="h-5 w-5" />
                          </button>

                          {/* Logout All Sessions Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openLogoutModal(student);
                            }}
                            className="text-orange-500 hover:text-orange-700 transition-colors p-1"
                            title="Logout All Sessions"
                            disabled={logoutLoading}
                          >
                            <LogOut className="h-5 w-5" />
                          </button>

                          {/* Ban/Unban Button */}
                          {student.isBanned == true ||
                          student.isShadowBanned == true ? (
                            <button
                              className="text-yellow-600 hover:text-yellow-800 transition-colors p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnban(student);
                              }}
                              disabled={banLoading}
                              title="Unban Student"
                            >
                              <ShieldCheck className="h-5 w-5" />
                            </button>
                          ) : (
                            <button
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                openBanModal(student);
                              }}
                              disabled={banLoading}
                              title="Ban/Shadow Ban Student"
                            >
                              <Ban className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex sm:flex-row items-center sm:items-center justify-between gap-4 mt-6">
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {generatePageNumbers().map((page, idx) =>
                typeof page === "number" ? (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      pagination.page === page
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                ) : (
                  <span
                    key={idx}
                    className="px-2 text-gray-400 dark:text-gray-500"
                  >
                    {page}
                  </span>
                )
              )}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <PopupAlert
        message={popup.message}
        type={popup.type}
        isVisible={popup.isVisible}
        onClose={() => setPopup({ ...popup, isVisible: false })}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        student={studentToDelete}
        isDeleting={isDeleting}
      />

      {/* Create Student Popup */}
      <CreateStudentPopup
        open={createPopupOpen}
        onClose={() => setCreatePopupOpen(false)}
      />

      {/* Enroll Student Popup */}
      <EnrollStudentPopup
        open={enrollPopupOpen}
        onClose={() => setEnrollPopupOpen(false)}
      />

      <BulkUploadPopup
        open={bulkUploadPopupOpen}
        onClose={() => setBulkUploadPopupOpen(false)}
      />

      {/* Ban Modal */}
      {banModalOpen && studentToBan && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ban Student
            </h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to ban{" "}
              <span className="font-semibold">
                {studentToBan.fullName || studentToBan.name}
              </span>
              ?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ban Type
              </label>
              <select
                value={banType}
                onChange={(e) =>
                  setBanType(e.target.value as "ban" | "shadowBan")
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="ban">Ban</option>
                <option value="shadowBan">Shadow Ban</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>
              <input
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter reason (optional)"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={closeBanModal}
                disabled={banLoading}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 flex items-center ${
                  banLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleBanConfirm}
                disabled={banLoading}
              >
                {banLoading ? (
                  <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  <Ban className="w-4 h-4 mr-2" />
                )}
                Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {logoutModalOpen && studentToLogout && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                <LogOut className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Logout All Sessions
              </h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to log out all sessions for{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {studentToLogout.fullName || studentToLogout.name}
              </span>
              ?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will force the student to log in again on all devices.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                onClick={closeLogoutModal}
                disabled={logoutLoading}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 transition-colors flex items-center ${
                  logoutLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleLogoutConfirm}
                disabled={logoutLoading}
              >
                {logoutLoading ? (
                  <>
                    <div className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout All Sessions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
