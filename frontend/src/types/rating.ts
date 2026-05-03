import type { User } from "./auth";

export interface Rating {
  id: number;
  user_id: string;
  barbershop_id: string;
  capster_id: string;
  booking_id: number | null;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface CreateRatingRequest {
  barbershop_id: string;
  booking_id?: string | number;
  rating: number;
  comment?: string;
}
