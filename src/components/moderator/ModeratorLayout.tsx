import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { playNotificationSound } from "@/utils/notificationSound";
import {
  FlaskConical,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModeratorLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/moderator/prescriptions", label: "Prescriptions", icon: FileText },
];

const ModeratorLayout = ({ children }: ModeratorLayoutProps) => {
  const { user, signOut, isModerator } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newPrescriptionCount, setNewPrescriptionCount] = useState(0);

  useEffect(() => {
    if (!isModerator) {
      navigate("/");
    }
  }, [isModerator, navigate]);

  // Real-time subscription for new prescriptions
  useEffect(() => {
    const channel = supabase
      .channel('moderator-prescriptions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'prescriptions',
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', payload.new.user_id)
            .maybeSingle();

          const patientName = profile?.full_name || 'A patient';
          
          playNotificationSound();
          
          toast.info(`New Prescription Uploaded`, {
            description: `${patientName} has uploaded a new prescription for review.`,
            action: {
              label: 'View',
              onClick: () => navigate('/moderator/prescriptions'),
            },
            duration: 10000,
          });

          setNewPrescriptionCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  // Reset notification counts when visiting prescriptions page
  useEffect(() => {
    if (location.pathname === '/moderator/prescriptions') {
      setNewPrescriptionCount(0);
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b z-50 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <div className="flex items-center gap-2 ml-3">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold">Moderator Panel</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-background border-r z-40 transition-transform lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-4 border-b">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold">MyPakLabs</h1>
              <p className="text-xs text-muted-foreground">Moderator Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const isPrescriptions = item.href === '/moderator/prescriptions';
              const badgeCount = isPrescriptions ? newPrescriptionCount : 0;
              const showBadge = badgeCount > 0;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                    isActive
                      ? "bg-amber-500 text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                  {showBadge && (
                    <span className="ml-auto flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full animate-pulse bg-destructive text-destructive-foreground">
                      {badgeCount}
                    </span>
                  )}
                  {isActive && !showBadge && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Moderator</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default ModeratorLayout;
