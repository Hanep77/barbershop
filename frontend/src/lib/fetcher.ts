"use client"

// import { clearSession } from "./utils";
import axios from "axios";


const Fetcher = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    "token" : localStorage.getItem('auth_token') || "",
  },
  timeout: 10000,
});


export default Fetcher

