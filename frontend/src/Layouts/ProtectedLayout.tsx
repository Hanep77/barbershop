"use client";

import { useAuth } from "@/context/AuthContext";
import { Outlet } from "react-router";
import Navbar from "@/components/Navbar";
import Sidebar from "@/Pages/partner/components/Sidebar";

export default function ProtectedLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <main className="flex-grow grid place-items-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
            <p className="text-gray-600">
              You must be logged in to access this page.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      <div className="flex flex-row w-full">
        <Sidebar />
        <div className="p-5 w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
