import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

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
  usedBy: string[];
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

interface FetchCouponsParams {
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
  searchFields?: Record<string, string>;
  sort?: Record<string, string>;
}

interface ApiResponse {
  success: boolean;
  data: {
    coupons: Coupon[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message: string;
}

interface CouponState {
  loading: boolean;
  error: string | null;
  data: ApiResponse | null;
  singleCoupon: Coupon | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  searchQuery: string;
  filters: Record<string, any>;
}

const initialState: CouponState = {
  loading: false,
  error: null,
  data: null,
  singleCoupon: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  searchQuery: "",
  filters: {},
};

// CREATE COUPON
export const createCoupon = createAsyncThunk(
  "coupons/createCoupon",
  async (couponData: any, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/coupons/", couponData);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// FETCH ALL COUPONS
// FETCH ALL COUPONS
export const fetchCoupons = createAsyncThunk(
  "coupons/fetchCoupons",
  async (params: FetchCouponsParams = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());

      // ✅ Pass filters as JSON string
      if (params.filters && Object.keys(params.filters).length > 0) {
        queryParams.append("filters", JSON.stringify(params.filters));
      }

      // ✅ Pass searchFields as JSON string
      if (params.searchFields && Object.keys(params.searchFields).length > 0) {
        queryParams.append("searchFields", JSON.stringify(params.searchFields));
      }

      // ✅ Pass sort as JSON string
      if (params.sort && Object.keys(params.sort).length > 0) {
        queryParams.append("sort", JSON.stringify(params.sort));
      }

      const url = `/coupons/?${queryParams.toString()}`;
      const res = await axiosInstance.get(url);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);


// FETCH COUPON BY ID
export const fetchCouponById = createAsyncThunk(
  "coupons/fetchCouponById",
  async (id: string, { rejectWithValue }) => {
    try {
      console.log("API Call: GET /coupons/" + id);
      // Add cache-busting headers to prevent 304 Not Modified responses
      const res = await axiosInstance.get(`/coupons/${id}`);
      console.log("API Response:", res.data);
      return res.data;
    } catch (err: any) {
      console.error("API Error:", err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// UPDATE COUPON
export const updateCoupon = createAsyncThunk(
  "coupons/updateCoupon",
  async ({ id, couponData }: { id: string; couponData: any }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/coupons/${id}`, couponData);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// DELETE COUPON
export const deleteCoupon = createAsyncThunk(
  "coupons/deleteCoupon",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/coupons/${id}`);
      return { ...res.data, deletedId: id };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const couponsSlice = createSlice({
  name: "coupons",
  initialState,
  reducers: {
    clearError: (state) => { 
      state.error = null; 
    },
    clearData: (state) => { 
      state.singleCoupon = null; 
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    resetFilters: (state) => {
      state.searchQuery = "";
      state.filters = {};
      state.pagination.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // CREATE
      .addCase(createCoupon.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(createCoupon.fulfilled, (state, action) => { 
        state.loading = false; 
        // Extract coupon from response data structure: { success: true, data: { coupon }, ... }
        const coupon = action.payload?.data?.coupon || action.payload?.coupon || action.payload;
        if (state.data?.data?.coupons && coupon && coupon._id) {
          if (!Array.isArray(coupon.usedBy)) {
            coupon.usedBy = [];
          }
          state.data.data.coupons.unshift(coupon);
        }
      })
      .addCase(createCoupon.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload as string; 
      })

      // FETCH ALL
      .addCase(fetchCoupons.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => { 
        state.loading = false; 
        state.data = action.payload;

        // Normalize pagination: support both { data: { pagination: {...} } }
        // and { data: { coupons: [...], total, page, limit, totalPages } }
        const respData = action.payload?.data || {};

        if (respData.pagination && typeof respData.pagination === 'object') {
          state.pagination = respData.pagination;
        } else {
          const page = Number(respData.page) || state.pagination.page;
          const limit = Number(respData.limit) || state.pagination.limit;
          const total = Number(respData.total) || (Array.isArray(respData.coupons) ? respData.coupons.length : state.pagination.total);
          const totalPages = Number(respData.totalPages) || Math.ceil(total / limit) || state.pagination.totalPages;
          state.pagination = { page, limit, total, totalPages };
        }
      })
      .addCase(fetchCoupons.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload as string; 
      })

      // FETCH BY ID
      .addCase(fetchCouponById.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(fetchCouponById.fulfilled, (state, action) => { 
        state.loading = false; 
        console.log("Reducer - Full payload:", action.payload);
        // Extract coupon from response data structure: { success: true, data: { coupon }, ... }
        const coupon = action.payload?.data?.coupon || action.payload?.coupon || action.payload;
        console.log("Reducer - Extracted coupon:", coupon);
        state.singleCoupon = coupon; 
      })
      .addCase(fetchCouponById.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload as string; 
        console.error("Reducer - Fetch error:", action.payload);
      })

      // UPDATE
      .addCase(updateCoupon.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        const coupon = action.payload?.data?.coupon || action.payload?.coupon || action.payload;
        if (state.data?.data?.coupons && coupon && coupon._id) {
          if (!Array.isArray(coupon.usedBy)) {
            coupon.usedBy = [];
          }
          state.data.data.coupons = state.data.data.coupons.map(c => 
            c._id === coupon._id ? coupon : c
          );
        }
      })
      .addCase(updateCoupon.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload as string; 
      })

      // DELETE
      .addCase(deleteCoupon.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.loading = false;
        // Use deletedId from payload or fallback to meta.arg
        const deletedId = String(action.payload?.deletedId || action.meta.arg);
        console.log("Delete fulfilled - Removing coupon ID:", deletedId);
        console.log("Current coupons:", state.data?.data?.coupons?.map(c => c._id));
        
        if (state.data?.data?.coupons) {
          const beforeCount = state.data.data.coupons.length;
          // Create a new filtered array to ensure React detects the change
          const filteredCoupons = state.data.data.coupons.filter(c => {
            // Ensure both IDs are strings for comparison
            const couponId = String(c._id);
            const shouldKeep = couponId !== deletedId;
            if (!shouldKeep) {
              console.log("Removing coupon:", c.code, couponId, "matches", deletedId);
            }
            return shouldKeep;
          });
          const afterCount = filteredCoupons.length;
          console.log(`Coupons before: ${beforeCount}, after: ${afterCount}`);
          
          // Update state with new array reference
          if (state.data && state.data.data) {
            state.data.data.coupons = filteredCoupons;
            
            // Update pagination total
            if (beforeCount > afterCount) {
              state.pagination.total = Math.max(0, state.pagination.total - 1);
              // Recalculate totalPages
              state.pagination.totalPages = Math.ceil(state.pagination.total / state.pagination.limit);
              // Also update pagination in data if it exists
              if (state.data.data.pagination) {
                state.data.data.pagination.total = state.pagination.total;
                state.data.data.pagination.totalPages = state.pagination.totalPages;
              }
            } else {
              console.warn("No coupon was removed! ID mismatch or coupon not found.");
            }
          }
        } else {
          console.warn("No coupons array found in state.data.data");
        }
      })
      .addCase(deleteCoupon.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload as string; 
        console.error("Delete rejected:", action.payload);
      });
  }
});

export const { clearError, clearData, setSearchQuery, setFilters, resetFilters } = couponsSlice.actions;
export default couponsSlice.reducer;