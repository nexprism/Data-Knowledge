import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBaseUrl } from '../../utils/apiConfig.js';

const BASE_URL = getApiBaseUrl();

const DEFAULT_WHY_CHOOSE_US = {
  badgeText: 'The Data Knowledge Advantage',
  title: 'Why Choose Us?',
  description:
    'Practical skills, industry-working mentors, and dedicated career placement support designed to get you hired.',
  items: [
    {
      _id: 'mentors',
      title: 'Industry Working Mentors',
      desc: 'Learn from mentors who work in the industry and bring real-world experience to every session.',
      highlight: 'Real-World Experience',
      iconType: 'mentors',
      iconBg: 'bg-blue-50 text-[#3498db] border-blue-200/80',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      order: 1,
      isActive: true,
    },
    {
      _id: 'mock-interviews',
      title: 'Daily Mock Interviews',
      desc: 'Crack real interviews with daily scenario-based mock sessions.',
      highlight: 'Scenario-Based Prep',
      iconType: 'mock-interviews',
      iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200/80',
      badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      order: 2,
      isActive: true,
    },
    {
      _id: 'placement-support',
      title: '100% Placement Support',
      desc: 'Resume building, Naukri optimization & interview cracking strategy.',
      highlight: 'Career Acceleration',
      iconType: 'placement-support',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      order: 3,
      isActive: true,
    },
    {
      _id: 'projects',
      title: 'Real-Time Projects',
      desc: 'Work on 10+ industry-level projects with real datasets.',
      highlight: '10+ Live Datasets',
      iconType: 'projects',
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      order: 4,
      isActive: true,
    },
    {
      _id: 'doubt-support',
      title: 'Lifetime Doubt Support',
      desc: 'Get mentorship support even after course completion.',
      highlight: 'Continuous Guidance',
      iconType: 'doubt-support',
      iconBg: 'bg-purple-50 text-purple-600 border-purple-200/80',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      order: 5,
      isActive: true,
    },
    {
      _id: 'knowledge-guarantee',
      title: '100% Knowledge Guarantee',
      desc: 'Learn with confidence—we guarantee your understanding.',
      highlight: 'Zero Compromise',
      iconType: 'knowledge-guarantee',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      order: 6,
      isActive: true,
    },
  ],
  ctaTitle: 'Ready to start your data transformation?',
  ctaSubtitle: 'Talk to our career advisors and get a personalized learning roadmap.',
  ctaButtonText: 'Get Free Career Guidance',
  ctaButtonLink: '/contact',
  showCtaBanner: true,
  isActive: true,
};

export const fetchWhyChooseUs = createAsyncThunk(
  'whyChooseUs/fetchWhyChooseUs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/why-choose-us`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Why Choose Us data');
      }

      const data = await response.json();
      return data?.data?.whyChooseUs || DEFAULT_WHY_CHOOSE_US;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const whyChooseUsSlice = createSlice({
  name: 'whyChooseUs',
  initialState: {
    data: DEFAULT_WHY_CHOOSE_US,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWhyChooseUs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWhyChooseUs.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.data = { ...DEFAULT_WHY_CHOOSE_US, ...action.payload };
        }
      })
      .addCase(fetchWhyChooseUs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default whyChooseUsSlice.reducer;
