import { useLocation, useNavigate } from "react-router-dom";
import { Home, FlaskConical, Stethoscope, HeartPulse, Pill, CalendarCheck } from "lucide-react";
import { useNativePlatform } from "@/hooks/useNativePlatform";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'labs', label: 'Labs', icon: FlaskConical, path: '/labs' },
  { id: 'doctors', label: 'Doctors', icon: Stethoscope, path: '/find-doctors' },
  { id: 'nurses', label: 'Nurses', icon: HeartPulse, path: '/find-nurses' },
  { id: 'pharmacy', label: 'Pharmacy', icon: Pill, path: '/pharmacies' },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck, path: '/my-bookings', requiresAuth: true },
];

const NativeBottomNavigation = () => {
  const { isNative } = useNativePlatform();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Only render on native platforms
  if (!isNative) {
    return null;
  }

  const isActive = (item: NavItem) => {
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  };

  const handleNavClick = (item: NavItem) => {
    // For auth-required pages, redirect to auth if not logged in
    if (item.requiresAuth && !user) {
      navigate('/auth');
      return;
    }
    navigate(item.path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[200] bg-background border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors min-w-0",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <div className={cn(
                "relative p-1 rounded-lg transition-all",
                active && "bg-primary/10"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-transform",
                  active && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-[9px] font-medium truncate max-w-full px-0.5",
                active && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default NativeBottomNavigation;
