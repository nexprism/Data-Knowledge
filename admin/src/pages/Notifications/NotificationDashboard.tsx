import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { sendNotification, sendCourseNotification, clearNotificationState } from "../../store/slices/notification";
import { fetchCourses } from "../../store/slices/course";
import { RootState } from "../../store";
import { toastConfig } from "../../utils/toastConfig";
import { 
  Send, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  BookOpen, 
  Bell,
  X,
  Loader2,
  Globe,
  Users,
  Target
} from "lucide-react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

const NotificationDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, success } = useSelector((state: RootState) => state.notification);
  const { data: courseData, loading: coursesLoading } = useSelector((state: RootState) => state.course);
  const token = useSelector((state: RootState) => state.auth.token);

  const [notificationType, setNotificationType] = useState<'global' | 'course'>('global');
  const [form, setForm] = useState({
    courseId: "",
    title: "",
    description: "",
    type: "",
    image: null as File | null,
    webPushLink: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [sentDetails, setSentDetails] = useState<{
    title: string;
    description: string;
    target: string;
    type: string;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchCourses({ page: 1, limit: 100000 }) as any);
    dispatch(clearNotificationState());
  }, [dispatch]);

  const handleTypeChange = (type: 'global' | 'course') => {
    setNotificationType(type);
    setForm(prev => ({ ...prev, courseId: "", type: "" }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(prev => ({ ...prev, image: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setForm(prev => ({ ...prev, image: null }));
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toastConfig.error("Authentication token missing. Please log in again.");
      return;
    }
    
    try {
      const selectedCourse = courses.find((c: any) => c._id === form.courseId);
      const targetLabel = notificationType === 'global' 
        ? 'All Platform Users (Global Broadcast)' 
        : `Course: ${selectedCourse?.title || form.courseId}`;

      if (notificationType === 'global') {
        await dispatch(sendNotification({ 
          ...form, 
          token 
        }) as any).unwrap();
      } else {
        await dispatch(sendCourseNotification({ 
          ...form, 
          token 
        }) as any).unwrap();
      }

      setSentDetails({
        title: form.title,
        description: form.description,
        target: targetLabel,
        type: form.type || (notificationType === 'global' ? 'general' : 'course_notification'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });

      setShowSuccessModal(true);
      setShowSuccess(true);
      toastConfig.success(
        notificationType === 'global' 
          ? "Global notification published successfully!" 
          : "Course notification published successfully!"
      );

      // Reset the form
      setForm({
        courseId: "",
        title: "",
        description: "",
        type: "",
        image: null,
        webPushLink: "",
      });
      setImagePreview(null);
    } catch (err: any) {
      console.error('Failed to send notification:', err);
      toastConfig.error(typeof err === 'string' ? err : (err?.message || 'Failed to send notification'));
    }
  };

  const globalNotificationTypes = [
    { value: "general", label: "General" },
    { value: "announcement", label: "Announcement" },
    { value: "system", label: "System Update" },
    { value: "promotion", label: "Promotion" },
  ];

  const courseNotificationTypes = [
    { value: "assignment_reminder", label: "Assignment Reminder" },
    { value: "course_update", label: "Course Update" },
    { value: "deadline_alert", label: "Deadline Alert" },
    { value: "announcement", label: "Announcement" },
    { value: "quiz_reminder", label: "Quiz Reminder" },
    { value: "general", label: "General" },
  ];

  const courses = courseData?.courses || [];

  return (
    <div>
      <PageMeta title="Notification Center | LMS Admin" description="Send notifications to users" />
      <PageBreadcrumb pageTitle="Notification Center" />
      
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
              <Bell className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Notification Center</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Send targeted notifications to your users</p>
        </div>

        {/* Success Alert */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">
              Notification sent successfully to {notificationType === 'global' ? 'all users' : 'course students'}!
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        <div className="max-w-5xl mx-auto">
          {/* Notification Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div 
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                notificationType === 'global' 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-200 hover:border-green-300 dark:border-gray-700'
              }`}
              onClick={() => handleTypeChange('global')}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  notificationType === 'global' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Globe className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Global Notification</h3>
                  <p className="text-gray-600 dark:text-gray-400">Send to all platform users</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Reaches everyone</span>
                  </div>
                </div>
              </div>
            </div>

            <div 
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                notificationType === 'course' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 hover:border-blue-300 dark:border-gray-700'
              }`}
              onClick={() => handleTypeChange('course')}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  notificationType === 'course' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Target className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Course Notification</h3>
                  <p className="text-gray-600 dark:text-gray-400">Send to specific course students</p>
                  <div className="flex items-center gap-2 mt-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Targeted messaging</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Form */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              {notificationType === 'global' ? (
                <Globe className="w-6 h-6 text-green-600" />
              ) : (
                <Target className="w-6 h-6 text-blue-600" />
              )}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {notificationType === 'global' ? 'Global' : 'Course'} Notification Details
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Course Selection (only for course notifications) */}
              {notificationType === 'course' && (
                <div className="bg-white dark:bg-gray-700 rounded-xl p-6">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Select Target Course *
                  </label>
                  <select
                    name="courseId"
                    value={form.courseId}
                    onChange={handleChange}
                    required
                    disabled={coursesLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-lg"
                  >
                    <option value="">
                      {coursesLoading ? "Loading courses..." : "Choose a course to notify"}
                    </option>
                    {courses.map((course: any) => (
                      <option key={course._id} value={course._id}>
                        {course.title} ({course.enrollmentCount || 0} students)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title and Type */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-700 rounded-xl p-6">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Notification Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    placeholder={notificationType === 'global' ? "e.g., System Maintenance Notice" : "e.g., Assignment Deadline Reminder"}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-lg"
                  />
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-xl p-6">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Notification Type *
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-lg"
                  >
                    <option value="">Select notification type</option>
                    {(notificationType === 'global' ? globalNotificationTypes : courseNotificationTypes).map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white dark:bg-gray-700 rounded-xl p-6">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Message Content *
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Enter your notification message here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-lg"
                />
              </div>

              {/* Web Push Link */}
              <div className="bg-white dark:bg-gray-700 rounded-xl p-6">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Action Link (Optional)
                </label>
                <input
                  type="url"
                  name="webPushLink"
                  value={form.webPushLink}
                  onChange={handleChange}
                  placeholder="https://yourlms.com/course/assignments"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-lg"
                />
                <p className="text-sm text-gray-500 mt-2">URL to redirect users when they click the notification</p>
              </div>

              {/* Image Upload */}
              <div className="bg-white dark:bg-gray-700 rounded-xl p-6">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Notification Image (Optional)
                </label>
                
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                      Drag and drop an image or click to browse
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                    >
                      <Upload className="w-5 h-5" />
                      Choose Image
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-w-md h-64 object-cover rounded-xl border mx-auto"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={loading || !form.title || !form.description || !form.type || (notificationType === 'course' && !form.courseId)}
                  className={`flex items-center gap-3 px-12 py-4 text-white rounded-xl font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                    notificationType === 'global' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Sending Notification...
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      Send {notificationType === 'global' ? 'Global' : 'Course'} Notification
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Prominent Success Popup Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                dispatch(clearNotificationState());
              }}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Content */}
            <div className="text-center pt-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 ring-8 ring-green-50 dark:ring-green-900/10">
                <CheckCircle className="w-9 h-9 text-green-600 dark:text-green-400" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Notification Sent!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Your notification has been published and saved to history.
              </p>

              {/* Notification Summary Card */}
              {sentDetails && (
                <div className="bg-gray-50 dark:bg-gray-700/40 rounded-2xl p-4 text-left border border-gray-200/70 dark:border-gray-600 mb-6 space-y-2.5">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Title</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {sentDetails.title}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Target Audience</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mt-0.5">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>{sentDetails.target}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600">
                    <span>Type: <strong className="text-gray-700 dark:text-gray-200 capitalize">{sentDetails.type.replace('_', ' ')}</strong></span>
                    <span>Sent at: {sentDetails.timestamp}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    dispatch(clearNotificationState());
                    navigate('/notification-history');
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-md shadow-indigo-600/20"
                >
                  <Bell className="w-4 h-4" />
                  View History
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    dispatch(clearNotificationState());
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-all"
                >
                  Send Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDashboard;
