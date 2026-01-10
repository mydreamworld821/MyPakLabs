import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { playNotificationSound } from "@/utils/notificationSound";
import {
  FlaskConical,
  LayoutDashboard,
  Building2,
  TestTube,
  ShoppingCart,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Stethoscope,
  UserRound,
  LayoutGrid,
  Star,
  Scissors,
  MessageSquare,
  MapPin,
  Heart,
  AlertTriangle,
  Calendar,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/labs", label: "Labs", icon: Building2 },
  { href: "/admin/featured-labs", label: "Featured Labs", icon: Star },
  { href: "/admin/tests", label: "Tests", icon: TestTube },
  { href: "/admin/lab-tests", label: "Lab Pricing", icon: FlaskConical },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/prescriptions", label: "Prescriptions", icon: FileText },
  { href: "/admin/specializations", label: "Specializations", icon: Stethoscope },
  { href: "/admin/doctors", label: "Doctors", icon: UserRound },
  { href: "/admin/doctor-appointments", label: "Dr. Appointments", icon: Calendar },
  { href: "/admin/featured-doctors", label: "Featured Doctors", icon: Star },
  { href: "/admin/nurses", label: "Nurses", icon: Heart },
  { href: "/admin/nurse-bookings", label: "Nurse Bookings", icon: ClipboardList },
  { href: "/admin/featured-nurses", label: "Featured Nurses", icon: Star },
  { href: "/admin/hospitals", label: "Hospitals", icon: Building2 },
  { href: "/admin/surgeries", label: "Surgeries", icon: Scissors },
  { href: "/admin/surgery-inquiries", label: "Surgery Leads", icon: MessageSquare },
  { href: "/admin/emergency-requests", label: "Emergency Requests", icon: AlertTriangle },
  { href: "/admin/service-cards", label: "Service Cards", icon: LayoutGrid },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/users", label: "Users", icon: Users },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newPrescriptionCount, setNewPrescriptionCount] = useState(0);
  const [newOrderCount, setNewOrderCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  const ADMIN_EMAIL = "mhmmdaqib@gmail.com";

  // Helper function to send email notification
  const sendEmailNotification = async (
    type: "prescription" | "order",
    patientName: string,
    labName?: string,
    orderId?: string
  ) => {
    try {
      await supabase.functions.invoke('send-admin-notification', {
        body: {
          type,
          patientName,
          labName,
          orderId,
          adminEmail: ADMIN_EMAIL,
        },
      });
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  };

  // Real-time subscription for new prescriptions
  useEffect(() => {
    const channel = supabase
      .channel('admin-prescriptions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'prescriptions',
        },
        async (payload) => {
          // Fetch patient info for the notification
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', payload.new.user_id)
            .maybeSingle();

          const patientName = profile?.full_name || 'A patient';
          
          // Play notification sound
          playNotificationSound();
          
          // Send email notification
          sendEmailNotification('prescription', patientName);
          
          toast.info(`New Prescription Uploaded`, {
            description: `${patientName} has uploaded a new prescription for review.`,
            action: {
              label: 'View',
              onClick: () => navigate('/admin/prescriptions'),
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

  // Real-time subscription for new orders
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          // Fetch patient info and lab name for the notification
          const [profileResult, labResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', payload.new.user_id)
              .maybeSingle(),
            supabase
              .from('labs')
              .select('name')
              .eq('id', payload.new.lab_id)
              .maybeSingle()
          ]);

          const patientName = profileResult.data?.full_name || 'A patient';
          const labName = labResult.data?.name || 'a lab';
          
          // Play notification sound
          playNotificationSound();
          
          // Send email notification
          sendEmailNotification('order', patientName, labName, payload.new.unique_id);
          
          toast.success(`New Order Placed`, {
            description: `${patientName} booked tests at ${labName} (${payload.new.unique_id})`,
            action: {
              label: 'View',
              onClick: () => navigate('/admin/orders'),
            },
            duration: 10000,
          });

          setNewOrderCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  // Reset notification counts when visiting respective pages
  useEffect(() => {
    if (location.pathname === '/admin/prescriptions') {
      setNewPrescriptionCount(0);
    }
    if (location.pathname === '/admin/orders') {
      setNewOrderCount(0);
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
          <div className="w-8 h-8 gradient-hero rounded-lg flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">Medilabs Admin</span>
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
            <div className="w-10 h-10 gradient-hero rounded-lg flex items-center justify-center shadow-glow">
              <FlaskConical className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold">Medilabs</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const isPrescriptions = item.href === '/admin/prescriptions';
              const isOrders = item.href === '/admin/orders';
              const badgeCount = isPrescriptions ? newPrescriptionCount : isOrders ? newOrderCount : 0;
              const showBadge = badgeCount > 0;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                  {showBadge && (
                    <span className={cn(
                      "ml-auto flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full animate-pulse",
                      isOrders ? "bg-green-500 text-white" : "bg-destructive text-destructive-foreground"
                    )}>
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
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Admin</p>
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

export default AdminLayout;
