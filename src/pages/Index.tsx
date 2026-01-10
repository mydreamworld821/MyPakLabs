import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  MapPin,
  Video,
  Calendar,
  Zap,
  Dumbbell,
  FlaskConical,
  Pill,
  Heart,
  Building2,
  Stethoscope,
  Star,
  Shield,
  Clock,
  ChevronRight,
  TrendingDown,
  Award,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Profile {
  full_name: string | null;
}

interface Lab {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  rating: number | null;
  review_count: number | null;
  discount_percentage: number | null;
  cities: string[] | null;
}

interface Test {
  id: string;
  name: string;
  category: string | null;
  slug: string;
}

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [featuredLabs, setFeaturedLabs] = useState<Lab[]>([]);
  const [popularTests, setPopularTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile if user is logged in
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", user.id)
            .single();
          setProfile(data);
        }

        // Fetch featured labs (top rated)
        const { data: labsData } = await supabase
          .from("labs")
          .select("id, name, slug, logo_url, rating, review_count, discount_percentage, cities")
          .eq("is_active", true)
          .order("rating", { ascending: false })
          .limit(6);
        
        if (labsData) setFeaturedLabs(labsData);

        // Fetch popular tests
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

  // Cities list
  const cities = [
    "Karachi",
    "Lahore", 
    "Islamabad",
    "Rawalpindi",
    "Faisalabad",
    "Multan",
    "Peshawar",
    "Quetta",
  ];

  // Main service cards (new features)
  const mainServices = [
    {
      id: "video-consultation",
      title: "Video Consultation",
      subtitle: "PMC Verified Doctors",
      icon: Video,
      bgColor: "bg-sky-50",
      iconColor: "text-primary",
      link: "/video-consultation",
    },
    {
      id: "in-clinic",
      title: "In-clinic Visit",
      subtitle: "Book Appointment",
      icon: Calendar,
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      link: "/in-clinic-visit",
    },
    {
      id: "instant-doctor",
      title: "INSTANT DOCTOR+",
      subtitle: "Get Instant Relief in a Click",
      icon: Zap,
      bgColor: "bg-sky-50",
      iconColor: "text-yellow-500",
      link: "/instant-doctor",
    },
    {
      id: "weight-loss",
      title: "Weight Loss Clinic",
      subtitle: "Healthy Lifestyle",
      icon: Dumbbell,
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      link: "/weight-loss-clinic",
    },
  ];

  // Quick access services
  const quickServices = [
    {
      id: "labs",
      title: "Labs",
      icon: FlaskConical,
      link: "/labs",
      bgColor: "bg-sky-100",
      iconColor: "text-primary",
    },
    {
      id: "medicines",
      title: "Medicines",
      icon: Pill,
      link: "/medicines",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      id: "health-hub",
      title: "Health Hub",
      icon: Heart,
      link: "/health-hub",
      bgColor: "bg-red-100",
      iconColor: "text-red-500",
    },
    {
      id: "hospitals",
      title: "Hospitals",
      icon: Building2,
      link: "/hospitals",
      bgColor: "bg-teal-100",
      iconColor: "text-teal-600",
    },
    {
      id: "surgeries",
      title: "Surgeries",
      icon: Stethoscope,
      link: "/surgeries",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/labs?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-20 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-24 h-24 rounded-full bg-white/20" />
          <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white/20" />
        </div>

        <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
          {/* Greeting */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
              {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "G"}
            </div>
            <span className="text-white/90 text-sm">
              Hello, {profile?.full_name || (user ? "User" : "Guest")}!
            </span>
          </div>

          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 max-w-xl">
            Compare Lab Test Prices & Save Up to 35%
          </h1>
          <p className="text-white/90 text-sm md:text-base mb-5 max-w-lg">
            Book tests from ISO certified labs with priority processing
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-lg p-1.5 shadow-xl max-w-xl">
            <div className="flex items-center gap-1 px-2 py-1.5 sm:border-r border-gray-200">
              <MapPin className="w-4 h-4 text-gray-400" />
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="border-0 shadow-none bg-transparent min-w-[100px] h-8 focus:ring-0 text-gray-700 text-sm">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 flex items-center gap-1">
              <Search className="w-4 h-4 text-gray-400 ml-1" />
              <Input
                type="text"
                placeholder="Search for tests, labs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="border-0 shadow-none bg-transparent focus-visible:ring-0 text-gray-700 placeholder:text-gray-400 h-8 text-sm"
              />
              <Button onClick={handleSearch} size="sm" className="shrink-0">
                Search
              </Button>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-3 md:gap-6 mt-5">
            <div className="flex items-center gap-1.5 text-white/90">
              <Shield className="w-4 h-4" />
              <span className="text-xs">ISO Certified</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Quick Results</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs">Best Prices</span>
            </div>
          </div>
        </div>
      </section>

      <main className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          {/* Services Section */}
          <div className="mb-8">
            <h2 className="text-base md:text-lg font-semibold text-foreground mb-4">
              How can we help you today?
            </h2>

            {/* Main Service Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {/* Video Consultation */}
              <Link to={mainServices[0].link} className="block">
                <Card className={`h-full ${mainServices[0].bgColor} border-0 hover:shadow-md transition-all duration-300 cursor-pointer group overflow-hidden`}>
                  <CardContent className="p-4 h-full flex flex-col justify-between min-h-[140px]">
                    <div>
                      <h3 className="font-semibold text-primary text-base mb-0.5">
                        {mainServices[0].title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {mainServices[0].subtitle}
                      </p>
                    </div>
                    <div className="flex justify-center mt-2">
                      <div className="w-14 h-14 rounded-full bg-white/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Video className="w-7 h-7 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Middle column - stacked */}
              <div className="flex flex-col gap-3">
                <Link to={mainServices[1].link} className="block flex-1">
                  <Card className={`h-full ${mainServices[1].bgColor} border-0 hover:shadow-md transition-all duration-300 cursor-pointer group`}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-amber-700 text-sm mb-0.5">
                          {mainServices[1].title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {mainServices[1].subtitle}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Calendar className="w-5 h-5 text-amber-600" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to={mainServices[3].link} className="block flex-1">
                  <Card className={`h-full ${mainServices[3].bgColor} border-0 hover:shadow-md transition-all duration-300 cursor-pointer group`}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-emerald-700 text-sm mb-0.5">
                          {mainServices[3].title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {mainServices[3].subtitle}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Dumbbell className="w-5 h-5 text-emerald-600" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Instant Doctor */}
              <Link to={mainServices[2].link} className="block">
                <Card className={`h-full ${mainServices[2].bgColor} border-0 hover:shadow-md transition-all duration-300 cursor-pointer group overflow-hidden`}>
                  <CardContent className="p-4 h-full flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-start gap-1.5">
                      <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <div>
                        <h3 className="font-bold text-primary text-base tracking-tight">
                          INSTANT
                        </h3>
                        <h3 className="font-bold text-primary text-base -mt-1">
                          DOCTOR<span className="text-red-500">+</span>
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {mainServices[2].subtitle}
                    </p>
                    <div className="flex justify-end mt-2">
                      <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Stethoscope className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Quick Access Services */}
            <div className="grid grid-cols-5 gap-1 md:gap-3">
              {quickServices.map((service) => (
                <Link key={service.id} to={service.link} className="block group">
                  <div className="flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${service.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                      <service.icon className={`w-5 h-5 md:w-6 md:h-6 ${service.iconColor}`} />
                    </div>
                    <span className="text-[10px] md:text-xs font-medium text-foreground text-center">
                      {service.title}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Featured Labs Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-foreground">
                Featured Labs
              </h2>
              <Link to="/labs" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-muted rounded-lg h-28 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                {featuredLabs.map((lab) => (
                  <Link key={lab.id} to={`/lab/${lab.slug}`} className="block group">
                    <Card className="h-full hover:shadow-md transition-all duration-300 overflow-hidden">
                      <CardContent className="p-2 md:p-3 flex flex-col items-center text-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-muted flex items-center justify-center mb-2 overflow-hidden">
                          {lab.logo_url ? (
                            <img
                              src={lab.logo_url}
                              alt={lab.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <FlaskConical className={`w-5 h-5 md:w-6 md:h-6 text-primary ${lab.logo_url ? 'hidden' : ''}`} />
                        </div>
                        <h3 className="font-medium text-xs md:text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {lab.name}
                        </h3>
                        {lab.rating && (
                          <div className="flex items-center gap-0.5 text-[10px] md:text-xs text-muted-foreground">
                            <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-yellow-400 text-yellow-400" />
                            <span>{lab.rating}</span>
                          </div>
                        )}
                        {lab.discount_percentage && lab.discount_percentage > 0 && (
                          <Badge variant="secondary" className="mt-1 text-[10px] md:text-xs px-1.5 py-0 bg-green-100 text-green-700">
                            {lab.discount_percentage}% OFF
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Popular Tests Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-foreground">
                Popular Tests
              </h2>
              <Link to="/labs" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-muted rounded-lg h-14 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {popularTests.map((test) => (
                  <Link key={test.id} to={`/labs?test=${test.slug}`} className="block group">
                    <Card className="h-full hover:shadow-sm hover:border-primary/30 transition-all duration-300">
                      <CardContent className="p-2 md:p-3">
                        <h3 className="font-medium text-xs md:text-sm group-hover:text-primary transition-colors line-clamp-2">
                          {test.name}
                        </h3>
                        {test.category && (
                          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                            {test.category}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Why Choose Us Section */}
          <div className="mb-8">
            <h2 className="text-base md:text-lg font-semibold text-foreground mb-4 text-center">
              Why Choose MyPakLabs?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              <Card className="text-center border-0 shadow-sm">
                <CardContent className="p-3 md:p-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-xs md:text-sm mb-1">Best Prices</h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2">
                    Save up to 35% on tests
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center border-0 shadow-sm">
                <CardContent className="p-3 md:p-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Award className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-xs md:text-sm mb-1">PMC Verified</h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2">
                    PMC verified doctors
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center border-0 shadow-sm">
                <CardContent className="p-3 md:p-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Shield className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-xs md:text-sm mb-1">Authentic Info</h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2">
                    Updated information
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center border-0 shadow-sm">
                <CardContent className="p-3 md:p-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-xs md:text-sm mb-1">Quick Results</h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2">
                    Priority processing
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
