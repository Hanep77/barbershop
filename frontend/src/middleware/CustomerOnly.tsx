import { Navigate, Outlet } from "react-router";
import useAuthStore from "../store/authStore";

/**
 * Middleware to protect routes that should only be accessible by customer role
 * Redirect barbershop/admin users to admin dashboard
 * Redirect unauthenticated users to login
 */
const CustomerOnly = () => {
  const { user, loading } = useAuthStore();

  // While loading, don't render anything
  if (loading) {
    return null;
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is barbershop/admin - redirect to admin dashboard
  if (user.role === "barbershop") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // User is customer - allow access
  return <Outlet />;
};

export default CustomerOnly;
