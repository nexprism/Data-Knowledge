import React, { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchProvenResults,
  createProvenResult,
  updateProvenResult,
  deleteProvenResult,
  toggleProvenResultStatus,
  clearProvenResultMessages,
  ProvenResult,
} from "../../store/slices/provenResult";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { IMAGE_BASE_URL } from "../../utils/apiConfig";
import {
  Trophy,
  Award,
  Building,
  Eye,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  X,
  Upload,
  Sparkles,
} from "lucide-react";

const ProvenResults: React.FC = () => {
  const dispatch = useAppDispatch();
  const { results, loading, actionLoading, error, successMessage } = useAppSelector(
    (state) => state.provenResult
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProvenResult | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProvenResult | null>(null);

  // Form State
  const [studentName, setStudentName] = useState("");
  const [company, setCompany] = useState("");
  const [salary, setSalary] = useState("Salary: 12 LPA");
  const [transitionTag, setTransitionTag] = useState("NON-TECH TO TECH TRANSITION");
  const [badge, setBadge] = useState("SUCCESS STORY");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    dispatch(fetchProvenResults());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        dispatch(clearProvenResultMessages());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  const resetForm = () => {
    setEditingItem(null);
    setStudentName("");
    setCompany("");
    setSalary("Salary: 12 LPA");
    setTransitionTag("NON-TECH TO TECH TRANSITION");
    setBadge("SUCCESS STORY");
    setOrder(0);
    setIsActive(true);
    setImageUrl("");
    setImageFile(null);
    setImagePreview("");
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: ProvenResult) => {
    setEditingItem(item);
    setStudentName(item.studentName);
    setCompany(item.company);
    setSalary(item.salary || "Salary: 12 LPA");
    setTransitionTag(item.transitionTag || "NON-TECH TO TECH TRANSITION");
    setBadge(item.badge || "★ SUCCESS STORY");
    setOrder(item.order || 0);
    setIsActive(item.isActive);
    setImageUrl(item.image?.startsWith("http") ? item.image : "");
    setImageFile(null);
    setImagePreview(
      item.image
        ? item.image.startsWith("http")
          ? item.image
          : `${IMAGE_BASE_URL}/uploads/${item.image}`
        : ""
    );
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !company.trim()) {
      alert("Please fill in Student Name and Company Name");
      return;
    }

    const formData = new FormData();
    formData.append("studentName", studentName.trim());
    formData.append("company", company.trim());
    formData.append("salary", salary.trim());
    formData.append("transitionTag", transitionTag.trim());
    formData.append("badge", badge.trim());
    formData.append("order", String(order));
    formData.append("isActive", String(isActive));

    if (imageFile) {
      formData.append("image", imageFile);
    } else if (imageUrl.trim()) {
      formData.append("image", imageUrl.trim());
    }

    if (editingItem) {
      await dispatch(updateProvenResult({ id: editingItem._id, formData }));
    } else {
      await dispatch(createProvenResult(formData));
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (itemToDelete) {
      await dispatch(deleteProvenResult(itemToDelete._id));
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleToggle = (id: string) => {
    dispatch(toggleProvenResultStatus(id));
  };

  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      const matchesSearch =
        item.studentName.toLowerCase().includes(search.toLowerCase()) ||
        item.company.toLowerCase().includes(search.toLowerCase()) ||
        item.salary?.toLowerCase().includes(search.toLowerCase()) ||
        item.transitionTag?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? item.isActive
          : !item.isActive;

      return matchesSearch && matchesStatus;
    });
  }, [results, search, statusFilter]);

  const activeCount = results.filter((r) => r.isActive).length;
  const companyCount = new Set(results.map((r) => r.company)).size;

  const getImageSrc = (img?: string) => {
    if (!img) return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=688&auto=format&fit=crop";
    if (img.startsWith("http")) return img;
    return `${IMAGE_BASE_URL}/uploads/${img}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageMeta
        title="Our Proven Results (Marquee) | Admin"
        description="Manage student placement cards shown on the landing page marquee"
      />
      <PageBreadcrumb pageTitle="Proven Results Marquee" />

      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Results Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-amber-950 to-slate-900 border border-amber-500/30 shadow-lg flex items-center justify-between relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block">
              Total Results
            </span>
            <h3 className="text-3xl font-black text-white mt-2 tracking-tight">{results.length}</h3>
            <p className="text-xs text-gray-300 mt-1">Student placement cards</p>
          </div>
          <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/30 group-hover:scale-105 transition-transform shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        {/* Active on Marquee Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 border border-emerald-500/30 shadow-lg flex items-center justify-between relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block">
              Active on Marquee
            </span>
            <h3 className="text-3xl font-black text-white mt-2 tracking-tight">{activeCount}</h3>
            <p className="text-xs text-gray-300 mt-1">Live in infinite scrolling track</p>
          </div>
          <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 group-hover:scale-105 transition-transform shrink-0">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        {/* Partner Companies Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 border border-blue-500/30 shadow-lg flex items-center justify-between relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 inline-block">
              Companies
            </span>
            <h3 className="text-3xl font-black text-white mt-2 tracking-tight">{companyCount}</h3>
            <p className="text-xs text-gray-300 mt-1">Recruiting organizations</p>
          </div>
          <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 group-hover:scale-105 transition-transform shrink-0">
            <Building className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Section Header & Search */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="p-2 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 inline-flex">
                <Sparkles className="w-4 h-4" />
              </span>
              Our Proven Results Marquee Cards
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Add and manage student success cards displayed in the clean infinite marquee section on the home page.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Proven Result
          </button>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student, company, salary, or transition tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Cards</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Proven Result Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-gray-900">No Proven Results Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {search ? "No cards match your search criteria." : "Click 'Add Proven Result' above to create your first student card."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredResults.map((item) => (
            <div
              key={item._id}
              className="rounded-3xl border border-gray-200 bg-white p-3 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Photo Area */}
              <div className="relative h-56 rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src={getImageSrc(item.image)}
                  alt={item.studentName}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />

                {/* Badge Overlay */}
                {item.badge && (
                  <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white font-black text-[9px] tracking-wider px-2.5 py-1 rounded-full uppercase shadow-sm">
                    {item.badge}
                  </span>
                )}

                {/* Active Pill */}
                <span
                  className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.isActive
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-700 text-white"
                  }`}
                >
                  {item.isActive ? "Active" : "Hidden"}
                </span>
              </div>

              {/* Bottom Box (Light clean design matching website) */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mt-2.5 text-center flex flex-col items-center">
                <h4 className="font-extrabold text-gray-900 text-base tracking-tight line-clamp-1">
                  {item.studentName}
                </h4>
                <p className="text-xs font-bold text-blue-600 tracking-wider uppercase mt-0.5 line-clamp-1">
                  {item.company}
                </p>

                <div className="mt-2.5 w-full py-1.5 px-3 rounded-lg border border-blue-200 bg-blue-50/80 text-blue-700 font-extrabold text-xs tracking-wide">
                  {item.salary}
                </div>

                <div className="mt-1.5 w-full py-1 px-2 rounded-md bg-white border border-gray-200/80 text-gray-700 font-bold text-[10px] uppercase tracking-wider line-clamp-1">
                  {item.transitionTag}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(item._id)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      item.isActive
                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                    }`}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </button>
                  <span className="text-[11px] text-gray-400">Order: {item.order}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-all border border-gray-200"
                    title="Edit Card"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setItemToDelete(item);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-200"
                    title="Delete Card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL (CLEAN LIGHT THEME) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-600 border border-amber-200">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingItem ? "Edit Proven Result Card" : "Add New Proven Result Card"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Displayed dynamically on the homepage marquee section
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content: Form & Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-h-[75vh] overflow-y-auto">
              {/* Form (7 cols) */}
              <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Student Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Puja Kumari"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ITC INFOTECH"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Salary / Placement Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Salary: 12 LPA or Placed in 90 Days"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Transition Tag / Role
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NON-TECH TO TECH TRANSITION"
                      value={transitionTag}
                      onChange={(e) => setTransitionTag(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Top Badge Text
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ★ SUCCESS STORY"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={order}
                      onChange={(e) => setOrder(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Student Photo (Upload or URL)
                  </label>
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-amber-500 bg-gray-50/80 cursor-pointer transition-all">
                      <Upload className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-700 font-medium">Click to upload photo</span>
                      <span className="text-[10px] text-gray-500">PNG, JPG, WEBP up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>

                    <div className="relative">
                      <span className="text-[10px] text-gray-500 absolute left-3 top-2.5">Or URL:</span>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value);
                          setImagePreview(e.target.value);
                        }}
                        className="w-full pl-16 pr-3.5 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-gray-300"
                  />
                  <label htmlFor="isActiveToggle" className="text-xs font-medium text-gray-700 cursor-pointer">
                    Show immediately in the landing page marquee (Active)
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 rounded-xl shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? "Saving..." : editingItem ? "Update Card" : "Add to Marquee"}
                  </button>
                </div>
              </form>

              {/* Live Preview (5 cols - Light Clean Theme) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 bg-gray-50 border border-gray-200 rounded-2xl">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Live Marquee Card Preview
                </span>

                <div className="w-[240px] rounded-3xl border border-gray-200 bg-white p-2.5 shadow-lg">
                  <div className="relative h-52 rounded-2xl overflow-hidden bg-gray-100">
                    <img
                      src={
                        imagePreview ||
                        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=688&auto=format&fit=crop"
                      }
                      alt="Preview"
                      className="w-full h-full object-cover object-top"
                    />
                    {badge && (
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white font-black text-[9px] tracking-wider px-2.5 py-0.5 rounded-full uppercase shadow">
                        {badge}
                      </span>
                    )}
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 mt-2 text-center">
                    <h4 className="font-extrabold text-gray-900 text-sm tracking-tight line-clamp-1">
                      {studentName || "Student Name"}
                    </h4>
                    <p className="text-[11px] font-bold text-blue-600 tracking-wider uppercase mt-0.5 line-clamp-1">
                      {company || "COMPANY NAME"}
                    </p>
                    <div className="mt-2 w-full py-1 px-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-extrabold text-[11px]">
                      {salary || "Salary: 12 LPA"}
                    </div>
                    <div className="mt-1 w-full py-0.5 px-2 rounded-md bg-white border border-gray-200/80 text-gray-700 font-bold text-[9px] uppercase tracking-wider">
                      {transitionTag || "NON-TECH TO TECH TRANSITION"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (LIGHT THEME) */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">Delete Proven Result Card?</h3>
            <p className="text-xs text-gray-500 text-center mt-1">
              Are you sure you want to remove <span className="text-gray-900 font-bold">{itemToDelete.studentName}</span> from the placement marquee?
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvenResults;
