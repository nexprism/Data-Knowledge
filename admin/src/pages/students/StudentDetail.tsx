import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router";
import {
  fetchStudentById,
  disableDripForUser,
  banStudent,
  unbanStudent,
  disableDripForModule,
  deleteEnrollment,
  updateAccessExpiry,
} from "../../store/slices/students";
import { fetchCourseById } from "../../store/slices/course";
import {
  User,
  Mail,
  Calendar,
  BookOpen,
  Award,
  CheckCircle,
  XCircle,
  Phone,
  Edit,
  Settings,
  FileText,
  GraduationCap,
  Star,
  Clock,
  MapPin,
  Activity,
  TrendingUp,
  Download,
  Eye,
  Plus,
  ArrowRight,
  Users,
  Target,
  Bookmark,
  Ban,
  ShieldCheck,
  Building2,
  Save,
  X,
  MessageCircle,
  Briefcase,
  LogIn,
} from "lucide-react";
import EnrollStudentPopup from "../../components/students/EnrollStudentPopup";
import StudentAnalyticsTab from "./StudentAnalyticsTab";
import { getStudentForumPosts, getStudentForumReplies, getStudentJobPosts } from "../../services/studentActivityService";
import axiosInstance from "../../services/axiosConfig";
import { downloadCertificateByUserAndCourse } from "../../utils/certificateDownload";

const ImageUrl = import.meta.env.VITE_IMAGE_URL;

function StudentDetail() {
  const params = useParams();
  const dispatch = useDispatch();
  const { studentId } = params;

  type StudentData = {
    _id: string;
    fullName: string;
    name?: string;
    role: string;
    createdAt: string;
    isActive: boolean;
    emailVerified: boolean;
    mobileVerified: boolean;
    email: string;
    phone?: string;
    enrollments: any[];
    isBanned?: string | boolean;
    isShadowBanned?: string | boolean;
    status?: string;
    banReason?: string;
    bio?: string;
    skills?: string[] | string;
    qualifications?: string[] | string;
    education?: Array<{
      degree?: string;
      institution?: string;
      startDate?: string;
      endDate?: string;
    }>;
    documentation?: Array<{
      name?: string;
      Doc?: string;
    }>;
    company?: {
      name?: string;
      gstNumber?: string;
    };
    lastLogin?: string;
    last_login?: string;
    lastLoginAt?: string;
    // Add any other fields you use from 'data'
  };

  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollPopupOpen, setEnrollPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Add local state to track disabling drip
  const [dripLoading, setDripLoading] = useState<string | null>(null);

  // Add state for confirmation popup
  const [confirmDrip, setConfirmDrip] = useState<{
    courseId: string;
    courseTitle: string;
  } | null>(null);

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error";
  } | null>(null);

  // Ban/Unban modal state
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banType, setBanType] = useState<"ban" | "shadowBan">("ban");
  const [banLoading, setBanLoading] = useState(false);

  // Module drip disable state
  const [moduleDripPopup, setModuleDripPopup] = useState<{
    courseId: string;
    courseTitle: string;
  } | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [courseModules, setCourseModules] = useState<any[]>([]);
  const [moduleDripLoading, setModuleDripLoading] = useState(false);

  // Enrollment removal state
  const [removingEnrollmentId, setRemovingEnrollmentId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; title: string } | null>(null);

  // Access Expiry Edit state
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<string | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState<string>("");
  const [updatingExpiry, setUpdatingExpiry] = useState(false);

  // Student activity state
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [forumReplies, setForumReplies] = useState<any[]>([]);
  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    // Auto-hide toast after 2.5s
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dispatch(fetchStudentById(studentId));
        setData(response.payload);
      } catch (error) {
        console.error("Error fetching student details:", error);
        setError("Failed to load student details");
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchData();
    }
  }, [studentId, dispatch]);

  // Fetch student activity data (forum posts, replies, job posts)
  useEffect(() => {
    const fetchActivityData = async () => {
      if (!studentId || !data?._id) return;
      
      setLoadingActivity(true);
      try {
        // Fetch forum posts
        try {
          // Try admin endpoint first, fallback to regular endpoint
          const forumPostsResponse = await axiosInstance.get(`/admin/students/${data._id}/forum-posts`, {
            params: { page: 1, limit: 5 }
          });
          setForumPosts(forumPostsResponse.data?.data || forumPostsResponse.data?.threads || []);
        } catch (error) {
          // If admin endpoint doesn't exist, try alternative approach
          console.log("Admin endpoint not available, trying alternative...");
          setForumPosts([]);
        }

        // Fetch forum replies
        try {
          const forumRepliesResponse = await axiosInstance.get(`/admin/students/${data._id}/forum-replies`, {
            params: { page: 1, limit: 5 }
          });
          setForumReplies(forumRepliesResponse.data?.data || forumRepliesResponse.data?.replies || []);
        } catch (error) {
          console.log("Forum replies endpoint not available");
          setForumReplies([]);
        }

        // Fetch job posts
        try {
          const jobPostsResponse = await axiosInstance.get(`/admin/students/${data._id}/job-posts`, {
            params: { page: 1, limit: 5 }
          });
          setJobPosts(jobPostsResponse.data?.data || jobPostsResponse.data?.jobPosts || []);
        } catch (error) {
          // Try alternative endpoint
          try {
            const altResponse = await axiosInstance.get(`/jobs`, {
              params: { createdBy: data._id, page: 1, limit: 5 }
            });
            setJobPosts(altResponse.data?.data || []);
          } catch (err) {
            console.log("Job posts endpoint not available");
            setJobPosts([]);
          }
        }
      } catch (error) {
        console.error("Error fetching activity data:", error);
      } finally {
        setLoadingActivity(false);
      }
    };

    if (data?._id) {
      fetchActivityData();
    }
  }, [data?._id, studentId]);

  // Fetch modules for selected course when popup opens
  useEffect(() => {
    const fetchModules = async () => {
      if (moduleDripPopup?.courseId) {
        try {
          const response = await dispatch(fetchCourseById({ courseId: moduleDripPopup.courseId })).unwrap();
          const modules = response?.modules || response?.data?.modules || [];
          setCourseModules(modules);
        } catch (e) {
          setCourseModules([]);
        }
      }
    };
    if (moduleDripPopup) fetchModules();
  }, [moduleDripPopup, dispatch]);

  // Handler for disabling drip (called after confirmation)
  const handleDisableDrip = async (courseId: string) => {
    if (!data?._id) return;
    setDripLoading(courseId);
    try {
      await dispatch(disableDripForUser({ courseId, userId: data._id }));
      setData((prev: any) => ({
        ...prev,
        enrollments: prev.enrollments.map((enr: any) =>
          enr.course?._id === courseId
            ? { ...enr, dripEnabled: false }
            : enr
        ),
      }));
      setConfirmDrip(null); // Close popup first
      setTimeout(() => {
        setToast({ message: "Drip setting disabled successfully.", type: "success" });
      }, 100); // Delay to ensure popup closes before toast shows
    } catch (e) {
      setConfirmDrip(null);
      setTimeout(() => {
        setToast({ message: "Failed to disable drip setting.", type: "error" });
      }, 100);
    } finally {
      setDripLoading(null);
    }
  };

  // Handler for disabling drip for module
  const handleDisableDripForModule = async () => {
    if (!selectedModuleId || !data?._id) return;
    setModuleDripLoading(true);
    try {
      await dispatch(
        disableDripForModule({ moduleId: selectedModuleId, userId: data._id })
      ).unwrap();
      setToast({ message: "Module drip disabled successfully.", type: "success" });
      setModuleDripPopup(null);
      setSelectedModuleId("");
    } catch (e) {
      setToast({ message: "Failed to disable module drip.", type: "error" });
    } finally {
      setModuleDripLoading(false);
    }
  };

  // Ban/Unban handlers
  const openBanModal = () => {
    setBanModalOpen(true);
    setBanReason("");
    setBanType("ban");
  };
  const closeBanModal = () => {
    setBanModalOpen(false);
    setBanReason("");
    setBanType("ban");
    setBanLoading(false);
  };
  const handleBanConfirm = async () => {
    if (!data?._id) return;
    setBanLoading(true);
    try {
      await dispatch(banStudent({
        userId: data._id,
        banType,
        banReason: banReason || "No reason provided",
      })).unwrap();
      setToast({ message: "Student banned successfully.", type: "success" });
      closeBanModal();
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setToast({ message: "Failed to ban student.", type: "error" });
      setBanLoading(false);
    }
  };
  const handleUnban = async () => {
    if (!data?._id) return;
    setBanLoading(true);
    try {
      await dispatch(unbanStudent({ userId: data._id })).unwrap();
      setToast({ message: "Student unbanned successfully.", type: "success" });
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setToast({ message: "Failed to unban student.", type: "error" });
    } finally {
      setBanLoading(false);
    }
  };

  // Remove enrollment handler
  const handleRemoveEnrollment = async (enrollmentId: string) => {
    setRemovingEnrollmentId(enrollmentId);
    try {
      await dispatch(deleteEnrollment({ enrollmentId })).unwrap();
      setToast({ message: "Enrollment removed successfully.", type: "success" });
      setData((prev: any) => ({
        ...prev,
        enrollments: prev.enrollments.filter((enr: any) => enr._id !== enrollmentId),
      }));
    } catch (e: any) {
      setToast({ message: e || "Failed to remove enrollment.", type: "error" });
    } finally {
      setRemovingEnrollmentId(null);
      setConfirmRemove(null);
    }
  };

  // Update Access Expiry handler
  const handleUpdateExpiry = async (enrollmentId: string) => {
    if (!newExpiryDate) {
      setToast({ message: "Please select a valid date.", type: "error" });
      return;
    }

    setUpdatingExpiry(true);
    try {
      await dispatch(updateAccessExpiry({ enrollmentId, accessExpiry: newExpiryDate })).unwrap();
      setToast({ message: "Access expiry updated successfully.", type: "success" });

      // Update local state
      setData((prev: any) => ({
        ...prev,
        enrollments: prev.enrollments.map((enr: any) =>
          enr._id === enrollmentId
            ? { ...enr, accessExpiry: newExpiryDate }
            : enr
        ),
      }));
      setEditingEnrollmentId(null);
    } catch (e: any) {
      setToast({ message: e || "Failed to update access expiry.", type: "error" });
    } finally {
      setUpdatingExpiry(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Student
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <User className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Student Not Found
          </h3>
          <p className="text-gray-600">
            The requested student could not be found.
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const StatusBadge = ({ verified, label, icon: Icon }) => (
    <div
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${verified
        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
        : "bg-rose-100 text-rose-800 border border-rose-200"
        }`}
    >
      {Icon && <Icon className="w-3 h-3 mr-1.5" />}
      {label}
    </div>
  );

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="flex sm:flex-row items-center sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "profile", label: "Profile", icon: Settings },
    { id: "analytics", label: "Analytics", icon: TrendingUp }, // new tab
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center">
                <div className="relative">
                  <div className="h-24 w-24 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <User className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="ml-6">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {data.fullName}
                  </h1>
                  <p className="text-lg text-gray-600 capitalize mb-3">
                    {data.role} • Member since {formatDate(data.createdAt)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge
                      verified={data.isActive}
                      label={data.isActive ? "Active" : "Inactive"}
                      icon={data.isActive ? CheckCircle : XCircle}
                    />
                    <StatusBadge
                      verified={data.emailVerified}
                      label="Email Verified"
                      icon={Mail}
                    />
                    <StatusBadge
                      verified={data.mobileVerified}
                      label="Mobile Verified"
                      icon={Phone}
                    />
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-6 lg:mt-0">
                <button
                  onClick={() => setEnrollPopupOpen(true)}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Enroll in Course
                </button>
                {/* Ban/Unban Button */}
                {(data.isBanned === true || data.isBanned === "true" || data.isShadowBanned === true || data.isShadowBanned === "true") ? (
                  <button
                    onClick={handleUnban}
                    className="inline-flex items-center px-6 py-3 border border-yellow-500 rounded-xl shadow-sm text-sm font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 transition-all duration-200"
                    disabled={banLoading}
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Unban Student
                  </button>
                ) : (
                  <button
                    onClick={openBanModal}
                    className="inline-flex items-center px-6 py-3 border border-red-500 rounded-xl shadow-sm text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 transition-all duration-200"
                    disabled={banLoading}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Ban Student
                  </button>
                )}
              </div>
            </div>
            {/* Ban status display */}
            {data.status === "ban" && (
              <div className="mt-4 text-red-600 text-sm">
                <Ban className="inline w-4 h-4 mr-1" />
                <span>
                  Student is <b>Banned</b>
                  {data.banReason && <>: {data.banReason}</>}
                </span>
              </div>
            )}
            {data.status === "shadowBan" && (
              <div className="mt-4 text-yellow-600 text-sm">
                <Ban className="inline w-4 h-4 mr-1" />
                <span>
                  Student is <b>Shadow Banned</b>
                  {data.banReason && <>: {data.banReason}</>}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === tab.id
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={BookOpen}
                title="Enrolled Courses"
                value={data?.enrollments?.length}
                subtitle="Active enrollments"
                color="blue"
              />
              {/* <StatCard
                icon={Award}
                title="Certificates"
                value={data.enrollments.filter(e => e.certificateIssued).length}
                subtitle="Earned certificates"
                color="yellow"
              />
              <StatCard
                icon={TrendingUp}
                title="Average Progress"
                value={`${Math.round(data.enrollments.reduce((acc, e) => acc + e.progressPercentage, 0) / data.enrollments.length || 0)}%`}
                subtitle="Across all courses"
                color="green"
              />
              <StatCard
                icon={Target}
                title="Completion Rate"
                value={`${Math.round((data.enrollments.filter(e => e.progressPercentage === 100).length / data.enrollments.length) * 100 || 0)}%`}
                subtitle="Courses completed"
                color="purple"
              /> */}
            </div>

            {/* Company Information Box (dynamic) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex sm:items-center justify-between flex-col items-start sm:flex-row gap-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Activity className="mr-2 h-5 w-5 text-blue-500" />
                    Recent Activity
                  </h3>

                </div>
                <div className="space-y-4">
                  {Array.isArray(data?.enrollments) && data.enrollments.length > 0 && Object.keys(data.enrollments[0]).length > 0 ? (
                    data.enrollments.slice(0, 3).map((enrollment, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {enrollment.course?.title || "Untitled Course"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No enrollments found.
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <User className="mr-2 h-5 w-5 text-green-500" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{data.email}</p>
                      <p className="text-xs text-gray-500">Primary Email</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{data?.phone}</p>
                      <p className="text-xs text-gray-500">Mobile Number</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatDate(data.createdAt)}</p>
                      <p className="text-xs text-gray-500">Member Since</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact & Account Info */}


              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center mb-6">
                  <Users className="mr-3 h-6 w-6 text-indigo-600" />
                  Company Information
                </h3>

                <div className="space-y-4">
                  {/* Company Name */}
                  <div className="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <Building2 className="mr-3 h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-gray-700 block text-sm mb-1">
                        Company Name
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {data.company?.name || (
                          <span className="text-gray-400 italic">Not provided</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* GST Number */}
                  <div className="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <FileText className="mr-3 h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-gray-700 block text-sm mb-1">
                        GST Number
                      </span>
                      <span className="text-gray-900 font-mono text-sm">
                        {data.company?.gstNumber || (
                          <span className="text-gray-400 italic font-sans">Not provided</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Optional: Add status indicator */}
                {data.company?.name && data.company?.gstNumber && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Company information complete
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "courses" && (
          <div className="space-y-8">
            {/* Course Enrollment Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex sm:flex-row items-center sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Enrollments</h2>
                  <p className="text-gray-600">Track progress across all enrolled courses</p>
                </div>
                <button
                  onClick={() => setEnrollPopupOpen(true)}
                  className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white rounded-xl shadow-md shadow-[#1b6294]/20 hover:shadow-lg transition-all active:scale-95 cursor-pointer font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Enroll in New Course
                </button>
              </div>
            </div>

            {Array.isArray(data.enrollments) && data.enrollments.length > 0 && Object.keys(data.enrollments[0]).length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...data.enrollments]
                  .sort((a, b) => {
                    // Sort by enrollment date (most recent first)
                    const dateA = a.enrolledAt ? new Date(a.enrolledAt).getTime() : 0;
                    const dateB = b.enrolledAt ? new Date(b.enrolledAt).getTime() : 0;
                    return dateB - dateA; // Descending order (newest first)
                  })
                  .map((enrollment, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex sm:flex-row items-center sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          {/* <span
                            className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              (enrollment.status === "active")
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                            }`}
                            >
                            {(enrollment.status
                              ? enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)
                              : "Unknown")}
                            </span> */}
                        </div>
                      </div>

                      <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                        {enrollment.course?.title || "Untitled Course"}
                      </h4>

                      <div className="mt-4 space-y-1 text-xs text-black">
                        {enrollment.enrolledAt && (
                          <div>
                            <span className="font-medium text-black">Enrolled At:</span>{" "}
                            {new Date(enrollment.enrolledAt).toLocaleString()}
                          </div>
                        )}
                        {enrollment.accessExpiry && (
                          <div className="flex items-center group">
                            <span className="font-medium text-black">Access Expiry:</span>{" "}
                            {editingEnrollmentId === enrollment._id ? (
                              <div className="flex items-center ml-2 space-x-2">
                                <input
                                  type="datetime-local"
                                  className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                  value={newExpiryDate}
                                  onChange={(e) => setNewExpiryDate(e.target.value)}
                                />
                                <button
                                  onClick={() => handleUpdateExpiry(enrollment._id)}
                                  disabled={updatingExpiry}
                                  className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                                  title="Save"
                                >
                                  {updatingExpiry ? (
                                    <div className="w-3 h-3 border-2 border-green-600 border-t-transparent animate-spin rounded-full"></div>
                                  ) : (
                                    <Save className="w-3 h-3" />
                                  )}
                                </button>
                                <button
                                  onClick={() => setEditingEnrollmentId(null)}
                                  className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="ml-1">{new Date(enrollment.accessExpiry).toLocaleString()}</span>
                                <button
                                  onClick={() => {
                                    setEditingEnrollmentId(enrollment._id);
                                    // Format date for datetime-local input (YYYY-MM-DDThh:mm)
                                    const date = new Date(enrollment.accessExpiry);
                                    const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                                      .toISOString()
                                      .slice(0, 16);
                                    setNewExpiryDate(formattedDate);
                                  }}
                                  className="ml-2 p-1 text-gray-400 hover:text-blue-600 transition-all"
                                  title="Edit Expiry"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {enrollment.course?.subtitle || "No subtitle available"}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium hover:bg-rose-100 transition-colors"
                          onClick={() =>
                            setConfirmDrip({
                              courseId: enrollment.course._id,
                              courseTitle: enrollment.course?.title || "this course",
                            })
                          }
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                          Disable Drip
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors"
                          onClick={() =>
                            setModuleDripPopup({
                              courseId: enrollment.course._id,
                              courseTitle: enrollment.course?.title || "this course",
                            })
                          }
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                          Disable Module Drip
                        </button>
                      </div>

                      {enrollment.certificateIssued && (
                        <div className="inline-flex flex-wrap items-center gap-2 mb-4">
                          <span className="inline-flex items-center text-sm text-green-600">
                            <Award className="w-4 h-4 mr-1" />
                            Certified
                          </span>
                          <button
                            type="button"
                            className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (data?._id && enrollment.course?._id) {
                                await downloadCertificateByUserAndCourse(
                                  dispatch,
                                  data._id,
                                  enrollment.course._id,
                                  `certificate-${enrollment.course?.title || "course"}.pdf`
                                );
                              }
                            }}
                            title="Download Certificate"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </button>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100">
                        <a
                          href={enrollment.course?._id ? `/courses/edit/${enrollment.course._id}` : "#"}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View Course
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </a>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                          onClick={() =>
                            setConfirmRemove({
                              id: enrollment._id,
                              title: enrollment.course?.title || "this course",
                            })
                          }
                          disabled={removingEnrollmentId === enrollment._id}
                        >
                          {removingEnrollmentId === enrollment._id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent animate-spin rounded-full mr-2" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-1.5 shrink-0" />
                          )}
                          Remove Enrollment
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No Enrolled Courses
                </h3>
                <p className="text-gray-600 mb-6">
                  This student hasn't enrolled in any courses yet. Get started by enrolling them in a course.
                </p>
                <button
                  onClick={() => setEnrollPopupOpen(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white rounded-xl shadow-md shadow-[#1b6294]/20 hover:shadow-lg transition-all active:scale-95 cursor-pointer font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Enroll in Course
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-8">
            {/* Contact Information with Last Login */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <User className="mr-2 h-5 w-5 text-green-500" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{data.email}</p>
                    <p className="text-xs text-gray-500">Primary Email</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{data?.phone || "N/A"}</p>
                    <p className="text-xs text-gray-500">Mobile Number</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatDate(data.createdAt)}</p>
                    <p className="text-xs text-gray-500">Member Since</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <LogIn className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {(data.lastLogin || data.last_login || data.lastLoginAt) ? (
                        new Date(data.lastLogin || data.last_login || data.lastLoginAt || "").toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ) : (
                        "Never"
                      )}
                    </p>
                    <p className="text-xs text-gray-500">Last Login</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Activity Section - Forum Posts, Replies, Job Posts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Forum Posts */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MessageCircle className="mr-2 h-5 w-5 text-blue-500" />
                    Forum Posts
                  </h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {forumPosts.length}
                  </span>
                </div>
                {loadingActivity ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                  </div>
                ) : forumPosts.length > 0 ? (
                  <div className="space-y-3">
                    {forumPosts.slice(0, 5).map((post, index) => (
                      <div key={post._id || index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {post.title || "Untitled Post"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {post.createdAt ? formatDate(post.createdAt) : "N/A"}
                        </p>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {post.tags.slice(0, 2).map((tag: string, idx: number) => (
                              <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm">No forum posts yet</p>
                  </div>
                )}
              </div>

              {/* Forum Replies */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MessageCircle className="mr-2 h-5 w-5 text-green-500" />
                    Forum Replies
                  </h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {forumReplies.length}
                  </span>
                </div>
                {loadingActivity ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent mx-auto"></div>
                  </div>
                ) : forumReplies.length > 0 ? (
                  <div className="space-y-3">
                    {forumReplies.slice(0, 5).map((reply, index) => (
                      <div key={reply._id || index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {reply.content || "No content"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {reply.createdAt ? formatDate(reply.createdAt) : "N/A"}
                        </p>
                        {reply.threadId && (
                          <p className="text-xs text-blue-600 mt-1">Thread: {reply.threadId}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm">No forum replies yet</p>
                  </div>
                )}
              </div>

              {/* Job Posts */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Briefcase className="mr-2 h-5 w-5 text-purple-500" />
                    Job Posts
                  </h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {jobPosts.length}
                  </span>
                </div>
                {loadingActivity ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent mx-auto"></div>
                  </div>
                ) : jobPosts.length > 0 ? (
                  <div className="space-y-3">
                    {jobPosts.slice(0, 5).map((job, index) => (
                      <div key={job._id || index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {job.title || "Untitled Job"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {job.createdAt ? formatDate(job.createdAt) : "N/A"}
                        </p>
                        {job.status && (
                          <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${
                            job.status === "approved" || job.status === "active"
                              ? "bg-green-100 text-green-700"
                              : job.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {job.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Briefcase className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm">No job posts yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                <User className="mr-2 h-5 w-5 text-indigo-500" />
                About {data.fullName}
              </h3>
              {data.bio ? (
                <div className="prose prose-indigo max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">{data.bio}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    {data.fullName} hasn't added a bio yet
                  </p>
                </div>
              )}
            </div>
            {/* Skills */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                <Star className="mr-2 h-5 w-5 text-yellow-500" />
                Skills & Expertise
              </h3>
              {(() => {
                // Parse skills from different formats
                const parseSkills = (skills) => {
                  if (!skills) return [];
                  if (Array.isArray(skills)) {
                    // If it's an array, flatten any comma-separated strings
                    return skills.flatMap(skill =>
                      typeof skill === 'string' ? skill.split(',').map(s => s.trim()).filter(Boolean) : skill
                    );
                  }
                  if (typeof skills === 'string') {
                    // If it's a string, split by comma
                    return skills.split(',').map(s => s.trim()).filter(Boolean);
                  }
                  return [];
                };

                const skillsArray = parseSkills(data.skills);

                return skillsArray.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skillsArray.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors duration-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No skills listed yet</p>
                  </div>
                );
              })()}
            </div>

            {/* Qualifications */}
            {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                <Award className="mr-2 h-5 w-5 text-green-500" />
                Qualifications
              </h3>
              {(() => {
                // Parse qualifications from different formats (same logic as skills)
                const parseQualifications = (qualifications) => {
                  if (!qualifications) return [];
                  if (Array.isArray(qualifications)) {
                    return qualifications.flatMap(qual => 
                      typeof qual === 'string' ? qual.split(',').map(q => q.trim()).filter(Boolean) : qual
                    );
                  }
                  if (typeof qualifications === 'string') {
                    return qualifications.split(',').map(q => q.trim()).filter(Boolean);
                  }
                  return [];
                };

                const qualificationsArray = parseQualifications(data.qualifications);
                
                return qualificationsArray.length > 0 ? (
                  <div className="space-y-3">
                    {qualificationsArray.map((qualification, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <GraduationCap className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                          {qualification}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No qualifications listed yet</p>
                  </div>
                );
              })()}
            </div> */}

            {/* Education */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                <GraduationCap className="mr-2 h-5 w-5 text-purple-500" />
                Education History
              </h3>
              {data.education?.length > 0 ? (
                <div className="space-y-4">
                  {data.education.map((edu, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-purple-500 pl-4 py-2 hover:bg-gray-50 transition-colors duration-200 rounded-r-lg"
                    >
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {edu.degree || "Degree"}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {edu.institution || "Institution"}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {(edu.startDate ? formatDate(edu.startDate) : "Start")} - {(edu.endDate ? formatDate(edu.endDate) : "Ongoing")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No education records found</p>
                </div>
              )}
            </div>

            {/* Documentation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                <FileText className="mr-2 h-5 w-5 text-indigo-500" />
                Documents
              </h3>
              {data.documentation?.length > 0 ? (
                <div className="space-y-3">
                  {data.documentation.map((doc, index) => (
                    <div
                      key={index}
                      className="flex sm:flex-row items-center sm:items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                          {doc.name || `Document ${index + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={doc.Doc ? `${ImageUrl}/${doc.Doc}` : "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </a>
                        {/* <a
                          href={doc.Doc ? `${ImageUrl}/${doc.Doc}` : "#"}
                          download
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </a> */}
                        <a
                          href={doc.Doc ? `${ImageUrl}/${doc.Doc}` : "#"}
                          download={doc.name || `document-${index + 1}.pdf`}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </a>

                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No documents uploaded yet</p>
                </div>
              )}
            </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <StudentAnalyticsTab studentId={data?._id} />
        )}
      </div>

      {/* Enroll Student Popup */}
      <EnrollStudentPopup
        open={enrollPopupOpen}
        onClose={() => setEnrollPopupOpen(false)}
        studentId={data?._id}
      />

      {/* Confirmation Popup for Drip Disable */}
      {confirmDrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Disable Drip Setting
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to disable drip setting for{" "}
              <span className="font-semibold">{confirmDrip.courseTitle}</span>?<br />
              <span className="text-xs text-gray-500">This action cannot be undone.</span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => setConfirmDrip(null)}
                disabled={!!dripLoading}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700 flex items-center ${dripLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => handleDisableDrip(confirmDrip.courseId)}
                disabled={!!dripLoading}
              >
                {dripLoading ? (
                  <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Yes, Disable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Popup for Module Drip Disable */}
      {moduleDripPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center">
            <XCircle className="w-10 h-10 text-yellow-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
              Disable Drip for Module
            </h3>
            <p className="text-gray-700 mb-6 text-center">
              Select a module from <span className="font-semibold">{moduleDripPopup.courseTitle}</span> to disable drip for this student.<br />
              <span className="text-xs text-gray-500">This action cannot be undone.</span>
            </p>
            <div className="mb-6 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
              <select
                value={selectedModuleId}
                onChange={e => setSelectedModuleId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Select module...</option>
                {courseModules.map(mod => (
                  <option key={mod._id || mod.id} value={mod._id || mod.id}>
                    {mod.title || mod.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3 w-full">
              <button
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => {
                  setModuleDripPopup(null);
                  setSelectedModuleId("");
                }}
                disabled={moduleDripLoading}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-md bg-yellow-600 text-white hover:bg-yellow-700 flex items-center ${moduleDripLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={handleDisableDripForModule}
                disabled={moduleDripLoading || !selectedModuleId}
              >
                {moduleDripLoading ? (
                  <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Disable Drip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ban Student
            </h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to ban{" "}
              <span className="font-semibold">{data.fullName || data.name}</span>?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ban Type</label>
              <select
                value={banType}
                onChange={e => setBanType(e.target.value as "ban" | "shadowBan")}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="ban">Ban</option>
                <option value="shadowBan">Shadow Ban</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <input
                type="text"
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
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
                className={`px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 flex items-center ${banLoading ? "opacity-50 cursor-not-allowed" : ""}`}
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

      {/* Remove Enrollment Confirmation Popup */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Remove Course Access
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to remove access to <span className="font-semibold">{confirmRemove.title}</span> for this student?<br />
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

      {/* Toast Message */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-lg shadow-lg text-white flex items-center space-x-3 transition-all duration-300 ${toast.type === "success"
            ? "bg-emerald-600"
            : "bg-rose-600"
            }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-white" />
          ) : (
            <XCircle className="w-5 h-5 text-white" />
          )}
          <span>
            {toast.type === "success"
              ? "Drip disabled successfully for the selected module."
              : toast.message}
          </span>
        </div>
      )}
    </div>
  );
}

export default StudentDetail;