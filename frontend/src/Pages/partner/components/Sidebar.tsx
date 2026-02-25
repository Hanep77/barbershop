"use client";

import { useEffect } from "react";
import { useSidebarContext } from "@/context/SidebarContext";
import { NavLink } from "react-router";

export default function Sidebar() {
  const { setOpen, isOpen } = useSidebarContext();

  const sidebarItems = [
    {
      name: "Home",
      link: "/dashboard",
      isAdmin: true,
    },
    {
      name: "Transactions",
      link: "/transactions",
      isAdmin: true,
    },
    {
      name: "Manage Services",
      link: "/partner-services",
      isAdmin: true,
    },
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setOpen(false);
      } else {
        setOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);

    // Initial check
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setOpen]);

  return (
    <div
      className={` h-screen w-full justify-between text-white bg-[#151820]/70 ${isOpen ? "flex flex-col max-w-xs" : "hidden"}`}
    >
      <div className="px-4 py-6">
        <ul className="mt-6 space-y-1">
          {sidebarItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.link}
                replace
                className={({ isActive }) =>
                  isActive
                    ? "block rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
                    : "block rounded-lg px-4 py-2 text-sm font-medium text-white cursor-pointer hover:bg-gray-100 hover:text-gray-700"
                }
              >
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
