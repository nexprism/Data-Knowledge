import React, { useEffect, useState } from "react";
import { getAllQueries, updateQuery } from "../../store/slices/query";
import { RootState } from "../../store";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { 
  Search, 
  Filter, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  MessageCircle,
  Calendar,
  User,
  Mail,
  Phone,
  Pencil,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

interface Query {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  category: string;
  status: string;
  courseTitle?: string;
  course?: any;
  source?: string;
  createdAt: string;
  updatedAt?: string;
}

const QueryList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error, queries } = useAppSelector((state: RootState) => state.query);
  const token = useAppSelector((state: RootState) => state.auth.token);

  // Local state for search and filters
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [modalStatus, setModalStatus] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Allowed status values for filter
  const allowedStatuses = [
    { value: "new", label: "New" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  // Filter and search queries
  const filteredQueries = React.useMemo(() => {
    if (!queries) return [];
    
    return queries.filter((query) => {
      const matchesSearch = searchInput === "" || 
        query.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        query.email.toLowerCase().includes(searchInput.toLowerCase()) ||
        query.message.toLowerCase().includes(searchInput.toLowerCase()) ||
        (query.courseTitle && query.courseTitle.toLowerCase().includes(searchInput.toLowerCase()));
      
      const matchesStatus = statusFilter === "" || query.status === statusFilter;
      const matchesCategory = categoryFilter === "" || query.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [queries, searchInput, statusFilter, categoryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredQueries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQueries = filteredQueries.slice(startIndex, startIndex + itemsPerPage);

  // Get unique categories and statuses for filter options
  const categories = React.useMemo(() => {
    if (!queries) return [];
    return [...new Set(queries.map(q => q.category))].filter(Boolean);
  }, [queries]);

  const statuses = React.useMemo(() => {
    if (!queries) return [];
    return [...new Set(queries.map(q => q.status))].filter(Boolean);
  }, [queries]);

  useEffect(() => {
    if (token) {
      dispatch(getAllQueries(token) as any);
    }
  }, [dispatch, token]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput, statusFilter, categoryFilter]);

  const handleResetFilters = () => {
    setSearchInput("");
    setStatusFilter("");
    setCategoryFilter("");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      new: { bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-800 dark:text-blue-200", label: "New" },
      in_progress: { bg: "bg-yellow-100 dark:bg-yellow-900/20", text: "text-yellow-800 dark:text-yellow-200", label: "In Progress" },
      resolved: { bg: "bg-green-100 dark:bg-green-900/20", text: "text-green-800 dark:text-green-200", label: "Resolved" },
      closed: { bg: "bg-gray-100 dark:bg-gray-900/20", text: "text-gray-800 dark:text-gray-200", label: "Closed" },
    };
    const key = status.toLowerCase();
    const config = statusConfig[key] || statusConfig.new;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxPages = 5;
    const start = Math.max(1, currentPage - Math.floor(maxPages / 2));
    const end = Math.min(totalPages, start + maxPages - 1);

    if (start > 1) pages.push(1, "...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push("...", totalPages);

    return pages;
  };

  // Open modal for editing status
  const handleEditStatus = (query: Query) => {
    setSelectedQuery(query);
    setModalStatus(query.status);
    setModalOpen(true);
    setModalError(null);
  };

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!selectedQuery || !token) return;
    setModalLoading(true);
    setModalError(null);
    try {
      await dispatch(
        updateQuery({
          queryId: selectedQuery._id,
          queryData: { status: modalStatus },
          token,
        }) as any
      ).unwrap();
      setModalOpen(false);
    } catch (err: any) {
      setModalError(err?.message || "Failed to update status");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div>
      <PageMeta
        title="Query List | IAS"
        description="List of all customer queries in IAS"
      />
      <PageBreadcrumb pageTitle="Query List" />
      
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Customer Queries
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm dark:text-gray-400">
              Total: {filteredQueries.length}
            </span>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white shadow p-4 rounded-md mb-6 dark:bg-gray-900">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, email, or message..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                {allowedStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
{/* 
            Category Filter
            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div> */}

            {/* Items per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm dark:text-gray-300">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-x-auto dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Name
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </div>
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Category
                </th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Created At
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-900 dark:divide-gray-800">
              {paginatedQueries.length === 0 && !loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {filteredQueries.length === 0 && queries && queries.length > 0 
                      ? "No queries match your search criteria."
                      : "No queries found."
                    }
                  </td>
                </tr>
              ) : (
                paginatedQueries.map((query, idx) => (
                  <tr
                    key={query._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {startIndex + idx + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      <div>{query.name}</div>
                      {query.courseTitle && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1a5276] border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                            📚 {query.courseTitle}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {query.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {query.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs">
                      <div className="truncate" title={query.message}>
                        {query.message}
                      </div>
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                        {query.category}
                      </span>
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(query.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {query.createdAt ? new Date(query.createdAt).toLocaleString() : ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                          onClick={() => handleEditStatus(query)}
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex sm:flex-row items-center sm:items-center justify-between gap-4 mt-6">
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredQueries.length)}{" "}
              of {filteredQueries.length} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {generatePageNumbers().map((page, idx) =>
                typeof page === "number" ? (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                ) : (
                  <span
                    key={idx}
                    className="px-2 text-gray-400 dark:text-gray-500"
                  >
                    {page}
                  </span>
                )
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
{modalOpen && selectedQuery && (
  <div className="fixed inset-0 z-[1000001] flex items-center justify-center bg-white/30 backdrop-blur-sm">
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
      {/* Close Icon */}
      <button
        onClick={() => setModalOpen(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>

      <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
        Query Details & Status
      </h2>

      {/* Query & Student Information */}
      <div className="mb-4 p-3.5 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2 text-xs text-gray-600 dark:text-gray-300">
        <div>
          <span className="font-semibold text-gray-700 dark:text-gray-200">Student Name: </span>
          <span className="font-medium text-gray-900 dark:text-white">{selectedQuery.name}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-200">Email: </span>
            <a href={`mailto:${selectedQuery.email}`} className="text-blue-600 hover:underline">{selectedQuery.email}</a>
          </div>
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-200">Phone: </span>
            <a href={`tel:${selectedQuery.phone}`} className="text-blue-600 hover:underline">{selectedQuery.phone}</a>
          </div>
        </div>
        {selectedQuery.courseTitle && (
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-200">Course Inquired: </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{selectedQuery.courseTitle}</span>
          </div>
        )}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="font-semibold text-gray-700 dark:text-gray-200 block mb-1">Query / Message:</span>
          <div className="p-2.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap max-h-36 overflow-y-auto font-normal">
            {selectedQuery.message}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Update Status
        </label>
        <select
          value={modalStatus}
          onChange={(e) => setModalStatus(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
        >
          {allowedStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {modalError && (
        <div className="text-red-600 mb-2 text-sm">{modalError}</div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setModalOpen(false)}
          className="px-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
          disabled={modalLoading}
        >
          Cancel
        </button>
        <button
          onClick={handleUpdateStatus}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          disabled={modalLoading}
        >
          {modalLoading ? "Updating..." : "Update"}
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
};

export default QueryList;