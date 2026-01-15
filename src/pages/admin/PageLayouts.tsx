import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, LayoutGrid, Settings2, Type, Square, Loader2 } from "lucide-react";

interface PageLayoutSettings {
  id: string;
  page_key: string;
  page_title: string;
  layout_type: string;
  columns_mobile: number;
  columns_tablet: number;
  columns_desktop: number;
  items_gap: number;
  card_padding: number;
  card_border_radius: number;
  card_shadow: string;
  card_min_height: number;
  logo_size: number;
  logo_border_radius: number;
  show_logo_border: boolean;
  show_description: boolean;
  show_rating: boolean;
  show_branch_count: boolean;
  description_lines: number;
  primary_button_text: string;
  secondary_button_text: string | null;
  button_width: number;
}

const PageLayouts = () => {
  const queryClient = useQueryClient();
  const [selectedPage, setSelectedPage] = useState<string>("labs_listing");
  const [settings, setSettings] = useState<PageLayoutSettings | null>(null);

  const { data: pages, isLoading } = useQuery({
    queryKey: ["page-layout-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_layout_settings")
        .select("*")
        .order("page_title");
      if (error) throw error;
      return data as PageLayoutSettings[];
    },
  });

  useEffect(() => {
    if (pages && pages.length > 0) {
      const page = pages.find((p) => p.page_key === selectedPage) || pages[0];
      setSettings(page);
      setSelectedPage(page.page_key);
    }
  }, [pages, selectedPage]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<PageLayoutSettings>) => {
      if (!settings) return;
      const { error } = await supabase
        .from("page_layout_settings")
        .update(data)
        .eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-layout-settings"] });
      toast.success("Settings saved successfully!");
    },
    onError: (error) => {
      toast.error("Failed to save settings");
      console.error(error);
    },
  });

  const updateSetting = <K extends keyof PageLayoutSettings>(
    key: K,
    value: PageLayoutSettings[K]
  ) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  const handleSave = () => {
    if (!settings) return;
    const { id, page_key, ...updateData } = settings;
    saveMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!settings) {
    return (
      <AdminLayout>
        <div className="text-center py-16 text-muted-foreground">
          No page settings found.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Page Layouts</h1>
            <p className="text-muted-foreground">
              Customize card layouts, sizes, and styling for listing pages
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPage} onValueChange={setSelectedPage}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select page" />
              </SelectTrigger>
              <SelectContent>
                {pages?.map((page) => (
                  <SelectItem key={page.page_key} value={page.page_key}>
                    {page.page_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="layout" className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="layout" className="gap-1">
                  <LayoutGrid className="w-4 h-4" />
                  Layout
                </TabsTrigger>
                <TabsTrigger value="card" className="gap-1">
                  <Square className="w-4 h-4" />
                  Card
                </TabsTrigger>
                <TabsTrigger value="logo" className="gap-1">
                  <Settings2 className="w-4 h-4" />
                  Logo
                </TabsTrigger>
                <TabsTrigger value="content" className="gap-1">
                  <Type className="w-4 h-4" />
                  Content
                </TabsTrigger>
              </TabsList>

              <TabsContent value="layout" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Layout Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>Layout Type</Label>
                      <Select
                        value={settings.layout_type}
                        onValueChange={(v) => updateSetting("layout_type", v)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="list">List (Full Width)</SelectItem>
                          <SelectItem value="grid">Grid</SelectItem>
                          <SelectItem value="compact">Compact</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {settings.layout_type !== "list" && (
                      <>
                        <div>
                          <Label>Columns (Mobile): {settings.columns_mobile}</Label>
                          <Slider
                            value={[settings.columns_mobile]}
                            onValueChange={([v]) => updateSetting("columns_mobile", v)}
                            min={1}
                            max={2}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Columns (Tablet): {settings.columns_tablet}</Label>
                          <Slider
                            value={[settings.columns_tablet]}
                            onValueChange={([v]) => updateSetting("columns_tablet", v)}
                            min={1}
                            max={3}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Columns (Desktop): {settings.columns_desktop}</Label>
                          <Slider
                            value={[settings.columns_desktop]}
                            onValueChange={([v]) => updateSetting("columns_desktop", v)}
                            min={1}
                            max={4}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <Label>Items Gap: {settings.items_gap}px</Label>
                      <Slider
                        value={[settings.items_gap]}
                        onValueChange={([v]) => updateSetting("items_gap", v)}
                        min={8}
                        max={48}
                        step={4}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="card" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Card Styling</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>Card Padding: {settings.card_padding}px</Label>
                      <Slider
                        value={[settings.card_padding]}
                        onValueChange={([v]) => updateSetting("card_padding", v)}
                        min={8}
                        max={48}
                        step={4}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Border Radius: {settings.card_border_radius}px</Label>
                      <Slider
                        value={[settings.card_border_radius]}
                        onValueChange={([v]) => updateSetting("card_border_radius", v)}
                        min={0}
                        max={24}
                        step={2}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Min Height: {settings.card_min_height}px</Label>
                      <Slider
                        value={[settings.card_min_height]}
                        onValueChange={([v]) => updateSetting("card_min_height", v)}
                        min={80}
                        max={300}
                        step={10}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Card Shadow</Label>
                      <Select
                        value={settings.card_shadow}
                        onValueChange={(v) => updateSetting("card_shadow", v)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="md">Medium</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logo" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Logo Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>Logo Size: {settings.logo_size}px</Label>
                      <Slider
                        value={[settings.logo_size]}
                        onValueChange={([v]) => updateSetting("logo_size", v)}
                        min={48}
                        max={160}
                        step={8}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Logo Border Radius: {settings.logo_border_radius}px</Label>
                      <Slider
                        value={[settings.logo_border_radius]}
                        onValueChange={([v]) => updateSetting("logo_border_radius", v)}
                        min={0}
                        max={80}
                        step={4}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Show Logo Border</Label>
                      <Switch
                        checked={settings.show_logo_border}
                        onCheckedChange={(v) => updateSetting("show_logo_border", v)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content & Buttons</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label>Show Description</Label>
                      <Switch
                        checked={settings.show_description}
                        onCheckedChange={(v) => updateSetting("show_description", v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Show Rating</Label>
                      <Switch
                        checked={settings.show_rating}
                        onCheckedChange={(v) => updateSetting("show_rating", v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Show Branch Count</Label>
                      <Switch
                        checked={settings.show_branch_count}
                        onCheckedChange={(v) => updateSetting("show_branch_count", v)}
                      />
                    </div>

                    <div>
                      <Label>Description Lines: {settings.description_lines}</Label>
                      <Slider
                        value={[settings.description_lines]}
                        onValueChange={([v]) => updateSetting("description_lines", v)}
                        min={1}
                        max={4}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="primary_btn">Primary Button Text</Label>
                      <Input
                        id="primary_btn"
                        value={settings.primary_button_text}
                        onChange={(e) => updateSetting("primary_button_text", e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="secondary_btn">Secondary Button Text</Label>
                      <Input
                        id="secondary_btn"
                        value={settings.secondary_button_text || ""}
                        onChange={(e) => updateSetting("secondary_button_text", e.target.value || null)}
                        className="mt-2"
                        placeholder="Leave empty to hide"
                      />
                    </div>

                    <div>
                      <Label>Button Width: {settings.button_width}px</Label>
                      <Slider
                        value={[settings.button_width]}
                        onValueChange={([v]) => updateSetting("button_width", v)}
                        min={100}
                        max={250}
                        step={10}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="border rounded-lg overflow-hidden"
                  style={{
                    padding: `${settings.card_padding}px`,
                    borderRadius: `${settings.card_border_radius}px`,
                    boxShadow:
                      settings.card_shadow === "none"
                        ? "none"
                        : settings.card_shadow === "sm"
                        ? "0 1px 2px rgba(0,0,0,0.05)"
                        : settings.card_shadow === "lg"
                        ? "0 10px 15px rgba(0,0,0,0.1)"
                        : "0 4px 6px rgba(0,0,0,0.1)",
                    minHeight: `${settings.card_min_height}px`,
                  }}
                >
                  <div className="flex gap-4">
                    {/* Logo Preview */}
                    <div
                      className="flex-shrink-0 bg-muted flex items-center justify-center"
                      style={{
                        width: `${settings.logo_size}px`,
                        height: `${settings.logo_size}px`,
                        borderRadius: `${settings.logo_border_radius}px`,
                        border: settings.show_logo_border ? "2px solid hsl(var(--border))" : "none",
                      }}
                    >
                      <span className="text-xs text-muted-foreground">Logo</span>
                    </div>

                    {/* Content Preview */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 w-3/4 bg-primary/20 rounded" />
                      {settings.show_branch_count && (
                        <div className="h-3 w-1/2 bg-muted rounded" />
                      )}
                      {settings.show_rating && (
                        <div className="h-3 w-1/3 bg-muted rounded" />
                      )}
                      {settings.show_description && (
                        <div className="space-y-1">
                          {Array.from({ length: settings.description_lines }).map((_, i) => (
                            <div key={i} className="h-2 w-full bg-muted/50 rounded" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buttons Preview */}
                  <div className="flex flex-col items-end gap-2 mt-4">
                    <div
                      className="bg-primary rounded h-8"
                      style={{ width: `${settings.button_width}px` }}
                    />
                    {settings.secondary_button_text && (
                      <div
                        className="border rounded h-8"
                        style={{ width: `${settings.button_width}px` }}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PageLayouts;