import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api.dataknowledge.in';

// Get user token helper
const getAuthHeaders = () => {
  const token = localStorage.getItem('edrilla_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const fetchMyJobs = createAsyncThunk(
  'jobs/fetchMyJobs',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/jobs/my-posts`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.message || 'Failed to fetch jobs');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/jobs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(jobData),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.message || 'Failed to create job');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const fetchJobById = createAsyncThunk(
  'jobs/fetchJobById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/jobs/${id}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.message || 'Failed to fetch job detail');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const fetchExploreJobs = createAsyncThunk(
  'jobs/fetchExploreJobs',
  async ({ page = 1, limit = 10, isAdminApproved = true } = {}, { rejectWithValue }) => {
    try {
      const query = `page=${page}&limit=${limit}&isAdminApproved=${isAdminApproved}`;
      const res = await fetch(`${BASE_URL}/jobs?${query}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.message || 'Failed to fetch explore jobs');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const submitProposal = createAsyncThunk(
  'jobs/submitProposal',
  async ({ jobId, formData }, { rejectWithValue }) => {
    try {
      // getAuthHeaders includes Bearer token but we let browser set Content-Type for FormData
      const token = localStorage.getItem('edrilla_token');
      const res = await fetch(`${BASE_URL}/jobs/${jobId}/proposals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData, // FormData instance
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.message || 'Failed to submit proposal');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async ({ id, jobData }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/jobs/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(jobData),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.message || 'Failed to update job');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

const jobSlice = createSlice({
  name: 'jobs',
  initialState: {
    myJobs: [],
    exploreJobs: [], // Public jobs for Gigs page
    currentJob: null,
    loading: false,
    error: null,
    total: 0,
    page: 1,
    totalPages: 1
  },
  reducers: {
    clearJobError(state) {
      state.error = null;
    },
    clearCurrentJob(state) {
      state.currentJob = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch My Jobs
      .addCase(fetchMyJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyJobs.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.myJobs = payload.data?.data || [];
        state.total = payload.data?.total || 0;
        state.page = payload.data?.page || 1;
        state.totalPages = payload.data?.totalPages || 1;
      })
      .addCase(fetchMyJobs.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      // Fetch Job By Id
      .addCase(fetchJobById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobById.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.currentJob = payload.data;
      })
      .addCase(fetchJobById.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // Create Job
      .addCase(createJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, { payload }) => {
        state.loading = false;
        // Prepend the new job to the list
        if (payload.data) {
          state.myJobs.unshift(payload.data);
          state.total += 1;
        }
      })
      .addCase(createJob.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      // Update Job
      .addCase(updateJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateJob.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.data) {
          // Update currentJob if it matches
          if (state.currentJob?._id === payload.data._id) {
            state.currentJob = payload.data;
          }
          // Update in myJobs list
          const index = state.myJobs.findIndex(job => job._id === payload.data._id);
          if (index !== -1) {
            state.myJobs[index] = payload.data;
          }
        }
      })
      .addCase(updateJob.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      // Fetch Explore Jobs
      .addCase(fetchExploreJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExploreJobs.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.exploreJobs = payload.data?.data || payload.data || [];
        state.total = payload.data?.total || 0;
        state.page = payload.data?.page || 1;
        state.totalPages = payload.data?.totalPages || 1;
      })
      .addCase(fetchExploreJobs.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      // Submit Proposal
      .addCase(submitProposal.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitProposal.fulfilled, (state) => {
        state.submitting = false;
      })
      .addCase(submitProposal.rejected, (state, { payload }) => {
        state.submitting = false;
        state.error = payload;
      });
  }
});

export const { clearJobError, clearCurrentJob } = jobSlice.actions;

export default jobSlice.reducer;
