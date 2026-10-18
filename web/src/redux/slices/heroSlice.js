import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBaseUrl } from '../../utils/apiConfig.js';

const BASE_URL = getApiBaseUrl();

const DEFAULT_HERO = {
  headlinePrefix: 'Master Practical Data Analytics,',
  headlineHighlight: 'Data Science, ML & AI',
  description:
    'At Data Knowledge, our mission is to provide practical and industry-focused training in tools like SQL, Excel, Power BI, Tableau, Python, and Business Analysis. Gain real-world skills that companies actually look for in data analyst and data science roles.',
  primaryButtonText: 'Explore Programs',
  primaryButtonLink: '/courses',
  showPrimaryButton: true,
  secondaryButtonText: 'Book Consultation',
  secondaryButtonAction: 'consultation_modal',
  secondaryButtonLink: '',
  showSecondaryButton: true,
  mentorImage: '/data_knowlege/mentor/mentore_2.png',
  mentorImageAlt: 'Data Knowledge Mentors',
  badgeText: '',
  isActive: true,
};

export const fetchHeroSection = createAsyncThunk(
  'hero/fetchHeroSection',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/hero-section`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hero section data');
      }

      const data = await response.json();
      return data?.data?.hero || DEFAULT_HERO;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const heroSlice = createSlice({
  name: 'hero',
  initialState: {
    hero: DEFAULT_HERO,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHeroSection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHeroSection.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.hero = { ...DEFAULT_HERO, ...action.payload };
        }
      })
      .addCase(fetchHeroSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default heroSlice.reducer;
