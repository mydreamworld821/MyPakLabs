import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import GlobalSearch from "@/components/GlobalSearch";
import ServiceGrid from "@/components/home/ServiceGrid";
import LabCarousel from "@/components/home/LabCarousel";
import DoctorCarousel from "@/components/home/DoctorCarousel";
import NurseCarousel from "@/components/home/NurseCarousel";
import PromoCard from "@/components/home/PromoCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import myPakLabsLogo from "@/assets/mypaklabs-logo.jpeg";
import { 
  AlertTriangle, 
  BarChart3, 
  TrendingDown, 
  Shield, 
  Clock,
  Award,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Profile {
  full_name: string | null;
}

interface Test {
  id: string;
  name: string;
  category: string | null;
  slug: string;
}

const Index = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [popularTests, setPopularTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", user.id)
            .single();
          setProfile(data);
        }

        const { data: testsData } = await supabase
          .from("tests")
          .select("id, name, category, slug")
          .eq("is_active", true)
          .limit(8);
        if (testsData) setPopularTests(testsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />

      {/* Hero Section - Modern & Clean */}
      <section className="pt-16 pb-6 bg-gradient-to-br from-primary via-primary to-cyan-600 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-cyan-400/20 rounded-full blur-2xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* User Greeting */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg border border-white/30">
              {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "G"}
            </div>
            <div>
              <p className="text-white/80 text-xs">{getGreeting()}</p>
              <p className="text-white font-semibold text-sm">
                {profile?.full_name || (user ? user.email?.split('@')[0] : "Guest")}
              </p>
            </div>
          </div>

          {/* Main Headline */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <img src={myPakLabsLogo} alt="Logo" className="w-7 h-7 rounded-lg" />
              <span className="text-white font-bold text-xl">MyPakLabs</span>
            </div>
            <h1 className="text-white/90 text-sm leading-relaxed max-w-sm">
              Verified doctors, labs & pharmacies with <span className="font-bold text-white">exclusive discounts</span>
            </h1>
          </div>

          {/* Search Bar */}
          <GlobalSearch className="w-full max-w-lg" />

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="secondary" className="bg-white/15 text-white border-0 text-[10px] gap-1 backdrop-blur-sm">
              <Shield className="w-3 h-3" /> Verified
            </Badge>
            <Badge variant="secondary" className="bg-white/15 text-white border-0 text-[10px] gap-1 backdrop-blur-sm">
              <TrendingDown className="w-3 h-3" /> Best Prices
            </Badge>
            <Badge variant="secondary" className="bg-white/15 text-white border-0 text-[10px] gap-1 backdrop-blur-sm">
              <Clock className="w-3 h-3" /> Quick Results
            </Badge>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-5 space-y-6">
        
        {/* Emergency Banner */}
        <PromoCard 
          href="/emergency-nursing-request"
          title="🚨 Emergency Nursing"
          subtitle="Get a nurse at your doorstep"
          icon={AlertTriangle}
          gradient="bg-gradient-to-r from-red-600 to-red-500"
        />

        {/* Service Grid */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">Our Services</h2>
          </div>
          <ServiceGrid />
        </section>

        {/* Compare Prices CTA */}
        <PromoCard 
          href="/compare"
          title="Compare Lab Prices"
          subtitle="Find the best deals across labs"
          icon={BarChart3}
          gradient="bg-gradient-to-r from-indigo-600 to-purple-600"
        />

        {/* Featured Labs Carousel */}
        <LabCarousel />

        {/* Top Doctors Carousel */}
        <DoctorCarousel />

        {/* Home Nurses Carousel */}
        <NurseCarousel />

        {/* Popular Tests */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">Popular Tests</h2>
            <Link 
              to="/labs" 
              className="text-xs font-medium text-primary flex items-center gap-0.5 hover:underline"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {popularTests.map((test) => (
                <Link
                  key={test.id}
                  to={`/labs?test=${test.slug}`}
                  className="p-3 bg-card border border-border/50 rounded-xl hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <p className="font-medium text-xs line-clamp-1 text-foreground">
                    {test.name}
                  </p>
                  {test.category && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {test.category}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Why Choose Us */}
        <section className="bg-gradient-to-br from-muted/50 to-muted rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Why MyPakLabs?</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: TrendingDown, title: "Best Prices", desc: "Save up to 35%" },
              { icon: Award, title: "PMC Verified", desc: "Trusted doctors" },
              { icon: Shield, title: "Authentic", desc: "Updated info" },
              { icon: Clock, title: "Quick", desc: "Priority processing" },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2.5 p-2.5 bg-card rounded-xl border border-border/30"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-foreground">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* App Download CTA (optional future feature) */}
        <section className="bg-gradient-to-r from-primary to-cyan-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm mb-1">Get Health Updates</h3>
              <p className="text-xs text-white/80">
                Save this app to your home screen
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <img src={myPakLabsLogo} alt="App" className="w-8 h-8 rounded-lg" />
            </div>
          </div>
        </section>

      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <BottomNav />
    </div>
  );
};

export default Index;
