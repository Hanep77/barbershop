import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import useAuthStore from "../store/authStore";
import { tokenStore } from "./tokens";

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

let refreshRequest: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refresh = tokenStore.refresh();
  if (!refresh) return null;

  if (!refreshRequest) {
    refreshRequest = axios
      .post(
        `${api.defaults.baseURL ?? ""}/api/auth/refresh`,
        { refresh_token: refresh },
        { headers: { Accept: "application/json" } },
      )
      .then((response) => {
        const { access_token, refresh_token } = response.data ?? {};
        if (!access_token || !refresh_token) return null;
        tokenStore.set(access_token, refresh_token);
        return access_token as string;
      })
      .catch(() => null)
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";

    if (
      status === 401 &&
      original &&
      !original._retried &&
      !url.includes("/api/auth/refresh") &&
      !url.includes("/api/login") &&
      !url.includes("/api/register")
    ) {
      const token = await refreshAccessToken();

      if (token) {
        original._retried = true;
        original.headers.set("Authorization", `Bearer ${token}`);
        return api.request(original);
      }

      tokenStore.clear();
      useAuthStore.getState().setUser(null);
    }

    return Promise.reject(error);
  },
);

export default api;
