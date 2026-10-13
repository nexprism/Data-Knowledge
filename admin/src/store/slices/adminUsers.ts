import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

export interface ManagedAdmin {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUsersState {
  admins: ManagedAdmin[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  currentUserId: string | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

interface FetchAdminsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive";
}

interface CreatedAdminResult {
  admin: ManagedAdmin;
  temporaryPassword: string;
  generatedPassword: boolean;
}

const initialState: AdminUsersState = {
  admins: [],
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  currentUserId: null,
  loading: false,
  saving: false,
  error: null,
};

export const fetchAdmins = createAsyncThunk(
  "adminUsers/fetchAdmins",
  async (params: FetchAdminsParams = {}, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/admin-users", { params });
      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createAdmin = createAsyncThunk<
  CreatedAdminResult,
  { fullName: string; email: string; password?: string }
>("adminUsers/createAdmin", async (payload, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post("/admin-users", payload);
    return res.data?.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const updateAdmin = createAsyncThunk<
  ManagedAdmin,
  { id: string; fullName?: string; email?: string }
>("adminUsers/updateAdmin", async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.put(`/admin-users/${id}`, payload);
    return res.data?.data?.admin;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const setAdminStatus = createAsyncThunk<
  ManagedAdmin,
  { id: string; isActive: boolean }
>("adminUsers/setAdminStatus", async ({ id, isActive }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.put(`/admin-users/${id}/status`, { isActive });
    return res.data?.data?.admin;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const resetAdminPassword = createAsyncThunk<
  { temporaryPassword: string; generatedPassword: boolean },
  { id: string; password?: string }
>("adminUsers/resetAdminPassword", async ({ id, password }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(`/admin-users/${id}/reset-password`, { password });
    return res.data?.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deleteAdmin = createAsyncThunk<string, string>(
  "adminUsers/deleteAdmin",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/admin-users/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const adminUsersSlice = createSlice({
  name: "adminUsers",
  initialState,
  reducers: {
    clearAdminUsersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdmins.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdmins.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload || {};
        state.admins = data.admins || [];
        state.page = data.page ?? 1;
        state.limit = data.limit ?? state.limit;
        state.total = data.total ?? state.admins.length;
        state.totalPages = data.totalPages ?? 1;
        state.currentUserId = data.currentUserId ?? state.currentUserId;
      })
      .addCase(fetchAdmins.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createAdmin.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createAdmin.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createAdmin.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })

      .addCase(updateAdmin.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload;
        if (updated) {
          state.admins = state.admins.map((a) => (a._id === updated._id ? { ...a, ...updated } : a));
        }
      })
      .addCase(updateAdmin.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })

      .addCase(setAdminStatus.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload;
        if (updated) {
          state.admins = state.admins.map((a) => (a._id === updated._id ? { ...a, ...updated } : a));
        }
      })
      .addCase(setAdminStatus.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })

      .addCase(deleteAdmin.fulfilled, (state, action) => {
        state.admins = state.admins.filter((a) => a._id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteAdmin.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearAdminUsersError } = adminUsersSlice.actions;

export const selectAdminUsers = (state: { adminUsers: AdminUsersState }) => state.adminUsers.admins;
export const selectAdminUsersLoading = (state: { adminUsers: AdminUsersState }) => state.adminUsers.loading;
export const selectAdminUsersSaving = (state: { adminUsers: AdminUsersState }) => state.adminUsers.saving;
export const selectAdminUsersError = (state: { adminUsers: AdminUsersState }) => state.adminUsers.error;
export const selectAdminUsersMeta = (state: { adminUsers: AdminUsersState }) => state.adminUsers;

export default adminUsersSlice.reducer;
