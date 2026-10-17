import React, { useState, ChangeEvent, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store";
import { createNews } from "../../store/slices/news";
import Editor from "../../components/Editor";
import type { OutputData } from "@editorjs/editorjs";
import PopupAlert from "../../components/popUpAlert";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  Save,
  X,
  FileText,
  User,
  Tag,
  Upload,
  Clock,
  TrendingUp,
  Hash,
  Video,
  Calendar,
  Radio,
  Zap,
  MapPin,
} from "lucide-react";

const predefinedTags = [
  "breaking",
  "urgent",
  "exclusive",
  "trending",
  "featured",
  "analysis",
  "opinion",
  "interview",
  "review",
  "investigation",
  "update",
  "announcement",
  "technology",
  "ai",
  "health",
  "sports",
  "politics",
];

export default function AddNews() {
  const dispatch = useDispatch<AppDispatch>();
  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });

  const [headingColor, setHeadingColor] = useState<string>("");
  const [headingRest, setHeadingRest] = useState<string>("");
  const [editorContent, setEditorContent] = useState<OutputData | null>(null);

  const [formData, setFormData] = useState<any>({
    coloredHeading: "",
    restHeading: "",
    title: "",
    summary: "",
    author: "",
    category: "",
    status: "active",
    content: "",
    isScheduled: false,
    scheduledDateTime: "",
    publishedAt: new Date().toISOString().split("T")[0],
    schedulePublication: false,
    source: {
      name: "",
      url: "",
    },
    url: "",
    imageUrl: "",
    videoUrl: "",
    language: "en",
    country: "",
    tags: [],
    isBreaking: false,
    isPremium: false,
    image: null,
    video: null,
  });

  const [tagInput, setTagInput] = useState<string>("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Predefined categories for dropdown
  const PREDEFINED_CATEGORIES = [
    "STARTUP",
    "FUNDING",
    "CASE STUDY",
    "TECHNOLOGY",
    "OTHER"
  ];

  const getMinDateTime = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${h}:${min}`;
  };

  const formatDisplayDateTime = (localOrIso: string) => {
    if (!localOrIso) return "";
    const d = new Date(localOrIso);
    const pad = (n: number) => String(n).padStart(2, "0");
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const handleEditorChange = (data: OutputData) => {
    setEditorContent(data);
  };

  // Helper function to check if editor has meaningful content
  const hasEditorContent = (content: OutputData | null): boolean => {
    if (!content || !content.blocks || content.blocks.length === 0) return false;
    // Check if there's at least one block with actual content
    return content.blocks.some(block => {
      if (block.type === "paragraph") {
        return block.data?.text && block.data.text.trim().length > 0;
      }
      // For other block types (image, video, etc.), consider them as content
      return true;
    });
  };

  // Auto-update title when headings change (only if title is empty)
  useEffect(() => {
    const fullTitle = (headingColor.trim() + " " + headingRest.trim()).trim();
    if (fullTitle) {
      setFormData((prev: any) => {
        // Only update if title is empty or matches the auto-generated title
        if (!prev.title || prev.title === (headingColor.trim() + " " + headingRest.trim()).trim()) {
          return { ...prev, title: fullTitle };
        }
        return prev;
      });
    }
  }, [headingColor, headingRest]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => {
        const newState: any = { ...prev, [name]: checked };

        if (name === "isScheduled") {
          if (!checked) {
            newState.scheduledDateTime = "";
            newState.schedulePublication = false;
          } else {
            newState.schedulePublication = true;
          }
        }

        return newState;
      });
    } else if (name.includes(".")) {
      const parts = name.split(".");
      setFormData((prev: any) => {
        const newData = { ...prev };
        let current: any = newData;
        for (let i = 0; i < parts.length - 1; i++) {
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleVideoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFormData((prev: any) => ({ ...prev, video: file }));
  };

  const handleCoverImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFormData((prev: any) => ({ ...prev, image: file }));
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !formData.tags?.includes(trimmedTag)) {
      setFormData((prev: any) => ({ ...prev, tags: [...(prev.tags || []), trimmedTag] }));
    }
    setTagInput("");
    setShowTagSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev: any) => ({
      ...prev,
      tags: prev.tags?.filter((tag: string) => tag !== tagToRemove) || [],
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && formData.tags?.length) {
      const lastTag = formData.tags[formData.tags.length - 1];
      removeTag(lastTag);
    }
  };

  const getFilteredTagSuggestions = () =>
    tagInput
      ? predefinedTags.filter(
          (t) => t.toLowerCase().includes(tagInput.toLowerCase()) && !formData.tags?.includes(t)
        ).slice(0, 6)
      : [];


  const buildFormData = () => {
    const fd = new FormData();
    
    // Combine coloredHeading and restHeading for title
    const fullTitle = (headingColor.trim() + " " + headingRest.trim()).trim();
    fd.append("title", fullTitle || formData.title || "");
    fd.append("summary", formData.summary || "");
    
    // Main content as JSON (EditorJS OutputData format)
    if (editorContent) {
      fd.append("content", JSON.stringify(editorContent));
    }
    fd.append("author", JSON.stringify({ name: formData.author || "" }));
    fd.append("url", formData.url || fullTitle || "");
    
    // Categories - send as array with single category for backend compatibility
    if (formData.category) {
      fd.append("categories", JSON.stringify([formData.category]));
    }
    
    // Tags
    (formData.tags || []).forEach((tag: string) => fd.append("tags", tag));
    
    fd.append("status", formData.status || "active");
    fd.append("publishedAt", formData.publishedAt || new Date().toISOString().split("T")[0]);
    fd.append("language", formData.language || "en");
    fd.append("isBreaking", String(formData.isBreaking || false));
    fd.append("isPremium", String(formData.isPremium || false));

      // Source
      if (formData.source.name) {
      fd.append("source", JSON.stringify(formData.source));
      }

      // Country
      if (formData.country) {
      fd.append("country", formData.country);
      }

      // Video URL
      if (formData.videoUrl) {
      fd.append("videoUrl", formData.videoUrl);
    }
    
    // Image
    if (formData.image instanceof File) {
      fd.append("image", formData.image);
    } else if (formData.imageUrl) {
      fd.append("imageUrl", formData.imageUrl);
    }
    
    // Video file
    if (formData.video instanceof File) {
      fd.append("video", formData.video);
    }

    return fd;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fd = buildFormData();
    setPopup({ isVisible: false, message: "", type: "" });
    setIsSubmitting(true);
    try {
      await dispatch(createNews(fd)).unwrap();
      setPopup({
        isVisible: true,
        message: "News created successfully!",
        type: "success",
      });
      setTimeout(() => {
        window.location.href = "/news";
      }, 1000);
    } catch (err: any) {
      console.error("Create news failed", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to create news";
      setPopup({
        isVisible: true,
        message: msg,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancel = () => {
    window.location.href = "/blogs";
  };

  return (
    <>
      <PageMeta title="Add Blog | LMS Admin" description="Add new blog article" />
      <PageBreadcrumb pageTitle="Add Blog" />
      <div className="p-6 max-w-7xl mx-auto relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Add New Blog Article</h2>
          <button onClick={cancel} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          {popup.isVisible && (
            <div className={`mb-4 p-3 rounded ${
              popup.type === "error" 
                ? "bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200"
                : "bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200"
            }`}>
              {popup.message}
            </div>
          )}
          {isSubmitting && (
            <div className="absolute inset-0 z-50 bg-black/30 flex items-center justify-center rounded-xl">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin" />
                <p className="text-white mt-2 font-medium">Creating news...</p>
              </div>
            </div>
          )}

          {/* Heading Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                Colored Heading (coloredHeading) *
            </label>
            <input
              type="text"
                value={headingColor}
                onChange={(e) => setHeadingColor(e.target.value)}
                placeholder="Enter colored heading..."
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                Rest of Heading (restHeading)
              </label>
              <input
                type="text"
                value={headingRest}
                onChange={(e) => setHeadingRest(e.target.value)}
                placeholder="Enter rest of heading..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Title (auto-generated or manual) */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
              Title (auto-generated from headings) *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title || (headingColor.trim() + " " + headingRest.trim()).trim()}
              onChange={handleInputChange}
              placeholder="News title..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          {/* Heading Preview */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
            <h3 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {headingColor || "Colored"}
              </span>
              <span className="text-gray-900 dark:text-white"> {headingRest || "Rest of heading"}</span>
            </h3>
          </div>

          {/* Main Content Editor */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 mr-2 text-blue-500" /> Main Article Content *
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">This is the main content of your article (separate from live updates)</p>
            <Editor
              data={undefined}
              onChange={handleEditorChange}
              holder="editorjs-add"
            />
          </div>

          {/* Author / Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 mr-2 text-blue-500" /> Author
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                placeholder="Author name..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="w-4 h-4 mr-2 text-blue-500" /> Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select a category...</option>
                {PREDEFINED_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select a category from the dropdown</p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <Hash className="w-4 h-4 mr-2 text-blue-500" /> Tags
            </label>

            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag: string, idx: number) => (
                  <span key={tag + idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-200">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setShowTagSuggestions(e.target.value.length > 0);
                }}
                onKeyDown={handleTagInputKeyDown}
                onFocus={() => setShowTagSuggestions(tagInput.length > 0)}
                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Type tags and press Enter or comma to add..."
              />

              {showTagSuggestions && getFilteredTagSuggestions().length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto dark:bg-gray-800 dark:border-gray-600">
                  {getFilteredTagSuggestions().map((suggestion, idx) => (
                    <button
                      key={suggestion + idx}
                      type="button"
                      onClick={() => addTag(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm border-b border-gray-100 last:border-b-0 dark:hover:bg-gray-700 dark:text-white"
                    >
                      #{suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Press Enter or comma to add tags</p>
          </div>

          {/* Status / Scheduling / News Type Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" /> Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                disabled={formData.isScheduled}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>

            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4 mr-2 text-blue-500" /> Schedule Publication
              </label>
              <div className="flex items-center h-12">
                <input
                  type="checkbox"
                  name="isScheduled"
                  checked={formData.isScheduled}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Schedule for later</span>
              </div>
            </div>

            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Zap className="w-4 h-4 mr-2 text-red-500" /> Breaking News
              </label>
              <div className="flex items-center h-12">
                <input
                  type="checkbox"
                  name="isBreaking"
                  checked={formData.isBreaking}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Mark as breaking</span>
              </div>
            </div>

            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <TrendingUp className="w-4 h-4 mr-2 text-yellow-500" /> Premium
              </label>
              <div className="flex items-center h-12">
                <input
                  type="checkbox"
                  name="isPremium"
                  checked={formData.isPremium}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Mark as premium</span>
              </div>
            </div>
          </div>

          {/* Scheduling fields */}
          {formData.isScheduled && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border-2 border-blue-300">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2" /> 📅 Schedule Settings
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-1" /> Select Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduledDateTime"
                    value={formData.scheduledDateTime}
                    onChange={handleInputChange}
                    min={getMinDateTime()}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required={formData.isScheduled}
                  />
                  {formData.scheduledDateTime && (
                    <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>📆 Scheduled for:</strong> {formatDisplayDateTime(formData.scheduledDateTime)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cover Image */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <Upload className="w-4 h-4 mr-2 text-blue-500" /> Cover Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverImageUpload}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300"
            />
            {formData.image && formData.image instanceof File && (
              <div className="mt-2">
                <img
                  src={URL.createObjectURL(formData.image)}
                  alt="Cover Preview"
                  className="w-32 h-20 object-cover rounded-lg border-2 border-blue-200"
                />
              </div>
            )}
            {formData.imageUrl && !formData.image && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Or enter image URL
                </label>
                <input
                  type="text"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            )}
          </div>

          {/* Video Upload */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <Video className="w-4 h-4 mr-2 text-blue-500" /> Upload Video (optional)
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300"
            />
            {formData.videoUrl && (
              <div className="mt-2">
                <input
                  type="text"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Or enter video URL (YouTube, etc.)"
                />
              </div>
            )}
          </div>

          {/* Summary */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 mr-2 text-blue-500" /> Summary
            </label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleInputChange}
              placeholder="Brief description of the news..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">A brief summary that will appear in news previews</p>
          </div>

          {/* Source and URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Source Name</label>
              <input
                type="text"
                name="source.name"
                value={formData.source.name}
                onChange={handleInputChange}
                placeholder="News source..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Source URL</label>
              <input
                type="url"
                name="source.url"
                value={formData.source.url}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            </div>

          {/* Language and Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Language</label>
              <select
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="Country..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Published Date */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Published Date</label>
              <input
              type="date"
              name="publishedAt"
              value={formData.publishedAt}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !headingColor.trim() ||
                !hasEditorContent(editorContent) ||
                !(formData.title || (headingColor.trim() + " " + headingRest.trim()).trim())
              }
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-white border-gray-200 rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {formData.isScheduled ? "📅 Schedule News" : "✅ Create News"}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={cancel}
              className="px-6 py-3 border-2 border-red-300 text-red-700 rounded-xl hover:bg-red-50 transition-colors font-semibold dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              ❌ Cancel
            </button>
          </div>
        </form>
      </div>

      <PopupAlert
        isVisible={popup.isVisible}
        message={popup.message}
        type={popup.type}
        onClose={() => setPopup({ isVisible: false, message: "", type: "" })}
      />
    </>
  );
}
