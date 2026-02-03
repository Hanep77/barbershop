import { useState } from 'react';
import BarbershopGrid from '@/Pages/Home/components/BarbershopGrid';
import type { Barbershop, FilterOptions } from '@/types/Barbershop';
import { useLoadingBar } from 'react-top-loading-bar';

// Mock data - akan diganti dengan API call
const mockBarbershops: Barbershop[] = [
  {
    id: 1,
    name: 'Bjir Barber - Premium',
    address: 'Jl. Diponegoro No. 123, Jakarta Pusat',
    phone: '+62 21 1234567',
    description: 'Barbershop premium dengan layanan terbaik dan barber profesional',
    rating: 4.9,
    review_count: 128,
    opening_time: '09:00',
    closing_time: '21:00',
    is_open: true,
    min_price: 50000,
    max_price: 150000,
    distance: 2.3,
    image_url: 'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=400&h=300&fit=crop',
  },
  {
    id: 2,
    name: 'The Barber Shop',
    address: 'Jl. Gatot Subroto No. 456, Jakarta Selatan',
    phone: '+62 21 2345678',
    description: 'Barbershop modern dengan tren terkini dan suasana nyaman',
    rating: 4.7,
    review_count: 95,
    opening_time: '10:00',
    closing_time: '20:00',
    is_open: true,
    min_price: 40000,
    max_price: 120000,
    distance: 3.1,
    image_url: 'https://images.unsplash.com/photo-1504222226556-cf4ee9fd35a7?w=400&h=300&fit=crop',
  },
  {
    id: 3,
    name: 'Gentleman Barber',
    address: 'Jl. Sudirman No. 789, Jakarta Pusat',
    phone: '+62 21 3456789',
    description: 'Barbershop klasik dengan sentuhan modern dan fasilitas premium',
    rating: 4.5,
    review_count: 87,
    opening_time: '08:00',
    closing_time: '19:00',
    is_open: false,
    min_price: 35000,
    max_price: 100000,
    distance: 1.8,
    image_url: 'https://images.unsplash.com/photo-1599504347989-b6b90d84c22c?w=400&h=300&fit=crop',
  },
  {
    id: 4,
    name: 'Salon Potong Rapi',
    address: 'Jl. Ahmad Yani No. 101, Bekasi',
    phone: '+62 21 4567890',
    description: 'Salon terpercaya dengan harga terjangkau dan pelayanan ramah',
    rating: 4.3,
    review_count: 156,
    opening_time: '09:00',
    closing_time: '20:00',
    is_open: true,
    min_price: 25000,
    max_price: 75000,
    distance: 5.2,
    image_url: 'https://images.unsplash.com/photo-1576868553619-2b9397cf1dba?w=400&h=300&fit=crop',
  },
  {
    id: 5,
    name: 'Modern Barbershop',
    address: 'Jl. Jend. Sudirman No. 222, Jakarta Barat',
    phone: '+62 21 5678901',
    description: 'Barbershop dengan fasilitas lengkap dan nyaman untuk relaksasi',
    rating: 4.8,
    review_count: 112,
    opening_time: '09:30',
    closing_time: '21:30',
    is_open: true,
    min_price: 45000,
    max_price: 130000,
    distance: 4.5,
    image_url: 'https://images.unsplash.com/photo-1621905251888-48416bd8575a?w=400&h=300&fit=crop',
  },
  {
    id: 6,
    name: 'Cutting Edge Barber',
    address: 'Jl. Soemantri Brodjonegoro No. 333, Jakarta Selatan',
    phone: '+62 21 6789012',
    description: 'Barbershop trendi dengan barber profesional dan inovasi terbaru',
    rating: 4.6,
    review_count: 78,
    opening_time: '10:00',
    closing_time: '21:00',
    is_open: true,
    min_price: 55000,
    max_price: 140000,
    distance: 2.7,
    image_url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop',
  },
  {
    id: 7,
    name: 'Barbershop Minimalis',
    address: 'Jl. Imam Bonjol No. 444, Jakarta Pusat',
    phone: '+62 21 7890123',
    description: 'Barbershop sederhana dengan hasil maksimal dan harga terjangkau',
    rating: 4.4,
    review_count: 64,
    opening_time: '09:00',
    closing_time: '18:00',
    is_open: true,
    min_price: 30000,
    max_price: 80000,
    distance: 3.3,
    image_url: 'https://images.unsplash.com/photo-1605286372967-d06dbb5d0c90?w=400&h=300&fit=crop',
  },
  {
    id: 8,
    name: 'Prestige Barber',
    address: 'Jl. Menteng Raya No. 555, Jakarta Pusat',
    phone: '+62 21 8901234',
    description: 'Barbershop eksklusif untuk pria modern dengan layanan VIP',
    rating: 5.0,
    review_count: 142,
    opening_time: '11:00',
    closing_time: '22:00',
    is_open: true,
    min_price: 100000,
    max_price: 200000,
    distance: 4.1,
    image_url: 'https://images.unsplash.com/photo-1512941691920-25bda97eb744?w=400&h=300&fit=crop',
  },
];

export default function Home() {
  // const [barbershops, setBarbershops] = useState<Barbershop[]>(mockBarbershops);
  const [filteredBarbershops, setFilteredBarbershops] = useState<Barbershop[]>(mockBarbershops);
  const [isLoading, setIsLoading] = useState(false);
  // const [activeCategory, setActiveCategory] = useState('semua');
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    minRating: 0,
    maxPrice: 500000,
    sortBy: 'rating',
    isOpen: null,
  });


  // Fetch barbershops dari API (uncomment ketika API siap)
  // useEffect(() => {
  //   fetchBarbershops();
  // }, []);

  // const fetchBarbershops = async () => {
  //   setIsLoading(true);
  //   try {
  //     const response = await fetch('http://localhost:8000/api/barbershop');
  //     if (response.ok) {
  //       const data = await response.json();
  //       setBarbershops(data);
  //       setFilteredBarbershops(data);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching barbershops:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };


  const handleBarbershopClick = (barbershop: Barbershop) => {
    // TODO: Redirect ke halaman detail barbershop
    console.log('Clicked barbershop:', barbershop);
  };

  return (
    <div className="min-h-screen bg-gray-700">
      {/* Barbershop Grid */}
      <div className="container mx-auto">
        <BarbershopGrid
          barbershops={filteredBarbershops}
          isLoading={isLoading}
          onCardClick={handleBarbershopClick}
        />
      </div>

    </div>
  );
}
