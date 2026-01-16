import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ImageIcon, Move } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface Surgery {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  image_position_x: number;
  image_position_y: number;
  discount_percentage: number;
  hospital_discount_percentage: number;
  doctor_discount_percentage: number;
  price_range: string | null;
  is_active: boolean;
  display_order: number;
}

const AdminSurgeries = () => {
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSurgery, setEditingSurgery] = useState<Surgery | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    image_position_x: 50,
    image_position_y: 50,
    discount_percentage: 0,
    hospital_discount_percentage: 0,
    doctor_discount_percentage: 0,
    price_range: "",
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    fetchSurgeries();
  }, []);

  const fetchSurgeries = async () => {
    try {
      const { data, error } = await supabase
        .from("surgeries")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setSurgeries(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch surgeries");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const slug = generateSlug(formData.name);
      const surgeryData = {
        ...formData,
        slug,
      };

      if (editingSurgery) {
        const { error } = await supabase
          .from("surgeries")
          .update(surgeryData)
          .eq("id", editingSurgery.id);

        if (error) throw error;
        toast.success("Surgery updated successfully");
      } else {
        const { error } = await supabase
          .from("surgeries")
          .insert([surgeryData]);

        if (error) throw error;
        toast.success("Surgery created successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchSurgeries();
    } catch (error: any) {
      toast.error(error.message || "Failed to save surgery");
    }
  };

  const handleEdit = (surgery: Surgery) => {
    setEditingSurgery(surgery);
    setFormData({
      name: surgery.name,
      description: surgery.description || "",
      image_url: surgery.image_url || "",
      image_position_x: surgery.image_position_x,
      image_position_y: surgery.image_position_y,
      discount_percentage: surgery.discount_percentage,
      hospital_discount_percentage: surgery.hospital_discount_percentage,
      doctor_discount_percentage: surgery.doctor_discount_percentage,
      price_range: surgery.price_range || "",
      is_active: surgery.is_active,
      display_order: surgery.display_order,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this surgery?")) return;

    try {
      const { error } = await supabase.from("surgeries").delete().eq("id", id);

      if (error) throw error;
      toast.success("Surgery deleted successfully");
      fetchSurgeries();
    } catch (error: any) {
      toast.error("Failed to delete surgery");
    }
  };

  const resetForm = () => {
    setEditingSurgery(null);
    setFormData({
      name: "",
      description: "",
      image_url: "",
      image_position_x: 50,
      image_position_y: 50,
      discount_percentage: 0,
      hospital_discount_percentage: 0,
      doctor_discount_percentage: 0,
      price_range: "",
      is_active: true,
      display_order: 0,
    });
  };

  const getTotalDiscount = () => {
    return (
      formData.discount_percentage +
      formData.hospital_discount_percentage +
      formData.doctor_discount_percentage
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Surgeries Management</h1>
            <p className="text-muted-foreground">
              Add and manage surgical procedures with discounts
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Surgery
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSurgery ? "Edit Surgery" : "Add New Surgery"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Procedure Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Brazilian Butt Lift"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="description">Short Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Brief description of the procedure..."
                      rows={3}
                    />
                  </div>

                  <div className="col-span-2">
                    <ImageUpload
                      label="Procedure Image"
                      bucket="surgery-images"
                      folder="procedures"
                      currentUrl={formData.image_url}
                      onUpload={(url) =>
                        setFormData({ ...formData, image_url: url })
                      }
                      aspectRatio="banner"
                      skipCrop={true}
                    />
                  </div>

                  {formData.image_url && (
                    <div className="col-span-2 space-y-4 p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Move className="w-4 h-4" />
                        Image Position Adjustment
                      </div>
                      
                      <div className="relative w-full h-32 overflow-hidden rounded-lg border">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="absolute w-full h-full object-cover"
                          style={{
                            objectPosition: `${formData.image_position_x}% ${formData.image_position_y}%`,
                          }}
                        />
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">
                            Horizontal Position: {formData.image_position_x}%
                          </Label>
                          <Slider
                            value={[formData.image_position_x]}
                            onValueChange={([val]) =>
                              setFormData({ ...formData, image_position_x: val })
                            }
                            min={0}
                            max={100}
                            step={1}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">
                            Vertical Position: {formData.image_position_y}%
                          </Label>
                          <Slider
                            value={[formData.image_position_y]}
                            onValueChange={([val]) =>
                              setFormData({ ...formData, image_position_y: val })
                            }
                            min={0}
                            max={100}
                            step={1}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="price_range">Price Range</Label>
                    <Input
                      id="price_range"
                      value={formData.price_range}
                      onChange={(e) =>
                        setFormData({ ...formData, price_range: e.target.value })
                      }
                      placeholder="e.g., PKR 50,000 - 100,000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          display_order: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-medium">Discount Management</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="discount">Platform Discount (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discount_percentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discount_percentage: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="hospital_discount">Hospital Discount (%)</Label>
                      <Input
                        id="hospital_discount"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.hospital_discount_percentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hospital_discount_percentage:
                              parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="doctor_discount">Doctor Discount (%)</Label>
                      <Input
                        id="doctor_discount"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.doctor_discount_percentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            doctor_discount_percentage:
                              parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="secondary" className="text-lg">
                      Total Discount: {getTotalDiscount()}%
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingSurgery ? "Update" : "Create"} Surgery
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Surgeries ({surgeries.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading surgeries...
              </div>
            ) : surgeries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No surgeries added yet. Click "Add Surgery" to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price Range</TableHead>
                    <TableHead>Discounts</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surgeries.map((surgery) => (
                    <TableRow key={surgery.id}>
                      <TableCell>
                        {surgery.image_url ? (
                          <div className="w-16 h-12 rounded overflow-hidden">
                            <img
                              src={surgery.image_url}
                              alt={surgery.name}
                              className="w-full h-full object-cover"
                              style={{
                                objectPosition: `${surgery.image_position_x}% ${surgery.image_position_y}%`,
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-12 rounded bg-muted flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{surgery.name}</p>
                          {surgery.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {surgery.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {surgery.price_range || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {surgery.discount_percentage > 0 && (
                            <Badge variant="default" className="text-xs">
                              {surgery.discount_percentage}% Platform
                            </Badge>
                          )}
                          {surgery.hospital_discount_percentage > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {surgery.hospital_discount_percentage}% Hospital
                            </Badge>
                          )}
                          {surgery.doctor_discount_percentage > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {surgery.doctor_discount_percentage}% Doctor
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={surgery.is_active ? "default" : "secondary"}
                        >
                          {surgery.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{surgery.display_order}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(surgery)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(surgery.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
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

export default AdminSurgeries;
