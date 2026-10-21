import React, { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  Award,
  FileText,
  Zap,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import {
  fetchCourseContents,
  createDripRule,
  updateDripRuleByReferenceId,
} from "../../store/slices/drip.js";
import { useSelector, useDispatch } from "react-redux";
import PopupAlert from "../../components/popUpAlert.jsx";
import axiosInstance from "../../services/axiosConfig.js";

const DRIP_TYPES = [
  {
    value: "days_after_enrollment",
    label: "Days After Enrollment",
    description: "Release content after student enrolls",
    icon: Users,
    category: "enrollment",
  },
  {
    value: "days_after_lesson_completed",
    label: "Days After Lesson Completed",
    description: "Release after completing a specific lesson",
    icon: BookOpen,
    category: "completion",
  },
  // {
  //   value: "days_after_module_completed",
  //   label: "Days After Module Completed",
  //   description: "Release after completing a module",
  //   icon: CheckCircle,
  //   category: "completion",
  // },
  {
    value: "after_lesson_completed",
    label: "Immediately After Lesson",
    description: "Release immediately when lesson is completed",
    icon: Zap,
    category: "immediate",
  },
  // {
  //   value: "after_module_completed",
  //   label: "Immediately After Module",
  //   description: "Release immediately when module is completed",
  //   icon: CheckCircle,
  //   category: "immediate",
  // },
  {
    value: "specific_date",
    label: "Specific Date",
    description: "Release on a specific date and time",
    icon: Calendar,
    category: "scheduled",
  },
  {
    value: "after_quiz_passed",
    label: "After Quiz Passed",
    description: "Release when student passes a quiz",
    icon: Award,
    category: "achievement",
  },
  {
    value: "after_assignment_submitted",
    label: "After Assignment Submitted",
    description: "Release when assignment is submitted",
    icon: FileText,
    category: "achievement",
  },
  // {
  //   value: "after_feedback_received",
  //   label: "After Feedback Received",
  //   description: "Release after instructor provides feedback",
  //   icon: AlertCircle,
  //   category: "interaction",
  // },
  // {
  //   value: "custom_condition",
  //   label: "Custom Condition",
  //   description: "Set up custom release conditions",
  //   icon: Zap,
  //   category: "advanced",
  // },
];

const REFERENCE_TYPES = [
  {
    value: "lesson",
    label: "Specific Lesson",
    description: "Reference a particular lesson",
    icon: BookOpen,
  },
  // {
  //   value: "module",
  //   label: "Specific Module",
  //   description: "Reference a particular module",
  //   icon: CheckCircle,
  // },
  // {
  //   value: "date",
  //   label: "Date/Time",
  //   description: "Use date and time reference",
  //   icon: Calendar,
  // },
  // {
  //   value: "enrollment",
  //   label: "Enrollment Date",
  //   description: "Based on when student enrolled",
  //   icon: Users,
  // },
];

const CONDITION_OPERATORS = [
  { value: "AND", label: "AND", description: "All conditions must be met" },
];

const DripPopup = ({
  onSubmit,
  onClose,
  initialData,
  courseData,
  onFetchCourseData,
  targetType,
  targetId,
}) => {
  const dispatch = useDispatch();
  const [dripData, setDripData] = useState(initialData || {});
  const { data: course, loading } = useSelector((state) => state.drip);
  console.log("targetType:", course);
  const [edit, setEdit] = useState(false);

  const [activeCategory, setActiveCategory] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [multiSelectOpen, setMultiSelectOpen] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const dropdownRef = useRef(null);
  const multiSelectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (
        multiSelectRef.current &&
        !multiSelectRef.current.contains(event.target)
      ) {
        setMultiSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Always use the latest drip rule from API, not just initialData
  const getInitialForm = () => ({
    dripType: "",
    referenceType: "enrollment",
    referenceId: "",
    delayDays: 0,
    unlockDate: "",
    requiredScore: "",
    conditionOperator: "AND",
    targetType: targetType || "lesson",
    targetId: targetId || "",
  });

  const [form, setForm] = useState(getInitialForm());

  // Always fetch latest drip rule from API when popup opens (targetId changes)
  const getData = async () => {
    try {
      const idToFetch = Array.isArray(targetId) ? targetId[0] : targetId;
      if (!idToFetch) return;
      const result = await axiosInstance.get(
        `/drip/drip-rules/by-reference/${idToFetch}`
      );
      // Support both array and object API responses
      const data =
        Array.isArray(result?.data?.data) && result.data.data.length > 0
          ? result.data.data[0]
          : result?.data?.data;
      if (!data || !data.dripRuleId) {
        setEdit(false);
        setForm(getInitialForm());
        return;
      }
      setEdit(true);
      setForm({
        dripType: data.dripRuleId.dripType || "",
        referenceType: data.dripRuleId.referenceType || "",
        referenceId: data.dripRuleId.referenceId || "",
        delayDays: data.dripRuleId.delayDays || 0,
        unlockDate: data.dripRuleId.unlockDate || "",
        requiredScore: data.dripRuleId.requiredScore || "",
        conditionOperator: data.dripRuleId.conditionOperator || "AND",
        targetType: data.targetType || "lesson",
        targetId: data.targetId || "",
      });
    } catch (error) {
      setEdit(false);
      setForm(getInitialForm());
      console.error("Failed to fetch drip data:", error);
    }
  };

  useEffect(() => {
    if (targetId) {
      getData();
    }
    // eslint-disable-next-line
  }, [targetId]);

  // When closing popup, also reset edit state and form
  const handleClose = () => {
    setEdit(false);
    setForm(getInitialForm());
    onClose();
  };

  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });

  console.log("Redux course data:", course);
  console.log("Target Type:", targetType);
  console.log("Target ID:", targetId);

  useEffect(() => {
    dispatch(fetchCourseContents());
  }, [dispatch]);

  console.log("Initial Data:", Array.isArray(initialData) ? initialData[0]?.dripType : initialData?.dripType);

  // Update form state for multi-select
  const handleMultiSelectChange = (value) => {
    setForm((prev) => {
      let targetIds = Array.isArray(prev.targetId) ? [...prev.targetId] : [];
      if (targetIds.includes(value)) {
        targetIds = targetIds.filter((id) => id !== value);
      } else {
        targetIds.push(value);
      }
      return { ...prev, targetId: targetIds };
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    const options = getLessonMultiSelectOptions();
    if (!selectAll) {
      setForm((prev) => ({ ...prev, targetId: options.map((o) => o.value) }));
      setSelectAll(true);
    } else {
      setForm((prev) => ({ ...prev, targetId: [] }));
      setSelectAll(false);
    }
  };

  // Duplicate getData removed to fix redeclaration error.

  const handleSubmit = async () => {
    if (form.dripType) {
      try {
        const dripRuleData = {
          ...form,
          targetType: form.targetType,
          targetId: form.targetId, // can be array
        };

        console.log("Creating drip rule with data:", dripRuleData);

        let result;
        if (edit) {
          result = await dispatch(updateDripRuleByReferenceId(dripRuleData));
        } else {
          result = await dispatch(createDripRule(dripRuleData));
        }
        console.log("Drip rule creation result:", result);

        // Show popup for success/failure
        if (result?.payload && !result.error) {
          setPopup({
            isVisible: true,
            message: edit
              ? "Drip rule updated successfully!"
              : "Drip rule created successfully!",
            type: "success",
          });
          // Optionally close after a short delay
          setTimeout(() => {
            setPopup({ isVisible: false, message: "", type: "" });
            onSubmit(dripRuleData, result.payload);
          }, 1200);
        } else {
          setPopup({
            isVisible: true,
            message: "Failed to save drip rule. Please try again.",
            type: "error",
          });
        }
      } catch (error) {
        setPopup({
          isVisible: true,
          message: `Failed to add Drip Rule , Please try again later!`,
          type: "error",
        });
        console.error("Failed to create drip rule:", error);
      }
    }
  };

  const getFilteredDripTypes = () => {
    if (activeCategory === "all") return DRIP_TYPES;
    return DRIP_TYPES.filter((type) => type.category === activeCategory);
  };

  const getDropdownOptions = () => {
    const courseContent = course || courseData;
    if (!courseContent) return [];

    const modules = courseContent.modules || courseContent.data?.modules || [];
    let lessons = courseContent.lessons || courseContent.data?.lessons || [];
    if (lessons.length === 0 && modules.length > 0) {
      lessons = modules.flatMap((m) =>
        (m.lessons || []).map((l) => ({
          ...l,
          moduleId: l.moduleId || m,
        }))
      );
    }

    if (form.referenceType === "module") {
      return (
        modules.map((module) => ({
          value: module._id || module.id,
          label: module.title || module.name || "Untitled Module",
          sublabel: `Course: ${module.courseId?.title || "Course"} | Order: ${
            module.order ?? "-"
          }`,
        })) || []
      );
    }

    if (form.referenceType === "lesson") {
      let filteredLessons = lessons;

      if (form.dripType === "after_quiz_passed") {
        filteredLessons = filteredLessons.filter(
          (lesson) => lesson.type === "quiz"
        );
      } else if (form.dripType === "after_assignment_submitted") {
        filteredLessons = filteredLessons.filter(
          (lesson) => lesson.type === "assignment"
        );
      } else if (
        form.dripType === "after_lesson_completed" ||
        form.dripType === "days_after_lesson_completed"
      ) {
        filteredLessons = filteredLessons.filter(
          (lesson) =>
            lesson.type === "video-lesson" ||
            lesson.type === "video" ||
            lesson.type === "text" ||
            !lesson.type
        );
      }

      return filteredLessons.map((lesson) => {
        const lessonModId =
          lesson.moduleId?._id || lesson.moduleId?.id || lesson.moduleId;
        const module = modules.find((m) => (m._id || m.id) === lessonModId);
        return {
          value: lesson._id || lesson.id,
          label: lesson.title || lesson.name || "Untitled Lesson",
          sublabel: `Type: ${lesson.type || "video"} | Module: ${
            module?.title || module?.name || "Unknown"
          } | Order: ${lesson.order ?? "-"}`,
        };
      });
    }

    return [];
  };

  const getSelectedOptionLabel = () => {
    const options = getDropdownOptions();
    const selected = options.find(
      (option) => option.value === form.referenceId
    );
    return selected ? selected.label : "Select an option...";
  };

  const categories = [
    { value: "all", label: "All Types", count: DRIP_TYPES.length },
    {
      value: "enrollment",
      label: "Enrollment",
      count: DRIP_TYPES.filter((t) => t.category === "enrollment").length,
    },
    {
      value: "completion",
      label: "Completion",
      count: DRIP_TYPES.filter((t) => t.category === "completion").length,
    },
    {
      value: "immediate",
      label: "Immediate",
      count: DRIP_TYPES.filter((t) => t.category === "immediate").length,
    },
    {
      value: "scheduled",
      label: "Scheduled",
      count: DRIP_TYPES.filter((t) => t.category === "scheduled").length,
    },
    {
      value: "achievement",
      label: "Achievement",
      count: DRIP_TYPES.filter((t) => t.category === "achievement").length,
    },
  ];

  const selectedDripType = DRIP_TYPES.find(
    (type) => type.value === form.dripType
  );

  // Helper function to determine if reference type selection should be shown
  const shouldShowReferenceTypeSelection = () => {
    return (
      form.dripType &&
      form.dripType !== "days_after_enrollment" &&
      form.dripType !== "specific_date"
    );
  };

  // Get lesson options for multi-select
  const getLessonMultiSelectOptions = () => {
    if (courseData?.module?.lessons) {
      return courseData.module.lessons.map((lesson) => ({
        value: lesson._id || lesson.id,
        label: lesson.title || lesson.name || "Untitled Lesson",
      }));
    }
    const courseContent = course || courseData;
    if (!courseContent) return [];
    const modules = courseContent.modules || courseContent.data?.modules || [];
    let lessons = courseContent.lessons || courseContent.data?.lessons || [];
    if (lessons.length === 0 && modules.length > 0) {
      lessons = modules.flatMap((m) => m.lessons || []);
    }
    return lessons.map((lesson) => ({
      value: lesson._id || lesson.id,
      label: lesson.title || lesson.name || "Untitled Lesson",
    }));
  };

  const handleSelectDripType = (dripTypeValue) => {
    let nextRefType = form.referenceType;
    if (dripTypeValue === "days_after_enrollment") {
      nextRefType = "enrollment";
    } else if (dripTypeValue === "specific_date") {
      nextRefType = "date";
    } else if (
      !nextRefType ||
      nextRefType === "enrollment" ||
      nextRefType === "date"
    ) {
      nextRefType = "lesson";
    }

    setForm((prev) => ({
      ...prev,
      dripType: dripTypeValue,
      referenceType: nextRefType,
      referenceId: prev.dripType !== dripTypeValue ? "" : prev.referenceId,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "dripType") {
      handleSelectDripType(value);
      return;
    }
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "referenceType" ? { referenceId: "" } : {}),
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Zap className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white/90 mb-2">
            Configure Drip Settings
          </h2>
          <p className="text-gray-600 dark:text-white/70 max-w-md mx-auto">
            Set up when and how this {targetType} should be released to students
          </p>
          {/* Show target information */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-white/[0.03] rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-500">
              <span className="font-medium">Target:</span> {targetType} (ID:{" "}
              {targetId})
            </p>
          </div>
        </div>
        <div className="space-y-8">
          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setActiveCategory(category.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeCategory === category.value
                      ? "bg-[#1b6294] text-white shadow-md"
                      : "bg-gray-100 dark:bg-white/[0.06] dark:text-white/70 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {category.label} ({category.count})
                </button>
              ))}
            </div>
          </div>

          {/* Drip Type Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white/90 mb-3">
              Choose Release Trigger
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getFilteredDripTypes().map((type) => {
                const IconComponent = type.icon;
                return (
                  <div
                    key={type.value}
                    className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      form.dripType === type.value
                        ? "border-[#1b6294] bg-blue-50/50 dark:bg-white/[0.1] shadow-md"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => handleSelectDripType(type.value)}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`p-2 rounded-lg ${
                          form.dripType === type.value
                            ? "bg-[#1b6294] text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white/90 mb-1">
                          {type.label}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-white/70">
                          {type.description}
                        </p>
                      </div>
                      <input
                        type="radio"
                        name="dripType"
                        value={type.value}
                        checked={form.dripType === type.value}
                        onChange={handleChange}
                        className="w-5 h-5 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conditional Fields */}
          {form.dripType && (
            <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 flex items-center">
                <div
                  className={`p-2 rounded-lg mr-3 ${
                    selectedDripType
                      ? "bg-[#1b6294] text-white"
                      : "bg-gray-400 text-white"
                  }`}
                >
                  {selectedDripType && (
                    <selectedDripType.icon className="w-5 h-5" />
                  )}
                </div>
                Configure: {selectedDripType?.label}
              </h3>

              {/* Reference Type - Only show if not "days_after_enrollment" and not "specific_date" */}
              {shouldShowReferenceTypeSelection() && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white/90">
                    Reference Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {REFERENCE_TYPES.map((refType) => {
                      const IconComponent = refType.icon;
                      return (
                        <div
                          key={refType.value}
                          className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                            form.referenceType === refType.value
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:border-purple-300"
                          }`}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              referenceType: refType.value,
                              referenceId: "",
                            }))
                          }
                        >
                          <div className="flex items-center space-x-3">
                            <IconComponent
                              className={`w-5 h-5 ${
                                form.referenceType === refType.value
                                  ? "text-purple-600"
                                  : "text-gray-500"
                              }`}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white/90">
                                {refType.label}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-white/70">
                                {refType.description}
                              </div>
                            </div>
                            <input
                              type="radio"
                              name="referenceType"
                              value={refType.value}
                              checked={form.referenceType === refType.value}
                              onChange={handleChange}
                              className="w-4 h-4 text-purple-600"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reference ID Dropdown - Only show if reference type is lesson or module */}
              {shouldShowReferenceTypeSelection() &&
                (form.referenceType === "lesson" ||
                  form.referenceType === "module") && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white/90">
                      {form.referenceType === "lesson"
                        ? "Select Lesson"
                        : "Select Module"}
                    </label>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full px-4 py-3 border dark:text-white/70 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-white/[0.03] text-left flex sm:flex-row items-center sm:items-center justify-between gap-4"
                      >
                        <span
                          className={
                            form.referenceId
                              ? "text-gray-900 dark:text-white/90"
                              : "text-gray-500 dark:text-white/70"
                          }
                        >
                          {getSelectedOptionLabel()}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                            dropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {dropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {loading ? (
                            <div className="px-4 py-3 text-gray-500 dark:text-white/60 text-center">
                              Loading...
                            </div>
                          ) : getDropdownOptions().length === 0 ? (
                            <div className="px-4 py-3 text-gray-500 dark:text-white/60 text-center">
                              {form.dripType === "after_quiz_passed"
                                ? "No quizzes available"
                                : form.dripType === "after_assignment_submitted"
                                ? "No assignments available"
                                : `No ${form.referenceType}s available`}
                            </div>
                          ) : (
                            getDropdownOptions().map((option) => (
                              <div
                                key={option.value}
                                className={`px-4 py-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-white/[0.05] border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors duration-150 ${
                                  form.referenceId === option.value
                                    ? "bg-purple-50 dark:bg-white/[0.08] text-purple-700 dark:text-purple-300 font-medium"
                                    : "text-gray-900 dark:text-white/90"
                                }`}
                                onClick={() => {
                                  setForm((prev) => ({
                                    ...prev,
                                    referenceId: option.value,
                                  }));
                                  setDropdownOpen(false);
                                }}
                              >
                                <div className="font-medium">
                                  {option.label}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-white/60">
                                  {option.sublabel}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Multi-select for lessons as targetId */}
              {form.targetType === "lesson" && Array.isArray(form.targetId) && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white/90">
                    Select Lessons to Apply Drip (Multi-select)
                  </label>
                  <div className="relative" ref={multiSelectRef}>
                    <button
                      type="button"
                      onClick={() => setMultiSelectOpen(!multiSelectOpen)}
                      className="w-full px-4 py-3 border dark:text-white/70 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-white/[0.03] text-left flex sm:flex-row items-center sm:items-center justify-between gap-4"
                    >
                      <span>
                        {Array.isArray(form.targetId) && form.targetId.length > 0
                          ? `${form.targetId.length} lesson(s) selected`
                          : "Select lessons..."}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                          multiSelectOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {multiSelectOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="mr-2"
                            id="select-all-lessons"
                          />
                          <label htmlFor="select-all-lessons" className="text-sm font-medium text-gray-900 dark:text-white/90">
                            Select All
                          </label>
                        </div>
                        {getLessonMultiSelectOptions().map((option) => (
                          <div
                            key={option.value}
                            className="px-4 py-2 flex items-center cursor-pointer hover:bg-purple-50 dark:hover:bg-white/[0.05] border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors duration-150 text-gray-900 dark:text-white/90"
                            onClick={() => handleMultiSelectChange(option.value)}
                          >
                            <input
                              type="checkbox"
                              checked={Array.isArray(form.targetId) && form.targetId.includes(option.value)}
                              onChange={() => handleMultiSelectChange(option.value)}
                              className="mr-2"
                            />
                            <span>{option.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Delay Days */}
              {(form.dripType === "days_after_enrollment" ||
                form.dripType === "days_after_lesson_completed" ||
                form.dripType === "days_after_module_completed") && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white/90">
                    Delay (Days)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="delayDays"
                      value={form.delayDays}
                      onChange={handleChange}
                      min={0}
                      placeholder="Number of days to wait"
                      className="w-full pl-12 pr-4 py-3 border dark:text-white/70 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Unlock Date */}
              {form.dripType === "specific_date" && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white/90">
                    Unlock Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      name="unlockDate"
                      value={
                        form.unlockDate
                          ? form.unlockDate.slice(0, 10) // Show only YYYY-MM-DD
                          : ""
                      }
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border dark:text-white/70 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Required Score */}
              {(form.dripType === "after_quiz_passed" ||
                form.dripType === "after_assignment_submitted") && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white/90">
                    Required Score (%)
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 dark:text-white/90 text-gray-400" />
                    <input
                      type="number"
                      name="requiredScore"
                      value={form.requiredScore}
                      onChange={handleChange}
                      min={0}
                      max={100}
                      placeholder="Minimum score required"
                      className="w-full pl-12 pr-4 py-3 border  dark:text-white/70 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              )}

              {/* Condition Operator */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white/90">
                  Condition Logic
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CONDITION_OPERATORS.map((operator) => (
                    <div
                      key={operator.value}
                      className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                        form.conditionOperator === operator.value
                          ? "border-purple-500 bg-purple-50 dark:bg-white/[0.09]"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          conditionOperator: operator.value,
                        }))
                      }
                    >
                      <div className="flex sm:flex-row items-center sm:items-center justify-between gap-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white/90">
                            {operator.label}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-white/70">
                            {operator.description}
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="conditionOperator"
                          value={operator.value}
                          checked={form.conditionOperator === operator.value}
                          onChange={handleChange}
                          className="w-4 h-4 text-purple-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!form.dripType}
              className="px-8 py-3 bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white rounded-xl shadow-md shadow-[#1b6294]/20 hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium active:scale-95 cursor-pointer"
            >
              Save Drip Settings for {targetType}
            </button>
          </div>
        </div>
      </div>
      <PopupAlert
        message={popup.message}
        type={popup.type}
        isVisible={popup.isVisible}
        onClose={() => setPopup({ ...popup, isVisible: false })}
      />
    </div>
  );
};

export default DripPopup;
