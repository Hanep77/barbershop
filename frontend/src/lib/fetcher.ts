"use client";

import { clearSession } from "./utils";
import { authServices } from "@/services/auth";
import { toast } from "sonner";
import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;

const Fetcher = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000,
});

// Initialize CSRF cookie
Fetcher.interceptors.request.use(async (config) => {
  const { url } = authServices.getCookie();
  try {
    await axios.get(`${url}`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error("Failed to fetch CSRF cookie:", error);
  }
  return config;
});

Fetcher.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      toast.error("Unauthorized");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default Fetcher;
