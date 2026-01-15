import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import GlobalSearch from "@/components/GlobalSearch";
import TypingAnimation from "./TypingAnimation";
import { useNativePlatform } from "@/hooks/useNativePlatform";
import { 
  AlertTriangle, 
  ChevronRight, 
  CheckCircle, 
  Shield, 
  Clock, 
  TrendingDown,
  Award,
  Star,
  Heart,
  Zap,
  Users,
  BadgeCheck
} from "lucide-react";

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
  // Floating card styling
  hero_border_radius: number | null;
  hero_margin_top: number | null;
  hero_margin_bottom: number | null;
  hero_margin_left: number | null;
  hero_margin_right: number | null;
  page_background_color: string | null;
  hero_shadow_intensity: number | null;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  Clock,
  TrendingDown,
  Award,
  Star,
  Heart,
  Zap,
  Users,
  BadgeCheck,
  CheckCircle,
};

const HeroSection = () => {
  const { isNative } = useNativePlatform();
  const [heroSettings, setHeroSettings] = useState<HeroSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("hero_settings")
          .select("*")
          .eq("is_active", true)
          .limit(1)
          .single();

        if (error) throw error;
        
        // Parse trust_badges if it's a string
        const parsedData = {
          ...data,
          trust_badges: typeof data.trust_badges === 'string' 
            ? JSON.parse(data.trust_badges) 
            : data.trust_badges,
          background_gradient: data.background_gradient || 'from-amber-800 via-amber-700 to-blue-900',
          image_position_x: data.image_position_x ?? 50,
          image_position_y: data.image_position_y ?? 30,
          image_width: data.image_width ?? 100,
          image_height: data.image_height ?? 100,
          image_overlay_opacity: data.image_overlay_opacity ?? 30,
          image_overlay_color: data.image_overlay_color || 'from-background',
          image_blend_mode: data.image_blend_mode || 'normal',
          image_gradient_direction: data.image_gradient_direction || 'left',
          image_fade_intensity: data.image_fade_intensity ?? 50,
          image_soft_edges: data.image_soft_edges ?? true,
          image_mask_type: data.image_mask_type || 'gradient',
          hero_max_width: data.hero_max_width ?? 1400,
          hero_min_height: data.hero_min_height ?? 400,
          hero_padding_x: data.hero_padding_x ?? 16,
          hero_padding_y: data.hero_padding_y ?? 48,
          content_ratio: data.content_ratio ?? 50,
          hero_alignment: data.hero_alignment || 'center',
          // Floating card styling
          hero_border_radius: data.hero_border_radius ?? 24,
          hero_margin_top: data.hero_margin_top ?? 24,
          hero_margin_bottom: data.hero_margin_bottom ?? 0,
          hero_margin_left: data.hero_margin_left ?? 0,
          hero_margin_right: data.hero_margin_right ?? 0,
          page_background_color: data.page_background_color || '#0f172a',
          hero_shadow_intensity: data.hero_shadow_intensity ?? 30
        };
        setHeroSettings(parsedData);
      } catch (error) {
        console.error("Error fetching hero settings:", error);
        // Set default values if fetch fails
        setHeroSettings({
          id: "default",
          title_line1: "Find and Access",
          title_highlight: "Best Healthcare",
          title_line2: "Services Near You",
          badge_text: "Verified Providers",
          hero_image_url: null,
          typing_words: ["Doctors", "Labs", "Hospitals", "Pharmacies", "Nurses"],
          search_placeholder: "Search doctors, labs, hospitals...",
          trust_badges: [
            { icon: "Shield", text: "ISO Certified" },
            { icon: "Clock", text: "Quick Results" },
            { icon: "TrendingDown", text: "Best Prices" }
          ],
          background_gradient: "from-amber-800 via-amber-700 to-blue-900",
          image_position_x: 50,
          image_position_y: 30,
          image_width: 100,
          image_height: 100,
          image_overlay_opacity: 30,
          image_overlay_color: "from-background",
          image_blend_mode: "normal",
          image_gradient_direction: "left",
          image_fade_intensity: 50,
          image_soft_edges: true,
          image_mask_type: "gradient",
          hero_max_width: 1400,
          hero_min_height: 400,
          hero_padding_x: 16,
          hero_padding_y: 48,
          content_ratio: 50,
          hero_alignment: "center",
          // Floating card styling
          hero_border_radius: 24,
          hero_margin_top: 24,
          hero_margin_bottom: 0,
          hero_margin_left: 0,
          hero_margin_right: 0,
          page_background_color: "#0f172a",
          hero_shadow_intensity: 30
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHeroSettings();
  }, []);

  if (loading) {
    return (
      <section className="pt-16 bg-gradient-to-r from-amber-800 via-amber-700 to-blue-900 min-h-[280px] animate-pulse" />
    );
  }

  const typingWords = heroSettings?.typing_words || ["Doctors", "Labs", "Hospitals"];
  const trustBadges = heroSettings?.trust_badges || [];
  const backgroundGradient = heroSettings?.background_gradient || "from-amber-800 via-amber-700 to-blue-900";
  const imagePositionX = heroSettings?.image_position_x ?? 50;
  const imagePositionY = heroSettings?.image_position_y ?? 30;
  const imageWidth = heroSettings?.image_width ?? 100;
  const imageHeight = heroSettings?.image_height ?? 100;
  const imageOverlayOpacity = heroSettings?.image_overlay_opacity ?? 30;
  const imageFadeIntensity = heroSettings?.image_fade_intensity ?? 50;
  const imageSoftEdges = heroSettings?.image_soft_edges ?? true;
  const imageMaskType = heroSettings?.image_mask_type || 'gradient';
  const imageGradientDirection = heroSettings?.image_gradient_direction || 'left';
  
  // Layout controls
  const heroMaxWidth = heroSettings?.hero_max_width ?? 1400;
  const heroMinHeight = heroSettings?.hero_min_height ?? 400;
  const heroPaddingX = heroSettings?.hero_padding_x ?? 16;
  const heroPaddingY = heroSettings?.hero_padding_y ?? 48;
  const contentRatio = heroSettings?.content_ratio ?? 50;
  const heroAlignment = heroSettings?.hero_alignment || 'center';
  
  // Floating card styling
  const heroBorderRadius = heroSettings?.hero_border_radius ?? 24;
  const heroMarginTop = heroSettings?.hero_margin_top ?? 24;
  const heroMarginBottom = heroSettings?.hero_margin_bottom ?? 0;
  const heroMarginLeft = heroSettings?.hero_margin_left ?? 0;
  const heroMarginRight = heroSettings?.hero_margin_right ?? 0;
  const pageBackgroundColor = heroSettings?.page_background_color || '#0f172a';
  const heroShadowIntensity = heroSettings?.hero_shadow_intensity ?? 30;

  // Generate mask gradient based on settings
  const getMaskGradient = () => {
    const fadeOpacity = imageFadeIntensity / 100;
    switch (imageMaskType) {
      case 'radial':
        return `radial-gradient(ellipse at ${100 - imagePositionX}% ${imagePositionY}%, transparent 30%, rgba(0,0,0,${fadeOpacity}) 100%)`;
      case 'vignette':
        return `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${fadeOpacity * 0.8}) 100%)`;
      case 'gradient':
      default:
        const dir = imageGradientDirection === 'left' ? 'to left' : 
                    imageGradientDirection === 'right' ? 'to right' :
                    imageGradientDirection === 'top' ? 'to top' : 'to bottom';
        return `linear-gradient(${dir}, rgba(0,0,0,${fadeOpacity}) 0%, transparent 40%, transparent 60%, rgba(0,0,0,${fadeOpacity * 0.3}) 100%)`;
    }
  };

  // Calculate grid template based on content ratio
  const imageRatio = 100 - contentRatio;

  return (
    <>
      {/* Page Background - Shows when hero is smaller than full width */}
      <section 
        className="pt-16 relative"
        style={{ 
          backgroundColor: pageBackgroundColor,
          paddingTop: `calc(4rem + ${heroMarginTop}px)`,
          paddingBottom: `${heroMarginBottom}px`,
          paddingLeft: '16px',
          paddingRight: '16px'
        }}
      >
        {/* Dynamic CSS for responsive grid ratio */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media (min-width: 1024px) {
              .hero-content-grid {
                grid-template-columns: ${contentRatio}fr ${imageRatio}fr !important;
              }
            }
          `
        }} />
        
        {/* Floating Hero Card */}
        <div 
          className={`bg-gradient-to-r ${backgroundGradient} text-white relative overflow-hidden`}
          style={{ 
            maxWidth: `${heroMaxWidth}px`,
            minHeight: `${heroMinHeight}px`,
            borderRadius: `${heroBorderRadius}px`,
            boxShadow: heroShadowIntensity > 0 
              ? `0 ${heroShadowIntensity / 3}px ${heroShadowIntensity}px rgba(0, 0, 0, ${heroShadowIntensity / 100})` 
              : 'none',
            marginLeft: heroMarginLeft > 0 ? `${heroMarginLeft}px` : heroMarginRight > 0 ? '0' : 'auto',
            marginRight: heroMarginRight > 0 ? `${heroMarginRight}px` : heroMarginLeft > 0 ? 'auto' : 'auto'
          }}
        >
          <div 
            className="w-full h-full"
            style={{ 
              paddingLeft: `${heroPaddingX}px`,
              paddingRight: `${heroPaddingX}px`,
              paddingTop: `${heroPaddingY}px`,
              paddingBottom: `${heroPaddingY}px`
            }}
          >
            <div 
              className={`hero-content-grid grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-center ${
                heroAlignment === 'left' ? 'justify-start' : 
                heroAlignment === 'right' ? 'justify-end' : 'justify-center'
              }`}
            >
          {/* Left Content */}
          <div className="text-left space-y-4 z-10">
            {/* Title with Typing Animation */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
              <span className="text-white">{heroSettings?.title_line1} </span>
              <br />
              <span className="text-amber-400">
                <TypingAnimation 
                  words={typingWords} 
                  className="inline-block min-w-[100px]"
                />
              </span>
              <br />
              <span className="text-white">{heroSettings?.title_line2}</span>
            </h1>

            {/* Badge */}
            {heroSettings?.badge_text && (
              <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 px-4 py-2 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-sm font-medium">
                  {heroSettings.badge_text}
                </span>
              </div>
            )}

            {/* Search Bar - Hidden on native apps (shown as bottom bar instead) */}
            {!isNative && (
              <div className="w-full max-w-2xl lg:max-w-full lg:pr-4">
                <GlobalSearch className="w-full" />
              </div>
            )}

            {/* Trust Badges */}
            {trustBadges.length > 0 && (
              <div className="flex flex-wrap gap-3 md:gap-4">
                {trustBadges.map((badge, index) => {
                  const IconComponent = iconMap[badge.icon] || Shield;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20"
                    >
                      <IconComponent className="w-4 h-4 text-amber-300" />
                      <span className="text-sm text-white font-medium">
                        {badge.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Emergency CTA */}
            <Link to="/emergency-nursing-request" className="inline-block">
              <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-xl px-4 py-3 text-white flex items-center gap-3 hover:from-red-700 hover:to-red-600 transition-all shadow-lg group">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm md:text-base">🚨 Emergency Nursing</h3>
                  <p className="text-xs text-white/90">Get a nurse at your doorstep</p>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Right Image - Seamless Blending */}
          <div className="relative hidden lg:flex items-center justify-end">
            {heroSettings?.hero_image_url ? (
              <div 
                className={`relative overflow-hidden ${imageSoftEdges ? '' : 'rounded-l-3xl'}`}
                style={{ 
                  width: `${imageWidth}%`,
                  height: imageHeight === 100 ? '350px' : `${(imageHeight / 100) * 350}px`
                }}
              >
                {/* Primary directional fade - blends image into background */}
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
                
                {/* Soft edge vignette for natural blending */}
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

                {/* Mask overlay for advanced blending */}
                {imageMaskType !== 'none' && (
                  <div 
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{ 
                      background: getMaskGradient(),
                      mixBlendMode: 'multiply'
                    }} 
                  />
                )}

                {/* The image itself */}
                <img
                  src={heroSettings.hero_image_url}
                  alt="Healthcare Professional"
                  className="w-full h-full object-cover"
                  style={{ 
                    objectPosition: `${imagePositionX}% ${imagePositionY}%`,
                    filter: imageSoftEdges ? 'contrast(1.02)' : 'none'
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-[300px] lg:h-[350px] bg-gradient-to-br from-blue-800/30 to-blue-900/50 rounded-l-3xl flex items-center justify-center">
                <div className="text-center text-white/50">
                  <p className="text-sm">Add hero image from admin</p>
                </div>
              </div>
            )}
          </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
