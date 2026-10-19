import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

export interface ConsultationSlot {
  _id: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  isActive: boolean;
  isBooked: boolean;
}

export interface ConsultationBooking {
  _id: string;
  userId: { _id: string; fullName: string; email: string; phone?: string };
  slotId: ConsultationSlot;
  fullName: string;
  designation: string;
  department: string;
  institute: string;
  query: string;
  fileUpload: string | null;
  paymentProvider: string;
  paymentStatus: string;
  paymentId: string | null;
  orderId: string | null;
  createdAt: string;
}

interface ConsultationState {
  slots: ConsultationSlot[];
  bookings: ConsultationBooking[];
  loading: boolean;
  error: string | null;
}

const initialState: ConsultationState = {
  slots: [],
  bookings: [],
  loading: false,
  error: null,
};

export const fetchAdminSlots = createAsyncThunk(
  "consultation/fetchAdminSlots",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/consultations/admin/slots");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch slots");
    }
  }
);

export const createSlots = createAsyncThunk(
  "consultation/createSlots",
  async (slots: Partial<ConsultationSlot>[], { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/consultations/slots", { slots });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to create slots");
    }
  }
);

export const deleteSlot = createAsyncThunk(
  "consultation/deleteSlot",
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/consultations/slots/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete slot");
    }
  }
);

export const updateSlot = createAsyncThunk(
  "consultation/updateSlot",
  async ({ id, data }: { id: string; data: Partial<ConsultationSlot> }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/consultations/slots/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update slot");
    }
  }
);

export const fetchAdminBookings = createAsyncThunk(
  "consultation/fetchAdminBookings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/consultations/bookings");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch bookings");
    }
  }
);

const consultationSlice = createSlice({
  name: "consultation",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Slots
      .addCase(fetchAdminSlots.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminSlots.fulfilled, (state, action) => {
        state.loading = false;
        state.slots = action.payload;
      })
      .addCase(fetchAdminSlots.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Slots
      .addCase(createSlots.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSlots.fulfilled, (state, action) => {
        state.loading = false;
        state.slots.push(...action.payload);
      })
      .addCase(createSlots.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Slot
      .addCase(deleteSlot.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSlot.fulfilled, (state, action) => {
        state.loading = false;
        state.slots = state.slots.filter((slot) => slot._id !== action.payload);
      })
      .addCase(deleteSlot.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Slot
      .addCase(updateSlot.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSlot.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.slots.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) {
          state.slots[index] = action.payload;
        }
      })
      .addCase(updateSlot.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Bookings
      .addCase(fetchAdminBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchAdminBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = consultationSlice.actions;
export default consultationSlice.reducer;
