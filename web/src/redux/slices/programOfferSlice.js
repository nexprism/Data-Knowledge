import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBaseUrl } from '../../utils/apiConfig.js';

const BASE_URL = getApiBaseUrl();

export const fetchProgramOffers = createAsyncThunk(
  'programOffers/fetchProgramOffers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/programs-offer`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch programs we offer');
      }

      const data = await response.json();
      return data?.data?.programs || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const programOfferSlice = createSlice({
  name: 'programOffers',
  initialState: {
    programs: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProgramOffers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProgramOffers.fulfilled, (state, action) => {
        state.loading = false;
        state.programs = action.payload;
      })
      .addCase(fetchProgramOffers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default programOfferSlice.reducer;
