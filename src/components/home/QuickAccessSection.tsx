import { Link } from "react-router-dom";
import { 
  Video, Calendar, Zap, FlaskConical, Pill, Heart, Building2, 
  Stethoscope, Store, Syringe, FileText, Clipboard, Activity, 
  UserRound, Thermometer, Microscope 
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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

interface QuickAccessSectionProps {
  services: QuickAccessService[];
  layout?: QuickAccessLayoutSettings;
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

const QuickAccessSection = ({ services, layout }: QuickAccessSectionProps) => {
  // Default layout values
  const containerSize = layout?.icon_container_size || 56;
  const iconSize = layout?.icon_size || 24;
  const gap = layout?.items_gap || 16;
  const showLabels = layout?.show_labels ?? true;
  const justify = layout?.justify_content || "center";
  const layoutMode = layout?.layout_mode || "auto";

  // Get justify class based on setting
  const getJustifyClass = () => {
    switch (justify) {
      case "start": return "justify-start";
      case "center": return "justify-center";
      case "end": return "justify-end";
      case "between": return "justify-between";
      case "around": return "justify-around";
      default: return "justify-center md:justify-start";
    }
  };

  // Get layout-specific classes
  const getLayoutClasses = () => {
    switch (layoutMode) {
      case "fill": return "w-full";
      case "fixed": return "";
      default: return "";
    }
  };

  // Calculate item width for fill mode
  const getItemStyle = () => {
    if (layoutMode === "fill" && services.length > 0) {
      return {
        flex: `1 1 ${100 / services.length}%`,
        maxWidth: `${100 / services.length}%`,
      };
    }
    return {
      minWidth: containerSize + 16,
    };
  };

  return (
    <div 
      className={`mt-4 flex flex-wrap ${getJustifyClass()} ${getLayoutClasses()}`}
      style={{ gap }}
    >
      {services.map((service) => {
        const IconComponent = iconMap[service.icon_name] || FlaskConical;
        const bgColor = service.bg_color || "bg-muted";
        const iconColor = service.icon_color || "text-primary";
        // Use layout icon size if available, otherwise fall back to service-specific size
        const finalIconSize = iconSize || service.icon_size || 24;

        return (
          <Link
            key={service.id}
            to={service.link}
            className="flex flex-col items-center group"
            style={getItemStyle()}
          >
            <div
              className={`rounded-xl ${bgColor} flex items-center justify-center transition-all duration-200 group-hover:shadow-md group-hover:scale-105`}
              style={{ 
                width: containerSize, 
                height: containerSize 
              }}
            >
              <IconComponent 
                className={iconColor} 
                size={finalIconSize} 
              />
            </div>
            {showLabels && (
              <span className="text-xs font-medium text-foreground text-center mt-1.5 line-clamp-1">
                {service.title}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default QuickAccessSection;
