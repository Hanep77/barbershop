import api from "../lib/axios";
import type { CreateBookingRequest, Booking } from "../types/booking";

export interface CancelBookingPayload {
  cancellation_reason: string;
}

export interface CancelBookingResponse {
  message: string;
  refund_amount: number;
  refund_status: "none" | "pending" | "success" | "failed";
  booking?: Booking;
}

export const createBooking = (data: CreateBookingRequest) => {
  return api.post("/api/bookings", data);
};

export const getUserBookings = () => {
  return api.get<{ data: Booking[] }>("/api/bookings");
};

export const getBookingById = (bookingId: string) => {
  return api.get<Booking>(`/api/bookings/${bookingId}`);
};

export const getAvailableSlots = (
  barbershopId: string,
  params: { date: string; service_id: string; capster_id: string },
) => {
  return api.get<{ slots: string[] }>(
    `/api/barbershop/${barbershopId}/available-slots`,
    { params },
  );
};

export const getPartnerBookings = () => {
  return api.get<{ data: Booking[] }>("/api/partner/barbershop/bookings");
};

export const updateBookingStatus = (
  bookingId: string,
  status: Booking["status"],
) => {
  return api.put(`/api/partner/barbershop/bookings/${bookingId}/status`, {
    status,
  });
};

export const cancelBooking = (
  bookingId: string,
  payload: CancelBookingPayload,
) => {
  return api.post<CancelBookingResponse>(
    `/api/bookings/${bookingId}/cancel`,
    payload,
  );
};
