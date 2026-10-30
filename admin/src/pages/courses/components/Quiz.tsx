import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BookOpen,
  FileText,
  Clock,
  CheckCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  HelpCircle,
  AlertCircle,
  Eye,
  Settings,
  FolderPlus,
  Folder,
  ChevronDown,
  ChevronUp,
  Target,
  Trophy,
  Timer,
  Brain,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  createQuiz,
  upadateQuiz,
  fetchQuizById,
} from "../../../store/slices/quiz";

// Enhanced popup component similar to TextLesson and Assignment components
interface EnhancedPopupProps {
  isVisible: boolean;
  message: string;
  type: "success" | "error" | "warning" | "info";
  onClose: () => void;
  autoClose?: boolean;
}

const EnhancedPopup: React.FC<EnhancedPopupProps> = ({
  isVisible,
  message,
  type,
  onClose,
  autoClose = true,
}) => {
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
      <div
        className={`w-full max-w-sm md:max-w-md rounded-xl border-2 p-4 md:p-6 shadow-xl transform transition-all duration-300 scale-100 ${getTypeStyles()}`}
      >
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="flex-1">
            <p className="text-sm font-medium leading-relaxed">{message}</p>
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
              <span>Quiz saved successfully</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Types
type QuestionType = {
  question: string;
  options: string[] | OptionType[];
  correctAnswer: string;
};

type OptionType = {
  label: string;
  text: string;
};

type SectionType = {
  sectionTitle: string;
  sectionDescription: string;
  questions: QuestionType[];
};

type LessonType = {
  quizTitle?: string;
  quizDuration?: number | string;
  quizDifficulty?: string;
  passMark?: number;
  quizDescription?: string;
  sections?: SectionType[];
  isTestSeries?: boolean;
};

interface RootState {
  quiz: {
    loading: boolean;
    error: string | null;
    data: any;
  };
}

// Props for the Quiz component when used as a modal
type QuizModalProps = {
  sectionId: string;
  lessonId: string;
  lesson?: LessonType;
  quizId?: string; // If provided, component will edit existing quiz
  onClose: () => void;
  onSaveSuccess?: (data: any) => void;
};

const Quiz = ({
  sectionId,
  lessonId,
  lesson,
  quizId,
  onClose,
  onSaveSuccess,
}: QuizModalProps) => {
  const dispatch = useDispatch();
  const {
    loading,
    error: saveError,
    data: saveData,
  } = useSelector((state: RootState) => state.quiz);

  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [showSectionBuilder, setShowSectionBuilder] = useState(false);
  const [sections, setSections] = useState<SectionType[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<{
    sectionIndex: number;
    questionIndex: number;
  } | null>(null);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [activeQuestionSectionIndex, setActiveQuestionSectionIndex] =
    useState<number>(0);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  const [quizData, setQuizData] = useState({
    quizTitle: "",
    quizDuration: "",
    quizDifficulty: "",
    passMark: 70,
    quizDescription: "",
    courseId: "",
    courseTitle: "",
    lessonTitle: "",
    totalMarks: 100,
    isTestSeries: false,
  });

  const [popup, setPopup] = useState<{
    isVisible: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info" | "";
  }>({
    isVisible: false,
    message: "",
    type: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasSaveAttempted, setHasSaveAttempted] = useState(false); // NEW: Track if save was attempted

  const getData = async () => {
    const response = await dispatch(fetchQuizById(quizId) as any);
    const data = response?.payload?.data || response?.payload;
    setQuizData({
      quizTitle: data.quizTitle || "",
      quizDuration: data.timeLimit || "",
      quizDifficulty: data.level || "",
      passMark: data.passMark || 70,
      quizDescription: data.quizDescription || "",
      courseId: data?.course?._id || "",
      courseTitle: data?.course?.title || "",
      lessonTitle: data?.lesson?.title || "",
      totalMarks: data.totalMarks || 100,
      isTestSeries: data.isTestSeries || false,
    });
    setSections(data.sections || []);
    setIsEditMode(true);
  };

  // Initialize component based on mode
  useEffect(() => {
    if (quizId) {
      getData();
    } else {
      setQuizData({
        quizTitle: lesson?.quizTitle || "",
        quizDuration: lesson?.quizDuration || "",
        quizDifficulty: lesson?.quizDifficulty || "",
        passMark: lesson?.passMark || 70,
        quizDescription: lesson?.quizDescription || "",
        courseId: sectionId,
        totalMarks: lesson?.totalMarks || 100,
        courseTitle: "",
        lessonTitle: "",
        isTestSeries: lesson?.isTestSeries || false,
      });
      setSections(lesson?.sections || []);
      setIsEditMode(false);
    }
  }, [quizId, lesson, sectionId, dispatch]);

  // Handle quiz data from Redux when fetching for edit mode
  useEffect(() => {
    if (isEditMode && saveData && !loading && !saveError) {
      const data = saveData?.data || saveData;
      if (data && typeof data === "object") {
        setQuizData({
          quizTitle: data.title || "",
          quizDuration: data.duration || "",
          quizDifficulty: data.difficulty || "",
          passMark: data.passMark || 70,
          quizDescription: data.description || "",
          courseId: data?.course?._id || "",
          courseTitle: data?.course?.title || "",
          lessonTitle: data?.lesson?.title || "",
          totalMarks: data.totalMarks || 100,
          isTestSeries: data.isTestSeries || false,
        });
        setSections(data.sections || []);
      }
    }
  }, [saveData, loading, saveError, isEditMode]);

  // FIXED: Handle save success and error popups - only when save was attempted
  useEffect(() => {
    if (!loading && hasSaveAttempted) {
      // Only show popup if save was attempted
      if (saveData && !saveError) {
        const isCreateOrUpdate = saveData?.message || saveData?.success;
        if (isCreateOrUpdate) {
          setPopup({
            isVisible: true,
            message: `Quiz ${isEditMode ? "updated" : "created"} successfully!`,
            type: "success",
          });
          if (onSaveSuccess) {
            onSaveSuccess(saveData);
          }
        }
      } else if (saveError) {
        setPopup({
          isVisible: true,
          message: `Failed to ${
            isEditMode ? "update" : "create"
          } quiz: ${saveError}`,
          type: "error",
        });
      }
      setHasSaveAttempted(false); // Reset the flag
    }
  }, [
    saveData,
    loading,
    saveError,
    isEditMode,
    onSaveSuccess,
    hasSaveAttempted,
  ]);

  const handleChange = (
    field: keyof typeof quizData,
    value: string | number | boolean
  ) => {
    setQuizData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSectionsUpdate = (updatedSections: SectionType[]) => {
    setSections(updatedSections);
  };

  const handleDeleteSection = (sectionIndex: number) => {
    const updatedSections = sections.filter(
      (_, index) => index !== sectionIndex
    );
    setSections(updatedSections);
    // Update expanded sections
    setExpandedSections((prev) =>
      prev
        .map((index) => (index > sectionIndex ? index - 1 : index))
        .filter((index) => index !== sectionIndex)
    );
  };

  const handleQuestionsUpdate = (
    sectionIndex: number,
    updatedQuestions: QuestionType[]
  ) => {
    setSections((prevSections) => {
      const updatedSections = [...prevSections];
      const updatedSection = {
        ...updatedSections[sectionIndex],
        questions: updatedQuestions, // Create a new questions array
      };
      updatedSections[sectionIndex] = updatedSection; // Update the section with the new questions
      return updatedSections; // Return the new sections array
    });
  };

  const toggleSectionExpanded = (sectionIndex: number) => {
    setExpandedSections((prev) => {
      const newExpanded = prev.includes(sectionIndex)
        ? prev.filter((index) => index !== sectionIndex)
        : [...prev, sectionIndex];
      return newExpanded;
    });
  };

  const getTotalQuestions = () => {
    return sections.reduce(
      (total, section) => total + section.questions.length,
      0
    );
  };

  const handleSaveQuiz = async () => {
    // Validation
    if (!quizData.quizTitle.trim()) {
      setPopup({
        isVisible: true,
        message: "Please enter a quiz title.",
        type: "error",
      });
      return;
    }

    if (sections.length === 0) {
      setPopup({
        isVisible: true,
        message: "Please add at least one section to the quiz.",
        type: "error",
      });
      return;
    }

    const totalQuestions = getTotalQuestions();
    if (totalQuestions === 0) {
      setPopup({
        isVisible: true,
        message: "Please add at least one question to the quiz.",
        type: "error",
      });
      return;
    }

    // Set flag to indicate save was attempted
    setHasSaveAttempted(true);

    // Prepare payload based on mode
    let payload;
    if (isEditMode && quizId) {
      // Update existing quiz
      payload = {
        id: quizId,
        passMark: quizData.passMark,
        sections: sections,
        quizTitle: quizData.quizTitle,
        timeLimit: quizData.quizDuration,
        level: quizData.quizDifficulty,
        quizDescription: quizData.quizDescription,
        totalMarks: quizData.totalMarks || 100,
        isTestSeries: quizData.isTestSeries,
      };
      dispatch(upadateQuiz(payload) as any);
    } else {
      // Create new quiz
      payload = {
        course: sectionId,
        lesson: lessonId,
        sections: sections,
        passMark: quizData.passMark,
        quizTitle: quizData.quizTitle,
        timeLimit: quizData.quizDuration,
        level: quizData.quizDifficulty,
        quizDescription: quizData.quizDescription,
        totalMarks: quizData.totalMarks || 100,
        isTestSeries: quizData.isTestSeries,
      };
      dispatch(createQuiz(payload) as any);
    }
    // Don't call handleClose() here - let the success popup show first
  };

  const handleClose = () => {
    setPopup({ isVisible: false, message: "", type: "" });
    onClose();
  };

  // FIXED: Handle popup close and modal close separately
  const handlePopupClose = () => {
    setPopup({ isVisible: false, message: "", type: "" });
    // If it was a success popup, close the modal
    if (popup.type === "success") {
      onClose();
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col max-h-[min(92vh,900px)] min-h-0">
        <div className="bg-white dark:bg-white/[0.03] rounded-xl md:rounded-2xl shadow-lg md:shadow-xl border border-gray-100 overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="bg-blue-500 p-4 sm:p-6 text-white">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
                  Loading Quiz...
                </h2>
                <p className="text-indigo-100 text-xs sm:text-sm mt-1">
                  Please wait while we fetch the quiz data
                </p>
              </div>
            </div>
          </div>
          <div className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-7xl mx-auto flex flex-col max-h-[min(92vh,900px)] min-h-0">
        {/* Enhanced Header - Responsive */}
        <div className="bg-white dark:bg-[#182131] rounded-xl md:rounded-2xl shadow-lg md:shadow-xl border border-gray-100 overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="bg-blue-500 p-4 sm:p-6 text-white">
            <div className="flex sm:flex-row items-center sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
                    {isEditMode ? "Edit Quiz" : "Create New Quiz"}
                  </h2>
                  <p className="text-indigo-100 text-xs sm:text-sm mt-1 hidden sm:block">
                    {isEditMode
                      ? "Update quiz settings and questions"
                      : "Design engaging quizzes for students"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center hover:bg-opacity-30 transition-all duration-200"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              </button>
            </div>
          </div>

          {/* Content - scrollable body (footer stays below, not overlapping) */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            {/* Basic Quiz Information */}
            <div className=" rounded-xl p-4 sm:p-6 border-2 border-indigo-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-indigo-600" />
                Quiz Configuration
              </h3>

              {/* Mobile/Tablet responsive grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white/90">
                      <BookOpen className="w-4 h-4" />
                      Quiz Title *
                    </label>
                    <input
                      type="text"
                      value={quizData.quizTitle}
                      onChange={(e) =>
                        handleChange("quizTitle", e.target.value)
                      }
                      placeholder="Enter quiz title"
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 dark:text-white/70 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm sm:text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white/90">
                      <Timer className="w-4 h-4" />
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={quizData.quizDuration}
                      onChange={(e) =>
                        handleChange(
                          "quizDuration",
                          parseInt(e.target.value) || ""
                        )
                      }
                      placeholder="30"
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 dark:text-white/70 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white/90">
                      <Brain className="w-4 h-4" />
                      Difficulty Level
                    </label>
                    <select
                      value={quizData.quizDifficulty}
                      onChange={(e) =>
                        handleChange("quizDifficulty", e.target.value)
                      }
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 dark:text-white/70 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm sm:text-base"
                    >
                      <option className="dark:text-black" value="">
                        Select difficulty
                      </option>
                      <option className="dark:text-black" value="easy">
                        🟢 Easy
                      </option>
                      <option className="dark:text-black" value="medium">
                        🟡 Medium
                      </option>
                      <option className="dark:text-black" value="hard">
                        🔴 Hard
                      </option>
                    </select>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold dark:text-white/90 text-gray-700">
                        <Trophy className="w-4 h-4" />
                        Total Marks *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        value={quizData.totalMarks}
                        onChange={(e) =>
                          handleChange("totalMarks", parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 dark:text-white/70 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold dark:text-white/90 text-gray-700">
                        <Target className="w-4 h-4" />
                        Pass Mark (%) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={quizData.totalMarks}
                        value={quizData.passMark}
                        onChange={(e) =>
                          handleChange("passMark", parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 dark:text-white/70 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={quizData.isTestSeries}
                        onChange={(e) =>
                          handleChange("isTestSeries", e.target.checked)
                        }
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-white/70 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Test Series Quiz
                      </span>
                    </label>
                  </div>

                  {/* Show course and lesson info in edit mode */}
                  {isEditMode &&
                    (quizData.courseTitle || quizData.lessonTitle) && (
                      <div className="p-3 bg-white bg-opacity-60 rounded-lg border border-indigo-200">
                        <h4 className="text-sm font-medium text-indigo-900 mb-2">
                          Quiz Context
                        </h4>
                        {quizData.courseTitle && (
                          <p className="text-sm text-indigo-800">
                            <strong>Course:</strong> {quizData.courseTitle}
                          </p>
                        )}
                        {quizData.lessonTitle && (
                          <p className="text-sm text-indigo-800">
                            <strong>Lesson:</strong> {quizData.lessonTitle}
                          </p>
                        )}
                      </div>
                    )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white/90">
                  <FileText className="w-4 h-4" />
                  Description
                </label>
                <textarea
                  value={quizData.quizDescription}
                  onChange={(e) =>
                    handleChange("quizDescription", e.target.value)
                  }
                  placeholder="Brief description of the quiz content and objectives"
                  rows={3}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 dark:text-white/70 border-gray-200 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all duration-200 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Sections Management */}
            <div className="bg-white  dark:bg-white/[0.03] rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-gray-50 to-slate-50  dark:from-white/[0.03] dark:to-white/[0.03] px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 flex items-center">
                      <Folder className="w-5 h-5 mr-2 text-green-600" />
                      Quiz Sections ({sections.length}) - Total Questions (
                      {getTotalQuestions()})
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-white/70 mt-1">
                      Organize your quiz into sections with questions
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingSection(null);
                      setShowSectionBuilder(true);
                    }}
                    className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <FolderPlus className="w-4 h-4" />
                    Add Section
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {sections.length === 0 ? (
                  <div className="text-center py-12">
                    <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white/90 mb-2">
                      No sections yet
                    </h4>
                    <p className="text-gray-500 mb-4">
                      Start building your quiz by adding sections
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowSectionBuilder(true);
                      }}
                      className="bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white px-6 py-3 rounded-xl inline-flex items-center gap-2 shadow-md shadow-[#1b6294]/20 hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95 font-medium"
                    >
                      <FolderPlus className="w-4 h-4" />
                      Add First Section
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sections.map((section, sectionIndex) => (
                      <SectionCard
                        key={sectionIndex}
                        section={section}
                        sectionIndex={sectionIndex}
                        isExpanded={expandedSections.includes(sectionIndex)}
                        onToggleExpanded={() =>
                          toggleSectionExpanded(sectionIndex)
                        }
                        onEditSection={() => {
                          setEditingSection(sectionIndex);
                          setShowSectionBuilder(true);
                        }}
                        onDeleteSection={() =>
                          handleDeleteSection(sectionIndex)
                        }
                        onEditQuestion={(questionIndex) => {
                          setEditingQuestion({ sectionIndex, questionIndex });
                          setActiveQuestionSectionIndex(sectionIndex);
                          setShowQuestionBuilder(true);
                        }}
                        onDeleteQuestion={(questionIndex) => {
                          const updatedQuestions = section.questions.filter(
                            (_, i) => i !== questionIndex
                          );
                          handleQuestionsUpdate(sectionIndex, updatedQuestions);
                        }}
                        onAddQuestion={() => {
                          setEditingQuestion(null);
                          setActiveQuestionSectionIndex(sectionIndex);
                          setShowQuestionBuilder(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer — part of modal column (avoid fixed viewport overlap) */}
          <div className="shrink-0 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-white/[0.04] dark:to-white/[0.02] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-t border-gray-200 dark:border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-600 order-2 sm:order-1">
                <span className="text-red-500">*</span> Required fields
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 order-1 sm:order-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuiz}
                  disabled={
                    loading ||
                    sections.length === 0 ||
                    !quizData.quizTitle.trim() ||
                    getTotalQuestions() === 0
                  }
                  className={`w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 text-sm font-semibold text-white border border-transparent rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 ${
                    loading ||
                    sections.length === 0 ||
                    !quizData.quizTitle.trim() ||
                    getTotalQuestions() === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white shadow-md shadow-[#1b6294]/20 hover:shadow-lg cursor-pointer active:scale-95"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      <span>
                        {isEditMode ? "Updating..." : "Creating..."} Quiz
                      </span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isEditMode ? "Update" : "Create"} Quiz</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Builder Modal */}
      {showSectionBuilder && (
        <SectionBuilder
          section={editingSection !== null ? sections[editingSection] : null}
          onSave={(sectionData: SectionType) => {
            let updatedSections;
            if (editingSection !== null) {
              updatedSections = [...sections];
              updatedSections[editingSection] = sectionData;
            } else {
              updatedSections = [...sections, sectionData];
            }
            handleSectionsUpdate(updatedSections);
            setShowSectionBuilder(false);
            setEditingSection(null);
          }}
          onClose={() => {
            setShowSectionBuilder(false);
            setEditingSection(null);
          }}
        />
      )}

      {/* Question Builder Modal */}
      {showQuestionBuilder && (
        <QuestionBuilder
          question={
            editingQuestion !== null
              ? sections[editingQuestion.sectionIndex].questions[
                  editingQuestion.questionIndex
                ]
              : null
          }
          onSave={(questionData: QuestionType) => {
            const sectionIndex = activeQuestionSectionIndex;
            let updatedQuestions;
            if (editingQuestion !== null) {
              updatedQuestions = [...sections[sectionIndex].questions];
              updatedQuestions[editingQuestion.questionIndex] = questionData;
            } else {
              updatedQuestions = [
                ...sections[sectionIndex].questions,
                questionData,
              ];
            }
            handleQuestionsUpdate(sectionIndex, updatedQuestions);
            setShowQuestionBuilder(false);
            setEditingQuestion(null);
          }}
          onClose={() => {
            setShowQuestionBuilder(false);
            setEditingQuestion(null);
          }}
        />
      )}

      {/* Enhanced Popup - Responsive */}
      {popup.isVisible && popup.type !== "" && (
        <EnhancedPopup
          message={popup.message}
          type={popup.type as "success" | "error" | "warning" | "info"}
          isVisible={popup.isVisible}
          onClose={handlePopupClose}
        />
      )}
    </>
  );
};

// SectionBuilder component - basic implementation
type SectionBuilderProps = {
  section: SectionType | null;
  onSave: (section: SectionType) => void;
  onClose: () => void;
};

const SectionBuilder = ({ section, onSave, onClose }: SectionBuilderProps) => {
  const [sectionTitle, setSectionTitle] = useState(section?.sectionTitle || "");
  const [sectionDescription, setSectionDescription] = useState(
    section?.sectionDescription || ""
  );

  const handleSave = () => {
    if (!sectionTitle.trim()) {
      alert("Section title cannot be empty");
      return;
    }
    onSave({
      sectionTitle: sectionTitle.trim(),
      sectionDescription: sectionDescription.trim(),
      questions: section?.questions || [],
    });
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-transparent backdrop-blur-sm bg-opacity-50 p-4">
      <div className="bg-white dark:bg-[#101828] rounded-xl max-w-md w-full p-6 space-y-4 shadow-lg overflow-auto max-h-[90vh]">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
          {section ? "Edit Section" : "Add New Section"}
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">
            Section Title *
          </label>
          <input
            type="text"
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            className="w-full px-3 py-2 border dark:text-white/90 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter section title"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">
            Section Description
          </label>
          <textarea
            rows={3}
            value={sectionDescription}
            onChange={(e) => setSectionDescription(e.target.value)}
            className="w-full px-3 py-2 border dark:text-white/70 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            placeholder="Enter section description (optional)"
          />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border dark:text-white/90 dark:hover:text-black border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Save Section
          </button>
        </div>
      </div>
    </div>
  );
};

// QuestionBuilder component - basic implementation
type QuestionBuilderProps = {
  question: QuestionType | null;
  onSave: (question: QuestionType) => void;
  onClose: () => void;
};

const QuestionBuilder = ({
  question,
  onSave,
  onClose,
}: QuestionBuilderProps) => {
  const [questionText, setQuestionText] = useState(question?.question || "");

  // Convert question options to OptionType format
  const convertToOptionType = (
    options: string[] | OptionType[]
  ): OptionType[] => {
    if (!options || options.length === 0) {
      return [
        { label: "A", text: "" },
        { label: "B", text: "" },
        { label: "C", text: "" },
        { label: "D", text: "" },
      ];
    }

    if (typeof options[0] === "string") {
      return (options as string[]).map((text, index) => ({
        label: String.fromCharCode(65 + index),
        text: text,
      }));
    }

    return options as OptionType[];
  };

  const [options, setOptions] = useState<OptionType[]>(
    convertToOptionType(question?.options || [])
  );
  const [correctAnswer, setCorrectAnswer] = useState(
    question?.correctAnswer || ""
  );

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...options];
    updatedOptions[index].text = value;
    setOptions(updatedOptions);
  };

  const addOption = () => {
    const newLabel = String.fromCharCode(65 + options.length); // A, B, C, ...
    setOptions([...options, { label: newLabel, text: "" }]);
  };

  const removeOption = (index: number) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
    if (correctAnswer === options[index]?.label) {
      setCorrectAnswer("");
    }
  };

  const handleSave = () => {
    if (!questionText.trim()) {
      alert("Question text cannot be empty");
      return;
    }
    const filteredOptions = options
      .map((opt) => opt.text.trim())
      .filter((opt) => opt !== "");
    if (filteredOptions.length < 2) {
      alert("Please provide at least two options.");
      return;
    }
    if (!correctAnswer || !options.some((opt) => opt.label === correctAnswer)) {
      alert("Please select a valid correct answer.");
      return;
    }
    onSave({
      question: questionText.trim(),
      options: options,
      correctAnswer, // Pass the label (A, B, C, D) as the correct answer
    });
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-transparent backdrop-blur-lg p-4">
      <div className="bg-white dark:bg-[#101828]  rounded-xl max-w-lg w-full p-6 space-y-4 shadow-lg overflow-auto max-h-[90vh]">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
          {question ? "Edit Question" : "Add New Question"}
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">
            Question Text *
          </label>
          <textarea
            rows={3}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:text-white/70 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            placeholder="Enter the question"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">
            Options *
          </label>
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={option.text}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${option.label}`}
                className="flex-grow px-3 py-2 border dark:text-white/70 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  title="Remove Option"
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center px-3 py-1 text-blue-600 hover:text-blue-800 font-medium space-x-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Option</span>
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">
            Correct Answer *
          </label>
          <select
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            className="w-full px-3 py-2 dark:text-white/70 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option className="dark:text-black" value="">
              Select correct answer
            </option>
            {options.map((option, index) =>
              option.text.trim() ? (
                <option
                  className="dark:text-black"
                  key={index}
                  value={option.label}
                >
                  {option.label}: {option.text}
                </option>
              ) : null
            )}
          </select>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border dark:hover:text-black dark:text-white/90 border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Save Question
          </button>
        </div>
      </div>
    </div>
  );
};

// SectionCard component
const SectionCard = ({
  section,
  sectionIndex,
  isExpanded,
  onToggleExpanded,
  onEditSection,
  onDeleteSection,
  onEditQuestion,
  onDeleteQuestion,
  onAddQuestion,
}: {
  section: SectionType;
  sectionIndex: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onEditSection: () => void;
  onDeleteSection: () => void;
  onEditQuestion: (questionIndex: number) => void;
  onDeleteQuestion: (questionIndex: number) => void;
  onAddQuestion: () => void;
}) => {
  return (
    <div className="bg-gray-5  dark:bg-white/[0.06] border border-gray-200 rounded-lg overflow-hidden">
      {/* Section Header */}
      <div className="bg-white dark:bg-white/[0.03] border-b border-gray-200 p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleExpanded();
                }}
                className="flex items-center gap-2 text-gray-600 dark:text-white/90 hover:text-gray-800 focus:outline-none"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  Section {sectionIndex + 1}
                </span>
              </button>
              <span className="text-sm text-gray-500 dark:text-white/90 ">
                {section.questions?.length || 0} questions
              </span>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white/90 mb-1">
              {section.sectionTitle}
            </h4>
            {section.sectionDescription && (
              <p className="text-sm text-gray-600 dark:text-white/70">
                {section.sectionDescription}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 ml-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddQuestion();
              }}
              className="p-2 text-gray-500 dark:text-white/90 dark:hover:text-green-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Add Question"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEditSection();
              }}
              className="p-2 text-gray-500 dark:text-white/90 dark:hover:text-yellow-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
              title="Edit Section"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteSection();
              }}
              className="p-2 text-gray-500 dark:text-white/90 dark:hover:text-red-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Section"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Section Questions */}
      {isExpanded && (
        <div className="p-4">
          {section.questions?.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">No questions in this section</p>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddQuestion();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {section.questions.map((question, questionIndex) => (
                <QuestionCard
                  key={questionIndex}
                  question={question}
                  index={questionIndex}
                  onEdit={() => onEditQuestion(questionIndex)}
                  onDelete={() => onDeleteQuestion(questionIndex)}
                />
              ))}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddQuestion();
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Another Question
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// QuestionCard component
const QuestionCard = ({
  question,
  index,
  onEdit,
  onDelete,
}: {
  question: QuestionType;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="bg-white dark:bg-white/[0.08]  border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-100  text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              Question {index + 1}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPreview(!showPreview);
              }}
              className="text-gray-500 dark:text-white/90 dark:hover:text-blue-600  hover:text-blue-600 focus:outline-none"
              title="Preview Question"
              aria-label="Preview Question"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white/90 mb-1">
            {question.question}
          </h4>
          {showPreview && (
            <div className="mt-2">
              <h5 className="font-medium text-gray-800 dark:text-white/90">
                Options:
              </h5>
              <ul className="list-disc list-inside">
                {question.options.map((option, optionIndex) => (
                  <li
                    key={optionIndex}
                    className="text-gray-700 dark:text-white/70"
                  >
                    {typeof option === "string"
                      ? `${String.fromCharCode(65 + optionIndex)}: ${option}`
                      : `${option.label}: ${option.text}`}
                  </li>
                ))}
              </ul>
              <p className="text-gray-600 dark:text-white/70 mt-1">
                <strong>Correct Answer:</strong> {question.correctAnswer}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 ml-4">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 text-gray-500 dark:text-white/90 dark:hover:text-yellow-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
            title="Edit Question"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-gray-500 dark:text-white/90 dark:hover:text-red-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
