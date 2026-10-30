import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchNotifications, setFilters, clearFilters } from "../../store/slices/notification";
import { fetchCourses } from "../../store/slices/course";
import { RootState } from "../../store";
import { 
  Bell, 
  Filter, 
  Search, 
  RefreshCw, 
  Eye, 
  Calendar, 
  User, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Send,
  Users
} from "lucide-react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

const NotificationList: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    notifications, 
    loading, 
    error, 
    pagination, 
    filters 
  } = useSelector((state: RootState) => state.notification);
  const { data: courseData, loading: coursesLoading } = useSelector((state: RootState) => state.course);
  const token = useSelector((state: RootState) => state.auth.token);

  const [localFilters, setLocalFilters] = useState({
    status: '',
    courseId: '',
    userId: '',
    type: '',
    search: '',
  });
  const [courseSearch, setCourseSearch] = useState("");

  console.log("Notifications from Redux:", notifications);
  console.log("Pagination from Redux:", pagination);

  useEffect(() => {
    if (token) {
      // Fetch initial data
      dispatch(fetchNotifications({ 
        page: pagination.page, 
        limit: pagination.limit, 
        token,
        ...filters 
      }) as any);
    }
  }, [dispatch, token, pagination.page, pagination.limit, filters]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      dispatch(
        fetchCourses({
          page: 1,
          limit: 20,
          search: courseSearch.trim() || undefined,
        }) as any
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [dispatch, token, courseSearch]);

  const handleFilterChange = (key: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const activeFilters: any = {};
    if (localFilters.status) activeFilters.status = parseInt(localFilters.status);
    if (localFilters.courseId) activeFilters.courseId = localFilters.courseId;
    if (localFilters.userId) activeFilters.userId = localFilters.userId;
    if (localFilters.type) activeFilters.type = localFilters.type;

    dispatch(setFilters(activeFilters));
    dispatch(fetchNotifications({ 
      page: 1, 
      limit: pagination.limit, 
      token,
      ...activeFilters 
    }) as any);
  };

  const clearAllFilters = () => {
    setLocalFilters({
      status: '',
      courseId: '',
      userId: '',
      type: '',
      search: '',
    });
    dispatch(clearFilters());
    dispatch(fetchNotifications({ page: 1, limit: pagination.limit, token }) as any);
  };

  const handlePageChange = (newPage: number) => {
    dispatch(fetchNotifications({ 
      page: newPage, 
      limit: pagination.limit, 
      token,
      ...filters 
    }) as any);
  };

  const handleLimitChange = (newLimit: number) => {
    dispatch(fetchNotifications({ 
      page: 1, 
      limit: newLimit, 
      token,
      ...filters 
    }) as any);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: number) => {
    switch(status) {
      case 0:
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Unread</span>;
      case 1:
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Read</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'global': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'course_notification': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'assignment_reminder': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'system': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'announcement': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'general': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      'promotion': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'course_update': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
      'deadline_alert': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      'quiz_reminder': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    };
    
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
        {type?.replace('_', ' ')?.toUpperCase() || 'GENERAL'}
      </span>
    );
  };

  // Filter notifications by search
  const filteredNotifications = Array.isArray(notifications) ? notifications.filter(notification =>
    notification.title?.toLowerCase().includes(localFilters.search.toLowerCase()) ||
    notification.description?.toLowerCase().includes(localFilters.search.toLowerCase()) ||
    notification.data?.title?.toLowerCase().includes(localFilters.search.toLowerCase()) ||
    notification.data?.description?.toLowerCase().includes(localFilters.search.toLowerCase())
  ) : [];

  const courses = courseData?.courses || [];

  const notificationTypes = [
    { value: 'general', label: 'General' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'global', label: 'Global' },
    { value: 'course_notification', label: 'Course Notification' },
    { value: 'assignment_reminder', label: 'Assignment Reminder' },
    { value: 'course_update', label: 'Course Update' },
    { value: 'deadline_alert', label: 'Deadline Alert' },
    { value: 'system', label: 'System Update' },
    { value: 'promotion', label: 'Promotion' },
    { value: 'quiz_reminder', label: 'Quiz Reminder' },
  ];

  return (
    <div>
      <PageMeta title="Notification List | LMS Admin" description="View all sent notifications" />
      <PageBreadcrumb pageTitle="Notification List" />
      
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-950/50 rounded-xl">
              <Bell className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notification History</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage all sent notifications</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              Total: {pagination.total} notifications
            </span>
            <Link
              to="/send-notification"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              Send Notification
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div className="xl:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={localFilters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search notifications..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={localFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="0">Unread</option>
                <option value="1">Read</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={localFilters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Types</option>
                {notificationTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Course */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Course
              </label>
              <input
                type="text"
                placeholder="Search courses..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <select
                value={localFilters.courseId}
                onChange={(e) => handleFilterChange('courseId', e.target.value)}
                disabled={coursesLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Courses</option>
                {courses.map((course: any) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex gap-3">
            <button
              onClick={applyFilters}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Apply Filters
            </button>
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <RotateCcw className="w-4 h-4" />
              Clear All
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
              <select
                value={pagination.limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Notifications Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent Date
                    </th>
                   
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {filteredNotifications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No notifications found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredNotifications.map((notification: any) => (
                      <tr key={notification._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <Bell className="w-5 h-5 text-gray-400 mt-1" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.data?.title || notification.title || 'No Title'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {(notification.data?.description || notification.description || 'No description')?.substring(0, 100)}
                                {(notification.data?.description || notification.description || '')?.length > 100 && '...'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTypeBadge(notification.data?.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(notification.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            {notification.user_id ? (
                              <>
                                <User className="w-4 h-4 mr-1.5 text-gray-400" />
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                  {notification.user_id?.fullName || notification.user_id?.name || notification.user_id?.email || 'Student'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Users className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                  {notification.data?.courseTitle ? `Course: ${notification.data.courseTitle}` : 'All Users (Global)'}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(notification.created_at)}
                          </div>
                        </td>
                        
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredNotifications.length > 0 && (
              <div className="bg-white dark:bg-gray-900 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationList;
