import { useEffect } from "react";
import { useNavigate } from "react-router";
import api from "../../lib/axios";
import useAuthStore from "../../store/authStore";

export default function AuthCallback() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const { data } = await api.get("/api/user");
        if (!isMounted) return;
        setUser(data);
        navigate("/");
      } catch (err) {
        console.error("Error in fetchUser:", err);
        if (isMounted) {
          navigate("/login?error=google_failed");
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [navigate, setUser]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      Loading...
    </div>
  );
}
