import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BookOpen,
  FileText,
  Upload,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Save,
  Clock,
  Target,
  Trophy,
  Globe,
  Paperclip,
  GraduationCap,
  Timer,
  RotateCcw,
  Sparkles
} from "lucide-react";
import {
  createAssignment,
  updateAssignment,
  fetchAssignmentById,
} from "../../../store/slices/assignment";
const baseUrl = (import.meta.env.VITE_BASE_URL || "https://api.dataknowledge.in/").replace(/\/+$/, '') + '/';

// Enhanced popup component similar to TextLesson component
interface EnhancedPopupProps {
  isVisible: boolean;
  message: string;
  type: "success" | "error" | "warning" | "info";
  onClose: () => void;
  autoClose?: boolean;
}

const EnhancedPopup: React.FC<EnhancedPopupProps> = ({ isVisible, message, type, onClose, autoClose = true }) => {
  useEffect(() => {
    if (isVisible && autoClose && type === "success") {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, type, onClose]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800";
      case "error":
        return "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-800";
      case "warning":
        return "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-800";
      case "info":
        return "bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case "info":
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 md:pt-20">
      <div className={`w-full max-w-sm md:max-w-md rounded-xl border-2 p-4 md:p-6 shadow-xl transform transition-all duration-300 scale-100 ${getTypeStyles()}`}>
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {type === "success" && (
          <div className="mt-4 bg-white bg-opacity-60 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-green-700">
              <Clock className="w-4 h-4" />
              <span>Assignment saved successfully</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface AddAssignmentFormProps {
  courseId: string;
  lessonId: string;
  assignmentId?: string; // If provided, edit mode
  onClose?: () => void;
  onSaveSuccess?: (data: any) => void;
  showSuccessPopup?: boolean; // New prop to control popup display
}

export default function AddAssignmentForm({
  courseId,
  lessonId,
  assignmentId,
  onClose,
  onSaveSuccess,
  showSuccessPopup = true, // Default to true for backward compatibility
}: AddAssignmentFormProps) {
  const dispatch = useDispatch();
  const { loading, error, data } = useSelector(
    (state: any) => state.assignment
  );
  console.log("assignmentId", assignmentId);
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    language: "English",
    description: "",
    score: "",
    maxScore: "",
    duration: "",
    maxAttempts: "",
    materials: "",
    file: null as File | null,
    document: null as File | null,
  });

  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false); // Track if form was actually submitted

  // Fetch assignment if editing
  const getData = async () => {
    const response = await dispatch(fetchAssignmentById(assignmentId) as any);
    console.log("Fetched assignment data: -------------", response);

    const data = response.payload.data;
    setFormData({
      title: data.title || "",
      subject: data.subject || "",
      language: data.language || "English",
      description: data.description || "",
      score: data.score?.toString() || "",
      maxScore: data.maxScore?.toString() || "",
      duration: data.duration?.toString() || "",
      materials: data.materials || "",
      file: data.attachmentFile || null,
      maxAttempts: data.maxAttempts || "",
      document: data.documentFile || null,
    });
  };

  useEffect(() => {
    if (assignmentId) {
      setIsEditMode(true);
      console.log(`Fetching assignment with ID: ${assignmentId}`);
      getData();
    } else {
      setIsEditMode(false);
    }
  }, [assignmentId, dispatch]);

  // Prefill form in edit mode
  useEffect(() => {
    if (isEditMode && data && Array.isArray(data)) {
      const assignment = data.find((a: any) => a._id === assignmentId);
      console.log("Fetched assignment data:", assignment);
      if (assignment) {
        setFormData({
          title: assignment.title || "",
          subject: assignment.subject || "",
          language: assignment.language || "English",
          description: assignment.description || "",
          score: assignment.score?.toString() || "",
          maxScore: assignment.maxScore?.toString() || "",
          duration: assignment.duration?.toString() || "",
          materials: assignment.materials || "",
          maxAttempts: assignment.maxAttempts || "",
          file: null,
          document: null,
        });
      }
    }
  }, [isEditMode, data, assignmentId]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "file" | "document"
  ) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      [type]: file,
    }));
  };

  const removeFile = (type: "file" | "document") => {
    setFormData((prev) => ({
      ...prev,
      [type]: null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormSubmitted(true); // Mark that form was actually submitted

    const apiFormData = new FormData();
    apiFormData.append("courseId", courseId);
    apiFormData.append("lessonId", lessonId);
    apiFormData.append("title", formData.title);
    apiFormData.append("subject", formData.subject);
    apiFormData.append("language", formData.language);
    apiFormData.append("description", formData.description);
    apiFormData.append("maxAttempts", formData.maxAttempts || "1");
    if (formData.score) apiFormData.append("score", formData.score);
    if (formData.maxScore) apiFormData.append("maxScore", formData.maxScore);
    if (formData.duration) apiFormData.append("duration", formData.duration);
    if (formData.materials) apiFormData.append("materials", formData.materials);
    if (formData.file) apiFormData.append("attachmentFile", formData.file);
    if (formData.document)
      apiFormData.append("documentFile", formData.document);

    try {
      let result;
      if (isEditMode && assignmentId) {
        result = await dispatch(
          updateAssignment({ id: assignmentId, formData: apiFormData }) as any
        );
      } else {
        result = await dispatch(createAssignment(apiFormData) as any);
      }

      if (
        (isEditMode && updateAssignment.fulfilled.match(result)) ||
        (!isEditMode && createAssignment.fulfilled.match(result))
      ) {
        // Only show popup if showSuccessPopup is true and form was actually submitted
        if (showSuccessPopup && isFormSubmitted) {
          setPopup({
            isVisible: true,
            message: `Assignment ${
              isEditMode ? "updated" : "created"
            } successfully!`,
            type: "success",
          });
        }

        setFormData({
          title: "",
          subject: "",
          language: "English",
          description: "",
          score: "",
          maxScore: "",
          duration: "",
          materials: "",
          file: null,
          document: null,
          maxAttempts: "",
        });

        if (onSaveSuccess) onSaveSuccess(result.payload);

        // Only show popup timeout if popup is visible
        if (showSuccessPopup && isFormSubmitted) {
          setTimeout(() => {
            setPopup({ isVisible: false, message: "", type: "" });
            if (onClose) onClose();
          }, 1500);
        } else {
          // Close immediately if no popup needed
          if (onClose) onClose();
        }
      }
    } catch (err) {
      // Always show error popup regardless of showSuccessPopup setting
      setPopup({
        isVisible: true,
        message: `Failed to ${
          isEditMode ? "update" : "create"
        } Assignment. Please try again.`,
        type: "error",
      });
    }
  };

  return (
    <>
      <div className="w-full max-w-7xl mx-auto  max-h-[700px]">
        {/* Enhanced Header - Responsive */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 sm:p-6 text-white">
            <div className="flex sm:flex-row items-center sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
                    {isEditMode ? "Edit Assignment" : "Create New Assignment"}
                  </h2>
                  <p className="text-purple-100 text-xs sm:text-sm mt-1 hidden sm:block">
                    {isEditMode ? "Update assignment details and settings" : "Design engaging assignments for students"}
                  </p>
                </div>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center hover:bg-opacity-30 transition-all duration-200"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </button>
              )}
            </div>
          </div>

          {/* Content - Responsive */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 !pb-36 sm:space-y-8 max-h-[600px] overflow-y-auto">
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Mobile/Tablet responsive grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Left Column */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Assignment Title */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Target className="w-4 h-4" />
                      Assignment Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 disabled:bg-gray-50 text-sm sm:text-base"
                      placeholder="Enter assignment title"
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Globe className="w-4 h-4" />
                      Language
                    </label>
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-sm sm:text-base"
                      disabled={loading}
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                    </select>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <BookOpen className="w-4 h-4" />
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 disabled:bg-gray-50 text-sm sm:text-base"
                      placeholder="Assignment subject"
                      disabled={loading}
                    />
                  </div>

                  {/* Scoring Section - Responsive */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Trophy className="w-4 h-4" />
                          Total Marks
                        </label>
                        <input
                          type="number"
                          name="maxScore"
                          value={formData.maxScore}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 disabled:bg-gray-50 text-sm sm:text-base"
                          placeholder="250"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Target className="w-4 h-4" />
                          Pass Marks
                        </label>
                        <input
                          type="number"
                          name="score"
                          value={formData.score}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 disabled:bg-gray-50 text-sm sm:text-base"
                          placeholder="100"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Timer className="w-4 h-4" />
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 disabled:bg-gray-50 text-sm sm:text-base"
                          placeholder="60"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <RotateCcw className="w-4 h-4" />
                          Max Attempts
                        </label>
                        <input
                          type="number"
                          name="maxAttempts"
                          value={formData.maxAttempts || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 disabled:bg-gray-50 text-sm sm:text-base"
                          placeholder="3"
                          min={1}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Description */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FileText className="w-4 h-4" />
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none disabled:bg-gray-50 transition-all duration-200 text-sm sm:text-base"
                      placeholder="A homework is to be completed on your course of CSS and research yourself that you've got this! Please send your homework as soon as possible. Regards."
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Materials */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Paperclip className="w-4 h-4" />
                      Materials
                    </label>
                    <input
                      type="text"
                      name="materials"
                      value={formData.materials}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 disabled:bg-gray-50 text-sm sm:text-base"
                      placeholder="Required materials or resources"
                      maxLength={255}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* File Uploads - Full width */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* File Upload */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Upload className="w-4 h-4" />
                      Attachment File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-4 sm:p-6 bg-gray-50 hover:bg-gray-100 transition-all duration-200">
                      {formData.file ? (
                        <div className="flex sm:flex-row items-center sm:items-center justify-between gap-4 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                          <a
                            href={`${baseUrl}/${formData.file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-700 hover:text-blue-900 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm font-medium truncate">
                              {formData.file instanceof File ? formData.file.name : String(formData.file)}
                            </span>
                          </a>
                          <button
                            type="button"
                            onClick={() => removeFile("file")}
                            className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                            disabled={loading}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mx-auto mb-2 sm:mb-3" />
                          <p className="text-sm font-medium text-gray-700 mb-1">Choose Attachment</p>
                          <p className="text-xs text-gray-500 mb-3">Upload related files or resources</p>
                          <input
                            type="file"
                            onChange={(e) => handleFileChange(e, "file")}
                            className="hidden"
                            id="file-upload"
                            disabled={loading}
                          />
                          <label
                            htmlFor="file-upload"
                            className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-colors ${
                              loading ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            Browse Files
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Upload */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FileText className="w-4 h-4" />
                      Document File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-4 sm:p-6 bg-gray-50 hover:bg-gray-100 transition-all duration-200">
                      {formData.document ? (
                        <div className="flex sm:flex-row items-center sm:items-center justify-between gap-4 bg-green-50 border border-green-200 p-3 rounded-lg">
                          <a
                            href={`${baseUrl}/${formData.document}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-green-700 hover:text-green-900 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm font-medium truncate">
                              {formData.document instanceof File ? formData.document.name : String(formData.document)}
                            </span>
                          </a>
                          <button
                            type="button"
                            onClick={() => removeFile("document")}
                            className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                            disabled={loading}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mx-auto mb-2 sm:mb-3" />
                          <p className="text-sm font-medium text-gray-700 mb-1">Upload Document</p>
                          <p className="text-xs text-gray-500 mb-3">PDF, DOC, DOCX, TXT files</p>
                          <input
                            type="file"
                            onChange={(e) => handleFileChange(e, "document")}
                            className="hidden"
                            id="document-upload"
                            accept=".pdf,.doc,.docx,.txt"
                            disabled={loading}
                          />
                          <label
                            htmlFor="document-upload"
                            className={`inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 cursor-pointer transition-colors ${
                              loading ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            Browse Documents
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Enhanced Footer - Responsive */}
          <div className="bg-gradient-to-r from-gray-50 fixed bottom-0 w-full to-slate-50 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-600 order-2 sm:order-1">
                <span className="text-red-500">*</span> Required fields
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 order-1 sm:order-2">
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 border border-transparent rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      <span>{isEditMode ? "Updating..." : "Saving..."}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isEditMode ? "Update Assignment" : "Create Assignment"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Popup - Responsive */}
      <EnhancedPopup
        message={popup.message}
        type={popup.type}
        isVisible={popup.isVisible}
        onClose={() => setPopup({ isVisible: false, message: "", type: "" })}
      />
    </>
  );
}
