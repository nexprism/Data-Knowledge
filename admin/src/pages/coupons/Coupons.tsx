import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useAppDispatch } from "../../hooks/redux";
import { 
  fetchCoupons, 
  deleteCoupon, 
  setSearchQuery, 
  setFilters, 
  resetFilters 
} from "../../store/slices/couponsSlice";
import type { RootState } from "../../store";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  AlertTriangle,
  Trash2,
  CheckCircle,
  XCircle,
  Pencil,
  Eye,
  Users,
  Calendar,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PopupAlert from "../../components/popUpAlert";
import { Navigate, useNavigate } from "react-router";

interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: "flat" | "percentage";
  discountAmount?: number;
  discountPercent?: number;
  minOrderAmount: number;
  usageLimit: number;
  usageLimitPerUser: number;
  isActive: boolean;
  usedBy: Array<{
    userId: {
      _id: string;
      fullName: string;
      email: string;
      phone?: string;
    } | null;
    usageCount?: number;
  }>;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

// Usage Details Modal Component
const UsageDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  coupon: Coupon | null;
}> = ({ isOpen, onClose, coupon }) => {
  if (!isOpen || !coupon) return null;

  const validUsages = Array.isArray(coupon.usedBy)
    ? coupon.usedBy.filter(usage => usage && usage.userId !== null)
    : [];
  const totalUsages = validUsages.reduce((sum, usage) => sum + (usage.usageCount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-transparent backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Coupon Usage Details
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Code: <span className="font-medium">{coupon.code}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {/* Usage Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    Total Users
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200 mt-1">
                  {validUsages.length}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-300">
                    Total Uses
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200 mt-1">
                  {totalUsages}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900 dark:text-purple-300">
                    Limit
                  </span>
                </div>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200 mt-1">
                  {coupon.usageLimit}
                </p>
              </div>
            </div>

            {/* Usage List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                User Usage Details
              </h4>
              
              {validUsages.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No users have used this coupon yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {validUsages.map((usage, index) => (
                    <div
                      key={usage.userId?._id || index}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#1b6294] to-[#16517a] rounded-full flex items-center justify-center text-white font-semibold">
                          {usage.userId?.fullName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {usage.userId?.fullName || 'Unknown User'}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {usage.userId?.email || 'No email'}
                          </p>
                          {usage.userId?.phone && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {usage.userId.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                          Used: {usage.usageCount || 0} time{(usage.usageCount || 0) !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  coupon: Coupon | null;
  isDeleting: boolean;
}> = ({ isOpen, onClose, onConfirm, coupon, isDeleting }) => {
  if (!isOpen || !coupon) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-transparent backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Coupon
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete the coupon{" "}
              <strong className="text-gray-900 dark:text-white">"{coupon.code}"</strong>?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Coupons: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data, loading, error, pagination, searchQuery, filters } = useSelector(
    (state: RootState) => state.coupons
  );
  
  // Use a more specific selector for coupons to ensure re-renders
  const couponsFromState = useSelector(
    (state: RootState) => state.coupons.data?.data?.coupons || []
  );

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [couponToViewUsage, setCouponToViewUsage] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [localFilters, setLocalFilters] = useState<Record<string, any>>(filters);
  const [popup, setPopup] = useState<{
    message: string;
    type: "success" | "error";
    isVisible: boolean;
  }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        dispatch(setSearchQuery(searchInput));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, dispatch]);

  // Fetch coupons
  useEffect(() => {
    const activeFilters: Record<string, any> = {};
    if (localFilters.isActive !== undefined) {
      activeFilters.isActive = localFilters.isActive;
    }
    if (localFilters.discountType) {
      activeFilters.discountType = localFilters.discountType;
    }

    dispatch(
      fetchCoupons({
        page: pagination.page,
        limit: pagination.limit,
        filters: activeFilters,
        searchFields: searchQuery ? { code: searchQuery, description: searchQuery } : {},
        sort: { createdAt: "desc" },
      })
    );
  }, [dispatch, pagination.page, pagination.limit, searchQuery, localFilters]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      dispatch(
        fetchCoupons({
          page: newPage,
          limit: pagination.limit,
          filters: localFilters,
          searchFields: searchQuery ? { code: searchQuery, description: searchQuery } : {},
          sort: { createdAt: "desc" },
        })
      );
    }
  };

  const handleLimitChange = (newLimit: number) => {
    dispatch(
      fetchCoupons({
        page: 1,
        limit: newLimit,
        filters: localFilters,
        searchFields: searchQuery ? { code: searchQuery, description: searchQuery } : {},
        sort: { createdAt: "desc" },
      })
    );
  };

  const handleFilterChange = (key: string, value: string | boolean) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    dispatch(setFilters(updated));
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setLocalFilters({});
    dispatch(resetFilters());
  };

  const openDeleteModal = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setCouponToDelete(null);
    setDeleteModalOpen(false);
    setIsDeleting(false);
  };

  const handleDeleteConfirm = async () => {
    if (couponToDelete) {
      setIsDeleting(true);
      const couponId = couponToDelete._id;
      const couponCode = couponToDelete.code;
      
      try {
        console.log("Deleting coupon:", couponId, couponCode);
        const result = await dispatch(deleteCoupon(couponId)).unwrap();
        console.log("Delete result:", result);
        
        setPopup({
          message: `Coupon "${couponCode}" deleted successfully`,
          type: "success",
          isVisible: true,
        });
        closeDeleteModal();
        
        // Don't refetch immediately - rely on Redux state update
        // The reducer already removes the coupon from state
        // Only refetch if we need to sync with server (e.g., after a delay)
        // This prevents overwriting the optimistic update
      } catch (error: any) {
        console.error("Delete error:", error);
        setPopup({
          message: error || "Failed to delete coupon. Please try again.",
          type: "error",
          isVisible: true,
        });
        setIsDeleting(false);
      }
    }
  };

  const openUsageModal = (coupon: Coupon) => {
    setCouponToViewUsage(coupon);
    setUsageModalOpen(true);
  };

  const closeUsageModal = () => {
    setCouponToViewUsage(null);
    setUsageModalOpen(false);
  };

  const generatePageNumbers = () => {
    const pages = [];
    const totalPages = pagination.totalPages;
    const current = pagination.page;
    const maxPages = 5;

    if (totalPages <= maxPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, current - Math.floor(maxPages / 2));
      const end = Math.min(totalPages, start + maxPages - 1);

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Use the specific selector to ensure re-renders on changes
  const coupons = couponsFromState;
  
  // Debug: Log when coupons array changes
  useEffect(() => {
    console.log("Coupons list updated. Count:", coupons.length);
    console.log("Coupon IDs:", coupons.map(c => c?._id));
  }, [coupons]);

  return (
    <div>
      <PageMeta title="Coupons List | IAS" description="List of all coupons" />
      <PageBreadcrumb pageTitle="Coupons List" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Coupons</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm dark:text-gray-400">
               Total: {data?.data?.total ?? 0}
            </span>
            <button
              onClick={() => navigate("/coupons/add")}
              className="bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white font-medium px-5 py-2.5 rounded-xl shadow-md shadow-[#1b6294]/20 hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
            >
              + Add Coupon
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
                placeholder="Search by code or description..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={localFilters.isActive === undefined ? "" : localFilters.isActive.toString()}
                onChange={(e) =>
                  handleFilterChange("isActive", e.target.value === "" ? undefined : e.target.value === "true")
                }
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={localFilters.discountType || ""}
                onChange={(e) => handleFilterChange("discountType", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="flat">Flat</option>
                <option value="percentage">Percent</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm dark:text-gray-300">Show:</span>
              <select
                value={pagination.limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
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
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Valid Until
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-900 dark:divide-gray-800">
              {coupons.length === 0 && !loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No coupons found.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon: Coupon, idx: number) => {
                  if (!coupon || !coupon._id) return null;
                  const validUsages = Array.isArray(coupon.usedBy)
                    ? coupon.usedBy.filter(usage => usage && usage.userId !== null)
                    : [];
                  const totalUsages = validUsages.reduce((sum, usage) => sum + (usage.usageCount || 0), 0);
                  
                  return (
                    <tr
                      key={coupon._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {(pagination.page - 1) * pagination.limit + idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {coupon.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {coupon.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {coupon.discountType === "flat"
                          ? `₹${coupon.discountAmount}`
                          : `${coupon.discountPercent}%`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {totalUsages}
                          </span>
                          <span className="text-gray-400">/</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {coupon.usageLimit}
                          </span>
                          {validUsages.length > 0 && (
                            <button
                              onClick={() => openUsageModal(coupon)}
                              className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
                              title="View usage details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {coupon.isActive ? (
                          <span className="inline-flex items-center">
                            <CheckCircle className="text-green-500 h-5 w-5" />
                            <span className="ml-2 text-green-700 dark:text-green-400">Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center">
                            <XCircle className="text-red-500 h-5 w-5" />
                            <span className="ml-2 text-red-700 dark:text-red-400">Inactive</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(coupon.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/coupons/edit/${coupon._id}`)}
                            className="text-indigo-500 hover:text-indigo-700 transition-colors p-1"
                            title="Edit coupon"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openUsageModal(coupon)}
                            className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                            title="View usage details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(coupon)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                            title="Delete coupon"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 mt-6">
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {generatePageNumbers().map((page, idx) =>
                typeof page === "number" ? (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      pagination.page === page
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
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Popup Alert */}
      <PopupAlert
        message={popup.message}
        type={popup.type}
        isVisible={popup.isVisible}
        onClose={() => setPopup({ ...popup, isVisible: false })}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        coupon={couponToDelete}
        isDeleting={isDeleting}
      />

      {/* Usage Details Modal */}
      <UsageDetailsModal
        isOpen={usageModalOpen}
        onClose={closeUsageModal}
        coupon={couponToViewUsage}
      />
    </div>
  );
};

export default Coupons;