import type { Service } from "./services";

export type ServiceCategory = {
  id: string;
  name: string;
  barbershop_id: string;
  services: Service[];
};

export type CreateServiceCategoryRequest = Omit<
  ServiceCategory,
  "id" | "created_at" | "updated_at" | "barbershop_id" | "services"
>;

export type UpdateServiceCategoryRequest = Partial<
  Omit<
    ServiceCategory,
    "id" | "created_at" | "updated_at" | "barbershop_id" | "services"
  >
>;
