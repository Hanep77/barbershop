"use client";

import { createContext, useState, useContext } from "react";
import Fetcher from "@/lib/fetcher";
import { authServices } from "@/services/auth";
import type { User } from "@/types/User";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  user: User | null;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
); // eslint-disable-line

export const useAuth = () => {
  //eslint-disable-line
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const user = localStorage.getItem("auth_user");

    if (user) {
      return JSON.parse(user) as User;
    }
    return null;
  });

  const isAuthenticated = !!user;

  const login = (user: User) => {
    localStorage.setItem("auth_user", JSON.stringify(user));
    setUser(user);
    // window.location.href = '/dashboard';
  };

  const logout = async () => {
    const { url: cookieUrl, method: cookieMethod } = authServices.getCookie();
    const { url, method } = authServices.logout();

    await Fetcher({ url: cookieUrl, method: cookieMethod });
    await Fetcher({ url, method });

    localStorage.removeItem("auth_user");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, user, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
