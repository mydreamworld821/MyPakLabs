import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FlaskConical, Pill, Heart, Building2, Syringe, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface LayoutSettings {
  id: string;
  icon_container_size: number;
  icon_size: number;
  items_gap: number;
  show_labels: boolean;
  justify_content: string;
  layout_mode: string;
  is_visible: boolean;
}

const mockServices = [
  { id: "1", title: "Labs", icon: FlaskConical, bg: "bg-sky-50", color: "text-sky-600" },
  { id: "2", title: "Medicines", icon: Pill, bg: "bg-green-50", color: "text-green-600" },
  { id: "3", title: "Health Hub", icon: Heart, bg: "bg-rose-50", color: "text-rose-600" },
  { id: "4", title: "Hospitals", icon: Building2, bg: "bg-purple-50", color: "text-purple-600" },
  { id: "5", title: "Surgeries", icon: Syringe, bg: "bg-amber-50", color: "text-amber-600" },
];

const QuickAccessLayoutAdmin = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<LayoutSettings>({
    id: "",
    icon_container_size: 56,
    icon_size: 24,
    items_gap: 16,
    show_labels: true,
    justify_content: "center",
    layout_mode: "auto",
    is_visible: true,
  });

  const { data: sectionConfig, isLoading } = useQuery({
    queryKey: ["quick-access-layout"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .eq("section_key", "quick_access")
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (sectionConfig) {
      setSettings({
        id: sectionConfig.id,
        icon_container_size: sectionConfig.icon_container_size || 56,
        icon_size: sectionConfig.icon_size || 24,
        items_gap: sectionConfig.items_gap || 16,
        show_labels: sectionConfig.show_labels ?? true,
        justify_content: sectionConfig.justify_content || "center",
        layout_mode: sectionConfig.layout_mode || "auto",
        is_visible: sectionConfig.is_visible ?? true,
      });
    }
  }, [sectionConfig]);

  const saveMutation = useMutation({
    mutationFn: async (data: LayoutSettings) => {
      const { error } = await supabase
        .from("homepage_sections")
        .update({
          icon_container_size: data.icon_container_size,
          icon_size: data.icon_size,
          items_gap: data.items_gap,
          show_labels: data.show_labels,
          justify_content: data.justify_content,
          layout_mode: data.layout_mode,
          is_visible: data.is_visible,
        })
        .eq("section_key", "quick_access");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-access-layout"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-section-quick_access"] });
      toast.success("Layout settings saved!");
    },
    onError: (error) => {
      toast.error("Failed to save: " + error.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  // Calculate container size class
  const getContainerStyle = () => ({
    width: settings.icon_container_size,
    height: settings.icon_container_size,
  });

  // Get justify class
  const getJustifyClass = () => {
    switch (settings.justify_content) {
      case "start": return "justify-start";
      case "center": return "justify-center";
      case "end": return "justify-end";
      case "between": return "justify-between";
      case "around": return "justify-around";
      default: return "justify-center";
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          Loading...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quick Access Layout</h1>
            <p className="text-muted-foreground">
              Adjust size, spacing, and layout of quick access icons
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/quick-access-services">
                <ExternalLink className="w-4 h-4 mr-2" />
                Manage Services
              </Link>
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-background border rounded-lg p-6 min-h-[200px]">
                <div 
                  className={`flex flex-wrap ${getJustifyClass()}`}
                  style={{ gap: settings.items_gap }}
                >
                  {mockServices.map((service) => (
                    <div 
                      key={service.id} 
                      className="flex flex-col items-center"
                      style={{ minWidth: settings.icon_container_size + 16 }}
                    >
                      <div
                        className={`rounded-xl ${service.bg} flex items-center justify-center transition-all`}
                        style={getContainerStyle()}
                      >
                        <service.icon
                          className={service.color}
                          size={settings.icon_size}
                        />
                      </div>
                      {settings.show_labels && (
                        <span className="text-xs font-medium text-foreground text-center mt-1.5 line-clamp-1">
                          {service.title}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Preview with {mockServices.length} items • Icons auto-adjust based on count
              </p>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Layout Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visibility Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Section</Label>
                  <p className="text-xs text-muted-foreground">Toggle visibility on homepage</p>
                </div>
                <Switch
                  checked={settings.is_visible}
                  onCheckedChange={(v) => setSettings({ ...settings, is_visible: v })}
                />
              </div>

              {/* Icon Container Size */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Icon Container Size</Label>
                  <span className="text-sm font-medium">{settings.icon_container_size}px</span>
                </div>
                <Slider
                  value={[settings.icon_container_size]}
                  onValueChange={([v]) => setSettings({ ...settings, icon_container_size: v })}
                  min={40}
                  max={80}
                  step={4}
                />
                <p className="text-xs text-muted-foreground">
                  Size of the colored background container
                </p>
              </div>

              {/* Icon Size */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Icon Size</Label>
                  <span className="text-sm font-medium">{settings.icon_size}px</span>
                </div>
                <Slider
                  value={[settings.icon_size]}
                  onValueChange={([v]) => setSettings({ ...settings, icon_size: v })}
                  min={16}
                  max={40}
                  step={2}
                />
                <p className="text-xs text-muted-foreground">
                  Size of the icon inside the container
                </p>
              </div>

              {/* Gap Between Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Gap Between Items</Label>
                  <span className="text-sm font-medium">{settings.items_gap}px</span>
                </div>
                <Slider
                  value={[settings.items_gap]}
                  onValueChange={([v]) => setSettings({ ...settings, items_gap: v })}
                  min={8}
                  max={32}
                  step={4}
                />
              </div>

              {/* Alignment */}
              <div className="space-y-2">
                <Label>Alignment</Label>
                <Select
                  value={settings.justify_content}
                  onValueChange={(v) => setSettings({ ...settings, justify_content: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="end">Right</SelectItem>
                    <SelectItem value="between">Space Between</SelectItem>
                    <SelectItem value="around">Space Around</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Show Labels */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Labels</Label>
                  <p className="text-xs text-muted-foreground">Display text below icons</p>
                </div>
                <Switch
                  checked={settings.show_labels}
                  onCheckedChange={(v) => setSettings({ ...settings, show_labels: v })}
                />
              </div>

              {/* Layout Mode */}
              <div className="space-y-2">
                <Label>Layout Mode</Label>
                <Select
                  value={settings.layout_mode}
                  onValueChange={(v) => setSettings({ ...settings, layout_mode: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (Responsive)</SelectItem>
                    <SelectItem value="fixed">Fixed Width</SelectItem>
                    <SelectItem value="fill">Fill Container</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Auto: Icons wrap and adjust automatically
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default QuickAccessLayoutAdmin;
