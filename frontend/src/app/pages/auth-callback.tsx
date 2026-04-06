import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import api from '../../lib/axios';
import useAuthStore from '../../store/authStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get('/api/user');
        setUser(data);
        navigate('/');
      } catch {
        navigate('/login?error=google_failed');
      }
    };

    fetchUser();
  }, [navigate, setUser]);

  return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
}
