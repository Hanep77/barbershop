import { useState, type SubmitEvent } from "react";
import {
  MapPin,
  Save,
  Store,
  Globe,
  Phone,
  AlignLeft,
  CheckCircle2,
  LocateFixed,
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import type { CreateBarbershopInput } from "../../../types/barbershop";
import FindLocation from "../../components/find-location";
import { useDebouncedCallback } from "use-debounce";
import { AxiosError } from "axios";
import { createBarbershop } from "../../../services/barbershop";
import { useNavigate } from "react-router";
import useAuthStore from "../../../store/authStore";

type RegisterBarbershopForm = Omit<CreateBarbershopInput, "user_id">;

export function RegisterBarbershop() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [form, setForm] = useState<RegisterBarbershopForm>({
    name: "",
    address: "",
    map_url: null,
    phone_number: "",
    description: null,
    is_active: true,
    latitude: "",
    longitude: "",
  });

  const mapLatitude = Number.parseFloat(form.latitude) || -6.2;
  const mapLongitude = Number.parseFloat(form.longitude) || 106.816666;
  const [addressFound, setAddressFound] = useState([]);

  const handleChange = (
    field: keyof RegisterBarbershopForm,
    value: string | boolean | null,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const findLatLong = async (locationStr: string) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationStr)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();
    setAddressFound(data);
  };

  const getLatLon = useDebouncedCallback((value) => {
    findLatLong(value);
  }, 1000);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    // console.log(form);
    try {
      await createBarbershop(form).then((data) => {
        setUser(data.data.user);
        toast.success("Barbershop created successfully");
        navigate("/admin/dashboard");
      });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(
          err?.response?.data?.message || "Failed to create barbershop",
        );
        console.log(err?.response?.data);
      } else {
        toast.error("Failed to create barbershop");
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-muted">
        <div className="mx-auto max-w-5xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-foreground mb-1">Register Barbershop</h1>
              <p className="text-sm text-muted-foreground">
                Daftar dan Lengkapi Informasi data barbershop anda.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <FindLocation
            latitude={mapLatitude}
            longitude={mapLongitude}
            onChange={(latitude, longitude) => {
              setForm((current) => ({
                ...current,
                latitude: latitude.toFixed(6),
                longitude: longitude.toFixed(6),
              }));
            }}
          />

          <Card className="bg-card">
            <div className="p-6 border-b border-border">
              <h3 className="text-card-foreground">Basic Information</h3>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <div className="flex items-center gap-3">
                  <Store className="w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={(event) =>
                      handleChange("name", event.target.value)
                    }
                    placeholder="Contoh: BarberBrody Premium"
                    maxLength={100}
                    required
                    className="flex-1 bg-foreground border-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <Input
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={(event) => {
                      handleChange("address", event.target.value);
                      getLatLon(event.target.value);
                    }}
                    placeholder="Contoh: Jl. Sudirman No. 12, Jakarta"
                    required
                    className="flex-1 bg-foreground border-background"
                  />
                </div>

                {addressFound.length > 0 &&
                  addressFound.map((address: any) => (
                    <div
                      key={address.place_id}
                      className="flex items-center gap-3 mt-2 p-2 rounded-md border border-background cursor-pointer hover:bg-primary/80 transition-all transition-duration-200"
                      onClick={() => {
                        const lat = parseFloat(address.lat);
                        const lon = parseFloat(address.lon);
                        setForm((current) => ({
                          ...current,
                          latitude: lat.toFixed(6),
                          longitude: lon.toFixed(6),
                          address: address.display_name,
                        }));
                        setAddressFound([]);
                      }}
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{address.display_name}</span>
                    </div>
                  ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="map_url">Map URL</Label>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <Input
                    id="map_url"
                    name="map_url"
                    value={form.map_url ?? ""}
                    onChange={(event) =>
                      handleChange("map_url", event.target.value || null)
                    }
                    placeholder="https://maps.google.com/..."
                    className="flex-1 bg-foreground border-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone_number"
                      name="phone_number"
                      value={form.phone_number}
                      onChange={(event) =>
                        handleChange("phone_number", event.target.value)
                      }
                      placeholder="081234567890"
                      maxLength={15}
                      required
                      className="flex-1 bg-foreground border-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_active">Status</Label>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                    <select
                      id="is_active"
                      name="is_active"
                      value={form.is_active ? "true" : "false"}
                      onChange={(event) =>
                        handleChange("is_active", event.target.value === "true")
                      }
                      className="h-10 flex-1 rounded-md border border-background bg-foreground px-3 py-2 text-sm focus:ring-offset-background  "
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <div className="flex items-start gap-3">
                  <AlignLeft className="mt-3 w-5 h-5 text-muted-foreground" />
                  <Textarea
                    id="description"
                    name="description"
                    value={form.description ?? ""}
                    onChange={(event) =>
                      handleChange("description", event.target.value || null)
                    }
                    rows={4}
                    placeholder="Deskripsi singkat tentang barbershop"
                    className="resize-none flex-1 bg-foreground border-background"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-card">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <LocateFixed className="w-5 h-5 text-primary" />
                <h3 className="text-card-foreground">Location Coordinates</h3>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  value={form.latitude}
                  onChange={(event) =>
                    handleChange("latitude", event.target.value)
                  }
                  placeholder="-6.200000"
                  required
                  className="flex-1 bg-foreground border-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  value={form.longitude}
                  onChange={(event) =>
                    handleChange("longitude", event.target.value)
                  }
                  placeholder="106.816666"
                  required
                  className="flex-1 bg-foreground border-background"
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" className="min-w-40">
              <Save className="w-4 h-4 mr-2" />
              Save Barbershop
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
