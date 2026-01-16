import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, Calendar, Zap, FlaskConical, Pill, Heart, Building2, Stethoscope, Store, Syringe, FileText, Clipboard, Activity, UserRound, Thermometer, Microscope } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import QuickAccessSection from "./QuickAccessSection";

interface ServiceCard {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  icon_name: string | null;
  bg_color: string | null;
  link: string;
  display_order: number | null;
  card_size: string | null;
  col_span: number | null;
  row_span: number | null;
}

interface QuickAccessService {
  id: string;
  title: string;
  icon_name: string;
  icon_color: string | null;
  icon_size: number | null;
  bg_color: string | null;
  link: string;
  display_order: number | null;
}

interface QuickAccessLayoutSettings {
  icon_container_size?: number;
  icon_size?: number;
  items_gap?: number;
  show_labels?: boolean;
  justify_content?: string;
  layout_mode?: string;
}

interface DynamicServicesGridProps {
  cards: ServiceCard[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  quickAccessServices?: QuickAccessService[];
  showQuickAccess?: boolean;
  quickAccessLayout?: QuickAccessLayoutSettings;
}

const iconMap: Record<string, LucideIcon> = {
  Video,
  Calendar,
  Zap,
  FlaskConical,
  Pill,
  Heart,
  Building2,
  Stethoscope,
  Store,
  Syringe,
  FileText,
  Clipboard,
  Activity,
  UserRound,
  Thermometer,
  Microscope,
};

const DynamicServicesGrid = ({ cards, loading, title, subtitle, quickAccessServices, showQuickAccess = true, quickAccessLayout }: DynamicServicesGridProps) => {
  if (loading) {
    return (
      <div className="mb-8" style={{ minHeight: '320px' }}>
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3" style={{ minHeight: '280px' }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="rounded-xl" style={{ height: '320px' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!cards || cards.length === 0) return null;

  // Calculate grid columns based on card count
  const getGridClass = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count === 3) return "grid-cols-1 md:grid-cols-3";
    if (count === 4) return "grid-cols-2 md:grid-cols-4";
    if (count === 5) return "grid-cols-2 md:grid-cols-3 lg:grid-cols-5";
    if (count === 6) return "grid-cols-2 md:grid-cols-3";
    if (count === 7 || count === 8) return "grid-cols-2 md:grid-cols-4";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  // Get span classes for individual cards
  const getSpanClasses = (card: ServiceCard) => {
    const colSpan = card.col_span || 1;
    const rowSpan = card.row_span || 1;
    
    let classes = "";
    
    if (colSpan === 2) classes += " md:col-span-2";
    if (colSpan === 3) classes += " md:col-span-3";
    if (colSpan === 4) classes += " md:col-span-4";
    
    if (rowSpan === 2) classes += " row-span-2";
    if (rowSpan === 3) classes += " row-span-3";
    
    return classes;
  };

  // Get height based on card size
  const getCardHeight = (card: ServiceCard) => {
    const size = card.card_size || "normal";
    const rowSpan = card.row_span || 1;
    
    if (rowSpan >= 2) return "min-h-[280px] md:min-h-[320px]";
    if (size === "large") return "min-h-[200px]";
    if (size === "small") return "min-h-[100px]";
    return "min-h-[140px]";
  };

  // Default bg colors for variety
  const defaultColors = [
    "bg-sky-100",
    "bg-teal-600",
    "bg-amber-100",
    "bg-purple-100",
    "bg-emerald-100",
    "bg-rose-100",
  ];

  return (
    <div className="mb-8">
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h2 className="text-base md:text-lg font-semibold text-foreground">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      )}

      <div className={`grid ${getGridClass(cards.length)} gap-3`}>
        {cards.map((card, index) => {
          const IconComponent = card.icon_name ? iconMap[card.icon_name] : null;
          const bgColor = card.bg_color || defaultColors[index % defaultColors.length];
          const isDarkBg = bgColor.includes("600") || bgColor.includes("700") || bgColor.includes("800") || bgColor.includes("900");
          const textColor = isDarkBg ? "text-white" : "text-foreground";
          const subtitleColor = isDarkBg ? "text-white/90" : "text-muted-foreground";

          return (
            <Link
              key={card.id}
              to={card.link}
              className={`block group ${getSpanClasses(card)}`}
            >
              <Card
                className={`h-full ${bgColor} border-0 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden relative`}
                style={{ borderRadius: "12px" }}
              >
                {card.image_url ? (
                  <>
                    <img
                      src={card.image_url}
                      alt={card.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 ${isDarkBg ? "bg-gradient-to-b from-black/60 via-transparent to-transparent" : "bg-gradient-to-b from-primary/80 via-transparent to-transparent"}`} />
                    <CardContent className={`p-4 ${getCardHeight(card)} flex flex-col relative z-10`}>
                      {IconComponent && (
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-2">
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-white text-lg mb-0.5">
                          {card.title}
                        </h3>
                        {card.subtitle && (
                          <p className="text-sm text-white/90">{card.subtitle}</p>
                        )}
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className={`p-4 ${getCardHeight(card)} flex flex-col`}>
                    {IconComponent && (
                      <div className={`w-10 h-10 rounded-lg ${isDarkBg ? "bg-white/20" : "bg-primary/10"} flex items-center justify-center mb-2`}>
                        <IconComponent className={`w-5 h-5 ${isDarkBg ? "text-white" : "text-primary"}`} />
                      </div>
                    )}
                    <div>
                      <h3 className={`font-bold ${textColor} text-lg mb-0.5`}>
                        {card.title}
                      </h3>
                      {card.subtitle && (
                        <p className={`text-sm ${subtitleColor}`}>{card.subtitle}</p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Access Services - Badge Style Icons */}
      {showQuickAccess && quickAccessServices && quickAccessServices.length > 0 && (
        <QuickAccessSection 
          services={quickAccessServices} 
          layout={quickAccessLayout} 
        />
      )}
    </div>
  );
};

export default DynamicServicesGrid;
