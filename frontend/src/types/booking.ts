import type { Barbershop } from "./barbershop";
import type { Service } from "./services";
import type { Capster } from "./capster";
import type { User } from "./auth";

export interface Booking {
  id: string;
  user_id: string;
  barbershop_id: string;
  service_id: string;
  capster_id: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  barbershop?: Barbershop;
  service?: Service;
  capster?: Capster;
  user?: User;
}


export interface CreateBookingRequest {
  barbershop_id: string;
  service_id: string;
  capster_id: string;
  booking_date: string;
  booking_time: string;
}
