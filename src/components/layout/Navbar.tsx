import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import myPakLabsLogo from "@/assets/mypaklabs-logo.jpeg";
import { 
  FlaskConical, 
  Menu, 
  X, 
  User, 
  BarChart3,
  Home,
  Building2,
  LogOut,
  Shield,
  FileText,
  ShoppingCart,
  UserCheck,
  Stethoscope,
  Hospital,
  Scissors,
  Heart,
  UserPlus,
  LayoutDashboard,
  ArrowRight,
  Star,
  MapPin,
  ChevronDown
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";

interface Lab {
  id: string;
  name: string;
  logo_url: string | null;
  discount_percentage: number | null;
  rating: number | null;
  cities: string[] | null;
}

interface Specialization {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  doctor_count?: number;
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isApprovedDoctor, setIsApprovedDoctor] = useState(false);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const location = useLocation();
  const { user, isAdmin, isModerator, signOut } = useAuth();

  // Fetch preview data
  useEffect(() => {
    const fetchPreviewData = async () => {
      // Fetch top 6 labs
      const { data: labsData } = await supabase
        .from("labs")
        .select("id, name, logo_url, discount_percentage, rating, cities")
        .eq("is_active", true)
        .order("discount_percentage", { ascending: false })
        .limit(6);
      
      if (labsData) setLabs(labsData);

      // Fetch top 6 specializations with doctor counts
      const { data: specsData } = await supabase
        .from("doctor_specializations")
        .select("id, name, slug, icon_url")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(6);
      
      if (specsData) setSpecializations(specsData);
    };

    fetchPreviewData();
  }, []);

  // Check if user is an approved doctor
  useEffect(() => {
    const checkDoctorStatus = async () => {
      if (!user) {
        setIsApprovedDoctor(false);
        return;
      }
      
      const { data } = await supabase
        .from("doctors")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .maybeSingle();
      
      setIsApprovedDoctor(!!data);
    };

    checkDoctorStatus();
  }, [user]);

  const simpleNavLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/compare", label: "Compare Prices", icon: BarChart3 },
    { href: "/hospitals", label: "Hospitals", icon: Hospital },
    { href: "/surgeries", label: "Surgeries", icon: Scissors },
    { href: "/find-nurses", label: "Home Nurses", icon: Heart },
    { href: "/health-hub", label: "Health Hub", icon: Heart },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src={myPakLabsLogo} 
              alt="MyPakLabs Logo" 
              className="h-10 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <span className="text-lg font-bold text-foreground">MyPakLabs</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5">
            {/* Home */}
            <Link to="/">
              <Button
                variant={isActive("/") ? "soft" : "ghost"}
                size="sm"
                className="gap-1.5 text-xs px-2"
              >
                <Home className="w-3.5 h-3.5" />
                Home
              </Button>
            </Link>

            {/* Labs - Mega Menu */}
            <HoverCard openDelay={0} closeDelay={100}>
              <HoverCardTrigger asChild>
                <Link to="/labs">
                  <Button
                    variant={isActive("/labs") ? "soft" : "ghost"}
                    size="sm"
                    className="gap-1 text-xs px-2"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    Labs
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </Link>
              </HoverCardTrigger>
              <HoverCardContent className="w-[400px] p-4" align="start">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Partner Labs</h4>
                    <Link to="/labs" className="text-xs text-primary hover:underline flex items-center gap-1">
                      View All <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {labs.map((lab) => (
                      <Link 
                        key={lab.id} 
                        to={`/labs/${lab.id}`}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {lab.logo_url ? (
                            <img src={lab.logo_url} alt={lab.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <FlaskConical className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{lab.name}</p>
                          <div className="flex items-center gap-2">
                            {lab.discount_percentage && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0">
                                {lab.discount_percentage}% OFF
                              </Badge>
                            )}
                            {lab.rating && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-medical-orange text-medical-orange" />
                                {lab.rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link to="/labs">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Browse All Labs
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </HoverCardContent>
            </HoverCard>

            {/* Compare Prices */}
            <Link to="/compare">
              <Button
                variant={isActive("/compare") ? "soft" : "ghost"}
                size="sm"
                className="gap-1.5 text-xs px-2"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Compare
              </Button>
            </Link>

            {/* Find Doctors - Mega Menu */}
            <HoverCard openDelay={0} closeDelay={100}>
              <HoverCardTrigger asChild>
                <Link to="/find-doctors">
                  <Button
                    variant={isActive("/find-doctors") ? "soft" : "ghost"}
                    size="sm"
                    className="gap-1 text-xs px-2"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    Doctors
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </Link>
              </HoverCardTrigger>
              <HoverCardContent className="w-[400px] p-4" align="start">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Find Doctors by Specialty</h4>
                    <Link to="/find-doctors" className="text-xs text-primary hover:underline flex items-center gap-1">
                      View All <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {specializations.map((spec) => (
                      <Link 
                        key={spec.id} 
                        to={`/find-doctors?specialty=${spec.slug}`}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {spec.icon_url ? (
                            <img src={spec.icon_url} alt={spec.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Stethoscope className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{spec.name}</p>
                          <p className="text-[10px] text-muted-foreground">Find specialists</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link to="/find-doctors">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Browse All Specialties
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </HoverCardContent>
            </HoverCard>

            {/* Other Links */}
            <Link to="/hospitals">
              <Button
                variant={isActive("/hospitals") ? "soft" : "ghost"}
                size="sm"
                className="gap-1.5 text-xs px-2"
              >
                <Hospital className="w-3.5 h-3.5" />
                Hospitals
              </Button>
            </Link>
            <Link to="/surgeries">
              <Button
                variant={isActive("/surgeries") ? "soft" : "ghost"}
                size="sm"
                className="gap-1.5 text-xs px-2"
              >
                <Scissors className="w-3.5 h-3.5" />
                Surgeries
              </Button>
            </Link>
            <Link to="/find-nurses">
              <Button
                variant={isActive("/find-nurses") ? "soft" : "ghost"}
                size="sm"
                className="gap-1.5 text-xs px-2"
              >
                <Heart className="w-3.5 h-3.5" />
                Nurses
              </Button>
            </Link>
            <Link to="/health-hub">
              <Button
                variant={isActive("/health-hub") ? "soft" : "ghost"}
                size="sm"
                className="gap-1.5 text-xs px-2"
              >
                <Heart className="w-3.5 h-3.5" />
                Health Hub
              </Button>
            </Link>
            <Link to="/join-as-doctor">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs px-2 ml-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <UserPlus className="w-3.5 h-3.5" />
                Join as Doctor
              </Button>
            </Link>
            <Link to="/join-as-nurse">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs px-2 border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white">
                <Heart className="w-3.5 h-3.5" />
                Join as Nurse
              </Button>
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="max-w-[100px] truncate text-xs">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium">{user.user_metadata?.full_name || 'User'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer text-xs">
                      <User className="w-3.5 h-3.5" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-bookings" className="flex items-center gap-2 cursor-pointer text-xs">
                      <ShoppingCart className="w-3.5 h-3.5" />
                      My Bookings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-prescriptions" className="flex items-center gap-2 cursor-pointer text-xs">
                      <FileText className="w-3.5 h-3.5" />
                      My Prescriptions
                    </Link>
                  </DropdownMenuItem>
                  {isApprovedDoctor && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/doctor-dashboard" className="flex items-center gap-2 cursor-pointer text-xs">
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          Doctor Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer text-xs">
                          <Shield className="w-3.5 h-3.5" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {isModerator && !isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/moderator/prescriptions" className="flex items-center gap-2 cursor-pointer text-xs">
                          <UserCheck className="w-3.5 h-3.5" />
                          Moderator Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer text-xs">
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                    <User className="w-3.5 h-3.5" />
                    Login
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button size="sm" className="text-xs">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-card border-b border-border animate-fade-in">
          <div className="container mx-auto px-4 py-3 space-y-1">
            {[
              { href: "/", label: "Home", icon: Home },
              { href: "/labs", label: "Labs", icon: FlaskConical },
              { href: "/compare", label: "Compare Prices", icon: BarChart3 },
              { href: "/find-doctors", label: "Find Doctors", icon: Stethoscope },
              { href: "/hospitals", label: "Hospitals", icon: Hospital },
              { href: "/surgeries", label: "Surgeries", icon: Scissors },
              { href: "/find-nurses", label: "Home Nurses", icon: Heart },
              { href: "/health-hub", label: "Health Hub", icon: Heart },
            ].map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsOpen(false)}
              >
                <Button
                  variant={isActive(link.href) ? "soft" : "ghost"}
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                >
                  <link.icon className="w-3.5 h-3.5" />
                  {link.label}
                </Button>
              </Link>
            ))}
            <Link to="/join-as-doctor" onClick={() => setIsOpen(false)}>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-primary text-primary text-xs">
                <UserPlus className="w-3.5 h-3.5" />
                Join as Doctor
              </Button>
            </Link>
            <Link to="/join-as-nurse" onClick={() => setIsOpen(false)}>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-rose-600 text-rose-600 text-xs">
                <Heart className="w-3.5 h-3.5" />
                Join as Nurse
              </Button>
            </Link>
            <div className="pt-2 border-t border-border space-y-1">
              {user ? (
                <>
                  <div className="px-3 py-2 bg-muted rounded-lg">
                    <p className="text-xs font-medium">{user.user_metadata?.full_name || 'User'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Link to="/profile" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                      <User className="w-3.5 h-3.5" />
                      My Profile
                    </Button>
                  </Link>
                  <Link to="/my-bookings" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                      <ShoppingCart className="w-3.5 h-3.5" />
                      My Bookings
                    </Button>
                  </Link>
                  {isApprovedDoctor && (
                    <Link to="/doctor-dashboard" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        Doctor Dashboard
                      </Button>
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                        <Shield className="w-3.5 h-3.5" />
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button variant="destructive" size="sm" className="w-full gap-2 text-xs" onClick={handleSignOut}>
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                      <User className="w-3.5 h-3.5" />
                      Login
                    </Button>
                  </Link>
                  <Link to="/auth?mode=signup" onClick={() => setIsOpen(false)}>
                    <Button size="sm" className="w-full text-xs">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
