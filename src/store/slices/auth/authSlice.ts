// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { apiForgotPassword, apiGetUser, apiLogin, apiResetPassword, apiSignUp } from '@/services/authService';
import { apiUpdateProfile } from '@/services/profileService';
import { encrypt } from '@/utils/enc-decy';

interface LoginResponse {
  status: number;
  message: string;
  data: any; // This can be further defined if you know the structure of the encrypted data
  decrypted_data: DecryptedData;
}
interface DecryptedData {
  id: string;
  isActive: boolean;
  first_name: string;
  last_name: string;
  email: string;
  updatedAt: string; // Consider using Date if you parse it
  createdAt: string; // Consider using Date if you parse it
  gender: string | null;
  profile: string | null;
  phone: string | null;
  apple_id: string | null;
  google_id: string | null;
  facebook_id: string | null;
  address: string | null;
  customer_id: string | null;
  dob: string | null;
  doa: string | null;
  country: string | null;
  zip_code: string | null;
  deletedAt: string | null;
  token: string;
  key: string;
}

// Define the shape of the auth state
export interface AuthStateData {
  user:
    | {
        id: string | null;
        first_name: string;
        last_name: string;
        email: string;
      }
    | any;
  token: string | null;
  loading: boolean;
  error: string | null;
  isMobile: boolean;
}
// const localData = localStorage.getItem("authToken");
interface AuthPayload {
  user: any; // Replace `any` with the actual user type if known
  token: string;
}

const initialState: AuthStateData = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isMobile: false,
};

// Async thunk for signing up a new user
export const signUpUser = createAsyncThunk('auth/signUpUser', async (userData: any, { rejectWithValue }) => {
  try {
    return userData;
  } catch (error: any) {
    return rejectWithValue(error.response.data);
  }
});

// Async thunk for logging in a user
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (credentials: { email: string; cloudflareTurnstileToken?: string | null }, { rejectWithValue }) => {
    try {
      const response = await apiForgotPassword(credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data); // Return error to handle in reducer
    }
  },
);
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (credentials: { password: string; authHeader: string; cloudflareTurnstileToken?: string | null }, { rejectWithValue }) => {
    try {
      const response = await apiResetPassword(credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data); // Return error to handle in reducer
    }
  },
);
export const getUpdateUser = createAsyncThunk('auth/getUpdateUser', async (_, { rejectWithValue }) => {
  try {
    const response = await apiGetUser();
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response.data); // Return error to handle in reducer
  }
});
// Async thunk for logging in a user
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string; cloudflareTurnstileToken?: string | null }, { rejectWithValue }) => {
    try {
      const response = await apiLogin(credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data); // Return error to handle in reducer
    }
  },
);

// Async thunk for logging out a user
export const logoutUser = createAsyncThunk('auth/logoutUser', () => {
  localStorage.removeItem('authToken');
  //   await apiLogout();
});

// async thunk for updating the profile
export const updateProfile = createAsyncThunk('auth/updateProfile', async (profileData: any, { rejectWithValue }) => {
  try {
    const response = await apiUpdateProfile(profileData);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response.data);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set user and token (used on login)
    setAuthState: (state, action: PayloadAction<AuthPayload>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      // state.error = null;
    },
    setIsMobile: (state, action: any) => {
      state.isMobile = action.payload;
    },
    // Clear auth state (used on logout)
    clearAuthState: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Handle sign-up
    builder
      .addCase(signUpUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(signUpUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.token = encrypt(action?.payload, true);
        state.user = action?.payload;
        localStorage.setItem('authToken', encrypt(action.payload, true));
      })
      .addCase(signUpUser.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload?.message || 'Sign-up failed';
      })
      // Handle login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.loading = false;
        state.token = action.payload.data?.token;
        state.user = action?.payload?.data;
        localStorage.setItem('authToken', encrypt(action.payload.data, true));
      })
      .addCase(loginUser.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
      })

      .addCase(getUpdateUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUpdateUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // state.token = action.payload.data?.token;
        state.user = action?.payload?.data;
        // localStorage.setItem('authToken', encrypt(action.payload.data, true));
      })
      .addCase(getUpdateUser.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
      })

      // Handle logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        localStorage.removeItem('authToken');
        state.loading = false;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPassword.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload?.message;
      })

      // Handle profile update
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload.data };
        localStorage.setItem('authToken', encrypt({ ...state.user, ...action.payload.data }, true));
      })
      .addCase(updateProfile.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload?.message || 'Profile update failed';
      });
  },
});

// Export actions to be used in components
export const { clearAuthState, setAuthState, setIsMobile } = authSlice.actions;

export default authSlice.reducer;
