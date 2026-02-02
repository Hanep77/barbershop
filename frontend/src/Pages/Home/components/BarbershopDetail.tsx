import { MapPin, Clock, Users, Award } from 'lucide-react';

export default function BarbershopDetail({ barbershop, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-50">
          {barbershop.image_url ? (
            <img
              src={barbershop.image_url}
              alt={barbershop.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300">
              <span className="text-gray-500">No Image</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{barbershop.name}</h2>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-400">★</span>
                <span className="font-semibold">{barbershop.rating}</span>
                <span className="text-gray-500">({barbershop.review_count} ulasan)</span>
              </div>
            </div>
            {barbershop.is_open ? (
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Buka
              </span>
            ) : (
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Tutup
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-start gap-2">
              <MapPin size={18} className="text-blue-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Alamat</p>
                <p className="text-sm font-semibold text-gray-900">{barbershop.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock size={18} className="text-blue-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Jam Operasional</p>
                <p className="text-sm font-semibold text-gray-900">
                  {barbershop.opening_time} - {barbershop.closing_time}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Award size={18} className="text-blue-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Harga</p>
                <p className="text-sm font-semibold text-green-600">
                  Rp{barbershop.min_price.toLocaleString('id-ID')} - Rp{barbershop.max_price.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Users size={18} className="text-blue-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Kontak</p>
                <p className="text-sm font-semibold text-gray-900">{barbershop.phone}</p>
              </div>
            </div>
          </div>

          {barbershop.description && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-1">Deskripsi</h3>
              <p className="text-sm text-gray-600">{barbershop.description}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Chat
            </button>
            <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors">
              Hubungi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
