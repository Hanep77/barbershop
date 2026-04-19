import api from "../lib/axios";
import type { CreateBookingRequest, Booking } from "../types/booking";

export const createBooking = (data: CreateBookingRequest) => {
  return api.post("/api/bookings", data);
};

export const getUserBookings = () => {
  return api.get<{ data: Booking[] }>("/api/bookings");
};

export const getAvailableSlots = (barbershopId: string, params: { date: string, service_id: string, capster_id: string }) => {
  return api.get<{ slots: string[] }>(`/api/barbershop/${barbershopId}/available-slots`, { params });
};

export const getPartnerBookings = () => {
  return api.get<{ data: Booking[] }>("/api/partner/barbershop/bookings");
};

export const updateBookingStatus = (bookingId: string, status: Booking['status']) => {
  return api.put(`/api/partner/barbershop/bookings/${bookingId}/status`, { status });
};
