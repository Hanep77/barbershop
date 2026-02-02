"use client"

import { Link } from "react-router";
import { Scissors } from "lucide-react";
import { useAuth } from "@/context/AuthContext";


export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-gray-900 text-white shadow-sm sticky top-0 w-full z-20">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-yellow-600 text-white p-2 rounded-lg">
            <Scissors size={24} />
          </div>
          <span className="font-bold text-xl">BarberFinder</span>
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors" onClick={logout}>
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className=" hover:text-yellow-500 font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
