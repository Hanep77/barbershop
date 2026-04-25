import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Search as SearchIcon, MapPin, SlidersHorizontal, Sparkles, X, Loader2 } from "lucide-react";
import useBarbershopStore from "../../store/barbershopStore";
import BarbershopCard from "../components/barbershop-card";

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { barbershops, fetchBarbershops, loading } = useBarbershopStore();

  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(
    searchParams.get("specialty")
  );

  const isAIRecommended = searchParams.get("ai_recommended") === "true";

  useEffect(() => {
    fetchBarbershops();
  }, []);

  useEffect(() => {
    // Sync specialty from URL params
    const specialty = searchParams.get("specialty");
    if (specialty) {
      setSelectedSpecialty(specialty);
    }
  }, [searchParams]);

  // Simple client-side filtering for now
  const results = barbershops.filter((shop) => {
    const matchesQuery = shop.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = shop.address.toLowerCase().includes(locationQuery.toLowerCase());
    // Note: specialty filtering is currently limited as it's not well-defined in the backend yet
    return matchesQuery && matchesLocation;
  });

  const clearAIFilter = () => {
    setSelectedSpecialty(null);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-6">
        {/* Search Header */}
        <div className="mb-12">
          <h1 className="font-bold text-4xl text-foreground mb-6">
            Browse Barbershops
          </h1>

          {/* Search Bar */}
          <div className="bg-card rounded-xl p-4 border border-border shadow-lg">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white rounded-lg">
                <SearchIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search barbershop..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-card-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white rounded-lg">
                <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Location..."
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

        {/* Filters and Results */}
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-card rounded-xl p-6 border border-border sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-card-foreground">Filters</h3>
                <button className="text-primary text-sm font-normal hover:text-primary/80" onClick={() => {
                  setSearchQuery("");
                  setLocationQuery("");
                }}>
                  Clear All
                </button>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-bold text-card-foreground mb-3 text-sm">
                  Price Range
                </h4>
                <div className="space-y-2">
                  {["$", "$$", "$$$"].map((price) => (
                    <label key={price} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-muted-foreground font-light">
                        {price}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <h4 className="font-bold text-card-foreground mb-3 text-sm">
                  Minimum Rating
                </h4>
                <div className="space-y-2">
                  {[4.5, 4.0, 3.5].map((rating) => (
                    <label key={rating} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        className="w-4 h-4 border-border text-primary focus:ring-primary"
                      />
                      <Sparkles className="w-4 h-4 fill-primary text-primary" />
                      <span className="text-muted-foreground font-light">
                        {rating}+
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden fixed bottom-6 right-6 z-40 px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filters
          </button>

          {/* Results Grid */}
          <div className="flex-1">
            {/* AI Recommendation Banner */}
            {isAIRecommended && selectedSpecialty && (
              <div className="mb-6 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-2 border-primary/50 rounded-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
                        AI-Recommended Barbershops
                        <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full font-bold">
                          AI
                        </span>
                      </h3>
                      <p className="text-muted-foreground font-light text-sm">
                        Showing barbershops that specialize in{" "}
                        <span className="text-primary font-bold">{selectedSpecialty}</span> styles,
                        based on your AI consultation results.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearAIFilter}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground font-light">
                Found <span className="font-bold text-foreground">{results.length}</span> barbershops
              </p>
              <select className="px-4 py-2 bg-card border border-border rounded-lg text-card-foreground font-light focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Sort by: Recommended</option>
                <option>Sort by: Rating</option>
                <option>Sort by: Price</option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {results.map((barbershop) => (
                  <BarbershopCard key={barbershop.id} barbershop={barbershop} />
                ))}
              </div>
            )}
            {!loading && results.length === 0 && (
              <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
                <p className="text-muted-foreground">No barbershops found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}