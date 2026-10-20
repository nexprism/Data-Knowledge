import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import axiosInstance from '../../services/axiosConfig';

interface CourseCategory {
    image: any;
    subCategories: any;
    subCategoryCount: number;
    createdAt: string;
    status: string;
    _id: string;
    name: string;
    slug: string;
    isDeleted: boolean;
    updatedAt: string;
    __v: number;
}

interface FetchCategoriesParams {
    page?: number;
    limit?: number;
    filters?: {
        status?: string;
        isDeleted?: boolean;
    };
    search?: string; // Changed from searchFields to search
    sort?: {
        createdAt?: 'asc' | 'desc';
        name?: 'asc' | 'desc';
    };
}

interface CourseCategoryState {
    categories: CourseCategory[];
    loading: boolean;
    error: string | null;
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    searchQuery: string;
    filters: {
        status: string;
        isDeleted: boolean;
    };
}

const initialState: CourseCategoryState = {
    categories: [],
    loading: false,
    error: null,
    pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    },
    searchQuery: '',
    filters: {
        status: '',
        isDeleted: false,
    },
};

// Use axiosInstance with relative paths so dev proxy handles requests
const API_BASE_URL = '';

// Define the SubCategory interface
interface SubCategory {
    _id: string;
    name: string;
    slug: string;
    categoryId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    isDeleted?: boolean;
    __v?: number;
}

// Add the async thunk for creating a subcategory
export const createSubCategory = createAsyncThunk<
    SubCategory,
    any
>('subCategories/create', async (subCategoryData, { rejectWithValue }) => {
    try {
        let payload: any = subCategoryData;
        if (typeof FormData !== 'undefined' && subCategoryData instanceof FormData) {
            payload = {
                name: (subCategoryData.get('name') as string) || '',
                categoryId: (subCategoryData.get('categoryId') as string) || '',
                status: (subCategoryData.get('status') as string) || 'active',
                slug: (subCategoryData.get('slug') as string) || '',
            };
        }
        const response = await axiosInstance.post(
            `/subcategories/`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data?.data?.subCategory || response.data?.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

// FIXED: Updated async thunk to use 'search' parameter instead of 'searchFields'
export const fetchCourseCategories = createAsyncThunk<
    {
        categories: CourseCategory[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    },
    FetchCategoriesParams
>('courseCategories/fetchAll', async (params = {}, { rejectWithValue }) => {
    try {
        const {
            page = 1,
            limit = 10,
            filters = {},
            search = '', // Changed from searchFields
            sort = { createdAt: 'desc' }
        } = params;

        // Build query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());
        
        // Add search parameter if it exists
        if (search && search.trim()) {
            queryParams.append('search', search.trim());
        }
        
        if (Object.keys(filters).length > 0) {
            queryParams.append('filters', JSON.stringify(filters));
        }
        
        if (Object.keys(sort).length > 0) {
            queryParams.append('sort', JSON.stringify(sort));
        }

        console.log('Fetching course categories with params:', {
            page,
            limit,
            filters,
            search, // Updated log
            sort,
            queryParams: queryParams.toString()
        });

        const response = await axiosInstance.get(`/coursecategories/?${queryParams.toString()}`);

        console.log('Fetched course categories:', response.data);
        
        const data = response.data?.data?.categories;
        return {
            categories: data?.result || [],
            pagination: {
                total: data?.total || 0,
                page: data?.page || 1,
                limit: data?.limit || 10,
                totalPages: data?.totalPages || 0,
            }
        };
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

// Async thunk to delete a course category by ID
export const deleteCourseCategory = createAsyncThunk<
    string,
    string
>('courseCategories/delete', async (categoryId, { rejectWithValue }) => {
    try {
        await axiosInstance.delete(`/coursecategories/${categoryId}`);
        return categoryId;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const createCourseCategory = createAsyncThunk<
    CourseCategory,
    Partial<CourseCategory>
>('courseCategories/create', async (categoryData, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.post(
            `/coursecategories/`,
            categoryData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }   
        );
        return response.data?.data?.category;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const deleteSubCategory = createAsyncThunk<
    { subCategoryId: string; categoryId: string },
    { subCategoryId: string; categoryId: string }
>('subCategories/delete', async ({ subCategoryId }, { rejectWithValue }) => {
    try {
        await axiosInstance.delete(`/subcategories/${subCategoryId}`);
        return { subCategoryId, categoryId: '' };
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const updateCourseCategory = createAsyncThunk<
    CourseCategory,
    { categoryId: string; formData: FormData }
>('courseCategories/update', async ({ categoryId, formData }, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.put(
            `/coursecategories/${categoryId}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data?.data?.category;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const fetchCourseCategoryById = createAsyncThunk<
    CourseCategory,
    string
>('courseCategories/fetchById', async (categoryId, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get(
            `/coursecategories/${categoryId}`
        );
        return response.data?.data?.category;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const updateSubCategory = createAsyncThunk<
    SubCategory,
    { subCategoryId: string; data: Partial<SubCategory> }
>('subCategories/update', async ({ subCategoryId, data }, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.put(
            `/subcategories/${subCategoryId}`,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data?.data?.subCategory;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

const courseCategorySlice = createSlice({
    name: 'courseCategories',
    initialState,
    reducers: {
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        resetFilters: (state) => {
            state.filters = initialState.filters;
            state.searchQuery = '';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCourseCategories.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCourseCategories.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = action.payload.categories;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchCourseCategories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createCourseCategory.pending, (state:any) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createCourseCategory.fulfilled, (state:any, action:any) => {
                state.loading = false;
                state.categories.push(action.payload);
            })
            .addCase(createCourseCategory.rejected, (state:any, action:any) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createSubCategory.pending, (state:any) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createSubCategory.fulfilled, (state:any, action:any) => {
                state.loading = false;
                const categoryIndex = state.categories.findIndex(
                    (cat: CourseCategory) => cat._id === action.payload.categoryId
                );
                if (categoryIndex !== -1) {
                    state.categories[categoryIndex].subCategoryCount += 1;
                }
            })
            .addCase(createSubCategory.rejected, (state:any, action:any) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteCourseCategory.pending, (state:any) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteCourseCategory.fulfilled, (state:any, action:any) => {
                state.loading = false;
                state.categories = state.categories.filter(
                    (category: CourseCategory) => category._id !== action.payload
                );
            })
            .addCase(deleteCourseCategory.rejected, (state:any, action:any) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateCourseCategory.pending, (state:any) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateCourseCategory.fulfilled, (state:any, action:any) => {
                state.loading = false;
                const index = state.categories.findIndex(
                    (category: CourseCategory) => category._id === action.payload._id
                );
                if (index !== -1) {
                    state.categories[index] = action.payload;
                }
            })
            .addCase(updateCourseCategory.rejected, (state:any, action:any) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchCourseCategoryById.pending, (state:any) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCourseCategoryById.fulfilled, (state:any, action:any) => {
                state.loading = false;
                const index = state.categories.findIndex(
                    (category: CourseCategory) => category._id === action.payload._id
                );
                if (index !== -1) {
                    state.categories[index] = action.payload;
                } else {
                    state.categories.push(action.payload);
                }
            })
            .addCase(fetchCourseCategoryById.rejected, (state:any, action:any) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateSubCategory.pending, (state:any) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateSubCategory.fulfilled, (state:any, action:any) => {
                state.loading = false;
                const categoryIndex = state.categories.findIndex(
                    (cat: CourseCategory) => cat._id === action.payload.categoryId
                );
                if (categoryIndex !== -1) {
                    const subCategoryIndex = state.categories[categoryIndex].subCategories?.findIndex(
                        (subCat: SubCategory) => subCat._id === action.payload._id
                    );
                    if (subCategoryIndex !== -1) {
                        state.categories[categoryIndex].subCategories[subCategoryIndex] = action.payload;
                    }
                }
            })
            .addCase(updateSubCategory.rejected, (state:any, action:any) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteSubCategory.pending, (state:any) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteSubCategory.fulfilled, (state:any, action:any) => {
                state.loading = false;
                const categoryIndex = state.categories.findIndex(
                    (cat: CourseCategory) => cat._id === action.payload.categoryId
                );
                if (categoryIndex !== -1) {
                    state.categories[categoryIndex].subCategories = state.categories[categoryIndex].subCategories.filter(
                        (subCat: SubCategory) => subCat._id !== action.payload.subCategoryId
                    );
                    state.categories[categoryIndex].subCategoryCount -= 1;
                }
            })
            .addCase(deleteSubCategory.rejected, (state:any, action:any) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setSearchQuery, setFilters, resetFilters } = courseCategorySlice.actions;
export default courseCategorySlice.reducer;