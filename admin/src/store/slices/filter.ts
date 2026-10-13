import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import axiosInstance from '../../services/axiosConfig';
const baseUrl = (import.meta.env.VITE_BASE_URL || "https://api.dataknowledge.in/").replace(/\/+$/, '') + '/';

interface FilterState {
    data: any;
    loading: boolean;
    error: string | null;
}

const initialState: FilterState = {
    data: null,
    loading: false,
    error: null,
};

interface FilterPayload {
    language: string;
    category: string;
    subCategory: string;
    title: string;
    filterOptions: string[];
}

export const fetchFilter = createAsyncThunk<
    {
        filters: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    },
    Partial<FilterPayload> & {
        page?: number;
        limit?: number;
        sort?: Record<string, any>;
        searchFields?: Record<string, any>;
    }
>('filter/fetchFilter', async (params = {}, { rejectWithValue }) => {
    try {
        const {
            page = 1,
            limit = 10,
            sort = { createdAt: 'desc' },
            searchFields = {},
            ...filters
        } = params;

        const queryParams = new URLSearchParams();
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());

        if (Object.keys(filters).length > 0) {
            queryParams.append('filters', JSON.stringify(filters));
        }

        if (Object.keys(searchFields).length > 0) {
            queryParams.append('searchFields', JSON.stringify(searchFields));
        }

        if (Object.keys(sort).length > 0) {
            queryParams.append('sort', JSON.stringify(sort));
        }

        const response = await axios.get(
            `${baseUrl}/filter/?${queryParams.toString()}`
        );

        console.log('Response from fetchFilter:', response.data);

        const data = response.data?.data?.filters;
        return {
            filters: data || [],
            pagination: {
                total: data?.total || 0,
                page: data?.page || 1,
                limit: data?.limit || 10,
                totalPages: data?.totalPages || 0,
            }
        };
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});


export const fetchSubcategoriesByCategory = createAsyncThunk<
    any[],
    string
>('filter/fetchSubcategoriesByCategory', async (categoryId, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get(
            `${baseUrl}/filter/subcategories/by-category/${categoryId}`
        );
        return response.data?.data || [];
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || error.message);
    }
});


export const updateFilter = createAsyncThunk(
    'filter/updateFilter',
    async (
        { id, data }: { id: string; data: FilterPayload },
        { rejectWithValue }
    ) => {
        try {
            const response = await axiosInstance.put(
                `${baseUrl}/filter/${id}`,
                data,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);


export const deleteFilter = createAsyncThunk(
    'filter/deleteFilter',
    async (
        { id, data }: { id: string; data: FilterPayload },
        { rejectWithValue }
    ) => {
        try {
            const response = await axiosInstance.delete(
                `${baseUrl}/filter/${id}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    data,
                }
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const postFilter = createAsyncThunk(
    'filter/postFilter',
    async (payload: FilterPayload, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(
                `${baseUrl}/filter/`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                       
                    },
                }
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const filterSlice = createSlice({
    name: 'filter',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchFilter.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFilter.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchFilter.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateFilter.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateFilter.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                // Optionally handle the updated filter data
            })
            .addCase(updateFilter.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteFilter.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteFilter.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                // Optionally handle the deleted filter data
            })
            .addCase(deleteFilter.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(postFilter.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(postFilter.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                // Optionally handle the posted filter data
            })
            .addCase(postFilter.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchSubcategoriesByCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSubcategoriesByCategory.fulfilled, (state, action: PayloadAction<any[]>) => {
                state.loading = false;
                // Optionally handle the fetched subcategories data
                state.data = {
                    ...state.data,
                    subcategories: action.payload,
                };
            })
            .addCase(fetchSubcategoriesByCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

    },
});

export default filterSlice.reducer;