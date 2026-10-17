import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourseById, updateCourse } from "../../store/slices/course";
import CourseMembershipTiersEditor from "../../components/CourseMembershipTiersEditor";
import CategorySubcategoryDropdowns from "../../components/CategorySubcategoryDropdowns";
import { RootState, AppDispatch } from "../../store";
import { useLocation, useParams } from "react-router-dom";
import {
  FileText,
  DollarSign,
  Users,
  Tag,
  Image,
  Video,
  Plus,
  X,
  Award,
  Download,
  MessageCircle,
  Lock,
  Upload,
  Eye,
  Loader2,
  AlertCircle,
  Type,
  Edit,
  Search,
  Check,
  Save,
  CheckCircle,
  Settings,
  Menu,
  Layout,
  Layers,
  Sparkles,
  Target,
  Star,
} from "lucide-react";
import ModuleSection from "./ModuleSection";
import Faqs from "./components/Faqs";
import QuillEditor from "../../components/QuillEditor";
import Editor from "../../components/Editor";
import LandingPageSections from "./LandingPageSections";
import AddReview from "./AddReview";
import { toNumber } from "../../utils/number";

const baseUrl = (import.meta.env.VITE_BASE_URL || "https://api.dataknowledge.in/").replace(/\/+$/, '') + '/';

// Success Popup Component (unchanged)
const SuccessPopup = ({
  isVisible,
  onClose,
  message,
  type = "success",
}: {
  isVisible: boolean;
  onClose: () => void;
  message: string;
  type?: "success" | "error";
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        <div className="text-center">
          <div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${type === "success" ? "bg-green-100" : "bg-red-100"
              }`}
          >
            {type === "success" ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-600" />
            )}
          </div>
          <h3
            className={`text-xl font-semibold mb-2 ${type === "success" ? "text-green-800" : "text-red-800"
              }`}
          >
            {type === "success" ? "Success!" : "Error!"}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${type === "success"
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-red-600 text-white hover:bg-red-700"
              }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// File Upload Component (unchanged)
type FileUploadProps = {
  label: string;
  accept: string;
  onFileChange: (file: File | null) => void;
  currentFile: File | null;
  icon: React.ElementType;
};

const FileUpload = ({
  label,
  accept,
  onFileChange,
  currentFile,
  icon: Icon,
}: FileUploadProps) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileChange(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${dragOver ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30" : "border-gray-300 dark:border-gray-600"
          }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept={accept}
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          className="hidden"
          id={`file-${label}`}
        />
        <label htmlFor={`file-${label}`} className="cursor-pointer">
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drop file here or{" "}
            <span className="text-blue-600 hover:underline">browse</span>
          </p>
        </label>
        {currentFile && (
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">
            {currentFile.name} ({(currentFile.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
      </div>
    </div>
  );
};

// YouTube URL Input Component (unchanged)
type YouTubeUrlInputProps = {
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  error?: string;
};

const YouTubeUrlInput = ({
  label,
  value,
  onChange,
  error,
}: YouTubeUrlInputProps) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
        <Video className="w-4 h-4 text-blue-600" />
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        className={`w-full border dark:text-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? "border-red-400" : "border-gray-300 dark:border-gray-600"
          }`}
        placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=xyz)"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {typeof value === "string" && value && (
        <div className="mt-3">
          <iframe
            width="100%"
            height="200"
            src={value?.replace("watch?v=", "embed/")}
            title="YouTube video preview"
            style={{ border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

const EditCourse = () => {
  const { id } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();

  // Fallback extraction from pathname
  const courseId = id || location.pathname.split("/").pop();
  const {
    loading,
    error,
    data: courseData,
  } = useSelector((state) => state.course);

  // Tab state
  const [activeTab, setActiveTab] = useState("basic");
  console.log('Active Tab:', activeTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For mobile sidebar toggle

  // Course state (unchanged)
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [verticalCarouselImageFile, setVerticalCarouselImageFile] = useState(null);
  const [featuredImageBannerFile, setFeaturedImageBannerFile] = useState(null);
  const [demoVideoUrl, setDemoVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [seoContent, setSeoContent] = useState("");
  const [modules, setModules] = useState([]);
  const [popup, setPopup] = useState({
    message: "",
    type: "success",
    isVisible: false,
  });
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState<any>({
    title: "",
    subtitle: "",
    seoMetaDescription: "",
    categoryId: "",
    subCategoryId: "",
    level: "beginner",
    price: "",
    currency: "INR",
    salePrice: "",
    duration: "",
    instructorId: "",
    isPublished: false,
    enrollmentType: "open",
    maxStudents: "",
    enrolledStudentsCount: 0,
    certificateTemplate: true,
    isDownloadable: true,
    courseForum: true,
    isSubscription: false,
    isPrivate: false,
    isFeatured: false,
    enableWaitlist: false,
    coursePosition: "",
    // Mentor fields
    mentorName: "",
    mentorTitle: "",
    mentorDescription: "",
    mentorImage: "",
    mentorImageFile: null as File | null,
    mentorAchievements: [] as string[],
    mentorSocialLinks: {
      linkedin: "",
      twitter: "",
      youtube: "",
      website: ""
    },
    // Learning outcomes and target audience
    learningOutcomes: [],
    targetAudience: [],
    // Per-course IAS membership tiers (name + price vary per course)
    courseMemberships: [] as any[],
    // Certificate fields
    certificateImage: "",
    certificateImageFile: null,
    certificateTitle: "Certificate of Completion",
    certificateSubtitle: "Awarded for Excellence",
    certificateRecipientName: "Student Name",
    certificateIssuerName: "",
    certificateIssuerTitle: "",
    certificateOrganization: "Lapaas LMS",
    certificateDescription: "",
    // Enhanced Landing Page Sections
    landingPageSections: [],
    overviewSection: { show: false, title: "", subtitle: "", description: null, images: [] },
    comparisonSection: {
      show: false,
      title: "",
      leftTitle: "Traditional Program",
      rightTitle: "Our Program",
      content: null,
      leftPoints: [""],
      rightPoints: [""]
    },
    benefitsSection: { show: false, title: "", content: null, points: [""] },
    frameworkSection: { show: false, title: "", subtitle: "", description: null, media: "" },
    solutionSection: { show: false, title: "", content: null, points: [""] },
  });

  // Plans state
  const [plans, setPlans] = useState<
    { name: string; price: string; description: string; durationType: string; duration: string; salePrice: string; status: string; _id?: string }[]
  >([]);

  // Plan form state
  const [planForm, setPlanForm] = useState({
    name: "",
    price: "",
    description: "",
    durationType: "Month",
    duration: "",
    salePrice: "",
    status: "active",
    _id: undefined,
  });

  // Track if editing a plan (by index)
  const [editingPlanIdx, setEditingPlanIdx] = useState<number | null>(null);

  // Plan form errors
  const [planFormError, setPlanFormError] = useState("");

  // Predefined tags (unchanged)
  const predefinedTags = [
    "Programming",
    "Design",
    "Business",
    "Marketing",
    "Data Science",
    "Mobile Development",
    "AI/ML",
    "Web Development",
  ];

  // Validation schema (unchanged)
  const validateForm = (
    formData,
    description,
    seoContent,
    selectedTags,
    files,
    demoVideoUrl
  ) => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = "Course title is required";
    } else if (formData.title.length > 100) {
      errors.title = "Title must be less than 100 characters";
    }

    if (!formData.price) {
      errors.price = "Price is required";
    } else if (isNaN(formData.price) || formData.price < 0) {
      errors.price = "Price must be a non-negative number";
    } else if (formData.price > 100000) {
      errors.price = "Price cannot exceed 100,000";
    }

    if (formData.seoMetaDescription.length > 160) {
      errors.seoMetaDescription =
        "Meta description must be less than 160 characters";
    }

    if (seoContent.length > 10000) {
      errors.seoContent = "SEO content must be less than 10,000 characters";
    }

    if (!files.thumbnailFile && !formData.thumbnail) {
      errors.thumbnailFile = "Thumbnail image is required";
    }

    if (
      demoVideoUrl &&
      !/^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}$/.test(
        demoVideoUrl
      )
    ) {
      errors.demoVideoUrl = "Please enter a valid YouTube URL";
    }

    if (selectedTags.length === 0) {
      errors.tags = "At least one tag is required";
    } else if (selectedTags.length > 5) {
      errors.tags = "Maximum 5 tags allowed";
    }

    return errors;
  };

  // Fetch course data for editing (unchanged)
  useEffect(() => {
    if (courseId) {
      const token = localStorage.getItem("token") || "";
      dispatch(fetchCourseById({ courseId, token }));
    }
  }, [courseId, dispatch]);

  // Always process course data when it changes
  const parseEditorData = (data: any) => {
    if (!data) return undefined;
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        return {
          blocks: [{ type: "paragraph", data: { text: data } }],
        };
      }
    }
    return data;
  };

  useEffect(() => {
    if (courseData) {
      const course = courseData.data || courseData;

      setFormData((prev) => ({
        ...prev,
        title: course.title || "",
        subtitle: course.subtitle || "",
        seoMetaDescription: course.seoMetaDescription || "",
        thumbnail: course.thumbnail || "",
        demoVideo: course.demoVideo || "",
        coverImage: course.coverImage || "",
        verticalCarouselImage: course.verticalCarouselImage || "",
        featuredImageBanner: course.featuredImageBanner || "",
        categoryId:
          course.categoryId ||
          course.category?._id ||
          course.categoryId?._id ||
          "",
        subCategoryId:
          course.subCategoryId ||
          course.subCategory?._id ||
          course.subCategoryId?._id ||
          "",
        level: course.level || "beginner",
        price:
          typeof course.price === "object" && course.price?.$numberDecimal
            ? course.price.$numberDecimal
            : course.price || "",
        salePrice:
          typeof course.salePrice === "object" && course.salePrice?.$numberDecimal
            ? course.salePrice.$numberDecimal
            : course.salePrice || "",
        currency: course.currency || "INR",
        duration: course.duration || "",
        instructorId: course.instructorId || course.instructor?._id || "",
        isPublished: course.isPublished || false,
        enrollmentType: course.enrollmentType || "open",
        maxStudents: course.maxStudents || "",
        enrolledStudentsCount: course.enrolledStudentsCount || 0,
        certificateTemplate:
          course.certificateTemplate !== undefined
            ? course.certificateTemplate
            : true,
        isDownloadable:
          course.isDownloadable !== undefined ? course.isDownloadable : true,
        courseForum:
          course.courseForum !== undefined ? course.courseForum : true,
        isSubscription: course.isSubscription || false,
        isPrivate: course.isPrivate || false,
        isFeatured: course.isFeatured || false,
        enableWaitlist: course.enableWaitlist || false,
        coursePosition: course.coursePosition || "",
        // Mentor fields
        mentorName: course.mentorName || "",
        mentorTitle: course.mentorTitle || "",
        mentorDescription: course.mentorDescription || "",
        mentorImage: course.mentorImage || "",
        mentorAchievements: course.mentorAchievements || [],
        mentorSocialLinks: course.mentorSocialLinks || {
          linkedin: "",
          twitter: "",
          youtube: "",
          website: ""
        },
        // Learning outcomes and target audience
        learningOutcomes: course.learningOutcomes || [],
        targetAudience: course.targetAudience || [],
        // Per-course IAS membership tiers (name + price vary per course).
        // Normalize Decimal128 numeric fields so the form inputs render/edit
        // correctly (Decimal128 arrives as { $numberDecimal: "..." }).
        courseMemberships: (course.courseMemberships || []).map((t: any) => ({
          ...t,
          price: toNumber(t.price),
          salePrice: toNumber(t.salePrice),
          duration: toNumber(t.duration),
        })),
        // Certificate fields
        certificateImage: course.certificateImage || "",
        certificateTitle: course.certificateTitle || "Certificate of Completion",
        certificateSubtitle: course.certificateSubtitle || "Awarded for Excellence",
        certificateRecipientName: course.certificateRecipientName || "Student Name",
        certificateIssuerName: course.certificateIssuerName || "",
        certificateIssuerTitle: course.certificateIssuerTitle || "",
        certificateOrganization: course.certificateOrganization || "Lapaas LMS",
        certificateDescription: course.certificateDescription || "",
        // Enhanced Landing Page Sections
        landingPageSections: (course.landingPageSections && course.landingPageSections.length > 0)
          ? course.landingPageSections.map((s: any, i: number) => ({
            ...s,
            id: s.id || s._id || `sec-${i}`,
            order: s.order ?? i,
            sortOrder: s.sortOrder ?? i,
            data: {
              ...s.data,
              description: parseEditorData(s.data?.description || (s.type === 'overview' ? course.overviewSection?.description : undefined)),
              content: parseEditorData(s.data?.content || (s.type === 'comparison' ? course.comparisonSection?.content : s.type === 'benefits' ? course.benefitsSection?.content : s.type === 'solution' ? course.solutionSection?.content : undefined))
            }
          }))
          : [
            { id: "1", type: "overview", order: 0, sortOrder: 0, data: { show: course.overviewSection?.show || false, title: course.overviewSection?.title || "", subtitle: course.overviewSection?.subtitle || "", description: parseEditorData(course.overviewSection?.description), images: course.overviewSection?.images || [] } },
            { id: "2", type: "comparison", order: 1, sortOrder: 1, data: { show: course.comparisonSection?.show || false, title: course.comparisonSection?.title || "", leftTitle: course.comparisonSection?.leftTitle || "Traditional Program", rightTitle: course.comparisonSection?.rightTitle || "Our Program", content: parseEditorData(course.comparisonSection?.content), leftPoints: course.comparisonSection?.leftPoints?.length ? course.comparisonSection.leftPoints : [""], rightPoints: course.comparisonSection?.rightPoints?.length ? course.comparisonSection.rightPoints : [""] } },
            { id: "3", type: "benefits", order: 2, sortOrder: 2, data: { show: course.benefitsSection?.show || false, title: course.benefitsSection?.title || "", content: parseEditorData(course.benefitsSection?.content), points: course.benefitsSection?.points?.length ? course.benefitsSection.points : [""] } },
            { id: "4", type: "framework", order: 3, sortOrder: 3, data: { show: course.frameworkSection?.show || false, title: course.frameworkSection?.title || "", subtitle: course.frameworkSection?.subtitle || "", description: parseEditorData(course.frameworkSection?.description), media: course.frameworkSection?.media || "" } },
            { id: "5", type: "solution", order: 4, sortOrder: 4, data: { show: course.solutionSection?.show || false, title: course.solutionSection?.title || "", content: parseEditorData(course.solutionSection?.content), points: course.solutionSection?.points?.length ? course.solutionSection.points : [""] } }
          ].filter(Boolean),
        overviewSection: {
          show: course.overviewSection?.show || false,
          title: course.overviewSection?.title || "",
          subtitle: course.overviewSection?.subtitle || "",
          images: course.overviewSection?.images || [],
          description: parseEditorData(course.overviewSection?.description)
        },
        comparisonSection: {
          show: course.comparisonSection?.show || false,
          title: course.comparisonSection?.title || "",
          leftTitle: course.comparisonSection?.leftTitle || "Traditional Program",
          rightTitle: course.comparisonSection?.rightTitle || "Our Program",
          leftPoints: (course.comparisonSection?.leftPoints && course.comparisonSection.leftPoints.length > 0)
            ? course.comparisonSection.leftPoints
            : [""],
          rightPoints: (course.comparisonSection?.rightPoints && course.comparisonSection.rightPoints.length > 0)
            ? course.comparisonSection.rightPoints
            : [""],
          content: parseEditorData(course.comparisonSection?.content)
        },
        benefitsSection: {
          show: course.benefitsSection?.show || false,
          title: course.benefitsSection?.title || "",
          points: (course.benefitsSection?.points && course.benefitsSection.points.length > 0)
            ? course.benefitsSection.points
            : [""],
          content: parseEditorData(course.benefitsSection?.content)
        },
        frameworkSection: {
          show: course.frameworkSection?.show || false,
          title: course.frameworkSection?.title || "",
          subtitle: course.frameworkSection?.subtitle || "",
          media: course.frameworkSection?.media || "",
          description: parseEditorData(course.frameworkSection?.description)
        },
        solutionSection: {
          show: course.solutionSection?.show || false,
          title: course.solutionSection?.title || "",
          points: (course.solutionSection?.points && course.solutionSection.points.length > 0)
            ? course.solutionSection.points
            : [""],
          content: parseEditorData(course.solutionSection?.content)
        },
      }));

      setDescription(course.description || "");
      setSeoContent(course.seoContent || "");
      setSelectedTags(course.tags || []);
      setDemoVideoUrl(course.demoVideo || "");

      const courseModules = course.modules || [];
      // Map modules and lessons, including textLessons and files for each lesson
      const processedModules = courseModules.map((module) => ({
        _id: module._id || undefined,
        title: module.title || "",
        description: module.description || "",
        image: module.image || "",          // ← preserve module thumbnail
        estimatedDuration: module.estimatedDuration || 60,
        isPublished: module.isPublished || false,
        courseId: module.courseId || courseId,
        lessons: (module.lessons || []).map((lesson) => ({
          _id: lesson._id || undefined,
          title: lesson.title || "",
          type: lesson.type || "video",
          content: lesson.content || "",
          videoUrl: lesson.videoUrl || "",
          duration: lesson.duration || "",
          order: lesson.order || 0,
          // Add textLessons and files if present
          quiz: lesson.quiz || [],
          videoLessons: lesson.videoLessons || [],
          assignment: lesson?.assignment || [],
          textLessons: lesson.textLessons || [],
          files: lesson.files || [],
        })),
        order: module.order || 0,
      }));

      setModules(processedModules);

      // --- Load initial plans from backend ---
      if (Array.isArray(course.plans)) {
        setPlans(
          course.plans.map((p) => ({
            name: p.name || "",
            price: String(p.price ?? ""),
            description: p.description || "",
            durationType: p.durationType || "Month",
            duration: String(p.duration ?? ""),
            salePrice: String(p.salePrice ?? ""),
            status: p.status || "active",
            _id: p._id,
          }))
        );
      }
    }
  }, [courseData]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const checked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const addTag = (tag) => {
    if (selectedTags.length >= 5) {
      setPopup({
        isVisible: true,
        message: "Maximum 5 tags allowed",
        type: "error",
      });
      return;
    }
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setFormErrors((prev) => ({ ...prev, tags: "" }));
    }
  };

  const handleCategoryChange = (categoryId, categoryName) => {
    setFormData((prev) => ({
      ...prev,
      categoryId,
      subCategoryId: "",
    }));
    setFormErrors((prev) => ({ ...prev, categoryId: "", subCategoryId: "" }));
  };

  const handleSubcategoryChange = (subCategoryId, subCategoryName) => {
    setFormData((prev) => ({
      ...prev,
      subCategoryId,
    }));
    setFormErrors((prev) => ({ ...prev, subCategoryId: "" }));
  };

  const removeTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const addCustomTag = () => {
    if (selectedTags.length >= 5) {
      setPopup({
        isVisible: true,
        message: "Maximum 5 tags allowed",
        type: "error",
      });
      return;
    }
    if (
      customTag.trim() &&
      !selectedTags.includes(customTag.trim())
    ) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag("");
      setFormErrors((prev) => ({ ...prev, tags: "" }));
    }
  };

  const handleModulesChange = (updatedModules: any) => {
    // Only update modules state, do not show popup here
    setModules(updatedModules);
  };

  // Add or update plan
  const handleAddOrUpdatePlan = () => {
    if (!planForm.name.trim() || !planForm.price.trim() || !planForm.durationType || !planForm.duration.trim()) {
      setPlanFormError("Name, price, duration type, and duration are required");
      return;
    }
    if (editingPlanIdx !== null) {
      // Update existing plan
      setPlans((prev) =>
        prev.map((p, idx) => (idx === editingPlanIdx ? { ...planForm } : p))
      );
      setEditingPlanIdx(null);
    } else {
      // Add new plan
      setPlans([...plans, { ...planForm }]);
    }
    setPlanForm({ name: "", price: "", description: "", durationType: "Month", duration: "", salePrice: "", status: "active", _id: undefined });
    setPlanFormError("");
  };

  // Edit plan
  const handleEditPlan = (idx: number) => {
    setPlanForm({ ...plans[idx] });
    setEditingPlanIdx(idx);
    setPlanFormError("");
  };

  // Remove plan
  const handleRemovePlan = (idx: number) => {
    setPlans(plans.filter((_, i) => i !== idx));
    if (editingPlanIdx === idx) {
      setPlanForm({ name: "", price: "", description: "", durationType: "Month", duration: "", salePrice: "", status: "active", _id: undefined });
      setEditingPlanIdx(null);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setPlanForm({ name: "", price: "", description: "", durationType: "Month", duration: "", salePrice: "", status: "active", _id: undefined });
    setEditingPlanIdx(null);
    setPlanFormError("");
  };

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();

    const files = { thumbnailFile, coverImageFile, verticalCarouselImageFile, featuredImageBannerFile };
    const errors = validateForm(
      formData,
      description,
      seoContent,
      selectedTags,
      files,
      demoVideoUrl
    );

    console?.log('Validation errors:', errors);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setPopup({
        isVisible: true,
        message: "Please fix the errors in the form",
        type: "error",
      });
      return;
    }

    const submitFormData = new FormData();

    Object.keys(formData).forEach((key) => {
      const value = formData[key];
      if (key === "isPublished") {
        submitFormData.set("isPublished", (!isDraft && !!formData.isPublished).toString());
      } else if (key === "learningOutcomes" || key === "targetAudience" || key === "mentorAchievements") {
        // Handle arrays properly
        if (Array.isArray(value) && value.length > 0) {
          submitFormData.append(key, JSON.stringify(value.filter(item => item && item.trim() !== "")));
        }
      } else if (key === "courseMemberships") {
        // Handle per-course membership tiers
        if (Array.isArray(value) && value.length > 0) {
          submitFormData.append(
            key,
            JSON.stringify(
              value
                .filter((t: any) => t && t.name && t.name.trim() !== "")
                .map((t: any) => ({
                  ...(t._id ? { _id: t._id } : {}),
                  name: t.name,
                  tagline: t.tagline || "",
                  description: t.description || "",
                  price: toNumber(t.price),
                  salePrice: toNumber(t.salePrice),
                  currency: t.currency || "INR",
                  duration: toNumber(t.duration),
                  durationType: t.durationType || "month",
                  benefits: t.benefits
                    ? String(t.benefits).split(",").map((b: string) => b.trim()).filter(Boolean)
                    : [],
                  status: t.status || "active",
                }))
            )
          );
        }
      } else if (key === "mentorSocialLinks") {
        // Handle mentor social links object
        if (value && typeof value === "object") {
          submitFormData.append(key, JSON.stringify(value));
        }
      } else if (key === "mentorImageFile") {
        // Handle mentor image file upload
        if (value) {
          submitFormData.set("mentorImage", value);
        }
      } else if (key === "certificateImageFile") {
        // Handle certificate image file upload
        if (value) {
          submitFormData.set("certificateImage", value);
        }
      } else if (key === "landingPageSections") {
        submitFormData.append(key, JSON.stringify(value));
      } else if (Array.isArray(value)) {
        submitFormData.append(key, value.length > 0 ? String(value[0]) : "");
      } else if (key === "overviewSection" || key === "comparisonSection" || key === "benefitsSection" || key === "frameworkSection" || key === "solutionSection") {
        // Handle individual landing page sections objects (for backward compatibility or direct updates)
        if (value && typeof value === "object") {
          // Clean up comparisonSection: filter out empty strings from points arrays
          if (key === "comparisonSection") {
            const cleanedSection = {
              ...value,
              leftPoints: Array.isArray(value.leftPoints)
                ? value.leftPoints.filter((point: any) => point != null && String(point).trim() !== '')
                : [],
              rightPoints: Array.isArray(value.rightPoints)
                ? value.rightPoints.filter((point: any) => point != null && String(point).trim() !== '')
                : []
            };
            submitFormData.append(key, JSON.stringify(cleanedSection));
          } else if (key === "benefitsSection" || key === "solutionSection") {
            // Clean up benefitsSection and solutionSection: filter out empty strings from points array
            const cleanedSection = {
              ...value,
              points: Array.isArray(value.points)
                ? value.points.filter((point: any) => point != null && String(point).trim() !== '')
                : []
            };
            submitFormData.append(key, JSON.stringify(cleanedSection));
          } else {
            submitFormData.append(key, JSON.stringify(value));
          }
        }
      } else if (value !== null && value !== undefined) {
        submitFormData.append(key, String(value));
      }
    });

    submitFormData.set("title", String(formData.title));
    submitFormData.set("subtitle", String(formData.subtitle));
    submitFormData.set("seoMetaDescription", String(formData.seoMetaDescription));
    submitFormData.set("description", description);
    submitFormData.set("seoContent", seoContent);
    submitFormData.set("tags", JSON.stringify(selectedTags));
    submitFormData.set("level", formData.level || "beginner");
    submitFormData.set("demoVideo", demoVideoUrl);

    // Handle mentor image file separately if uploaded
    if (formData.mentorImageFile) {
      submitFormData.set("mentorImage", formData.mentorImageFile);
    }

    // Handle certificate image file separately if uploaded
    if (formData.certificateImageFile) {
      submitFormData.set("certificateImage", formData.certificateImageFile);
    }

    if (verticalCarouselImageFile) submitFormData.set("verticalCarouselImage", verticalCarouselImageFile);
    if (featuredImageBannerFile) submitFormData.set("featuredImageBanner", featuredImageBannerFile);

    if (thumbnailFile) submitFormData.set("thumbnail", thumbnailFile);
    if (coverImageFile) submitFormData.set("coverImage", coverImageFile);

    // --- FLATTEN PLANS IN PAYLOAD WITHOUT QUOTES ---
    plans.forEach((plan, idx) => {
      Object.entries(plan).forEach(([key, value]) => {
        if (key !== "_id") {
          submitFormData.append(`plans[${idx}][${key}]`, value);
        }
        // Optionally, send _id for existing plans if backend supports updating by _id
        if (key === "_id" && value) {
          submitFormData.append(`plans[${idx}][_id]`, value);
        }
      });
    });
    // --- END FLATTEN PLANS ---

    try {
      await dispatch(
        updateCourse({ id: courseId, data: submitFormData })
      ).unwrap();
      setPopup({
        isVisible: true,
        message: isDraft
          ? "Course saved as draft successfully!"
          : "Course updated successfully!",
        type: "success",
      });
      // Refetch course data after update to get latest price/salePrice
      const token = localStorage.getItem("token") || "";
      dispatch(fetchCourseById({ courseId, token }));

    } catch (error) {
      setPopup({
        isVisible: true,
        message: error.message || "Failed to update course. Please try again.",
        type: "error",
      });
    }
  };

  const getUrlFromFile = (file) => {
    if (!file) return "";
    return URL.createObjectURL(file);
  };

  if (loading && !courseData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-300">Loading course data...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "basic", title: "Basic Information", icon: Type, isRequired: true },
    { key: "details", title: "Course Details", icon: FileText, isRequired: true },
    { key: "media", title: "Media Files", icon: Image, isRequired: true },
    { key: "pricing", title: "Pricing", icon: DollarSign, isRequired: true },
    { key: "features", title: "Course Features", icon: Award, isRequired: false },
    { key: "tags", title: "Tags", icon: Tag, isRequired: true },
    { key: "seo", title: "SEO Content", icon: Search, isRequired: false },
    { key: "modules", title: "Course Modules", icon: Settings, isRequired: false },
    { key: "faqs", title: "FAQs", icon: MessageCircle, isRequired: false },
    { key: "mentor", title: "Mentor Information", icon: Users, isRequired: false },
    { key: "landingPage", title: "Landing Page Sections", icon: Layout, isRequired: false },
    { key: "certificate", title: "Certificate", icon: Award, isRequired: false },
    { key: "publication", title: "Publication Status", icon: Eye, isRequired: false },
    { key: "reviews", title: "Reviews", icon: Star, isRequired: false },
  ];

  return (
    <>
      <SuccessPopup
        message={popup.message}
        type={popup.type}
        isVisible={popup.isVisible}
        onClose={() => setPopup({ ...popup, isVisible: false })}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } lg:translate-x-0 lg:static lg:w-64`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Course Editor
            </h2>
            <button
              className="lg:hidden mt-2 text-gray-600 dark:text-gray-300"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="p-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setIsSidebarOpen(false); // Close sidebar on mobile after selection
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.key
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.title}</span>
                {tab.isRequired && (
                  <span className="text-red-500 text-xs">*</span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8">
          {/* Mobile Sidebar Toggle */}
          <button
            className="lg:hidden mb-4 p-2 bg-blue-600 text-white rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-gray-100">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Edit className="w-8 h-8 text-blue-600" />
              </div>
              Edit Course
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Update your course details below
            </p>
            {formData.title && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Currently editing: <strong>{formData.title}</strong>
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
            </div>
          )}

          {activeTab === "reviews" ? (
            <AddReview />
          ) : (
            <form onSubmit={(e) => handleSubmit(e, false)}>
              {/* Tab Content */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                {activeTab === "basic" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Course Title *
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className={`w-full border rounded-lg px-4 py-3 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.title
                            ? "border-red-400"
                            : "border-gray-300 dark:border-gray-600"
                            }`}
                          placeholder="Enter course title"
                          required
                        />
                        {formErrors.title && (
                          <p className="mt-1 text-xs text-red-600">
                            {formErrors.title}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Course Subtitle
                        </label>
                        <input
                          type="text"
                          name="subtitle"
                          value={formData.subtitle}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 dark:text-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter course subtitle"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Course Position
                      </label>
                      <input
                        type="number"
                        name="coursePosition"
                        value={formData.coursePosition}
                        onChange={handleInputChange}
                        min={0}
                        className={`w-full border rounded-lg px-4 py-3 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.coursePosition
                          ? "border-red-400"
                          : "border-gray-300 dark:border-gray-600"
                          }`}
                        placeholder="Enter course position (numeric)"
                      />
                      {formErrors.coursePosition && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.coursePosition}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Course Description *
                      </label>
                      <QuillEditor
                        value={description}
                        onChange={setDescription}
                        placeholder="Describe your course in detail..."
                      />
                      {formErrors.description && (
                        <p className="mt-2 text-xs text-red-600">
                          {formErrors.description}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "details" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Course Details</h3>
                    <CategorySubcategoryDropdowns
                      selectedCategoryId={formData.categoryId}
                      selectedSubcategoryId={formData.subCategoryId}
                      onCategoryChange={handleCategoryChange}
                      onSubcategoryChange={handleSubcategoryChange}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Level
                        </label>
                        <select
                          name="level"
                          value={typeof formData.level == "string" && formData.level ? formData.level : "beginner"}
                          onChange={handleInputChange}
                          className="w-full border dark:text-gray-200 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Duration (mins) *
                        </label>
                        <input
                          type="number"
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          className={`w-full border dark:text-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 dark:border-gray-600`}
                          placeholder="Enter duration in minutes"
                          min={1}
                          step={1}
                          onWheel={(e) => e.currentTarget.blur()}
                          onInput={(e) => {
                            const value = e.currentTarget.value;
                            if (value && value.includes(".")) {
                              e.currentTarget.value = value.split(".")[0];
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          Enrolled Students Count
                        </label>
                        <input
                          type="number"
                          name="enrolledStudentsCount"
                          value={formData.enrolledStudentsCount}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^\d+$/.test(value)) {
                              handleInputChange(e);
                            }
                          }}
                          step="1"
                          min="0"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Number of enrolled students"
                          onWheel={(e) => e.currentTarget.blur()}
                          onInput={(e) => {
                            const value = e.currentTarget.value;
                            if (value && value.includes(".")) {
                              e.currentTarget.value = value.split(".")[0];
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Per-course Membership Tiers */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Memberships &amp; Pricing (per course)
                      </label>
                      <CourseMembershipTiersEditor
                        value={formData.courseMemberships || []}
                        onChange={(tiers) =>
                          setFormData((prev: any) => ({ ...prev, courseMemberships: tiers }))
                        }
                      />
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Define this course's own membership tiers with their own rates. Modules and lessons
                        can be restricted to these tiers.
                      </p>
                    </div>

                    {/* Learning Outcomes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        What You'll Learn (Learning Outcomes)
                      </label>
                      <div className="space-y-2">
                        {(formData.learningOutcomes || []).map((outcome, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={outcome}
                              onChange={(e) => {
                                const updated = [...(formData.learningOutcomes || [])];
                                updated[index] = e.target.value;
                                setFormData({ ...formData, learningOutcomes: updated });
                              }}
                              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter learning outcome"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (formData.learningOutcomes || []).filter((_, i) => i !== index);
                                setFormData({ ...formData, learningOutcomes: updated });
                              }}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              learningOutcomes: [...(formData.learningOutcomes || []), ""]
                            });
                          }}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Learning Outcome
                        </button>
                      </div>
                    </div>

                    {/* Target Audience */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Who This Course Is For (Target Audience)
                      </label>
                      <div className="space-y-2">
                        {(formData.targetAudience || []).map((audience, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={audience}
                              onChange={(e) => {
                                const updated = [...(formData.targetAudience || [])];
                                updated[index] = e.target.value;
                                setFormData({ ...formData, targetAudience: updated });
                              }}
                              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter target audience"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (formData.targetAudience || []).filter((_, i) => i !== index);
                                setFormData({ ...formData, targetAudience: updated });
                              }}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              targetAudience: [...(formData.targetAudience || []), ""]
                            });
                          }}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Target Audience
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "media" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Media Files</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FileUpload
                        label="Thumbnail Image *"
                        accept="image/*"
                        onFileChange={setThumbnailFile}
                        currentFile={thumbnailFile}
                        icon={Image}
                      />
                      <FileUpload
                        label="Cover Image"
                        accept="image/*"
                        onFileChange={setCoverImageFile}
                        currentFile={coverImageFile}
                        icon={Image}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FileUpload
                        label="Vertical Carousel Image"
                        accept="image/*"
                        onFileChange={setVerticalCarouselImageFile}
                        currentFile={verticalCarouselImageFile}
                        icon={Image}
                      />
                      <FileUpload
                        label="Featured Image Banner"
                        accept="image/*"
                        onFileChange={setFeaturedImageBannerFile}
                        currentFile={featuredImageBannerFile}
                        icon={Image}
                      />
                    </div>
                    <YouTubeUrlInput
                      label="Demo Video URL"
                      value={demoVideoUrl}
                      onChange={(e) => setDemoVideoUrl(e.target.value)}
                      error={formErrors.demoVideoUrl}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {formData.thumbnail && !thumbnailFile && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Current Thumbnail</p>
                          <img src={`${baseUrl}${formData.thumbnail}`} alt="Thumbnail" className="w-full h-auto rounded-lg" />
                        </div>
                      )}
                      {formData.coverImage && !coverImageFile && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Current Cover Image</p>
                          <img src={`${baseUrl}${formData.coverImage}`} alt="Cover" className="w-full h-auto rounded-lg" />
                        </div>
                      )}
                      {formData.verticalCarouselImage && !verticalCarouselImageFile && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Current Vertical Carousel Image</p>
                          <img src={`${baseUrl}${formData.verticalCarouselImage}`} alt="Vertical Carousel" className="w-full h-auto rounded-lg" />
                        </div>
                      )}
                      {formData.featuredImageBanner && !featuredImageBannerFile && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Current Featured Image Banner</p>
                          <img src={`${baseUrl}${formData.featuredImageBanner}`} alt="Featured Image Banner" className="w-full h-auto rounded-lg" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "pricing" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pricing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Price *
                        </label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (
                              value === "" ||
                              /^\d+(\.\d{0,2})?$/.test(value)
                            ) {
                              handleInputChange(e);
                            }
                          }}
                          className={`w-full border rounded-lg px-4 py-3 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.price ? "border-red-400" : "border-gray-300 dark:border-gray-600"
                            }`}
                          placeholder="Enter price"
                          required
                          step="0.01"
                          min="0"
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                        {formErrors.price && (
                          <p className="mt-1 text-xs text-red-600">
                            {formErrors.price}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Sale Price
                        </label>
                        <input
                          type="number"
                          name="salePrice"
                          value={formData.salePrice}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (
                              value === "" ||
                              /^\d+(\.\d{0,2})?$/.test(value)
                            ) {
                              handleInputChange(e);
                            }
                          }}
                          className={`w-full border rounded-lg px-4 py-3 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.salePrice ? "border-red-400" : "border-gray-300 dark:border-gray-600"
                            }`}
                          placeholder="Enter Sale price"
                          required
                          step="0.01"
                          min="0"
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                        {formErrors.salePrice && (
                          <p className="mt-1 text-xs text-red-600">
                            {formErrors.salePrice}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Currency
                        </label>
                        <select
                          name="currency"
                          value={formData.currency}
                          onChange={handleInputChange}
                          className="w-full border dark:text-gray-200 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option className="dark:text-black" value="INR">
                            INR (₹)
                          </option>
                        </select>
                      </div>
                    </div>
                    {/* --- Plans Section --- */}
                    <div className="mt-8">
                      <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        Course Plans
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-2">
                        <input
                          type="text"
                          placeholder="Plan Name"
                          value={planForm.name}
                          onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                          className="border rounded px-2 py-2 text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={planForm.price}
                          onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                          className="border rounded px-2 py-2 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          value={planForm.description}
                          onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                          className="border rounded px-2 py-2 text-sm"
                        />
                        <select
                          value={planForm.durationType}
                          onChange={e => setPlanForm({ ...planForm, durationType: e.target.value })}
                          className="border rounded px-2 py-2 text-sm"
                        >
                          <option value="Month">Month</option>
                          <option value="Year">Year</option>
                          <option value="Day">Day</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Duration"
                          value={planForm.duration}
                          onChange={e => setPlanForm({ ...planForm, duration: e.target.value })}
                          className="border rounded px-2 py-2 text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Sale Price"
                          value={planForm.salePrice}
                          onChange={e => setPlanForm({ ...planForm, salePrice: e.target.value })}
                          className="border rounded px-2 py-2 text-sm"
                        />
                        <select
                          value={planForm.status}
                          onChange={e => setPlanForm({ ...planForm, status: e.target.value })}
                          className="border rounded px-2 py-2 text-sm"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddOrUpdatePlan}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        {editingPlanIdx !== null ? "Update Plan" : "Add Plan"}
                      </button>
                      {planFormError && (
                        <div className="text-xs text-red-600 mt-1">{planFormError}</div>
                      )}
                      {plans.length > 0 && (
                        <div className="mt-4">
                          <table className="w-full text-sm border">
                            <thead>
                              <tr className="bg-gray-100 dark:bg-gray-700">
                                <th className="p-2">Name</th>
                                <th className="p-2">Price</th>
                                <th className="p-2">Description</th>
                                <th className="p-2">Duration Type</th>
                                <th className="p-2">Duration</th>
                                <th className="p-2">Sale Price</th>
                                <th className="p-2">Status</th>
                                <th className="p-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {plans.map((plan, idx) => (
                                <tr key={idx}>
                                  <td className="p-2">{plan.name}</td>
                                  <td className="p-2">{plan.price}</td>
                                  <td className="p-2">{plan.description}</td>
                                  <td className="p-2">{plan.durationType}</td>
                                  <td className="p-2">{plan.duration}</td>
                                  <td className="p-2">{plan.salePrice}</td>
                                  <td className="p-2">{plan.status}</td>
                                  <td className="p-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditPlan(idx)}
                                      className="text-blue-500 hover:underline mr-2"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePlan(idx)}
                                      className="text-red-500 hover:underline"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    {/* --- End Plans Section --- */}
                  </div>
                )}

                {activeTab === "features" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Course Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="certificateTemplate"
                          checked={formData.certificateTemplate}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                        />
                        <Award className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          Certificate Available
                        </span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isDownloadable"
                          checked={formData.isDownloadable}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                        />
                        <Download className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          Downloadable Content
                        </span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="courseForum"
                          checked={formData.courseForum}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                        />
                        <MessageCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          Course Forum
                        </span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isPrivate"
                          checked={formData.isPrivate}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                        />
                        <Lock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          Private Course
                        </span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isFeatured"
                          checked={formData.isFeatured}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-yellow-500 border-gray-300 dark:border-gray-600 rounded focus:ring-yellow-500"
                        />
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          Featured Course
                        </span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="enableWaitlist"
                          checked={formData.enableWaitlist}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                        />
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          Enable Waitlist
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === "tags" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Course Tags</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Course Tags *
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {predefinedTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedTags.includes(tag)
                              ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-600"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                              }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customTag}
                          onChange={(e) => setCustomTag(e.target.value)}
                          className="flex-1 border dark:text-gray-200 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Add custom tag"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomTag();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={addCustomTag}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {formErrors.tags && (
                        <p className="mt-1 text-xs text-red-600">
                          {formErrors.tags}
                        </p>
                      )}
                    </div>
                    {selectedTags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Selected Tags:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "seo" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">SEO Content</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        SEO Meta Description
                      </label>
                      <textarea
                        name="seoMetaDescription"
                        value={formData.seoMetaDescription}
                        onChange={handleInputChange}
                        rows={3}
                        className={`w-full border dark:text-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.seoMetaDescription
                          ? "border-red-400"
                          : "border-gray-300 dark:border-gray-600"
                          }`}
                        placeholder="Enter meta description for search engines (max 160 characters)"
                        maxLength={160}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formData.seoMetaDescription.length}/160 characters
                      </p>
                      {formErrors.seoMetaDescription && (
                        <p className="mt-1 text-xs text-red-600">
                          {formErrors.seoMetaDescription}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        SEO Content
                      </label>
                      <QuillEditor
                        value={seoContent}
                        onChange={setSeoContent}
                        placeholder="Add SEO-friendly content for better search rankings..."
                      />
                      {formErrors.seoContent && (
                        <p className="mt-2 text-xs text-red-600">
                          {formErrors.seoContent}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "modules" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Course Modules</h3>
                    {console?.log("modules 0987", modules)}
                     <ModuleSection
                       modules={modules}
                       onModulesChange={handleModulesChange}
                       courseId={courseId}
                       courseData={courseData}
                     />
                  </div>
                )}

                {activeTab === "faqs" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">FAQs</h3>
                    <Faqs courseId={courseId} />
                  </div>
                )}

                {activeTab === "mentor" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mentor Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Mentor Name
                        </label>
                        <input
                          type="text"
                          name="mentorName"
                          value={formData.mentorName || ""}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter mentor name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Mentor Title
                        </label>
                        <input
                          type="text"
                          name="mentorTitle"
                          value={formData.mentorTitle || ""}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Digital Marketing Expert"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Mentor Description
                      </label>
                      <QuillEditor
                        value={formData.mentorDescription || ""}
                        onChange={(value) => setFormData({ ...formData, mentorDescription: value })}
                        placeholder="Enter mentor description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Mentor Image
                      </label>
                      <FileUpload
                        label="Upload Mentor Image"
                        accept="image/*"
                        onFileChange={(file) => {
                          // Handle file upload - you may need to upload it first
                          setFormData({ ...formData, mentorImageFile: file });
                        }}
                        currentFile={formData.mentorImageFile || null}
                        icon={Image}
                      />
                      {formData.mentorImage && (
                        <div className="mt-4">
                          <img
                            src={`${baseUrl}/${formData.mentorImage}`}
                            alt="Current mentor image"
                            className="w-32 h-32 object-cover rounded-lg border dark:border-gray-600"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Mentor Achievements
                      </label>
                      <div className="space-y-2">
                        {(formData.mentorAchievements || []).map((achievement, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={achievement}
                              onChange={(e) => {
                                const updated = [...(formData.mentorAchievements || [])];
                                updated[index] = e.target.value;
                                setFormData({ ...formData, mentorAchievements: updated });
                              }}
                              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter achievement"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (formData.mentorAchievements || []).filter((_, i) => i !== index);
                                setFormData({ ...formData, mentorAchievements: updated });
                              }}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              mentorAchievements: [...(formData.mentorAchievements || []), ""]
                            });
                          }}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Achievement
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Social Links
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">LinkedIn</label>
                          <input
                            type="url"
                            value={formData.mentorSocialLinks?.linkedin || ""}
                            onChange={(e) => setFormData({
                              ...formData,
                              mentorSocialLinks: {
                                ...(formData.mentorSocialLinks || {}),
                                linkedin: e.target.value
                              }
                            })}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                            placeholder="https://linkedin.com/in/..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">YouTube</label>
                          <input
                            type="url"
                            value={formData.mentorSocialLinks?.youtube || ""}
                            onChange={(e) => setFormData({
                              ...formData,
                              mentorSocialLinks: {
                                ...(formData.mentorSocialLinks || {}),
                                youtube: e.target.value
                              }
                            })}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                            placeholder="https://youtube.com/..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Twitter</label>
                          <input
                            type="url"
                            value={formData.mentorSocialLinks?.twitter || ""}
                            onChange={(e) => setFormData({
                              ...formData,
                              mentorSocialLinks: {
                                ...(formData.mentorSocialLinks || {}),
                                twitter: e.target.value
                              }
                            })}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                            placeholder="https://twitter.com/..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Website</label>
                          <input
                            type="url"
                            value={formData.mentorSocialLinks?.website || ""}
                            onChange={(e) => setFormData({
                              ...formData,
                              mentorSocialLinks: {
                                ...(formData.mentorSocialLinks || {}),
                                website: e.target.value
                              }
                            })}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "landingPage" && (
                  <LandingPageSections formData={formData} setFormData={setFormData} />
                )}

                {activeTab === "certificate" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Certificate Settings</h3>

                    {/* Certificate Preview */}
                    {!formData.certificateImage && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Certificate Preview
                        </label>
                        <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-2xl p-8 border-4 border-amber-300">
                          {/* Certificate Header */}
                          <div className="bg-red-600 text-white py-4 px-6 rounded-t-lg mb-6">
                            <h3 className="text-2xl font-bold">
                              {(formData as any).certificateTitle || "Certificate of Completion"}
                            </h3>
                            <p className="text-red-200 text-sm mt-1">
                              {(formData as any).certificateSubtitle || "Awarded for Excellence"}
                            </p>
                          </div>

                          {/* Certificate Body */}
                          <div className="py-8 px-6">
                            <p className="text-gray-800 text-lg leading-relaxed mb-8">
                              {(() => {
                                const recipientName = (formData as any).certificateRecipientName || "Student Name";
                                let description = (formData as any).certificateDescription ||
                                  `This certificate is awarded to **${recipientName}** for successfully completing the course.`;

                                // Replace any instance of "Student Name" (with or without **) with the actual recipient name
                                description = description.replace(/Student Name/g, recipientName);

                                return description.split('**').map((part: string, index: number) =>
                                  index % 2 === 1 ? (
                                    <strong key={index} className="text-amber-700 font-bold">
                                      {part || recipientName}
                                    </strong>
                                  ) : (
                                    <span key={index}>{part}</span>
                                  )
                                );
                              })()}
                            </p>

                            {/* Certificate Footer */}
                            <div className="mt-12 flex justify-between items-end border-t-2 border-amber-300 pt-6">
                              <div className="text-left">
                                <p className="font-bold text-gray-800">
                                  {(formData as any).certificateIssuerName || (formData as any).mentorName || "Instructor"}
                                </p>
                                {((formData as any).certificateIssuerTitle || (formData as any).mentorTitle) && (
                                  <p className="text-sm text-gray-600">
                                    {(formData as any).certificateIssuerTitle || (formData as any).mentorTitle}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-800">
                                  {(formData as any).certificateOrganization || "Lapaas LMS"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          This preview shows how the certificate will look with your current settings. The recipient name shown is the placeholder value.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Certificate Image (Optional - Upload custom certificate design)
                      </label>
                      <FileUpload
                        label="Upload Certificate Image"
                        accept="image/*"
                        onFileChange={(file) => {
                          setFormData({ ...formData, certificateImageFile: file });
                        }}
                        currentFile={formData.certificateImageFile || null}
                        icon={Image}
                      />
                      {formData.certificateImage && (
                        <div className="mt-4">
                          <img
                            src={`${baseUrl}/${formData.certificateImage}`}
                            alt="Current certificate image"
                            className="w-full max-w-md h-auto object-cover rounded-lg border dark:border-gray-600"
                          />
                        </div>
                      )}
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        If you upload a custom certificate image, it will be used instead of the default template.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Certificate Title
                        </label>
                        <input
                          type="text"
                          name="certificateTitle"
                          value={formData.certificateTitle || "Certificate of Completion"}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                          placeholder="Certificate of Completion"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Certificate Subtitle
                        </label>
                        <input
                          type="text"
                          name="certificateSubtitle"
                          value={formData.certificateSubtitle || "Awarded for Excellence"}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                          placeholder="Awarded for Excellence"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Certificate Description
                      </label>
                      <textarea
                        name="certificateDescription"
                        value={formData.certificateDescription || ""}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                        placeholder="This certificate is awarded to **Student Name** for successfully completing the course."
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Use **text** for bold text (e.g., **Student Name** will be bold)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Default Recipient Name (Placeholder)
                        </label>
                        <input
                          type="text"
                          name="certificateRecipientName"
                          value={formData.certificateRecipientName || "Student Name"}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                          placeholder="Student Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Certificate Organization
                        </label>
                        <input
                          type="text"
                          name="certificateOrganization"
                          value={formData.certificateOrganization || "Lapaas LMS"}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                          placeholder="Lapaas LMS"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Issuer Name
                        </label>
                        <input
                          type="text"
                          name="certificateIssuerName"
                          value={formData.certificateIssuerName || formData.mentorName || ""}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                          placeholder="Instructor Name"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Leave empty to use mentor name
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Issuer Title
                        </label>
                        <input
                          type="text"
                          name="certificateIssuerTitle"
                          value={formData.certificateIssuerTitle || formData.mentorTitle || ""}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                          placeholder="Instructor Title"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Leave empty to use mentor title
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "publication" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Publication Status</h3>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                        Publication Status
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                        Choose whether to publish your course immediately or save as draft.
                      </p>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isPublished"
                          checked={formData.isPublished}
                          // Only update local state, do NOT call handleSubmit here
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData((prev) => ({
                              ...prev,
                              isPublished: checked,
                            }));
                            setFormErrors((prev) => ({ ...prev, isPublished: "" }));
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                        />
                        <Eye className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          Publish Course
                        </span>
                      </label>
                    </div>
                    {formData.isPublished && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-900 dark:text-green-300">
                            Ready to Publish
                          </span>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-400">
                          Your course will be visible to students once published.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white rounded-xl shadow-md shadow-[#1b6294]/20 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Update Course
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div >
      </div >
    </>
  );
};

export default EditCourse;