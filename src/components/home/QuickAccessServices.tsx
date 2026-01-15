import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import { 
  FlaskConical, Pill, Heart, Building2, Stethoscope, 
  Video, Calendar, Zap, Store, Syringe, FileText, 
  Clipboard, Activity, UserRound, Thermometer, Microscope
} from "lucide-react";

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

interface QuickAccessServicesProps {
  services: QuickAccessService[];
  loading?: boolean;
  title?: string;
}

const iconMap: Record<string, LucideIcon> = {
  FlaskConical,
  Pill,
  Heart,
  Building2,
  Stethoscope,
  Video,
  Calendar,
  Zap,
  Store,
  Syringe,
  FileText,
  Clipboard,
  Activity,
  UserRound,
  Thermometer,
  Microscope,
};

const QuickAccessServices = ({ services, loading, title }: QuickAccessServicesProps) => {
  if (loading) {
    return (
      <div className="mt-4">
        {title && <Skeleton className="h-5 w-48 mb-3" />}
        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="w-14 h-14 rounded-xl mb-1.5" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!services || services.length === 0) return null;

  return (
    <div className="mt-4">
      {title && (
        <h2 className="text-sm md:text-base font-semibold text-foreground mb-3">
          {title}
        </h2>
      )}

      <div className="flex flex-wrap gap-3 md:gap-4 justify-center md:justify-start">
        {services.map((service) => {
          const IconComponent = iconMap[service.icon_name] || FlaskConical;
          const bgColor = service.bg_color || "bg-muted";
          const iconColor = service.icon_color || "text-primary";
          const iconSize = service.icon_size || 24;

          return (
            <Link
              key={service.id}
              to={service.link}
              className="flex flex-col items-center min-w-[64px] md:min-w-[72px] group"
            >
              <div
                className={`w-12 h-12 md:w-14 md:h-14 rounded-xl ${bgColor} flex items-center justify-center mb-1.5 transition-all duration-200 group-hover:shadow-md group-hover:scale-105`}
              >
                <IconComponent 
                  className={iconColor} 
                  size={iconSize} 
                />
              </div>
              <span className="text-xs font-medium text-foreground text-center line-clamp-1">
                {service.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default QuickAccessServices;
