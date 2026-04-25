export type Capster = {
  id: string;
  barbershopId: string;
  name: string;
  title: string;
  experience: string;
  rating: number;
  specialties: string[];
  bio: string;
  phone: string;
  is_available: boolean;
  image: string;
};

export type CapsterCreateRequest = Omit<
  Capster,
  "id" | "barbershopId" | "rating"
>;

export type CapsterUpdateRequest = Partial<
  Omit<Capster, "id" | "barbershopId" | "rating">
>;
