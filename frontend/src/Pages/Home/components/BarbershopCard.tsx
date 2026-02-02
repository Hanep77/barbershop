import { MapPin, Star, Clock, DollarSign, Phone, MessageCircle } from 'lucide-react';
import type { Barbershop } from '@/types/Barbershop';

interface BarbershopCardProps {
  barbershop: Barbershop;
  onClick?: () => void;
}

export default function BarbershopCard({ barbershop, onClick }: BarbershopCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-[#151820] rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden  cursor-pointer h-full flex flex-col"
    >
      {/* Image */}
      <div className="relative w-full h-40 bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden">
        {barbershop.image_url ? (
          <img
            src={barbershop.image_url}
            alt={barbershop.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-blue-300">No Image</span>
          </div>
        )}
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {barbershop.is_open ? (
            <span className="bg-green-500 text-[#151820] text-xs font-semibold px-3 py-1 rounded-full">
              Buka
            </span>
          ) : (
            <span className="bg-red-500 text-[#151820] text-xs font-semibold px-3 py-1 rounded-full">
              Tutup
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Rating and Reviews */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
            <span className="font-semibold text-gray-900">{barbershop.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-500">({barbershop.review_count} ulasan)</span>
          </div>
        </div>

        {/* Name */}
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
          {barbershop.name}
        </h3>

        {/* Address */}
        <div className="flex items-start gap-2 mb-3 text-sm text-gray-600">
          <MapPin size={16} className="flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">{barbershop.address}</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
          <Clock size={16} />
          <span>{barbershop.opening_time} - {barbershop.closing_time}</span>
        </div>

        {/* Price Range */}
        <div className="flex items-center gap-2 mb-3 text-sm">
          <DollarSign size={16} className="text-green-600" />
          <span className="text-green-600 font-semibold">
            Rp{barbershop.min_price.toLocaleString('id-ID')} - Rp{barbershop.max_price.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto pt-3">
          <button className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-[#151820] text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
            <MessageCircle size={14} />
            Chat
          </button>
          <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
            <Phone size={14} />
            Hubungi
          </button>
        </div>
      </div>
    </div>
  );
}
