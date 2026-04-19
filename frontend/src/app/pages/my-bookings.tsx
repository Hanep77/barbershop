import { useState, useEffect } from "react";
import { Calendar, Clock, User, MapPin, Phone, Mail, Store, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { getUserBookings } from "../../services/booking";
import type { Booking } from "../../types/booking";

export function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await getUserBookings();
        setBookings(res.data.data);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const upcomingBookings = bookings.filter((b) => b.status === "pending" || b.status === "confirmed");
  const pastBookings = bookings.filter((b) => b.status === "completed" || b.status === "cancelled");

  // Helper to format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-bold text-4xl text-foreground mb-3">
            My Bookings
          </h1>
          <p className="text-muted-foreground font-light text-lg leading-relaxed">
            View and manage your appointments across all barbershops
          </p>
        </div>

        {/* Upcoming Bookings */}
        <section className="mb-12">
          <h2 className="font-bold text-2xl text-foreground mb-6">
            Upcoming Appointments
          </h2>

          {upcomingBookings.length > 0 ? (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-card rounded-xl p-6 md:p-8 border border-primary/50 shadow-lg"
                >
                  <div className="flex flex-col gap-6">
                    {/* Barbershop Info - Prominent */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Store className="w-5 h-5 text-primary" />
                          <h3 className="font-bold text-2xl text-card-foreground">
                            {booking.barbershop?.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-4">
                          <MapPin className="w-4 h-4" />
                          <span className="font-light">{booking.barbershop?.address}</span>
                        </div>
                      </div>
                      <span className="font-bold text-primary text-2xl">
                        {booking.service ? formatPrice(booking.service.price) : "-"}
                      </span>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Appointment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground font-light text-sm mb-2">
                          Service
                        </p>
                        <p className="font-bold text-card-foreground">
                          {booking.service?.name}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground font-light text-sm mb-2">
                          Barber
                        </p>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <p className="font-bold text-card-foreground">
                            {booking.capster?.name}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-muted-foreground font-light text-sm mb-2">
                          Date
                        </p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <p className="font-bold text-card-foreground">
                            {new Date(booking.booking_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-muted-foreground font-light text-sm mb-2">
                          Time
                        </p>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <p className="font-bold text-card-foreground">
                            {booking.booking_time}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                        {booking.status}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                      <Link
                        to={`/barbershop/${booking.barbershop_id}`}
                        className="px-6 py-2.5 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors text-center"
                      >
                        View Barbershop
                      </Link>
                      {booking.status === 'pending' && (
                        <button className="px-6 py-2.5 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl p-12 border border-border text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-bold text-xl text-card-foreground mb-2">
                No Upcoming Appointments
              </h3>
              <p className="text-muted-foreground font-light mb-6 leading-relaxed">
                You don't have any scheduled appointments yet
              </p>
              <Link
                to="/"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors"
              >
                Browse Barbershops
              </Link>
            </div>
          )}
        </section>

        {/* Past Bookings */}
        <section>
          <h2 className="font-bold text-2xl text-foreground mb-6">
            Past Appointments
          </h2>

          {pastBookings.length > 0 ? (
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-card rounded-xl p-6 md:p-8 border border-border opacity-90"
                >
                  <div className="flex flex-col gap-6">
                    {/* Barbershop Info */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Store className="w-5 h-5 text-muted-foreground" />
                          <h3 className="font-bold text-xl text-card-foreground">
                            {booking.barbershop?.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span className="font-light text-sm">
                            {booking.barbershop?.address}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-muted-foreground text-lg">
                        {booking.service ? formatPrice(booking.service.price) : "-"}
                      </span>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Appointment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground font-light text-sm mb-1">
                          Service
                        </p>
                        <p className="text-card-foreground">
                          {booking.service?.name}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground font-light text-sm mb-1">
                          Barber
                        </p>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <p className="text-card-foreground">
                            {booking.capster?.name}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-muted-foreground font-light text-sm mb-1">
                          Date
                        </p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <p className="text-card-foreground">
                            {new Date(booking.booking_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-muted-foreground font-light text-sm mb-1">
                          Time
                        </p>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <p className="text-card-foreground">
                            {booking.booking_time}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                      <Link
                        to={`/barbershop/${booking.barbershop_id}`}
                        className="px-6 py-2.5 border border-border text-card-foreground rounded-lg hover:bg-muted transition-colors text-center"
                      >
                        View Barbershop
                      </Link>
                      <Link
                        to={`/booking?barbershop_id=${booking.barbershop_id}`}
                        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-center"
                      >
                        Book Again
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl p-12 border border-border text-center">
              <p className="text-muted-foreground font-light">
                No past appointments
              </p>
            </div>
          )}
        </section>
        ...

        {/* Contact Info */}
        <section className="mt-16 bg-muted rounded-xl p-8">
          <h3 className="font-bold text-xl text-foreground mb-6">
            Need Help with Your Booking?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-bold text-foreground mb-1">Call Us</p>
                <a
                  href="tel:+15551234567"
                  className="text-muted-foreground font-light text-sm hover:text-primary transition-colors"
                >
                  (555) 123-4567
                </a>
                <p className="text-muted-foreground font-light text-xs mt-1">
                  Mon-Fri 9AM-6PM
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-bold text-foreground mb-1">Email Us</p>
                <a
                  href="mailto:support@barberbrody.com"
                  className="text-muted-foreground font-light text-sm hover:text-primary transition-colors"
                >
                  support@barberbrody.com
                </a>
                <p className="text-muted-foreground font-light text-xs mt-1">
                  24-48 hour response
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Store className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-bold text-foreground mb-1">
                  Contact Barbershop
                </p>
                <p className="text-muted-foreground font-light text-sm">
                  Use the "View Barbershop" button above to find their contact details
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
