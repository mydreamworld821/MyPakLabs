import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import GlobalSearch from "@/components/GlobalSearch";
import TypingAnimation from "./TypingAnimation";
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
          image_position_y: data.image_position_y ?? 30
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
          image_position_y: 30
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

  return (
    <section className={`pt-16 bg-gradient-to-r ${backgroundGradient} text-white relative overflow-hidden`}>
      <div className="container mx-auto px-4 py-8 md:py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
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

            {/* Search Bar */}
            <div className="w-full max-w-xl">
              <GlobalSearch className="w-full" />
            </div>

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

          {/* Right Image */}
          <div className="relative hidden lg:block">
            {heroSettings?.hero_image_url ? (
              <div className="relative h-[300px] lg:h-[350px]">
                {/* Gradient overlay for natural blending */}
                <div className="absolute inset-0 bg-gradient-to-r from-current via-transparent to-transparent z-10 pointer-events-none" style={{ color: 'inherit' }} />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-current/60 z-10 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-current/40 via-transparent to-transparent z-10 pointer-events-none" />
                <img
                  src={heroSettings.hero_image_url}
                  alt="Healthcare Professional"
                  className="w-full h-full object-cover rounded-l-3xl"
                  style={{ objectPosition: `${imagePositionX}% ${imagePositionY}%` }}
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
    </section>
  );
};

export default HeroSection;
