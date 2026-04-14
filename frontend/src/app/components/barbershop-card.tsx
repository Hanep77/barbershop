import { Link } from "react-router";
import type { Barbershop } from "../../types/barbershop";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { MapPin, Star } from "lucide-react";

export default function BarbershopCard({ barbershop }: { barbershop: Barbershop }) {
  return <Link
    key={barbershop.id}
    to={`/barbershop/${barbershop.id}`}
    className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all group"
  >
    {/* Cover Image */}
    <div className="relative h-48 overflow-hidden bg-muted">
      <ImageWithFallback
        src={barbershop.coverImage ?? "https://images.unsplash.com/photo-1759134248487-e8baaf31e33e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXJzaG9wJTIwaW50ZXJpb3IlMjBtb2Rlcm58ZW58MXx8fHwxNzczODYyMjk2fDA&ixlib=rb-4.1.0&q=80&w=1080"}
        alt={barbershop.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute top-4 right-4 bg-card px-3 py-1.5 rounded-lg flex items-center gap-1.5">
        <Star className="w-4 h-4 fill-primary text-primary" />
        <span className="font-bold text-card-foreground text-sm">
          {/* {barbershop.rating} */}
        </span>
      </div>
    </div>

    {/* Content */}
    <div className="p-6">
      <h3 className="font-bold text-xl text-card-foreground mb-2">
        {barbershop.name}
      </h3>

      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <MapPin className="w-4 h-4" />
        <span className="font-light text-sm">
          {barbershop.address}
          {/* • {barbershop.distance} */}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-muted-foreground font-light text-sm">
          {/* {barbershop.reviewCount} reviews */}
        </span>
        <span className="text-primary font-bold">
          {/* {barbershop.priceRange} */}
        </span>
      </div>
    </div>
  </Link>
}
