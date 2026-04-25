import { Link, useLocation } from "react-router";
import {
  LogOut,
  LayoutDashboard,
  Calendar,
  Settings,
  User as UserIcon,
  ShoppingBag,
  Bell,
  Heart
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuArrow
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export default function UserMenu() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-11 w-11 rounded-full p-0.5 hover:bg-muted ring-offset-background transition-all hover:ring-2 hover:ring-primary/40 focus:ring-2 focus:ring-primary/40"
        >
          <Avatar className="h-full w-full border border-border/60">
            <AvatarImage src={user.avatar ? user.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt={user.name} />
            <AvatarFallback className="bg-primary/5 text-primary font-bold">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-72 p-0 overflow-hidden" align="end" sideOffset={12}>
        <DropdownMenuArrow className="fill-border" />

        {/* User Header Section */}
        <div className="bg-muted/30 p-4 pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-primary/20 shadow-sm">
              <AvatarImage src={user.avatar ? user.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 overflow-hidden">
                <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                <Badge variant={user.role === "barbershop" ? "default" : "secondary"} className="text-[10px] h-4.5 px-1.5 uppercase tracking-wider font-bold">
                  {user.role}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground font-light truncate tracking-wide mt-0.5">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="m-0 bg-border/40" />

        {/* Core Navigation Section */}
        <div className="p-1.5">
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link
                to="/my-bookings"
                className={`cursor-pointer w-full flex items-center px-3 py-2.5 rounded-lg group transition-all ${isActive("/my-bookings") ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
                  }`}
              >
                <Calendar className={`mr-3 h-4 w-4 ${isActive("/my-bookings") ? "text-primary" : "text-muted-foreground"} group-hover:text-white transition-colors`} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-primary group-hover:text-black transition-colors">Appointments</span>
                  <span className="text-[10px] text-muted-foreground font-light group-hover:text-white transition-colors">Manage your visits</span>
                </div>
              </Link>
            </DropdownMenuItem>

            {user.role === "barbershop" && (
              <DropdownMenuItem asChild>
                <Link
                  to="/admin/dashboard"
                  className={`cursor-pointer w-full flex items-center px-3 py-2.5 rounded-lg group transition-all ${isActive("/admin/dashboard") ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
                    }`}
                >
                  <LayoutDashboard className={`mr-3 h-4 w-4 ${isActive("/admin/dashboard") ? "text-primary" : "text-muted-foreground group-hover:text-white"} transition-colors`} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary group-hover:text-black transition-colors">Dashboard</span>
                    <span className="text-[10px] text-muted-foreground font-light group-hover:text-white transition-colors">Partner management tools</span>
                  </div>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </div>

        <DropdownMenuSeparator className="m-0 bg-border/40" />

        {/* Support/Settings Section */}
        <div className="p-1.5">
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer px-3 py-2.5 rounded-lg group hover:bg-muted transition-all">
              <Heart className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-sm font-light">Saved Shops</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer px-3 py-2.5 rounded-lg group hover:bg-muted transition-all">
              <Bell className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-sm font-light">Notifications</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer px-3 py-2.5 rounded-lg group hover:bg-muted transition-all">
              <Settings className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-sm font-light">Account Settings</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </div>

        <DropdownMenuSeparator className="m-0 bg-border/40" />

        {/* Footer/Logout Section */}
        <div className="p-1.5">
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive px-3 py-3 rounded-lg group transition-all"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="text-sm font-bold">Sign Out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
