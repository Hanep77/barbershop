import { useState, useEffect, type SubmitEvent } from "react";
import {
  Users,
  Plus,
  Edit,
  Phone,
  Award,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import type { Capster as Barber } from "../../../types/capster";
import {
  adminGetCapsters,
  adminUpdateCapster,
  adminDeleteCapster,
  adminCreateCapster,
} from "../../../services/capster";
import type { CapsterCreateRequest } from "../../../types/capster";
import { AxiosError } from "axios";

export function AdminCapsters() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [formData, setFormData] = useState<Partial<Barber> | null>(null);

  const handleToggleAvailability = async (id: string) => {
    setBarbers(
      barbers.map((barber) =>
        barber.id === id
          ? { ...barber, is_available: !barber.is_available }
          : barber,
      ),
    );
    const barber = barbers.find((b) => b.id === id);
    if (barber) {
      toast.success(
        `${barber.name} is now ${!barber.is_available ? "available" : "unavailable"}`,
      );
    }
  };

  const handleOpenDialog = (barber?: Barber) => {
    if (barber) {
      setEditingBarber(barber);
      setFormData(barber);
    } else {
      setEditingBarber(null);
      setFormData(null);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBarber(null);
    setFormData(null);
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    console.log(formData);

    await adminCreateCapster(formData as CapsterCreateRequest)
      .then((res) => {
        const { capster } = res.data;
        // console.log(capster);
        setBarbers([...barbers, capster]);
        toast.success("Capster created successfully");
        handleCloseDialog();
      })
      .catch((err: unknown) => {
        if (err instanceof AxiosError) {
          toast.error(
            err.response?.data?.message || "Failed to create capster",
          );
          console.log(err.response);
          return;
        }
        toast.error("An unexpected error occurred while creating capster");
        console.error(err);
      });
  };

  const handleSave = async (e: SubmitEvent) => {
    e.preventDefault();

    await adminUpdateCapster(
      editingBarber!.id,
      formData as CapsterCreateRequest,
    )
      .then((res) => {
        const { capster } = res.data;
        setBarbers(barbers.map((b) => (b.id === capster.id ? capster : b)));
        toast.success("Capster updated successfully");
        handleCloseDialog();
      })
      .catch((err: unknown) => {
        if (err instanceof AxiosError) {
          toast.error(
            err.response?.data?.message || "Failed to update capster",
          );
          console.log(err.response);
          return;
        }
        toast.error("An unexpected error occurred while updating capster");
        console.error(err);
      });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this capster?")) {
      return;
    }

    await adminDeleteCapster(id)
      .then(() => {
        setBarbers(barbers.filter((b) => b.id !== id));
        toast.success("Capster deleted successfully");
      })
      .catch((err: unknown) => {
        if (err instanceof AxiosError) {
          toast.error(
            err.response?.data?.message || "Failed to delete capster",
          );
          console.log(err.response);
          return;
        }
        toast.error("An unexpected error occurred while deleting capster");
        console.error(err);
      });
  };

  const fetchBarbers = async () => {
    await adminGetCapsters()
      .then((res) => {
        const { capsters } = res.data;
        setBarbers(capsters);
        console.log(capsters);
      })
      .catch((err: unknown) => {
        if (err instanceof AxiosError) {
          toast.error(
            err.response?.data?.message || "Failed to fetch capsters",
          );
          console.log(err.response);
          return;
        }
        toast.error("An unexpected error occurred while fetching capsters");
        console.error(err);
      });
  };

  useEffect(() => {
    fetchBarbers();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-muted">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground mb-1">Capster Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage your team and their availability status
              </p>
            </div>
            <Button type="button" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Capster
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Availability Info */}
        <Card className="bg-primary/5 border-primary/20 mb-6">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm text-foreground mb-1">
                  🔄 Real-time Availability Sync
                </h4>
                <p className="text-sm text-muted-foreground">
                  Toggle barber availability to control their booking slots in
                  real-time. When a barber is marked as unavailable, customers
                  won't see their time slots in the booking flow.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Barbers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbers.map((barber) => (
            <Card key={barber.id} className="bg-card overflow-hidden">
              {/* Availability Banner */}
              <div
                className={`px-4 py-2 flex items-center justify-between ${
                  barber.is_available
                    ? "bg-green-500/10 border-b border-green-500/20"
                    : "bg-red-500/10 border-b border-red-500/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  {barber.is_available ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-xs ${
                      barber.is_available ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {barber.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>
                <Switch
                  checked={barber.is_available}
                  onCheckedChange={() => handleToggleAvailability(barber.id)}
                />
              </div>

              {/* Barber Profile */}
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={barber.image} alt={barber.name} />
                    <AvatarFallback>
                      {barber.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-card-foreground truncate">
                      {barber.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {barber.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Award className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {barber.experience} experience
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{barber.phone}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {barber.bio}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {(JSON.parse(barber.specialties) as string[]).map(
                    (specialty, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20 text-xs"
                      >
                        {specialty}
                      </Badge>
                    ),
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-primary">★</span>
                    <span className="text-sm text-card-foreground">
                      {barber.rating}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(barber)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {barbers.length === 0 && (
          <Card className="bg-card">
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No barbers added yet</p>
            </div>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingBarber ? "Edit Barber Profile" : "Add New Barber"}
            </DialogTitle>
            <DialogDescription>
              {editingBarber
                ? "Update barber information"
                : "Add a new team member to your barbershop"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editingBarber ? handleSave : handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData?.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={formData?.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Master Barber"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData?.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  value={formData?.experience}
                  onChange={(e) =>
                    setFormData({ ...formData, experience: e.target.value })
                  }
                  placeholder="e.g., 12 years"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biography</Label>
                <Textarea
                  id="bio"
                  value={formData?.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Tell us about this barber..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialties">
                  Specialties (comma-separated)
                </Label>
                <Input
                  id="specialties"
                  value={formData?.specialties as string}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      specialties: e.target.value,
                      // specialties: e.target.value
                      //   .split(",")
                      //   .map((s) => s.trim())
                      //   .filter(Boolean),
                    })
                  }
                  placeholder="Classic Cuts, Fades, Beard Grooming"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingBarber ? "Update Barber" : "Add Barber"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
