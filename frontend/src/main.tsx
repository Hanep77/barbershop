// "use client"

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router";
import Home from "./Pages/Home/Page";
import DefaultLayout from "./Layouts/DefaultLayout";
import ProtectedLayout from "./Layouts/ProtectedLayout";
import PartnerDashboard from "./Pages/partner/Dashboard/Page";
import LoginPage from "./Pages/Login/Page";
import RegisterPage from "./Pages/Register/Page";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import PartnerRegister from "./Pages/partner/Register/Page";
import { LoadingBarContainer } from "react-top-loading-bar";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LoadingBarContainer>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<DefaultLayout />}>
              <Route path="/" element={<Home />} />
            </Route>
            <Route element={<DefaultLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<PartnerDashboard />} />
              <Route path="/partner-register" element={<PartnerRegister />} />
            </Route>
            {/* </Route> */}
            {/* <Route element={<GuestLayout />}> */}
            {/*   <Route path="/login" element={<Login />} /> */}
          </Routes>
          <Toaster richColors position="top-center" />
        </BrowserRouter>
      </AuthProvider>
    </LoadingBarContainer>
  </StrictMode>,
);
