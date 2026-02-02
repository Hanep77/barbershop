export interface Service {
  id?: string;
  barbershopId: string;
  name: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
