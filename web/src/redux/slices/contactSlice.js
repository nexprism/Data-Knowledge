import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBaseUrl } from '../../utils/apiConfig.js';

const BASE_URL = getApiBaseUrl();

export const DEFAULT_CONTACT_PAGE = {
  badgeText: 'GET IN TOUCH',
  title: 'CONTACT US.',
  description:
    'We are here to help! Whether you have questions about our courses, need technical support, or just want to share feedback, the Support Team is always ready to assist you.',
  primaryEmail: 'dataknowledge.class@gmail.com',
  emailSupportDescription:
    'For program inquiries, course questions, or mentorship assistance:',
  primaryPhone: '+91 74837 41501',
  alternatePhone: '+91 82377 00626',
  whatsappNumber: '917483741501',
  whatsappText: 'Chat on WhatsApp',
  portalTitle: 'Live Classes Portal',
  portalUrl: 'https://classes.dataknowledge.in/',
  portalDescription:
    'Access online live sessions, assignments, and mock test portal:',
  address: 'Data Knowledge Classes & Training, India',
  notificationEmail: '',
  subjectOptions: [
    'General Inquiry',
    'Course Enquiry',
    'Solopreneur',
    'Personal Branding',
    'Studio Services',
    'Cohort Enrollment',
    'Offline Mentorship Enrollment',
    'Billing or Payment Issue',
    'Feedback',
    'Complaint',
    'Other',
  ],
  isActive: true,
};

// Fetch dynamic contact page content
export const fetchContactPage = createAsyncThunk(
  'contact/fetchContactPage',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/contact/page`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Contact Page details');
      }

      const data = await response.json();
      return data?.data?.contactPage || DEFAULT_CONTACT_PAGE;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Submit public contact request form
export const submitContactForm = createAsyncThunk(
  'contact/submitContactForm',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/contact/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to submit contact request');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const contactSlice = createSlice({
  name: 'contact',
  initialState: {
    data: DEFAULT_CONTACT_PAGE,
    loading: false,
    submitting: false,
    error: null,
    submitSuccess: false,
  },
  reducers: {
    resetContactFormState: (state) => {
      state.submitting = false;
      state.error = null;
      state.submitSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Page
      .addCase(fetchContactPage.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchContactPage.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.data = { ...DEFAULT_CONTACT_PAGE, ...action.payload };
        }
      })
      .addCase(fetchContactPage.rejected, (state) => {
        state.loading = false;
      })
      // Submit Form
      .addCase(submitContactForm.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.submitSuccess = false;
      })
      .addCase(submitContactForm.fulfilled, (state) => {
        state.submitting = false;
        state.submitSuccess = true;
        state.error = null;
      })
      .addCase(submitContactForm.rejected, (state, action) => {
        state.submitting = false;
        state.submitSuccess = false;
        state.error = action.payload || 'Failed to send message. Please try again.';
      });
  },
});

export const { resetContactFormState } = contactSlice.actions;
export default contactSlice.reducer;
