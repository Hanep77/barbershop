export interface Service {
  id?: string;
  barbershop_id: string;
  name: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateServiceFormValues = {
  name: string;
  price: number;
  duration_minutes: number;
};
