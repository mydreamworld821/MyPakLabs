import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, Image, GripVertical, Eye } from "lucide-react";
import { Link } from "react-router-dom";

interface ServiceCard {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  icon_name: string | null;
  bg_color: string | null;
  link: string;
  display_order: number | null;
  is_active: boolean | null;
  card_size: string | null;
  col_span: number | null;
  row_span: number | null;
  card_height: number | null;
}

const iconOptions = [
  { value: "", label: "None" },
  { value: "Video", label: "Video" },
  { value: "Calendar", label: "Calendar" },
  { value: "Zap", label: "Zap (Lightning)" },
  { value: "FlaskConical", label: "Lab Flask" },
  { value: "Pill", label: "Pill" },
  { value: "Heart", label: "Heart" },
  { value: "Building2", label: "Building" },
  { value: "Stethoscope", label: "Stethoscope" },
  { value: "Store", label: "Store" },
];

const bgColorOptions = [
  { value: "bg-sky-100", label: "Sky Light" },
  { value: "bg-teal-600", label: "Teal Dark" },
  { value: "bg-amber-100", label: "Amber Light" },
  { value: "bg-purple-100", label: "Purple Light" },
  { value: "bg-emerald-100", label: "Emerald Light" },
  { value: "bg-rose-100", label: "Rose Light" },
  { value: "bg-blue-600", label: "Blue Dark" },
  { value: "bg-green-600", label: "Green Dark" },
  { value: "bg-orange-100", label: "Orange Light" },
  { value: "bg-indigo-100", label: "Indigo Light" },
];

const ServiceCards = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ServiceCard | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    link: "",
    icon_name: "",
    bg_color: "bg-sky-100",
    display_order: 0,
    is_active: true,
    card_size: "normal",
    col_span: 1,
    row_span: 1,
    card_height: 100,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: serviceCards, isLoading } = useQuery({
    queryKey: ["admin-service-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_cards")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as ServiceCard[];
    },
  });

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `cards/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("service-images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      toast.error("Failed to upload image");
      return null;
    }

    const { data } = supabase.storage
      .from("service-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: {
      id?: string;
      title: string;
      subtitle: string;
      link: string;
      icon_name: string;
      bg_color: string;
      display_order: number;
      is_active: boolean;
      card_size: string;
      col_span: number;
      row_span: number;
      card_height: number;
      image_url?: string | null;
    }) => {
      const payload = {
        title: data.title,
        subtitle: data.subtitle || null,
        link: data.link,
        icon_name: data.icon_name || null,
        bg_color: data.bg_color,
        display_order: data.display_order,
        is_active: data.is_active,
        card_size: data.card_size,
        col_span: data.col_span,
        row_span: data.row_span,
        card_height: data.card_height,
        image_url: data.image_url,
      };

      if (data.id) {
        const { error } = await supabase
          .from("service_cards")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("service_cards").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-cards"] });
      toast.success(editingCard ? "Card updated!" : "Card created!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to save card");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("service_cards")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-cards"] });
      toast.success("Card deleted!");
    },
    onError: (error) => {
      toast.error("Failed to delete card");
      console.error(error);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      link: "",
      icon_name: "",
      bg_color: "bg-sky-100",
      display_order: 0,
      is_active: true,
      card_size: "normal",
      col_span: 1,
      row_span: 1,
      card_height: 100,
    });
    setEditingCard(null);
    setImageFile(null);
    setImagePreview(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (card: ServiceCard) => {
    setEditingCard(card);
    setFormData({
      title: card.title,
      subtitle: card.subtitle || "",
      link: card.link,
      icon_name: card.icon_name || "",
      bg_color: card.bg_color || "bg-sky-100",
      display_order: card.display_order || 0,
      is_active: card.is_active ?? true,
      card_size: card.card_size || "normal",
      col_span: card.col_span || 1,
      row_span: card.row_span || 1,
      card_height: card.card_height || 100,
    });
    setImagePreview(card.image_url);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let imageUrl = editingCard?.image_url || null;

    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    saveMutation.mutate({
      id: editingCard?.id,
      ...formData,
      image_url: imageUrl,
    });

    setUploading(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Service Cards</h1>
            <p className="text-muted-foreground">
              Manage homepage service cards - auto-adjusts layout based on count
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/" target="_blank">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Link>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Card
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCard ? "Edit Service Card" : "Add Service Card"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Card Image</Label>
                    <div className="mt-2 space-y-3">
                      {imagePreview ? (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">
                            Click to upload image
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="subtitle">Subtitle</Label>
                      <Input
                        id="subtitle"
                        value={formData.subtitle}
                        onChange={(e) =>
                          setFormData({ ...formData, subtitle: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="link">Link URL *</Label>
                    <Input
                      id="link"
                      value={formData.link}
                      onChange={(e) =>
                        setFormData({ ...formData, link: e.target.value })
                      }
                      placeholder="/video-consultation"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Icon</Label>
                      <Select
                        value={formData.icon_name}
                        onValueChange={(value) =>
                          setFormData({ ...formData, icon_name: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map((icon) => (
                            <SelectItem key={icon.value} value={icon.value || "none"}>
                              {icon.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Background Color</Label>
                      <Select
                        value={formData.bg_color}
                        onValueChange={(value) =>
                          setFormData({ ...formData, bg_color: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {bgColorOptions.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded ${color.value}`} />
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Column Span</Label>
                      <Select
                        value={formData.col_span.toString()}
                        onValueChange={(value) =>
                          setFormData({ ...formData, col_span: parseInt(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Column</SelectItem>
                          <SelectItem value="2">2 Columns</SelectItem>
                          <SelectItem value="3">3 Columns</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Row Span</Label>
                      <Select
                        value={formData.row_span.toString()}
                        onValueChange={(value) =>
                          setFormData({ ...formData, row_span: parseInt(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Row</SelectItem>
                          <SelectItem value="2">2 Rows</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Card Height: {formData.card_height}px</Label>
                    <input
                      type="range"
                      min="60"
                      max="300"
                      step="10"
                      value={formData.card_height}
                      onChange={(e) =>
                        setFormData({ ...formData, card_height: parseInt(e.target.value) })
                      }
                      className="w-full mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>60px</span>
                      <span>300px</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="order">Display Order</Label>
                      <Input
                        id="order"
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
                    <div className="flex items-end">
                      <div className="flex items-center gap-2 pb-2">
                        <Switch
                          checked={formData.is_active}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, is_active: checked })
                          }
                        />
                        <Label>Active</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={uploading || saveMutation.isPending}
                    >
                      {uploading || saveMutation.isPending
                        ? "Saving..."
                        : "Save Card"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Service Cards ({serviceCards?.filter(c => c.is_active).length || 0} active)</span>
              <span className="text-sm font-normal text-muted-foreground">
                Layout auto-adjusts: 3 cards = 3 columns, 6 cards = 3×2 grid, etc.
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : serviceCards?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No service cards yet. Add your first one!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Order</TableHead>
                    <TableHead className="w-20">Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceCards?.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <GripVertical className="w-4 h-4" />
                          {card.display_order}
                        </div>
                      </TableCell>
                      <TableCell>
                        {card.image_url ? (
                          <img
                            src={card.image_url}
                            alt={card.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-lg ${card.bg_color || 'bg-muted'} flex items-center justify-center`}>
                            <Image className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{card.title}</span>
                          {card.subtitle && (
                            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {card.link}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="text-muted-foreground">
                          {card.col_span || 1}×{card.row_span || 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            card.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {card.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(card)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this card?"
                                )
                              ) {
                                deleteMutation.mutate(card.id);
                              }
                            }}
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

export default ServiceCards;
