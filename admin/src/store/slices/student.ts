import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

interface StudentState {
  loading: boolean;
  error: string | null;
  data: any;
}

const initialState: StudentState = {
  loading: false,
  error: null,
  data: null,
};

export const fetchAllUsers = createAsyncThunk<
  { users: any[]; total: number },
  { page?: number; limit?: number; token: string }
>("student/fetchAllUsers", async (params, { rejectWithValue }) => {
  try {
    const { page = 1, limit = 20, token } = params;
    const response = await axiosInstance.get(
      `/users?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data?.data || {};
    return {
      users: data.users || [],
      total: data.total || 0,
    };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch users");
  }
});

const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = {
          ...state.data,
          users: action.payload.users,
        };
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default studentSlice.reducer;