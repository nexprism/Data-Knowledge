import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authorizedFetch, parseApiResponse } from '../../utils/apiClient';

export const fetchMySubmissions = createAsyncThunk(
  'assignment/fetchMySubmissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authorizedFetch('/assignment-submissions/my', {
        method: 'GET',
      });
      const data = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to fetch your submissions');
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMyAssignmentArchive = createAsyncThunk(
  'assignment/fetchMyAssignmentArchive',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authorizedFetch('/assignment-submissions/my/archive', {
        method: 'GET',
      });
      const data = await parseApiResponse(response);
      if (!response.ok) throw new Error(data?.message || 'Failed to fetch assignments');
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const assignmentSlice = createSlice({
  name: 'assignment',
  initialState: {
    submissions: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMySubmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMySubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions = action.payload?.data || action.payload || [];
      })
      .addCase(fetchMySubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyAssignmentArchive.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyAssignmentArchive.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions = action.payload?.data || [];
      })
      .addCase(fetchMyAssignmentArchive.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default assignmentSlice.reducer;
