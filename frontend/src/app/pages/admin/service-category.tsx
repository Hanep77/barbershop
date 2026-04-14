import { useEffect, useMemo, useState, type SubmitEvent } from "react";
import { PocketKnife, Plus, Edit, Trash2, Search, Layers } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import {
  adminCreateServiceCategory,
  adminGetServiceCategories,
} from "../../../services/serviceCategory";
import type {
  ServiceCategory,
  CreateServiceCategoryRequest,
} from "../../../types/serviceCategory";
import { AxiosError } from "axios";

export function AdminServiceCategory() {
  const [categories, setCategories] = useState<Partial<ServiceCategory[]>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ServiceCategory | null>(null);
  const [formData, setFormData] = useState({ name: "" });

  const filteredCategories = useMemo(
    () =>
      categories.filter((category) =>
        category?.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [categories, searchQuery],
  );

  const handleOpenDialog = (category?: ServiceCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category?.name });
    } else {
      setEditingCategory(null);
      setFormData({ name: "" });
    }

    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({ name: "" });
  };

  //   const handleSave = () => {
  //     if (!formData.name.trim()) {
  //       toast.error("Category name is required");
  //       return;
  //     }

  //     if (editingCategory) {
  //       setCategories((prev) =>
  //         prev?.map((category) =>
  //           category?.id === editingCategory?.id
  //             ? { ...category, name: formData.name.trim() }
  //             : category,
  //         ),
  //       );
  //       toast.success("Category updated successfully!");
  //       handleCloseDialog();
  //       return;
  //     }

  //     // setCategories((prev) => [newCategory, ...prev]);
  //     toast.success("Category added successfully!");
  //     handleCloseDialog();
  //   };

  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((category) => category?.id !== id));
    toast.success("Category deleted successfully!");
  };

  const fetchCategories = async () => {
    try {
      const response = await adminGetServiceCategories();
      const payload = response.data;
      const fetchedCategories = payload?.data || payload?.categories || [];
      setCategories(fetchedCategories);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data?.message || "Failed to fetch service categories",
        );
        return;
      }

      toast.error("Failed to fetch service categories");
    }
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const payload: CreateServiceCategoryRequest = {
      name: formData.get("name") as string,
    };

    await adminCreateServiceCategory(payload)
      .then((res) => {
        const { category } = res.data;
        // console.log(category);
        setCategories((prev) => [category, ...(prev || [])]);
        toast.success("Category added successfully!");
        handleCloseDialog();
      })
      .catch((err: unknown) => {
        if (err instanceof AxiosError) {
          toast.error(err.response?.data?.message || "Failed to save category");
          console.log(err?.response);
          return;
        }
        toast.error("Failed to save category");
        console.log(err);
      });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-muted">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground mb-1">Service Categories</h1>
              <p className="text-sm text-muted-foreground">
                Manage hair style categories used for service organization and
                AI recommendations
              </p>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Card className="bg-primary/5 border-primary/20 mb-6">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm text-foreground mb-1">
                  Category Knowledge Base
                </h4>
                <p className="text-sm text-muted-foreground">
                  Categories help structure your services and improve AI answers
                  when customers ask for specific styles.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-card mb-6">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search categories by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </Card>

        <Card className="bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                    Services Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCategories?.map((category) => (
                  <tr
                    key={category?.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <PocketKnife className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-card-foreground">
                          {category?.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-card-foreground">
                      {category?.services?.length || 0} service(s)
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20"
                      >
                        Active
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category?.id as string)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCategories.length === 0 && (
              <div className="p-12 text-center">
                <PocketKnife className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No categories found</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update category information"
                : "Create a new service category for your barbershop"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-2 py-4">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="e.g., Fade, Pompadour, Buzz Cut"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCategory ? "Update Category" : "Add Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminServiceCategory;
