"use client";

import { createContext, useState, useContext } from "react";
import Fetcher from "@/lib/fetcher";
import { authServices } from "@/services/auth";
import type { User } from "@/types/User";
import { toast } from "sonner";
import { AxiosError } from "axios";

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
  };

  const logout = async () => {
    const { url: cookieUrl, method: cookieMethod } = authServices.getCookie();
    const { url, method } = authServices.logout();

    await Fetcher({ url: cookieUrl, method: cookieMethod }).then(async () => {
      await Fetcher({ url, method })
        .then(() => {
          localStorage.removeItem("auth_user");
          setUser(null);
          window.location.href = "/";
        })
        .catch((error) => {
          if (error instanceof AxiosError) {
            toast.error(error?.response?.data.message);
          }
        });
    });
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, user, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
