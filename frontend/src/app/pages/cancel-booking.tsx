import { useEffect, useMemo, useState, type SubmitEvent } from "react";
import { AxiosError } from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  ReceiptText,
  Scissors,
  ShieldAlert,
  User,
  Wallet,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  cancelBooking as cancelBookingRequest,
  getBookingById,
} from "../../services/booking";
import type { Booking } from "../../types/booking";

const MIN_REASON_LENGTH = 10;

const formatCurrency = (value?: number | null) => {
  if (typeof value !== "number") {
    return "-";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const formatBookingTime = (time: string) => time?.slice(0, 5) || "-";

const getRefundEstimate = (booking: Booking) => {
  const bookingTimeValue =
    booking.booking_time.length === 5
      ? `${booking.booking_time}:00`
      : booking.booking_time;
  const bookingDateTime = new Date(
    `${booking.booking_date}T${bookingTimeValue}`,
  );

  if (Number.isNaN(bookingDateTime.getTime())) {
    return {
      hoursRemaining: null as number | null,
      refundPercent: 0,
      refundAmount: 0,
    };
  }

  const hoursRemaining =
    (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  const refundPercent = hoursRemaining >= 2 ? 50 : 0;
  const baseAmount = booking.payment?.amount ?? booking.total_price ?? 0;

  return {
    hoursRemaining,
    refundPercent,
    refundAmount: refundPercent === 50 ? baseAmount * 0.5 : 0,
  };
};

const getBookingStatusLabel = (status: Booking["status"]) => {
  switch (status) {
    case "pending":
      return "Menunggu Pembayaran";
    case "confirmed":
      return "Terkonfirmasi";
    case "completed":
      return "Selesai";
    case "cancelled":
      return "Dibatalkan";
    default:
      return status;
  }
};

export function CancelBooking() {
  const navigate = useNavigate();
  const { booking_id } = useParams();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [confirmedUnderstanding, setConfirmedUnderstanding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!booking_id) {
      navigate("/my-bookings", { replace: true });
      return;
    }

    let isMounted = true;

    const fetchBooking = async () => {
      try {
        setLoading(true);
        const response = await getBookingById(booking_id);

        if (!isMounted) return;
        setBooking(response.data);
      } catch (err) {
        if (!isMounted) return;

        if (err instanceof AxiosError) {
          const status = err.response?.status;
          const message =
            err.response?.data?.message || "Gagal memuat detail booking.";

          if (status === 401) {
            navigate("/login", { replace: true });
            return;
          }

          setError(message);
        } else {
          setError("Gagal memuat detail booking.");
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
  }, [booking_id, navigate]);

  const isCancelable = useMemo(() => {
    if (!booking) {
      return false;
    }

    return ["pending", "confirmed"].includes(booking.status);
  }, [booking]);

  const refundEstimate = useMemo(() => {
    if (!booking) {
      return null;
    }

    return getRefundEstimate(booking);
  }, [booking]);

  const invalidReason = useMemo(() => {
    if (!booking) {
      return "";
    }

    if (!isCancelable) {
      return "Booking ini tidak dapat dibatalkan karena statusnya sudah final.";
    }

    return "";
  }, [booking, isCancelable]);

  const reasonLength = cancellationReason.trim().length;
  const reasonIsValid = reasonLength >= MIN_REASON_LENGTH;
  const canSubmit =
    isCancelable && reasonIsValid && confirmedUnderstanding && !submitting;

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();

    if (!reasonIsValid) {
      setError(`Alasan pembatalan minimal ${MIN_REASON_LENGTH} karakter.`);
      return;
    }

    if (!confirmedUnderstanding) {
      setError("Centang persetujuan sebelum melanjutkan pembatalan.");
      return;
    }

    if (!isCancelable) {
      setError("Booking tidak dapat dibatalkan.");
      return;
    }

    setError(null);
    setConfirmOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!booking) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await cancelBookingRequest(booking.id, {
        cancellation_reason: cancellationReason.trim(),
      });

      const refundAmount = response.data?.refund_amount ?? 0;
      const refundStatus = response.data?.refund_status ?? "none";
      const message = response.data?.message || "Booking berhasil dibatalkan.";

      toast.success(
        `${message} Refund: ${formatCurrency(refundAmount)} (${refundStatus}).`,
      );
      navigate("/my-bookings", { replace: true });
    } catch (err) {
      if (err instanceof AxiosError) {
        console.log(err?.response?.data)
        const message =
          err.response?.data?.message ||
          "Gagal membatalkan booking. Silakan coba lagi.";
        setError(message);
        toast.error(message);
      } else {
        const message = "Gagal membatalkan booking. Silakan coba lagi.";
        setError(message);
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen py-16 px-6">
        <div className="container mx-auto max-w-3xl">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Gagal memuat booking</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button asChild variant="outline">
            <Link to="/my-bookings">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke riwayat booking
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const estimate = refundEstimate ?? {
    hoursRemaining: null,
    refundPercent: 0,
    refundAmount: 0,
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="container mx-auto">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Cancel Reservation
            </p>
            <h1 className="text-4xl font-bold text-foreground">
              Batalkan Booking
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Tinjau detail booking, baca kebijakan refund, lalu konfirmasi
              pembatalan.
            </p>
          </div>
          <Button asChild variant="outline" className="w-fit">
            <Link to="/my-bookings">
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Link>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Terjadi kesalahan</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold">
                    {booking.barbershop?.name || "Barbershop"}
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {booking.barbershop?.address || "Alamat tidak tersedia"}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={isCancelable ? "default" : "secondary"}>
                    {getBookingStatusLabel(booking.status)}
                  </Badge>
                  <Badge variant="outline">
                    Payment {booking.payment?.status || "-"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Scissors className="w-4 h-4" />
                    <span className="text-sm">Layanan</span>
                  </div>
                  <p className="font-semibold text-card-foreground">
                    {booking.service?.name || "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Kapster</span>
                  </div>
                  <p className="font-semibold text-card-foreground">
                    {booking.capster?.name || "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-sm">Tanggal</span>
                  </div>
                  <p className="font-semibold text-card-foreground">
                    {new Date(booking.booking_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Clock3 className="w-4 h-4" />
                    <span className="text-sm">Jam</span>
                  </div>
                  <p className="font-semibold text-card-foreground">
                    {formatBookingTime(booking.booking_time)}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm">Total Pembayaran</span>
                  </div>
                  <p className="font-semibold text-card-foreground">
                    {formatCurrency(
                      booking.payment?.amount ?? booking.total_price,
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <ReceiptText className="w-4 h-4" />
                    <span className="text-sm">Status Pembayaran</span>
                  </div>
                  <p className="font-semibold text-card-foreground bg-green-100 inline-block px-2 py-1 rounded">
                    {booking.payment?.status || "-"}
                  </p>
                </div>
              </div>

              <Alert className="border-primary/30 bg-primary/5">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Kebijakan pembatalan</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    Booking hanya bisa dibatalkan jika status masih{" "}
                    <span className="font-semibold">pending</span> atau{" "}
                    <span className="font-semibold">confirmed</span>.
                  </p>
                  <p>
                    Jika pembatalan dilakukan minimal 2 jam sebelum jadwal,
                    refund estimasi adalah{" "}
                    <span className="font-semibold">50%</span>.
                  </p>
                  <p>
                    Jika pembatalan dilakukan kurang dari 2 jam sebelum jadwal,
                    refund estimasi adalah{" "}
                    <span className="font-semibold">0%</span>.
                  </p>
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border border-dashed border-border p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-card-foreground">
                      Estimasi refund saat ini
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {estimate.refundPercent > 0
                        ? `Sisa waktu menuju booking masih cukup untuk estimasi refund ${estimate.refundPercent}%. Perkiraan nilai refund: ${formatCurrency(estimate.refundAmount)}.`
                        : "Estimasi refund saat ini 0% karena waktu pembatalan sudah kurang dari 2 jam dari jadwal booking."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold">
                  Alasan Pembatalan
                </CardTitle>
                <CardDescription>
                  Tuliskan alasan pembatalan untuk diproses oleh sistem.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cancellation_reason">
                      Alasan pembatalan
                    </Label>
                    <Textarea
                      id="cancellation_reason"
                      value={cancellationReason}
                      className="text-white"
                      onChange={(event) => {
                        setCancellationReason(event.target.value);
                        if (error) {
                          setError(null);
                        }
                      }}
                      placeholder="Contoh: Saya ada keperluan mendadak sehingga tidak bisa hadir..."
                      minLength={MIN_REASON_LENGTH}
                      rows={5}
                      disabled={submitting || !isCancelable}
                      aria-invalid={
                        !reasonIsValid && cancellationReason.length > 0
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimal {MIN_REASON_LENGTH} karakter. Saat ini{" "}
                      {reasonLength} karakter.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                    <Checkbox
                      id="understand-cancel-policy"
                      checked={confirmedUnderstanding}
                      onCheckedChange={(checked) =>
                        setConfirmedUnderstanding(checked === true)
                      }
                      disabled={submitting || !isCancelable}
                    />
                    <Label
                      htmlFor="understand-cancel-policy"
                      className="text-sm leading-relaxed text-card-foreground"
                    >
                      Saya memahami bahwa pembatalan mengikuti kebijakan refund
                      dan status akhir akan diproses oleh sistem.
                    </Label>
                  </div>

                  {invalidReason && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Booking tidak dapat dibatalkan</AlertTitle>
                      <AlertDescription>{invalidReason}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={!canSubmit}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        "Batalkan Booking"
                      )}
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link to="/my-bookings">Batal</Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Catatan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Sistem hanya mengirim request cancel ke backend. Keputusan
                  final refund tetap mengikuti response server dan webhook
                  Xendit.
                </p>
                <p>
                  Setelah berhasil, Anda akan diarahkan kembali ke daftar
                  booking.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi pembatalan booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Booking akan dibatalkan dan request refund akan dikirim ke
              backend. Pastikan alasan pembatalan sudah sesuai.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={submitting}
            >
              {submitting ? "Memproses..." : "Ya, batalkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default CancelBooking;
