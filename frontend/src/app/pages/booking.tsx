import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Calendar, Clock, User, Scissors, CheckCircle, ChevronRight, MapPin, Loader2 } from "lucide-react";
import { Calendar as CalendarComponent } from "../components/ui/calendar";
import { getBarbershopById } from "../../services/barbershop";
import { getServicesByBarbershopId } from "../../services/service";
import { getCapstersByBarbershopId } from "../../services/capster";
import { createBooking, getAvailableSlots } from "../../services/booking";
import type { Barbershop } from "../../types/barbershop";
import type { Service } from "../../types/services";
import type { Capster } from "../../types/capster";

export function Booking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const barbershopId = searchParams.get("barbershop_id") || "";
  const preSelectedServiceId = searchParams.get("service_id") || "";
  const preSelectedBarberId = searchParams.get("barber_id") || "";

  const [step, setStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState(preSelectedServiceId);
  const [selectedBarberId, setSelectedBarberId] = useState(preSelectedBarberId);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Capster[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !selectedServiceId || !selectedBarberId || selectedBarberId === "No Preference") {
        setAvailableSlots([]);
        return;
      }
      setLoadingSlots(true);
      try {
        const formattedDate = selectedDate.toISOString().split('T')[0];
        const res = await getAvailableSlots(barbershopId, {
          date: formattedDate,
          service_id: selectedServiceId,
          capster_id: selectedBarberId
        });
        setAvailableSlots(res.data.slots);
      } catch (err) {
        console.error("Error fetching slots:", err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, selectedServiceId, selectedBarberId, barbershopId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!barbershopId) {
        navigate("/");
        return;
      }
      setLoading(true);
      try {
        const shopRes = await getBarbershopById(barbershopId);
        const shopData: Barbershop = shopRes.data.data || shopRes.data;
        setBarbershop(shopData);

        if (shopData.services) {
          setServices(shopData.services);
        } else {
          const servicesRes = await getServicesByBarbershopId(barbershopId);
          const sData = servicesRes.data.data || servicesRes.data;
          setServices(Array.isArray(sData) ? sData : []);
        }

        if (shopData.capsters) {
          setBarbers(shopData.capsters);
        } else {
          const barbersRes = await getCapstersByBarbershopId(barbershopId);
          const bData = barbersRes.data.data || barbersRes.data;
          setBarbers(Array.isArray(bData) ? bData : []);
        }
      } catch (err) {
        console.error("Error fetching booking data:", err);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [barbershopId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!barbershop) {
    return null;
  }

  const handleBooking = async () => {
    if (!selectedServiceId || !selectedBarberId || !selectedDate || !selectedTime) {
      setError("Please complete all booking steps.");
      return;
    }

    if (selectedBarberId === "No Preference") {
        setError("Please select a specific barber for now.");
        return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      await createBooking({
        barbershop_id: barbershopId,
        service_id: selectedServiceId,
        capster_id: selectedBarberId,
        booking_date: formattedDate,
        booking_time: selectedTime,
      });
      navigate("/my-bookings");
    } catch (err: any) {
      console.error("Booking failed:", err);
      setError(err.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedServiceId !== "";
      case 2:
        return selectedBarberId !== "" && selectedBarberId !== "No Preference";
      case 3:
        return selectedDate !== undefined && selectedTime !== "";
      case 4:
        return customerName !== "" && customerEmail !== "" && customerPhone !== "";
      default:
        return false;
    }
  };

  const steps = [
    { number: 1, label: "Service", icon: Scissors },
    { number: 2, label: "Barber", icon: User },
    { number: 3, label: "Date & Time", icon: Calendar },
    { number: 4, label: "Details", icon: CheckCircle },
  ];

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedBarber = selectedBarberId === "No Preference"
    ? { name: "No Preference" }
    : barbers.find((b) => b.id === selectedBarberId);

  // Helper to format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Barbershop Header */}
        <div className="mb-8 text-center">
          <h1 className="font-bold text-4xl text-foreground mb-2">
            Book at {barbershop.name}
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="font-light">{barbershop.address}</span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {steps.map((s, index) => {
              const Icon = s.icon;
              return (
                <div key={s.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${step >= s.number
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-sm font-light hidden md:block ${step >= s.number ? "text-foreground" : "text-muted-foreground"
                        }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground mx-2 md:mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-xl p-8 md:p-12 border border-border">
          {/* Step 1: Select Service */}
          {step === 1 && (
            <div>
              <h2 className="font-bold text-3xl text-card-foreground mb-3">
                Choose Your Service
              </h2>
              <p className="text-muted-foreground font-light mb-8 leading-relaxed">
                Select from services offered at {barbershop.name}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${selectedServiceId === service.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                      }`}
                  >
                    <h3 className="font-bold text-lg text-card-foreground mb-2">
                      {service.name}
                    </h3>
                    <div className="flex items-center gap-3 text-muted-foreground mb-2">
                      <span className="font-bold text-primary">{formatPrice(service.price)}</span>
                      <span className="font-light">{service.duration_minutes} min</span>
                    </div>
                    <p className="text-muted-foreground font-light text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </button>
                ))}
                {services.length === 0 && (
                  <p className="text-muted-foreground col-span-2 text-center py-10">No services available.</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Select Barber */}
          {step === 2 && (
            <div>
              <h2 className="font-bold text-3xl text-card-foreground mb-3">
                Choose Your Barber
              </h2>
              <p className="text-muted-foreground font-light mb-8 leading-relaxed">
                Select your preferred barber at {barbershop.name} or choose "No Preference"
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedBarberId("No Preference")}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${selectedBarberId === "No Preference"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                    }`}
                >
                  <h3 className="font-bold text-lg text-card-foreground mb-1">
                    No Preference
                  </h3>
                  <p className="text-muted-foreground font-light text-sm">
                    Next available barber
                  </p>
                </button>

                {barbers.map((barber) => (
                  <button
                    key={barber.id}
                    onClick={() => setSelectedBarberId(barber.id)}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${selectedBarberId === barber.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                      }`}
                  >
                    <h3 className="font-bold text-lg text-card-foreground mb-1">
                      {barber.name}
                    </h3>
                    <p className="text-muted-foreground font-light text-sm mb-2">
                      {barber.title}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(barber.specialties)
                        ? barber.specialties
                        : (barber.specialties || "").split(",")
                      ).slice(0, 2).map((specialty) => (
                        <span
                          key={specialty.trim()}
                          className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs"
                        >
                          {specialty.trim()}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Select Date & Time */}
          {step === 3 && (
            <div>
              <h2 className="font-bold text-3xl text-card-foreground mb-3">
                Pick Date & Time
              </h2>
              <p className="text-muted-foreground font-light mb-8 leading-relaxed">
                Choose your preferred appointment date and time
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calendar */}
                <div>
                  <h3 className="font-bold text-card-foreground mb-4">
                    Select Date
                  </h3>
                  <div className="flex justify-center">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      className="rounded-xl border border-border"
                    />
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <h3 className="font-bold text-card-foreground mb-4">
                    Select Time
                  </h3>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-2">
                      {availableSlots.length > 0 ? (
                        availableSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`p-3 rounded-lg border text-sm transition-all ${selectedTime === time
                              ? "border-primary bg-primary text-primary-foreground font-bold"
                              : "border-border text-card-foreground hover:border-primary/50 hover:bg-primary/5"
                              }`}
                          >
                            {time}
                          </button>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm col-span-3 text-center py-4">
                          {selectedDate ? "No slots available." : "Please select a date first"}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Customer Details */}
          {step === 4 && (
            <div>
              <h2 className="font-bold text-3xl text-card-foreground mb-3">
                Your Details
              </h2>
              <p className="text-muted-foreground font-light mb-8 leading-relaxed">
                Enter your information to confirm your booking
              </p>

              <div className="max-w-xl space-y-6">
                <div>
                  <label className="block text-card-foreground font-bold mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-card-foreground font-bold mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-card-foreground font-bold mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Booking Summary */}
                <div className="mt-8 p-6 bg-muted rounded-xl border border-border">
                  <h3 className="font-bold text-foreground mb-4">
                    Booking Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground font-light">Barbershop:</span>
                      <div className="text-right">
                        <span className="text-foreground font-bold block">
                          {barbershop.name}
                        </span>
                        <span className="text-muted-foreground text-sm font-light">
                          {barbershop.address}
                        </span>
                      </div>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-light">Service:</span>
                      <span className="text-foreground font-normal">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-light">Barber:</span>
                      <span className="text-foreground font-normal">{selectedBarber?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-light">Date:</span>
                      <span className="text-foreground font-normal">
                        {selectedDate?.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-light">Time:</span>
                      <span className="text-foreground font-normal">{selectedTime}</span>
                    </div>
                    {selectedService && (
                      <>
                        <div className="h-px bg-border" />
                        <div className="flex justify-between items-center">
                          <span className="text-foreground font-bold">Total:</span>
                          <span className="text-primary font-bold text-xl">
                            {formatPrice(selectedService.price)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-12">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 border border-border rounded-lg text-card-foreground hover:bg-muted transition-colors"
              >
                Back
              </button>
            )}

            <button
              onClick={() => {
                if (step < 4) {
                  setStep(step + 1);
                } else {
                  handleBooking();
                }
              }}
              disabled={!canProceed() || submitting}
              className={`px-8 py-3 rounded-lg font-bold transition-colors ml-auto flex items-center gap-2 ${canProceed() && !submitting
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {step === 4 ? (submitting ? "Confirming..." : "Confirm Booking") : "Continue"}
            </button>
          </div>
          {error && (
            <p className="mt-4 text-destructive text-center font-medium">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
