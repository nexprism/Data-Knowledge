import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api.dataknowledge.in';

export const fetchPersonalityResults = createAsyncThunk(
  'personality/fetchResults',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token || localStorage.getItem('edrilla_token');
      
      const response = await fetch(`${BASE_URL}/personality/my-results`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-access-token': token
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch personality results');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const personalitySlice = createSlice({
  name: 'personality',
  initialState: {
    results: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPersonalityResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPersonalityResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload?.data || null;
      })
      .addCase(fetchPersonalityResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default personalitySlice.reducer;
