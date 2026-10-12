import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api.dataknowledge.in';

export const fetchMyThreads = createAsyncThunk(
  'forum/fetchMyThreads',
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

      const response = await fetch(`${BASE_URL}/forum/my-threads`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch your threads');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchThreads = createAsyncThunk(
  'forum/fetchThreads',
  async ({ page = 1, limit = 10, sort = 'latest' } = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token || localStorage.getItem('edrilla_token');
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}/forum/all-threads-with-replies?page=${page}&limit=${limit}&sort=${sort}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const fallbackRes = await fetch(`${BASE_URL}/forum/threads?page=${page}&limit=${limit}`, {
          method: 'GET',
          headers
        });
        if (!fallbackRes.ok) {
          return { data: { threads: [], total: 0, page: 1, totalPages: 1 } };
        }
        return await fallbackRes.json();
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return { data: { threads: [], total: 0, page: 1, totalPages: 1 } };
    }
  }
);

export const fetchForumTags = createAsyncThunk(
  'forum/fetchForumTags',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token || localStorage.getItem('edrilla_token');
      const response = await fetch(`${BASE_URL}/forum/tags`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error('Failed to fetch forum tags');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const likeThread = createAsyncThunk(
  'forum/likeThread',
  async (threadId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token || localStorage.getItem('edrilla_token');
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-access-token'] = token;
      }

      const response = await fetch(`${BASE_URL}/forum/thread/${threadId}/like`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}) // Some backends require an empty body for POST
      });
      
      if (!response.ok) {
        throw new Error('Failed to like thread');
      }
      const data = await response.json();
      return { threadId, data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const postReply = createAsyncThunk(
  'forum/postReply',
  async ({ threadId, content, attachment = null, parentReplyId = null }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token || localStorage.getItem('edrilla_token');
      
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-access-token'] = token;
      }

      const formData = new FormData();
      formData.append('content', content);
      
      if (attachment) {
        formData.append('file', attachment); // Assuming backend expects 'file'
      }
      
      if (parentReplyId) {
        formData.append('parentReplyId', parentReplyId);
      }

      const response = await fetch(`${BASE_URL}/forum/${threadId}/reply`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post reply');
      }
      const data = await response.json();
      return { threadId, data: data.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createThread = createAsyncThunk(
  'forum/createThread',
  async ({ title, content, tags, attachments }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token || localStorage.getItem('edrilla_token');
      
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-access-token'] = token;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      
      if (tags && tags.length > 0) {
        // Many backends expect tags as a JSON string or individual entries
        tags.forEach(tag => formData.append('tags', tag));
      }
      
      if (attachments && attachments.length > 0) {
        attachments.forEach(file => formData.append('attachments', file));
      }

      const response = await fetch(`${BASE_URL}/forum/create`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create topic');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const forumSlice = createSlice({
  name: 'forum',
  initialState: {
    threads: [],
    myThreads: [],
    total: 0,
    myTotal: 0,
    currentPage: 1,
    totalPages: 1,
    loading: false,
    myLoading: false,
    error: null,
    tags: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyThreads.pending, (state) => {
        state.myLoading = true;
        state.error = null;
      })
      .addCase(fetchMyThreads.fulfilled, (state, action) => {
        state.myLoading = false;
        state.myThreads = action.payload?.threads || action.payload?.data?.threads || action.payload || [];
        state.myTotal = action.payload?.total || action.payload?.data?.total || state.myThreads.length;
      })
      .addCase(fetchMyThreads.rejected, (state, action) => {
        state.myLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchThreads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThreads.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload || {};
        
        let rawThreads = [];
        let total = 0;
        let page = 1;
        let totalPages = 1;

        if (Array.isArray(payload)) {
          rawThreads = payload;
          total = payload.length;
        } else if (Array.isArray(payload.data)) {
          rawThreads = payload.data;
          total = payload.total || payload.data.length;
        } else if (payload.data && typeof payload.data === 'object') {
          rawThreads = payload.data.threads || payload.data.data || [];
          total = payload.data.total || rawThreads.length;
          page = payload.data.page || 1;
          totalPages = payload.data.totalPages || 1;
        } else if (payload.threads && Array.isArray(payload.threads)) {
          rawThreads = payload.threads;
          total = payload.total || rawThreads.length;
          page = payload.page || 1;
          totalPages = payload.totalPages || 1;
        }

        if (page === 1) {
          state.threads = rawThreads;
        } else {
          const existingIds = new Set((state.threads || []).map(t => t._id));
          const uniqueNewThreads = rawThreads.filter(t => t._id && !existingIds.has(t._id));
          state.threads = [...(state.threads || []), ...uniqueNewThreads];
        }
        
        state.total = total;
        state.currentPage = page;
        state.totalPages = totalPages;
      })
      .addCase(fetchThreads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createThread.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createThread.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.data) {
          state.threads = [action.payload.data, ...state.threads];
          state.total += 1;
        }
      })
      .addCase(createThread.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchForumTags.fulfilled, (state, action) => {
        state.tags = action.payload?.data || action.payload?.tags || [];
      });
  },
});

export default forumSlice.reducer;
