import { useEffect, useState, type SubmitEvent } from "react";
import {
  Scissors,
  Plus,
  Edit,
  Trash2,
  Search,
  DollarSign,
  Clock,
  Tag,
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import {
  adminGetBarbershopServices,
  adminCreateServiceCategory,
} from "../../../services/service";
import { adminGetServiceCategories } from "../../../services/serviceCategory";
import type { CreateServiceRequest, Service } from "../../../types/services";
import type { ServiceCategory } from "../../../types/serviceCategory";
import { AxiosError } from "axios";

export function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [hairStyleCategories, setHairStyleCategories] = useState<
    ServiceCategory[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Partial<Service>>({
    name: "",
    price: 0,
    description: "",
    category_id: "",
    duration_minutes: 0,
  });

  const filteredServices = services?.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData(service);
    } else {
      setEditingService(null);
      setFormData({
        name: "",
        price: 0,
        duration_minutes: 0,
        description: "",
        category_id: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
    setFormData({
      name: "",
      price: 0,
      duration_minutes: 0,
      description: "",
      category_id: "",
    });
  };

  // const handleSave = () => {
  //   if (
  //     !formData.name ||
  //     !formData.price ||
  //     !formData.duration_minutes ||
  //     !formData.category_id
  //   ) {
  //     toast.error("Please fill in all required fields");
  //     return;
  //   }

  //   if (editingService) {
  //     // Update existing service
  //     setServices(
  //       services?.map((s) =>
  //         s.id === editingService.id ? { ...editingService, ...formData } : s,
  //       ),
  //     );
  //     toast.success("Service updated successfully!");
  //   }
  //   handleCloseDialog();
  // };

  const handleDelete = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
    toast.success("Service deleted successfully!");
  };

  const fetchServices = async () => {
    await adminGetBarbershopServices()
      .then((res) => {
        const { data } = res;
        setServices(data || []);
      })
      .catch((error: unknown) => {
        if (error instanceof AxiosError) {
          toast.error(
            error.response?.data?.message || "Failed to fetch services",
          );
          console.log(error.response);
          return;
        } else {
          toast.error("Failed to fetch services");
          console.log(error);
        }
      });
  };

  const fetchServiceCategories = async () => {
    try {
      const response = await adminGetServiceCategories();
      const { categories } = response.data;
      setHairStyleCategories(categories || []);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(
          err.response?.data?.message || "Failed to fetch service categories",
        );
        console.log(err.response);
        return;
      } else {
        toast.error("Failed to fetch service categories");
        console.log(err);
      }
    }
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    const payload: CreateServiceRequest = {
      name: formData.name as string,
      price: Number(formData.price),
      duration_minutes: Number(formData.duration_minutes),
      description: formData.description as string,
      category_id: formData.category_id as string,
    };
    console.log(payload);
    await adminCreateServiceCategory(payload)
      .then((res) => {
        const { service } = res.data;
        console.log(service);
        setServices((prev) => [service, ...(prev || [])]);
        toast.success("Service added successfully!");
        handleCloseDialog();
      })
      .catch((err: unknown) => {
        if (err instanceof AxiosError) {
          toast.error(err.response?.data?.message || "Failed to save service");
          console.log(err.response);
          return;
        }
        toast.error("Failed to save service");
        console.log(err);
      });
  };

  useEffect(() => {
    fetchServices();
    fetchServiceCategories();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-muted">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground mb-1">Services Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage your services and hair style categories for AI
                recommendations
              </p>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* AI Integration Notice */}
        <Card className="bg-primary/5 border-primary/20 mb-6">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm text-foreground mb-1">
                  🤖 AI Integration & RAG System
                </h4>
                <p className="text-sm text-muted-foreground">
                  The <strong>Hair Style Category</strong> field is crucial for
                  our AI chatbot. Categories are converted into vector
                  embeddings, allowing the RAG (Retrieval-Augmented Generation)
                  system to intelligently recommend your services when customers
                  ask about specific hairstyles.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Search and Filters */}
        <Card className="bg-card mb-6">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search services by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </Card>

        {/* Services Table */}
        <Card className="bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                    Service Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                    Hair Style Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredServices?.map((service) => (
                  <tr
                    key={service.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-card-foreground">
                          {service?.name}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {service?.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20"
                      >
                        {service?.category?.name}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-card-foreground">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        {service?.price}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-card-foreground">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {service?.duration_minutes} min
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(service)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(service.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredServices?.length === 0 && (
              <div className="p-12 text-center">
                <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No services found</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Edit Service" : "Add New Service"}
              </DialogTitle>
              <DialogDescription>
                {editingService
                  ? "Update service information and category for AI recommendations"
                  : "Create a new service with hair style category for AI recommendations"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Classic Cut"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Hair Style Category *{" "}
                  <Badge variant="secondary" className="ml-2">
                    For AI/RAG
                  </Badge>
                </Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {hairStyleCategories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This category helps our AI chatbot recommend this service to
                  customers
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (RP) *</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: Number(e.target.value),
                        })
                      }
                      placeholder="45"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_minutes: Number(e.target.value),
                        })
                      }
                      placeholder="45"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  value={formData?.description as string}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe this service in detail..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  A detailed description helps the AI provide better
                  recommendations
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingService ? "Update Service" : "Create Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
