import { Navigate, Outlet } from "react-router";
import useAuthStore from "../store/authStore";

const AdminOnly = () => {
  const { user } = useAuthStore();

  // Any authenticated user may reach the admin area shell; shop-specific
  // pages are gated by RequireBarbershop. Customers need this to reach
  // /admin/register-barbershop before the role is promoted.
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default AdminOnly;
