import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { getBookingById } from "../../services/booking";
import type { Booking } from "../../types/booking";

export function PaymentReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking_id") || "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying",
  );
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

        if (!isMounted) return;

        const currentBooking = response.data;
        setBooking(currentBooking);

        if (currentBooking.status === "confirmed") {
          setStatus("success");
          setTimeout(() => {
            if (isMounted) navigate("/my-bookings", { replace: true });
          }, 3000);
          return;
        }

        if (currentBooking.status === "cancelled") {
          setStatus("error");
          setError("Pembayaran gagal atau kedaluwarsa. Booking dibatalkan.");
          return;
        }

        attempts += 1;
        if (attempts >= 20) {
          setStatus("error");
          setError(
            "Pembayaran masih diproses. Silakan cek kembali halaman booking Anda.",
          );
          return;
        }

        window.setTimeout(checkStatus, 3000);
      } catch (err: any) {
        console.error("Error in checkStatus:", err);
        if (!isMounted) return;
        setStatus("error");
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
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center shadow-xl">
        {status === "verifying" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-card-foreground mb-2">
              Memverifikasi Pembayaran
            </h1>
            <p className="text-muted-foreground">
              Kami sedang menunggu konfirmasi dari Xendit. Mohon tunggu sebentar...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-card-foreground mb-2">
              Pembayaran Berhasil!
            </h1>
            <p className="text-muted-foreground mb-6">
              Terima kasih! Pembayaran Anda telah kami terima dan booking telah dikonfirmasi.
            </p>
            <p className="text-sm text-muted-foreground animate-pulse">
              Mengalihkan ke halaman booking Anda...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-card-foreground mb-2">
              Status Pembayaran
            </h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {booking?.status === "pending" && (
                <Link
                  to={`/checkout?booking_id=${booking.id}`}
                  className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
                >
                  Coba Lagi
                </Link>
              )}
              <Link
                to="/my-bookings"
                className="px-5 py-3 rounded-lg border border-border text-card-foreground font-bold hover:bg-muted transition-colors"
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
