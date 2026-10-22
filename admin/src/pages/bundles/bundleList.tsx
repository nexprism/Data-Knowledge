import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { fetchCourseBundles } from "../../store/slices/courseBundle";
import {
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Eye,
  Users,
  BookOpen,
  DollarSign,
  Pencil,
  Trash,
  Trash2,
} from "lucide-react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface Bundle {
  _id: string;
  title: string;
  description: string;
  slug: string;
  price: number;
  discountPrice?: number;
  status: "active" | "inactive" | "draft";
  isDeleted: boolean;
  thumbnail?: string;
  courses: string[];
  totalStudents?: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const VITE_IMAGE_URL = import.meta.env.VITE_IMAGE_URL || import.meta.env.VITE_BASE_URL;

const BundleList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, data } = useAppSelector(
    (state) => state.courseBundle
  );

  // State for search, filter, pagination
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchCourseBundles({ page, limit }));
    }, 500);
    return () => clearTimeout(timer);
  }, [dispatch, page, limit, searchInput, statusFilter]);

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchCourseBundles({ page, limit }));
  }, [dispatch, page, limit]);

  // Extract bundles from the correct data structure
  const bundles: Bundle[] = Array.isArray(data?.bundles) ? data.bundles : [];
  console.log("Fetched bundles:", bundles);

  const pagination = {
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 10,
    totalPages: data?.totalPages || 1,
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setStatusFilter("");
    setPage(1);
    setLimit(10);
  };

  const filteredBundles = bundles?.filter((bundle: Bundle) => {
    const matchesSearch =
      !searchInput ||
      bundle.title.toLowerCase().includes(searchInput.toLowerCase()) ||
      bundle.description.toLowerCase().includes(searchInput.toLowerCase());
    const matchesStatus = !statusFilter || bundle.status === statusFilter;
    return matchesSearch && matchesStatus && !bundle.isDeleted;
  });

  const generatePageNumbers = () => {
    const pages = [];
    const totalPages = pagination.totalPages;
    const current = pagination.page;
    const maxPages = 5;
    const start = Math.max(1, current - Math.floor(maxPages / 2));
    const end = Math.min(totalPages, start + maxPages - 1);
    if (start > 1) pages.push(1, "...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push("...", totalPages);
    return pages;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-500";
      case "inactive":
        return "text-red-500";
      case "draft":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div>
      <PageMeta
        title="Bundle List | IAS"
        description="List of all course bundles in IAS"
      />
      <PageBreadcrumb pageTitle="Bundle List" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Course Bundles
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm dark:text-gray-400">
              Total: {pagination.total}
            </span>
            <button
              onClick={() => navigate("/bundles/create")}
              className="px-5 py-2.5 bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white rounded-xl shadow-md shadow-[#1b6294]/20 hover:shadow-lg transition-all duration-200 active:scale-95 font-medium cursor-pointer"
            >
              Add Bundle
            </button>
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
                placeholder="Search by title or description..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm dark:text-gray-300">Show:</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
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

        {/* No Data Message - ADDED */}
        {!loading && !error && filteredBundles.length === 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {searchInput || statusFilter
                ? "No bundles match your search criteria"
                : "No bundles available"}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && filteredBundles.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-x-auto dark:bg-gray-900">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-900 dark:divide-gray-800">
                {filteredBundles.map((bundle: Bundle, idx: number) => (
                  <tr
                    key={bundle._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                     <img
                       src={VITE_IMAGE_URL + "/" + bundle.thumbnail}
                       alt={bundle.title}
                       className="w-14 h-10 rounded-sm object-cover"
                       onError={(e) => {
                         e.currentTarget.onerror = null; // prevent infinite loop
                         e.currentTarget.src =
                           "https://tse2.mm.bing.net/th/id/OIP.z2HmY-oQPSmmDwR-MYmW6QAAAA?pid=Api&P=0&h=180";
                       }}
                     />

                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {bundle.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {bundle.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {bundle.courses?.length || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {formatPrice(bundle.price)}
                        </span>
                        {bundle.discountPrice && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            Save{" "}
                            {formatPrice(bundle.price - bundle.discountPrice)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(bundle.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="View Details"
                        onClick={() =>
                          (window.location.href = `/bundles/${bundle._id}`)
                        }
                      >
                        <Pencil className="h-5 w-5" />
                      </button>

                      <button
                        // onClick={() => openDeleteModal(cat)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {generatePageNumbers().map((pageNum, idx) =>
                typeof pageNum === "number" ? (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded ${
                      pagination.page === pageNum
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                ) : (
                  <span
                    key={idx}
                    className="px-2 text-gray-400 dark:text-gray-500"
                  >
                    {pageNum}
                  </span>
                )
              )}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BundleList;
