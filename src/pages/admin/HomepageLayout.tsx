import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Loader2, Save, Eye, Plus, GripVertical, Settings2, 
  LayoutGrid, Image, Palette, ChevronDown, ChevronUp,
  Trash2, Copy
} from "lucide-react";
import { HomepageSection } from "@/hooks/useHomepageSections";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const shadowOptions = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

const imageFitOptions = [
  { value: "cover", label: "Cover (fill)" },
  { value: "contain", label: "Contain (fit)" },
  { value: "fill", label: "Stretch" },
  { value: "none", label: "Original" },
];

const sectionTypeOptions = [
  { value: "grid", label: "Grid Layout" },
  { value: "carousel", label: "Carousel/Slider" },
  { value: "list", label: "List View" },
];

const HomepageLayoutPage = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setSections(data as HomepageSection[]);
    } catch (error) {
      console.error("Error fetching sections:", error);
      toast.error("Failed to load homepage sections");
    } finally {
      setLoading(false);
    }
  };

  const updateSection = (id: string, updates: Partial<HomepageSection>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const saveSection = async (section: HomepageSection) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("homepage_sections")
        .update({
          title: section.title,
          subtitle: section.subtitle,
          is_visible: section.is_visible,
          display_order: section.display_order,
          columns_desktop: section.columns_desktop,
          columns_tablet: section.columns_tablet,
          columns_mobile: section.columns_mobile,
          section_padding_x: section.section_padding_x,
          section_padding_y: section.section_padding_y,
          items_gap: section.items_gap,
          max_items: section.max_items,
          card_width: section.card_width,
          card_height: section.card_height,
          card_border_radius: section.card_border_radius,
          card_shadow: section.card_shadow,
          image_height: section.image_height,
          image_width: section.image_width,
          image_position_x: section.image_position_x,
          image_position_y: section.image_position_y,
          image_fit: section.image_fit,
          image_border_radius: section.image_border_radius,
          background_color: section.background_color,
          background_gradient: section.background_gradient,
          text_color: section.text_color,
          accent_color: section.accent_color,
          section_type: section.section_type,
        })
        .eq("id", section.id);

      if (error) throw error;
      toast.success(`${section.title} settings saved!`);
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error("Failed to save section");
    } finally {
      setSaving(false);
    }
  };

  const saveAllSections = async () => {
    setSaving(true);
    try {
      for (const section of sections) {
        await saveSection(section);
      }
      toast.success("All sections saved!");
    } catch (error) {
      toast.error("Failed to save some sections");
    } finally {
      setSaving(false);
    }
  };

  const addNewSection = async () => {
    try {
      const newOrder = sections.length > 0 ? Math.max(...sections.map(s => s.display_order)) + 1 : 1;
      const { data, error } = await supabase
        .from("homepage_sections")
        .insert({
          section_key: `custom_section_${Date.now()}`,
          title: "New Section",
          subtitle: "Add your content here",
          display_order: newOrder,
        })
        .select()
        .single();

      if (error) throw error;
      setSections(prev => [...prev, data as HomepageSection]);
      toast.success("New section added!");
    } catch (error) {
      console.error("Error adding section:", error);
      toast.error("Failed to add section");
    }
  };

  const deleteSection = async (id: string, sectionKey: string) => {
    // Prevent deleting core sections
    const coreSections = ['service_cards', 'featured_labs', 'featured_doctors', 'featured_nurses', 'surgeries'];
    if (coreSections.includes(sectionKey)) {
      toast.error("Cannot delete core sections. You can hide them instead.");
      return;
    }

    try {
      const { error } = await supabase
        .from("homepage_sections")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setSections(prev => prev.filter(s => s.id !== id));
      toast.success("Section deleted!");
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section");
    }
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === sections.length - 1)
    ) return;

    const newSections = [...sections];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap display_order values
    const tempOrder = newSections[index].display_order;
    newSections[index].display_order = newSections[swapIndex].display_order;
    newSections[swapIndex].display_order = tempOrder;
    
    // Swap positions
    [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
    
    setSections(newSections);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Homepage Layout Manager</h1>
            <p className="text-muted-foreground">
              Full control over every section, card size, image position & styling
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open("/", "_blank")}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" onClick={addNewSection}>
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
            <Button onClick={saveAllSections} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save All
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <Card key={section.id} className={!section.is_visible ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={index === sections.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {section.section_key} • {section.section_type}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`visible-${section.id}`} className="text-sm">
                        Visible
                      </Label>
                      <Switch
                        id={`visible-${section.id}`}
                        checked={section.is_visible}
                        onCheckedChange={(checked) => updateSection(section.id, { is_visible: checked })}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                    >
                      <Settings2 className="w-5 h-5" />
                    </Button>
                    {!['service_cards', 'featured_labs', 'featured_doctors', 'featured_nurses', 'surgeries'].includes(section.section_key) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteSection(section.id, section.section_key)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {activeSection === section.id && (
                <CardContent className="border-t pt-4">
                  <Tabs defaultValue="layout" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="layout">
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        Layout
                      </TabsTrigger>
                      <TabsTrigger value="cards">
                        <Settings2 className="w-4 h-4 mr-2" />
                        Cards
                      </TabsTrigger>
                      <TabsTrigger value="images">
                        <Image className="w-4 h-4 mr-2" />
                        Images
                      </TabsTrigger>
                      <TabsTrigger value="style">
                        <Palette className="w-4 h-4 mr-2" />
                        Style
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="layout" className="space-y-6 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Section Title</Label>
                          <Input
                            value={section.title}
                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Subtitle</Label>
                          <Input
                            value={section.subtitle || ""}
                            onChange={(e) => updateSection(section.id, { subtitle: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Section Type</Label>
                          <Select 
                            value={section.section_type} 
                            onValueChange={(v) => updateSection(section.id, { section_type: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {sectionTypeOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Max Items to Show</Label>
                          <Input
                            type="number"
                            value={section.max_items}
                            onChange={(e) => updateSection(section.id, { max_items: parseInt(e.target.value) || 8 })}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label>Columns (Desktop / Tablet / Mobile)</Label>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Desktop</span>
                              <span className="text-sm font-medium">{section.columns_desktop}</span>
                            </div>
                            <Slider
                              value={[section.columns_desktop]}
                              onValueChange={([v]) => updateSection(section.id, { columns_desktop: v })}
                              min={1}
                              max={6}
                              step={1}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Tablet</span>
                              <span className="text-sm font-medium">{section.columns_tablet}</span>
                            </div>
                            <Slider
                              value={[section.columns_tablet]}
                              onValueChange={([v]) => updateSection(section.id, { columns_tablet: v })}
                              min={1}
                              max={4}
                              step={1}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Mobile</span>
                              <span className="text-sm font-medium">{section.columns_mobile}</span>
                            </div>
                            <Slider
                              value={[section.columns_mobile]}
                              onValueChange={([v]) => updateSection(section.id, { columns_mobile: v })}
                              min={1}
                              max={2}
                              step={1}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Items Gap (px)</Label>
                            <span className="text-sm text-muted-foreground">{section.items_gap}px</span>
                          </div>
                          <Slider
                            value={[section.items_gap]}
                            onValueChange={([v]) => updateSection(section.id, { items_gap: v })}
                            min={8}
                            max={48}
                            step={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Section Padding Y (px)</Label>
                            <span className="text-sm text-muted-foreground">{section.section_padding_y}px</span>
                          </div>
                          <Slider
                            value={[section.section_padding_y]}
                            onValueChange={([v]) => updateSection(section.id, { section_padding_y: v })}
                            min={16}
                            max={96}
                            step={8}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="cards" className="space-y-6 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Card Height (px)</Label>
                            <span className="text-sm text-muted-foreground">{section.card_height}px</span>
                          </div>
                          <Slider
                            value={[section.card_height]}
                            onValueChange={([v]) => updateSection(section.id, { card_height: v })}
                            min={150}
                            max={500}
                            step={10}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Border Radius (px)</Label>
                            <span className="text-sm text-muted-foreground">{section.card_border_radius}px</span>
                          </div>
                          <Slider
                            value={[section.card_border_radius]}
                            onValueChange={([v]) => updateSection(section.id, { card_border_radius: v })}
                            min={0}
                            max={32}
                            step={2}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Card Shadow</Label>
                        <Select 
                          value={section.card_shadow} 
                          onValueChange={(v) => updateSection(section.id, { card_shadow: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {shadowOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Card Preview */}
                      <div className="p-4 bg-muted rounded-lg">
                        <Label className="text-sm mb-2 block">Card Preview</Label>
                        <div 
                          className={`bg-card border shadow-${section.card_shadow}`}
                          style={{
                            height: `${Math.min(section.card_height, 200)}px`,
                            borderRadius: `${section.card_border_radius}px`,
                            width: '200px'
                          }}
                        >
                          <div 
                            className="bg-muted"
                            style={{
                              height: `${Math.min(section.image_height, 100)}px`,
                              borderRadius: `${section.image_border_radius}px ${section.image_border_radius}px 0 0`
                            }}
                          />
                          <div className="p-3">
                            <div className="h-3 bg-muted-foreground/20 rounded w-3/4 mb-2" />
                            <div className="h-2 bg-muted-foreground/10 rounded w-1/2" />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="images" className="space-y-6 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Image Height (px)</Label>
                            <span className="text-sm text-muted-foreground">{section.image_height}px</span>
                          </div>
                          <Slider
                            value={[section.image_height]}
                            onValueChange={([v]) => updateSection(section.id, { image_height: v })}
                            min={80}
                            max={300}
                            step={10}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Image Border Radius (px)</Label>
                            <span className="text-sm text-muted-foreground">{section.image_border_radius}px</span>
                          </div>
                          <Slider
                            value={[section.image_border_radius]}
                            onValueChange={([v]) => updateSection(section.id, { image_border_radius: v })}
                            min={0}
                            max={24}
                            step={2}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label>Image Focal Point (X / Y)</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Horizontal (X)</span>
                              <span className="text-sm font-medium">{section.image_position_x}%</span>
                            </div>
                            <Slider
                              value={[section.image_position_x]}
                              onValueChange={([v]) => updateSection(section.id, { image_position_x: v })}
                              min={0}
                              max={100}
                              step={5}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Left</span>
                              <span>Center</span>
                              <span>Right</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Vertical (Y)</span>
                              <span className="text-sm font-medium">{section.image_position_y}%</span>
                            </div>
                            <Slider
                              value={[section.image_position_y]}
                              onValueChange={([v]) => updateSection(section.id, { image_position_y: v })}
                              min={0}
                              max={100}
                              step={5}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Top</span>
                              <span>Center</span>
                              <span>Bottom</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Image Fit Mode</Label>
                        <Select 
                          value={section.image_fit} 
                          onValueChange={(v) => updateSection(section.id, { image_fit: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {imageFitOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>

                    <TabsContent value="style" className="space-y-6 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Background Color</Label>
                          <Input
                            value={section.background_color}
                            onChange={(e) => updateSection(section.id, { background_color: e.target.value })}
                            placeholder="transparent, #ffffff, etc."
                          />
                        </div>
                        <div>
                          <Label>Background Gradient</Label>
                          <Input
                            value={section.background_gradient || ""}
                            onChange={(e) => updateSection(section.id, { background_gradient: e.target.value })}
                            placeholder="from-blue-500 to-purple-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Text Color</Label>
                          <Input
                            value={section.text_color}
                            onChange={(e) => updateSection(section.id, { text_color: e.target.value })}
                            placeholder="inherit, #000000, etc."
                          />
                        </div>
                        <div>
                          <Label>Accent Color</Label>
                          <Input
                            value={section.accent_color || ""}
                            onChange={(e) => updateSection(section.id, { accent_color: e.target.value })}
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end mt-4 pt-4 border-t">
                    <Button onClick={() => saveSection(section)} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Section
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default HomepageLayoutPage;
