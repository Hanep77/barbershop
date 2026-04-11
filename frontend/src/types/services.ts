export type Service = {
  id: string;
  barbershop_id: string;
  name: string;
  price: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type CreateServiceRequest = Omit<
  Service,
  "id" | "created_at" | "updated_at"
>;

export type UpdateServiceRequest = Partial<
  Omit<Service, "id" | "barbershop_id" | "created_at" | "updated_at">
>;
