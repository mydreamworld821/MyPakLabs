import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Stethoscope } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface Specialization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  icon_url: string | null;
  is_active: boolean | null;
  display_order: number | null;
  doctor_count?: number;
}

const AdminSpecializations = () => {
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<Specialization | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon_name: "Stethoscope",
    icon_url: "",
    display_order: 0,
    is_active: true,
  });

  const fetchSpecializations = async () => {
    try {
      const { data: specs, error } = await supabase
        .from("doctor_specializations")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;

      // Get doctor counts for each specialization
      const { data: doctors } = await supabase
        .from("doctors")
        .select("specialization_id")
        .eq("status", "approved");

      const countsMap = new Map<string, number>();
      doctors?.forEach((doc) => {
        if (doc.specialization_id) {
          countsMap.set(doc.specialization_id, (countsMap.get(doc.specialization_id) || 0) + 1);
        }
      });

      const specsWithCounts = specs?.map((spec) => ({
        ...spec,
        doctor_count: countsMap.get(spec.id) || 0,
      })) || [];

      setSpecializations(specsWithCounts);
    } catch (error: any) {
      toast.error("Failed to fetch specializations");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecializations();
  }, []);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      const slug = generateSlug(formData.name);
      
      if (editingSpec) {
        const { error } = await supabase
          .from("doctor_specializations")
          .update({
            name: formData.name.trim(),
            slug,
            description: formData.description.trim() || null,
            icon_name: formData.icon_name,
            icon_url: formData.icon_url || null,
            display_order: formData.display_order,
            is_active: formData.is_active,
          })
          .eq("id", editingSpec.id);

        if (error) throw error;
        toast.success("Specialization updated");
      } else {
        const { error } = await supabase
          .from("doctor_specializations")
          .insert({
            name: formData.name.trim(),
            slug,
            description: formData.description.trim() || null,
            icon_name: formData.icon_name,
            icon_url: formData.icon_url || null,
            display_order: formData.display_order,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast.success("Specialization added");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchSpecializations();
    } catch (error: any) {
      toast.error(error.message || "Failed to save specialization");
    }
  };

  const handleEdit = (spec: Specialization) => {
    setEditingSpec(spec);
    setFormData({
      name: spec.name,
      description: spec.description || "",
      icon_name: spec.icon_name || "Stethoscope",
      icon_url: spec.icon_url || "",
      display_order: spec.display_order || 0,
      is_active: spec.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this specialization?")) return;

    try {
      const { error } = await supabase
        .from("doctor_specializations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Specialization deleted");
      fetchSpecializations();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete specialization");
    }
  };

  const resetForm = () => {
    setEditingSpec(null);
    setFormData({
      name: "",
      description: "",
      icon_name: "Stethoscope",
      icon_url: "",
      display_order: 0,
      is_active: true,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Doctor Specializations</h1>
            <p className="text-xs text-muted-foreground">
              Manage doctor categories that appear in Find Doctors
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Add Specialization
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-sm">
                  {editingSpec ? "Edit Specialization" : "Add Specialization"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label className="text-xs">Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Cardiologist"
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short description of this specialization..."
                    className="text-xs min-h-[60px]"
                  />
                </div>
                <ImageUpload
                  label="Icon"
                  bucket="lab-images"
                  folder="specialization-icons"
                  currentUrl={formData.icon_url}
                  onUpload={(url) => setFormData({ ...formData, icon_url: url })}
                  aspectRatio="square"
                  skipCrop={true}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Display Order</Label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label className="text-xs">Active</Label>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" size="sm" className="text-xs flex-1">
                    {editingSpec ? "Update" : "Add"} Specialization
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : specializations.length === 0 ? (
              <div className="text-center py-8">
                <Stethoscope className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No specializations added yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-12">Icon</TableHead>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs">Doctors</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specializations.map((spec) => (
                    <TableRow key={spec.id}>
                      <TableCell>
                        {spec.icon_url ? (
                          <img 
                            src={spec.icon_url} 
                            alt={spec.name} 
                            className="w-8 h-8 object-contain rounded"
                          />
                        ) : (
                          <Stethoscope className="w-6 h-6 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{spec.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {spec.description || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-primary">{spec.doctor_count}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          spec.is_active 
                            ? "bg-green-100 text-green-700" 
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {spec.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(spec)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDelete(spec.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSpecializations;
