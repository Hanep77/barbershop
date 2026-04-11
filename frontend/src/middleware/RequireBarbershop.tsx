import { Navigate, Outlet } from "react-router";
import useAuthStore from "../store/authStore";

const RequireBarbershop = () => {
  const { user } = useAuthStore();

  if (!user?.barbershop)
    return <Navigate to="/admin/register-barbershop" replace />;

  return <Outlet />;
};

export default RequireBarbershop;
