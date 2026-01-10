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
import myPakLabsLogo from "@/assets/mypaklabs-logo.jpeg";
import {
  Search,
  MapPin,
  Video,
  Calendar,
  Zap,
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

interface ServiceCard {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  icon_name: string | null;
  bg_color: string | null;
  link: string;
  display_order: number | null;
}

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [featuredLabs, setFeaturedLabs] = useState<Lab[]>([]);
  const [popularTests, setPopularTests] = useState<Test[]>([]);
  const [serviceCards, setServiceCards] = useState<ServiceCard[]>([]);
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

        // Fetch service cards
        const { data: cardsData } = await supabase
          .from("service_cards")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });
        
        if (cardsData) setServiceCards(cardsData);
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

  // Icon mapping for fallback
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Video,
    Calendar,
    Zap,
    FlaskConical,
    Pill,
    Heart,
    Building2,
    Stethoscope,
  };

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

        <div className="container mx-auto px-4 py-10 md:py-16 relative z-10 flex flex-col items-center text-center">
          {/* Greeting */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-semibold text-lg border border-white/30">
              {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "G"}
            </div>
            <span className="text-white/90 text-sm">
              Hello, {profile?.full_name || (user ? "User" : "Guest")}!
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 max-w-3xl leading-tight flex flex-wrap items-center justify-center gap-3">
            <img src={myPakLabsLogo} alt="MyPakLabs" className="h-14 md:h-16 lg:h-20 w-auto object-contain bg-white rounded-xl p-1.5 shadow-lg" />
            <span>Find Doctors, Labs and Hospitals Near You, Quickly and Hassle-Free</span>
          </h1>
          <p className="text-white/90 text-sm md:text-base mb-8 max-w-lg">
            Book tests from ISO certified labs with priority processing
          </p>

          {/* Centered Search Bar */}
          <div className="w-full max-w-2xl">
            <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-xl p-2 shadow-2xl">
              <div className="flex items-center gap-2 px-3 py-2 sm:border-r border-gray-200">
                <MapPin className="w-5 h-5 text-primary" />
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="border-0 shadow-none bg-transparent min-w-[120px] h-10 focus:ring-0 text-gray-700 font-medium">
                    <SelectValue placeholder="Select City" />
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
              <div className="flex-1 flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400 ml-2" />
                <Input
                  type="text"
                  placeholder="Search for tests, labs, health packages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="border-0 shadow-none bg-transparent focus-visible:ring-0 text-gray-700 placeholder:text-gray-400 h-10 text-base"
                />
                <Button onClick={handleSearch} size="lg" className="shrink-0 px-6 rounded-lg">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <Shield className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-medium">ISO Certified</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <Clock className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-medium">Quick Results</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <TrendingDown className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-medium">Best Prices</span>
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
              {serviceCards.length > 0 ? (
                serviceCards.map((card) => {
                  const IconComponent = card.icon_name ? iconMap[card.icon_name] : null;
                  return (
                    <Link key={card.id} to={card.link} className="block">
                      <Card className={`h-full ${card.bg_color || 'bg-primary/10'} border-0 hover:shadow-md transition-all duration-300 cursor-pointer group overflow-hidden relative`}>
                        {card.image_url ? (
                          <>
                            <img
                              src={card.image_url}
                              alt={card.title}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                            <CardContent className="p-4 h-full flex flex-col justify-end min-h-[160px] relative z-10">
                              <div>
                                <h3 className="font-bold text-white text-lg mb-0.5 drop-shadow-lg">
                                  {card.title}
                                </h3>
                                {card.subtitle && (
                                  <p className="text-sm text-white/90 drop-shadow">
                                    {card.subtitle}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </>
                        ) : (
                          <CardContent className="p-4 h-full flex flex-col justify-between min-h-[140px]">
                            <div>
                              <h3 className="font-semibold text-primary text-base mb-0.5">
                                {card.title}
                              </h3>
                              {card.subtitle && (
                                <p className="text-xs text-muted-foreground">
                                  {card.subtitle}
                                </p>
                              )}
                            </div>
                            {IconComponent && (
                              <div className="flex justify-center mt-2">
                                <div className="w-14 h-14 rounded-full bg-white/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <IconComponent className="w-7 h-7 text-primary" />
                                </div>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    </Link>
                  );
                })
              ) : (
                // Fallback skeleton while loading
                <>
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="h-full bg-muted/50 border-0 animate-pulse">
                      <CardContent className="p-4 h-full min-h-[140px]" />
                    </Card>
                  ))}
                </>
              )}
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
