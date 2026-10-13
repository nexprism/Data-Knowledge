export type UserRole =
  | "admin"
  | "super_admin"
  | "instructor"
  | "student"
  | "news_editor"
  | string;

export interface User {
  id?: string;
  _id?: string;
  email: string;
  role: UserRole;
  roles?: string[];
  name?: string;
  fullName?: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  loginStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  signupStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  logoutStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  profileUpdateStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  passwordResetStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  [key: string]: any;
}

export interface PasswordResetData {
  token: string;
  password: string;
}