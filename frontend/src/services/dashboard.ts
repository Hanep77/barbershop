import api from "../lib/axios";

export interface DashboardStats {
  total_bookings: number;
  revenue_this_month: number;
  active_capsters: number;
  average_rating: number;
  today_bookings_count: number;
  revenue_change: number;
  rating_change: number;
  bookings_change: number;
}

export interface UpcomingAppointment {
  id: string;
  customer_name: string;
  service_name: string;
  capster_name: string;
  booking_time: string;
  status: string;
}

export interface RecentBooking {
  id: string;
  customer_name: string;
  service_name: string;
  capster_name: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_price: number;
}

export const getDashboardStats = async () => {
  const response = await api.get<DashboardStats>(
    "/api/partner/barbershop/dashboard/stats",
  );
  return response.data;
};

export const getTodayAppointments = async () => {
  const response = await api.get<{ data: UpcomingAppointment[] }>(
    "/api/partner/barbershop/dashboard/today-appointments",
  );
  return response.data.data;
};

export const getRecentBookings = async () => {
  const response = await api.get<{ data: RecentBooking[] }>(
    "/api/partner/barbershop/dashboard/recent-bookings",
  );
  return response.data.data;
};
