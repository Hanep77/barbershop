import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Loader2 } from "lucide-react";
import { getBookingById } from "../../services/booking";
import type { Booking } from "../../types/booking";

export function PaymentReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking_id") || "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      navigate("/my-bookings", { replace: true });
      return;
    }

    let isMounted = true;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await getBookingById(bookingId);

        console.log(response);

        if (!isMounted) return;

        const currentBooking = response.data;
        setBooking(currentBooking);

        if (currentBooking.status === "confirmed") {
          navigate("/my-bookings", { replace: true });
          return;
        }

        if (currentBooking.status === "cancelled") {
          if (isMounted) {
            setError("Pembayaran gagal atau kedaluwarsa. Booking dibatalkan.");
          }
          return;
        }

        attempts += 1;
        if (attempts >= 20) {
          if (isMounted) {
            setError(
              "Pembayaran masih diproses. Silakan cek kembali halaman booking Anda.",
            );
          }
          return;
        }

        window.setTimeout(checkStatus, 3000);
      } catch (err: any) {
        console.error("Error in checkStatus:", err);
        if (!isMounted) return;
        setError(
          err.response?.data?.message || "Gagal mengecek status booking.",
        );
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [bookingId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center">
        {!error ? (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-card-foreground mb-2">
              Memverifikasi pembayaran
            </h1>
            <p className="text-muted-foreground">
              Kami sedang menunggu konfirmasi dari Xendit.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-card-foreground mb-2">
              Status pembayaran
            </h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {booking?.status === "pending" && (
                <Link
                  to={`/checkout?booking_id=${booking.id}`}
                  className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-bold"
                >
                  Coba Lagi
                </Link>
              )}
              <Link
                to="/my-bookings"
                className="px-5 py-3 rounded-lg border border-border text-card-foreground font-bold"
              >
                Lihat Booking
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentReturnPage;
