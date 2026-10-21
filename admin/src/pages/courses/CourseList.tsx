import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { fetchCourses, fetchCourseEnrollments, deleteCourse, duplicateCourse } from "../../store/slices/course";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PopupAlert from "../../components/popUpAlert";
import PageMeta from "../../components/common/PageMeta";
import {
  Pencil,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Users,
  Eye,
  Star,
  Calendar,
  DollarSign,
  BookOpen,
  TrendingUp,
  Clock,
  User,
  Plus,
  MoreHorizontal,
  Edit3,
  Trash2,
  Award,
  Copy,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { deleteEnrollment } from "../../store/slices/students";

interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  categoryId: {
    _id: string;
    name: string;
    slug: string;
    status: string;
  };
  subCategoryId?: {
    _id: string;
    name: string;
    slug: string;
  };
  price: { $numberDecimal: string };
  currency: string;
  duration: number;
  instructorId: {
    _id: string;
    fullName: string;
    email: string;
    profilePicture: string;
  };
  isPublished: boolean;
  publishDate?: string;
  startDate?: string;
  coursePosition?: number;
  createdAt: string;
  salesCount: number;
  totalViews: number;
  averageRating: number;
  isDeleted: boolean;
}

const VITE_IMAGE_URL = import.meta.env.VITE_BASE_URL;

const CourseList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error, data } = useAppSelector((state) => state.course);
  const [removingEnrollmentId, setRemovingEnrollmentId] = useState<string | null>(null);

  // State for search, filter, pagination
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // State for enrollments modal
  const [enrollmentsModal, setEnrollmentsModal] = useState({ 
    open: false, 
    enrollments: [], 
    courseTitle: "" 
  });
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [deletingCourse, setDeletingCourse] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState<{
    open: boolean;
    course: Course | null;
    title: string;
    startDate: string;
    publishOption: 'immediate' | 'schedule' | 'draft';
    publishDate: string;
  }>({
    open: false,
    course: null,
    title: '',
    startDate: '',
    publishOption: 'immediate',
    publishDate: '',
  });
  const [duplicating, setDuplicating] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [imageError, setImageError] = useState<{ isVisible: boolean; url?: string }>(
    { isVisible: false }
  );
  const [testPopup, setTestPopup] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchCourses({ page, limit }));
    }, 500);
    return () => clearTimeout(timer);
  }, [dispatch, page, limit, searchInput, statusFilter]);

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchCourses({ page, limit }));
  }, [dispatch, page, limit]);

  // Extract courses from the correct data structure
  const courses: Course[] = Array.isArray(data?.courses) ? data.courses : [];

  const pagination = {
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 10,
    totalPages: data?.totalPages || 1,
  };

  // Delete course handler
  const handleConfirmDeleteCourse = async (courseId: string) => {
    setDeletingCourse(true);
    try {
      await dispatch(deleteCourse({ id: courseId }) as any).unwrap();
      // refresh list (ensure current page state preserved)
      await dispatch(fetchCourses({ page, limit }) as any);
      setDeleteConfirm(null);
    } catch (e: any) {
      // basic error feedback
      const msg = e?.message || 'Failed to delete course';
      window.alert(msg);
    } finally {
      setDeletingCourse(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setStatusFilter("");
    setPage(1);
    setLimit(10);
  };

  const filteredCourses = courses?.filter((course) => {
    const matchesSearch =
      !searchInput ||
      course.title.toLowerCase().includes(searchInput.toLowerCase());
    const isScheduled = Boolean(course.publishDate && new Date(course.publishDate) > new Date());
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "published" && course.isPublished && !isScheduled) ||
      (statusFilter === "scheduled" && isScheduled) ||
      (statusFilter === "draft" && !course.isPublished && !isScheduled);
    return matchesSearch && matchesStatus;
  });

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

  const handleShowEnrollments = async (course: Course) => {
    setEnrollmentsLoading(true);
    try {
      const result = await dispatch(fetchCourseEnrollments({ courseId: course._id }) as any);
      setEnrollmentsModal({
        open: true,
        enrollments: result.payload || [],
        courseTitle: course.title,
      });
    } catch {
      setEnrollmentsModal({
        open: true,
        enrollments: [],
        courseTitle: course.title,
      });
    }
    setEnrollmentsLoading(false);
  };

  // Remove enrollment handler
  const handleRemoveEnrollment = async (enrollmentId: string) => {
    setRemovingEnrollmentId(enrollmentId);
    try {
      await dispatch(deleteEnrollment({ enrollmentId }) as any).unwrap();
      setEnrollmentsModal((prev) => ({
        ...prev,
        enrollments: prev.enrollments.filter((enr: any) => enr._id !== enrollmentId),
      }));
    } catch (e) {
      // Optionally show error toast
    } finally {
      setRemovingEnrollmentId(null);
      setConfirmRemove(null);
    }
  };

  // debug: log deleteConfirm changes
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('deleteConfirm state changed', deleteConfirm);
  }, [deleteConfirm]);

  // Open Duplicate Modal for Starting a New Batch
  const handleOpenDuplicateModal = (course: Course) => {
    const baseTitle = course.title
      .replace(/\s*-\s*Batch\s*\d+/gi, '')
      .replace(/\s*\(Copy\s*\d*\)/gi, '')
      .trim();

    setDuplicateModal({
      open: true,
      course,
      title: `${baseTitle} - Next Batch`,
      startDate: new Date().toISOString().slice(0, 10),
      publishOption: 'immediate',
      publishDate: '',
    });
  };

  // Submit Duplicate Course / Start New Batch
  const handleConfirmDuplicate = async () => {
    if (!duplicateModal.course) return;
    if (!duplicateModal.title.trim()) {
      window.alert("Please provide a title for the new course batch.");
      return;
    }

    if (duplicateModal.publishOption === 'schedule' && !duplicateModal.publishDate) {
      window.alert("Please select a scheduled publish date and time.");
      return;
    }

    setDuplicating(true);
    try {
      const payload: any = {
        courseId: duplicateModal.course._id,
        title: duplicateModal.title.trim(),
        startDate: duplicateModal.startDate || undefined,
      };

      if (duplicateModal.publishOption === 'immediate') {
        payload.isPublished = true;
        payload.publishDate = null;
      } else if (duplicateModal.publishOption === 'draft') {
        payload.isPublished = false;
        payload.publishDate = null;
      } else if (duplicateModal.publishOption === 'schedule') {
        payload.publishDate = duplicateModal.publishDate;
        payload.isPublished = false;
      }

      await dispatch(duplicateCourse(payload) as any).unwrap();
      await dispatch(fetchCourses({ page, limit }) as any);
      setSuccessNotice(`New batch "${duplicateModal.title}" created successfully!`);
      setDuplicateModal({
        open: false,
        course: null,
        title: '',
        startDate: '',
        publishOption: 'immediate',
        publishDate: '',
      });
    } catch (e: any) {
      window.alert(e?.message || 'Failed to start new batch / copy course');
    } finally {
      setDuplicating(false);
    }
  };

  const StatusBadge = ({ isPublished, publishDate }: { isPublished: boolean; publishDate?: string }) => {
    const isScheduled = Boolean(publishDate && new Date(publishDate) > new Date());

    if (isScheduled) {
      const formattedDate = new Date(publishDate!).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
      return (
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
          title={`Scheduled to publish on ${new Date(publishDate!).toLocaleString()}`}
        >
          <Calendar className="w-3 h-3 text-purple-600 dark:text-purple-400" />
          Scheduled ({formattedDate})
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
        isPublished 
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' 
          : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
      }`}>
        {isPublished ? (
          <>
            <CheckCircle className="w-3 h-3" />
            Published
          </>
        ) : (
          <>
            <Clock className="w-3 h-3" />
            Draft
          </>
        )}
      </span>
    );
  };

  const CourseCard = ({ course, index }: { course: Course; index: number }) => (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300">
      <div className="relative">
        <img
          src={VITE_IMAGE_URL + "/" + course.thumbnail}
          alt={course.title}
          className="w-full h-48 object-cover rounded-t-xl"
          onError={(e) => {
              const src = e.currentTarget.src;
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://tse2.mm.bing.net/th/id/OIP.z2HmY-oQPSmmDwR-MYmW6QAAAA?pid=Api&P=0&h=180";
              setImageError({ isVisible: true, url: src });
            }}
        />
        <div className="absolute top-3 left-3">
          <StatusBadge isPublished={course.isPublished} publishDate={course.publishDate} />
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-semibold text-gray-800">
            {course.currency} {course.price?.$numberDecimal}
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
            {course.title}
          </h3>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <BookOpen className="w-4 h-4" />
            <span>{course.categoryId?.name}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <User className="w-4 h-4" />
            <span>{course.instructorId?.fullName}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{course.totalViews || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>{course.averageRating || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{course.salesCount || 0}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(course.createdAt).toLocaleDateString()}
          </span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShowEnrollments(course);
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="View Enrollments"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDuplicateModal(course);
              }}
              className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
              title="Copy Course / Start New Batch"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(`/courses/edit/${course._id}`)}
              className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              title="Edit Course"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // debug: log click and id
                // eslint-disable-next-line no-console
                console.log('CourseCard delete clicked', course._id);
                setDeleteConfirm({ id: course._id, title: course.title });
                // fallback: if PopupAlert doesn't mount quickly, use native confirm
                setTimeout(() => {
                  const dialog = document.querySelector('[role="dialog"]');
                  if (!dialog) {
                    // eslint-disable-next-line no-console
                    console.log('PopupAlert not mounted — falling back to window.confirm');
                    if (window.confirm(`Delete course "${course.title}"? This cannot be undone.`)) {
                      handleConfirmDeleteCourse(course._id);
                    } else {
                      setDeleteConfirm(null);
                    }
                  }
                }, 120);
              }}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete Course"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <PageMeta
        title="Course List | LMS Admin"
        description="List of all courses"
      />
      <PageBreadcrumb pageTitle="Course List" />
      
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-6 py-8 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Courses
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and organize your course catalog
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <BookOpen className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {pagination.total} courses
              </span>
            </div>
            
            <button
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white rounded-xl transition-all duration-200 shadow-md shadow-[#1b6294]/25 hover:shadow-lg hover:shadow-[#1b6294]/35 font-medium active:scale-95 cursor-pointer"
              onClick={() => navigate("/courses/add")}
            >
              <Plus className="w-5 h-5" />
              Add Course
            </button>
            <button
              onClick={() => setTestPopup(true)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50"
            >
              Test popup
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search courses by title..."
                className="pl-10 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-900 dark:text-white min-w-[140px]"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            
            {/* Items per page */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show:</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white min-w-[80px]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
                title="Table View"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
                title="Grid View"
              >
                <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                  <div className="bg-currentColor rounded-sm"></div>
                  <div className="bg-currentColor rounded-sm"></div>
                  <div className="bg-currentColor rounded-sm"></div>
                  <div className="bg-currentColor rounded-sm"></div>
                </div>
              </button>
            </div>
            
            {/* Reset */}
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <span className="text-gray-600 dark:text-gray-400 font-medium">Loading courses...</span>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            {viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCourses.map((course, idx) => (
                  <CourseCard key={course._id} course={course} index={idx} />
                ))}
                {filteredCourses.length === 0 && (
                  <div className="col-span-full text-center py-16">
                    <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses found</h3>
                    <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
                  </div>
                )}
              </div>
            ) : (
              /* Table View */
              <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">
                          #
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">
                          Course
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">
                          Category
                        </th>
                       
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">
                          Price
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">  
                          Course Number
                        </th>
                       
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">
                          Created
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredCourses.map((course, idx) => (
                        <tr
                          key={course._id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/courses/edit/${course._id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {(pagination.page - 1) * pagination.limit + idx + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                              <img
                                src={VITE_IMAGE_URL + "/" + course.thumbnail}
                                alt={course.title}
                                className="w-16 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                onError={(e) => {
                                  const src = e.currentTarget.src;
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = "https://tse2.mm.bing.net/th/id/OIP.z2HmY-oQPSmmDwR-MYmW6QAAAA?pid=Api&P=0&h=180";
                                  setImageError({ isVisible: true, url: src });
                                }}
                              />
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 max-w-xs">
                                  {course.title}
                                </h3>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              {course.categoryId?.name}
                            </span>
                          </td>
                         
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {course.currency} {course.price?.$numberDecimal}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {course.coursePosition}
                          </td>
                         
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge isPublished={course.isPublished} publishDate={course.publishDate} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(course.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShowEnrollments(course);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="View Enrollments"
                              >
                                <Users className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDuplicateModal(course);
                                }}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                title="Copy Course / Start New Batch"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/courses/edit/${course._id}`);
                                }}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                title="Edit Course"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // debug: log click and id
                                  // eslint-disable-next-line no-console
                                  console.log('Table delete clicked', course._id);
                                  setDeleteConfirm({ id: course._id, title: course.title });
                                  setTimeout(() => {
                                    const dialog = document.querySelector('[role="dialog"]');
                                    if (!dialog) {
                                      // eslint-disable-next-line no-console
                                      console.log('PopupAlert not mounted — falling back to window.confirm');
                                      if (window.confirm(`Delete course "${course.title}"? This cannot be undone.`)) {
                                        handleConfirmDeleteCourse(course._id);
                                      } else {
                                        setDeleteConfirm(null);
                                      }
                                    }
                                  }, 120);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete Course"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredCourses.length === 0 && (
                        <tr>
                          <td colSpan={9} className="text-center py-16">
                            <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses found</h3>
                            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {filteredCourses.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {generatePageNumbers().map((pageNum, idx) =>
                    typeof pageNum === "number" ? (
                      <button
                        key={idx}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          pagination.page === pageNum
                            ? "bg-indigo-600 text-white shadow-lg"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ) : (
                      <span key={idx} className="px-2 text-gray-400 dark:text-gray-500">
                        {pageNum}
                      </span>
                    )
                  )}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Enhanced Enrollments Modal */}
      {enrollmentsModal.open && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Course Enrollments
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  "{enrollmentsModal.courseTitle}"
                </p>
              </div>
              <button
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={() => setEnrollmentsModal({ open: false, enrollments: [], courseTitle: "" })}
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {enrollmentsLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Loading enrollments...</span>
                  </div>
                </div>
              ) : enrollmentsModal.enrollments.length > 0 ? (
                <>
                  {/* Enrollments Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {enrollmentsModal.enrollments.length}
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">Total Enrollments</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-600 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                            {enrollmentsModal.enrollments.filter(e => e.status === 'active').length}
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400">Active</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-600 rounded-lg">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                            {enrollmentsModal.enrollments.filter(e => e.status === 'pending').length}
                          </p>
                          <p className="text-sm text-orange-600 dark:text-orange-400">Pending</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#1b6294] rounded-lg">
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-950 dark:text-blue-100">
                            {enrollmentsModal.enrollments.filter(e => e.status === 'completed').length}
                          </p>
                          <p className="text-sm text-[#1b6294] dark:text-blue-300">Completed</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enrollments Table */}
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto max-h-96">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">
                              #
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">
                              Student
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">
                              Email
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">
                              Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">
                              Enrolled Date
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">
                              Expires
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">
                              Source
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {enrollmentsModal.enrollments.map((enroll, idx) => (
                            <tr key={enroll._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                {idx + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-[#1b6294] to-[#16517a] rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-semibold">
                                      {enroll.userId?.fullName ? enroll.userId.fullName.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                  </div>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {enroll.userId?.fullName || 'Unknown User'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {enroll.userId?.email || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  enroll.status === 'active' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : enroll.status === 'completed'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                    : enroll.status === 'pending'
                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                  {enroll.status || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {enroll.enrolledAt ? new Date(enroll.enrolledAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) : "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {enroll.accessExpiry ? new Date(enroll.accessExpiry).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) : "Lifetime"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                  {enroll.enrollmentSource || "Razorpay"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200 transition-colors"
                                  onClick={() => setConfirmRemove({ id: enroll._id, name: enroll.userId?.fullName || enroll.userId?.email || "this user" })}
                                  disabled={removingEnrollmentId === enroll._id}
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Remove Enrollment
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No enrollments found</h3>
                  <p className="text-gray-500 dark:text-gray-400">This course doesn't have any enrollments yet.</p>
                </div>
              )}
            </div>
          </div>
          {/* Remove Enrollment Confirmation Popup */}
          {confirmRemove && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Remove Course Access
                </h3>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to remove access for <span className="font-semibold">{confirmRemove.name}</span>?<br />
                  <span className="text-xs text-gray-500">This action cannot be undone.</span>
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                    onClick={() => setConfirmRemove(null)}
                    disabled={!!removingEnrollmentId}
                  >
                    Cancel
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 flex items-center ${removingEnrollmentId ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => handleRemoveEnrollment(confirmRemove.id)}
                    disabled={!!removingEnrollmentId}
                  >
                    {removingEnrollmentId ? (
                      <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Yes, Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Start New Batch / Copy Course Modal */}
      {duplicateModal.open && duplicateModal.course && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-auto border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Start New Batch
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Duplicate course content, structure & plans for a new cohort
                  </p>
                </div>
              </div>
              <button
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={() => setDuplicateModal({ open: false, course: null, title: '', startDate: '', publishOption: 'immediate', publishDate: '' })}
                disabled={duplicating}
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Source Course Info */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                {duplicateModal.course.thumbnail && (
                  <img
                    src={`${VITE_IMAGE_URL}/${duplicateModal.course.thumbnail}`}
                    alt=""
                    className="w-12 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://tse2.mm.bing.net/th/id/OIP.z2HmY-oQPSmmDwR-MYmW6QAAAA?pid=Api&P=0&h=180";
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Source Course
                  </span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {duplicateModal.course.title}
                  </p>
                </div>
              </div>

              {/* Batch / New Course Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                  New Batch / Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={duplicateModal.title}
                  onChange={(e) => setDuplicateModal({ ...duplicateModal, title: e.target.value })}
                  placeholder="e.g. Master Python - Batch 2"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  disabled={duplicating}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  All modules, lessons, videos, quizzes, and assignments will be copied to this new batch.
                </p>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                  Batch Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={duplicateModal.startDate}
                  onChange={(e) => setDuplicateModal({ ...duplicateModal, startDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  disabled={duplicating}
                />
              </div>

              {/* Publishing Schedule Options */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Publishing & Visibility
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="publishOption"
                      value="immediate"
                      checked={duplicateModal.publishOption === 'immediate'}
                      onChange={() => setDuplicateModal({ ...duplicateModal, publishOption: 'immediate', publishDate: '' })}
                      className="text-emerald-600 focus:ring-emerald-500"
                      disabled={duplicating}
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white block">
                        Publish Immediately
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Course will be live and accessible to students right away
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="publishOption"
                      value="schedule"
                      checked={duplicateModal.publishOption === 'schedule'}
                      onChange={() => setDuplicateModal({ ...duplicateModal, publishOption: 'schedule' })}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      disabled={duplicating}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white block">
                        Schedule Automatic Publish Date & Time
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
                        Course automatically becomes public only when the selected date and time arrives
                      </span>

                      {duplicateModal.publishOption === 'schedule' && (
                        <div className="mt-2 space-y-2">
                          <input
                            type="datetime-local"
                            value={duplicateModal.publishDate}
                            onChange={(e) => setDuplicateModal({ ...duplicateModal, publishDate: e.target.value })}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-emerald-300 dark:border-emerald-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                            disabled={duplicating}
                            min={new Date().toISOString().slice(0, 16)}
                          />
                          <p className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg">
                            🕒 Will stay unpublished until this exact moment, then automatically switch to public.
                          </p>
                        </div>
                      )}
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="publishOption"
                      value="draft"
                      checked={duplicateModal.publishOption === 'draft'}
                      onChange={() => setDuplicateModal({ ...duplicateModal, publishOption: 'draft', publishDate: '' })}
                      className="text-emerald-600 focus:ring-emerald-500"
                      disabled={duplicating}
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white block">
                        Save as Draft
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Keep hidden until you manually publish it later
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
                onClick={() => setDuplicateModal({ open: false, course: null, title: '', startDate: '', publishOption: 'immediate', publishDate: '' })}
                disabled={duplicating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                onClick={handleConfirmDuplicate}
                disabled={duplicating}
              >
                {duplicating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Creating Batch...
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Start Batch
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Course Confirmation Popup */}
      <PopupAlert
        isVisible={!!deleteConfirm}
        type="error"
        message={`Are you sure you want to permanently delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleConfirmDeleteCourse(deleteConfirm.id)}
        confirmLabel={deletingCourse ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
      />

      {/* Success Notification Popup */}
      <PopupAlert
        isVisible={!!successNotice}
        type="success"
        message={successNotice || ""}
        onClose={() => setSuccessNotice(null)}
      />

      <PopupAlert
        isVisible={imageError.isVisible}
        type="error"
        message={`Failed to load image: ${imageError.url || "unknown"}. This may be because the file is missing or blocked by cross-origin policy.`}
        onClose={() => setImageError({ isVisible: false })}
      />

      <PopupAlert
        isVisible={testPopup}
        type="info"
        message="This is a test popup. The popup component is working correctly."
        onClose={() => setTestPopup(false)}
      />
    </div>
  );
};

export default CourseList;