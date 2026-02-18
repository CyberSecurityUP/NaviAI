'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { apiClient, ApiError } from '@/lib/api-client';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const tokens = await apiClient.login(email, password);
          set({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
          await get().loadUser();
        } catch (err) {
          const message =
            err instanceof ApiError && err.status === 401
              ? 'errorInvalidCredentials'
              : 'errorInvalidCredentials';
          set({ isLoading: false, error: message, isAuthenticated: false });
          throw err;
        }
      },

      register: async (email: string, password: string, displayName: string) => {
        set({ isLoading: true, error: null });
        try {
          const tokens = await apiClient.register(email, password, displayName);
          set({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
          await get().loadUser();
        } catch (err) {
          set({ isLoading: false, error: 'Registration failed', isAuthenticated: false });
          throw err;
        }
      },

      logout: () => {
        apiClient.clearTokens();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      loadUser: async () => {
        try {
          const user = await apiClient.getMe();
          set({ user });
        } catch {
          // If we can't load user, clear auth state
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'navi-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
