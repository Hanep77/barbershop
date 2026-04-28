import axios, { type AxiosError, type AxiosInstance } from "axios";
import useAuthStore from "../store/authStore";

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().setUser(null);
    }
    return Promise.reject(error);
  },
);

export default api;
