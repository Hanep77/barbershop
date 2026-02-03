"use client";

import { NavLink } from "react-router";
import { Scissors } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLoadingBar } from "react-top-loading-bar";

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();

  const { start, complete } = useLoadingBar();

  return (
    <nav className="bg-gray-900 text-white shadow-sm sticky top-0 w-full z-20">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <NavLink
          to="/"
          replace
          className={({ isActive }) => {
            if (isActive) {
              complete();
            }
            return "flex items-center gap-2 text-yellow-500";
          }}
          onClick={() => {
            start();
          }}
        >
          <div className="bg-yellow-600 text-white p-2 rounded-lg">
            <Scissors size={24} />
          </div>
          <span className="font-bold text-xl">BarberFinder</span>
        </NavLink>

        <div className="flex items-center gap-4">
          {/* {JSON.stringify(user)} */}
          {isAuthenticated ? (
            <>
              {user?.role === "customer" ? (
                <NavLink
                  to="/partner-register"
                  className={({ isActive }) => {
                    if (isActive) {
                      complete();
                    }
                    return "bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors";
                  }}
                  onClick={() => {
                    start();
                  }}
                >
                  Daftar Mitra
                </NavLink>
              ) : (
                <NavLink
                  to="/dashboard"
                    className={({ isActive }) => {
                    if (isActive) {
                      complete();
                    }
                    return "bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors";
                  }}
                  onClick={() => {
                    start();
                  }}
                >
                  Dashboard
                </NavLink>
              )}

              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                  className={({ isActive }) => {
                    if (isActive) {
                      complete();
                    }
                    return " hover:text-yellow-500 font-medium transition-colors";
                  }}
                  onClick={() => {
                    start();
                  }}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                  className={({ isActive }) => {
                    if (isActive) {
                      complete();
                    }
                    return "bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors";
                  }}
                  onClick={() => {
                    start();
                  }}
              >
                Daftar
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
