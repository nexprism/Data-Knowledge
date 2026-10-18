import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBaseUrl } from '../../utils/apiConfig';

const BASE_URL = getApiBaseUrl();

export const fetchNews = createAsyncThunk(
  'news/fetchNews',
  async ({ page = 1, limit = 12, status = 'active' } = {}, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/news?page=${page}&limit=${limit}&status=${status}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchNewsDetail = createAsyncThunk(
  'news/fetchNewsDetail',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/news/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch news detail');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchNewsBySlug = createAsyncThunk(
  'news/fetchNewsBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/news/slug/${slug}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch news detail');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const newsSlice = createSlice({
  name: 'news',
  initialState: {
    newsList: [],
    currentNews: null,
    total: 0,
    currentPage: 1,
    totalPages: 1,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNews.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.data) {
          const { data: news, total, page, totalPages } = action.payload.data;
          
          if (page === 1) {
            state.newsList = news || [];
          } else {
            const newNews = news || [];
            const existingIds = new Set(state.newsList.map(n => n._id));
            const uniqueNewNews = newNews.filter(n => !existingIds.has(n._id));
            state.newsList = [...state.newsList, ...uniqueNewNews];
          }
          
          state.total = total || 0;
          state.currentPage = page || 1;
          state.totalPages = totalPages || 1;
        }
      })
      .addCase(fetchNews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchNewsDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentNews = null;
      })
      .addCase(fetchNewsDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentNews = action.payload?.data || null;
      })
      .addCase(fetchNewsDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchNewsBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentNews = null;
      })
      .addCase(fetchNewsBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.currentNews = action.payload?.data || null;
      })
      .addCase(fetchNewsBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default newsSlice.reducer;
