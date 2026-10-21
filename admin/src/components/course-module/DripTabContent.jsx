import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Zap,
  Settings,
  X,
  Loader2,
  AlertCircle,
  BookOpen,
  Play,
  FileText,
  HelpCircle,
  ClipboardList,
  Clock,
  Users,
  Lock,
} from "lucide-react";
import { fetchCourseById } from "../../store/slices/course";
import { updateLessonMobileOnly } from "../../store/slices/lesson"; // Import the lesson thunk
import { fetchDripRules, fetchCourseContents } from "../../store/slices/drip"; // already imported
import axiosInstance from "../../services/axiosConfig"; // already imported in DripPopup, import here if needed
import DripPopup from "./DripPopup";
import PopupAlert from "../popUpAlert";

const CourseAccordion = ({ courseId }) => {
  const dispatch = useDispatch();
  const {
    loading,
    error,
    data: courseData,
  } = useSelector((state) => state.course);
  const { loading: lessonLoading } = useSelector((state) => state.lesson); // Get lesson loading state
  const { token } = useSelector((state) => state.auth); // Assuming you have auth token in Redux

  const [expandedModules, setExpandedModules] = useState(new Set());
  const [modalData, setModalData] = useState(null);
  const [modules, setModules] = useState([]);
  const [dripModalData, setDripModalData] = useState(null);
  // Add a state to force re-mount DripPopup so it always shows fresh data
  const [dripPopupKey, setDripPopupKey] = useState(0);
  const [savingSettings, setSavingSettings] = useState(false); // Local loading state for settings save
  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });
  const [moduleDripModal, setModuleDripModal] = useState(null); // State for module-level drip modal
  // Fetch course data when component mounts or courseId changes
  useEffect(() => {
    if (courseId) {
      dispatch(fetchCourseById({ courseId }));

      // For demo purposes, using simulated data
      fetchDemoData();
    }
  }, [courseId, dispatch]);

  // Process course data when it's received
  useEffect(() => {
    if (courseData?.modules) {
      setModules(courseData.modules);
    } else if (courseData) {
      // If modules are nested differently in your API response, adjust accordingly
      setModules(courseData.data?.modules || []);
    }
  }, [courseData]);

  // Demo data fetch function - replace with actual API call
  const fetchDemoData = () => {
    // Your existing demo data logic here
  };

  const toggleModule = (moduleId) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const openModal = (type, lesson, module) => {
    setModalData({ type, lesson, module });
  };

  const closeModal = () => {
    setModalData(null);
  };

  const handleAccessSettingsSave = async (lessonId, moduleId, settings) => {
    try {
      setSavingSettings(true);

      // Determine if mobile only based on platform setting
      const ismobileOnly = settings.platform === "phone";

      // Call the API to update mobile-only setting
      const result = await dispatch(
        updateLessonMobileOnly({
          lessonId,
          ismobileOnly,
          token,
        })
      ).unwrap();

      // Update local state only after successful API call
      const updatedModules = modules.map((module) => {
        if (module.id === moduleId || module._id === moduleId) {
          return {
            ...module,
            lessons: module.lessons.map((lesson) => {
              if (lesson.id === lessonId || lesson._id === lessonId) {
                return {
                  ...lesson,
                  accessSettings: settings,
                  ismobileOnly, // Update the mobile-only flag
                };
              }
              return lesson;
            }),
          };
        }
        return module;
      });

      setModules(updatedModules);
      closeModal();
      setPopup({
        isVisible: true,
        message: "Lesson settings updated successfully!",
        type: "success",
      });
      // Optional: Show success message
      console.log("Mobile-only setting updated successfully:", result);
    } catch (error) {
      console.error("Failed to update mobile-only setting:", error);
      // Optional: Show error message to user
      setPopup({
        isVisible: true,
        message: `Failed to update lesson settings: ${error.message || error}`,
        type: "error",
      });
      // alert("Failed to update lesson settings. Please try again.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Helper to refresh drip rules for a specific target
  const refreshDripRulesForTarget = async (targetId) => {
    try {
      // Fetch latest drip rules for the specific target
      await axiosInstance.get(`/drip/drip-rules/by-reference/${targetId}`);
      // Optionally, update local state if needed
    } catch (e) {
      // handle error if needed
    }
  };

  const handleDripSettings = (lessonId, moduleId) => {
    console.log("Drip settings for lesson:", lessonId, "in module:", moduleId);
    // Find the lesson and module data
    const module = modules.find((m) => m.id === moduleId || m._id === moduleId);
    const lesson = module?.lessons?.find(
      (l) => l.id === lessonId || l._id === lessonId
    );

    // Set the drip modal data to open the popup
    setDripModalData({
      lessonId,
      moduleId,
      lesson,
      module,
      targetType: "lesson", // Add target type
      targetId: lessonId, // Add target ID
    });
    // Increment key to force DripPopup remount and always fetch latest data
    setDripPopupKey((prev) => prev + 1);
  };

  const closeDripModal = () => {
    setDripModalData(null);
  };

  const handleDripSubmit = async (dripSettings, result) => {
    console.log("Saving drip settings:", dripSettings);
    // Here you would typically make an API call to save the drip settings

    console.log("Drip settings submitted:", result);
    if (result) {
      setPopup({
        isVisible: true,
        message: "Drip settings saved successfully!",
        type: "success",
      });
      // Fetch updated drip rules for the target and refresh course contents
      if (dripSettings?.targetId) {
        await refreshDripRulesForTarget(dripSettings.targetId);
      }
      await dispatch(fetchCourseContents());
      closeDripModal();
    } else {
      return setPopup({
        isVisible: true,
        message: "Failed to save drip settings. Please try again.",
        type: "error",
      });
    }
  };

  const handleLessonSettings = (lessonId, moduleId) => {
    console.log(
      "General settings for lesson:",
      lessonId,
      "in module:",
      moduleId
    );
    // Implement general lesson settings logic
  };

  const getLessonTypeIcon = (type) => {
    switch (type) {
      case "video":
        return <Play className="w-4 h-4" />;
      case "text":
        return <FileText className="w-4 h-4" />;
      case "quiz":
        return <HelpCircle className="w-4 h-4" />;
      case "assignment":
        return <ClipboardList className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const getTotalStats = () => {
    const totalLessons = modules.reduce(
      (sum, module) => sum + (module.lessons?.length || 0),
      0
    );
    const completedLessons = modules.reduce(
      (sum, module) =>
        sum +
        (module.lessons?.filter((lesson) => lesson.isCompleted).length || 0),
      0
    );
    const totalDuration = modules.reduce(
      (sum, module) =>
        sum +
        (module.lessons?.reduce(
          (lessonSum, lesson) => lessonSum + (lesson.duration || 0),
          0
        ) || 0),
      0
    );

    return { totalLessons, completedLessons, totalDuration };
  };

  const { totalLessons, completedLessons, totalDuration } = getTotalStats();

  if (loading) {
    return (
      <div className="max-w-full mx-auto min-h-fit">
        <div className="bg-white dark:bg-white/[0.03] rounded-lg shadow-lg border border-blue-100 p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <span className="text-gray-600 dark:text-white/70 text-lg">
              Loading course content...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-full dark:bg-white/[0.03] mx-auto min-h-fit">
        <div className="bg-white dark:bg-white/[0.03] rounded-lg shadow-lg border border-red-100 p-8">
          <div className="flex items-center justify-center text-red-600">
            <AlertCircle className="w-8 h-8 mr-3" />
            <div>
              <h3 className="text-lg font-semibold ">Error Loading Course</h3>
              <p className="text-sm mt-1">{error.message || error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="max-w-full mx-auto min-h-fit">
        <div className="bg-white dark:bg-white/[0.03]  rounded-lg shadow-lg border border-gray-100 p-8">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white/90 mb-2">
              No Content Available
            </h3>
            <p className="text-gray-600">
              This course doesn't have any modules yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Remove any updateCourse or updateCourse API call from Add Drip logic.
  // Only open the DripPopup modal.

  const handleAddDrip = (module) => {
    // Prevent any popup before opening DripPopup
    setPopup({ isVisible: false, message: "", type: "" });
    // Do NOT call any updateCourse or course update API here!
    setModuleDripModal({
      moduleId: module.id || module._id,
      lessons: module.lessons || [],
      targetType: "lesson",
      targetId: (module.lessons || []).map((l) => l.id || l._id),
      module,
    });
  };

  return (
    <>
      <div className="max-w-full mx-auto min-h-fit">
        {/* Course Stats Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-white/[0.03] dark:to-white/[0.03] rounded-lg border border-blue-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-white/90">
                  Total Modules
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white/90">
                  {modules.length}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div> */}
              {/* <div>
              <p className="text-sm font-medium text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {completedLessons}/{totalLessons}
              </p>
            </div> */}
            </div>
            <div className="flex items-center space-x-3">
              {/* <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div> */}
              <div>
                {/* <p className="text-sm font-medium text-gray-600">
                Total Duration
              </p> */}
                {/* <p className="text-2xl font-bold text-gray-900">
                {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
              </p> */}
              </div>
            </div>
          </div>
        </div>

        {/* Course Modules */}
        <div className="bg-white dark:bg-white/[0.03] rounded-lg shadow-lg border border-blue-100">
          <div className="divide-y divide-blue-100">
            {modules.map((module) => (
              <div
                key={module.id || module._id}
                className="bg-white dark:bg-white/[0.03] "
              >
                {/* Module Header */}
                <div
                  className="flex sm:flex-row items-center sm:items-center justify-between gap-4 p-4 hover:bg-blue-50 dark:hover:dark:bg-white/[0.06] cursor-pointer transition-all duration-200"
                  onClick={() => toggleModule(module.id || module._id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="transition-transform duration-300 ease-in-out">
                      {expandedModules.has(module.id || module._id) ? (
                        <ChevronDown className="w-5 h-5 text-blue-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
                        {module.title || module.name}
                      </h3>
                      {module.description && (
                        <p className="text-sm text-gray-600 dark:text-white/70 mt-1">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {!module.isPublished && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                        Draft
                      </span>
                    )}
                    <div className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium">
                      {module.lessons?.length || 0} lessons
                    </div>
                    {/* Add Drip Button */}
                    <button
                      type="button" // <-- Add this line!
                      className="px-3 py-1.5 bg-[#1b6294] text-white rounded-md text-xs font-medium hover:bg-[#16517a] transition-colors shadow-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddDrip(module);
                      }}
                    >
                      Add Drip
                    </button>
                  </div>
                </div>

                {/* Lessons List */}
                <div
                  className={`overflow-auto transition-all duration-500 ease-in-out ${
                    expandedModules.has(module.id || module._id)
                      ? "max-h-screen opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="bg-blue-50 dark:bg-white/[0.01] border-t border-blue-100 overflow-y-scroll">
                    {module.lessons?.map((lesson, index) => (
                      <div
                        key={lesson.id || lesson._id}
                        className="flex sm:flex-row items-center sm:items-center justify-between gap-4 p-4 pl-12 hover:bg-white dark:hover:bg-white/[0.06] transition-colors duration-200 border-b border-blue-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                              lesson.isCompleted
                                ? "bg-green-600 text-white"
                                : "bg-blue-600 text-white"
                            }`}
                          >
                            {lesson.isCompleted ? "✓" : index + 1}
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-gray-500 dark:text-white/70">
                              {getLessonTypeIcon(lesson.type)}
                            </div>
                            <span className="text-gray-900 dark:text-white/90 font-medium">
                              {lesson.title || lesson.name}
                            </span>
                            {lesson.duration && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {lesson.duration}min
                              </span>
                            )}
                            {(lesson.ismobileOnly ||
                              lesson.accessSettings?.platform === "phone") && (
                              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                                Mobile Only
                              </span>
                            )}
                            
                            {Array.isArray(lesson.dripRules) && lesson.dripRules.length > 0 && (
                              <button
                                type="button"
                                className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium cursor-default"
                                title="This lesson has a drip rule"
                                style={{ pointerEvents: "none" }}
                              >
                                <Lock className="w-3 h-3 mr-1" />
                                Drip Rule Added
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openModal("view", lesson, module);
                            }}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-sm"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDripSettings(
                                lesson.id || lesson._id,
                                module.id || module._id
                              );
                            }}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-[#1b6294] text-white rounded-md hover:bg-[#16517a] transition-colors duration-200 text-sm font-medium shadow-xs"
                          >
                            <Zap className="w-4 h-4" />
                            <span>Drip</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleLessonSettings(
                                lesson.id || lesson._id,
                                module.id || module._id
                              );
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-md transition-colors duration-200"
                          >
                            {/* <Settings className="w-4 h-4" /> */}
                          </button>
                        </div>
                      </div>
                    ))}

                    {(!module.lessons || module.lessons.length === 0) && (
                      <div className="p-8 text-center text-gray-500">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No lessons in this module yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Access Settings Modal */}
        {modalData && modalData.type === "view" && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] bg-opacity-50 flex items-center justify-center z-[10000] p-4"
            onClick={closeModal}
          >
            <div
              className="bg-white dark:bg-[#101828] rounded-lg shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex sm:flex-row items-center sm:items-center justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white/90">
                    Course Access Settings
                  </h3>
                  <button
                    onClick={closeModal}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    disabled={savingSettings}
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="pt-4 border-t border-gray-200">
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-3">
                        Where do you want to make this lesson available?
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-white/70 mb-4">
                        Choose the platform(s) where students can access "
                        {modalData.lesson.title || modalData.lesson.name}".
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200">
                          <input
                            type="radio"
                            id="phone-only"
                            name="access-type"
                            value="phone"
                            defaultChecked={
                              modalData.lesson.ismobileOnly ||
                              modalData.lesson.accessSettings?.platform ===
                                "phone"
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            disabled={savingSettings}
                          />
                          <label
                            htmlFor="phone-only"
                            className="ml-3 flex-1 cursor-pointer"
                          >
                            <div className="font-medium text-gray-900 dark:text-white/90">
                              Phone Only
                            </div>
                            <div className="text-sm text-gray-600 dark:text-white/70">
                              Mobile app access only
                            </div>
                          </label>
                        </div>

                        <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200">
                          <input
                            type="radio"
                            id="both-platforms"
                            name="access-type"
                            value="both"
                            defaultChecked={
                              !modalData.lesson.ismobileOnly &&
                              (!modalData.lesson.accessSettings?.platform ||
                                modalData.lesson.accessSettings?.platform ===
                                  "both")
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            disabled={savingSettings}
                          />
                          <label
                            htmlFor="both-platforms"
                            className="ml-3 flex-1 cursor-pointer"
                          >
                            <div className="font-medium text-gray-900 dark:text-white/90">
                              Web & App Both
                            </div>
                            <div className="text-sm text-gray-600 dark:text-white/70">
                              Available on all platforms
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    disabled={savingSettings}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const selectedOption = document.querySelector(
                        'input[name="access-type"]:checked'
                      );
                      const platform = selectedOption
                        ? selectedOption.value
                        : "both";
                      handleAccessSettingsSave(
                        modalData.lesson.id || modalData.lesson._id,
                        modalData.module.id || modalData.module._id,
                        { platform }
                      );
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={savingSettings}
                  >
                    {savingSettings && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    <span>
                      {savingSettings ? "Saving..." : "Save Settings"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Drip Settings Modal */}
        {dripModalData && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] bg-opacity-50 flex items-center justify-center z-[10000] p-4"
            onClick={closeDripModal}
          >
            <div
              className="bg-white dark:bg-[#101828] rounded-lg shadow-2xl max-w-5xl h-[94%] overflow-y-auto w-full transform transition-all duration-300 scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex sm:flex-row items-center sm:items-center justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white/90">
                    Drip Settings -{" "}
                    {dripModalData.lesson?.title || dripModalData.lesson?.name}
                  </h3>
                  <button
                    onClick={closeDripModal}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                {console.log("Drip Modal Data:", dripModalData)}

                {/* Force DripPopup to remount by using key={dripPopupKey} */}
                <DripPopup
                  key={dripPopupKey}
                  onSubmit={handleDripSubmit}
                  onClose={closeDripModal}
                  initialData={{
                    ...dripModalData.lesson?.dripRules,
                    targetType: dripModalData.targetType,
                    targetId: dripModalData.targetId,
                  }}
                  courseData={{ modules }}
                  targetType={dripModalData.targetType}
                  targetId={dripModalData.targetId}
                />
              </div>
            </div>
          </div>
        )}

        {/* Module-level DripPopup for multi-select */}
        {moduleDripModal && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] bg-opacity-50 flex items-center justify-center z-[10000] p-4"
            onClick={() => setModuleDripModal(null)}
          >
            <div
              className="bg-white dark:bg-[#101828] rounded-lg shadow-2xl max-w-5xl h-[94%] overflow-y-auto w-full transform transition-all duration-300 scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex sm:flex-row items-center sm:items-center justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white/90">
                    Drip Settings - Module:{" "}
                    {moduleDripModal.module?.title || moduleDripModal.module?.name}
                  </h3>
                  <button
                    onClick={() => setModuleDripModal(null)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <DripPopup
                  onSubmit={async (dripSettings, result) => {
                    setModuleDripModal(null);
                    // Fetch updated drip rules for the target and refresh course contents
                    if (dripSettings?.targetId) {
                      await refreshDripRulesForTarget(dripSettings.targetId);
                    }
                    await dispatch(fetchCourseContents());
                  }}
                  onClose={() => setModuleDripModal(null)}
                  initialData={[
                    {
                      dripType: "",
                      referenceType: "lesson",
                      referenceId: "",
                      delayDays: 0,
                      targetType: "lesson",
                      targetId: moduleDripModal.targetId,
                    },
                  ]}
                  courseData={{ module: moduleDripModal.module, modules }}
                  targetType="lesson"
                  targetId={moduleDripModal.targetId}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {
        <PopupAlert
          message={popup.message}
          type={popup.type}
          isVisible={popup.isVisible}
          onClose={() => setPopup({ ...popup, isVisible: false })}
        />
      }
    </>
  );
};

export default CourseAccordion;
