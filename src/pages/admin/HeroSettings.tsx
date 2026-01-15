import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Loader2, Save, Plus, X, Image as ImageIcon, Eye, Shield, Clock, TrendingDown, Award, Star, Heart, Zap, Users, BadgeCheck, CheckCircle } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface TrustBadge {
  icon: string;
  text: string;
}

interface HeroSettings {
  id: string;
  title_line1: string;
  title_highlight: string;
  title_line2: string;
  badge_text: string | null;
  hero_image_url: string | null;
  typing_words: string[];
  search_placeholder: string | null;
  trust_badges: TrustBadge[] | null;
  background_gradient: string | null;
  image_position_x: number | null;
  image_position_y: number | null;
  image_width: number | null;
  image_height: number | null;
  image_overlay_opacity: number | null;
  image_overlay_color: string | null;
  image_blend_mode: string | null;
  image_gradient_direction: string | null;
  image_fade_intensity: number | null;
  image_soft_edges: boolean | null;
  image_mask_type: string | null;
  // Layout controls
  hero_max_width: number | null;
  hero_min_height: number | null;
  hero_padding_x: number | null;
  hero_padding_y: number | null;
  content_ratio: number | null;
  hero_alignment: string | null;
  is_active: boolean;
}

const availableIcons = [
  { value: "Shield", label: "Shield", icon: Shield },
  { value: "Clock", label: "Clock", icon: Clock },
  { value: "TrendingDown", label: "Trending Down", icon: TrendingDown },
  { value: "Award", label: "Award", icon: Award },
  { value: "Star", label: "Star", icon: Star },
  { value: "Heart", label: "Heart", icon: Heart },
  { value: "Zap", label: "Zap", icon: Zap },
  { value: "Users", label: "Users", icon: Users },
  { value: "BadgeCheck", label: "Badge Check", icon: BadgeCheck },
  { value: "CheckCircle", label: "Check Circle", icon: CheckCircle },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield, Clock, TrendingDown, Award, Star, Heart, Zap, Users, BadgeCheck, CheckCircle
};

const gradientPresets = [
  { name: "Amber Blue", value: "from-amber-800 via-amber-700 to-blue-900", colors: ["#92400e", "#d97706", "#1e3a8a"] },
  { name: "Ocean Blue", value: "from-blue-900 via-blue-800 to-cyan-700", colors: ["#1e3a8a", "#1e40af", "#0e7490"] },
  { name: "Forest Green", value: "from-emerald-900 via-green-800 to-teal-700", colors: ["#064e3b", "#166534", "#0f766e"] },
  { name: "Royal Purple", value: "from-purple-900 via-violet-800 to-indigo-700", colors: ["#581c87", "#5b21b6", "#4338ca"] },
  { name: "Sunset Orange", value: "from-orange-800 via-red-700 to-rose-600", colors: ["#9a3412", "#b91c1c", "#e11d48"] },
  { name: "Dark Slate", value: "from-slate-900 via-gray-800 to-zinc-700", colors: ["#0f172a", "#1f2937", "#3f3f46"] },
  { name: "Teal Cyan", value: "from-teal-900 via-cyan-800 to-sky-700", colors: ["#134e4a", "#155e75", "#0369a1"] },
  { name: "Pink Fuchsia", value: "from-pink-800 via-fuchsia-700 to-purple-600", colors: ["#9d174d", "#a21caf", "#9333ea"] },
];

const HeroSettingsPage = () => {
  const [settings, setSettings] = useState<HeroSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newWord, setNewWord] = useState("");

  // Form state
  const [titleLine1, setTitleLine1] = useState("");
  const [titleHighlight, setTitleHighlight] = useState("");
  const [titleLine2, setTitleLine2] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [typingWords, setTypingWords] = useState<string[]>([]);
  const [searchPlaceholder, setSearchPlaceholder] = useState("");
  const [trustBadges, setTrustBadges] = useState<TrustBadge[]>([]);
  const [newBadgeIcon, setNewBadgeIcon] = useState("Shield");
  const [newBadgeText, setNewBadgeText] = useState("");
  const [backgroundGradient, setBackgroundGradient] = useState("from-amber-800 via-amber-700 to-blue-900");
  const [imagePositionX, setImagePositionX] = useState(50);
  const [imagePositionY, setImagePositionY] = useState(30);
  const [imageWidth, setImageWidth] = useState(100);
  const [imageHeight, setImageHeight] = useState(100);
  const [imageOverlayOpacity, setImageOverlayOpacity] = useState(30);
  const [imageOverlayColor, setImageOverlayColor] = useState("from-background");
  const [imageFadeIntensity, setImageFadeIntensity] = useState(50);
  const [imageGradientDirection, setImageGradientDirection] = useState("left");
  const [imageSoftEdges, setImageSoftEdges] = useState(true);
  const [imageMaskType, setImageMaskType] = useState("gradient");
  // Layout state
  const [heroMaxWidth, setHeroMaxWidth] = useState(1400);
  const [heroMinHeight, setHeroMinHeight] = useState(400);
  const [heroPaddingX, setHeroPaddingX] = useState(16);
  const [heroPaddingY, setHeroPaddingY] = useState(48);
  const [contentRatio, setContentRatio] = useState(50);
  const [heroAlignment, setHeroAlignment] = useState("center");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_settings")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings(data as unknown as HeroSettings);
        setTitleLine1(data.title_line1 || "");
        setTitleHighlight(data.title_highlight || "");
        setTitleLine2(data.title_line2 || "");
        setBadgeText(data.badge_text || "");
        setHeroImageUrl(data.hero_image_url || "");
        setTypingWords(data.typing_words || []);
        setSearchPlaceholder(data.search_placeholder || "");
        setBackgroundGradient(data.background_gradient || "from-amber-800 via-amber-700 to-blue-900");
        setImagePositionX(data.image_position_x ?? 50);
        setImagePositionY(data.image_position_y ?? 30);
        setImageWidth(data.image_width ?? 100);
        setImageHeight(data.image_height ?? 100);
        setImageOverlayOpacity(data.image_overlay_opacity ?? 30);
        setImageOverlayColor(data.image_overlay_color || "from-background");
        setImageFadeIntensity(data.image_fade_intensity ?? 50);
        setImageGradientDirection(data.image_gradient_direction || "left");
        setImageSoftEdges(data.image_soft_edges ?? true);
        setImageMaskType(data.image_mask_type || "gradient");
        // Layout settings
        setHeroMaxWidth(data.hero_max_width ?? 1400);
        setHeroMinHeight(data.hero_min_height ?? 400);
        setHeroPaddingX(data.hero_padding_x ?? 16);
        setHeroPaddingY(data.hero_padding_y ?? 48);
        setContentRatio(data.content_ratio ?? 50);
        setHeroAlignment(data.hero_alignment || "center");
        
        // Parse trust_badges
        const badges = typeof data.trust_badges === 'string' 
          ? JSON.parse(data.trust_badges) 
          : (data.trust_badges || []);
        setTrustBadges(badges as TrustBadge[]);
      }
    } catch (error) {
      console.error("Error fetching hero settings:", error);
      toast.error("Failed to load hero settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        title_line1: titleLine1,
        title_highlight: titleHighlight,
        title_line2: titleLine2,
        badge_text: badgeText || null,
        hero_image_url: heroImageUrl || null,
        typing_words: typingWords,
        search_placeholder: searchPlaceholder || null,
        trust_badges: trustBadges as unknown as Json,
        background_gradient: backgroundGradient,
        image_position_x: imagePositionX,
        image_position_y: imagePositionY,
        image_width: imageWidth,
        image_height: imageHeight,
        image_overlay_opacity: imageOverlayOpacity,
        image_overlay_color: imageOverlayColor,
        image_fade_intensity: imageFadeIntensity,
        image_gradient_direction: imageGradientDirection,
        image_soft_edges: imageSoftEdges,
        image_mask_type: imageMaskType,
        // Layout settings
        hero_max_width: heroMaxWidth,
        hero_min_height: heroMinHeight,
        hero_padding_x: heroPaddingX,
        hero_padding_y: heroPaddingY,
        content_ratio: contentRatio,
        hero_alignment: heroAlignment,
        updated_at: new Date().toISOString()
      };

      if (settings?.id) {
        const { error } = await supabase
          .from("hero_settings")
          .update(updateData)
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("hero_settings")
          .insert([{ ...updateData, is_active: true }]);

        if (error) throw error;
      }

      toast.success("Hero settings saved successfully!");
      fetchSettings();
    } catch (error) {
      console.error("Error saving hero settings:", error);
      toast.error("Failed to save hero settings");
    } finally {
      setSaving(false);
    }
  };

  const addTypingWord = () => {
    if (newWord.trim() && !typingWords.includes(newWord.trim())) {
      setTypingWords([...typingWords, newWord.trim()]);
      setNewWord("");
    }
  };

  const removeTypingWord = (word: string) => {
    setTypingWords(typingWords.filter((w) => w !== word));
  };

  const addTrustBadge = () => {
    if (newBadgeText.trim()) {
      setTrustBadges([...trustBadges, { icon: newBadgeIcon, text: newBadgeText.trim() }]);
      setNewBadgeText("");
      setNewBadgeIcon("Shield");
    }
  };

  const removeTrustBadge = (index: number) => {
    setTrustBadges(trustBadges.filter((_, i) => i !== index));
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
            <h1 className="text-2xl font-bold">Hero Banner Settings</h1>
            <p className="text-muted-foreground">
              Customize the homepage hero section
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open("/", "_blank")}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Hero Layout Controls - New Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Hero Layout Controls</CardTitle>
            <CardDescription>
              Control the overall hero section dimensions, padding, and content ratio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Max Width */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Max Width</Label>
                  <span className="text-sm text-muted-foreground">{heroMaxWidth}px</span>
                </div>
                <Slider
                  value={[heroMaxWidth]}
                  onValueChange={(value) => setHeroMaxWidth(value[0])}
                  min={800}
                  max={1920}
                  step={20}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>800px</span>
                  <span>1360px</span>
                  <span>1920px</span>
                </div>
              </div>

              {/* Min Height */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Min Height</Label>
                  <span className="text-sm text-muted-foreground">{heroMinHeight}px</span>
                </div>
                <Slider
                  value={[heroMinHeight]}
                  onValueChange={(value) => setHeroMinHeight(value[0])}
                  min={200}
                  max={800}
                  step={20}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>200px</span>
                  <span>500px</span>
                  <span>800px</span>
                </div>
              </div>

              {/* Content Ratio */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Content / Image Ratio</Label>
                  <span className="text-sm text-muted-foreground">{contentRatio}% / {100 - contentRatio}%</span>
                </div>
                <Slider
                  value={[contentRatio]}
                  onValueChange={(value) => setContentRatio(value[0])}
                  min={30}
                  max={70}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>30% Text</span>
                  <span>50/50</span>
                  <span>70% Text</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
              {/* Horizontal Padding */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Horizontal Padding</Label>
                  <span className="text-sm text-muted-foreground">{heroPaddingX}px</span>
                </div>
                <Slider
                  value={[heroPaddingX]}
                  onValueChange={(value) => setHeroPaddingX(value[0])}
                  min={0}
                  max={80}
                  step={4}
                  className="w-full"
                />
              </div>

              {/* Vertical Padding */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Vertical Padding</Label>
                  <span className="text-sm text-muted-foreground">{heroPaddingY}px</span>
                </div>
                <Slider
                  value={[heroPaddingY]}
                  onValueChange={(value) => setHeroPaddingY(value[0])}
                  min={16}
                  max={120}
                  step={4}
                  className="w-full"
                />
              </div>

              {/* Alignment */}
              <div className="space-y-2">
                <Label>Hero Alignment</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'left', label: 'Left' },
                    { value: 'center', label: 'Center' },
                    { value: 'right', label: 'Right' }
                  ].map((align) => (
                    <button
                      key={align.value}
                      onClick={() => setHeroAlignment(align.value)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        heroAlignment === align.value 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      {align.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Layout Preview */}
            <div className="pt-4 border-t">
              <Label className="text-sm mb-2 block">Layout Preview</Label>
              <div className="bg-muted rounded-lg p-4 relative overflow-hidden" style={{ minHeight: '120px' }}>
                <div 
                  className={`mx-auto bg-gradient-to-r ${backgroundGradient} rounded-lg p-3 flex gap-2`}
                  style={{ 
                    maxWidth: `${Math.min(heroMaxWidth / 4, 300)}px`,
                    minHeight: `${heroMinHeight / 5}px`
                  }}
                >
                  <div 
                    className="bg-white/20 rounded flex items-center justify-center text-white text-xs"
                    style={{ width: `${contentRatio}%` }}
                  >
                    Text {contentRatio}%
                  </div>
                  <div 
                    className="bg-white/10 rounded flex items-center justify-center text-white/60 text-xs"
                    style={{ width: `${100 - contentRatio}%` }}
                  >
                    Image {100 - contentRatio}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Title Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Title Configuration</CardTitle>
              <CardDescription>
                Configure the main heading text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titleLine1">Title Line 1</Label>
                <Input
                  id="titleLine1"
                  value={titleLine1}
                  onChange={(e) => setTitleLine1(e.target.value)}
                  placeholder="Find and Access"
                />
              </div>
              <div>
                <Label htmlFor="titleHighlight">
                  Highlighted Text (appears in color)
                </Label>
                <Input
                  id="titleHighlight"
                  value={titleHighlight}
                  onChange={(e) => setTitleHighlight(e.target.value)}
                  placeholder="Best Healthcare"
                />
              </div>
              <div>
                <Label htmlFor="titleLine2">Title Line 2</Label>
                <Input
                  id="titleLine2"
                  value={titleLine2}
                  onChange={(e) => setTitleLine2(e.target.value)}
                  placeholder="Services Near You"
                />
              </div>
              <div>
                <Label htmlFor="badgeText">Badge Text (green badge)</Label>
                <Input
                  id="badgeText"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="25K+ doctors"
                />
              </div>
              <div>
                <Label htmlFor="searchPlaceholder">Search Placeholder</Label>
                <Input
                  id="searchPlaceholder"
                  value={searchPlaceholder}
                  onChange={(e) => setSearchPlaceholder(e.target.value)}
                  placeholder="Search doctors, labs, hospitals..."
                />
              </div>
              <div className="space-y-3">
                <Label>Background Theme</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {gradientPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setBackgroundGradient(preset.value)}
                      className={`relative p-3 rounded-lg border-2 transition-all ${
                        backgroundGradient === preset.value 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <div 
                        className="h-8 rounded-md mb-2"
                        style={{ 
                          background: `linear-gradient(to right, ${preset.colors.join(", ")})`
                        }}
                      />
                      <span className="text-xs font-medium">{preset.name}</span>
                    </button>
                  ))}
                </div>
                <div className="pt-2">
                  <Label htmlFor="backgroundGradient" className="text-xs text-muted-foreground">
                    Or enter custom Tailwind gradient:
                  </Label>
                  <Input
                    id="backgroundGradient"
                    value={backgroundGradient}
                    onChange={(e) => setBackgroundGradient(e.target.value)}
                    placeholder="from-amber-800 via-amber-700 to-blue-900"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typing Words */}
          <Card>
            <CardHeader>
              <CardTitle>Typing Animation Words</CardTitle>
              <CardDescription>
                Words that will animate in the hero section
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Add new word..."
                  onKeyDown={(e) => e.key === "Enter" && addTypingWord()}
                />
                <Button onClick={addTypingWord} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {typingWords.map((word, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-3 py-1 text-sm flex items-center gap-1"
                  >
                    {word}
                    <button
                      onClick={() => removeTypingWord(word)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {typingWords.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No typing words added. Add words like "Doctors", "Labs", etc.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Trust Badges */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Trust Badges</CardTitle>
              <CardDescription>
                Add trust indicators that appear below the search bar (e.g., "ISO Certified", "Best Prices")
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Select value={newBadgeIcon} onValueChange={setNewBadgeIcon}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIcons.map((iconOption) => {
                      const IconComp = iconOption.icon;
                      return (
                        <SelectItem key={iconOption.value} value={iconOption.value}>
                          <div className="flex items-center gap-2">
                            <IconComp className="w-4 h-4" />
                            {iconOption.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Input
                  value={newBadgeText}
                  onChange={(e) => setNewBadgeText(e.target.value)}
                  placeholder="Badge text (e.g., ISO Certified)"
                  className="flex-1 min-w-[200px]"
                  onKeyDown={(e) => e.key === "Enter" && addTrustBadge()}
                />
                <Button onClick={addTrustBadge}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Badge
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {trustBadges.map((badge, index) => {
                  const IconComp = iconMap[badge.icon] || Shield;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-muted px-3 py-2 rounded-full"
                    >
                      <IconComp className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{badge.text}</span>
                      <button
                        onClick={() => removeTrustBadge(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
              
              {trustBadges.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No trust badges added. Add badges like "ISO Certified", "Quick Results", "Best Prices".
                </p>
              )}
            </CardContent>
          </Card>

          {/* Hero Image */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Hero Image</CardTitle>
              <CardDescription>
                Upload an image for the right side of the hero section (recommended: 800x600px or larger)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageUpload
                label="Hero Banner Image"
                currentUrl={heroImageUrl}
                onUpload={setHeroImageUrl}
                bucket="hero-images"
                folder="banners"
                aspectRatio="banner"
              />
              {heroImageUrl && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHeroImageUrl("")}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove Image
                  </Button>
                  
                  {/* Image Position Controls */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-sm">Image Focal Point</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Horizontal Position (X)</Label>
                          <span className="text-sm text-muted-foreground">{imagePositionX}%</span>
                        </div>
                        <Slider
                          value={[imagePositionX]}
                          onValueChange={(value) => setImagePositionX(value[0])}
                          min={0}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Left</span>
                          <span>Center</span>
                          <span>Right</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Vertical Position (Y)</Label>
                          <span className="text-sm text-muted-foreground">{imagePositionY}%</span>
                        </div>
                        <Slider
                          value={[imagePositionY]}
                          onValueChange={(value) => setImagePositionY(value[0])}
                          min={0}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Top</span>
                          <span>Center</span>
                          <span>Bottom</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Image Size Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Image Width</Label>
                          <span className="text-sm text-muted-foreground">{imageWidth}%</span>
                        </div>
                        <Slider
                          value={[imageWidth]}
                          onValueChange={(value) => setImageWidth(value[0])}
                          min={50}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Image Height</Label>
                          <span className="text-sm text-muted-foreground">{imageHeight}%</span>
                        </div>
                        <Slider
                          value={[imageHeight]}
                          onValueChange={(value) => setImageHeight(value[0])}
                          min={50}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Image Blend Controls */}
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-medium text-sm">Seamless Blending Controls</h4>
                      <p className="text-xs text-muted-foreground">
                        Remove hard edges and blend image seamlessly with the background
                      </p>
                      
                      {/* Overlay Strength */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Overlay Strength</Label>
                          <span className="text-sm text-muted-foreground">{imageOverlayOpacity}%</span>
                        </div>
                        <Slider
                          value={[imageOverlayOpacity]}
                          onValueChange={(value) => setImageOverlayOpacity(value[0])}
                          min={0}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>No Blend</span>
                          <span>Medium</span>
                          <span>Full Blend</span>
                        </div>
                      </div>

                      {/* Fade Intensity */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Fade Intensity</Label>
                          <span className="text-sm text-muted-foreground">{imageFadeIntensity}%</span>
                        </div>
                        <Slider
                          value={[imageFadeIntensity]}
                          onValueChange={(value) => setImageFadeIntensity(value[0])}
                          min={0}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Sharp</span>
                          <span>Soft</span>
                          <span>Very Soft</span>
                        </div>
                      </div>

                      {/* Gradient Direction */}
                      <div className="space-y-2">
                        <Label>Fade Direction</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { value: 'left', label: '← Left' },
                            { value: 'right', label: 'Right →' },
                            { value: 'top', label: '↑ Top' },
                            { value: 'bottom', label: '↓ Bottom' }
                          ].map((dir) => (
                            <button
                              key={dir.value}
                              onClick={() => setImageGradientDirection(dir.value)}
                              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                imageGradientDirection === dir.value 
                                  ? "border-primary bg-primary/10 text-primary" 
                                  : "border-muted hover:border-primary/50"
                              }`}
                            >
                              {dir.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mask Type */}
                      <div className="space-y-2">
                        <Label>Mask Type</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'gradient', label: 'Gradient' },
                            { value: 'radial', label: 'Radial' },
                            { value: 'vignette', label: 'Vignette' }
                          ].map((mask) => (
                            <button
                              key={mask.value}
                              onClick={() => setImageMaskType(mask.value)}
                              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                imageMaskType === mask.value 
                                  ? "border-primary bg-primary/10 text-primary" 
                                  : "border-muted hover:border-primary/50"
                              }`}
                            >
                              {mask.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Soft Edges Toggle */}
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <Label>Soft Edges</Label>
                          <p className="text-xs text-muted-foreground">Remove hard borders for seamless blending</p>
                        </div>
                        <button
                          onClick={() => setImageSoftEdges(!imageSoftEdges)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            imageSoftEdges ? 'bg-primary' : 'bg-muted'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                            imageSoftEdges ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Image Preview with all settings */}
                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-sm">Final Preview (with seamless blending)</Label>
                      <div 
                        className={`relative mt-2 bg-gradient-to-r ${backgroundGradient} rounded-lg p-4 flex justify-end overflow-hidden`}
                      >
                        <div 
                          className={`relative overflow-hidden ${imageSoftEdges ? '' : 'rounded-lg'}`}
                          style={{ 
                            width: `${imageWidth * 2}px`,
                            height: `${imageHeight * 1.5}px`
                          }}
                        >
                          {/* Primary directional fade */}
                          <div 
                            className="absolute inset-0 z-10 pointer-events-none"
                            style={{ 
                              background: imageGradientDirection === 'left' 
                                ? `linear-gradient(to right, currentColor ${imageFadeIntensity * 0.6}%, transparent ${Math.min(100, imageFadeIntensity + 30)}%)`
                                : imageGradientDirection === 'right'
                                ? `linear-gradient(to left, currentColor ${imageFadeIntensity * 0.6}%, transparent ${Math.min(100, imageFadeIntensity + 30)}%)`
                                : imageGradientDirection === 'top'
                                ? `linear-gradient(to bottom, currentColor ${imageFadeIntensity * 0.6}%, transparent ${Math.min(100, imageFadeIntensity + 30)}%)`
                                : `linear-gradient(to top, currentColor ${imageFadeIntensity * 0.6}%, transparent ${Math.min(100, imageFadeIntensity + 30)}%)`,
                              opacity: imageOverlayOpacity / 100
                            }} 
                          />
                          {/* Soft edge vignette */}
                          {imageSoftEdges && (
                            <div 
                              className="absolute inset-0 z-10 pointer-events-none"
                              style={{ 
                                background: `
                                  linear-gradient(to right, currentColor 0%, transparent 15%),
                                  linear-gradient(to left, transparent 85%, currentColor 100%),
                                  linear-gradient(to bottom, currentColor 0%, transparent 10%),
                                  linear-gradient(to top, currentColor 0%, transparent 10%)
                                `,
                                opacity: (imageOverlayOpacity / 100) * 0.7
                              }} 
                            />
                          )}
                          <img
                            src={heroImageUrl}
                            alt="Blend preview"
                            className="w-full h-full object-cover"
                            style={{ objectPosition: `${imagePositionX}% ${imagePositionY}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              This is how your hero section will look
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`bg-gradient-to-r ${backgroundGradient} rounded-lg p-4 text-white`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                    <span className="text-white">{titleLine1 || "Find and Access"} </span>
                    <br />
                    <span className="text-amber-400">
                      {typingWords[0] || "Best Healthcare"}
                    </span>
                    <br />
                    <span className="text-white">{titleLine2 || "Services Near You"}</span>
                  </h1>
                  {badgeText && (
                    <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 px-3 py-1.5 rounded-full">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-300 text-sm">{badgeText}</span>
                    </div>
                  )}
                  <div className="bg-white rounded-lg p-3 max-w-md">
                    <span className="text-gray-400 text-sm">
                      {searchPlaceholder || "Search doctors, labs, hospitals..."}
                    </span>
                  </div>
                  
                  {/* Trust Badges Preview */}
                  {trustBadges.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {trustBadges.map((badge, index) => {
                        const IconComp = iconMap[badge.icon] || Shield;
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20"
                          >
                            <IconComp className="w-3 h-3 text-amber-300" />
                            <span className="text-xs text-white font-medium">{badge.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="hidden lg:block">
                  {heroImageUrl ? (
                    <img
                      src={heroImageUrl}
                      alt="Hero Preview"
                      className="w-full h-48 object-cover rounded-lg"
                      style={{ objectPosition: `${imagePositionX}% ${imagePositionY}%` }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-blue-800/30 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-white/30" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default HeroSettingsPage;
