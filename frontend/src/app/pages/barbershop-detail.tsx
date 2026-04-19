import { useParams, Link, useNavigate } from "react-router";
import { MapPin, Phone, Mail, Clock, Star, ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { getBarbershopById } from "../../services/barbershop";
import { getServicesByBarbershopId } from "../../services/service";
import { getCapstersByBarbershopId } from "../../services/capster";
import { getServiceCategoriesByBarbershop } from "../../services/serviceCategory";
import type { Barbershop } from "../../types/barbershop";
import type { Service } from "../../types/services";
import type { Capster } from "../../types/capster";
import type { ServiceCategory } from "../../types/serviceCategory";

export function BarbershopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"services" | "capsters" | "reviews">("services");
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [capsters, setCapsters] = useState<Capster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [shopRes, servicesRes, capstersRes, categoriesRes] = await Promise.all([
          getBarbershopById(id),
          getServicesByBarbershopId(id),
          getCapstersByBarbershopId(id),
          getServiceCategoriesByBarbershop(id)
        ]);

        const shopData: Barbershop = shopRes.data.data || shopRes.data;
        setBarbershop(shopData);

        const sData = servicesRes.data.data || servicesRes.data;
        setServices(Array.isArray(sData) ? sData : []);

        const cData = capstersRes.data.data || capstersRes.data.capsters || capstersRes.data;
        setCapsters(Array.isArray(cData) ? cData : []);

        const catData = categoriesRes.data.categories || categoriesRes.data;
        setCategories(Array.isArray(catData) ? catData : []);

      } catch (err) {
        console.error("Error fetching barbershop details:", err);
        setError("Failed to load barbershop details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !barbershop) {
    console.log(error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-bold text-2xl text-foreground mb-4">
            {error || "Barbershop Not Found"}
          </h2>
          <Link
            to="/"
            className="text-primary hover:text-primary/80 font-bold"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const mockReviews = [
    {
      id: 1,
      customerName: "John Doe",
      rating: 5,
      date: "March 15, 2026",
      comment: "Excellent service! Marcus gave me the best haircut I've had in years. Will definitely be coming back.",
    },
    {
      id: 2,
      customerName: "Michael Smith",
      rating: 5,
      date: "March 10, 2026",
      comment: "Professional atmosphere and skilled barbers. The attention to detail is impressive.",
    },
    {
      id: 3,
      customerName: "David Johnson",
      rating: 4,
      date: "March 5, 2026",
      comment: "Great experience overall. Booking was easy and the cut was exactly what I wanted.",
    },
  ];

  // Helper to format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-light">Back</span>
          </button>
        </div>
      </div>

      {/* Header Section */}
      <section className="relative">
        {/* Cover Image */}
        <div className="relative h-[400px] overflow-hidden bg-muted">
          <ImageWithFallback
            src={barbershop.coverImage}
            alt={barbershop.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        {/* Barbershop Info */}
        <div className="container mx-auto px-6">
          <div className="relative -mt-20 bg-card rounded-xl p-8 border border-border shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-4">
                  <div>
                    <h1 className="font-bold text-4xl text-card-foreground mb-2">
                      {barbershop.name}
                    </h1>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 fill-primary text-primary" />
                        <span className="font-bold text-xl text-card-foreground">
                          {4.9} {/* Default rating since not in backend yet */}
                        </span>
                        <span className="text-muted-foreground font-light">
                          ({120} reviews)
                        </span>
                      </div>
                      <span className="text-primary font-bold text-lg">
                        $$
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground font-light leading-relaxed mb-6 text-lg">
                  {barbershop.description || "No description available."}
                </p>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-card-foreground mb-1">Address</p>
                      <p className="text-muted-foreground font-light text-sm">
                        {barbershop.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-card-foreground mb-1">Hours</p>
                      <p className="text-muted-foreground font-light text-sm">
                        Mon - Fri: 9:00 AM - 8:00 PM
                      </p>
                      <p className="text-muted-foreground font-light text-sm">
                        Sat - Sun: 10:00 AM - 6:00 PM
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-card-foreground mb-1">Phone</p>
                      <a
                        href={`tel:${barbershop.phone_number}`}
                        className="text-muted-foreground font-light text-sm hover:text-primary transition-colors"
                      >
                        {barbershop.phone_number}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Book Now CTA */}
              <div className="lg:w-80 flex-shrink-0">
                <div className="bg-muted rounded-xl p-6 border border-border">
                  <p className="text-muted-foreground font-light mb-4 text-center">
                    Ready to book your appointment?
                  </p>
                  <Link
                    to={`/booking?barbershop_id=${barbershop.id}`}
                    className="block w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg text-center font-bold hover:bg-primary/90 transition-colors"
                  >
                    Book at {barbershop.name.split(" ")[0]}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="container mx-auto px-6 py-12">
        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-border mb-8">
          <button
            onClick={() => setActiveTab("services")}
            className={`px-6 py-3 font-bold transition-colors relative ${activeTab === "services"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Services
            {activeTab === "services" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("capsters")}
            className={`px-6 py-3 font-bold transition-colors relative ${activeTab === "capsters"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Barbers
            {activeTab === "capsters" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-6 py-3 font-bold transition-colors relative ${activeTab === "reviews"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Reviews
            {activeTab === "reviews" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* Services Tab */}
        {activeTab === "services" && (
          <div className="space-y-12">
            {categories.map((category) => (
              <div key={category.id}>
                <h2 className="text-2xl font-bold mb-6 text-card-foreground border-l-4 border-primary pl-4">
                  {category.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.services && category.services.map((service) => (
                    <div
                      key={service.id}
                      className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all flex flex-col"
                    >
                      <h3 className="font-bold text-xl text-card-foreground mb-2">
                        {service.name}
                      </h3>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="font-bold text-2xl text-primary">
                          {formatPrice(service.price)}
                        </span>
                        <span className="text-muted-foreground font-light text-sm">
                          {service.duration_minutes} min
                        </span>
                      </div>
                      <p className="text-muted-foreground font-light leading-relaxed mb-6 flex-grow line-clamp-2">
                        {service.description}
                      </p>
                      <Link
                        to={`/booking?barbershop_id=${barbershop.id}&service_id=${service.id}`}
                        className="block w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg text-center font-bold hover:bg-primary/90 transition-colors"
                      >
                        Book Now
                      </Link>
                    </div>
                  ))}
                  {(!category.services || category.services.length === 0) && (
                    <p className="text-muted-foreground italic">No services in this category.</p>
                  )}
                </div>
              </div>
            ))}

            {/* Services with no category (if any) */}
            {services.filter(s => !s.category_id).length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-card-foreground border-l-4 border-primary pl-4">
                  Other Services
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.filter(s => !s.category_id).map((service) => (
                    <div
                      key={service.id}
                      className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all flex flex-col"
                    >
                      <h3 className="font-bold text-xl text-card-foreground mb-2">
                        {service.name}
                      </h3>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="font-bold text-2xl text-primary">
                          {formatPrice(service.price)}
                        </span>
                        <span className="text-muted-foreground font-light text-sm">
                          {service.duration_minutes} min
                        </span>
                      </div>
                      <p className="text-muted-foreground font-light leading-relaxed mb-6 flex-grow line-clamp-2">
                        {service.description}
                      </p>
                      <Link
                        to={`/booking?barbershop_id=${barbershop.id}&service_id=${service.id}`}
                        className="block w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg text-center font-bold hover:bg-primary/90 transition-colors"
                      >
                        Book Now
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {categories.length === 0 && services.length === 0 && (
              <p className="text-muted-foreground">No services available.</p>
            )}
          </div>
        )}

        {/* Barbers Tab */}
        {activeTab === "capsters" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capsters.map((capster) => (
              <div
                key={capster.id}
                className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all"
              >
                <div className="relative h-80 overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={capster.image}
                    alt={capster.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-card px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="font-bold text-card-foreground">
                      {capster.rating}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-xl text-card-foreground mb-1">
                    {capster.name}
                  </h3>
                  <p className="text-primary font-normal mb-1">{capster.title}</p>
                  <p className="text-muted-foreground font-light text-sm mb-4">
                    {capster.experience} experience
                  </p>

                  <p className="text-muted-foreground font-light leading-relaxed mb-4">
                    {capster.bio}
                  </p>

                  <div className="mb-6">
                    <p className="text-card-foreground font-bold text-sm mb-2">
                      Specialties:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {capster.specialties?.map((specialty) => (
                        <span
                          key={specialty.trim()}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-normal"
                        >
                          {specialty.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    to={`/booking?barbershop_id=${barbershop.id}&barber_id=${capster.id}`}
                    className="block w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg text-center font-bold hover:bg-primary/90 transition-colors"
                  >
                    Book with {capster.name.split(" ")[0]}
                  </Link>
                </div>
              </div>
            ))}
            {capsters.length === 0 && (
              <p className="text-muted-foreground">No barbers available.</p>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="max-w-4xl space-y-6">
            {mockReviews.map((review) => (
              <div
                key={review.id}
                className="bg-card rounded-xl p-6 border border-border"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-card-foreground mb-1">
                      {review.customerName}
                    </h4>
                    <p className="text-muted-foreground font-light text-sm">
                      {review.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.rating
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                          }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground font-light leading-relaxed">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
