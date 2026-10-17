import React, { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Zap,
  CheckCircle,
  Clock,
  Copy
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { fetchNews, deleteNews } from "../../store/slices/news";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PopupAlert from "../../components/popUpAlert";

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_URL || import.meta.env.VITE_BASE_URL || "";

const getImageUrl = (url?: string | null) => {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  return `${IMAGE_BASE_URL}/${url}`;
};

export default function NewsList() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { news, loading, error, pagination } = useAppSelector((state) => state.news);

  const [page, setPage] = useState<number>(1);
  const limit = pagination?.limit || 10;
  const pages = pagination?.totalPages || 1;
  const total = pagination?.total ?? news.length;

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState<any | null>(null);
  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });

  // Fetch news for current page
  useEffect(() => {
    const fetchData = async () => {
      const params: any = {
        page,
        limit,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter }),
      };
      await dispatch(fetchNews(params));
    };

    const timer = setTimeout(fetchData, 400);
    return () => clearTimeout(timer);
  }, [dispatch, page, limit, statusFilter, categoryFilter, searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  const handleView = (item: any) => {
    navigate(`/news/view/${item._id}`);
  };

  const handleEdit = (item: any) => {
    navigate(`/news/edit/${item._id}`);
  };

  const handleDelete = (item: any) => {
    setNewsToDelete(item);
    setDeleteOpen(true);
  };

  const handleCopyLink = (item: any) => {
    const shareUrl = item.url || `${window.location.origin}/news/view/${item._id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setPopup({
        isVisible: true,
        message: "Link copied to clipboard!",
        type: "success",
      });
    }).catch(() => {
      setPopup({
        isVisible: true,
        message: "Failed to copy link.",
        type: "error",
      });
    });
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!newsToDelete) return;
    try {
      await dispatch(deleteNews(newsToDelete._id)).unwrap();
      setDeleteOpen(false);
      setNewsToDelete(null);
      setPopup({
        isVisible: true,
        message: "News deleted successfully",
        type: "success",
      });
      // Re-fetch news
      const params: any = {
        page,
        limit,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter }),
      };
      await dispatch(fetchNews(params));
    } catch (err: any) {
      setPopup({
        isVisible: true,
        message: err || "Failed to delete news",
        type: "error",
      });
    }
  };

  // Filter news based on search term
  const filteredNews = news.filter((item) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    const title = (item.title || "").toString().toLowerCase();
    const summary = (item.summary || "").toString().toLowerCase();
    const author = (item.author?.name || "").toString().toLowerCase();
    const categories = Array.isArray(item.categories) 
      ? item.categories.join(" ").toLowerCase()
      : (item.categories || "").toString().toLowerCase();
    return (
      title.includes(q) ||
      summary.includes(q) ||
      author.includes(q) ||
      categories.includes(q)
    );
  });

  return (
    <>
      <PageMeta title="All Blogs | LMS Admin" description="Browse and manage all blogs" />
      <PageBreadcrumb pageTitle="All Blogs" />
      <div className="bg-gray-50 min-h-screen dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">All Blogs</h1>
              <p className="text-gray-600 dark:text-gray-400">Browse and manage all blog articles</p>
            </div>

            {/* Add Blog button */}
            <div className="mt-4 sm:mt-0 flex gap-2">
              <button
                onClick={() => navigate("/blogs/add")}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white font-medium rounded-xl shadow-md shadow-[#1b6294]/20 hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                title="Add Blog"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Blog
              </button>
            </div>
          </div>

          {/* show loading / error */}
          {loading && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Loading news...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* Search & Filters */}
          <div className="mb-6">
            <div className="mb-3 flex justify-end">
              <span className="text-lg text-gray-600 dark:text-gray-400">
                Total: <span className="font-semibold text-gray-900 dark:text-white">{total}</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search news..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="deleted">Deleted</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              {/* Category filter dropdown */}
              <div>
                <input
                  type="text"
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                  placeholder="Category..."
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">No.</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Image</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Published</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {filteredNews.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                            {searchTerm ? "No blogs found matching your search." : "No blogs yet."}
                          </p>
                          {!searchTerm && (
                            <button
                              onClick={() => navigate("/blogs/add")}
                              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Create Your First Blog
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredNews.map((item, idx) => (
                      <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-medium">
                          {(page - 1) * limit + idx + 1}
                        </td>
                        <td className="px-6 py-4">
                          {item.imageUrl ? (
                            <img
                              src={getImageUrl(item.imageUrl)}
                              alt={item.title}
                              className="w-16 h-12 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "https://placehold.co/150x150";
                              }}
                            />
                          ) : (
                            <div className="w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                              <span className="text-xs text-gray-400">No Image</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">
                            {item.title || "Untitled"}
                          </div>
                          {item.tags && item.tags.length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {item.tags.slice(0, 3).join(", ")}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {Array.isArray(item.categories) && item.categories.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {item.categories.slice(0, 2).map((cat: string, i: number) => (
                                  <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs">
                                    {cat}
                                  </span>
                                ))}
                                {item.categories.length > 2 && (
                                  <span className="text-xs text-gray-500">+{item.categories.length - 2}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {item.author?.name || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-2">
                            {item.status === "active" ? (
                              <span
                                title="Active"
                                aria-label="Active"
                                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </span>
                            ) : item.status === "blocked" ? (
                              <span
                                title="Blocked"
                                aria-label="Blocked"
                                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600"
                              >
                                <Clock className="w-4 h-4" />
                              </span>
                            ) : (
                              <span
                                title="Deleted"
                                aria-label="Deleted"
                                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleView(item)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopyLink(item)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                              title="Copy Share Link"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing <span className="font-semibold text-gray-900 dark:text-white">{Math.min((page - 1) * limit + 1, total)}</span> to{" "}
                <span className="font-semibold text-gray-900 dark:text-white">{Math.min(page * limit, total)}</span> of{" "}
                <span className="font-semibold text-gray-900 dark:text-white">{total}</span> results
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                    let pageNum;
                    if (pages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pages - 2) {
                      pageNum = pages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${page === pageNum
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  disabled={page >= pages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Modal */}
        {deleteOpen && newsToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100010] animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-slideUp">
              <button
                onClick={() => { setDeleteOpen(false); setNewsToDelete(null); }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete News</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-gray-700 dark:text-gray-300">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    "{newsToDelete.title || newsToDelete._id}"
                  </span>
                  ?
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setDeleteOpen(false); setNewsToDelete(null); }}
                  className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
                >
                  Delete News
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
          
          .animate-slideUp {
            animation: slideUp 0.3s ease-out;
          }
        `}</style>
      </div>

      <PopupAlert
        isVisible={popup.isVisible}
        message={popup.message}
        type={popup.type}
        onClose={() => setPopup({ isVisible: false, message: "", type: "" })}
      />
    </>
  );
}
