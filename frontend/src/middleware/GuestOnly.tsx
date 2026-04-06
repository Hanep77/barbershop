import { Navigate, Outlet } from 'react-router';
import useAuthStore from '../store/authStore';

const GuestOnly = () => {
  const { user } = useAuthStore();

  // if (loading) return <div>Loading...</div>;
  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default GuestOnly;
