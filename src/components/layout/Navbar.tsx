import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  LayoutDashboard
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

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isApprovedDoctor, setIsApprovedDoctor] = useState(false);
  const location = useLocation();
  const { user, isAdmin, isModerator, signOut } = useAuth();

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

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/labs", label: "Labs", icon: FlaskConical },
    { href: "/compare", label: "Compare Prices", icon: BarChart3 },
    { href: "/find-doctors", label: "Find Doctors", icon: Stethoscope },
    { href: "/hospitals", label: "Hospitals", icon: Hospital },
    { href: "/surgeries", label: "Surgeries", icon: Scissors },
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
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 gradient-hero rounded-xl flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <FlaskConical className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">MyPakLabs</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Button
                  variant={isActive(link.href) ? "soft" : "ghost"}
                  size="sm"
                  className="gap-1.5 text-xs px-2"
                >
                  <link.icon className="w-3.5 h-3.5" />
                  {link.label}
                </Button>
              </Link>
            ))}
            <Link to="/join-as-doctor">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs px-2 ml-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <UserPlus className="w-3.5 h-3.5" />
                Join as Doctor
              </Button>
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="max-w-[120px] truncate">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.user_metadata?.full_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-bookings" className="flex items-center gap-2 cursor-pointer">
                      <ShoppingCart className="w-4 h-4" />
                      My Bookings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-prescriptions" className="flex items-center gap-2 cursor-pointer">
                      <FileText className="w-4 h-4" />
                      My Prescriptions
                    </Link>
                  </DropdownMenuItem>
                  {isApprovedDoctor && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/doctor-dashboard" className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="w-4 h-4" />
                          Doctor Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <Shield className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {isModerator && !isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/moderator/prescriptions" className="flex items-center gap-2 cursor-pointer">
                          <UserCheck className="w-4 h-4" />
                          Moderator Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="gap-2">
                    <User className="w-4 h-4" />
                    Login
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="default">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-card border-b border-border animate-fade-in">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsOpen(false)}
              >
                <Button
                  variant={isActive(link.href) ? "soft" : "ghost"}
                  className="w-full justify-start gap-2"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
            <Link to="/join-as-doctor" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full justify-start gap-2 border-primary text-primary">
                <UserPlus className="w-4 h-4" />
                Join as Doctor
              </Button>
            </Link>
            <div className="pt-2 border-t border-border space-y-2">
              {user ? (
                <>
                  <div className="px-3 py-2 bg-muted rounded-lg">
                    <p className="text-sm font-medium">{user.user_metadata?.full_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Link to="/profile" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full gap-2">
                      <User className="w-4 h-4" />
                      My Profile
                    </Button>
                  </Link>
                  <Link to="/my-bookings" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      My Bookings
                    </Button>
                  </Link>
                  <Link to="/my-prescriptions" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full gap-2">
                      <FileText className="w-4 h-4" />
                      My Prescriptions
                    </Button>
                  </Link>
                  {isApprovedDoctor && (
                    <Link to="/doctor-dashboard" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Doctor Dashboard
                      </Button>
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full gap-2">
                        <Shield className="w-4 h-4" />
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                  {isModerator && !isAdmin && (
                    <Link to="/moderator/prescriptions" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full gap-2">
                        <UserCheck className="w-4 h-4" />
                        Moderator Panel
                      </Button>
                    </Link>
                  )}
                  <Button variant="destructive" className="w-full gap-2" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full gap-2">
                      <User className="w-4 h-4" />
                      Login
                    </Button>
                  </Link>
                  <Link to="/auth?mode=signup" onClick={() => setIsOpen(false)}>
                    <Button variant="default" className="w-full">
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
