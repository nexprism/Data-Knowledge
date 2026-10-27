import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

export interface RedisStatus {
  success: boolean;
  enabled: boolean;
  connected: boolean;
  mode: "external" | "memory" | "disabled" | "error";
  host?: string;
  port?: number;
  hasPassword?: boolean;
  latencyMs: number | null;
  keyCount: number;
  error: string | null;
  lastChecked: string | null;
  message?: string;
}

export interface RedisState {
  status: RedisStatus | null;
  loading: boolean;
  toggling: boolean;
  pinging: boolean;
  flushing: boolean;
  lastPingResult: {
    success: boolean;
    ping?: string;
    latencyMs?: number;
    message?: string;
  } | null;
  error: string | null;
}

const initialState: RedisState = {
  status: null,
  loading: false,
  toggling: false,
  pinging: false,
  flushing: false,
  lastPingResult: null,
  error: null,
};

// Fetch current Redis connection status
export const fetchRedisStatus = createAsyncThunk(
  "redis/fetchStatus",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/settings/redis/status");
      return response.data as RedisStatus;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch Redis status"
      );
    }
  }
);

// Toggle Redis connection ON or OFF
export const toggleRedisConnection = createAsyncThunk(
  "redis/toggleConnection",
  async (enabled: boolean, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/settings/redis/toggle", { enabled });
      return response.data as RedisStatus;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to toggle Redis connection"
      );
    }
  }
);

// Test Redis ping / latency
export const testRedisPing = createAsyncThunk(
  "redis/testPing",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/settings/redis/test");
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to test Redis ping"
      );
    }
  }
);

// Flush / clear Redis cache
export const flushRedisCache = createAsyncThunk(
  "redis/flushCache",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/settings/redis/flush");
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to flush Redis cache"
      );
    }
  }
);

const redisSlice = createSlice({
  name: "redis",
  initialState,
  reducers: {
    clearLastPingResult: (state) => {
      state.lastPingResult = null;
    },
    optimisticSetEnabled: (state, action) => {
      if (state.status) {
        state.status.enabled = action.payload;
        if (!action.payload) {
          state.status.connected = false;
          state.status.mode = "disabled";
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Status
    builder
      .addCase(fetchRedisStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRedisStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.status = action.payload;
      })
      .addCase(fetchRedisStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Toggle Connection
    builder
      .addCase(toggleRedisConnection.pending, (state) => {
        state.toggling = true;
        state.error = null;
      })
      .addCase(toggleRedisConnection.fulfilled, (state, action) => {
        state.toggling = false;
        state.status = action.payload;
      })
      .addCase(toggleRedisConnection.rejected, (state, action) => {
        state.toggling = false;
        state.error = action.payload as string;
      });

    // Test Ping
    builder
      .addCase(testRedisPing.pending, (state) => {
        state.pinging = true;
      })
      .addCase(testRedisPing.fulfilled, (state, action) => {
        state.pinging = false;
        state.lastPingResult = action.payload;
        if (state.status && action.payload.latencyMs !== undefined) {
          state.status.latencyMs = action.payload.latencyMs;
          state.status.connected = action.payload.connected;
        }
      })
      .addCase(testRedisPing.rejected, (state, action) => {
        state.pinging = false;
        state.lastPingResult = {
          success: false,
          message: action.payload as string,
        };
      });

    // Flush Cache
    builder
      .addCase(flushRedisCache.pending, (state) => {
        state.flushing = true;
      })
      .addCase(flushRedisCache.fulfilled, (state) => {
        state.flushing = false;
        if (state.status) {
          state.status.keyCount = 0;
        }
      })
      .addCase(flushRedisCache.rejected, (state, action) => {
        state.flushing = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearLastPingResult, optimisticSetEnabled } = redisSlice.actions;
export default redisSlice.reducer;
