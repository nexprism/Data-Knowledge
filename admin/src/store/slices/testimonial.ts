import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import axiosInstance from '../../services/axiosConfig';

interface Testimonial {
    _id?: string;
    name: string;
    role: string;
    message: string;
    rating: number;
    courseId: string;
    image?: string;
    screenshot?: string;
    reviewImages?: string[];
    video?: string;
}

interface TestimonialState {
    loading: boolean;
    error: string | null;
    success: boolean;
}

const initialState: TestimonialState = {
    loading: false,
    error: null,
    success: false,
};

export const addTestimonial = createAsyncThunk<
    void,
    { testimonial: FormData; token: string },
    { rejectValue: string }
>('testimonial/addTestimonial', async ({ testimonial, token }, { rejectWithValue }) => {
    try {
        await axiosInstance.post(
            '/admin/testimonials',
            testimonial,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to add testimonial');
    }
});

export const fetchTestimonials = createAsyncThunk<
    Testimonial[],
    { token: string; status?: string; search?: string; courseId?: string },
    { rejectValue: string }
>('testimonial/fetchTestimonials', async ({ token, status, search, courseId }, { rejectWithValue }) => {
    try {
        const params: Record<string, string> = {};
        if (status) params.status = status;
        if (search) params.search = search;
        if (courseId) params.courseId = courseId;

        const response = await axiosInstance.get('/admin/testimonials', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params,
        });
        return response.data?.data || [];
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch testimonials');
    }
});


export const updateTestimonial = createAsyncThunk<
    void,
    { testimonialId: string; data: FormData; token: string },
    { rejectValue: string }
>('testimonial/updateTestimonial', async ({ testimonialId, data, token }, { rejectWithValue }) => {
    try {
        await axiosInstance.put(
            `/admin/testimonials/${testimonialId}`,
            data,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to update testimonial');
    }
});

export const reorderTestimonials = createAsyncThunk<
    void,
    { items: { id: string; order?: number; status?: string }[]; token: string },
    { rejectValue: string }
>('testimonial/reorderTestimonials', async ({ items, token }, { rejectWithValue }) => {
    try {
        await axiosInstance.put(
            '/admin/testimonials/reorder',
            { items },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to reorder testimonials');
    }
});


export const getTestimonialById = createAsyncThunk<
    Testimonial,
    { testimonialId: string; token: string },
    { rejectValue: string }
>('testimonial/getTestimonialById', async ({ testimonialId, token }, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get(`/testimonials/${testimonialId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data?.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch testimonial');
    }
});


export const deleteTestimonial = createAsyncThunk<
    void,
    { testimonialId: string; token: string },
    { rejectValue: string }
>('testimonial/deleteTestimonial', async ({ testimonialId, token }, { rejectWithValue }) => {
    try {
        await axiosInstance.delete(`/admin/testimonials/${testimonialId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to delete testimonial');
    }
});

const testimonialSlice = createSlice({
    name: 'testimonial',
    initialState,
    reducers: {
        resetTestimonialState: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addTestimonial.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(addTestimonial.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(addTestimonial.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to add testimonial';
                state.success = false;
            })
            .addCase(fetchTestimonials.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTestimonials.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(fetchTestimonials.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch testimonials';
                state.success = false;
            })
            .addCase(updateTestimonial.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            }
            )
            .addCase(updateTestimonial.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(updateTestimonial.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to update testimonial';
                state.success = false;
            }
            )
            .addCase(getTestimonialById.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(getTestimonialById.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(getTestimonialById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch testimonial';
                state.success = false;
            })
            .addCase(deleteTestimonial.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            }
            )
            .addCase(deleteTestimonial.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(deleteTestimonial.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to delete testimonial';
                state.success = false;
            });
    },
});

export const { resetTestimonialState } = testimonialSlice.actions;
export default testimonialSlice.reducer;