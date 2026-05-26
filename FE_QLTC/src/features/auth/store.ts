import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { AuthActions, AuthState } from "./types";

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set) => ({
        accessToken: null,
        user: null,
        role: null,
        setAuth: ({ accessToken, role, user }) =>
          set({ accessToken, role, user }),
        clearAuth: () => set({ accessToken: null, role: null, user: null }),
      }),
      {
        name: "auth-storage",
      },
    ),
  ),
);
