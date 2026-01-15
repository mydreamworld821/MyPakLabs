import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  href: string;
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  iconBg?: string;
  iconColor?: string;
  badge?: string;
}

const QuickActionCard = ({ 
  href, 
  icon: Icon, 
  label, 
  sublabel, 
  iconBg = "bg-primary/10", 
  iconColor = "text-primary",
  badge
}: QuickActionCardProps) => {
  return (
    <Link 
      to={href} 
      className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 group"
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform",
        iconBg
      )}>
        <Icon className={cn("w-6 h-6", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground truncate">
            {label}
          </span>
          {badge && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded-full">
              {badge}
            </span>
          )}
        </div>
        {sublabel && (
          <span className="text-xs text-muted-foreground truncate block">
            {sublabel}
          </span>
        )}
      </div>
    </Link>
  );
};

export default QuickActionCard;
