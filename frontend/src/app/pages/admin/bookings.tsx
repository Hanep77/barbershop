import { useState, useEffect } from "react";
import { Calendar, Clock, User, DollarSign, Filter, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { toast } from "sonner";
import { getPartnerBookings, updateBookingStatus } from "../../../services/booking";
import type { Booking } from "../../../types/booking";

const getStatusColor = (status: Booking['status']) => {
  switch (status) {
    case "pending":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "confirmed":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "completed":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "cancelled":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusIcon = (status: Booking['status']) => {
  switch (status) {
    case "pending":
      return AlertCircle;
    case "confirmed":
      return Clock;
    case "completed":
      return CheckCircle;
    case "cancelled":
      return XCircle;
    default:
      return AlertCircle;
  }
};

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBarber, setFilterBarber] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchBookings = async () => {
    try {
      const res = await getPartnerBookings();
      setBookings(res.data.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const barbers = Array.from(new Set(bookings.map((b) => b.capster?.name).filter(Boolean)));

  const filteredBookings = bookings.filter((booking) => {
    const matchBarber = filterBarber === "all" || booking.capster?.name === filterBarber;
    const matchStatus = filterStatus === "all" || booking.status === filterStatus;
    return matchBarber && matchStatus;
  });

  const upcomingBookings = filteredBookings
    .filter((b) => b.status === "pending" || b.status === "confirmed")
    .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());

  const completedBookings = filteredBookings
    .filter((b) => b.status === "completed" || b.status === "cancelled")
    .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());

  const handleStatusChange = async (id: string, newStatus: Booking['status']) => {
    try {
      await updateBookingStatus(id, newStatus);
      setBookings(
        bookings.map((booking) =>
          booking.id === id ? { ...booking, status: newStatus } : booking
        )
      );
      toast.success(`Booking status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-muted">
        <div className="p-6">
          <h1 className="text-foreground mb-1 text-2xl font-bold">Bookings Management</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage customer appointments
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Bookings
                </p>
                <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </Card>
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending</p>
                <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
          </Card>
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Confirmed</p>
                <p className="text-2xl font-bold text-blue-500">{stats.confirmed}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border">
          <div className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-card-foreground">Filters:</span>
              </div>
              <Select value={filterBarber} onValueChange={setFilterBarber}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Barbers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Barbers</SelectItem>
                  {barbers.map((barber) => (
                    <SelectItem key={barber} value={barber}>
                      {barber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {(filterBarber !== "all" || filterStatus !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterBarber("all");
                    setFilterStatus("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Bookings Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Past / Finished ({completedBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            <Card className="bg-card border-border">
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
                        Barber
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
                      <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {upcomingBookings.map((booking) => {
                      const StatusIcon = getStatusIcon(booking.status);
                      return (
                        <tr
                          key={booking.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {booking.user?.name
                                    ? booking.user.name.split(" ").map((n) => n[0]).join("")
                                    : "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-card-foreground">
                                  {booking.user?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {booking.user?.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-card-foreground">
                              {booking.service?.name}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-card-foreground">
                              {booking.capster?.name}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm text-card-foreground">
                                  {new Date(booking.booking_date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {booking.booking_time}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant="outline"
                              className={getStatusColor(booking.status)}
                            >
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {booking.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-card-foreground">
                              {booking.service ? formatPrice(booking.service.price) : "-"}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <Select
                              value={booking.status}
                              onValueChange={(value) =>
                                handleStatusChange(
                                  booking.id,
                                  value as Booking['status']
                                )
                              }
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">
                                  Confirmed
                                </SelectItem>
                                <SelectItem value="completed">
                                  Completed
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  Cancelled
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {upcomingBookings.length === 0 && (
                  <div className="p-12 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No upcoming bookings found
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <Card className="bg-card border-border">
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
                        Barber
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
                    {completedBookings.map((booking) => {
                      const StatusIcon = getStatusIcon(booking.status);
                      return (
                        <tr
                          key={booking.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {booking.user?.name
                                    ? booking.user.name.split(" ").map((n) => n[0]).join("")
                                    : "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-card-foreground">
                                  {booking.user?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {booking.user?.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-card-foreground">
                              {booking.service?.name}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-card-foreground">
                              {booking.capster?.name}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm text-card-foreground">
                                  {new Date(booking.booking_date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {booking.booking_time}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant="outline"
                              className={getStatusColor(booking.status)}
                            >
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {booking.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-card-foreground">
                                {booking.service ? formatPrice(booking.service.price) : "-"}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {completedBookings.length === 0 && (
                  <div className="p-12 text-center">
                    <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No completed or cancelled bookings found
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
