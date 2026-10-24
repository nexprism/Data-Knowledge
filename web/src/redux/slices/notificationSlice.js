import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authorizedFetch } from '../../utils/apiClient';
import { getApiBaseUrl } from '../../utils/apiConfig';

const BASE_URL = getApiBaseUrl();

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await authorizedFetch(`${BASE_URL}/notifications?page=${page}&limit=${limit}`, {
        method: 'GET'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data?.message || 'Failed to fetch notifications');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authorizedFetch(`${BASE_URL}/notifications/mark-read`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data?.message || 'Failed to mark notifications read');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markSingleNotificationRead = createAsyncThunk(
  'notifications/markSingleRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await authorizedFetch(`${BASE_URL}/notifications/mark-read/${notificationId}`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data?.message || 'Failed to mark notification as read');
      }
      
      return { id: notificationId, data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    total: 0,
    loading: false,
    error: null,
    hasMore: true,
  },
  reducers: {
    markLocalRead: (state, action) => {
      state.items = state.items.map(item =>
        item._id === action.payload ? { ...item, status: 0, isRead: true } : item
      );
    },
    markAllLocalRead: (state) => {
      state.items = state.items.map(item => ({ ...item, status: 0, isRead: true }));
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, { payload }) => {
        state.loading = false;
        // Assuming API returns { data: { result: [], total: number } }
        const { result: notifications, total } = payload.data || {};
        state.items = notifications || [];
        state.total = total || 0;
        state.hasMore = state.items.length < state.total;
      })
      .addCase(fetchNotifications.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      
      // Mark All Read
      .addCase(markNotificationsRead.fulfilled, (state) => {
        state.items = state.items.map(item => ({ ...item, status: 0, isRead: true }));
      })

      // Mark Single Read
      .addCase(markSingleNotificationRead.fulfilled, (state, { payload }) => {
        state.items = state.items.map(item =>
          item._id === payload.id ? { ...item, status: 0, isRead: true } : item
        );
      });
  }
});

export const { markLocalRead, markAllLocalRead } = notificationSlice.actions;
export default notificationSlice.reducer;
