// "use client"

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router";
import Home from "./Pages/Home/Page";
import DefaultLayout from "./Layouts/DefaultLayout";
import ProtectedLayout from "./Layouts/ProtectedLayout";
import { AdminDashboard } from "./Pages/admin/Dashboard";
import LoginPage from "./Pages/Login/Page";
import RegisterPage from "./Pages/Register/Page";
import AuthLayout from "./Layouts/AuthLayout";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<DefaultLayout />}>
          <Route path="/" element={<Home />} />
        </Route>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<AdminDashboard />} />
        </Route>
          {/* </Route> */}
          {/* <Route element={<GuestLayout />}> */}
          {/*   <Route path="/login" element={<Login />} /> */}
      </Routes>
      <Toaster richColors position="top-center" />
    </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
