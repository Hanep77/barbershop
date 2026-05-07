import { useState, useEffect } from "react";
import { Calendar, User, MapPin, Store, Loader2, Star, X } from "lucide-react";
import { Link } from "react-router";
import { getUserBookings } from "../../services/booking";
import { createRating } from "../../services/rating";
import type { Booking } from "../../types/booking";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { AxiosError } from "axios";

export function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchBookings = async () => {
      try {
        const res = await getUserBookings();
        if (!isMounted) return;
        const { data } = res.data;
        console.log(data);
        setBookings(data);
      } catch (err) {
        console.error("Error in fetchBookings:", err);
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

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleOpenReviewModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setRating(5);
    setComment("");
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedBooking) return;

    setIsSubmittingReview(true);
    try {
      await createRating({
        barbershop_id: selectedBooking.barbershop_id,
        booking_id: selectedBooking.id,
        rating,
        comment,
      });
      toast.success("Review submitted successfully!");
      setIsReviewModalOpen(false);

      // Refetch bookings after rating submission
      try {
        const res = await getUserBookings();
        setBookings(res.data.data);
      } catch (err) {
        console.error("Error refetching bookings:", err);
      }
    } catch (err: any) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.message || "Failed to submit review");
        console.log(err.response?.data);
        return;
      }
      console.error("Error in handleSubmitReview:", err);
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const upcomingBookings = bookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed",
  );
  const pastBookings = bookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled",
  );

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
        <div className="mb-12">
          <h1 className="font-bold text-4xl text-foreground mb-3">
            My Bookings
          </h1>
          <p className="text-muted-foreground font-light text-lg leading-relaxed">
            View and manage your appointments across all barbershops
          </p>
        </div>

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
                          <span className="font-light">
                            {booking.barbershop?.address}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-primary text-2xl">
                        {booking.service
                          ? formatPrice(booking.service.price)
                          : "-"}
                      </span>
                    </div>
                    <div className="h-px bg-border" />
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
                        <p className="font-bold text-card-foreground">
                          {new Date(booking.booking_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground font-light text-sm mb-2">
                          Time
                        </p>
                        <p className="font-bold text-card-foreground">
                          {booking.booking_time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {booking.status}
                      </span>
                      {booking.status === "pending" ? (
                        <button
                          onClick={() => {
                            navigate(`/checkout?booking_id=${booking.id}`);
                          }}
                          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Complete Payment
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            navigate(`/booking/${booking.id}/cancel`);
                          }}
                          className="px-6 py-2.5 bg-red-500/70 text-white rounded-lg hover:bg-red-500/90 transition-colors"
                        >
                          Cancel Booking
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
              <p className="text-muted-foreground">No upcoming appointments</p>
            </div>
          )}
        </section>

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
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Store className="w-5 h-5 text-muted-foreground" />
                          <h3 className="font-bold text-xl text-card-foreground">
                            {booking.barbershop?.name}
                          </h3>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {booking.barbershop?.address}
                        </p>
                      </div>
                      <span className="font-bold text-muted-foreground text-lg">
                        {booking.service
                          ? formatPrice(booking.service.price)
                          : "-"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">
                          Service:{" "}
                          <span className="text-card-foreground font-medium">
                            {booking.service?.name}
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          Barber:{" "}
                          <span className="text-card-foreground font-medium">
                            {booking.capster?.name}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          Date:{" "}
                          <span className="text-card-foreground font-medium">
                            {new Date(
                              booking.booking_date,
                            ).toLocaleDateString()}
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          Time:{" "}
                          <span className="text-card-foreground font-medium">
                            {booking.booking_time}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border justify-between">
                      <Link
                        to={`/barbershop/${booking.barbershop_id}`}
                        className="px-6 py-2.5 border border-border text-card-foreground rounded-lg hover:bg-muted text-center"
                      >
                        View Barbershop
                      </Link>
                      {booking.status === "completed" && !booking?.rating && (
                        <button
                          onClick={() => handleOpenReviewModal(booking)}
                          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Leave Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl p-12 border border-border text-center">
              <p className="text-muted-foreground">No past appointments</p>
            </div>
          )}
        </section>

        {isReviewModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-2xl p-8 border border-border shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-2xl text-card-foreground">
                  Leave a Review
                </h3>
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  className="p-2 hover:bg-muted rounded-full"
                >
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>
              <div className="mb-6 text-center">
                <p className="text-muted-foreground mb-1 text-sm">
                  How was your experience at
                </p>
                <p className="font-bold text-lg text-primary mb-2">
                  {selectedBooking.barbershop?.name}
                </p>
                <p className="text-xs text-muted-foreground font-light">
                  Barber: {selectedBooking.capster?.name}
                </p>
              </div>
              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} className="p-1">
                    <Star
                      className={`w-10 h-10 ${s <= rating ? "fill-primary text-primary" : "text-muted"}`}
                    />
                  </button>
                ))}
              </div>
              <div className="mb-8">
                <label className="block text-sm font-bold text-card-foreground mb-2">
                  Your Feedback
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full h-32 px-4 py-3 rounded-xl border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                />
              </div>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                {isSubmittingReview && (
                  <Loader2 className="w-5 h-5 animate-spin" />
                )}
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
