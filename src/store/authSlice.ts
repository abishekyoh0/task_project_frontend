import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const savedUser = localStorage.getItem('user');
const initialUser: User | null = savedUser ? JSON.parse(savedUser) : null;

const initialState: AuthState = {
  user: initialUser,
  isAuthenticated: !!initialUser,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    authSuccess: (state, action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      if (action.payload.user.organizationId) {
        localStorage.setItem('tenantId', action.payload.user.organizationId);
      }
    },
    authFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateProfileSuccess: (state, action: PayloadAction<{ firstName: string; lastName: string }>) => {
      if (state.user) {
        state.user.firstName = action.payload.firstName;
        state.user.lastName = action.payload.lastName;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    updateOrganizationSuccess: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.organizationId = action.payload;
        state.user.role = 'ORG_ADMIN'; // Promoted to admin on creating org
        localStorage.setItem('user', JSON.stringify(state.user));
        localStorage.setItem('tenantId', action.payload);
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
    },
  },
});

export const { authStart, authSuccess, authFailure, updateProfileSuccess, updateOrganizationSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
