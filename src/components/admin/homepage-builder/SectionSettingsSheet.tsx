import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Settings2, Image, Palette, Save } from "lucide-react";
import { HomepageSection } from "@/hooks/useHomepageSections";

interface SectionSettingsSheetProps {
  section: HomepageSection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updates: Partial<HomepageSection>) => void;
  onSave: () => void;
}

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

export const SectionSettingsSheet = ({
  section,
  open,
  onOpenChange,
  onUpdate,
  onSave,
}: SectionSettingsSheetProps) => {
  if (!section) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            {section.title} Settings
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <Tabs defaultValue="layout">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="layout" className="text-xs">
                <LayoutGrid className="w-3 h-3 mr-1" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="cards" className="text-xs">
                <Settings2 className="w-3 h-3 mr-1" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="images" className="text-xs">
                <Image className="w-3 h-3 mr-1" />
                Images
              </TabsTrigger>
              <TabsTrigger value="style" className="text-xs">
                <Palette className="w-3 h-3 mr-1" />
                Style
              </TabsTrigger>
            </TabsList>

            <TabsContent value="layout" className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input
                    value={section.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input
                    value={section.subtitle || ""}
                    onChange={(e) => onUpdate({ subtitle: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Section Type</Label>
                  <Select
                    value={section.section_type}
                    onValueChange={(v) => onUpdate({ section_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sectionTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Items</Label>
                  <Input
                    type="number"
                    value={section.max_items}
                    onChange={(e) =>
                      onUpdate({ max_items: parseInt(e.target.value) || 8 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Columns (Desktop / Tablet / Mobile)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Desktop</span>
                      <span className="font-medium">{section.columns_desktop}</span>
                    </div>
                    <Slider
                      value={[section.columns_desktop]}
                      onValueChange={([v]) => onUpdate({ columns_desktop: v })}
                      min={1}
                      max={6}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tablet</span>
                      <span className="font-medium">{section.columns_tablet}</span>
                    </div>
                    <Slider
                      value={[section.columns_tablet]}
                      onValueChange={([v]) => onUpdate({ columns_tablet: v })}
                      min={1}
                      max={4}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mobile</span>
                      <span className="font-medium">{section.columns_mobile}</span>
                    </div>
                    <Slider
                      value={[section.columns_mobile]}
                      onValueChange={([v]) => onUpdate({ columns_mobile: v })}
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
                    <span className="text-sm text-muted-foreground">
                      {section.items_gap}px
                    </span>
                  </div>
                  <Slider
                    value={[section.items_gap]}
                    onValueChange={([v]) => onUpdate({ items_gap: v })}
                    min={8}
                    max={48}
                    step={4}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Padding Y (px)</Label>
                    <span className="text-sm text-muted-foreground">
                      {section.section_padding_y}px
                    </span>
                  </div>
                  <Slider
                    value={[section.section_padding_y]}
                    onValueChange={([v]) => onUpdate({ section_padding_y: v })}
                    min={0}
                    max={80}
                    step={4}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Visible on Homepage</Label>
                <Switch
                  checked={section.is_visible}
                  onCheckedChange={(checked) => onUpdate({ is_visible: checked })}
                />
              </div>
            </TabsContent>

            <TabsContent value="cards" className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Card Height (px)</Label>
                    <span className="text-sm text-muted-foreground">
                      {section.card_height}px
                    </span>
                  </div>
                  <Slider
                    value={[section.card_height]}
                    onValueChange={([v]) => onUpdate({ card_height: v })}
                    min={100}
                    max={400}
                    step={10}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Border Radius (px)</Label>
                    <span className="text-sm text-muted-foreground">
                      {section.card_border_radius}px
                    </span>
                  </div>
                  <Slider
                    value={[section.card_border_radius]}
                    onValueChange={([v]) => onUpdate({ card_border_radius: v })}
                    min={0}
                    max={32}
                    step={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Card Shadow</Label>
                <Select
                  value={section.card_shadow}
                  onValueChange={(v) => onUpdate({ card_shadow: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shadowOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Image Height (px)</Label>
                    <span className="text-sm text-muted-foreground">
                      {section.image_height}px
                    </span>
                  </div>
                  <Slider
                    value={[section.image_height]}
                    onValueChange={([v]) => onUpdate({ image_height: v })}
                    min={50}
                    max={300}
                    step={10}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Border Radius (px)</Label>
                    <span className="text-sm text-muted-foreground">
                      {section.image_border_radius}px
                    </span>
                  </div>
                  <Slider
                    value={[section.image_border_radius]}
                    onValueChange={([v]) => onUpdate({ image_border_radius: v })}
                    min={0}
                    max={32}
                    step={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Image Fit</Label>
                <Select
                  value={section.image_fit}
                  onValueChange={(v) => onUpdate({ image_fit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {imageFitOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Position X (%)</Label>
                    <span className="text-sm text-muted-foreground">
                      {section.image_position_x}%
                    </span>
                  </div>
                  <Slider
                    value={[section.image_position_x]}
                    onValueChange={([v]) => onUpdate({ image_position_x: v })}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Position Y (%)</Label>
                    <span className="text-sm text-muted-foreground">
                      {section.image_position_y}%
                    </span>
                  </div>
                  <Slider
                    value={[section.image_position_y]}
                    onValueChange={([v]) => onUpdate({ image_position_y: v })}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      value={section.background_color}
                      onChange={(e) =>
                        onUpdate({ background_color: e.target.value })
                      }
                      placeholder="transparent"
                    />
                    <input
                      type="color"
                      value={
                        section.background_color !== "transparent"
                          ? section.background_color
                          : "#ffffff"
                      }
                      onChange={(e) =>
                        onUpdate({ background_color: e.target.value })
                      }
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      value={section.text_color}
                      onChange={(e) => onUpdate({ text_color: e.target.value })}
                      placeholder="inherit"
                    />
                    <input
                      type="color"
                      value={section.text_color || "#000000"}
                      onChange={(e) => onUpdate({ text_color: e.target.value })}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Background Gradient</Label>
                <Input
                  value={section.background_gradient || ""}
                  onChange={(e) =>
                    onUpdate({ background_gradient: e.target.value })
                  }
                  placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t">
            <Button onClick={onSave} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Apply Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
