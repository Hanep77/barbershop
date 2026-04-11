import api from "../lib/axios";

// MUST be called before login to get CSRF cookie
export const getCsrf = () => api.get("/sanctum/csrf-cookie");

export const register = async (
  name: string,
  email: string,
  role: string,
  password: string,
  password_confirmation: string,
) => {
  await getCsrf();
  return api.post("/api/register", {
    name,
    email,
    role,
    password,
    password_confirmation,
  });
};

export const login = async (email: string, password: string) => {
  await getCsrf();
  return api.post("/api/login", { email, password });
};

export const logout = () => api.post("/api/logout");
export const getUser = () => api.get("/api/me");

export const getGoogleRedirectUrl = async () => {
  const { data } = await api.get("/auth/google/redirect");
  return data;
};
