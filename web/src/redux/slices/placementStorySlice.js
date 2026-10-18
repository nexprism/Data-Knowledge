import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBaseUrl } from '../../utils/apiConfig.js';

const BASE_URL = getApiBaseUrl();

export const fetchPlacementStories = createAsyncThunk(
  'placementStories/fetchPlacementStories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/placement-stories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch placement stories');
      }

      const data = await response.json();
      return data?.data?.stories || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const placementStorySlice = createSlice({
  name: 'placementStories',
  initialState: {
    stories: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlacementStories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlacementStories.fulfilled, (state, action) => {
        state.loading = false;
        state.stories = action.payload;
      })
      .addCase(fetchPlacementStories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default placementStorySlice.reducer;
