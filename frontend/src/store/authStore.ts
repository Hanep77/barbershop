import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User } from "../types/auth";
import {
  getUser,
  login as loginSvc,
  logout as logoutSvc,
  register as registerSvc,
} from "../services/auth";

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ╔══════════════════════════════╗
      // ║        INITIAL STATE         ║
      // ╚══════════════════════════════╝
      user: null,
      loading: false,
      initialized: false,
      error: null,

      // ╔══════════════════════════════╗
      // ║           ACTIONS            ║
      // ╚══════════════════════════════╝

      init: async (): Promise<void> => {
        // Cegah init dipanggil lebih dari sekali
        if (get().initialized) return;

        set({ loading: true });
        try {
          const res = await getUser();
          set({ user: res.data as User, initialized: true });
        } catch {
          set({ user: null, initialized: true });
        } finally {
          set({ loading: false });
        }
      },

      setUser: (user) => set({ user }),

      register: async (
        name: string,
        email: string,
        role: string,
        password: string,
        password_confirmation: string,
      ): Promise<void> => {
        set({ loading: true, error: null });
        try {
          const res = await registerSvc(
            name,
            email,
            role,
            password,
            password_confirmation,
          );
          set({ user: res.data.user as User });
        } catch (err: unknown) {
          const message =
            err instanceof Error
              ? ((err as any).response?.data?.message ?? err.message)
              : "Registration failed";
          set({ error: message });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      login: async (email: string, password: string): Promise<void | User> => {
        set({ loading: true, error: null });
        try {
          const res = await loginSvc(email, password);
          set({ user: res.data.user as User });
          return res.data.user;
        } catch (err: unknown) {
          const message =
            err instanceof Error
              ? ((err as any).response?.data?.errors?.email?.[0] ??
                "Login failed")
              : "Login failed";
          set({ error: message });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      logout: async (): Promise<void> => {
        set({ loading: true });
        try {
          await logoutSvc();
        } finally {
          set({ user: null, loading: false });
        }
      },

      clearError: (): void => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state): Pick<AuthState, "user"> => ({
        user: state.user,
      }),
    },
  ),
);

export default useAuthStore;
