import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, Plus, X, Image as ImageIcon, Eye } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface HeroSettings {
  id: string;
  title_line1: string;
  title_highlight: string;
  title_line2: string;
  badge_text: string | null;
  hero_image_url: string | null;
  typing_words: string[];
  search_placeholder: string | null;
  is_active: boolean;
}

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
        setSettings(data);
        setTitleLine1(data.title_line1 || "");
        setTitleHighlight(data.title_highlight || "");
        setTitleLine2(data.title_line2 || "");
        setBadgeText(data.badge_text || "");
        setHeroImageUrl(data.hero_image_url || "");
        setTypingWords(data.typing_words || []);
        setSearchPlaceholder(data.search_placeholder || "");
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
                <Label htmlFor="badgeText">Badge Text</Label>
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
            <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-blue-900 rounded-lg p-6 text-white">
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
                      <span className="text-green-300 text-sm">{badgeText}</span>
                    </div>
                  )}
                  <div className="bg-white rounded-lg p-3 max-w-md">
                    <span className="text-gray-400 text-sm">
                      {searchPlaceholder || "Search doctors, labs, hospitals..."}
                    </span>
                  </div>
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
