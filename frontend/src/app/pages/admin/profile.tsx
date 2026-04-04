import { useState } from "react";
import { Store, MapPin, Phone, Mail, Clock, Image, Save } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";

// Mock initial data for Marcus & Co.
const initialProfile = {
  name: "Marcus & Co. Barbers",
  description:
    "Premium barbershop specializing in classic cuts and modern styles. Our experienced team delivers exceptional grooming services in a sophisticated atmosphere.",
  address: "123 Broadway, New York, NY 10001",
  phone: "(555) 123-4567",
  email: "info@marcusandco.com",
  hours: {
    "Monday - Friday": "9:00 AM - 8:00 PM",
    Saturday: "9:00 AM - 6:00 PM",
    Sunday: "10:00 AM - 4:00 PM",
  },
};

export function AdminProfile() {
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [gallery, setGallery] = useState<string[]>([
    "https://images.unsplash.com/photo-1759134248487-e8baaf31e33e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXJzaG9wJTIwaW50ZXJpb3IlMjBtb2Rlcm58ZW58MXx8fHwxNzczODYyMjk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1605497788044-5a32c7078486?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXJzaG9wJTIwY2hhaXJ8ZW58MXx8fHwxNzczODYyMzA2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXJzaG9wJTIwdG9vbHN8ZW58MXx8fHwxNzczODYyMzE4fDA&ixlib=rb-4.1.0&q=80&w=1080",
  ]);

  const handleSave = () => {
    // In a real app, this would make an API call
    toast.success("Profile updated successfully!");
    setIsEditing(false);
  };

  const handleCancel = () => {
    setProfile(initialProfile);
    setIsEditing(false);
  };

  const handleFileUpload = () => {
    // Mock file upload - in reality this would open a file picker
    toast.info("File upload functionality would open here");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name</Label>
                <div className="flex items-center gap-3">
                  <Store className="w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    disabled={!isEditing}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={profile.description}
                  onChange={(e) =>
                    setProfile({ ...profile, description: e.target.value })
                  }
                  disabled={!isEditing}
                  rows={4}
                  className="resize-none"
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
                    value={profile.address}
                    onChange={(e) =>
                      setProfile({ ...profile, address: e.target.value })
                    }
                    disabled={!isEditing}
                    className="flex-1"
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
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      disabled={!isEditing}
                      className="flex-1"
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
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Operating Hours */}
          <Card className="bg-card">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="text-card-foreground">Operating Hours</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(profile.hours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-32">
                    <Label className="text-sm text-card-foreground">{day}</Label>
                  </div>
                  <Input
                    value={hours}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        hours: { ...profile.hours, [day]: e.target.value },
                      })
                    }
                    disabled={!isEditing}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </Card>

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
