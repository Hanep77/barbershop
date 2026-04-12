import type { ServiceCategory } from "./serviceCategory";

export type Service = {
  id: string;
  barbershop_id: string;
  name: string;
  description: string | null;
  category_id: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  category: ServiceCategory;
};

export type CreateServiceRequest = Omit<
  Service,
  | "id"
  | "created_at"
  | "updated_at"
  | "category"
  | "barbershop_id"
  | "is_active"
>;

export type UpdateServiceRequest = Partial<
  Omit<Service, "id" | "barbershop_id" | "created_at" | "updated_at">
>;
