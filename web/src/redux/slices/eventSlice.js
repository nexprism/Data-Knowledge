import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api.dataknowledge.in';

export const fetchEvents = createAsyncThunk(
    'events/fetchEvents',
    async ({ page = 1, limit = 10, status = 'active' } = {}, { rejectWithValue }) => {
        try {
            const response = await fetch(`${BASE_URL}/events?page=${page}&limit=${limit}&status=${status}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const eventSlice = createSlice({
    name: 'events',
    initialState: {
        eventList: [],
        loading: false,
        error: null,
        total: 0,
        currentPage: 1,
        totalPages: 1,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchEvents.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEvents.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload?.data) {
                    const { data: events, total, page, totalPages } = action.payload.data;
                    state.eventList = events || [];
                    state.total = total || 0;
                    state.currentPage = page || 1;
                    state.totalPages = totalPages || 1;
                }
            })
            .addCase(fetchEvents.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default eventSlice.reducer;
