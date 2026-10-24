import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosConfig';

interface NotificationState {
    loading: boolean;
    error: string | null;
    success: boolean;
    notifications: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    filters: {
        status?: number;
        courseId?: string;
        userId?: string;
        type?: string;
    };
}

const initialState: NotificationState = {
    loading: false,
    error: null,
    success: false,
    notifications: [],
    pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    },
    filters: {},
};

export const sendNotification = createAsyncThunk<
    any,
    {
        title: string;
        description: string;
        type: string;
        image?: File | null;
        webPushLink?: string;
        token: string;
    }
>('notification/send', async (payload, { rejectWithValue }) => {
    try {
        const formData = new FormData();
        formData.append('title', payload.title);
        formData.append('description', payload.description);
        formData.append('type', payload.type || 'general');
        formData.append('data[type]', payload.type || 'general');
        if (payload.image) {
            formData.append('image', payload.image);
        }
        if (payload.webPushLink) {
            formData.append('webPushLink', payload.webPushLink);
        }

        const response = await axiosInstance.post('/notifications/send', formData, {
            headers: {
                Authorization: `Bearer ${payload.token}`,
            },
        });
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to send notification');
    }
});

export const sendCourseNotification = createAsyncThunk<
    any,
    {
        courseId: string;
        title: string;
        description: string;
        type: string;
        image?: File | null;
        webPushLink?: string;
        token: string;
    }
>('notification/sendToCourse', async (payload, { rejectWithValue }) => {
    try {
        const formData = new FormData();
        formData.append('title', payload.title);
        formData.append('description', payload.description);
        formData.append('type', payload.type || 'course_notification');
        formData.append('data[type]', payload.type || 'course_notification');
        if (payload.image) {
            formData.append('image', payload.image);
        }
        if (payload.webPushLink) {
            formData.append('webPushLink', payload.webPushLink);
        }

        const response = await axiosInstance.post(`/notifications/send-to-course/${payload.courseId}`, formData, {
            headers: {
                Authorization: `Bearer ${payload.token}`,
            },
        });
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to send course notification');
    }
});

export const fetchNotifications = createAsyncThunk<
    {
        notifications: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    },
    {
        page?: number;
        limit?: number;
        status?: number;
        courseId?: string;
        userId?: string;
        type?: string;
        token: string;
    }
>('notification/fetchAll', async (params, { rejectWithValue }) => {
    try {
        const { page = 1, limit = 10, status, courseId, userId, type, token } = params;
        
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (status !== undefined) queryParams.append('status', status.toString());
        if (courseId) queryParams.append('courseId', courseId);
        if (userId) queryParams.append('userId', userId);
        if (type) queryParams.append('type', type);

        const response = await axiosInstance.get(`/notifications/admin/all?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        console?.log("Full Response:", response?.data);

        // The API response structure is: { success: true, data: { notifications: [...], pagination: {...} } }
        const responseData = response?.data?.data || {};
        console?.log("Response Data:", responseData);
        
        return {
            notifications: responseData?.notifications || [],
            total: responseData.pagination?.total || 0,
            page: responseData.pagination?.page || 1,
            limit: responseData.pagination?.limit || 10,
            totalPages: responseData.pagination?.totalPages || 1,
        };
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
});

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        clearNotificationState: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
        },
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = {};
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(sendNotification.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(sendNotification.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(sendNotification.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.success = false;
            })
            .addCase(sendCourseNotification.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(sendCourseNotification.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(sendCourseNotification.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.success = false;
            })
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.notifications = action.payload.notifications;
                state.pagination = {
                    page: action.payload.page,
                    limit: action.payload.limit,
                    total: action.payload.total,
                    totalPages: action.payload.totalPages,
                };
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearNotificationState, setFilters, clearFilters } = notificationSlice.actions;

export default notificationSlice.reducer;