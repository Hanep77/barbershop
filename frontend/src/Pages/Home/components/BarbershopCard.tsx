import { MapPin, Star } from 'lucide-react';
import type { Barbershop } from '@/types/Barbershop';

interface BarbershopCardProps {
  barbershop: Barbershop;
  onClick?: () => void;
}

export default function BarbershopCard({ barbershop, onClick }: BarbershopCardProps) {
  return (
      <div className="shrink-0 bg-[#151820] rounded-2xl overflow-hidden xl:w-72 w-52 border border-neutral-200 p-2" onClick={onClick}>
            <div className="xl:h-72 h-52 bg-neutral-200 rounded-xl">
              <div className="p-2">
                <Star fill="#d08700" color="#d08700" />
              </div>
            </div>
            <div className="p-2 text-white">
              <div className="flex justify-between">
                <div className="my-2 text-sm">
                  {barbershop.is_active ? <span className="text-green-600 bg-green-600/20 p-1 px-3 rounded-full">Buka</span> : <span className="text-red-600 bg-red-600/20 p-1 px-3 rounded-full">Tutup</span>}
                </div>
                <p className="flex items-center gap-1 text-sm"><MapPin size={20} /> {0}km</p>
              </div>
              <h4 className="text-white text-lg font-medium mb-2">{ barbershop.name}</h4>
              <div className="mb-2">
                <p className="text-xs">mulai dari</p>
                <h4 className="text-lg font-medium text-green-600">Rp 12000</h4>
              </div>
            </div>
          </div>
  );
}
