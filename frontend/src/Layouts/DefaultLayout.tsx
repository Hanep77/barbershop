import { Outlet } from "react-router";
import Navbar from "@/components/Navbar";

export default function DefaultLayout() {
  return (
    <div className="h-screen bg-black flex flex-col">
      <div className="p-2 sticky top-0">
        <Navbar />
      </div>
      <Outlet />
    </div>
  );
}
