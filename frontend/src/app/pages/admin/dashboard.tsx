import { Link } from "react-router";
import { useState, useEffect } from "react";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  Edit,
  Eye,
  Loader2,
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import {
  getDashboardStats,
  getTodayAppointments,
  getRecentBookings,
  type DashboardStats,
  type UpcomingAppointment,
  type RecentBooking,
} from "../../../services/dashboard";

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<
    UpcomingAppointment[]
  >([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const [statsData, appointmentsData, bookingsData] = await Promise.all([
          getDashboardStats(),
          getTodayAppointments(),
          getRecentBookings(),
        ]);

        if (!isMounted) return;

        setStats(statsData);
        setTodayAppointments(appointmentsData || []);
        setRecentBookings(bookingsData || []);
      } catch (err) {
        console.error("Error in fetchDashboardData:", err);
        if (isMounted) {
          toast.error("Failed to load dashboard data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getTrendColor = (trend: string): string => {
    const trendType = trend as "up" | "down" | "neutral";
    switch (trendType) {
      case "up":
        return "text-green-500";
      case "down":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const formatChangeText = (change: number) => {
    return change >= 0 ? `+${change}%` : `${change}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Bookings",
      value: stats?.total_bookings || 0,
      change: stats?.bookings_change || 0,
      trend: stats ? (stats.bookings_change >= 0 ? "up" : "down") : "neutral",
      icon: Calendar,
    },
    {
      label: "Revenue (This Month)",
      value: formatPrice(stats?.revenue_this_month || 0),
      change: stats?.revenue_change || 0,
      trend: stats ? (stats.revenue_change >= 0 ? "up" : "down") : "neutral",
      icon: DollarSign,
    },
    {
      label: "Active Barbers",
      value: stats?.active_capsters || 0,
      change: 0,
      trend: "neutral",
      icon: Users,
    },
    {
      label: "Avg. Rating",
      value: stats?.average_rating?.toFixed(1) || "0",
      change: stats?.rating_change || 0,
      trend: stats ? (stats.rating_change >= 0 ? "up" : "down") : "neutral",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-muted">
        <div className="p-6">
          <h1 className="text-foreground mb-1">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Here's what's happening with your barbershop today.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.label} className="p-6 bg-card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl text-card-foreground mb-2">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-1">
                    {stat.trend === "up" && (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    )}
                    <span className={`text-xs ${getTrendColor(stat.trend)}`}>
                      {formatChangeText(stat.change)} from last month
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <Card className="lg:col-span-1 bg-card">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-card-foreground">Today's Schedule</h3>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  {todayAppointments.length} appointments
                </Badge>
              </div>
            </div>
            <div className="p-6">
              {todayAppointments.length > 0 ? (
                <div className="space-y-4">
                  {todayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                    >
                      <div className="flex-shrink-0 w-16">
                        <div className="flex items-center gap-1 text-sm text-primary">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(apt.booking_time).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-card-foreground truncate">
                          {apt.customer_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {apt.service_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          with {apt.capster_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No appointments today
                </p>
              )}
              <Link to="/admin/bookings">
                <Button variant="outline" className="w-full mt-4">
                  View All Bookings
                </Button>
              </Link>
            </div>
          </Card>

          {/* Recent Bookings */}
          <Card className="lg:col-span-2 bg-card">
            <div className="p-6 border-b border-border">
              <h3 className="text-card-foreground">Recent Bookings</h3>
            </div>
            {recentBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-card-foreground">
                              {booking.customer_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.capster_name}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-card-foreground">
                            {booking.service_name}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-card-foreground">
                            {new Date(booking.booking_date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.booking_time}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className={
                              booking.status === "pending"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : booking.status === "confirmed"
                                  ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                  : booking.status === "completed"
                                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                                    : "bg-muted text-muted-foreground"
                            }
                          >
                            {booking.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-card-foreground">
                            {formatPrice(booking.total_price)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                No bookings yet
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-card">
          <div className="p-6 border-b border-border">
            <h3 className="text-card-foreground">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/admin/services">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2"
                >
                  <Edit className="w-5 h-5 text-primary" />
                  <span>Manage Services</span>
                </Button>
              </Link>
              <Link to="/admin/barbers">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2"
                >
                  <Users className="w-5 h-5 text-primary" />
                  <span>Manage Barbers</span>
                </Button>
              </Link>
              <Link to="/admin/bookings">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2"
                >
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>View Bookings</span>
                </Button>
              </Link>
              <Link to="/admin/profile">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2"
                >
                  <Eye className="w-5 h-5 text-primary" />
                  <span>Update Profile</span>
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
