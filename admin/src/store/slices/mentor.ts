import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosConfig';

export interface Mentor {
    _id?: string;
    name: string;
    role: string;
    exCompanies?: string[];
    experienceBadge?: string;
    image?: string;
    stats?: { label: string; value: string }[];
    bio?: string[];
    skills?: string[];
    accentGradient?: string;
    glowColor?: string;
    borderColor?: string;
    status?: string;
}

interface MentorState {
    loading: boolean;
    error: string | null;
    success: boolean;
}

const initialState: MentorState = {
    loading: false,
    error: null,
    success: false,
};

export const addMentor = createAsyncThunk<
    void,
    { mentor: FormData; token?: string },
    { rejectValue: string }
>('mentor/addMentor', async ({ mentor }, { rejectWithValue }) => {
    try {
        await axiosInstance.post('/admin/mentors', mentor);
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to add mentor');
    }
});

export const fetchMentors = createAsyncThunk<
    Mentor[],
    { token?: string; status?: string } | undefined,
    { rejectValue: string }
>('mentor/fetchMentors', async (args, { rejectWithValue }) => {
    try {
        const params: Record<string, string> = {};
        if (args?.status) params.status = args.status;

        const response = await axiosInstance.get('/admin/mentors', { params });
        return response.data?.data || [];
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch mentors');
    }
});

export const updateMentor = createAsyncThunk<
    void,
    { mentorId: string; data: FormData; token?: string },
    { rejectValue: string }
>('mentor/updateMentor', async ({ mentorId, data }, { rejectWithValue }) => {
    try {
        await axiosInstance.put(`/admin/mentors/${mentorId}`, data);
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to update mentor');
    }
});

export const deleteMentor = createAsyncThunk<
    void,
    { mentorId: string; token?: string },
    { rejectValue: string }
>('mentor/deleteMentor', async ({ mentorId }, { rejectWithValue }) => {
    try {
        await axiosInstance.delete(`/admin/mentors/${mentorId}`);
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to delete mentor');
    }
});

const mentorSlice = createSlice({
    name: 'mentor',
    initialState,
    reducers: {
        resetMentorState: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addMentor.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(addMentor.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(addMentor.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to add mentor';
                state.success = false;
            })
            .addCase(fetchMentors.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMentors.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(fetchMentors.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch mentors';
                state.success = false;
            })
            .addCase(updateMentor.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateMentor.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(updateMentor.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to update mentor';
                state.success = false;
            })
            .addCase(deleteMentor.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(deleteMentor.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(deleteMentor.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to delete mentor';
                state.success = false;
            });
    },
});

export const { resetMentorState } = mentorSlice.actions;
export default mentorSlice.reducer;
