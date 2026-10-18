import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBaseUrl } from '../../utils/apiConfig.js';

const BASE_URL = getApiBaseUrl();

export const fetchProvenResults = createAsyncThunk(
  'provenResults/fetchProvenResults',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/proven-results`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch proven results');
      }

      const data = await response.json();
      return data?.data?.results || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const provenResultSlice = createSlice({
  name: 'provenResults',
  initialState: {
    results: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProvenResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProvenResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
      })
      .addCase(fetchProvenResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default provenResultSlice.reducer;
