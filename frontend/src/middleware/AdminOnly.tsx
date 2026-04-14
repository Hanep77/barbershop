import { Navigate, Outlet } from "react-router";
import useAuthStore from "../store/authStore";

const AdminOnly = () => {
  const { user } = useAuthStore();

  if (user?.role !== "barbershop") return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default AdminOnly;
