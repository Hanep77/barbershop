import { useState } from "react";
import {
  Users,
  Plus,
  Edit,
  Mail,
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

interface Barber {
  id: number;
  name: string;
  title: string;
  experience: string;
  rating: number;
  specialties: string[];
  bio: string;
  image: string;
  email: string;
  phone: string;
  isAvailable: boolean; // Real-time availability status
}

// Mock initial barbers for Marcus & Co.
const initialBarbers: Barber[] = [
  {
    id: 1,
    name: "Marcus Johnson",
    title: "Master Barber",
    experience: "12 years",
    rating: 4.9,
    specialties: ["Classic Cuts", "Beard Sculpting", "Fades"],
    bio: "Marcus brings over a decade of expertise in traditional and modern barbering techniques.",
    image:
      "https://images.unsplash.com/photo-1771594836586-837aa05be563?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwaGFpcnN0eWxpc3QlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM5MzYxNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    email: "marcus@marcusandco.com",
    phone: "(555) 123-0001",
    isAvailable: true,
  },
  {
    id: 2,
    name: "David Chen",
    title: "Senior Barber",
    experience: "8 years",
    rating: 4.8,
    specialties: ["Modern Styles", "Texturing", "Color"],
    bio: "David specializes in contemporary styles and cutting-edge techniques.",
    image:
      "https://images.unsplash.com/photo-1771594836586-837aa05be563?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwaGFpcnN0eWxpc3QlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM5MzYxNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    email: "david@marcusandco.com",
    phone: "(555) 123-0002",
    isAvailable: true,
  },
];

export function AdminBarbers() {
  const [barbers, setBarbers] = useState<Barber[]>(initialBarbers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [formData, setFormData] = useState<Partial<Barber>>({
    name: "",
    title: "",
    experience: "",
    bio: "",
    email: "",
    phone: "",
    specialties: [],
  });

  const handleToggleAvailability = (id: number) => {
    setBarbers(
      barbers.map((barber) =>
        barber.id === id
          ? { ...barber, isAvailable: !barber.isAvailable }
          : barber,
      ),
    );
    const barber = barbers.find((b) => b.id === id);
    if (barber) {
      toast.success(
        `${barber.name} is now ${!barber.isAvailable ? "available" : "unavailable"}`,
      );
    }
  };

  const handleOpenDialog = (barber?: Barber) => {
    if (barber) {
      setEditingBarber(barber);
      setFormData(barber);
    } else {
      setEditingBarber(null);
      setFormData({
        name: "",
        title: "",
        experience: "",
        bio: "",
        email: "",
        phone: "",
        specialties: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBarber(null);
    setFormData({
      name: "",
      title: "",
      experience: "",
      bio: "",
      email: "",
      phone: "",
      specialties: [],
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.title || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingBarber) {
      // Update existing barber
      setBarbers(
        barbers.map((b) =>
          b.id === editingBarber.id ? { ...editingBarber, ...formData } : b,
        ),
      );
      toast.success("Barber profile updated successfully!");
    } else {
      // Create new barber
      const newBarber: Barber = {
        id: Math.max(...barbers.map((b) => b.id), 0) + 1,
        name: formData.name!,
        title: formData.title!,
        experience: formData.experience || "0 years",
        rating: 5.0,
        specialties: formData.specialties || [],
        bio: formData.bio || "",
        image:
          "https://images.unsplash.com/photo-1771594836586-837aa05be563?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwaGFpcnN0eWxpc3QlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM5MzYxNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
        email: formData.email!,
        phone: formData.phone || "",
        isAvailable: true,
      };
      setBarbers([...barbers, newBarber]);
      toast.success("Barber added successfully!");
    }

    handleCloseDialog();
  };

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
            <Button onClick={() => handleOpenDialog()}>
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
                  barber.isAvailable
                    ? "bg-green-500/10 border-b border-green-500/20"
                    : "bg-red-500/10 border-b border-red-500/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  {barber.isAvailable ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-xs ${
                      barber.isAvailable ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {barber.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
                <Switch
                  checked={barber.isAvailable}
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
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{barber.email}</span>
                  </div>
                  {barber.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{barber.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {barber.bio}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {barber.specialties.map((specialty, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-primary/10 text-primary border-primary/20 text-xs"
                    >
                      {specialty}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-primary">★</span>
                    <span className="text-sm text-card-foreground">
                      {barber.rating}
                    </span>
                  </div>
                  <Button
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

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
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
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Master Barber"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
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
                value={formData.experience}
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
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Tell us about this barber..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties (comma-separated)</Label>
              <Input
                id="specialties"
                value={formData.specialties?.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specialties: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Classic Cuts, Fades, Beard Grooming"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingBarber ? "Update Barber" : "Add Barber"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
