import { useState, useEffect, type ChangeEvent } from "react";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Image,
  Save,
  Loader2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import {
  deleteBarbershopImage,
  getBarbershop,
  getBarbershopImages,
  getPublicAssetUrl,
  setPrimaryBarbershopImage,
  updateBarbershop,
  uploadBarbershopImage,
} from "../../../services/barbershop";
import type {
  Barbershop,
  BarbershopImage,
} from "../../../types/barbershop";
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
  const [gallery, setGallery] = useState<BarbershopImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [gallerySubmitting, setGallerySubmitting] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);

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

  const loadGallery = async () => {
    try {
      setGalleryLoading(true);
      setGalleryError(null);
      const res = await getBarbershopImages();
      setGallery(res.data.images || []);
    } catch (err) {
      console.error("Failed to load gallery:", err);
      setGalleryError("Failed to load gallery photos.");
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedImage(file);
    setGalleryError(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      toast.error("Please choose a photo first.");
      return;
    }

    try {
      setGallerySubmitting(true);
      setGalleryError(null);
      await uploadBarbershopImage(selectedImage);
      setSelectedImage(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      await loadGallery();
      toast.success("Photo uploaded successfully.");
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? err.response?.data.message || "Failed to upload photo."
          : "Failed to upload photo.";
      setGalleryError(message);
      toast.error(message);
    } finally {
      setGallerySubmitting(false);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      setGallerySubmitting(true);
      await setPrimaryBarbershopImage(id);
      await loadGallery();
      toast.success("Primary photo updated.");
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? err.response?.data.message || "Failed to update primary photo."
          : "Failed to update primary photo.";
      toast.error(message);
    } finally {
      setGallerySubmitting(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      setGallerySubmitting(true);
      await deleteBarbershopImage(id);
      await loadGallery();
      toast.success("Photo deleted successfully.");
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? err.response?.data.message || "Failed to delete photo."
          : "Failed to delete photo.";
      toast.error(message);
    } finally {
      setGallerySubmitting(false);
    }
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
    loadGallery();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
                  This description will be shown to customers when they view
                  your barbershop profile.
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
              </div>
            </div>
            <div className="p-6 space-y-6">
              {isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="gallery-photo">Upload Photo</Label>
                    <Input
                      id="gallery-photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      disabled={gallerySubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, or WebP. Maximum file size is 2 MB.
                    </p>
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedImage || gallerySubmitting}
                  >
                    {gallerySubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload
                  </Button>
                </div>
              )}

              {previewUrl && (
                <div className="max-w-sm">
                  <Label>Preview</Label>
                  <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={previewUrl}
                      alt="Preview upload"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {galleryError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {galleryError}
                </div>
              )}

              {galleryLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading gallery photos...
                </div>
              ) : gallery.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
                  No gallery photos yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {gallery.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative aspect-video rounded-lg overflow-hidden bg-muted group"
                    >
                      <img
                        src={getPublicAssetUrl(image.image_url)}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {image.is_primary && (
                        <Badge className="absolute left-3 top-3">
                          <Star className="w-3 h-3" />
                          Foto Utama
                        </Badge>
                      )}
                      {isEditing && (
                        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {!image.is_primary && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetPrimary(image.id)}
                              disabled={gallerySubmitting}
                            >
                              <Star className="w-4 h-4 mr-2" />
                              Jadikan Utama
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteImage(image.id)}
                            disabled={gallerySubmitting}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                These photos will be shown on your public barbershop profile to
                attract customers.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
