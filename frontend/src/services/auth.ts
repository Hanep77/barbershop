export const authServices = {
  login: () => ({ url: "/api/login", method: "POST" }),
  register: () => ({ url: "/api/register", method: "POST" }),
  logout: () => ({ url: "/api/logout", method: "POST" }),
  getCookie: () => ({ url: "/sanctum/csrf-cookie", method: "GET" }),
};
