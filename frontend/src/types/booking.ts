import type { Barbershop } from "./barbershop";
import type { Service } from "./services";
import type { Capster } from "./capster";
import type { User } from "./auth";

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  status: "pending" | "success" | "failed";
  transaction_id?: string | null;
  payment_method?: string | null;
  payment_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  barbershop_id: string;
  service_id: string;
  capster_id: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_price?: number;
  created_at: string;
  updated_at: string;
  barbershop?: Barbershop;
  service?: Service;
  capster?: Capster;
  user?: User;
  payment?: Payment;
}


export interface CreateBookingRequest {
  barbershop_id: string;
  service_id: string;
  capster_id: string;
  booking_date: string;
  booking_time: string;
}
