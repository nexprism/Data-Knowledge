import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

// Update Query interface to match API response
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
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

interface QueryState {
  loading: boolean;
  error: string | null;
  queries: Query[]; // for list
  query: Query | null; // for single query
}

const initialState: QueryState = {
  loading: false,
  error: null,
  queries: [],
  query: null,
};

// Create a new query (public)
export const createQuery = createAsyncThunk(
  "query/createQuery",
  async (
    queryData: { name: string; email: string; phone: string; message: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/queries", queryData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get all queries (admin)
export const getAllQueries = createAsyncThunk(
  "query/getAllQueries",
  async (token: string | undefined, { rejectWithValue }) => {
    try {
      const authToken =
        token ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        "";
      const headers: Record<string, string> = {};
      if (authToken && authToken !== "cookie-session") {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const response = await axiosInstance.get("/queries", {
        headers,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Get single query by ID
export const getQueryById = createAsyncThunk(
  "query/getQueryById",
  async ({ queryId, token }: { queryId: string; token?: string }, { rejectWithValue }) => {
    try {
      const authToken =
        token ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        "";
      const headers: Record<string, string> = {};
      if (authToken && authToken !== "cookie-session") {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const response = await axiosInstance.get(`/queries/${queryId}`, {
        headers,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Update query (admin)
export const updateQuery = createAsyncThunk(
  "query/updateQuery",
  async (
    { queryId, queryData, token }: { queryId: string; queryData: Partial<Query>; token?: string },
    { rejectWithValue }
  ) => {
    try {
      const authToken =
        token ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        "";
      const headers: Record<string, string> = {};
      if (authToken && authToken !== "cookie-session") {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const response = await axiosInstance.put(`/queries/${queryId}`, queryData, {
        headers,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.response?.data || error.message || "Failed to update query"
      );
    }
  }
);

// Get resolved queries (admin)
export const getResolvedQueries = createAsyncThunk(
  "query/getResolvedQueries",
  async (token?: string, { rejectWithValue }) => {
    try {
      const authToken =
        token ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        "";
      const headers: Record<string, string> = {};
      if (authToken && authToken !== "cookie-session") {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const response = await axiosInstance.get("/queries?status=resolved", {
        headers,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const querySlice = createSlice({
  name: "query",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // createQuery
      .addCase(createQuery.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuery.fulfilled, (state, action) => {
        state.loading = false;
        state.queries.push(action.payload);
      })
      .addCase(createQuery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // getAllQueries
      .addCase(getAllQueries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllQueries.fulfilled, (state, action) => {
        state.loading = false;
        state.queries = action.payload.data || [];
      })
      .addCase(getAllQueries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // getQueryById
      .addCase(getQueryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQueryById.fulfilled, (state, action) => {
        state.loading = false;
        state.query = action.payload;
      })
      .addCase(getQueryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updateQuery
      .addCase(updateQuery.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuery.fulfilled, (state, action) => {
        state.loading = false;
        const updatedItem = action.payload?.data || action.payload;
        state.query = updatedItem;
        // Update in list as well
        if (updatedItem && updatedItem._id) {
          state.queries = state.queries.map((q) =>
            q._id === updatedItem._id ? { ...q, ...updatedItem } : q
          );
        }
      })
      .addCase(updateQuery.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Failed to update query';
      })
      // getResolvedQueries
      .addCase(getResolvedQueries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getResolvedQueries.fulfilled, (state, action) => {
        state.loading = false;
        state.queries = action.payload.data || [];
      })
      .addCase(getResolvedQueries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default querySlice.reducer;
