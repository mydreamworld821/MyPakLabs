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
  ChevronDown,
  AlertTriangle,
  Store
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
  const [isApprovedNurse, setIsApprovedNurse] = useState(false);
  const [isApprovedPharmacy, setIsApprovedPharmacy] = useState(false);
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

  // Check if user is an approved doctor, nurse, or pharmacy
  useEffect(() => {
    const checkProviderStatus = async () => {
      if (!user) {
        setIsApprovedDoctor(false);
        setIsApprovedNurse(false);
        setIsApprovedPharmacy(false);
        return;
      }
      
      // Check doctor status
      const { data: doctorData } = await supabase
        .from("doctors")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .maybeSingle();
      
      setIsApprovedDoctor(!!doctorData);

      // Check nurse status
      const { data: nurseData } = await supabase
        .from("nurses")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .maybeSingle();
      
      setIsApprovedNurse(!!nurseData);

      // Check pharmacy status
      const { data: pharmacyData } = await supabase
        .from("medical_stores")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .maybeSingle();
      
      setIsApprovedPharmacy(!!pharmacyData);
    };

    checkProviderStatus();
  }, [user]);

  const simpleNavLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/compare", label: "Compare Prices", icon: BarChart3 },
    { href: "/hospitals", label: "Hospitals", icon: Hospital },
    { href: "/surgeries", label: "Surgeries", icon: Scissors },
    { href: "/find-nurses", label: "Home Nurses", icon: Heart },
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
                className={`gap-1.5 text-xs px-2.5 ${isActive("/") ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary/10"}`}
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
                    className={`gap-1 text-xs px-2.5 ${isActive("/labs") ? "bg-emerald-500 text-white" : "text-emerald-600 hover:bg-emerald-50"}`}
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
                className={`gap-1.5 text-xs px-2.5 ${isActive("/compare") ? "bg-orange-500 text-white" : "text-orange-600 hover:bg-orange-50"}`}
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
                    className={`gap-1 text-xs px-2.5 ${isActive("/find-doctors") ? "bg-blue-500 text-white" : "text-blue-600 hover:bg-blue-50"}`}
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
                className={`gap-1.5 text-xs px-2.5 ${isActive("/hospitals") ? "bg-purple-500 text-white" : "text-purple-600 hover:bg-purple-50"}`}
              >
                <Hospital className="w-3.5 h-3.5" />
                Hospitals
              </Button>
            </Link>
            <Link to="/surgeries">
              <Button
                variant={isActive("/surgeries") ? "soft" : "ghost"}
                size="sm"
                className={`gap-1.5 text-xs px-2.5 ${isActive("/surgeries") ? "bg-red-500 text-white" : "text-red-600 hover:bg-red-50"}`}
              >
                <Scissors className="w-3.5 h-3.5" />
                Surgeries
              </Button>
            </Link>
            <Link to="/find-nurses">
              <Button
                variant={isActive("/find-nurses") ? "soft" : "ghost"}
                size="sm"
                className={`gap-1.5 text-xs px-2.5 ${isActive("/find-nurses") ? "bg-rose-500 text-white" : "text-rose-600 hover:bg-rose-50"}`}
              >
                <Heart className="w-3.5 h-3.5" />
                Nurses
              </Button>
            </Link>
            <Link to="/pharmacies">
              <Button
                variant={isActive("/pharmacies") ? "soft" : "ghost"}
                size="sm"
                className={`gap-1.5 text-xs px-2.5 ${isActive("/pharmacies") ? "bg-teal-500 text-white" : "text-teal-600 hover:bg-teal-50"}`}
              >
                <Store className="w-3.5 h-3.5" />
                Pharmacies
              </Button>
            </Link>
            {/* Join Us As - Mega Menu */}
            <HoverCard openDelay={0} closeDelay={100}>
              <HoverCardTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs px-3 ml-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Join Us
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-[380px] p-0" align="end">
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 border-b">
                  <h4 className="text-base font-semibold text-foreground">Join Our Healthcare Network</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Become a part of Pakistan's growing healthcare platform
                  </p>
                </div>
                <div className="p-3 space-y-2">
                  <Link 
                    to="/join-as-doctor"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors group border border-transparent hover:border-primary/20"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Stethoscope className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        Join as Doctor
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Expand your practice, reach more patients online
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>

                  <Link 
                    to="/join-as-nurse"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-rose-50 transition-colors group border border-transparent hover:border-rose-200"
                  >
                    <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Heart className="w-6 h-6 text-rose-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground group-hover:text-rose-600 transition-colors">
                        Join as Nurse
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Provide home care services, flexible hours
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
                  </Link>

                  <Link 
                    to="/join-as-pharmacy"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors group border border-transparent hover:border-emerald-200"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Store className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                        Join as Pharmacy
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        List your store, accept online orders
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                </div>
                <div className="p-3 bg-muted/50 border-t">
                  <p className="text-[10px] text-muted-foreground text-center">
                    All registrations are reviewed by our team within 24-48 hours
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
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
                  {isApprovedNurse && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/nurse-dashboard" className="flex items-center gap-2 cursor-pointer text-xs">
                          <Heart className="w-3.5 h-3.5" />
                          Nurse Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/nurse-emergency-feed" className="flex items-center gap-2 cursor-pointer text-xs text-red-600">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Emergency Requests
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {isApprovedPharmacy && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/pharmacy-dashboard" className="flex items-center gap-2 cursor-pointer text-xs">
                          <Store className="w-3.5 h-3.5" />
                          Pharmacy Dashboard
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
              { href: "/pharmacies", label: "Pharmacies", icon: Store },
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
            
            {/* Join Us Section - Mobile */}
            <div className="pt-2 border-t border-border">
              <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Join Our Network
              </p>
              <Link to="/join-as-doctor" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-xs h-12">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Join as Doctor</p>
                    <p className="text-[10px] text-muted-foreground">Expand your practice</p>
                  </div>
                </Button>
              </Link>
              <Link to="/join-as-nurse" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-xs h-12">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Join as Nurse</p>
                    <p className="text-[10px] text-muted-foreground">Home care services</p>
                  </div>
                </Button>
              </Link>
              <Link to="/join-as-pharmacy" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-xs h-12">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Store className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Join as Pharmacy</p>
                    <p className="text-[10px] text-muted-foreground">Accept online orders</p>
                  </div>
                </Button>
              </Link>
            </div>
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
                  {isApprovedNurse && (
                    <Link to="/nurse-dashboard" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                        <Heart className="w-3.5 h-3.5" />
                        Nurse Dashboard
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
