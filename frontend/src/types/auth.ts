import type { Barbershop } from "./barbershop";

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  role: "customer" | "barbershop";
  barbershop?: Barbershop | null;
}

export interface AuthState {
  // --- State ---
  user: User | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  // --- Actions ---
  init: () => Promise<void>;
  setUser: (user: User | null) => void;
  register: (
    name: string,
    email: string,
    role: string,
    password: string,
    password_confirmation: string,
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export interface RegisterForm {
  name: string;
  email: string;
  role: string;
  password: string;
  password_confirmation: string;
}

export interface RegisterErrors {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
  password_confirmation?: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface LoginErrors {
  email?: string;
  password?: string;
}
