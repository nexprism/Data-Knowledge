import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store";
import {
  fetchResources,
  deleteResource,
  selectResources,
  selectResourceLoading,
  selectResourceError,
  selectResourceTotal,
  selectResourceTotalPages,
  RESOURCE_TYPES,
} from "../../store/slices/resource";
import type { Resource } from "../../store/slices/resource";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PopupAlert from "../../components/popUpAlert";
import { Pencil, Trash2 } from "lucide-react";

const IMAGE_BASE_URL = (import.meta.env.VITE_BASE_URL || "https://api.dataknowledge.in/").replace(/\/+$/, '') + '/';

const resolveUrl = (url?: string): string => {
  if (!url) return "";
  return url.startsWith("http") ? url : `${IMAGE_BASE_URL}${url.replace(/^\/+/, "")}`;
};

const formatFileSize = (bytes: number): string => {
  if (!bytes) return "-";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
};

const ResourceList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const resources = useSelector(selectResources);
  const loading = useSelector(selectResourceLoading);
  const error = useSelector(selectResourceError);
  const totalResources = useSelector(selectResourceTotal);
  const totalPages = useSelector(selectResourceTotalPages);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [popup, setPopup] = useState<{
    isVisible: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    isVisible: false,
    message: "",
    type: "info",
  });
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const pagination = {
    total: totalResources || 0,
    page,
    limit: limit || 10,
    totalPages: totalPages || 1,
  };

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const current = pagination.page;
    const maxPages = 5;
    const start = Math.max(1, current - Math.floor(maxPages / 2));
    const end = Math.min(pagination.totalPages, start + maxPages - 1);
    if (start > 1) pages.push(1, "...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < pagination.totalPages) pages.push("...", pagination.totalPages);
    return pages;
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

  useEffect(() => {
    dispatch(
      fetchResources({
        page,
        limit,
        search: searchTerm || undefined,
        resourceType: typeFilter || undefined,
        category: categoryFilter || undefined,
      })
    );
  }, [dispatch, page, limit, searchTerm, typeFilter, categoryFilter]);

  const handleDelete = async () => {
    setIsDeleteModalOpen(false);
    if (!selectedResource) return;
    try {
      await dispatch(deleteResource(selectedResource._id)).unwrap();
      setPopup({
        isVisible: true,
        message: "Resource deleted successfully!",
        type: "success",
      });
    } catch (err) {
      console.error("Failed to delete resource:", err);
      setPopup({
        isVisible: true,
        message: "Failed to delete resource. Please try again.",
        type: "error",
      });
    }
    setSelectedResource(null);
  };

  return (
    <>
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[999] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center">
            <div className="fixed inset-0 bg-black/10 bg-opacity-30 backdrop-blur-xs transition-opacity"></div>
            <div className="relative z-50 mx-auto w-full max-w-sm rounded-lg bg-white dark:bg-gray-800/10 p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-900">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-medium text-center text-gray-900 dark:text-white">
                Delete Resource
              </h3>
              <p className="mt-2 text-sm text-center text-gray-500 dark:text-gray-400">
                Are you sure you want to delete this resource? This action cannot
                be undone.
              </p>
              <div className="mt-4 flex justify-center space-x-3">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PopupAlert
        isVisible={popup.isVisible}
        message={popup.message}
        type={popup.type}
        onClose={() => {
          setPopup({ isVisible: false, message: "", type: "info" });
        }}
      />

      <PageMeta
        title="Resources Management | LMS Admin Panel"
        description="Manage SOPs, formats, checklists, ebooks and literature"
      />
      <PageBreadcrumb pageTitle="Resources" />

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 p-4 mb-4 rounded">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Resources Management
          </h2>
          <Link
            to="/resources/add"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add New Resource
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search resources..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Resource Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {RESOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Category
              </label>
              <input
                type="text"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter by category"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("");
                  setCategoryFilter("");
                  setPage(1);
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Resources Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-x-auto dark:bg-gray-900">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    #
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Thumbnail
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Title
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Type
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Category
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Visibility
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    File
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Downloads
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-900 dark:divide-gray-800">
                {resources.map((resource, idx) => (
                  <tr
                    key={resource._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                      {resource.thumbnail?.url ? (
                        <img
                          src={resolveUrl(resource.thumbnail.url)}
                          alt={resource.title}
                          className="w-14 h-10 rounded-sm object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/images/icons/file-image.svg";
                          }}
                        />
                      ) : (
                        <img
                          src="/images/icons/file-image.svg"
                          alt="No thumbnail"
                          className="w-14 h-10 rounded-sm object-cover opacity-50"
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                      {resource.title.length > 25
                        ? resource.title.slice(0, 25) + "..."
                        : resource.title}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {resource.resourceType}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                      {resource.category || "-"}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          resource.visibility === "PREMIUM"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : resource.visibility === "PRIVATE"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {resource.visibility || "PUBLIC"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                      {resource.resourceFile?.originalName ? (
                        <a
                          href={resolveUrl(resource.resourceFile.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                          title={resource.resourceFile.originalName}
                        >
                          {resource.resourceFile.originalName.length > 18
                            ? resource.resourceFile.originalName.slice(0, 18) + "..."
                            : resource.resourceFile.originalName}
                        </a>
                      ) : resource.content ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Content
                        </span>
                      ) : (
                        "-"
                      )}
                      {resource.resourceFile && (
                        <span className="block text-xs text-gray-400">
                          {formatFileSize(resource.resourceFile.size)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                      {resource.downloadCount || 0}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          resource.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {resource.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm flex gap-2">
                      <Link
                        to={`/resources/edit/${resource._id}`}
                        className="p-2 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900"
                      >
                        <Pencil className="w-4 h-4 text-indigo-600" />
                      </Link>
                      <button
                        className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900"
                        onClick={() => {
                          setSelectedResource(resource);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
                {resources.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="text-center py-8 text-gray-400 dark:text-gray-500"
                    >
                      No resources found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalResources > limit && (
          <>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span className="font-bold">&#60;</span>
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
                  <span key={idx} className="px-2 text-gray-400 dark:text-gray-500">
                    {pageNum}
                  </span>
                )
              )}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span className="font-bold">&#62;</span>
              </button>
            </div>

            <div className="flex items-center gap-2 mt-2 justify-end">
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
          </>
        )}
      </div>
    </>
  );
};

export default ResourceList;
