import { useEffect } from "react";
import { useNavigate } from "react-router";
import api from "../../lib/axios";
import { tokenStore } from "../../lib/tokens";
import useAuthStore from "../../store/authStore";
import type { User } from "../../types/auth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    let isMounted = true;

    const completeLogin = async () => {
      try {
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const access = params.get("access_token");
        const refresh = params.get("refresh_token");

        if (access && refresh) {
          tokenStore.set(access, refresh);
          window.history.replaceState(null, "", window.location.pathname);
        }

        if (!tokenStore.hasSession()) {
          navigate("/login?error=google_failed", { replace: true });
          return;
        }

        const { data } = await api.get<User>("/api/me");
        if (!isMounted) return;
        setUser(data);
        navigate("/");
      } catch (err) {
        console.error("Error in AuthCallback:", err);
        if (isMounted) {
          navigate("/login?error=google_failed");
        }
      }
    };

    completeLogin();

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
