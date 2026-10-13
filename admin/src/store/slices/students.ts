import axios from "axios";
// Remove duplicate import of createAsyncThunk

export interface BulkEnrollResponse {
  success: boolean;
  message?: string;
  students?: Student[];
}

export const bulkEnrollStudents = createAsyncThunk<
  BulkEnrollResponse,
  FormData,
  { rejectValue: string }
>("students/bulkEnrollStudents", async (formData, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post("/bulk-import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data as BulkEnrollResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(
        error.response?.data?.message || "Bulk upload failed"
      );
    }
    return rejectWithValue("Bulk upload failed");
  }
});
// studentSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

// types.ts
export interface Student {
  isShadowBanned: string;
  isBanned: string;
  _id: string;
  name: string;
  fullName: string;
  email: string;
  status: string;
  isActive: boolean;
  profilePicture?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface FetchStudentsParams {
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
  searchFields?: Record<string, string>;
  sort?: Record<string, "asc" | "desc">;
}

interface StudentState {
  students: Student[];
  studentDetails: Student | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filters: Record<string, any>;
  analytics?: any;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "https://api.dataknowledge.in").replace(/\/+$/, '');

export const fetchAllStudents = createAsyncThunk<
  { students: Student[]; pagination: StudentState["pagination"] },
  FetchStudentsParams
>("students/fetchAll", async (params = {}, { rejectWithValue }) => {
  try {
    const {
      page = 1,
      limit = 10,
      filters = {},
      searchFields,
      sort = { createdAt: "desc" },
    } = params;

    const queryParams = new URLSearchParams();

    queryParams.append("page", String(page));
    queryParams.append("limit", String(limit));

    if (Object.keys(filters).length) {
      queryParams.append("filters", JSON.stringify(filters));
    }

    if (
      searchFields &&
      typeof searchFields.search === "string" &&
      searchFields.search.trim()
    ) {
      queryParams.append("search", searchFields.search.trim());
    }

    if (Object.keys(sort).length) {
      queryParams.append("sort", JSON.stringify(sort));
    }

    const response = await axiosInstance.get(
      `${API_BASE_URL}/students?${queryParams.toString()}`
    );

    const data = response.data?.data;

    return {
      students: data?.students || [],
      pagination: {
        total: data?.pagination?.total || 0,
        page: data?.pagination?.page || 1,
        limit: data?.pagination?.limit || 10,
        totalPages: data?.pagination?.totalPages || 1,
      },
    };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export interface BanStudentPayload {
  userId: string;
  banType: "shadowBan" | "ban";
  banReason: string;
}

export const banStudent = createAsyncThunk<
  { userId: string; banType: string; banReason: string },
  BanStudentPayload
>("students/banStudent", async (payload, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put(
      `${API_BASE_URL}/ban-shadow-ban`,
      payload
    );
    return response.data?.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const unbanStudent = createAsyncThunk<
  { userId: string },
  BanStudentPayload
>("students/unbanStudent", async (payload, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put(
      `${API_BASE_URL}/unban-user`,
      payload
    );
    return response.data?.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchStudentById = createAsyncThunk<Student, string>(
  "students/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `${API_BASE_URL}/students/${id}`
      );
      const student = response.data?.data?.student;
      return student;
    } catch (error: any) {
      console.error("Error fetching student:", error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteStudent = createAsyncThunk<string, string>(
  "students/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`${API_BASE_URL}/students/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export interface DisableDripPayload {
  courseId: string;
  userId: string;
}

export interface DisableDripForModulePayload {
  moduleId: string;
  userId: string;
}

export const disableDripForModule = createAsyncThunk<
  { moduleId: string; userId: string },
  DisableDripForModulePayload
>(
  "students/disableDripForModule",
  async ({ moduleId, userId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `${API_BASE_URL}/module/${moduleId}/disable-drip`,
        { userId }
      );
      return response.data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchStudentAnalytics = createAsyncThunk<any, string>(
  "students/fetchAnalytics",
  async (studentId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `${API_BASE_URL}/students/${studentId}/analytics`
      );
      return response.data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const disableDripForUser = createAsyncThunk<
  { courseId: string; userId: string },
  DisableDripPayload
>(
  "students/disableDripForUser",
  async ({ courseId, userId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `${API_BASE_URL}/courses/${courseId}/disable-drip`,
        { userId }
      );
      return response.data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export interface CreateStudentPayload {
  fullName: string;
  email: string;
  password: string;
  [key: string]: any;
}

export const createStudent = createAsyncThunk<Student, CreateStudentPayload>(
  "students/create",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `${API_BASE_URL}/create-user`,
        payload
      );
      return response.data?.data?.student;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const enrollStudent = createAsyncThunk<
  any,
  {
    userId: string;
    courseId: string;
    accessExpiry?: string;
    customPrice?: number;
    addToRevenue?: boolean;
  },
  { rejectValue: string }
>("students/enrollStudent", async (payload, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token") || "";
    const response = await axiosInstance.post(
      "/enrollment/admin-enroll",
      {
        userId: payload.userId,
        courseId: payload.courseId,
        accessExpiry: payload.accessExpiry,
        customPrice: payload.customPrice,
        addToRevenue: payload.addToRevenue,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || "Failed to enroll student"
    );
  }
})
  ;

export const deleteEnrollment = createAsyncThunk<
  string,
  { enrollmentId: string },
  { rejectValue: string }
>(
  "students/deleteEnrollment",
  async ({ enrollmentId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || "";
      await axiosInstance.delete(
        `/enrollment/${enrollmentId}/remove`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return enrollmentId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to delete enrollment"
      );
    }
  }
);

export const updateAccessExpiry = createAsyncThunk<
  any,
  { enrollmentId: string; accessExpiry: string | null },
  { rejectValue: string }
>("students/updateAccessExpiry", async ({ enrollmentId, accessExpiry }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token") || "";
    const response = await axiosInstance.put(
      `/enrollment/${enrollmentId}/access-expiry`,
      { accessExpiry },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || "Failed to update access expiry"
    );
  }
});

export const logoutAllSessions = createAsyncThunk<
  { userId: string },
  { userId: string },
  { rejectValue: string }
>("students/logoutAllSessions", async ({ userId }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token") || "";
    const response = await axiosInstance.post(
      `/logout-all-sessions`,
      { userId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data?.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState: StudentState = {
  students: [],
  studentDetails: null,
  loading: false,
  error: null,
  searchQuery: "",
  filters: {},
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
};

const studentSlice = createSlice({
  name: "students",
  initialState,
  reducers: {
    clearStudentDetails: (state) => {
      state.studentDetails = null;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.pagination.page = 1; // Reset to first page when searching
    },
    setFilters: (state, action) => {
      state.filters = action.payload;
      state.pagination.page = 1; // Reset to first page when filtering
    },
    resetFilters: (state) => {
      state.searchQuery = "";
      state.filters = {};
      state.pagination.page = 1;
    },
    setCurrentPage: (state, action) => {
      state.pagination.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAllStudents
      .addCase(fetchAllStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload.students;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // fetchStudentById
      .addCase(fetchStudentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentById.fulfilled, (state, action) => {
        state.loading = false;
        state.studentDetails = action.payload;
      })
      .addCase(fetchStudentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // deleteStudent
      .addCase(deleteStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.students = state.students.filter(
          (student) => student._id !== action.payload
        );
      })
      .addCase(deleteStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.students.push(action.payload);
      })
      .addCase(createStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(enrollStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(enrollStudent.fulfilled, (state, action) => {
        state.loading = false;

        // Assuming the response contains the updated student data
        const updatedStudent = action.payload.student;
      })
      .addCase(enrollStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(bulkEnrollStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkEnrollStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Optionally update students list if response contains new students
      })
      .addCase(bulkEnrollStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(disableDripForUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(disableDripForUser.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(disableDripForUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(banStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(banStudent.fulfilled, (state, action) => {
        state.loading = false;
        // Update student in list if present
        state.students = state.students.map((student) =>
          student._id === action.payload.userId
            ? {
              ...student,
              status: action.payload.banType,
              banReason: action.payload.banReason,
              isActive: false,
            }
            : student
        );
        // Update details if present
        if (
          state.studentDetails &&
          state.studentDetails._id === action.payload.userId
        ) {
          state.studentDetails = {
            ...state.studentDetails,
            status: action.payload.banType,
            banReason: action.payload.banReason,
            isActive: false,
          };
        }
      })
      .addCase(banStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(unbanStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unbanStudent.fulfilled, (state, action) => {
        state.loading = false;
        // Update student in list if present
        state.students = state.students.map((student) =>
          student._id === action.payload.userId
            ? {
              ...student,
              status: "active",
              banReason: undefined,
              isActive: true,
            }
            : student
        );
        // Update details if present
        if (
          state.studentDetails &&
          state.studentDetails._id === action.payload.userId
        ) {
          state.studentDetails = {
            ...state.studentDetails,
            status: "active",
            banReason: undefined,
            isActive: true,
          };
        }
      })
      .addCase(unbanStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(disableDripForModule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(disableDripForModule.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally update state if needed
      })
      .addCase(disableDripForModule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchStudentAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchStudentAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteEnrollment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEnrollment.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally update student enrollments if tracked in state
      })
      .addCase(deleteEnrollment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutAllSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutAllSessions.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally update student status if needed
      })
      .addCase(logoutAllSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

  },
});

export const {
  clearStudentDetails,
  setSearchQuery,
  setFilters,
  resetFilters,
  setCurrentPage,
} = studentSlice.actions;

export default studentSlice.reducer;

// Selector to get all students
export const getAllStudents = (state: { students: StudentState }) =>
  state.students;
