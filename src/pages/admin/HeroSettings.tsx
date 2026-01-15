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
              <div>
                <Label htmlFor="backgroundGradient">Background Gradient (Tailwind classes)</Label>
                <Input
                  id="backgroundGradient"
                  value={backgroundGradient}
                  onChange={(e) => setBackgroundGradient(e.target.value)}
                  placeholder="from-amber-800 via-amber-700 to-blue-900"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use Tailwind gradient classes (e.g., from-blue-900 via-blue-800 to-indigo-900)
                </p>
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
            <CardContent>
              <ImageUpload
                label="Hero Banner Image"
                currentUrl={heroImageUrl}
                onUpload={setHeroImageUrl}
                bucket="hero-images"
                folder="banners"
                aspectRatio="banner"
              />
              {heroImageUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setHeroImageUrl("")}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove Image
                </Button>
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
