import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

export interface DeleteRequestUser {
  _id: string;
  fullName: string;
  email: string;
  role?: string;
  profilePicture?: string;
}

export interface DeleteRequest {
  _id: string;
  user: DeleteRequestUser;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  processedBy?: {
    _id: string;
    fullName: string;
  };
  additionalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DeleteRequestsState {
  requests: DeleteRequest[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  searchQuery: string;
  filters: Record<string, any>;
}

interface FetchDeleteRequestsParams {
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
  searchFields?: Record<string, any>;
  sort?: Record<string, any>;
}

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "https://api.dataknowledge.in").replace(/\/+$/, '');

// Fetch delete requests with pagination and filters
export const fetchDeleteRequests = createAsyncThunk(
  "deleteRequests/fetchAll",
  async (params: FetchDeleteRequestsParams = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        return rejectWithValue("Authentication token not found");
      }
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      // Add pagination
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      // Add filters
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      // Add search fields
      if (params.searchFields?.search && params.searchFields.search.trim()) {
        queryParams.append('search', params.searchFields.search.trim());
      }
      
      // Add sort
      if (params.sort) {
        Object.entries(params.sort).forEach(([key, value]) => {
          if (value) {
            queryParams.append(`sort[${key}]`, value as string);
          }
        });
      }
      
      const url = `${API_BASE_URL}/delete-account/all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('Fetching delete requests from:', url); // Debug log
      
      const response = await axiosInstance.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      // Handle different response structures
      const data = response.data?.data || response.data;
      // Pagination fields may be at the root of the response
      const page = response.data?.page ?? params.page ?? 1;
      const limit = response.data?.limit ?? params.limit ?? 10;
      const total = response.data?.total ?? 0;
      const totalPages = response.data?.totalPages ?? Math.ceil(total / limit);

      return {
        requests: Array.isArray(data) ? data : [],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      console.error('Error fetching delete requests:', error); // Debug log
      
      if (error.response?.status === 401) {
        return rejectWithValue("Authentication failed. Please login again.");
      }
      if (error.response?.status === 403) {
        return rejectWithValue("Access denied. You don't have permission to view this data.");
      }
      if (error.response?.status === 404) {
        return rejectWithValue("Delete requests endpoint not found.");
      }
      
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        "Failed to fetch delete requests"
      );
    }
  }
);

// Fetch single delete request
export const fetchDeleteRequest = createAsyncThunk(
  "deleteRequests/fetchSingle",
  async (id: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        return rejectWithValue("Authentication token not found");
      }
      
      const response = await axiosInstance.get(
        `${API_BASE_URL}/delete-account/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        "Failed to fetch delete request"
      );
    }
  }
);

// Update delete request status
export const updateDeleteRequestStatus = createAsyncThunk(
  "deleteRequests/updateStatus",
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("Authentication token not found");
      }
      const response = await axiosInstance.put(
        `${API_BASE_URL}/delete-account/${id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        "Failed to update delete request status"
      );
    }
  }
);

const initialState: DeleteRequestsState = {
  requests: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  searchQuery: "",
  filters: {},
};

const deleteRequestsSlice = createSlice({
  name: "deleteRequests",
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      // Reset to first page when searching
      state.pagination.page = 1;
    },
    setFilters: (state, action: PayloadAction<Record<string, any>>) => {
      state.filters = action.payload;
      // Reset to first page when filtering
      state.pagination.page = 1;
    },
    resetFilters: (state) => {
      state.filters = {};
      state.searchQuery = "";
      state.pagination.page = 1;
    },
    clearError: (state) => {
      state.error = null;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1; // Reset to first page when changing limit
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all delete requests
      .addCase(fetchDeleteRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeleteRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.requests;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchDeleteRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Don't clear requests on error, keep previous data
      })
      
      // Fetch single delete request
      .addCase(fetchDeleteRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeleteRequest.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchDeleteRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update delete request status
      .addCase(updateDeleteRequestStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDeleteRequestStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        // Update the request in the list if it exists
        const updatedRequest = action.payload;
        const index = state.requests.findIndex(req => req._id === updatedRequest._id);
        if (index !== -1) {
          state.requests[index] = updatedRequest;
        }
      })
      .addCase(updateDeleteRequestStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setSearchQuery, 
  setFilters, 
  resetFilters, 
  clearError, 
  setPage, 
  setLimit 
} = deleteRequestsSlice.actions;

export default deleteRequestsSlice.reducer;