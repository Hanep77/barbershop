import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Calendar,
  Clock,
  Loader2,
  MapPin,
  Scissors,
  Store,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { getBookingById } from "../../services/booking";
import { createPayment } from "../../services/payment";
import type { Booking } from "../../types/booking";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);

export function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking_id") || "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPrice = useMemo(() => {
    return Number(
      booking?.total_price ??
        booking?.payment?.amount ??
        booking?.service?.price ??
        0,
    );
  }, [booking]);

  useEffect(() => {
    let isMounted = true;

    const fetchBooking = async () => {
      if (!bookingId) {
        navigate("/my-bookings", { replace: true });
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getBookingById(bookingId);
        if (!isMounted) return;
        setBooking(response.data);
      } catch (err: any) {
        console.error("Error in fetchBooking:", err);
        if (isMounted) {
          setError(err.response?.data?.message || "Booking tidak ditemukan.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBooking();

    return () => {
      isMounted = false;
    };
  }, [bookingId, navigate]);

  const handlePayNow = async () => {
    if (!bookingId) return;

    setPaying(true);
    setError(null);

    try {
      const response = await createPayment(bookingId);
      const paymentUrl = response.data.payment_url;

      if (!paymentUrl) {
        throw new Error("Payment URL tidak tersedia.");
      }

      window.location.href = paymentUrl;
    } catch (err: any) {
      console.error("Failed to create payment:", err);
      const message =
        err.response?.data?.message ||
        err.message ||
        "Gagal membuat pembayaran.";
      setError(message);
      toast.error(message);
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-card-foreground mb-3">
              Checkout tidak tersedia
            </h1>
            <p className="text-muted-foreground mb-6">
              {error || "Booking tidak ditemukan."}
            </p>
            <Link
              to="/my-bookings"
              className="inline-flex px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold"
            >
              Lihat Booking Saya
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="mb-10">
          <h1 className="font-bold text-4xl text-foreground mb-3">Checkout</h1>
          <p className="text-muted-foreground">
            Periksa ringkasan booking sebelum melanjutkan pembayaran.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pb-6 border-b border-border">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Store className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-2xl text-card-foreground">
                  {booking.barbershop?.name}
                </h2>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 mt-1" />
                <span>{booking.barbershop?.address}</span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-yellow-100 text-yellow-700 self-start">
              {booking.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-6">
            <div className="flex gap-3">
              <Scissors className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Service</p>
                <p className="font-bold text-card-foreground">
                  {booking.service?.name}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <User className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Capster</p>
                <p className="font-bold text-card-foreground">
                  {booking.capster?.name}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Calendar className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tanggal</p>
                <p className="font-bold text-card-foreground">
                  {new Date(booking.booking_date).toLocaleDateString("id-ID")}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Jam</p>
                <p className="font-bold text-card-foreground">
                  {booking.booking_time}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total Pembayaran
              </p>
              <p className="text-3xl font-bold text-primary">
                {formatPrice(totalPrice)}
              </p>
            </div>
            <button
              onClick={handlePayNow}
              disabled={paying || booking.status !== "pending"}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              {paying && <Loader2 className="w-5 h-5 animate-spin" />}
              {paying ? "Membuat invoice..." : "Bayar Sekarang"}
            </button>
          </div>

          {error && (
            <p className="mt-4 text-destructive font-medium">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
