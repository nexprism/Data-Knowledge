import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBaseUrl } from '../../utils/apiConfig';

const BASE_URL = getApiBaseUrl();

// ── Thunks ───────────────────────────────────────────────────────────────────
export const fetchMyEnrollments = createAsyncThunk(
  'enrollment/fetchMyEnrollments',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const token = auth.token || localStorage.getItem('edrilla_token');
      
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      const res = await fetch(`${BASE_URL}/checkout/my-enrollments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.message || 'Failed to fetch enrollments');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const buyNow = createAsyncThunk(
  'enrollment/buyNow',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/checkout/buy-now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.message || 'Payment processing failed');
      
      // Persist auth data if returned
      const authData = data?.data || data;
      if (authData.accessToken || authData.token) {
        localStorage.setItem('edrilla_token', authData.accessToken || authData.token);
      }
      if (authData.guestUser || authData.user) {
        localStorage.setItem('edrilla_user', JSON.stringify(authData.guestUser || authData.user));
      }
      
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────
const enrollmentSlice = createSlice({
  name: 'enrollment',
  initialState: {
    enrollments: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearEnrollmentError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyEnrollments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyEnrollments.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.enrollments = payload.data || payload;
      })
      .addCase(fetchMyEnrollments.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      .addCase(buyNow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(buyNow.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(buyNow.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });
  },
});

export const { clearEnrollmentError } = enrollmentSlice.actions;
export default enrollmentSlice.reducer;
