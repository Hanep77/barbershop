import { Outlet, Link, useLocation } from "react-router";
import {
  Scissors,
  Calendar,
  Search,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Settings,
  Bell,
  Heart,
} from "lucide-react";
import { useState, useEffect } from "react";
import useAuthStore from "../../store/authStore";
import UserMenu from "./user-menu";
import NotificationBell from "./notification-bell";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

export function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    let isMounted = true;

    const updateScrolling = () => {
      try {
        if (isMounted) {
          if (mobileMenuOpen) {
            document.body.style.overflow = "hidden";
          } else {
            document.body.style.overflow = "unset";
          }
        }
      } catch (err) {
        console.error("Error in updateScrolling:", err);
      }
    };

    updateScrolling();

    return () => {
      isMounted = false;
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    let isMounted = true;

    const closeMobileMenu = () => {
      if (isMounted) {
        setMobileMenuOpen(false);
      }
    };

    closeMobileMenu();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  const navItems = [
    { path: "/", label: "Home", icon: Scissors },
    { path: "/search", label: "Browse", icon: Search },
  ];

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-[30]">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center">
            {/* Logo Container */}
            <div className="flex-1 flex items-center">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-2xl tracking-tight text-foreground">
                  BarberBrody
                </span>
              </Link>
            </div>

            {/* Desktop Navigation (Centered) */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 transition-colors ${
                      isActive(item.path)
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-normal text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Container */}
            <div className="flex-1 flex items-center justify-end gap-4">
              {/* Auth Buttons (Desktop) */}
              <div className="hidden md:flex items-center gap-4">
                {user ? (
                  <>
                    <NotificationBell />
                    <UserMenu />
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-6 py-2.5 border border-border text-foreground rounded-lg hover:bg-muted transition-colors text-sm"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-bold"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden text-foreground p-2 -mr-2 focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-7 h-7" />
                ) : (
                  <Menu className="w-7 h-7" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 top-[81px] bg-background z-50 overflow-y-auto"
          style={{ height: "calc(100vh - 81px)" }}
        >
          <nav className="flex flex-col pb-10">
            {/* User Profile Header */}
            <div className="px-6 py-8 border-b border-border/40 bg-muted/20">
              {user ? (
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-sm">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                      alt={user.name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg text-foreground truncate">
                        {user.name}
                      </span>
                      <Badge
                        variant={
                          user.role === "barbershop" ? "default" : "secondary"
                        }
                        className="text-[10px] h-4.5 px-1.5 uppercase tracking-wider font-bold"
                      >
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-light truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-muted-foreground font-light text-sm">
                    Welcome to BarberBrody
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/login"
                      className="px-4 py-3 border border-border text-foreground rounded-lg text-center font-medium"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-3 bg-primary text-primary-foreground rounded-lg text-center font-bold"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <div className="px-4 py-6">
              <p className="px-4 mb-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Explore
              </p>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${active ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span className="font-medium text-lg">{item.label}</span>
                    </Link>
                  );
                })}
                <Link
                  to="/my-bookings"
                  className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                    isActive("/my-bookings")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Calendar
                    className={`w-6 h-6 ${isActive("/my-bookings") ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span className="font-medium text-lg">My Bookings</span>
                </Link>
              </div>
            </div>

            {/* User Account Section */}
            {user && (
              <div className="px-4 py-6 border-t border-border/20">
                <p className="px-4 mb-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  My Account
                </p>
                <div className="space-y-1">
                  {user.role === "barbershop" && (
                    <Link
                      to="/admin/dashboard"
                      className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                        isActive("/admin/dashboard")
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <LayoutDashboard
                        className={`w-6 h-6 ${isActive("/admin/dashboard") ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-primary">
                          Dashboard
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Partner portal
                        </span>
                      </div>
                    </Link>
                  )}
                  <button className="flex items-center gap-4 px-4 py-4 rounded-xl text-muted-foreground hover:bg-muted transition-all w-full text-left">
                    <Heart className="w-6 h-6" />
                    <span className="font-medium text-lg">Saved Shops</span>
                  </button>
                  <button className="flex items-center gap-4 px-4 py-4 rounded-xl text-muted-foreground hover:bg-muted transition-all w-full text-left">
                    <Bell className="w-6 h-6" />
                    <span className="font-medium text-lg">Notifications</span>
                  </button>
                  <button className="flex items-center gap-4 px-4 py-4 rounded-xl text-muted-foreground hover:bg-muted transition-all w-full text-left">
                    <Settings className="w-6 h-6" />
                    <span className="font-medium text-lg">
                      Account Settings
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Logout Footer */}
            {user && (
              <div className="mt-6 px-4 py-6 border-t border-border/20">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-3 px-4 py-4 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all w-full font-bold"
                >
                  <LogOut className="w-6 h-6" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-24">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Scissors className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl text-foreground">
                  BarberBrody
                </span>
              </div>
              <p className="text-muted-foreground font-light text-sm leading-relaxed">
                Your trusted marketplace for discovering and booking premium
                barbershops.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4">For Customers</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/"
                    className="text-muted-foreground hover:text-primary transition-colors font-light"
                  >
                    Find Barbershops
                  </Link>
                </li>
                <li>
                  <Link
                    to="/my-bookings"
                    className="text-muted-foreground hover:text-primary transition-colors font-light"
                  >
                    My Bookings
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4">
                For Barbershops
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/admin/dashboard"
                    className="text-muted-foreground hover:text-primary transition-colors font-light"
                  >
                    Partner Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="text-muted-foreground hover:text-primary transition-colors font-light"
                  >
                    List Your Business
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground font-light">
                <li>
                  <a
                    href="mailto:support@barberbrody.com"
                    className="hover:text-primary transition-colors"
                  >
                    support@barberbrody.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border text-center">
            <p className="text-muted-foreground text-sm font-light">
              © 2026 BarberBrody. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
