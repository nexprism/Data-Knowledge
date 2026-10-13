import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchProgramsAdmin,
  createProgram,
  updateProgram,
  deleteProgram,
  toggleProgramStatus,
  clearProgramOfferMessages,
  ProgramOffer,
} from "../../store/slices/programOffer";
import { fetchCourses } from "../../store/slices/course";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  Layers,
  Plus,
  Search,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  Check,
  ListPlus,
  Wrench,
  Link as LinkIcon,
  BookOpen,
  Loader2,
  Star,
  PieChart,
  Cloud,
  Code,
  Database,
  Cpu,
  Briefcase,
} from "lucide-react";

const ICON_OPTIONS = [
  { value: "star", label: "Star / Flagship", icon: Star },
  { value: "analytics", label: "Analytics / Chart", icon: PieChart },
  { value: "cloud", label: "Cloud / Engineering", icon: Cloud },
  { value: "sparkles", label: "AI / Sparkles", icon: Sparkles },
  { value: "code", label: "Code / Tech", icon: Code },
  { value: "database", label: "Database / SQL", icon: Database },
  { value: "cpu", label: "ML / Processor", icon: Cpu },
  { value: "briefcase", label: "Career / Business", icon: Briefcase },
];

const renderAdminIcon = (iconName?: string) => {
  const match = ICON_OPTIONS.find((opt) => opt.value === iconName);
  const IconComponent = match ? match.icon : Star;
  return <IconComponent className="w-4 h-4" />;
};

const ProgramsOffer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { programs, loading, actionLoading, error, successMessage } = useAppSelector(
    (state) => state.programOffer
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProgramOffer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProgramOffer | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [shortTitle, setShortTitle] = useState("");
  const [badge, setBadge] = useState("Featured Program");
  const [icon, setIcon] = useState("star");
  const [highlights, setHighlights] = useState<string[]>([""]);
  const [toolsInput, setToolsInput] = useState("");
  const [courseId, setCourseId] = useState("");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchProgramsAdmin());
  }, [dispatch]);

  const loadCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const result = await dispatch(fetchCourses({ page: 1, limit: 1000 })).unwrap();
      setCoursesList(result?.courses || []);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    } finally {
      setCoursesLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        dispatch(clearProgramOfferMessages());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  const resetForm = () => {
    setEditingItem(null);
    setTitle("");
    setShortTitle("");
    setBadge("Featured Program");
    setIcon("star");
    setHighlights(["", "", ""]);
    setToolsInput("");
    setCourseId("");
    setOrder(0);
    setIsActive(true);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: ProgramOffer) => {
    setEditingItem(item);
    setTitle(item.title);
    setShortTitle(item.shortTitle);
    setBadge(item.badge || "Featured Program");
    setIcon(item.icon || "star");
    setHighlights(item.highlights && item.highlights.length > 0 ? item.highlights : [""]);
    setToolsInput(item.tools ? item.tools.join(", ") : "");
    setCourseId(item.courseId || "");
    setOrder(item.order || 0);
    setIsActive(item.isActive);
    setIsModalOpen(true);
  };

  const handleAddHighlight = () => {
    setHighlights([...highlights, ""]);
  };

  const handleHighlightChange = (index: number, value: string) => {
    const updated = [...highlights];
    updated[index] = value;
    setHighlights(updated);
  };

  const handleRemoveHighlight = (index: number) => {
    if (highlights.length === 1) {
      setHighlights([""]);
      return;
    }
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !shortTitle.trim()) return;

    const cleanedHighlights = highlights.map((h) => h.trim()).filter(Boolean);
    const cleanedTools = toolsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: Partial<ProgramOffer> = {
      title: title.trim(),
      shortTitle: shortTitle.trim(),
      badge: badge.trim(),
      icon: icon || "star",
      highlights: cleanedHighlights,
      tools: cleanedTools,
      courseId: courseId.trim(),
      order: Number(order) || 0,
      isActive,
    };

    if (editingItem) {
      await dispatch(updateProgram({ id: editingItem._id, data: payload }));
    } else {
      await dispatch(createProgram(payload));
    }

    setIsModalOpen(false);
    resetForm();
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await dispatch(deleteProgram(itemToDelete._id));
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  // Filtered list
  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const matchesSearch =
        search === "" ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.shortTitle.toLowerCase().includes(search.toLowerCase()) ||
        (p.badge && p.badge.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.isActive) ||
        (statusFilter === "inactive" && !p.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [programs, search, statusFilter]);

  return (
    <>
      <PageMeta
        title="Programs We Offer | Data Knowledge Admin"
        description="Manage the dynamic Programs We Offer tracks on the homepage"
      />
      <PageBreadcrumb pageTitle="Programs We Offer Management" />

      <div className="space-y-6">
        {/* Notification Toasts */}
        {successMessage && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl animate-fade-in dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl animate-fade-in dark:bg-red-950/40 dark:border-red-800 dark:text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search programs by title, badge..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              />
            </div>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3498db]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Add Program Button */}
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1b6294] to-[#103a58] text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Program Track</span>
          </button>
        </div>

        {/* Programs Grid / Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-3">
              <div className="w-8 h-8 border-3 border-[#3498db] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Loading programs...</p>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-3">
              <Layers className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
              <p className="text-base font-semibold text-gray-700 dark:text-gray-200">No program tracks found</p>
              <p className="text-xs text-gray-500">Click &quot;Add Program Track&quot; above to create a new program.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-mono">
                    <th className="py-3.5 px-4">Order</th>
                    <th className="py-3.5 px-4">Tab Title</th>
                    <th className="py-3.5 px-4">Full Program Title</th>
                    <th className="py-3.5 px-4">Badge</th>
                    <th className="py-3.5 px-4">Highlights</th>
                    <th className="py-3.5 px-4">Tools</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                  {filteredPrograms.map((program) => (
                    <tr
                      key={program._id}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-750 transition-colors"
                    >
                      <td className="py-4 px-4 font-mono text-xs font-bold text-gray-500">
                        #{program.order}
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <span className="p-1.5 rounded-lg bg-[#3498db]/10 text-[#1b6294] border border-[#3498db]/20">
                            {renderAdminIcon(program.icon)}
                          </span>
                          <span className="max-w-[160px] truncate" title={program.shortTitle}>{program.shortTitle}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-800 dark:text-gray-200 max-w-xs truncate" title={program.title}>
                        {program.title}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#3498db]/10 text-[#1b6294] border border-[#3498db]/20 max-w-[120px] truncate" title={program.badge}>
                          {program.badge}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-600 dark:text-gray-300">
                        {program.highlights?.length || 0} Points
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-600 dark:text-gray-300">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {program.tools?.slice(0, 3).map((t, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">
                              {t}
                            </span>
                          ))}
                          {program.tools && program.tools.length > 3 && (
                            <span className="text-[10px] text-gray-400">+{program.tools.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => dispatch(toggleProgramStatus(program._id))}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            program.isActive
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          {program.isActive ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(program)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-[#3498db] hover:bg-blue-50 dark:hover:bg-gray-700 transition-all"
                          title="Edit Program"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete(program);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 transition-all"
                          title="Delete Program"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#3498db]" />
                  {editingItem ? "Edit Program Track" : "Create New Program Track"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Configure the track title, bullet points, tools, and tab ordering.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Short Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Tab Label / Short Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={shortTitle}
                    onChange={(e) => setShortTitle(e.target.value)}
                    placeholder="e.g. Combo Track, Data Analyst"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3498db]"
                  />
                </div>

                {/* Badge */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. Flagship Combo, Most Popular"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3498db]"
                  />
                </div>
              </div>

              {/* Icon Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Tab Icon
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ICON_OPTIONS.map((opt) => {
                    const isSelected = icon === opt.value;
                    const IconCmp = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setIcon(opt.value)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? "bg-[#3498db]/15 border-[#3498db] text-[#1b6294] dark:text-blue-300 shadow-xs"
                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        <IconCmp className={`w-4 h-4 shrink-0 ${isSelected ? "text-[#3498db]" : "text-gray-400"}`} />
                        <span className="truncate">{opt.label.split(" / ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Full Program Heading *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master Data Analytics, Engineering & Science"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3498db]"
                />
              </div>

              {/* Key Highlights Bullet Points */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ListPlus className="w-4 h-4 text-[#3498db]" />
                    Key Highlights (Bullet Points)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddHighlight}
                    className="text-xs font-bold text-[#3498db] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Bullet Point
                  </button>
                </div>

                <div className="space-y-2">
                  {highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-gray-400 w-5 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        value={highlight}
                        onChange={(e) => handleHighlightChange(idx, e.target.value)}
                        placeholder={`Highlight point ${idx + 1}...`}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3498db]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(idx)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                        title="Remove point"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tools & Technologies */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-[#3498db]" />
                  Tools Covered (Comma separated)
                </label>
                <input
                  type="text"
                  value={toolsInput}
                  onChange={(e) => setToolsInput(e.target.value)}
                  placeholder="e.g. Python, SQL, Power BI, Tableau, PySpark, Snowflake, AWS"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3498db]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Course ID or Link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-gray-400" />
                    Target Course (Curriculum / Syllabus Page)
                  </label>
                  <div className="relative">
                    <select
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3498db] appearance-none"
                    >
                      <option value="">Select a course</option>
                      {coursesList.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <BookOpen className="h-4 w-4" />
                    </div>
                  </div>
                  {coursesLoading ? (
                    <p className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading courses...
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      When selected, the &quot;View Curriculum&quot; button on the homepage redirects
                      users to this course&apos;s syllabus / details page.
                    </p>
                  )}
                </div>

                {/* Tab Ordering */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Tab Display Order (0 = First)
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3498db]"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#3498db] rounded focus:ring-[#3498db]"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                  Track is Active and Visible on Homepage
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1b6294] to-[#103a58] text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : editingItem ? "Update Track" : "Create Track"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Program Track?</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Are you sure you want to delete &quot;{itemToDelete.title}&quot;? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 shadow-md"
              >
                {actionLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProgramsOffer;
