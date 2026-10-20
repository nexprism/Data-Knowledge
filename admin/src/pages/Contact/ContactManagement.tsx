import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchContactPageAdmin,
  updateContactPageAdmin,
  fetchContactRequests,
  updateContactRequest,
  deleteContactRequest,
  clearContactMessages,
  ContactPageData,
  ContactRequestData,
} from "../../store/slices/contactSlice";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  Mail,
  Phone,
  MessageSquare,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Save,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Send,
  Building,
  Globe,
} from "lucide-react";
import { toast } from "react-hot-toast";

const ContactManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    contactPage,
    requests,
    pagination,
    summary,
    loading,
    saving,
    error,
    successMessage,
  } = useAppSelector((state) => state.contact);

  // Active Tab: "requests" or "content"
  const [activeTab, setActiveTab] = useState<"requests" | "content">("requests");

  // Requests Filter State
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Request Details Modal State
  const [selectedRequest, setSelectedRequest] = useState<ContactRequestData | null>(null);
  const [detailStatus, setDetailStatus] = useState<"pending" | "in_progress" | "resolved">("pending");
  const [adminNotes, setAdminNotes] = useState("");

  // Page Content Form State
  const [contentFormData, setContentFormData] = useState<ContactPageData | null>(null);

  // Load initial data and mark contact requests as viewed
  useEffect(() => {
    dispatch(fetchContactPageAdmin());
    dispatch(fetchContactRequests({ page: 1, limit: 10, status: "all" }));

    const now = new Date().toISOString();
    localStorage.setItem("admin_contact_last_viewed_at", now);
    window.dispatchEvent(new Event("contact:viewed"));
  }, [dispatch]);

  // Sync content form data
  useEffect(() => {
    if (contactPage) {
      setContentFormData(JSON.parse(JSON.stringify(contactPage)));
    }
  }, [contactPage]);

  // Handle messages
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      const timer = setTimeout(() => {
        dispatch(clearContactMessages());
      }, 4000);
      return () => clearTimeout(timer);
    }
    if (error) {
      toast.error(error);
      const timer = setTimeout(() => {
        dispatch(clearContactMessages());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  // Refetch requests when filters change
  const handleFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
    dispatch(
      fetchContactRequests({
        page: 1,
        limit: 10,
        search: searchInput,
        status: newStatus,
      })
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    dispatch(
      fetchContactRequests({
        page: 1,
        limit: 10,
        search: searchInput,
        status: statusFilter,
      })
    );
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      dispatch(
        fetchContactRequests({
          page: newPage,
          limit: 10,
          search: searchInput,
          status: statusFilter,
        })
      );
    }
  };

  const handleOpenDetailModal = (req: ContactRequestData) => {
    setSelectedRequest(req);
    setDetailStatus(req.status);
    setAdminNotes(req.adminNotes || "");
  };

  const handleSaveRequestDetail = async () => {
    if (!selectedRequest) return;
    try {
      await dispatch(
        updateContactRequest({
          id: selectedRequest._id,
          status: detailStatus,
          adminNotes,
        })
      ).unwrap();
      setSelectedRequest(null);
    } catch (err: any) {
      // Error handled by redux
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this contact request?")) {
      try {
        await dispatch(deleteContactRequest(id)).unwrap();
      } catch (err: any) {
        // Error handled by redux
      }
    }
  };

  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentFormData) return;
    try {
      await dispatch(updateContactPageAdmin(contentFormData)).unwrap();
    } catch (err: any) {
      // Error handled by redux
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <RefreshCw className="w-3 h-3" />
            In Progress
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="w-3 h-3" />
            Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div>
      <PageMeta
        title="Contact Page & Requests Management | Data Knowledge Admin"
        description="Manage Contact Page content, configurable fields, and process visitor inquiries."
      />
      <PageBreadcrumb pageTitle="Contact Management" />

      {/* Header and Tab Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Contact & Inquiries Management
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage dynamic contact page content and respond to visitor contact form submissions
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-xs">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              activeTab === "requests"
                ? "bg-white dark:bg-gray-700 text-brand-500 dark:text-blue-400 shadow-xs"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Contact Requests</span>
            {summary.pending > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                {summary.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("content")}
            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              activeTab === "content"
                ? "bg-white dark:bg-gray-700 text-brand-500 dark:text-blue-400 shadow-xs"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Page Content & Settings</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CONTACT REQUESTS */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-xs">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Total Submissions
              </span>
              <span className="text-2xl font-extrabold text-gray-800 dark:text-white mt-1 block">
                {summary.total}
              </span>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-amber-200 dark:border-amber-800/40 shadow-xs">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Pending
              </span>
              <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-1 block">
                {summary.pending}
              </span>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-blue-200 dark:border-blue-800/40 shadow-xs">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                In Progress
              </span>
              <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 mt-1 block">
                {summary.in_progress}
              </span>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800/40 shadow-xs">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Resolved
              </span>
              <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1 block">
                {summary.resolved}
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
            {/* Filter & Search Bar */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-xs text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 focus:outline-none focus:border-brand-500"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </form>

              {/* Status Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl text-xs font-bold">
                  {["all", "pending", "in_progress", "resolved"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleFilterChange(st)}
                      className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                        statusFilter === st
                          ? "bg-white dark:bg-gray-800 text-brand-500 dark:text-blue-400 shadow-xs"
                          : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {st === "in_progress" ? "In Progress" : st}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    dispatch(
                      fetchContactRequests({
                        page: currentPage,
                        limit: 10,
                        search: searchInput,
                        status: statusFilter,
                      })
                    )
                  }
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 transition cursor-pointer"
                  title="Refresh Requests"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Requests Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-3.5">Date / Time</th>
                    <th className="px-6 py-3.5">Visitor</th>
                    <th className="px-6 py-3.5">Subject & Message</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {requests.map((item) => {
                    const dateObj = new Date(item.createdAt);
                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                          <div className="font-semibold text-gray-800 dark:text-white">
                            {dateObj.toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {dateObj.toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-primary flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            <a href={`mailto:${item.email}`} className="hover:underline">
                              {item.email}
                            </a>
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <a href={`tel:${item.phone}`} className="hover:underline">
                              {item.phone}
                            </a>
                          </div>
                        </td>

                        <td className="px-6 py-4 max-w-xs">
                          <span className="font-bold text-gray-800 dark:text-gray-200 block truncate">
                            {item.subject}
                          </span>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                            {item.message || "No message body."}
                          </p>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenDetailModal(item)}
                              className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-600 hover:text-white transition cursor-pointer"
                              title="View Details & Update Status"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRequest(item._id)}
                              className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 hover:bg-red-600 hover:text-white transition cursor-pointer"
                              title="Delete Request"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {requests.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500">
                        No contact requests match your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CONTACT PAGE CONTENT & SETTINGS */}
      {activeTab === "content" && contentFormData && (
        <form onSubmit={handleContentSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Public Contact Page Content
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Changes made here are reflected on the public /contact page immediately.
              </p>
            </div>

            {/* Header / Intro Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Badge Text
                </label>
                <input
                  type="text"
                  value={contentFormData.badgeText}
                  onChange={(e) =>
                    setContentFormData({ ...contentFormData, badgeText: e.target.value })
                  }
                  placeholder="GET IN TOUCH"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-800 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Page Title
                </label>
                <input
                  type="text"
                  value={contentFormData.title}
                  onChange={(e) =>
                    setContentFormData({ ...contentFormData, title: e.target.value })
                  }
                  placeholder="CONTACT US."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-800 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Intro Description
                </label>
                <textarea
                  rows={3}
                  value={contentFormData.description}
                  onChange={(e) =>
                    setContentFormData({ ...contentFormData, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-800 dark:text-white focus:outline-none focus:border-primary resize-vertical"
                />
              </div>
            </div>

            {/* Communication Details */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                Support Channels & Phone Numbers
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Primary Support Email
                  </label>
                  <input
                    type="email"
                    value={contentFormData.primaryEmail}
                    onChange={(e) =>
                      setContentFormData({ ...contentFormData, primaryEmail: e.target.value })
                    }
                    placeholder="dataknowledge.class@gmail.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-800 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Email Description Note
                  </label>
                  <input
                    type="text"
                    value={contentFormData.emailSupportDescription}
                    onChange={(e) =>
                      setContentFormData({
                        ...contentFormData,
                        emailSupportDescription: e.target.value,
                      })
                    }
                    placeholder="For program inquiries, course questions..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-800 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Primary Call & WhatsApp Phone
                  </label>
                  <input
                    type="text"
                    value={contentFormData.primaryPhone}
                    onChange={(e) =>
                      setContentFormData({ ...contentFormData, primaryPhone: e.target.value })
                    }
                    placeholder="+91 74837 41501"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-800 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Alternate Phone
                  </label>
                  <input
                    type="text"
                    value={contentFormData.alternatePhone}
                    onChange={(e) =>
                      setContentFormData({ ...contentFormData, alternatePhone: e.target.value })
                    }
                    placeholder="+91 82377 00626"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-800 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    WhatsApp Chat Number (Digits only with country code)
                  </label>
                  <input
                    type="text"
                    value={contentFormData.whatsappNumber}
                    onChange={(e) =>
                      setContentFormData({ ...contentFormData, whatsappNumber: e.target.value })
                    }
                    placeholder="917483741501"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-800 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Office / Academy Address
                  </label>
                  <input
                    type="text"
                    value={contentFormData.address}
                    onChange={(e) =>
                      setContentFormData({ ...contentFormData, address: e.target.value })
                    }
                    placeholder="Data Knowledge Classes & Training, India"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-800 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Portal & Links */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                Classes Portal & Email Alert Recipient
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Portal Title
                  </label>
                  <input
                    type="text"
                    value={contentFormData.portalTitle}
                    onChange={(e) =>
                      setContentFormData({ ...contentFormData, portalTitle: e.target.value })
                    }
                    placeholder="Live Classes Portal"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-800 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Portal URL
                  </label>
                  <input
                    type="url"
                    value={contentFormData.portalUrl}
                    onChange={(e) =>
                      setContentFormData({ ...contentFormData, portalUrl: e.target.value })
                    }
                    placeholder="https://classes.dataknowledge.in/"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-800 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Admin Notification Recipient Email (Optional Override)
                  </label>
                  <input
                    type="text"
                    value={contentFormData.notificationEmail}
                    onChange={(e) =>
                      setContentFormData({
                        ...contentFormData,
                        notificationEmail: e.target.value,
                      })
                    }
                    placeholder="e.g. notifications@dataknowledge.in (or leave empty to use default admin emails)"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-800 dark:text-white focus:outline-none focus:border-primary"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    If configured, contact form submission alert emails will be delivered here in addition to standard admin notifications.
                  </p>
                </div>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={contentFormData.isActive}
                  onChange={(e) =>
                    setContentFormData({ ...contentFormData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Page is Active and Published
                </span>
              </label>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Contact Page Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* REQUEST DETAIL & STATUS MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-white">
                    Contact Request Details
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    Received on {new Date(selectedRequest.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Visitor Quick Info */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Full Name
                  </span>
                  <span className="text-xs font-bold text-gray-800 dark:text-white">
                    {selectedRequest.name}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Source
                  </span>
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {selectedRequest.source || "Contact Form"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Email Address
                  </span>
                  <a
                    href={`mailto:${selectedRequest.email}`}
                    className="text-xs text-brand-500 font-medium hover:underline block truncate dark:text-blue-400"
                  >
                    {selectedRequest.email}
                  </a>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Phone Number
                  </span>
                  <a
                    href={`tel:${selectedRequest.phone}`}
                    className="text-xs text-gray-800 dark:text-white font-medium hover:underline block"
                  >
                    {selectedRequest.phone}
                  </a>
                </div>
              </div>

              {/* Subject */}
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Subject
                </span>
                <span className="inline-block px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold">
                  {selectedRequest.subject}
                </span>
              </div>

              {/* Submitted Message */}
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Submitted Message
                </span>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {selectedRequest.message || "No message body provided."}
                </div>
              </div>

              {/* Manage Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Request Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["pending", "in_progress", "resolved"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setDetailStatus(st)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition cursor-pointer ${
                        detailStatus === st
                          ? st === "pending"
                            ? "border-amber-500 bg-amber-500 text-white shadow-xs font-black"
                            : st === "in_progress"
                            ? "border-blue-600 bg-blue-600 text-white shadow-xs font-black"
                            : "border-emerald-600 bg-emerald-600 text-white shadow-xs font-black"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {st === "in_progress" ? "In Progress" : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Admin Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notes on communication, resolution, follow-up..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-brand-500 resize-vertical"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <a
                  href={`mailto:${selectedRequest.email}?subject=Re: ${encodeURIComponent(
                    selectedRequest.subject
                  )}`}
                  className="text-xs text-brand-500 font-bold hover:underline flex items-center gap-1.5 dark:text-blue-400"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply via Email</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRequestDetail}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Status</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactManagement;
