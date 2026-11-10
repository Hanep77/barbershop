import api from "../lib/axios";
import { tokenStore } from "../lib/tokens";
import type { User } from "../types/auth";

export interface TokenPairResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Kept for backwards compatibility with existing call sites.
 * JWT authentication no longer needs a CSRF cookie.
 * @deprecated
 */
export const getCsrf = async () => {};

export const register = async (
  name: string,
  email: string,
  role: string,
  password: string,
  password_confirmation: string,
) => {
  const response = await api.post<TokenPairResponse>("/api/register", {
    name,
    email,
    // The backend always creates customers. Barbershop role is granted when
    // the owner creates a barbershop.
    role,
    password,
    password_confirmation,
  });
  tokenStore.set(response.data.access_token, response.data.refresh_token);
  return response;
};

export const login = async (email: string, password: string) => {
  const response = await api.post<TokenPairResponse>("/api/login", { email, password });
  tokenStore.set(response.data.access_token, response.data.refresh_token);
  return response;
};

export const logout = async () => {
  const refresh_token = tokenStore.refresh();
  try {
    await api.post("/api/logout", { refresh_token });
  } finally {
    tokenStore.clear();
  }
};

export const refresh = async (): Promise<TokenPairResponse> => {
  const refresh_token = tokenStore.refresh();
  const response = await api.post<TokenPairResponse>("/api/auth/refresh", { refresh_token });
  tokenStore.set(response.data.access_token, response.data.refresh_token);
  return response;
};

export const getUser = () => api.get<User>("/api/me");

export const getGoogleRedirectUrl = async () => {
  const { data } = await api.get<{ url: string }>("/auth/google/redirect");
  return data.url;
};
