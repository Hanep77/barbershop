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
  created_at: Date;
  updated_at: Date;
}

export type CreateBarbershopInput = Omit<
  Barbershop,
  "id" | "created_at" | "updated_at"
>;
export type UpdateBarbershopInput = Partial<
  Omit<Barbershop, "id" | "user_id" | "created_at" | "updated_at">
>;
