import type { ReactNode } from "react";
import { Link, useLocation, Outlet } from "react-router";
import {
  LayoutDashboard,
  Scissors,
  Users,
  Calendar,
  Settings,
  LogOut,
  Store,
} from "lucide-react";

interface AdminLayoutProps {
  children?: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/admin/dashboard",
    },
    {
      icon: Store,
      label: "Shop Profile",
      path: "/admin/profile",
    },
    {
      icon: Scissors,
      label: "Services",
      path: "/admin/services",
    },
    {
      icon: Users,
      label: "Barbers",
      path: "/admin/barbers",
    },
    {
      icon: Calendar,
      label: "Bookings",
      path: "/admin/bookings",
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/admin/settings",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-muted border-r border-border flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-foreground font-medium">BarberBrody</h2>
              <p className="text-xs text-muted-foreground">Admin Portal</p>
            </div>
          </Link>
        </div>

        {/* Shop Info */}
        <div className="p-6 border-b border-border">
          <p className="text-xs text-muted-foreground mb-1">Managing</p>
          <p className="text-sm text-foreground font-medium">
            Marcus & Co. Barbers
          </p>
          <p className="text-xs text-muted-foreground">Downtown Manhattan</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                ${
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Back to Website</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children || <Outlet />}</main>
    </div>
  );
}
