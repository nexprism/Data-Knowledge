import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBaseUrl } from '../../utils/apiConfig';

const BASE_URL = getApiBaseUrl();

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
            salePrice = Number(salePrice.$numberDecimal);
          }
          if (price && typeof price === 'object' && price.$numberDecimal) {
            price = Number(price.$numberDecimal);
          }

          const plans = Array.isArray(course.plans)
            ? course.plans.map(p => {
                let pPrice = p.price;
                let pSalePrice = p.salePrice;
                if (pPrice && typeof pPrice === 'object' && pPrice.$numberDecimal) {
                  pPrice = Number(pPrice.$numberDecimal);
                }
                if (pSalePrice && typeof pSalePrice === 'object' && pSalePrice.$numberDecimal) {
                  pSalePrice = Number(pSalePrice.$numberDecimal);
                }
                return { ...p, price: pPrice ?? 0, salePrice: pSalePrice };
              })
            : [];
          
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
            plans,
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
          const parseDecimal = (val) => {
            if (val === null || val === undefined || val === '') return null;
            if (typeof val === 'object' && val.$numberDecimal) return Number(val.$numberDecimal);
            const n = Number(val);
            return isNaN(n) ? null : n;
          };

          // Normalize prices
          const salePrice = parseDecimal(course.salePrice);
          const price = parseDecimal(course.price) ?? 0;
          
          const normalizedPlans = Array.isArray(course.plans)
            ? course.plans.map(p => ({
                ...p,
                price: parseDecimal(p.price) ?? 0,
                salePrice: parseDecimal(p.salePrice)
              }))
            : [];
          
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
              .map(block => {
                if (typeof block.data?.text === 'string') return block.data.text;
                if (Array.isArray(block.data?.items)) {
                  return block.data.items
                    .map(it => typeof it === 'object' && it !== null ? (it.content || it.text || '') : String(it || ''))
                    .join(' ');
                }
                return '';
              })
              .join(' ')
              .replace(/&nbsp;/g, ' ')
              .replace(/<[^>]*>?/gm, '');
          };

          // Safe parse mentor achievements
          let mentorAchievements = course.mentorAchievements;
          if (typeof mentorAchievements === 'string') {
            try {
              mentorAchievements = JSON.parse(mentorAchievements);
            } catch {
              mentorAchievements = mentorAchievements.split('\n').filter(Boolean);
            }
          }
          if (!Array.isArray(mentorAchievements)) {
            mentorAchievements = [];
          }

          // Safe parse mentor social links
          let mentorSocialLinks = course.mentorSocialLinks;
          if (typeof mentorSocialLinks === 'string') {
            try {
              mentorSocialLinks = JSON.parse(mentorSocialLinks);
            } catch {
              mentorSocialLinks = {};
            }
          }
          if (!mentorSocialLinks || typeof mentorSocialLinks !== 'object') {
            mentorSocialLinks = {};
          }

          state.currentCourse = {
            ...course,
            category: course.category || course.categoryId || null,
            salePrice,
            price,
            plans: normalizedPlans,
            description,
            shortDescription,
            mentorAchievements,
            mentorSocialLinks,
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
