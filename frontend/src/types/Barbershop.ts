export interface Barbershop {
  id?: string;
  user_id?: string;
  name: string;
  address: string;
  map_url?: string;
  phone_number: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Service {
    id: number;
    name: string;
    duration: number;
    price: number;
    description?: string;
    barbershop_id?: number;
}

export interface FilterOptions {
    search: string;
    minRating: number;
    maxPrice: number;
    sortBy: 'rating' | 'price' | 'distance' | 'name';
    isOpen: boolean | null;
}
