import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/layout";
import { AdminLayout } from "./components/admin-layout";
import { Home } from "./pages/home";
import { Search } from "./pages/search";
import { BarbershopDetail } from "./pages/barbershop-detail";
import { Booking } from "./pages/booking";
import { MyBookings } from "./pages/my-bookings";
import { AIConsultant } from "./pages/ai-consultant";
import { Login } from "./pages/login";
import { Register } from "./pages/register";
import { NotFound } from "./pages/not-found";
import { AdminDashboard } from "./pages/admin/dashboard";
import { AdminProfile } from "./pages/admin/profile";
import { AdminServices } from "./pages/admin/services";
import { AdminBarbers } from "./pages/admin/barbers";
import { AdminBookings } from "./pages/admin/bookings";
import { AdminSettings } from "./pages/admin/settings";
import { RegisterBarbershop } from "./pages/admin/register-barbershop";
import GuestOnly from "../middleware/GuestOnly";
import RequireBarbershop from "../middleware/RequireBarbershop";
import AuthCallback from "./pages/auth-callback";
import AdminOnly from "../middleware/AdminOnly";

export const router = createBrowserRouter([
  {
    Component: GuestOnly,
    children: [
      {
        path: "/login",
        Component: Login,
      },
      {
        path: "/register",
        Component: Register,
      },
      {
        path: "/auth/callback",
        element: <AuthCallback />,
      },
    ],
  },
  {
    path: "/admin",
    Component: AdminOnly,
    children: [
      {
        Component: RequireBarbershop,
        children: [
          {
            Component: AdminLayout,
            children: [
              {
                index: true,
                element: <Navigate to="/admin/dashboard" replace />,
              },
              { path: "dashboard", Component: AdminDashboard },
              { path: "profile", Component: AdminProfile },
              { path: "services", Component: AdminServices },
              { path: "barbers", Component: AdminBarbers },
              { path: "bookings", Component: AdminBookings },
              { path: "settings", Component: AdminSettings },
            ],
          },
        ],
      },
      {
        Component: Layout,
        children: [
          { path: "register-barbershop", Component: RegisterBarbershop },
        ],
      },
    ],
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "search", Component: Search },
      { path: "barbershop/:id", Component: BarbershopDetail },
      { path: "booking", Component: Booking },
      { path: "my-bookings", Component: MyBookings },
      { path: "ai-consultant", Component: AIConsultant },
      { path: "services", element: <Navigate to="/search" replace /> },
      { path: "barbers", element: <Navigate to="/search" replace /> },
      { path: "*", Component: NotFound },
    ],
  },
]);
