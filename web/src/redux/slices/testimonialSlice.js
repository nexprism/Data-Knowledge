import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBaseUrl } from '../../utils/apiConfig.js';

const BASE_URL = getApiBaseUrl();

// Fetch all approved testimonials for public display
export const fetchTestimonials = createAsyncThunk(
  'testimonials/fetchTestimonials',
  async (courseId = null, { rejectWithValue }) => {
    try {
      const url = courseId
        ? `${BASE_URL}/testimonials?courseId=${courseId}`
        : `${BASE_URL}/testimonials`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch testimonials');
      }

      const data = await response.json();
      return data?.data || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Submit a new testimonial (Student)
export const submitTestimonial = createAsyncThunk(
  'testimonials/submitTestimonial',
  async (formData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const response = await fetch(`${BASE_URL}/testimonials`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || 'Failed to submit testimonial');
      }

      const data = await response.json();
      return data?.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const testimonialSlice = createSlice({
  name: 'testimonials',
  initialState: {
    testimonials: [],
    loading: false,
    submitting: false,
    error: null,
    submitSuccess: false,
  },
  reducers: {
    resetSubmitStatus: (state) => {
      state.submitSuccess = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchTestimonials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTestimonials.fulfilled, (state, action) => {
        state.loading = false;
        state.testimonials = action.payload;
      })
      .addCase(fetchTestimonials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Submit
      .addCase(submitTestimonial.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.submitSuccess = false;
      })
      .addCase(submitTestimonial.fulfilled, (state) => {
        state.submitting = false;
        state.submitSuccess = true;
      })
      .addCase(submitTestimonial.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });
  },
});

export const { resetSubmitStatus } = testimonialSlice.actions;
export default testimonialSlice.reducer;
