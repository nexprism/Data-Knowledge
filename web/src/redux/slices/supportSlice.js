import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBaseUrl } from '../../utils/apiConfig';

const BASE_URL = getApiBaseUrl();
const LAPAAS_TICKET_URL = import.meta.env.VITE_LAPAAS_TICKET_URL || `${BASE_URL}/lapaas-ticket`;

export const createSupportTicket = createAsyncThunk(
  'support/createTicket',
  async (formData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token || localStorage.getItem('edrilla_token');
      
      const response = await fetch(`${BASE_URL}/support-tickets/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-access-token': token
        },
        body: formData
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create ticket');
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitLapaasTicket = createAsyncThunk(
  'support/submitLapaasTicket',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await fetch(LAPAAS_TICKET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to submit enquiry');
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMyTickets = createAsyncThunk(
  'support/fetchMyTickets',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token || localStorage.getItem('edrilla_token');
      
      const response = await fetch(`${BASE_URL}/support-tickets/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-access-token': token
        }
      });
      
      const data = await response.json();
      if (!response.ok) {
        // If endpoint error occurs, return empty list safely
        return { data: [] };
      }
      return data;
    } catch (error) {
      return { data: [] };
    }
  }
);

const supportSlice = createSlice({
  name: 'support',
  initialState: {
    tickets: [],
    loading: false,
    submitting: false,
    error: null,
    success: false
  },
  reducers: {
    resetSupportState: (state) => {
      state.success = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSupportTicket.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createSupportTicket.fulfilled, (state) => {
        state.submitting = false;
        state.success = true;
      })
      .addCase(createSupportTicket.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      .addCase(submitLapaasTicket.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.success = false;
      })
      .addCase(submitLapaasTicket.fulfilled, (state) => {
        state.submitting = false;
        state.success = true;
      })
      .addCase(submitLapaasTicket.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      .addCase(fetchMyTickets.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload?.data || [];
      })
      .addCase(fetchMyTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetSupportState } = supportSlice.actions;
export default supportSlice.reducer;
