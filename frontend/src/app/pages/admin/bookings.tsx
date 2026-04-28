import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { toast } from "sonner";
import {
  getPartnerBookings,
  updateBookingStatus,
} from "../../../services/booking";
import type { Booking } from "../../../types/booking";

const getStatusColor = (status: Booking["status"]) => {
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

const getStatusIcon = (status: Booking["status"]) => {
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

  useEffect(() => {
    let isMounted = true;

    const fetchBookings = async () => {
      try {
        const res = await getPartnerBookings();
        if (!isMounted) return;
        setBookings(res.data.data);
      } catch (err) {
        console.error("Error in fetchBookings:", err);
        if (!isMounted) return;
        toast.error("Failed to load bookings");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBookings();

    return () => {
      isMounted = false;
    };
  }, []);

  const barbers = Array.from(
    new Set(bookings.map((b) => b.capster?.name).filter(Boolean)),
  );

  const filteredBookings = bookings.filter((booking) => {
    const matchBarber =
      filterBarber === "all" || booking.capster?.name === filterBarber;
    const matchStatus =
      filterStatus === "all" || booking.status === filterStatus;
    return matchBarber && matchStatus;
  });

  const upcomingBookings = filteredBookings
    .filter((b) => b.status === "pending" || b.status === "confirmed")
    .sort(
      (a, b) =>
        new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime(),
    );

  const completedBookings = filteredBookings
    .filter((b) => b.status === "completed" || b.status === "cancelled")
    .sort(
      (a, b) =>
        new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime(),
    );

  const handleStatusChange = async (
    id: string,
    newStatus: Booking["status"],
  ) => {
    try {
      await updateBookingStatus(id, newStatus);
      setBookings(
        bookings.map((booking) =>
          booking.id === id ? { ...booking, status: newStatus } : booking,
        ),
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
      <div className="border-b border-border bg-muted">
        <div className="p-6">
          <h1 className="text-foreground mb-1 text-2xl font-bold">
            Bookings Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage customer appointments
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-card border-border">
            <p className="text-sm text-muted-foreground mb-1">Total Bookings</p>
            <p className="text-2xl font-bold text-card-foreground">
              {stats.total}
            </p>
          </Card>
          <Card className="p-6 bg-card border-border">
            <p className="text-sm text-muted-foreground mb-1 text-amber-500">
              Pending
            </p>
            <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
          </Card>
          <Card className="p-6 bg-card border-border">
            <p className="text-sm text-muted-foreground mb-1 text-blue-500">
              Confirmed
            </p>
            <p className="text-2xl font-bold text-blue-500">
              {stats.confirmed}
            </p>
          </Card>
          <Card className="p-6 bg-card border-border">
            <p className="text-sm text-muted-foreground mb-1 text-green-500">
              Completed
            </p>
            <p className="text-2xl font-bold text-green-500">
              {stats.completed}
            </p>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <div className="p-4 flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">Filters:</span>
            </div>
            <Select value={filterBarber} onValueChange={setFilterBarber}>
              <SelectTrigger className="w-[200px] text-foreground">
                <SelectValue placeholder="All Barbers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Barbers</SelectItem>
                {barbers.map((b) => (
                  <SelectItem key={b} value={b as string}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px] text-foreground">
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
          </div>
        </Card>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger
              value="upcoming"
              className="data-[state=active]:bg-primary"
            >
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-primary"
            >
              Past ({completedBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            <Card className="bg-card border-border overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Barber</th>
                    <th className="px-6 py-4">Date/Time</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {upcomingBookings.map((b) => {
                    const StatusIcon = getStatusIcon(b.status);
                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs">
                                {b.user?.name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{b.user?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {b.user?.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{b.service?.name}</td>
                        <td className="px-6 py-4">{b.capster?.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{" "}
                            {new Date(b.booking_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Clock className="w-3 h-3" /> {b.booking_time}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className={getStatusColor(b.status)}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {b.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {b.service ? formatPrice(b.service.price) : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <Select
                            value={b.status}
                            onValueChange={(val) =>
                              handleStatusChange(b.id, val as Booking["status"])
                            }
                          >
                            <SelectTrigger className="w-[130px] bg-card border border-primary">
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
                <div className="p-12 text-center text-muted-foreground">
                  No upcoming bookings found
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <Card className="bg-card border-border overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Barber</th>
                    <th className="px-6 py-4">Date/Time</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {completedBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {b.user?.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{b.user?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {b.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{b.service?.name}</td>
                      <td className="px-6 py-4">{b.capster?.name}</td>
                      <td className="px-6 py-4">
                        {b.booking_date} {b.booking_time}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={getStatusColor(b.status)}
                        >
                          {b.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {b.service ? formatPrice(b.service.price) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {completedBookings.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  No past bookings found
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
