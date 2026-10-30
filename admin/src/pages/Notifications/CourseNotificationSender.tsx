import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendCourseNotification, clearNotificationState } from "../../store/slices/notification";
import { fetchCourses } from "../../store/slices/course";
import { RootState } from "../../store";
import { 
  Send, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  BookOpen, 
  Bell,
  X,
  Loader2
} from "lucide-react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

const CourseNotificationSender: React.FC = () => {
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state: RootState) => state.notification);
  const { data: courseData, loading: coursesLoading } = useSelector((state: RootState) => state.course);
  const token = useSelector((state: RootState) => state.auth.token);

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

  const [courseSearch, setCourseSearch] = useState("");

  useEffect(() => {
    dispatch(clearNotificationState());
  }, [dispatch]);

  useEffect(() => {
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
  }, [dispatch, courseSearch]);

  useEffect(() => {
    if (success) {
      setShowSuccess(true);
      // Reset form
      setForm({
        courseId: "",
        title: "",
        description: "",
        type: "",
        image: null,
        webPushLink: "",
      });
      setImagePreview(null);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        dispatch(clearNotificationState());
      }, 3000);
    }
  }, [success, dispatch]);

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
      
      // Create preview
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
    if (!token) return;
    
    try {
      await dispatch(sendCourseNotification({ 
        ...form, 
        token 
      }) as any).unwrap();
    } catch (err) {
      // Error is handled by the slice
      console.error('Failed to send notification:', err);
    }
  };

  const notificationTypes = [
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
      <PageMeta title="Course Notifications | LMS Admin" description="Send notifications to course students" />
      <PageBreadcrumb pageTitle="Course Notifications" />
      
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Bell className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Course Notifications</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Send targeted notifications to students enrolled in specific courses</p>
          </div>
        </div>

        {/* Success Alert */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">Notification sent successfully to all course students!</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        <div className="max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Selection */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                <BookOpen className="w-4 h-4 inline mr-2" />
                Select Course *
              </label>
              <input
                type="text"
                placeholder="Search courses by title..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <select
                name="courseId"
                value={form.courseId}
                onChange={handleChange}
                required
                disabled={coursesLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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

            {/* Notification Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Notification Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Assignment Deadline Reminder"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Notification Type *
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select notification type</option>
                  {notificationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Message Description *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Enter your notification message here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Web Push Link */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Action Link (Optional)
              </label>
              <input
                type="url"
                name="webPushLink"
                value={form.webPushLink}
                onChange={handleChange}
                placeholder="https://yourlms.com/course/assignments"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-sm text-gray-500 mt-1">URL to redirect users when they click the notification</p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Notification Image (Optional)
              </label>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Click to upload or drag and drop an image
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full opacity-0 absolute inset-0 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Choose Image
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-w-md h-48 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={loading || !form.courseId || !form.title || !form.description || !form.type}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Notification...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Notification
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

export default CourseNotificationSender;
