'use client'

import { createContext, useState, useContext } from "react";
import type { Session, User } from "@/types/User";

interface AuthContextType {
  session: Session | null;
  isAuthenticated: boolean;
  setSession: (session: Session | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined); // eslint-disable-line

export const useAuth = () => { //eslint-disable-line
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [session, setSession] = useState<Session | null>(() => {
    const token = localStorage.getItem("auth_token");

    if (token) {
      return token as unknown as Session;
    }
    return null;
  });

  const [user, setUser] = useState<User | null>(() => {
    const user = localStorage.getItem("auth_user");

    if (user) {
      return JSON.parse(user) as User;
    }
    return null;
  });

  const isAuthenticated = !!session;

  const login = (token: string, user: User) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));
    setSession(token as unknown as Session);
    setUser(user);
    // window.location.href = '/dashboard';
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setSession(null);
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ session, isAuthenticated, setSession, login, logout, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

