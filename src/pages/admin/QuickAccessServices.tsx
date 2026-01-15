import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import {
  FlaskConical, Pill, Heart, Building2, Stethoscope, 
  Video, Calendar, Zap, Store, Syringe, FileText, 
  Clipboard, Activity, UserRound, Thermometer, Microscope
} from "lucide-react";

interface QuickAccessService {
  id: string;
  title: string;
  icon_name: string;
  icon_color: string | null;
  icon_size: number | null;
  bg_color: string | null;
  link: string;
  display_order: number | null;
  is_active: boolean | null;
}

const iconOptions = [
  { value: "FlaskConical", label: "Flask (Labs)", icon: FlaskConical },
  { value: "Pill", label: "Pill (Medicines)", icon: Pill },
  { value: "Heart", label: "Heart (Health)", icon: Heart },
  { value: "Building2", label: "Building (Hospital)", icon: Building2 },
  { value: "Stethoscope", label: "Stethoscope (Doctors)", icon: Stethoscope },
  { value: "Video", label: "Video (Consultation)", icon: Video },
  { value: "Calendar", label: "Calendar (Booking)", icon: Calendar },
  { value: "Zap", label: "Zap (Instant)", icon: Zap },
  { value: "Store", label: "Store (Pharmacy)", icon: Store },
  { value: "Syringe", label: "Syringe (Injection)", icon: Syringe },
  { value: "FileText", label: "File (Reports)", icon: FileText },
  { value: "Clipboard", label: "Clipboard (Records)", icon: Clipboard },
  { value: "Activity", label: "Activity (Vitals)", icon: Activity },
  { value: "UserRound", label: "User (Nurse)", icon: UserRound },
  { value: "Thermometer", label: "Thermometer", icon: Thermometer },
  { value: "Microscope", label: "Microscope", icon: Microscope },
];

const bgColorOptions = [
  { value: "bg-sky-50", label: "Sky Light", preview: "bg-sky-50" },
  { value: "bg-blue-50", label: "Blue Light", preview: "bg-blue-50" },
  { value: "bg-teal-50", label: "Teal Light", preview: "bg-teal-50" },
  { value: "bg-green-50", label: "Green Light", preview: "bg-green-50" },
  { value: "bg-emerald-50", label: "Emerald Light", preview: "bg-emerald-50" },
  { value: "bg-purple-50", label: "Purple Light", preview: "bg-purple-50" },
  { value: "bg-pink-50", label: "Pink Light", preview: "bg-pink-50" },
  { value: "bg-rose-50", label: "Rose Light", preview: "bg-rose-50" },
  { value: "bg-red-50", label: "Red Light", preview: "bg-red-50" },
  { value: "bg-orange-50", label: "Orange Light", preview: "bg-orange-50" },
  { value: "bg-amber-50", label: "Amber Light", preview: "bg-amber-50" },
  { value: "bg-yellow-50", label: "Yellow Light", preview: "bg-yellow-50" },
];

const iconColorOptions = [
  { value: "text-primary", label: "Primary" },
  { value: "text-blue-600", label: "Blue" },
  { value: "text-teal-600", label: "Teal" },
  { value: "text-green-600", label: "Green" },
  { value: "text-emerald-600", label: "Emerald" },
  { value: "text-purple-600", label: "Purple" },
  { value: "text-pink-600", label: "Pink" },
  { value: "text-rose-600", label: "Rose" },
  { value: "text-red-500", label: "Red" },
  { value: "text-orange-600", label: "Orange" },
  { value: "text-amber-600", label: "Amber" },
  { value: "text-cyan-600", label: "Cyan" },
];

const iconSizeOptions = [
  { value: 20, label: "Small (20px)" },
  { value: 24, label: "Medium (24px)" },
  { value: 28, label: "Large (28px)" },
  { value: 32, label: "Extra Large (32px)" },
];

const QuickAccessServicesAdmin = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<QuickAccessService | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    icon_name: "FlaskConical",
    icon_color: "text-primary",
    icon_size: 24,
    bg_color: "bg-sky-50",
    link: "",
    is_active: true,
    display_order: 0,
  });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["quick-access-services-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quick_access_services")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as QuickAccessService[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("quick_access_services")
          .update({
            title: data.title,
            icon_name: data.icon_name,
            icon_color: data.icon_color,
            icon_size: data.icon_size,
            bg_color: data.bg_color,
            link: data.link,
            is_active: data.is_active,
            display_order: data.display_order,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("quick_access_services").insert({
          title: data.title,
          icon_name: data.icon_name,
          icon_color: data.icon_color,
          icon_size: data.icon_size,
          bg_color: data.bg_color,
          link: data.link,
          is_active: data.is_active,
          display_order: data.display_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-access-services-admin"] });
      toast.success(editingService ? "Service updated!" : "Service added!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to save: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quick_access_services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-access-services-admin"] });
      toast.success("Service deleted!");
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingService(null);
    setFormData({
      title: "",
      icon_name: "FlaskConical",
      icon_color: "text-primary",
      icon_size: 24,
      bg_color: "bg-sky-50",
      link: "",
      is_active: true,
      display_order: services.length,
    });
  };

  const handleEdit = (service: QuickAccessService) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      icon_name: service.icon_name,
      icon_color: service.icon_color || "text-primary",
      icon_size: service.icon_size || 24,
      bg_color: service.bg_color || "bg-sky-50",
      link: service.link,
      is_active: service.is_active ?? true,
      display_order: service.display_order || 0,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...formData,
      id: editingService?.id,
    });
  };

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find((opt) => opt.value === iconName);
    return option?.icon || FlaskConical;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quick Access Services</h1>
            <p className="text-muted-foreground">
              Manage the badge-style quick access icons on homepage
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>

        {/* Preview */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3">Preview</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {services
              .filter((s) => s.is_active)
              .map((service) => {
                const IconComponent = getIconComponent(service.icon_name);
                return (
                  <div key={service.id} className="flex flex-col items-center min-w-[72px]">
                    <div
                      className={`w-14 h-14 rounded-xl ${service.bg_color || "bg-muted"} flex items-center justify-center mb-1.5`}
                    >
                      <IconComponent
                        className={service.icon_color || "text-primary"}
                        size={service.icon_size || 24}
                      />
                    </div>
                    <span className="text-xs font-medium text-center">{service.title}</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Style</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No services yet. Add your first quick access service.
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service) => {
                  const IconComponent = getIconComponent(service.icon_name);
                  return (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          {service.display_order}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className={`w-10 h-10 rounded-lg ${service.bg_color || "bg-muted"} flex items-center justify-center`}
                        >
                          <IconComponent
                            className={service.icon_color || "text-primary"}
                            size={service.icon_size || 24}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{service.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {service.link}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {service.icon_size || 24}px
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            service.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {service.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(service)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Delete this service?")) {
                                deleteMutation.mutate(service.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Edit Service" : "Add Quick Access Service"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Labs"
                  required
                />
              </div>

              <div>
                <Label>Link</Label>
                <Input
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="e.g., /labs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Icon</Label>
                  <Select
                    value={formData.icon_name}
                    onValueChange={(v) => setFormData({ ...formData, icon_name: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="w-4 h-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Icon Size</Label>
                  <Select
                    value={String(formData.icon_size)}
                    onValueChange={(v) => setFormData({ ...formData, icon_size: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconSizeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Background Color</Label>
                  <Select
                    value={formData.bg_color}
                    onValueChange={(v) => setFormData({ ...formData, bg_color: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bgColorOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${opt.preview}`} />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Icon Color</Label>
                  <Select
                    value={formData.icon_color}
                    onValueChange={(v) => setFormData({ ...formData, icon_color: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconColorOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${opt.value.replace("text-", "bg-")}`} />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({ ...formData, display_order: Number(e.target.value) })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
              </div>

              {/* Preview in dialog */}
              <div className="bg-muted/30 rounded-lg p-4">
                <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-14 h-14 rounded-xl ${formData.bg_color} flex items-center justify-center mb-1.5`}
                    >
                      {(() => {
                        const IconComponent = getIconComponent(formData.icon_name);
                        return (
                          <IconComponent
                            className={formData.icon_color}
                            size={formData.icon_size}
                          />
                        );
                      })()}
                    </div>
                    <span className="text-xs font-medium">{formData.title || "Title"}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editingService ? "Update" : "Add"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default QuickAccessServicesAdmin;
