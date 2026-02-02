export interface Barbershop {
    id: number;
    userId?: string;
    name: string;
    address: string;
    mapUrl?: string;
    phone: string;
    phoneNumber?: string;
    description?: string;
    isActive?: boolean;
    is_open?: boolean;
    rating: number;
    review_count: number;
    opening_time: string;
    closing_time: string;
    min_price: number;
    max_price: number;
    distance?: number;
    image_url?: string;
    latitude?: number;
    longitude?: number;
    services?: Service[];
    createdAt?: string;
    updatedAt?: string;
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
