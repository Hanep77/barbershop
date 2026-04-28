import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Calendar,
  User,
  Scissors,
  CheckCircle,
  ChevronRight,
  MapPin,
  Loader2,
} from "lucide-react";
import { Calendar as CalendarComponent } from "../components/ui/calendar";
import { getBarbershopById } from "../../services/barbershop";
import { getServicesByBarbershopId } from "../../services/service";
import { getCapstersByBarbershopId } from "../../services/capster";
import { createBooking, getAvailableSlots } from "../../services/booking";
import type { Barbershop } from "../../types/barbershop";
import type { Service } from "../../types/services";
import type { Capster } from "../../types/capster";
import { AxiosError } from "axios";

const formatDateParam = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export function Booking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const barbershopId = searchParams.get("barbershop_id") || "";
  const preSelectedServiceId = searchParams.get("service_id") || "";
  const preSelectedBarberId = searchParams.get("barber_id") || "";

  const [step, setStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] =
    useState(preSelectedServiceId);
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
    let isMounted = true;

    const fetchSlots = async () => {
      if (
        !selectedDate ||
        !selectedServiceId ||
        !selectedBarberId ||
        selectedBarberId === "No Preference"
      ) {
        if (isMounted) {
          setAvailableSlots([]);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoadingSlots(true);
        }
        const formattedDate = formatDateParam(selectedDate);
        const res = await getAvailableSlots(barbershopId, {
          date: formattedDate,
          service_id: selectedServiceId,
          capster_id: selectedBarberId,
        });
        if (!isMounted) return;
        setAvailableSlots(res.data.slots);
      } catch (err) {
        console.error("Error in fetchSlots:", err);
        if (err instanceof AxiosError) {
          console.log(err.response?.data?.message);
        }
      } finally {
        if (isMounted) {
          setLoadingSlots(false);
        }
      }
    };

    fetchSlots();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedServiceId, selectedBarberId, barbershopId]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!barbershopId) {
        navigate("/");
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
        }

        const shopRes = await getBarbershopById(barbershopId);
        if (!isMounted) return;

        const shopData: Barbershop = shopRes.data.data || shopRes.data;
        setBarbershop(shopData);

        if (shopData.services) {
          setServices(shopData.services);
        } else {
          const servicesRes = await getServicesByBarbershopId(barbershopId);
          if (!isMounted) return;
          const sData = servicesRes.data.data || servicesRes.data;
          setServices(Array.isArray(sData) ? sData : []);
        }

        if (shopData.capsters) {
          setBarbers(shopData.capsters);
        } else {
          const barbersRes = await getCapstersByBarbershopId(barbershopId);
          if (!isMounted) return;
          const bData = barbersRes.data.data || barbersRes.data;
          setBarbers(Array.isArray(bData) ? bData : []);
        }
      } catch (err) {
        console.error("Error in fetchData:", err);
        if (isMounted) {
          navigate("/");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
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
    if (
      !selectedServiceId ||
      !selectedBarberId ||
      !selectedDate ||
      !selectedTime
    ) {
      setError("Please complete all booking steps.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formattedDate = formatDateParam(selectedDate);
      const response = await createBooking({
        barbershop_id: barbershopId,
        service_id: selectedServiceId,
        capster_id: selectedBarberId,
        booking_date: formattedDate,
        booking_time: selectedTime,
      });
      // console.log(response?.data);
      navigate(`/checkout?booking_id=${response.data.booking.id}`);
    } catch (err: any) {
      if (err instanceof AxiosError) {
        console.log("Booking failed:", err.response);
      }
      console.error("Booking failed:", err);
      setError(
        err.response?.data?.message || "Booking failed. Please try again.",
      );
      if (err.response?.status === 401) {
        navigate("/login");
      }
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
        return (
          customerName !== "" && customerEmail !== "" && customerPhone !== ""
        );
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
  const selectedBarber =
    selectedBarberId === "No Preference"
      ? { name: "No Preference" }
      : barbers.find((b) => b.id === selectedBarberId);

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
        <div className="mb-8 text-center">
          <h1 className="font-bold text-4xl text-foreground mb-2">
            Book at {barbershop.name}
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="font-light">{barbershop.address}</span>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {steps.map((s, index) => {
              const Icon = s.icon;
              return (
                <div key={s.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${step >= s.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-sm font-light hidden md:block ${step >= s.number ? "text-foreground" : "text-muted-foreground"}`}
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
          {step === 1 && (
            <div>
              <h2 className="font-bold text-3xl text-card-foreground mb-8">
                Choose Your Service
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${selectedServiceId === service.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                  >
                    <h3 className="font-bold text-lg text-card-foreground mb-2">
                      {service.name}
                    </h3>
                    <div className="flex items-center gap-3 text-muted-foreground mb-2">
                      <span className="font-bold text-primary">
                        {formatPrice(service.price)}
                      </span>
                      <span className="font-light">
                        {service.duration_minutes} min
                      </span>
                    </div>
                    <p className="text-muted-foreground font-light text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-bold text-3xl text-card-foreground mb-8">
                Choose Your Barber
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {barbers.map(
                  (barber) =>
                    barber.is_available && (
                      <button
                        key={barber.id}
                        onClick={() => setSelectedBarberId(barber.id)}
                        className={`p-6 rounded-xl border-2 text-left transition-all ${selectedBarberId === barber.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                      >
                        <h3 className="font-bold text-lg text-card-foreground mb-1">
                          {barber.name}
                        </h3>
                        <p className="text-muted-foreground font-light text-sm">
                          {barber.title}
                        </p>
                      </button>
                    ),
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-bold text-3xl text-card-foreground mb-8">
                Pick Date & Time
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex justify-center">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    className="rounded-xl border border-border w-3xl"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-card-foreground mb-4">
                    Select Time
                  </h3>
                  {loadingSlots ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-2">
                      {availableSlots.length < 1 ? (
                        <p className="text-muted-foreground">
                          No available time slots for the selected date.
                        </p>
                      ) : (
                        availableSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`p-3 rounded-lg border text-sm transition-all ${selectedTime === time ? "border-primary bg-primary text-primary-foreground font-bold" : "border-border text-card-foreground hover:border-primary/50 hover:bg-primary/5"}`}
                          >
                            {time}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="font-bold text-3xl text-card-foreground mb-8">
                Confirm Details
              </h2>
              <div className="w-full space-y-6">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground"
                />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground"
                />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground"
                />
                <div className="p-6 bg-muted rounded-xl border border-border">
                  <h3 className="font-bold mb-4">Summary</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      Barbershop:{" "}
                      <span className="font-bold">{barbershop.name}</span>
                    </p>
                    <p>
                      Service:{" "}
                      <span className="font-bold">{selectedService?.name}</span>
                    </p>
                    <p>
                      Date:{" "}
                      <span className="font-bold">
                        {selectedDate?.toLocaleDateString()}
                      </span>
                    </p>
                    <p>
                      Time: <span className="font-bold">{selectedTime}</span>
                    </p>
                    <p className="pt-2 text-lg">
                      Total:{" "}
                      <span className="text-primary font-bold">
                        {formatPrice(selectedService?.price || 0)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-12">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 border border-border border-primary text-primary rounded-lg font-bold"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (step < 4 ? setStep(step + 1) : handleBooking())}
              disabled={!canProceed() || submitting}
              className={`px-8 py-3 rounded-lg font-bold transition-colors ml-auto flex items-center gap-2 ${canProceed() && !submitting ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {step === 4
                ? submitting
                  ? "Confirming..."
                  : "Confirm Booking"
                : "Continue"}
            </button>
          </div>
          {error && (
            <p className="mt-4 text-destructive text-center font-medium">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
