import type { Capster } from "./capster";
import type { Service } from "./services";

export interface Barbershop {
  id: string;
  user_id: string;
  name: string;
  address: string;
  map_url: string | null;
  phone_number: string;
  description: string | null;
  is_active: boolean;
  latitude: string;
  longitude: string;
  coverImage: string;
  created_at: Date;
  updated_at: Date;
  ratings_avg_rating?: number | null;
  ratings_count?: number;
  capsters_count?: number;
  services_min_price?: number | null;
  open_time?: string;
  close_time?: string;
  capsters?: Capster[];
  services?: Service[];
}

export type CreateBarbershopInput = Omit<
  Barbershop,
  "id" | "created_at" | "updated_at"
>;
export type UpdateBarbershopInput = Partial<
  Omit<Barbershop, "id" | "user_id" | "created_at" | "updated_at">
>;
