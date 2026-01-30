import { MapPin, Star } from "lucide-react";
import { useState } from "react"

export default function Home() {
  const [barbershops] = useState([
    {
      name: "Bjir Barber",
      distance: 2.3,
      is_open: true,
      time_open: "09.00",
      time_close: "20.00",
      price: 10000,
      rating: 4.9
    },
    {
      name: "Bjir Barber",
      distance: 2.3,
      is_open: true,
      time_open: "09.00",
      time_close: "20.00",
      price: 10000,
      rating: 4.2
    },
    {
      name: "Bjir Barber",
      distance: 2.3,
      is_open: false,
      time_open: "09.00",
      time_close: "20.00",
      price: 10000,
      rating: 3.2
    },
    {
      name: "Bjir Barber",
      distance: 2.3,
      is_open: true,
      time_open: "09.00",
      time_close: "20.00",
      price: 10000,
      rating: 5
    }
  ]);

  return <div className="">
    <div>
      <h2 className="px-4 pt-4 font-medium text-neutral-600">Paling Dekat</h2>
      <div className="flex gap-4 overflow-x-auto p-4">
        {barbershops.map(barbershop =>
          <div className="shrink-0 bg-white rounded-2xl overflow-hidden w-52 border border-neutral-200 p-2">
            <div className="h-52 bg-neutral-200 rounded-xl">
              <div className="p-2">
                <Star fill="#d08700" color="#d08700" />
              </div>
            </div>
            <div className="p-2 text-neutral-600">
              <div className="flex justify-between">
                <div className="my-2 text-sm">
                  {barbershop.is_open ? <span className="text-green-600 bg-green-600/20 p-1 px-3 rounded-full">buka</span> : <span className="text-red-600 bg-red-600/20 p-1 px-3 rounded-full">tutup</span>}
                </div>
                <p className="flex items-center gap-1 text-sm"><MapPin size={20} /> {barbershop.distance}km</p>
              </div>
              <h4 className="text-neutral-900 text-lg font-medium mb-2">{barbershop.name}</h4>
              <div className="mb-2">
                <p className="text-xs">mulai dari</p>
                <h4 className="text-lg font-medium text-green-600">Rp{barbershop.price}</h4>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
}
