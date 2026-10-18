import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/apiConfig';

const API_URL = `${API_BASE_URL}/security/incidents`;

export const fetchIncidents = createAsyncThunk(
  'security/fetchIncidents',
  async ({ page, limit }: { page: number; limit: number }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}?page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data);
    }
  }
);

const securitySlice = createSlice({
  name: 'security',
  initialState: {
    incidents: [],
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    totalIncidents: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncidents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIncidents.fulfilled, (state, action) => {
        state.loading = false;
        state.incidents = action.payload.data;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.pages;
        state.totalIncidents = action.payload.total;
      })
      .addCase(fetchIncidents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as any;
      });
  },
});

export default securitySlice.reducer;
