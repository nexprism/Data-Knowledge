import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api.dataknowledge.in';

export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/courses/?page=1&limit=1000`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCourseDetail = createAsyncThunk(
  'courses/fetchCourseDetail',
  async (courseId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('edrilla_token');
      const isObjectId = /^[a-f\d]{24}$/i.test(String(courseId));
      const endpoint = isObjectId
        ? `${BASE_URL}/courses/${courseId}`
        : `${BASE_URL}/courses/slug/${encodeURIComponent(courseId)}`;
      const response = await fetch(endpoint, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch course details');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const courseSlice = createSlice({
  name: 'courses',
  initialState: {
    courses: [],
    currentCourse: null,
    loading: false,
    detailLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        // The API returns { data: { data: [courses], total: ... } }
        const rawCourses = action.payload?.data?.data || action.payload?.data || action.payload?.results || action.payload || [];
        state.courses = rawCourses.map(course => {
          let salePrice = course.salePrice;
          let price = course.price;
          
          if (salePrice && typeof salePrice === 'object' && salePrice.$numberDecimal) {
            salePrice = salePrice.$numberDecimal;
          }
          if (price && typeof price === 'object' && price.$numberDecimal) {
            price = price.$numberDecimal;
          }
          
          let description = course.description || '';
          if (typeof description === 'string') {
            description = description.replace(/<[^>]*>?/gm, '');
          }
          let shortDescription = course.shortDescription || '';
          if (typeof shortDescription === 'string') {
            shortDescription = shortDescription.replace(/<[^>]*>?/gm, '');
          }

          return {
            ...course,
            category: course.category || course.categoryId || null,
            salePrice,
            price,
            description,
            shortDescription
          };
        });
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCourseDetail.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
        state.currentCourse = null;
      })
      .addCase(fetchCourseDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        
        const course = action.payload?.data?.course || action.payload?.data || action.payload;
        
        if (course) {
          // Normalize prices
          let salePrice = course.salePrice;
          let price = course.price;
          
          if (salePrice && typeof salePrice === 'object' && salePrice.$numberDecimal) {
            salePrice = salePrice.$numberDecimal;
          }
          if (price && typeof price === 'object' && price.$numberDecimal) {
            price = price.$numberDecimal;
          }
          
          // Strip HTML from descriptions if they are strings
          let description = course.description;
          if (typeof description === 'string') {
            description = description.replace(/<[^>]*>?/gm, '');
          }
          
          let shortDescription = course.shortDescription;
          if (typeof shortDescription === 'string') {
            shortDescription = shortDescription.replace(/<[^>]*>?/gm, '');
          }

          // Handle comparison section content if it's in EditorJS format
          const processEditorJS = (content) => {
            if (!content || !content.blocks) return '';
            return content.blocks
              .map(block => block.data?.text || '')
              .join(' ')
              .replace(/&nbsp;/g, ' ')
              .replace(/<[^>]*>?/gm, '');
          };

          state.currentCourse = {
            ...course,
            category: course.category || course.categoryId || null,
            salePrice,
            price,
            description,
            shortDescription,
            comparisonText: processEditorJS(course.comparisonSection?.content),
            benefitsText: processEditorJS(course.benefitsSection?.content)
          };
        } else {
          state.currentCourse = null;
        }
      })
      .addCase(fetchCourseDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      });
  },
});

export default courseSlice.reducer;
