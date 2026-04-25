import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Search, MapPin, Star, TrendingUp, Scissors, Award, Sparkles } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import useBarbershopStore from "../../store/barbershopStore";
import BarbershopCard from "../components/barbershop-card";

export function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const { barbershops, fetchBarbershops } = useBarbershopStore();

  useEffect(() => {
    fetchBarbershops();
  }, [])

  const categories = [
    { name: "Classic Cuts", icon: Scissors },
    { name: "Beard Grooming", icon: Award },
    { name: "Premium Service", icon: Star },
    { name: "Quick Trims", icon: TrendingUp },
  ];

  return (
    <div>
      {/* Hero Section with Search */}
      <section className="relative bg-background py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1759134248487-e8baaf31e33e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXJzaG9wJTIwaW50ZXJpb3IlMjBtb2Rlcm58ZW58MXx8fHwxNzczODYyMjk2fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Barbershop"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-bold mb-6 tracking-tight text-foreground" style={{ fontSize: '4rem', lineHeight: '1.1' }}>
              Find Your Perfect
              <br />
              <span className="text-primary">Barbershop</span>
            </h1>
            <p className="text-xl text-muted-foreground font-light mb-12 leading-relaxed">
              Discover and book premium barbershops near you. Compare services, read reviews, and get groomed.
            </p>

            {/* Search Bar */}
            <div className="bg-card rounded-xl p-3 border border-border shadow-lg">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white rounded-lg">
                  <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search barbershop or service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-card-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white rounded-lg">
                  <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Location or zip code..."
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="w-full bg-transparent text-card-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
                <button className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors whitespace-nowrap">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Consultant CTA Banner */}
      <section className="container mx-auto px-6 -mt-12 relative z-20">
        <Link
          to="/ai-consultant"
          className="block bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-2 border-primary/50 rounded-xl p-8 hover:border-primary transition-all group"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-bold text-2xl text-foreground mb-2 flex items-center gap-2 justify-center md:justify-start">
                Try Our AI Visual Consultant
                <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full font-bold">NEW</span>
              </h3>
              <p className="text-muted-foreground font-light leading-relaxed">
                Let AI analyze your face shape and recommend the perfect hairstyles tailored just for you. Get personalized suggestions in seconds!
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold group-hover:bg-primary/90 transition-colors">
                Try Now
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* Popular Categories */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="font-bold text-3xl text-foreground mb-8 text-center">
          Popular Categories
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.name}
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all text-center group"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-card-foreground">{category.name}</h3>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recommended Barbershops */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-bold text-3xl text-foreground">
              Recommended Barbershops Near You
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbershops.map((barbershop) => (
              <BarbershopCard barbershop={barbershop} key={barbershop.id} />
            ))}
          </div>
        </div>
      </section>

      {/* Top Rated Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-bold text-3xl text-foreground">
            Top Rated Barbershops
          </h2>
          <Link
            to="/search"
            className="text-primary hover:text-primary/80 font-bold transition-colors"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbershops.map((barbershop) => (
            <BarbershopCard barbershop={barbershop} key={barbershop.id} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-6">
          <h2 className="font-bold text-3xl text-foreground mb-12 text-center">
            How BarberBrody Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
                1
              </div>
              <h3 className="font-bold text-foreground mb-3 text-xl">
                Search & Discover
              </h3>
              <p className="text-muted-foreground font-light leading-relaxed">
                Browse barbershops near you, compare ratings, services, and prices to find your perfect match.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
                2
              </div>
              <h3 className="font-bold text-foreground mb-3 text-xl">
                Book Online
              </h3>
              <p className="text-muted-foreground font-light leading-relaxed">
                Choose your service, select your preferred barber, and pick a convenient time slot in seconds.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
                3
              </div>
              <h3 className="font-bold text-foreground mb-3 text-xl">
                Get Groomed
              </h3>
              <p className="text-muted-foreground font-light leading-relaxed">
                Show up at your appointment and enjoy a premium grooming experience. Rate your visit afterward.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="bg-card rounded-xl p-12 md:p-16 text-center border border-border">
          <h2 className="font-bold mb-6 text-card-foreground" style={{ fontSize: '2.5rem' }}>
            Ready to Find Your Barber?
          </h2>
          <p className="text-muted-foreground font-light mb-8 text-lg max-w-2xl mx-auto leading-relaxed">
            Join thousands of satisfied customers who book their grooming appointments through BarberBrody.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/register"
              className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors"
            >
              Sign Up Now
            </Link>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-block px-8 py-4 bg-card text-card-foreground rounded-lg font-bold hover:bg-muted transition-colors border border-border"
            >
              Browse Barbershops
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
