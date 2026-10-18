import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBaseUrl } from '../../utils/apiConfig';

const BASE_URL = getApiBaseUrl();

export const fetchMySubmissions = createAsyncThunk(
  'assignment/fetchMySubmissions',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token || localStorage.getItem('edrilla_token');
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}/assignment-submissions/my`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch your submissions');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMyAssignmentArchive = createAsyncThunk(
  'assignment/fetchMyAssignmentArchive',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token || localStorage.getItem('edrilla_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`${BASE_URL}/assignment-submissions/my/archive`, {
        headers,
      });
      if (!response.ok) throw new Error('Failed to fetch assignments');
      return await response.json();
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
