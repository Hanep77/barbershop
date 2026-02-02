import { Outlet } from "react-router";
import Navbar from "@/components/Navbar";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-700 flex flex-col">
      <Navbar />
      <Outlet />
    </div>
  );
}
