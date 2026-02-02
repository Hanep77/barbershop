import type { Barbershop } from '@/types/Barbershop';
import BarbershopCard from './BarbershopCard';

interface BarbershopGridProps {
  barbershops: Barbershop[];
  isLoading: boolean;
  onCardClick?: (barbershop: Barbershop) => void;
}

export default function BarbershopGrid({ barbershops, isLoading, onCardClick }: BarbershopGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-96 animate-pulse" />
        ))}
      </div>
    );
  }

  if (barbershops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-600">Barbershop tidak ditemukan</p>
        <p className="text-sm text-gray-500 mt-1">Coba ubah filter atau pencarian Anda</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {barbershops.map((barbershop) => (
        <BarbershopCard
          key={barbershop.id}
          barbershop={barbershop}
          onClick={() => onCardClick?.(barbershop)}
        />
      ))}
    </div>
  );
}
