import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBaseUrl } from '../../utils/apiConfig';

const BASE_URL = getApiBaseUrl();

// Helper: simple concurrency limiter
const runWithConcurrency = async (items, worker, concurrency = 5) => {
  const results = [];
  let i = 0;
  const runners = new Array(concurrency).fill(0).map(async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        const res = await worker(items[idx], idx);
        results[idx] = { status: 'fulfilled', value: res };
      } catch (err) {
        results[idx] = { status: 'rejected', reason: err };
      }
    }
  });
  await Promise.all(runners);
  return results;
};

// Thunk: fetch unlock status + progress for an array of lessons
export const fetchLessonsStatus = createAsyncThunk(
  'drip/fetchLessonsStatus',
  async ({ userId, lessons }, thunkAPI) => {
    if (!Array.isArray(lessons) || lessons.length === 0) return {};
    const state = thunkAPI.getState();
    const token = state?.auth?.token || null;

    const worker = async (lesson) => {
      const targetId = lesson._id || lesson.id || lesson;
      const targetType = 'lesson';

      // POST check-unlock-conditions (include auth if available)
      const postHeaders = { 'Content-Type': 'application/json' };
      if (token) postHeaders['Authorization'] = `Bearer ${token}`;
      let checkResp = {};
      try {
        checkResp = await fetch(`${BASE_URL}/drip/check-unlock-conditions`, {
          method: 'POST',
          headers: postHeaders,
          body: JSON.stringify({ userId, targetId, targetType }),
        }).then((r) => r.json());
      } catch (e) {
        checkResp = {};
      }

      // GET progress
      const progressUrl = `${BASE_URL}/courses/${lesson.courseId || lesson.course || ''}/lessons/${targetId}/progress`;
      let progressResp = null;
      try {
        const getHeaders = {};
        if (token) getHeaders['Authorization'] = `Bearer ${token}`;
        const p = await fetch(progressUrl, { method: 'GET', headers: getHeaders });
        if (p.ok) progressResp = await p.json();
      } catch (e) {
        progressResp = null;
      }

      // Progress endpoint may return different shapes. Normalize common patterns:
      // - { progress: 10 }
      // - { percentage: 10 }
      // - { success: true, data: { progressPercentage: 9.35, watchTime, sessionId, ... } }
      let progress = 0;
      if (progressResp) {
        if (typeof progressResp.progress === 'number') progress = progressResp.progress;
        else if (typeof progressResp.percentage === 'number') progress = progressResp.percentage;
        else if (progressResp.success && progressResp.data && typeof progressResp.data.progressPercentage === 'number') {
          progress = progressResp.data.progressPercentage;
        } else if (typeof progressResp.progressPercentage === 'number') {
          progress = progressResp.progressPercentage;
        }
      }
      // API may return `canUnlock`, `unlocked` or `allowed`.
      const unlocked = (checkResp?.canUnlock === true) || (checkResp?.unlocked === true) || (checkResp?.allowed === true) || false;

      // Debug log to help trace mismatches between lesson IDs and responses
      try {
        // eslint-disable-next-line no-console
        console.debug('[drip] lesson', targetId, { progress, unlocked, rawCheck: checkResp, rawProgress: progressResp });
      } catch (e) {}

      // Return normalized status
      return { lessonId: targetId, progress, unlocked, rawCheck: checkResp, rawProgress: progressResp };
    };

    // Run with limited concurrency to avoid freezing the UI
    const results = await runWithConcurrency(lessons, worker, 6);

    // Normalize into map
    const map = {};
    results.forEach((r) => {
      if (r && r.status === 'fulfilled' && r.value) {
        map[r.value.lessonId] = { progress: r.value.progress, unlocked: r.value.unlocked };
      }
    });

    return map;
  }
);

const dripSlice = createSlice({
  name: 'drip',
  initialState: {
    statuses: {},
    loading: false,
    error: null,
  },
  reducers: {
    setLessonStatus(state, action) {
      const { lessonId, status } = action.payload;
      state.statuses[lessonId] = { ...(state.statuses[lessonId] || {}), ...status };
    },
    clearDrip(state) {
      state.statuses = {};
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLessonsStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLessonsStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.statuses = { ...(state.statuses || {}), ...(action.payload || {}) };
      })
      .addCase(fetchLessonsStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || 'Failed to fetch drip statuses';
      });
  },
});

export const { setLessonStatus, clearDrip } = dripSlice.actions;
export default dripSlice.reducer;
