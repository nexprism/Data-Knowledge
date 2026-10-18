import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBaseUrl } from '../../utils/apiConfig.js';

const BASE_URL = getApiBaseUrl();

// ── Helper: persist auth data ────────────────────────────────────────────────
const persistAuth = (response) => {
  const data = response?.data || response;
  if (data) {
    const token = data.accessToken || data.token || '';
    const user = data.user || null;
    if (token) localStorage.setItem('edrilla_token', token);
    if (user) localStorage.setItem('edrilla_user', JSON.stringify(user));
  }
};

const loadFromStorage = () => {
  try {
    return {
      token: localStorage.getItem('edrilla_token') || null,
      user: JSON.parse(localStorage.getItem('edrilla_user')) || null,
    };
  } catch {
    return { token: null, user: null };
  }
};

// ── Thunks ───────────────────────────────────────────────────────────────────
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, platform: "web" }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.message || 'Login failed');
      persistAuth(data);
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const googleLoginUser = createAsyncThunk(
  'auth/googleLoginUser',
  async ({ googleAccessToken, deviceId, platform }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleAccessToken,
          deviceId: deviceId || 'browser',
          platform: platform || 'web'
        }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.message || 'Google login failed');
      persistAuth(data);
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async ({ email }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/sendotp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) return rejectWithValue(data?.message || 'Send OTP failed')
      return data
    } catch (err) {
      return rejectWithValue(err.message || 'Network error')
    }
  }
)

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/verifyotp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok) return rejectWithValue(data?.message || 'Verify OTP failed')
      return data
    } catch (err) {
      return rejectWithValue(err.message || 'Network error')
    }
  }
)

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async ({ email }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) return rejectWithValue(data?.message || 'Unable to send reset link')
      return data
    } catch (err) {
      return rejectWithValue(err.message || 'Network error')
    }
  }
)

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, newPassword, confirmPassword }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      })
      const data = await res.json()
      if (!res.ok) return rejectWithValue(data?.message || 'Unable to reset password')
      return data
    } catch (err) {
      return rejectWithValue(err.message || 'Network error')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, email, password, fullName, role, is_verify, phone }, { rejectWithValue }) => {
    try {
      // API expects signup payload (some endpoints use /signup)
      const payload = { name, email, password }
      if (fullName) payload.fullName = fullName
      if (role) payload.role = role
      if (phone) payload.phone = phone
      // include OTP verified flag if provided
      if (typeof is_verify !== 'undefined') payload.is_verify = !!is_verify
      const res = await fetch(`${BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) return rejectWithValue(data?.message || 'Registration failed')
      persistAuth(data)
      return data
    } catch (err) {
      return rejectWithValue(err.message || 'Network error')
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    ...loadFromStorage(),
    loading: false,
    error: null,
    otpVerified: false,
    otpEmail: null,
  },
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      state.otpVerified = false;
      state.otpEmail = null;
      localStorage.removeItem('edrilla_token');
      localStorage.removeItem('edrilla_user');
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Shared pending/rejected handler for both thunks
    const pending = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, { payload }) => { state.loading = false; state.error = payload; };
    const fulfilled = (state, { payload }) => {
      state.loading = false;
      const data = payload?.data || payload;
      state.token = data?.accessToken || data?.token || null;
      state.user = data?.user || null;
    };

    builder
      .addCase(loginUser.pending, pending)
      .addCase(loginUser.fulfilled, fulfilled)
      .addCase(loginUser.rejected, rejected)
      .addCase(registerUser.pending, pending)
      .addCase(registerUser.fulfilled, fulfilled)
      .addCase(registerUser.rejected, rejected)
      .addCase(googleLoginUser.pending, pending)
      .addCase(googleLoginUser.fulfilled, fulfilled)
      .addCase(googleLoginUser.rejected, rejected)
      .addCase(sendOtp.pending, pending)
      .addCase(sendOtp.fulfilled, (state, { meta }) => {
        state.loading = false
        state.error = null
        state.otpEmail = meta?.arg?.email || state.otpEmail
      })
      .addCase(sendOtp.rejected, rejected)
      .addCase(requestPasswordReset.pending, pending)
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(requestPasswordReset.rejected, rejected)
      .addCase(resetPassword.pending, pending)
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(resetPassword.rejected, rejected)
      .addCase(verifyOtp.pending, pending)
      .addCase(verifyOtp.fulfilled, (state, { meta }) => {
        state.loading = false
        state.error = null
        state.otpVerified = true
        state.otpEmail = meta?.arg?.email || state.otpEmail
      })
      .addCase(verifyOtp.rejected, rejected)
      // Sync with profile updates and buyNow
      .addMatcher(
        (action) =>
          action.type.endsWith('/fetchUserProfile/fulfilled') ||
          action.type.endsWith('/updateUserProfile/fulfilled') ||
          action.type === 'enrollment/buyNow/fulfilled',
        (state, { payload }) => {
          const data = payload?.data || payload;
          const newUser = data?.user || data?.guestUser || data;
          const newToken = data?.accessToken || data?.token;

          if (newUser && typeof newUser === 'object') {
            state.user = newUser;
            localStorage.setItem('edrilla_user', JSON.stringify(newUser));
          }
          if (newToken) {
            state.token = newToken;
            localStorage.setItem('edrilla_token', newToken);
          }
        }
      );
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
