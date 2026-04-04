import { useState } from "react";
import { Calendar, Clock, User, MapPin, Phone, Mail, Store } from "lucide-react";
import { Link } from "react-router";
import { mockBookings } from "../data/marketplace-data";

export function MyBookings() {
  const [bookings] = useState(mockBookings);

  const upcomingBookings = bookings.filter((b) => b.status === "upcoming");
  const pastBookings = bookings.filter((b) => b.status === "completed");

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
                            {booking.barbershopName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-4">
                          <MapPin className="w-4 h-4" />
                          <span className="font-light">{booking.barbershopLocation}</span>
                        </div>
                      </div>
                      <span className="font-bold text-primary text-2xl">
                        {booking.price}
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
                          {booking.service}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground font-light text-sm mb-2">
                          Barber
                        </p>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <p className="font-bold text-card-foreground">
                            {booking.barber}
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
                            {booking.date}
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
                            {booking.time}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                      <Link
                        to={`/barbershop/${booking.barbershopId}`}
                        className="px-6 py-2.5 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors text-center"
                      >
                        View Barbershop
                      </Link>
                      <button className="px-6 py-2.5 border border-border rounded-lg text-card-foreground hover:bg-muted transition-colors">
                        Reschedule
                      </button>
                      <button className="px-6 py-2.5 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
                        Cancel
                      </button>
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
                            {booking.barbershopName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span className="font-light text-sm">
                            {booking.barbershopLocation}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-muted-foreground text-lg">
                        {booking.price}
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
                          {booking.service}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground font-light text-sm mb-1">
                          Barber
                        </p>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <p className="text-card-foreground">
                            {booking.barber}
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
                            {booking.date}
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
                            {booking.time}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                      <Link
                        to={`/barbershop/${booking.barbershopId}`}
                        className="px-6 py-2.5 border border-border text-card-foreground rounded-lg hover:bg-muted transition-colors text-center"
                      >
                        View Barbershop
                      </Link>
                      <Link
                        to={`/booking?barbershop_id=${booking.barbershopId}`}
                        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-center"
                      >
                        Book Again
                      </Link>
                      <button className="px-6 py-2.5 border border-border text-card-foreground rounded-lg hover:bg-muted transition-colors">
                        Leave Review
                      </button>
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
