"use client"

import { clearSession } from "./utils";
import { toast } from "sonner";
import axios from "axios";

const Fetcher = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

Fetcher.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      toast.error("Unauthorized");
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);



export default Fetcher

