import { Link } from "react-router";
import type { Barbershop } from "../../types/barbershop";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { MapPin, Star, Clock, Users } from "lucide-react";

export default function BarbershopCard({ barbershop }: { barbershop: Barbershop }) {
  console.log(barbershop);
  const isOpen = () => {
    if (!barbershop.open_time || !barbershop.close_time) return true;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [openH, openM] = barbershop.open_time.split(':').map(Number);
    const [closeH, closeM] = barbershop.close_time.split(':').map(Number);

    const openTime = openH * 60 + openM;
    const closeTime = closeH * 60 + closeM;

    return currentTime >= openTime && currentTime <= closeTime;
  };

  const status = isOpen();

  return <Link
    key={barbershop.id}
    to={`/barbershop/${barbershop.id}`}
    className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all group flex flex-col h-full shadow-sm hover:shadow-md"
  >
    {/* Cover Image */}
    <div className="relative h-48 overflow-hidden bg-muted">
      <ImageWithFallback
        src={barbershop.coverImage ?? "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop"}
        alt={barbershop.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />

      {/* Status Badge */}
      <div className={`absolute top-4 left-4 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
        {status ? "Open Now" : "Closed"}
      </div>

      {/* Rating Badge */}
      <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1 border border-border shadow-sm">
        <Star className="w-3.5 h-3.5 fill-primary text-primary" />
        <span className="font-bold text-card-foreground text-xs">
          {barbershop.ratings_avg_rating ? parseFloat(String(barbershop.ratings_avg_rating)).toFixed(1) : "New"}
        </span>
      </div>
    </div>

    {/* Content */}
    <div className="p-5 flex flex-col flex-grow">
      <div className="mb-3">
        <h3 className="font-bold text-lg text-card-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
          {barbershop.name}
        </h3>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-light text-xs line-clamp-1">
            {barbershop.address}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
        <Clock className="w-3.5 h-3.5" />
        <span className="text-xs font-light">
          {barbershop.open_time ? String(barbershop.open_time).substring(0, 5) : "09:00"} - {barbershop.close_time ? String(barbershop.close_time).substring(0, 5) : "21:00"}
        </span>
      </div>

      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
        <span className="text-muted-foreground font-light text-xs">
          {barbershop.ratings_count ?? 0} reviews
        </span>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground font-light uppercase leading-none mb-1">Starts from</p>
          <p className="text-primary font-bold text-sm">
            {barbershop.services_min_price
              ? new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(parseFloat(String(barbershop.services_min_price)))
              : "TBA"}
          </p>
        </div>
      </div>
    </div>
  </Link>
}
