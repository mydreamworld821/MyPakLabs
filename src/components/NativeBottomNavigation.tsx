import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Calendar, User } from "lucide-react";
import { useNativePlatform } from "@/hooks/useNativePlatform";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  action?: 'search';
}

interface NativeBottomNavigationProps {
  onSearchClick?: () => void;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'search', label: 'Search', icon: Search, action: 'search' },
  { id: 'bookings', label: 'Bookings', icon: Calendar, path: '/my-bookings' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
];

const NativeBottomNavigation = ({ onSearchClick }: NativeBottomNavigationProps) => {
  const { isNative } = useNativePlatform();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Only render on native platforms
  if (!isNative) {
    return null;
  }

  const isActive = (item: NavItem) => {
    if (item.action === 'search') return false; // Search is never "active"
    if (!item.path) return false;
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  };

  const handleNavClick = (item: NavItem) => {
    if (item.action === 'search') {
      onSearchClick?.();
      return;
    }
    
    // For auth-required pages, redirect to auth if not logged in
    if ((item.path === '/my-bookings' || item.path === '/profile') && !user) {
      navigate('/auth');
      return;
    }
    
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[200] bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                active 
                  ? "text-primary" 
                  : "text-gray-500 active:text-gray-700"
              )}
            >
              <div className={cn(
                "relative p-1.5 rounded-xl transition-all",
                active && "bg-primary/10"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-transform",
                  active && "scale-110"
                )} />
                {active && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
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
