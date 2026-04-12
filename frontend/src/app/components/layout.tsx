import { Outlet, Link, useLocation } from "react-router";
import { Scissors, Calendar, Search, Menu, X, Sparkles, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { FloatingChatButton } from "./floating-chat-button";
import { SmartChatbotWidget } from "./smart-chatbot-widget";
import useAuthStore from "../../store/authStore";
import { UserMenu } from "./user-menu";

export function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  const navItems = [
    { path: "/", label: "Home", icon: Scissors },
    { path: "/search", label: "Browse", icon: Search },
    { path: "/ai-consultant", label: "AI Stylist", icon: Sparkles },
    { path: "/my-bookings", label: "My Bookings", icon: Calendar },
  ];

  // Determine chat context based on current route
  const getChatContext = () => {
    if (location.pathname === "/search") {
      return { type: "search" as const };
    }

    const barbershopMatch = location.pathname.match(/\/barbershop\/(\d+)/);
    if (barbershopMatch) {
      return {
        type: "barbershop-detail" as const,
        barbershopId: parseInt(barbershopMatch[1]),
      };
    }

    return { type: "general" as const };
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Scissors className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-foreground">
                BarberBrody
              </span>
            </Link>

            {/* Desktop Navigation */}
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
                    <span className="font-normal">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Auth Buttons (Desktop) */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <UserMenu />
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-6 py-2.5 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-6 pb-4 flex flex-col gap-4 border-t border-border pt-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              {user ? (
                <>
                  {user.role === "barbershop" && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Log Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 border border-border text-foreground rounded-lg text-center hover:bg-muted transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 bg-primary text-primary-foreground rounded-lg text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Floating Chat Button & Widget */}
      <FloatingChatButton
        onClick={() => setChatOpen(!chatOpen)}
        isOpen={chatOpen}
      />

      <SmartChatbotWidget
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        context={getChatContext()}
      />

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
                <li>
                  <Link
                    to="/register"
                    className="text-muted-foreground hover:text-primary transition-colors font-light"
                  >
                    Sign Up
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
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors font-light"
                  >
                    Partner Benefits
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors font-light"
                  >
                    Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground font-light">
                <li>
                  <a
                    href="tel:+15551234567"
                    className="hover:text-primary transition-colors"
                  >
                    (555) 123-4567
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@barberbrody.com"
                    className="hover:text-primary transition-colors"
                  >
                    support@barberbrody.com
                  </a>
                </li>
                <li className="pt-2">
                  <a href="#" className="hover:text-primary transition-colors">
                    Help Center
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
