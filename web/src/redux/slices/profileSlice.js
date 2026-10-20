import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authorizedFetch, parseApiResponse } from '../../utils/apiClient';

// ── Thunks ───────────────────────────────────────────────────────────────────
export const fetchUserProfile = createAsyncThunk(
  'profile/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('edrilla_token');
      
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      const res = await authorizedFetch('/user', {
        method: 'GET',
      });

      const data = await parseApiResponse(res);
      if (!res.ok) return rejectWithValue(data?.message || 'Failed to fetch profile');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'profile/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('edrilla_token');

      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      const isFormData = profileData instanceof FormData;
      
      const res = await authorizedFetch('/profile', {
        method: 'PUT',
        body: isFormData ? profileData : JSON.stringify(profileData),
      });

      const data = await parseApiResponse(res);
      if (!res.ok) return rejectWithValue(data?.message || 'Failed to update profile');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'profile/deleteDocument',
  async (documentId, { rejectWithValue }) => {
    try {
      const res = await authorizedFetch(`/documentation/${documentId}`, {
        method: 'DELETE',
      });

      const data = await parseApiResponse(res);
      if (!res.ok) return rejectWithValue(data?.message || 'Failed to delete document');
      return documentId;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const deleteEducation = createAsyncThunk(
  'profile/deleteEducation',
  async (educationId, { rejectWithValue }) => {
    try {
      const res = await authorizedFetch(`/education/${educationId}`, {
        method: 'DELETE',
      });

      const data = await parseApiResponse(res);
      if (!res.ok) return rejectWithValue(data?.message || 'Failed to delete education');
      return educationId;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────
const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    user: null,
    loading: false,
    error: null,
    updateLoading: false,
    updateError: null,
  },
  reducers: {
    clearProfileError(state) {
      state.error = null;
      state.updateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload.data?.user || payload.data || payload;
      })
      .addCase(fetchUserProfile.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, { payload }) => {
        state.updateLoading = false;
        state.user = payload.data?.user || payload.data || payload;
      })
      .addCase(updateUserProfile.rejected, (state, { payload }) => {
        state.updateLoading = false;
        state.updateError = payload;
      })
      // Delete Document
      .addCase(deleteDocument.pending, (state) => {
        state.updateLoading = true;
      })
      .addCase(deleteDocument.fulfilled, (state, { payload }) => {
        state.updateLoading = false;
        if (state.user?.documentation) {
          state.user.documentation = state.user.documentation.filter(
            (doc) => doc._id !== payload
          );
        }
      })
      .addCase(deleteDocument.rejected, (state, { payload }) => {
        state.updateLoading = false;
        state.updateError = payload;
      })
      // Delete Education
      .addCase(deleteEducation.pending, (state) => {
        state.updateLoading = true;
      })
      .addCase(deleteEducation.fulfilled, (state, { payload }) => {
        state.updateLoading = false;
        if (state.user?.education) {
          state.user.education = state.user.education.filter(
            (edu) => edu._id !== payload
          );
        }
      })
      .addCase(deleteEducation.rejected, (state, { payload }) => {
        state.updateLoading = false;
        state.updateError = payload;
      });
  },
});

export const { clearProfileError } = profileSlice.actions;
export default profileSlice.reducer;
