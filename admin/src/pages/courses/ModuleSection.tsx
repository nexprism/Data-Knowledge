import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createModule } from "../../store/slices/module";

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_URL || "";
import {
  createLesson,
  deleteLesson,
  updateLesson,
} from "../../store/slices/lesson";
import { RootState, AppDispatch } from "../../hooks/redux";

import {
  BookOpen,
  Plus,
  X,
  Bold,
  Italic,
  Underline,
  List,
  Link,
  Image,
  Video,
  Eye,
  Trash2,
  Edit,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Play,
  FileText,
  HelpCircle,
  ClipboardList,
  Clock,
  Users,
  Settings,
  ChevronDown,
  ChevronUp,
  GripVertical,
  ArrowRight,
  Folder,
  Zap,
  Package,
} from "lucide-react";

import ModulesTabContent from "../../components/course-module/ModulesTabContent";
import DripTabContent from "../../components/course-module/DripTabContent";
import AssetsTabContent from "../../components/course-module/AssetsTabContent";
import Files from "./components/Files";
import TextLesson from "./components/TextLesson";
import Quiz from "./components/Quiz";
import Assignment from "./components/Assignment";
import VedioLesson from "./components/VideoLesson";
import { useAppDispatch } from "../../hooks/redux";
import PopupAlert from "../../components/popUpAlert";
import { useParams } from "react-router";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "4xl",
  showCloseButton = true,
  footer,
}: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] h-full min-h-[700px] flex bg-[#00000021] bg-opacity-70 items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#00000021] bg-opacity-70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-fit max-h-[70vh] min-h-fit overflow-scroll hide-scrollbar rounded-xl transform scale-95 animate-scale-in
                    max-w-${maxWidth}`}
      >
        {/* Modal Body */}
        <div
          className="  overflow-y-auto custom-scrollbar"
          style={{
            maxHeight:
              "calc(90vh - 120px - (var(--header-height, 0) + var(--footer-height, 0)))",
          }}
        >
          {children}
        </div>

        {/* Modal Footer (Optional) */}
        {footer && (
          <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-200 rounded-b-xl flex justify-end gap-3 shadow-inner">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Module Creation Form Component
const ModuleCreationForm = ({ onModuleCreated, courseId, courseData }) => {
  const dispatch = useDispatch();
  const { loading: moduleLoading } = useSelector((state) => state.module);

  const [moduleData, setModuleData] = useState({
    title: "",
    description: "",
    order: 1,
    estimatedDuration: 60,
    isPublished: true,
    membershipIds: [] as string[],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [popup, setPopup] = useState<{
    message: string;
    type: "success" | "error";
    isVisible: boolean;
  }>({
    message: "",
    type: "success",
    isVisible: false,
  });



  const handleCreateModule = async () => {
    if (!moduleData.title.trim()) {
      setPopup({
        message: "Please enter a module title",
        type: "error",
        isVisible: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token") || "";
      const payload = {
        courseId,
        title: moduleData.title,
        description: moduleData.description,
        order: moduleData.order,
        estimatedDuration: moduleData.estimatedDuration,
        isPublished: moduleData.isPublished,
        membershipIds: moduleData.membershipIds,
        token,
      };

      const result = await dispatch(createModule(payload)).unwrap();

      // Immediate UI update - this will update the UI instantly
      onModuleCreated(result.data || result);

      // Show success feedback
      setPopup({
        message: "Module created successfully!",
        type: "success",
        isVisible: true,
      });

      // Reset form for next module
      setModuleData({
        title: "",
        description: "",
        order: moduleData.order + 1, // Increment order for next module
        estimatedDuration: 60,
        isPublished: true,
        image: null,
        membershipIds: [],
      });
    } catch (error) {
      setPopup({
        message: "Failed to create module. Please try again.",
        type: "error",
        isVisible: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PopupAlert
        message={popup.message}
        type={popup.type}
        isVisible={popup.isVisible}
        onClose={() => setPopup({ ...popup, isVisible: false })}
      />
      <div className="bg-white   dark:bg-white/[0.03] border-2 border-blue-200 rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white/90 mb-2">
            Create New Module
          </h3>
          <p className="text-gray-600 dark:text-white/70">
            First, create your module. Then you'll be able to add lessons to it.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
              Module Title *
            </label>
            <input
              type="text"
              value={moduleData.title}
              onChange={(e) =>
                setModuleData({ ...moduleData, title: e.target.value })
              }
              placeholder="e.g., Introduction to React Basics"
              className="w-full px-4 py-3 border-2 dark:text-white/70 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
              Module Description
            </label>
            <textarea
              value={moduleData.description}
              onChange={(e) =>
                setModuleData({ ...moduleData, description: e.target.value })
              }
              placeholder="Describe what students will learn in this module..."
              className="w-full px-4 py-3 border-2 dark:text-white/70 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
              rows={4}
            />
          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
                Estimated Duration (minutes)
              </label>
              <input
                type="number"
                value={moduleData.estimatedDuration}
                onChange={(e) =>
                  setModuleData({
                    ...moduleData,
                    estimatedDuration: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 dark:text-white/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                min="1"
                placeholder="60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
                Module Order
              </label>
              <input
                type="number"
                value={moduleData.order}
                onChange={(e) =>
                  setModuleData({
                    ...moduleData,
                    order: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 dark:text-white/70  rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                min="1"
                placeholder="1"
              />
            </div>
          </div>

          {/* <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={moduleData.isPublished}
              onChange={(e) =>
                setModuleData({ ...moduleData, isPublished: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="isPublished"
              className="text-gray-700 dark:text-white/70 font-medium"
            >
              Publish module immediately
            </label>
          </div> */}

          {/* Course membership tier access selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
              Restrict to Course Tiers{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            {(courseData?.courseMemberships || []).length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-white/60">
                No course tiers defined yet. Add tiers in the course settings first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {(courseData.courseMemberships || []).map((tier: any) => (
                  <label key={tier._id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(moduleData.membershipIds || []).includes(tier._id)}
                      onChange={(e) => {
                        const current: string[] = moduleData.membershipIds || [];
                        const updated = e.target.checked
                          ? [...current, tier._id]
                          : current.filter((v: string) => v !== tier._id);
                        setModuleData({ ...moduleData, membershipIds: updated });
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-white/80">
                      {tier.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-white/60">
              Only members with these tiers will see this module. Leave empty for all users.
            </p>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={handleCreateModule}
              disabled={isSaving || !moduleData.title.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-semibold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Module...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Module
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const LessonEditor = ({
  lesson,
  moduleId,
  section,
  courseId,
  courseData,
  onChange,
  onRemove,
  onSave,
  isEditing = false,
}) => {
  const dispatch = useAppDispatch();

  const [membershipIds, setMembershipIds] = useState<string[]>(
    (lesson.membershipIds || []).map((m: any) => (typeof m === "string" ? m : m?._id || m))
  );

  useEffect(() => {
    setMembershipIds(
      (lesson.membershipIds || []).map((m: any) => (typeof m === "string" ? m : m?._id || m))
    );
  }, [lesson._id, lesson.id]);

  const toggleMembership = (membershipId: string) => {
    const updated = membershipIds.includes(membershipId)
      ? membershipIds.filter((id) => id !== membershipId)
      : [...membershipIds, membershipId];
    setMembershipIds(updated);
    onChange({ ...lesson, membershipIds: updated });
  };

  const [isSaving, setIsSaving] = useState(false);
  const [savedLessonId, setSavedLessonId] = useState(
    lesson._id || lesson.id || null
  );
  const [popup, setPopup] = useState<{
    message: string;
    type: "success" | "error";
    isVisible: boolean;
  }>({
    message: "",
    type: "success",
    isVisible: false,
  });
  const [showContentModal, setShowContentModal] = useState(false);
  const [OpenLessonData, setOpenLessonData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [lessonImage, setLessonImage] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const params = useParams();
  const courseIdFromParams = params.courseId;

  const handleLessonImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLessonImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      onChange({ ...lesson, image: file });
    }
  };

  const getDisplayImage = () => {
    if (imagePreview) return imagePreview;
    if (lesson.image && typeof lesson.image === "string") {
        if (lesson.image.startsWith("http")) return lesson.image;
        let cleanPath = lesson.image.replace(/\\/g, "/");
        if (cleanPath.includes("/uploads/")) {
            cleanPath = cleanPath.substring(cleanPath.indexOf("/uploads/"));
        } else if (cleanPath.includes("uploads/")) {
            cleanPath = "/" + cleanPath.substring(cleanPath.indexOf("uploads/"));
        }
        let base = "";
        try {
            const url = new URL(import.meta.env.VITE_BASE_URL);
            base = url.origin;
        } catch (e) {
            base = (import.meta.env.VITE_BASE_URL || "").replace(/\/api\/v1\/?$/, "");
        }
        return `${base}${cleanPath.startsWith("/") ? cleanPath : "/" + cleanPath}`;
    }
    return null;
  };

  const getData = async (id) => {
    setShowContentModal(true);
    setOpenLessonData(lesson);
    console.log("OpenLessonData", id);
  };
  console.log("cours", courseData);

  // Mock loading states
  const lessonLoading = false;

  // Determine if this is a new lesson (not saved yet)
  const isNewLesson = !savedLessonId;

  // Extract content IDs based on lesson type
  // Helper to get the correct content object (e.g., quiz, assignment, etc.) by lesson type and lesson ID
  const getContentId = () => {
    switch (lesson.type) {
      case "quiz":
        // If lesson.quiz exists, use its _id, else try to find from courseData
        if (lesson.quiz?._id) return lesson.quiz?._id;
        // Try to find quiz by lesson._id in courseData
        if (courseData?.modules) {
          for (const mod of courseData.modules) {
            if (mod.lessons) {
              for (const l of mod.lessons) {
                if (l._id === lesson._id && l.quiz?._id) {
                  return l.quiz._id;
                }
              }
            }
          }
        }
        return lesson.quizId || null;
      case "assignment":
        console.log("Assignment lesson data:", lesson);
        if (lesson.assignment?._id) return lesson.assignment?._id;
        if (courseData?.modules) {
          for (const mod of courseData.modules) {
            if (mod.lessons) {
              for (const l of mod.lessons) {
                if (l._id === lesson._id && l.assignment?._id) {
                  return l.assignment._id;
                }
              }
            }
          }
        }
        return lesson.assignmentId || lesson.fileId || null;
      case "text":
        // Only return a valid string ID if it exists
        if (lesson.textLessons?.[0]?._id) return lesson.textLessons[0]._id;
        if (courseData?.modules) {
          for (const mod of courseData.modules) {
            if (mod.lessons) {
              for (const l of mod.lessons) {
                if (l._id == lesson._id && l.textLessons && l.textLessons[0]?._id) {
                  return l.textLessons[0]._id;
                }
              }
            }
          }
        }
        // Only return a string if it's a valid ID
        if (typeof lesson.textLessonId === "string" && lesson.textLessonId.length > 0) {
          return lesson.textLessonId;
        }
        return null;
      case "video":
        if (lesson.files?.[0]?._id) return lesson.files?.[0]?._id;
        if (courseData?.modules) {
          for (const mod of courseData.modules) {
            if (mod.lessons) {
              let nu = 1;
              for (const l of mod.lessons) {
                if (l._id === lesson._id && l.files?.[0]?._id) {
                  console.log("Checking lesson ====  : " + nu + "  ", l);
                  return l.files[0]?._id;
                }
                nu++;
              }
            }
          }
          return null;
        }
        return lesson.files?.[0]?._id || null;
      case "video-lesson":
        console.log("lesson.videoLesson", lesson.videoLesson);
        console.log("courseData.modules", courseData?.modules);
        if (lesson.videoLessons?.[0]?._id) return lesson.videoLessons?.[0]?._id;
        if (courseData?.modules) {
          for (const mod of courseData.modules) {
            if (mod.lessons) {
              for (const l of mod.lessons) {
                console.log("Checking lesson:", l);
                if (l._id === lesson._id && l.videoLessons?.[0]?._id) {
                  return l.videoLessons[0]?._id;
                }
              }
            }
          }
        }
        return lesson.videoLessonId || lesson.fileId || null;
      default:
        return null;
    }
  };

  const contentId = getContentId();
  // Only consider as existing content if contentId is a non-empty string
  const hasExistingContent = typeof contentId === "string" && contentId.length > 0;

  const lessonTypeConfig = {
    "video-lesson": {
      icon: Play,
      label: "video-lesson",
      color: "text-red-500 bg-red-50 border-red-200",
    },
    video: {
      icon: Play,
      label: "File",
      color: "text-red-500 bg-red-50 border-red-200",
    },
    text: {
      icon: FileText,
      label: "Text Lesson",
      color: "text-blue-500 bg-blue-50 border-blue-200",
    },
    quiz: {
      icon: HelpCircle,
      label: "Quiz",
      color: "text-green-500 bg-green-50 border-green-200",
    },
    assignment: {
      icon: ClipboardList,
      label: "Assignment",
      color: "text-purple-500 bg-purple-50 border-purple-200",
    },
  };

  const currentConfig = lessonTypeConfig[lesson.type || "video"];

  const handleSaveLesson = async () => {
    if (!lesson.title.trim()) {
      setPopup({
        message: "Please enter a lesson title",
        type: "error",
        isVisible: true,
      });
      return;
    }

    // Debug logging
    console.log("Section value:", section);
    console.log("CourseId value:", courseId);
    console.log("ModuleId value:", moduleId);

    // Determine the correct section/courseId to use
    const sectionToUse = section || courseId || moduleId;

    if (!sectionToUse) {
      console.error("No section/courseId found. Available values:", {
        section,
        courseId,
        moduleId,
      });
      setPopup({
        message: "Error: Missing course/section information. Please try again.",
        type: "error",
        isVisible: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      const lessonData = {
        section: sectionToUse,
        moduleId,
        title: lesson.title,
        description: lesson.content || "",
        type: lesson.type || "video",
        order: lesson.order || 1,
        isRequired: lesson.isRequired || true,
        language: "en",
        image: lesson.image || lessonImage,
        membershipIds,
      };

      console.log("Saving lesson data:", lessonData);

      let result;

      // Check if this is an update (lesson has an ID) or create new lesson
      if (savedLessonId) {
        // Update existing lesson
        const token = localStorage.getItem("token") || "";
        result = await dispatch(
          updateLesson({
            lessonId: savedLessonId,
            lessonData,
            token,
          })
        ).unwrap();

        console.log("Lesson updated successfully:", result);

        // For updates, use the existing lesson ID
        const updatedLesson = {
          ...lesson,
          _id: savedLessonId,
          id: savedLessonId,
          title: lesson.title,
          type: lesson.type,
          order: lesson.order,
          isRequired: lesson.isRequired,
        };

        if (onChange) {
          onChange(updatedLesson);
        }

        setPopup({
          message: "Lesson updated successfully!",
          type: "success",
          isVisible: true,
        });
      } else {
        // Create new lesson
        result = await dispatch(createLesson(lessonData)).unwrap();

        // Extract lesson ID from the response
        const newLessonId = result?.data?._id || result?._id || result?.id;

        if (newLessonId) {
          setSavedLessonId(newLessonId);
          // Update the lesson object with the new ID
          const updatedLesson = {
            ...lesson,
            _id: newLessonId,
            id: newLessonId,
          };

          // Call onSave callback to update parent state immediately (replaces onChange call)
          if (onSave) {
            const enhancedResult = {
              ...result,
              data: {
                ...result?.data,
                _id: newLessonId,
                id: newLessonId,
                title: lesson.title,
                type: lesson.type,
                order: lesson.order,
                isRequired: lesson.isRequired,
              },
            };
            onSave(enhancedResult);
          } else {
            // Fallback to onChange if onSave is not provided
            onChange(updatedLesson);
          }

          setPopup({
            message: "Lesson created successfully!",
            type: "success",
            isVisible: true,
          });

          console.log("Lesson created successfully:", result);
        }
      }
    } catch (error) {
      console.error("Error saving lesson:", error);
      setPopup({
        message: savedLessonId
          ? "Failed to update lesson"
          : "Failed to create lesson",
        type: "error",
        isVisible: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderContentModal = () => {
    // Common props for all content editors
    const commonProps = {
      sectionId: section || courseId,
      lesson: { ...lesson, _id: savedLessonId },
      onChange,
      courseId: courseId || section,
      lessonId: savedLessonId,
      moduleId: moduleId,
      contentId: contentId,
      isEdit: hasExistingContent,
    };

    switch (lesson.type) {
      case "quiz": {
        // Find quiz data and id
        let quizData = lesson.quiz;
        let quizId = lesson.quiz?._id || lesson.quizId;
        if (!quizData && courseData?.modules) {
          for (const mod of courseData.modules) {
            if (mod.lessons) {
              for (const l of mod.lessons) {
                if (l._id === lesson._id && l.quiz) {
                  quizData = l.quiz;
                  quizId = l.quiz._id;
                }
              }
            }
          }
        }
        return (
          <Quiz
            {...commonProps}
            quizId={quizId}
            quizData={quizData}
            onClose={() => {
              setShowContentModal(false);
              setOpenLessonData(null);
            }}
          />
        );
      }
      case "assignment": {
        let assignmentData = lesson.assignment;
        let assignmentId = lesson.assignment?._id || lesson.assignmentId;
        if (!assignmentData && courseData?.modules) {
          for (const mod of courseData.modules) {
            if (mod.lessons) {
              for (const l of mod.lessons) {
                if (l._id === lesson._id && l.assignment) {
                  assignmentData = l.assignment;
                  assignmentId = l.assignment._id;
                }
              }
            }
          }
        }
        return (
          <Assignment
            {...commonProps}
            assignmentId={assignmentId}
            fileId={lesson.fileId}
            assignmentData={assignmentData}
            onClose={() => {
              setShowContentModal(false);
              setOpenLessonData(null);
            }}
          />
        );
      }
      case "text": {
        let textLessonId = contentId; // Use the contentId we already calculated

        // If we don't have contentId, try to find it from lesson data
        if (!textLessonId) {
          textLessonId = lesson.textLessons?.[0]?._id || lesson.textLessonId;

          // Search in courseData modules if still not found
          if (!textLessonId && courseData?.modules) {
            for (const mod of courseData.modules) {
              if (mod.lessons) {
                for (const l of mod.lessons) {
                  if (l._id === lesson._id && l.textLessons) {
                    textLessonId = l.textLessons[0]?._id || l.textLessons._id;
                    break;
                  }
                }
                if (textLessonId) break;
              }
            }
          }
        }

        console.log("Passing textLessonId to TextLesson:", textLessonId);

        return (
          <TextLesson
            section={section || courseId}
            lesson={{ ...lesson, _id: savedLessonId }}
            onChange={onChange}
            courseId={courseId || section}
            lessonId={savedLessonId}
            textLessonId={textLessonId}
            onClose={() => {
              setShowContentModal(false);
              setOpenLessonData(null);
            }}
          />
        );
      }
      case "video-lesson": {
        let videoLessonData = Array.isArray(lesson.videoLessons) ? lesson.videoLessons[0] : lesson.videoLessons;
        let videoLessonId = videoLessonData?._id || lesson.videoLessons?.[0]?._id || lesson.videoLessonId;
        if (!videoLessonData && courseData?.modules) {
          for (const mod of courseData.modules) {
            if (mod.lessons) {
              for (const l of mod.lessons) {
                if (l._id === lesson._id && l.videoLessons) {
                  videoLessonData = Array.isArray(l.videoLessons) ? l.videoLessons[0] : l.videoLessons;
                  videoLessonId = videoLessonData?._id;
                }
              }
            }
          }
        }
        return (
          <VedioLesson
            {...commonProps}
            fileId={videoLessonId}
            videoData={videoLessonData}
            onSaveSuccess={(savedVideo) => {
              if (onChange) {
                onChange({
                  ...lesson,
                  videoLessons: [savedVideo],
                  files: [savedVideo],
                });
              }
            }}
            onClose={() => {
              setShowContentModal(false);
              setOpenLessonData(null);
            }}
          />
        );
      }
      case "video":
      default: {
        let videoData = lesson.files;
        console.log("lesson.video", lesson.video);
        console.log("courseData.modules", courseData?.modules);
        let fileId = lesson.files?.[0]?._id || lesson.fileId;
        if (!videoData && courseData?.modules) {
          for (const mod of courseData.modules) {
            if (mod.lessons) {
              for (const l of mod.lessons) {
                if (l._id === lesson._id && l.files) {
                  videoData = l.files;
                  fileId = l.files._id;
                }
              }
            }
          }
        }
        console.log(
          "Files component - contentId:",
          contentId,
          "fileId:",
          fileId,
          "lesson:",
          lesson
        );
        return (
          <Files
            {...commonProps}
            fileId={contentId || fileId}
            videoData={videoData}
            onClose={() => {
              setShowContentModal(false);
              setOpenLessonData(null);
            }}
          />
        );
      }
    }
  };

  const getActionButtons = () => {
    if (isNewLesson) {
      return (
        <div className="text-center py-6 bg-blue-50 rounded-lg border-2 border-blue-200">
          <AlertCircle className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h4 className="font-semibold text-blue-900 mb-2">
            Save Lesson First
          </h4>
          <p className="text-sm text-blue-700 mb-4">
            Please save the lesson to unlock content creation tools
          </p>
          <button
            type="button"
            onClick={handleSaveLesson}
            disabled={isSaving || !lesson.title?.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Lesson"}
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={() => getData(lesson)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            hasExistingContent
              ? "bg-amber-600 text-white hover:bg-amber-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          <Edit className="w-4 h-4" />
          <span>{hasExistingContent ? "Edit Content" : "Create Content"}</span>
        </button>

        {hasExistingContent && (
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Content Created</span>
            <span className="text-xs text-green-600">
              ID: {contentId.substring(0, 8)}...
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>
    );
  };

  return (
    <>
      <PopupAlert
        message={popup.message}
        type={popup.type}
        isVisible={popup.isVisible}
        onClose={() => setPopup({ ...popup, isVisible: false })}
      />
      <div className="group relative">
        {/* Main Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4">
              {/* Left Side - Lesson Info */}
              <div className="flex items-center space-x-4">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 ${currentConfig?.color} transition-all duration-200`}
                >
                  {currentConfig?.icon && (
                    <currentConfig.icon className="w-6 h-6" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {currentConfig?.label}
                    </h4>
                    {savedLessonId && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></div>
                        Saved
                      </span>
                    )}
                    {hasExistingContent && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Content Ready
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="font-medium">
                      Lesson #{lesson.order || 1}
                    </span>
                    {/* {savedLessonId && (
                      <span className="text-xs">
                        Lesson ID: {savedLessonId.substring(0, 8)}...
                      </span>
                    )}
                    {contentId && (
                      <span className="text-xs">
                        Content ID: {contentId.substring(0, 8)}...
                      </span>
                    )} */}
                  </div>
                </div>
              </div>

              {/* Right Side - Actions */}
              <div className="flex items-center space-x-2">
                {/* Save Button */}
                <button
                  type="button"
                  onClick={handleSaveLesson}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {isSaving ? "Saving..." : savedLessonId ? "Update" : "Save"}
                  </span>
                </button>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={onRemove}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-all duration-200"
                  title="Remove lesson"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Basic Form Section */}
          <div className="p-5 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={lesson.title}
                  onChange={(e) =>
                    onChange({ ...lesson, title: e.target.value })
                  }
                  placeholder="Enter lesson title..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Lesson Type
                </label>
                <select
                  value={lesson.type || "video"}
                  onChange={(e) =>
                    onChange({ ...lesson, type: e.target.value })
                  }
                  disabled={savedLessonId}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base ${
                    savedLessonId
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <option value="video-lesson">ðŸŽ¬ Video Lesson</option>
                  <option value="video">ðŸ“¹ File</option>
                  <option value="text">ðŸ“„ Text Lesson</option>
                  <option value="quiz">â“ Quiz</option>
                  <option value="assignment">ðŸ“‹ Assignment</option>
                </select>
                {savedLessonId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Lesson type cannot be changed after creation
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Lesson Order
                </label>
                <input
                  type="number"
                  value={lesson.order || 1}
                  onChange={(e) =>
                    onChange({
                      ...lesson,
                      order: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base"
                  min="1"
                  placeholder="1"
                />
              </div>
            </div>

            {/* Lesson Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Image
              </label>
              <div className="flex flex-col sm:flex-row items-start gap-4 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition-colors">
                <div className="w-full sm:w-48 h-32 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center shrink-0">
                  {getDisplayImage() ? (
                    <img
                      src={getDisplayImage()}
                      alt="Lesson Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="w-10 h-10 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <label
                      htmlFor={`lesson-image-${moduleId}-${lesson.order}`}
                      className="cursor-pointer px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      {getDisplayImage() ? "Change Image" : "Upload Image"}
                      <input
                        id={`lesson-image-${moduleId}-${lesson.order}`}
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleLessonImageChange}
                      />
                    </label>
                    {getDisplayImage() && (
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setLessonImage(null);
                          onChange({ ...lesson, image: null });
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG or GIF. Max 10MB. This image will be displayed on the course landing page lessons.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons Section */}
            {getActionButtons()}

            {/* Settings Section */}
            {showSettings && savedLessonId && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h5 className="text-sm font-semibold text-gray-900 mb-4">
                  Lesson Settings
                </h5>
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lesson.isRequired || true}
                      onChange={(e) =>
                        onChange({ ...lesson, isRequired: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Required Lesson
                    </span>
                  </label>

                  <div className="flex items-center space-x-3">
                    <label className="text-sm font-medium text-gray-700">
                      Display Order:
                    </label>
                    <input
                      type="number"
                      value={lesson.order || 1}
                      onChange={(e) =>
                        onChange({
                          ...lesson,
                          order: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      min="1"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Restrict to Course Tiers{" "}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </p>
                  {(courseData?.courseMemberships || []).length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No course tiers defined yet. Add tiers in the course settings first.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-4">
                      {(courseData.courseMemberships || []).map((tier: any) => (
                        <label key={tier._id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={membershipIds.includes(tier._id)}
                            onChange={() => toggleMembership(tier._id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{tier.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Only members with these tiers will see this lesson. Leave empty for all users.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Modal */}
      <Modal
        isOpen={showContentModal}
        onClose={() => setShowContentModal(false)}
        title={`${hasExistingContent ? "Edit" : "Create"} ${
          currentConfig?.label
        } Content`}
        maxWidth="6xl"
      >
        <div className="space-y-6">
          {/* Lesson Info Header */}

          {/* Content Form */}
          {renderContentModal()}
        </div>
      </Modal>
    </>
  );
};

const SavedModuleDisplay = ({
  module,
  courseId,
  courseData,
  onAddLesson,
  onLessonChange,
  onLessonRemove,
  isEditing = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false); // Changed to false by default
  const totalLessons = module.lessons?.length || 0;

  const addLesson = () => {
    const newLesson = {
      title: "",
      content: "",
      type: "video",
      order: totalLessons + 1,
      isRequired: true,
      _id: null, // Initially null, will be set after saving
    };
    onAddLesson(newLesson);
  };

  // Extract courseId from multiple possible sources
  const extractedCourseId =
    courseId ||
    module?.courseId ||
    module?.module?.courseId ||
    module?.course?.id ||
    module?.course?._id;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Module Header - Always Visible */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex sm:flex-row items-center sm:items-center justify-between gap-4">
          {/* Left Side - Thumbnail + Module Info */}
          <div className="flex items-center gap-3">
            {/* Module Thumbnail */}
            {(() => {
              const imgSrc = module.image || module?.module?.image;
              if (!imgSrc) return null;
              
              let src = "";
              if (imgSrc.startsWith("http")) {
                src = imgSrc;
              } else {
                // Handle absolute Windows paths (e.g. D:\...\uploads\...)
                let cleanPath = imgSrc.replace(/\\/g, "/");
                if (cleanPath.includes("/uploads/")) {
                  cleanPath = cleanPath.substring(cleanPath.indexOf("/uploads/"));
                } else if (cleanPath.includes("uploads/")) {
                  cleanPath = "/" + cleanPath.substring(cleanPath.indexOf("uploads/"));
                }

                // Use the origin of VITE_BASE_URL as base (e.g. http://localhost:5000)
                let base = "";
                try {
                  const url = new URL(import.meta.env.VITE_BASE_URL);
                  base = url.origin;
                } catch (e) {
                  base = (import.meta.env.VITE_BASE_URL || "").replace(/\/api\/v1\/?$/, "");
                }

                const path = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
                src = `${base}${path}`;
              }
              return (
                <img
                  src={src}
                  alt={module.title || "Module thumbnail"}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-200 shadow-sm"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              );
            })()}
            <h3 className="text-lg font-medium text-gray-900">
              {module.title || module.module?.title || "Untitled Module"}
            </h3>
          </div>

          <div className="flex items-center space-x-3">
            {/* Chevron Icon */}
            {/* <div className="flex items-center justify-center w-6 h-6">
                            <svg 
                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div> */}

            {/* Module Title */}
            {/* <h3 className="text-lg font-medium text-gray-900">{module.title}</h3> */}
          </div>

          {/* Right Side - Lesson Count */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-blue-600 font-medium">
              {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center justify-center w-6 h-6">
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isExpanded ? "rotate-90" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Content with Smooth Animation */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-fit opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-6">
            {/* Module Description */}
            {(module.description || module.module?.description) && (
              <div className="mb-6">
                <p className="text-gray-600">
                  {module.description || module.module?.description}
                </p>
              </div>
            )}

            {/* Module Stats */}
            <div className="flex items-center space-x-6 mb-6 text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {module.estimatedDuration ||
                    module.module?.estimatedDuration ||
                    60}{" "}
                  minutes
                </span>
              </div>

              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  (
                    module.isPublished !== undefined
                      ? module.isPublished
                      : module.module?.isPublished
                  )
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    (
                      module.isPublished !== undefined
                        ? module.isPublished
                        : module.module?.isPublished
                    )
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                ></div>
                {(
                  module.isPublished !== undefined
                    ? module.isPublished
                    : module.module?.isPublished
                )
                  ? "Published"
                  : "Draft"}
              </div>
            </div>

            {/* Section Header */}
            <div className="flex sm:items-center justify-between flex-col items-start sm:flex-row gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900">
                  Lessons{" "}
                  {totalLessons > 0 && (
                    <span className="text-gray-500">({totalLessons})</span>
                  )}
                </h4>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addLesson();
                }}
                className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Lesson</span>
              </button>
            </div>

            {/* Lessons List */}
            <div className="space-y-6">
              {module.lessons?.map((lesson, idx) => (
                <LessonEditor
                  key={lesson._id || lesson.id || idx}
                  lesson={lesson}
                  moduleId={module?.module?._id || module?._id}
                  section={extractedCourseId}
                  courseId={extractedCourseId}
                  courseData={courseData}
                  onChange={(l) => onLessonChange(idx, l)}
                  onRemove={() => onLessonRemove(idx)}
                  isEditing={isEditing}
                  onSave={(savedLesson) => {
                    // Extract lesson data from the API response properly
                    const lessonData = savedLesson?.data || savedLesson;
                    const updatedLesson = {
                      ...lesson, // Keep existing lesson properties
                      _id: lessonData._id || lessonData.id,
                      id: lessonData._id || lessonData.id,
                      title: lessonData.title || lesson.title,
                      type: lessonData.type || lesson.type,
                      order: lessonData.order || lesson.order,
                      image: lessonData.image || lesson.image,
                      isRequired:
                        lessonData.isRequired !== undefined
                          ? lessonData.isRequired
                          : lesson.isRequired,
                    };
                    // Update the lesson with the properly structured saved data
                    onLessonChange(idx, updatedLesson);
                  }}
                />
              ))}

              {/* Empty State */}
              {totalLessons === 0 && (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-10 h-10 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Ready to Create Lessons!
                  </h4>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Your module is set up and ready. Start building your course
                    content by adding your first lesson.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addLesson();
                    }}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add First Lesson</span>
                  </button>
                </div>
              )}
            </div>

             <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addLesson();
                }}
                className="flex mt-4 items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Lesson</span>
              </button>
            
          </div>
        </div>
      </div>
    </div>
  );
};
// Main Enhanced Module Section Component
const ModuleSection = ({
  courseId,
  modules = [],
  onModulesChange,
  courseData,
  isEditing = false,
}: any) => {
  const { loading: moduleLoading, error: moduleError } = useSelector(
    (state) => state.module
  );
  const { loading: lessonLoading, error: lessonError } = useSelector(
    (state) => state.lesson
  );
  console.log("courseData", courseData);

  const [savedModules, setSavedModules] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState("modules"); // Add this new state
  const dispatch = useAppDispatch();
  const [popup, setPopup] = useState<{
    message: string;
    type: "success" | "error";
    isVisible: boolean;
  }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  // Initialize modules from props when component mounts or modules prop changes
  useEffect(() => {
    if (modules && modules.length > 0) {
      setSavedModules(modules);
    }
  }, [modules]);

  const handleModuleCreated = async (newModule: any) => {
    // Debug logging to see the structure
    console.log("New module received:", newModule);

    // Immediate UI update - normalize the module structure
    const moduleWithLessons = {
      // Ensure all required properties are available at the top level
      _id: newModule._id || newModule.id,
      id: newModule._id || newModule.id,
      title: newModule.title,
      description: newModule.description || "",
      order: newModule.order || 1,
      estimatedDuration: newModule.estimatedDuration || 60,
      isPublished: newModule.isPublished || false,
      courseId: newModule.courseId || courseId,
      lessons: [], // Start with empty lessons array

      // Keep the original module data for reference
      module: newModule,

      // Include any other properties from the response
      ...newModule,
    };

    console.log("Processed module:", moduleWithLessons);

    const updatedModules = [...savedModules, moduleWithLessons];

    // Update state immediately for instant UI feedback
    setSavedModules(updatedModules);
    setShowCreateForm(false);

    // Show success popup
    setPopup({
      message: "Module created successfully!",
      type: "success",
      isVisible: true,
    });

    // Call parent callback for immediate update
    if (onModulesChange) {
      onModulesChange(updatedModules);
    }

    // No automatic refresh - keep changes purely local for better performance
  };

  const addLessonToModule = (moduleIndex: number, newLesson: any) => {
    const updatedModules = savedModules.map((module, idx) =>
      idx === moduleIndex
        ? { ...module, lessons: [...(module.lessons || []), newLesson] }
        : module
    );

    // Immediate UI update
    setSavedModules(updatedModules);

    // Update parent immediately
    if (onModulesChange) {
      onModulesChange(updatedModules);
    }
  };

  const updateLessonInModule = (
    moduleIndex: number,
    lessonIndex: number,
    updatedLesson: any
  ) => {
    const updatedModules = savedModules.map((module, idx) =>
      idx === moduleIndex
        ? {
            ...module,
            lessons: (module.lessons || []).map((lesson: any, lIdx: number) =>
              lIdx === lessonIndex ? updatedLesson : lesson
            ),
          }
        : module
    );

    // Immediate UI update
    setSavedModules(updatedModules);

    // Update parent immediately
    if (onModulesChange) {
      onModulesChange(updatedModules);
    }
  };

  const removeLessonFromModule = (moduleIndex: number, lessonIndex: number) => {
    if (window.confirm("Are you sure you want to delete this lesson?")) {
      const lessonToDelete = savedModules[moduleIndex].lessons[lessonIndex];
      const lessonId = lessonToDelete._id || lessonToDelete.id;

      const updatedModules = savedModules.map((module, idx) =>
        idx === moduleIndex
          ? {
              ...module,
              lessons: (module.lessons || []).filter(
                (_: any, lIdx: number) => lIdx !== lessonIndex
              ),
            }
          : module
      );

      // Immediate UI update
      setSavedModules(updatedModules);

      // Update parent immediately
      if (onModulesChange) {
        onModulesChange(updatedModules);
      }

      // Delete from backend (but don't wait for it)
      if (lessonId) {
        console.log("Removing lesson with ID:", lessonId);
        dispatch(deleteLesson(lessonId));
      }
    }
  };

  const totalModules = savedModules.length;
  const publishedModules = savedModules.filter((m) => m.isPublished).length;
  const totalLessons = savedModules.reduce(
    (sum, m) => sum + (m.lessons?.length || 0),
    0
  );

  // Tab configuration
  const tabs = [
    {
      id: "modules",
      label: "Modules",
      icon: BookOpen,
      color: "blue",
    },
    {
      id: "drip",
      label: "Drip",
      icon: Zap,
      color: "purple",
    },
    {
      id: "assets",
      label: "Assets",
      icon: Package,
      color: "green",
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "modules":
        return (
          <ModulesTabContent
            totalModules={totalModules}
            publishedModules={publishedModules}
            totalLessons={totalLessons}
            showCreateForm={showCreateForm}
            ModuleCreationForm={ModuleCreationForm}
            handleModuleCreated={handleModuleCreated}
            courseId={courseId}
            courseData={courseData}
            savedModules={savedModules}
            SavedModuleDisplay={SavedModuleDisplay}
            addLessonToModule={addLessonToModule}
            updateLessonInModule={updateLessonInModule}
            removeLessonFromModule={removeLessonFromModule}
            moduleLoading={moduleLoading}
            moduleError={moduleError}
            setShowCreateForm={setShowCreateForm}
            isEditing={isEditing}
          />
        );

      case "drip":
        return <DripTabContent />;

      case "assets":
        return <AssetsTabContent courseID={courseId} />;

      default:
        return null;
    }
  };

  return (
    <>
      <PopupAlert
        message={popup.message}
        type={popup.type}
        isVisible={popup.isVisible}
        onClose={() => setPopup({ ...popup, isVisible: false })}
      />
      <div className="bg-gradient-to-br from-gray-50 to-white dark:from-white/[0.03] dark:to-white/[0.03] rounded-2xl shadow-xl p-2 sm:p-8">
        <div className="mb-8">
          {/* Header Section */}
          <div className="flex sm:items-center justify-between flex-col items-start sm:flex-row gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white/90 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                Course Content
              </h2>
              <p className="text-gray-600 dark:text-white/70 mt-2">
                Build and manage your course content
              </p>
            </div>
            {activeTab === "modules" && !showCreateForm && (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Create Module
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 dark:bg-white/[0.06] p-1 rounded-xl">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 flex-1 justify-center ${
                      isActive
                        ? `bg-white dark:bg-white/[0.1] shadow-sm text-${tab.color}-600 border border-${tab.color}-200`
                        : "text-gray-600 dark:text-white/70 hover:text-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.06] dark:hover:text-white/90"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    {tab.id === "modules" && totalModules > 0 && (
                      <span
                        className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                          isActive
                            ? `bg-${tab.color}-100 text-${tab.color}-700`
                            : "bg-gray-200  text-gray-600"
                        }`}
                      >
                        {totalModules}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-fit">
            {/* <div className="min-h-[400px]"> */}
            {renderTabContent()}
          </div>
        </div>
      </div>
    </>
  );
};

export default ModuleSection;
           
