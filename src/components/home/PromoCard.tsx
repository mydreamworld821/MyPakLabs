import { Link } from "react-router-dom";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromoCardProps {
  href: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: string;
  className?: string;
}

const PromoCard = ({ href, title, subtitle, icon: Icon, gradient, className }: PromoCardProps) => {
  return (
    <Link to={href} className={cn("block", className)}>
      <div className={cn(
        "rounded-2xl p-4 text-white flex items-center justify-between hover:shadow-xl transition-all duration-300",
        gradient
      )}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base">{title}</h3>
            <p className="text-sm text-white/90">{subtitle}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5" />
      </div>
    </Link>
  );
};

export default PromoCard;
