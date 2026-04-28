import api from "../lib/axios";
import type { Payment } from "../types/booking";

export const createPayment = (bookingId: string) => {
  return api.post<{ payment_url: string }>("/api/payments/create", {
    booking_id: bookingId,
  });
};

export const getPaymentByBooking = (bookingId: string) => {
  return api.get<Payment>(`/api/payments/${bookingId}`);
};
