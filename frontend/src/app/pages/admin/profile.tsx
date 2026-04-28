import { useState, useEffect } from "react";
import { Store, MapPin, Phone, Mail, Image, Save } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import { getBarbershop, updateBarbershop } from "../../../services/barbershop";
import type { Barbershop } from "../../../types/barbershop";
import type { User } from "../../../types/auth";
import { AxiosError } from "axios";

interface BarbershopProfile {
  barbershop?: Barbershop;
  user?: Partial<User>;
}

export function AdminProfile() {
  const [profile, setProfile] = useState<BarbershopProfile | null>({
    barbershop: undefined,
    user: undefined,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [gallery, setGallery] = useState<string[]>([
    "https://images.unsplash.com/photo-1759134248487-e8baaf31e33e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXJzaG9wJTIwaW50ZXJpb3IlMjBtb2Rlcm58ZW58MXx8fHwxNzczODYyMjk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1605497788044-5a32c7078486?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXJzaG9wJTIwY2hhaXJ8ZW58MXx8fHwxNzczODYyMzA2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXJzaG9wJTIwdG9vbHN8ZW58MXx8fHwxNzczODYyMzE4fDA&ixlib=rb-4.1.0&q=80&w=1080",
  ]);

  const handleSave = async () => {
    const formElement = document.getElementById(
      "profileBarbershopForm",
    ) as HTMLFormElement;
    const formData = new FormData(formElement);
    const data = Object.fromEntries(formData.entries());

    const payload = {
      ...data,
      latitude: profile?.barbershop?.latitude || "",
      longitude: profile?.barbershop?.longitude || "",
    };

    await updateBarbershop(payload)
      .then((res) => {
        const { barbershop } = res.data;
        setProfile((prev) => ({
          ...prev,
          barbershop: barbershop,
        }));
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      })
      .catch((err) => {
        if (err instanceof AxiosError) {
          toast.error(err.response?.data.message || "Failed to update profile");
          console.log(err.response);
          return;
        }
        toast.error("An unexpected error occurred");
        console.error(err);
      });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleFileUpload = () => {
    toast.info("File upload functionality would open here");
  };

  const getBarbershopInfo = async () => {
    const data = await getBarbershop();
    // console.log(data);
    const { barbershop, user } = data.data;
    setProfile({ barbershop, user });
  };

  useEffect(() => {
    let isMounted = true;

    const loadBarbershopInfo = async () => {
      try {
        const data = await getBarbershop();
        if (!isMounted) return;
        const { barbershop, user } = data.data;
        setProfile({ barbershop, user });
      } catch (err) {
        console.error("Error in loadBarbershopInfo:", err);
      }
    };

    loadBarbershopInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-muted">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground mb-1">Shop Profile</h1>
              <p className="text-sm text-muted-foreground">
                Manage your barbershop information and gallery
              </p>
            </div>
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Store className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="bg-card">
            <div className="p-6 border-b border-border">
              <h3 className="text-card-foreground">Basic Information</h3>
            </div>
            <form className="p-6 space-y-6" id="profileBarbershopForm">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name</Label>
                <div className="flex items-center gap-3">
                  <Store className="w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    value={profile?.barbershop?.name}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        barbershop: {
                          ...(profile?.barbershop as Barbershop),
                          name: e.target.value,
                        },
                      })
                    }
                    disabled={!isEditing}
                    className="flex-1 text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={profile?.barbershop?.description as string}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      barbershop: {
                        ...(profile?.barbershop as Barbershop),
                        description: e.target.value,
                      },
                    })
                  }
                  disabled={!isEditing}
                  rows={4}
                  className="resize-none text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  This description will be shown to customers and used by our AI
                  chatbot to recommend your barbershop.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <Input
                    id="address"
                    value={profile?.barbershop?.address}
                    name="address"
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        barbershop: {
                          ...(profile?.barbershop as Barbershop),
                          address: e.target.value,
                        },
                      })
                    }
                    disabled={!isEditing}
                    className="flex-1 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profile?.barbershop?.phone_number}
                      name="phone_number"
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          barbershop: {
                            ...(profile?.barbershop as Barbershop),
                            phone_number: e.target.value,
                          },
                        })
                      }
                      disabled={!isEditing}
                      className="flex-1 text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      value={profile?.user?.email}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          user: { ...profile?.user, email: e.target.value },
                        })
                      }
                      disabled={!isEditing}
                      className="flex-1 text-foreground"
                    />
                  </div>
                </div>
              </div>
            </form>
          </Card>

          {/* Operating Hours */}
          {/* <Card className="bg-card">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="text-card-foreground">Operating Hours</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(profile?.barbershop?.hours || {}).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-32">
                    <Label className="text-sm text-card-foreground">
                      {day}
                    </Label>
                  </div>
                  <Input
                    value={hours}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        hours: { ...profile?.barbershop?.hours, [day]: e.target.value },
                      })
                    }
                    disabled={!isEditing}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </Card> */}

          {/* Gallery Management */}
          <Card className="bg-card">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Image className="w-5 h-5 text-primary" />
                    <h3 className="text-card-foreground">Photo Gallery</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload photos of your barbershop to showcase your space and
                    services
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleFileUpload}
                  disabled={!isEditing}
                >
                  <Image className="w-4 h-4 mr-2" />
                  Upload Photos
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {gallery.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded-lg overflow-hidden bg-muted group"
                  >
                    <img
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {isEditing && (
                      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setGallery(gallery.filter((_, i) => i !== index))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button
                    onClick={handleFileUpload}
                    className="aspect-video rounded-lg border-2 border-dashed border-border bg-muted hover:bg-muted/80 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Image className="w-8 h-8" />
                    <span className="text-sm">Add Photo</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                💡 <strong>AI Integration:</strong> These photos will be shown
                by the chatbot when recommending your barbershop to customers.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
