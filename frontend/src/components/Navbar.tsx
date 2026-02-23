"use client";

import { NavLink } from "react-router";
import { Scissors } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLoadingBar } from "react-top-loading-bar";
import { useLocation } from "react-router";
import { useSidebarContext } from "@/context/SidebarContext";

// interface NavItemProps {
//   name: string;
//   link: string;
//   isAdminFeature: boolean;
// }

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const { setOpen, isOpen } = useSidebarContext();

  const { start, complete } = useLoadingBar();

  const { pathname } = useLocation();

  // const navItems: NavItemProps[] = [
  //   {
  //     name: "Dashboard",
  //     link: "/dashboard",
  //     isAdminFeature: true,
  //   },
  //   {
  //     name: "Services",
  //     link: "/services",
  //     isAdminFeature: true,
  //   },
  // ];

  return (
    <nav className="bg-[#151820]/70  backdrop-blur text-white shadow-sm position-sticky top-0 w-full z-20">
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

        <div className="xl:flex lg:flex md:flex hidden items-center gap-4">
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
                    return `${pathname == "/partner-register" ? "bg-yellow-600 " : "hover:bg-yellow-700 px-4 py-2 rounded-lg font-medium transition-colors"} text-white `;
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
                    return `${pathname == "/dashboard" ? "bg-yellow-600 " : "hover:bg-yellow-700"} text-white  px-4 py-2 rounded-lg font-medium transition-colors`;
                  }}
                  onClick={() => {
                    start();
                  }}
                >
                  Dashboard
                </NavLink>
              )}

              <button
                className="border border-red-600 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors"
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

        <div className="xl:hidden lg:hidden md:hidden block items-center gap-4">
          <button
            className="border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white transition-all transition-duration-300 p-3 rounded-lg"
            onClick={() => setOpen(!isOpen)}
          >
            Toggle
          </button>
        </div>
      </div>
    </nav>
  );
}
