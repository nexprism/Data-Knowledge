import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

export interface ContactPageData {
  _id?: string;
  badgeText: string;
  title: string;
  description: string;
  primaryEmail: string;
  emailSupportDescription: string;
  primaryPhone: string;
  alternatePhone: string;
  whatsappNumber: string;
  whatsappText: string;
  portalTitle: string;
  portalUrl: string;
  portalDescription: string;
  address: string;
  notificationEmail: string;
  subjectOptions: string[];
  isActive: boolean;
  updatedAt?: string;
}

export interface ContactRequestData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "pending" | "in_progress" | "resolved";
  source: string;
  adminNotes: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ContactSummary {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
}

interface ContactState {
  contactPage: ContactPageData | null;
  requests: ContactRequestData[];
  selectedRequest: ContactRequestData | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: ContactSummary;
  loading: boolean;
  saving: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: ContactState = {
  contactPage: null,
  requests: [],
  selectedRequest: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  },
  summary: {
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
  },
  loading: false,
  saving: false,
  error: null,
  successMessage: null,
};

// Admin: Fetch Contact Page Config
export const fetchContactPageAdmin = createAsyncThunk(
  "contact/fetchPageAdmin",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/contact/admin/page");
      return response.data.data.contactPage;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch contact page configuration"
      );
    }
  }
);

// Admin: Update Contact Page Config
export const updateContactPageAdmin = createAsyncThunk(
  "contact/updatePageAdmin",
  async (data: Partial<ContactPageData>, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put("/contact/admin/page", data);
      return response.data.data.contactPage;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update contact page configuration"
      );
    }
  }
);

// Admin: Fetch Contact Requests with Filters
export const fetchContactRequests = createAsyncThunk(
  "contact/fetchRequests",
  async (
    params: { page?: number; limit?: number; search?: string; status?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set("page", params.page.toString());
      if (params.limit) queryParams.set("limit", params.limit.toString());
      if (params.search) queryParams.set("search", params.search);
      if (params.status && params.status !== "all") queryParams.set("status", params.status);

      const response = await axiosInstance.get(`/contact/admin/requests?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch contact requests"
      );
    }
  }
);

// Admin: Update Contact Request Status
export const updateContactRequest = createAsyncThunk(
  "contact/updateRequest",
  async (
    { id, status, adminNotes }: { id: string; status?: string; adminNotes?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.patch(`/contact/admin/requests/${id}`, {
        status,
        adminNotes,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update contact request"
      );
    }
  }
);

// Admin: Delete Contact Request
export const deleteContactRequest = createAsyncThunk(
  "contact/deleteRequest",
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/contact/admin/requests/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete contact request"
      );
    }
  }
);

const contactSlice = createSlice({
  name: "contact",
  initialState,
  reducers: {
    clearContactMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    setSelectedRequest: (state, action) => {
      state.selectedRequest = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Page
      .addCase(fetchContactPageAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContactPageAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.contactPage = action.payload;
      })
      .addCase(fetchContactPageAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Page
      .addCase(updateContactPageAdmin.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateContactPageAdmin.fulfilled, (state, action) => {
        state.saving = false;
        state.contactPage = action.payload;
        state.successMessage = "Contact page content updated successfully!";
      })
      .addCase(updateContactPageAdmin.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      // Fetch Requests
      .addCase(fetchContactRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContactRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.data;
        state.pagination = action.payload.pagination;
        if (action.payload.summary) {
          state.summary = action.payload.summary;
        }
      })
      .addCase(fetchContactRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Request
      .addCase(updateContactRequest.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateContactRequest.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.requests.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
        if (state.selectedRequest?._id === action.payload._id) {
          state.selectedRequest = action.payload;
        }
        state.successMessage = "Contact request updated successfully!";
      })
      .addCase(updateContactRequest.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      // Delete Request
      .addCase(deleteContactRequest.fulfilled, (state, action) => {
        state.requests = state.requests.filter((r) => r._id !== action.payload);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
        if (state.selectedRequest?._id === action.payload) {
          state.selectedRequest = null;
        }
        state.successMessage = "Contact request deleted.";
      });
  },
});

export const { clearContactMessages, setSelectedRequest } = contactSlice.actions;
export default contactSlice.reducer;
