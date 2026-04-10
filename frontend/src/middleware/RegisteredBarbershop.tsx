import { Navigate, Outlet } from "react-router";
import useAuthStore from "../store/authStore";

const AdminOnly = () => {
  const { user } = useAuthStore();

  if (user?.barbershop) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default AdminOnly;
