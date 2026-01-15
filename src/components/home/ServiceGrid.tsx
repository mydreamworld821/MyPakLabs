import { Link } from "react-router-dom";
import { 
  FlaskConical, 
  Stethoscope, 
  Store, 
  Building2, 
  Heart, 
  Scissors, 
  Video, 
  AlertTriangle,
  LucideIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceItem {
  id: string;
  href: string;
  icon: LucideIcon;
  label: string;
  color: string;
  bgColor: string;
}

const services: ServiceItem[] = [
  { 
    id: "labs", 
    href: "/labs", 
    icon: FlaskConical, 
    label: "Labs", 
    color: "text-cyan-600", 
    bgColor: "bg-cyan-50" 
  },
  { 
    id: "doctors", 
    href: "/find-doctors", 
    icon: Stethoscope, 
    label: "Doctors", 
    color: "text-blue-600", 
    bgColor: "bg-blue-50" 
  },
  { 
    id: "pharmacies", 
    href: "/pharmacies", 
    icon: Store, 
    label: "Pharmacies", 
    color: "text-emerald-600", 
    bgColor: "bg-emerald-50" 
  },
  { 
    id: "hospitals", 
    href: "/hospitals", 
    icon: Building2, 
    label: "Hospitals", 
    color: "text-indigo-600", 
    bgColor: "bg-indigo-50" 
  },
  { 
    id: "nurses", 
    href: "/find-nurses", 
    icon: Heart, 
    label: "Nurses", 
    color: "text-rose-600", 
    bgColor: "bg-rose-50" 
  },
  { 
    id: "surgeries", 
    href: "/surgeries", 
    icon: Scissors, 
    label: "Surgeries", 
    color: "text-purple-600", 
    bgColor: "bg-purple-50" 
  },
  { 
    id: "video", 
    href: "/video-consultation", 
    icon: Video, 
    label: "Video Call", 
    color: "text-orange-600", 
    bgColor: "bg-orange-50" 
  },
  { 
    id: "emergency", 
    href: "/emergency-nursing-request", 
    icon: AlertTriangle, 
    label: "Emergency", 
    color: "text-red-600", 
    bgColor: "bg-red-50" 
  },
];

const ServiceGrid = () => {
  return (
    <div className="grid grid-cols-4 gap-3">
      {services.map((service) => (
        <Link
          key={service.id}
          to={service.href}
          className="flex flex-col items-center gap-2 group"
        >
          <div className={cn(
            "w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg",
            service.bgColor
          )}>
            <service.icon className={cn("w-6 h-6 md:w-7 md:h-7", service.color)} />
          </div>
          <span className="text-[11px] md:text-xs font-medium text-foreground text-center leading-tight">
            {service.label}
          </span>
        </Link>
      ))}
    </div>
  );
};

export default ServiceGrid;
