import { Link } from "react-router";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  Edit,
  Eye,
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

// Mock data for Marcus & Co.
const stats = [
  {
    label: "Total Bookings",
    value: "142",
    change: "+12%",
    trend: "up",
    icon: Calendar,
  },
  {
    label: "Revenue (This Month)",
    value: "$8,540",
    change: "+18%",
    trend: "up",
    icon: DollarSign,
  },
  {
    label: "Active Barbers",
    value: "2",
    change: "100%",
    trend: "neutral",
    icon: Users,
  },
  {
    label: "Avg. Rating",
    value: "4.9",
    change: "+0.1",
    trend: "up",
    icon: TrendingUp,
  },
];

const recentBookings = [
  {
    id: 1,
    customer: "John Anderson",
    service: "Signature Cut & Style",
    barber: "Marcus Johnson",
    date: "2026-03-25",
    time: "2:00 PM",
    status: "pending",
    price: "$65",
  },
  {
    id: 2,
    customer: "Michael Roberts",
    service: "Classic Cut",
    barber: "David Chen",
    date: "2026-03-25",
    time: "3:30 PM",
    status: "pending",
    price: "$45",
  },
  {
    id: 3,
    customer: "David Thompson",
    service: "Beard Trim & Shape",
    barber: "Marcus Johnson",
    date: "2026-03-24",
    time: "11:00 AM",
    status: "completed",
    price: "$35",
  },
  {
    id: 4,
    customer: "James Wilson",
    service: "The Full Experience",
    barber: "David Chen",
    date: "2026-03-24",
    time: "1:00 PM",
    status: "completed",
    price: "$95",
  },
  {
    id: 5,
    customer: "Robert Martinez",
    service: "Classic Cut",
    barber: "Marcus Johnson",
    date: "2026-03-23",
    time: "4:00 PM",
    status: "completed",
    price: "$45",
  },
];

const upcomingAppointments = [
  {
    time: "2:00 PM",
    customer: "John Anderson",
    service: "Signature Cut & Style",
    barber: "Marcus Johnson",
  },
  {
    time: "3:30 PM",
    customer: "Michael Roberts",
    service: "Classic Cut",
    barber: "David Chen",
  },
  {
    time: "5:00 PM",
    customer: "Chris Johnson",
    service: "Beard Trim & Shape",
    barber: "Marcus Johnson",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "in-progress":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "completed":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function AdminDashboard() {
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
          {stats.map((stat) => (
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
                    <span
                      className={`text-xs ${
                        stat.trend === "up"
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {stat.change} from last month
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
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {upcomingAppointments.length} appointments
                </Badge>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {upcomingAppointments.map((apt, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="flex-shrink-0 w-16">
                      <div className="flex items-center gap-1 text-sm text-primary">
                        <Clock className="w-4 h-4" />
                        <span>{apt.time}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-card-foreground truncate">
                        {apt.customer}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {apt.service}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        with {apt.barber}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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
                    <tr key={booking.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-card-foreground">
                            {booking.customer}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.barber}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-card-foreground">
                          {booking.service}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-card-foreground">
                          {new Date(booking.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.time}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={getStatusColor(booking.status)}
                        >
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-card-foreground">
                          {booking.price}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
