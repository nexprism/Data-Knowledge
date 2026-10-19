import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

interface AssignmentState {
  loading: boolean;
  error: string | null;
  data: any;
  submissions: any[];
  submissionsTotal: number;
}

const initialState: AssignmentState = {
  loading: false,
  error: null,
  data: null,
  submissions: [],
  submissionsTotal: 0,
};

export const createAssignment = createAsyncThunk(
  "assignment/createAssignment",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/assignment", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      window.location.reload();

      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAssignments = createAsyncThunk(
  "assignment/fetchAssignments",
  async (params?: { page?: number; limit?: number; search?: string }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);

      const response = await axiosInstance.get(`/assignment?${queryParams.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (err: any) {
     
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateAssignment = createAsyncThunk(
  "assignment/updateAssignment",
  async (
    { id, formData }: { id: string; formData: FormData },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put(`/assignment/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      window.location.reload();

      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteAssignment = createAsyncThunk(
  "assignment/deleteAssignment",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/assignment/${id}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAssignmentById = createAsyncThunk(
  "assignment/fetchAssignmentById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/assignment/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAssignmentSubmissions = createAsyncThunk(
  "assignment/fetchAssignmentSubmissions",
  async (params?: { page?: number; limit?: number; search?: string; status?: string }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);

      const response = await axiosInstance.get(`/assignment-submissions?${queryParams.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteAssignmentSubmission = createAsyncThunk(
  "assignment/deleteAssignmentSubmission",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/assignment-submissions/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (err: any) {
      console.log("Error deleting assignment submission:", err?.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const assignmentSlice = createSlice({
  name: "assignment",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearData: (state) => {
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(createAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(updateAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAssignment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAssignmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAssignmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAssignmentSubmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignmentSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        const payloadData = action.payload?.data;
        if (payloadData && Array.isArray(payloadData.submissions)) {
          state.submissions = payloadData.submissions;
          state.submissionsTotal = payloadData.pagination?.total ?? payloadData.submissions.length;
        } else if (Array.isArray(payloadData)) {
          state.submissions = payloadData;
          state.submissionsTotal = payloadData.length;
        } else if (Array.isArray(action.payload)) {
          state.submissions = action.payload;
          state.submissionsTotal = action.payload.length;
        }
      })
      .addCase(fetchAssignmentSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      }
      )
      .addCase(deleteAssignmentSubmission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAssignmentSubmission.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(deleteAssignmentSubmission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});
export const { clearError, clearData } = assignmentSlice.actions;
export default assignmentSlice.reducer;