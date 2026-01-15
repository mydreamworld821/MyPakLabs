import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GlobalSearch from "@/components/GlobalSearch";
import FeaturedDoctors from "@/components/home/FeaturedDoctors";
import FeaturedNurses from "@/components/home/FeaturedNurses";
import HeroSection from "@/components/home/HeroSection";
import ConsultSpecialists from "@/components/home/ConsultSpecialists";
import SearchByCondition from "@/components/home/SearchByCondition";
import CustomSections from "@/components/home/CustomSections";
import { useSectionConfig } from "@/hooks/useHomepageSections";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import myPakLabsLogo from "@/assets/mypaklabs-logo.jpeg";
import { Video, Calendar, Zap, FlaskConical, Pill, Heart, Building2, Stethoscope, Star, Shield, Clock, ChevronRight, TrendingDown, Award, AlertTriangle, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [featuredLabs, setFeaturedLabs] = useState<Lab[]>([]);
  const [popularTests, setPopularTests] = useState<Test[]>([]);
  const [serviceCards, setServiceCards] = useState<ServiceCard[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get service cards section config from admin
  const { config: serviceCardsConfig } = useSectionConfig('service_cards');
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile if user is logged in
        if (user) {
          const {
            data
          } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).single();
          setProfile(data);
        }

        // Fetch featured labs (prioritize is_featured, then by order)
        const {
          data: labsData
        } = await supabase.from("labs").select("id, name, slug, logo_url, rating, review_count, discount_percentage, cities, is_featured, featured_order").eq("is_active", true).eq("is_featured", true).order("featured_order", {
          ascending: true
        }).limit(6);

        // If no featured labs, fallback to top rated
        if (labsData && labsData.length > 0) {
          setFeaturedLabs(labsData);
        } else {
          const {
            data: fallbackLabs
          } = await supabase.from("labs").select("id, name, slug, logo_url, rating, review_count, discount_percentage, cities").eq("is_active", true).order("rating", {
            ascending: false
          }).limit(6);
          if (fallbackLabs) setFeaturedLabs(fallbackLabs);
        }

        // Fetch popular tests
        const {
          data: testsData
        } = await supabase.from("tests").select("id, name, category, slug").eq("is_active", true).limit(8);
        if (testsData) setPopularTests(testsData);

        // Fetch service cards
        const {
          data: cardsData
        } = await supabase.from("service_cards").select("*").eq("is_active", true).order("display_order", {
          ascending: true
        });
        if (cardsData) setServiceCards(cardsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Icon mapping for fallback
  const iconMap: Record<string, React.ComponentType<{
    className?: string;
  }>> = {
    Video,
    Calendar,
    Zap,
    FlaskConical,
    Pill,
    Heart,
    Building2,
    Stethoscope
  };

  // Quick access services
  const quickServices = [{
    id: "labs",
    title: "Labs",
    icon: FlaskConical,
    link: "/labs",
    bgColor: "bg-sky-100",
    iconColor: "text-primary"
  }, {
    id: "pharmacies",
    title: "Pharmacies",
    icon: Store,
    link: "/pharmacies",
    bgColor: "bg-emerald-100",
    iconColor: "text-emerald-600"
  }, {
    id: "doctors",
    title: "Doctors",
    icon: Stethoscope,
    link: "/find-doctors",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600"
  }, {
    id: "hospitals",
    title: "Hospitals",
    icon: Building2,
    link: "/hospitals",
    bgColor: "bg-teal-100",
    iconColor: "text-teal-600"
  }, {
    id: "surgeries",
    title: "Surgeries",
    icon: Heart,
    link: "/surgeries",
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600"
  }];
  return <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      <main className="py-6 md:py-8 relative z-0">
        <div className="container mx-auto px-4 relative">
          {/* Services Section - Bento Grid Layout */}
          {serviceCardsConfig?.is_visible !== false && (
            <div className="mb-8">
              <div className="mb-4">
                <h2 className="text-base md:text-lg font-semibold text-foreground">
                  {serviceCardsConfig?.title || "How can we help you today?"}
                </h2>
                {serviceCardsConfig?.subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {serviceCardsConfig.subtitle}
                  </p>
                )}
              </div>

              {/* Bento Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Left Column - Large Card (Video Consultation) */}
                {serviceCards[0] && (
                  <Link 
                    to={serviceCards[0].link} 
                    className="md:col-span-3 md:row-span-2 block group"
                  >
                    <Card 
                      className={`h-full ${serviceCards[0].bg_color || 'bg-sky-100'} border-0 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden relative`}
                      style={{ borderRadius: '12px' }}
                    >
                      {serviceCards[0].image_url ? (
                        <>
                          <img 
                            src={serviceCards[0].image_url} 
                            alt={serviceCards[0].title} 
                            className="absolute inset-0 w-full h-full object-cover object-top"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-transparent to-transparent" />
                          <CardContent className="p-4 h-full min-h-[280px] md:min-h-[320px] flex flex-col relative z-10">
                            <div>
                              <h3 className="font-bold text-white text-lg mb-0.5">
                                {serviceCards[0].title}
                              </h3>
                              {serviceCards[0].subtitle && (
                                <p className="text-sm text-white/90">
                                  {serviceCards[0].subtitle}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </>
                      ) : (
                        <CardContent className="p-4 h-full min-h-[280px] md:min-h-[320px] flex flex-col">
                          <div>
                            <h3 className="font-bold text-primary text-lg mb-0.5">
                              {serviceCards[0].title}
                            </h3>
                            {serviceCards[0].subtitle && (
                              <p className="text-sm text-muted-foreground">
                                {serviceCards[0].subtitle}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </Link>
                )}

                {/* Middle Column - Two Stacked Cards */}
                <div className="md:col-span-4 flex flex-col gap-3">
                  {/* In-clinic Visit */}
                  {serviceCards[1] && (
                    <Link to={serviceCards[1].link} className="block group flex-1">
                      <Card 
                        className={`h-full ${serviceCards[1].bg_color || 'bg-teal-600'} border-0 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden relative`}
                        style={{ borderRadius: '12px' }}
                      >
                        {serviceCards[1].image_url ? (
                          <>
                            <img 
                              src={serviceCards[1].image_url} 
                              alt={serviceCards[1].title} 
                              className="absolute inset-0 w-full h-full object-cover object-right"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-700/95 via-teal-600/60 to-transparent" />
                            <CardContent className="p-4 h-full min-h-[140px] flex flex-col justify-center relative z-10">
                              <h3 className="font-bold text-white text-lg mb-0.5">
                                {serviceCards[1].title}
                              </h3>
                              {serviceCards[1].subtitle && (
                                <p className="text-sm text-white/90">
                                  {serviceCards[1].subtitle}
                                </p>
                              )}
                            </CardContent>
                          </>
                        ) : (
                          <CardContent className="p-4 h-full min-h-[140px] flex flex-col justify-center">
                            <h3 className="font-bold text-white text-lg mb-0.5">
                              {serviceCards[1].title}
                            </h3>
                            {serviceCards[1].subtitle && (
                              <p className="text-sm text-white/90">
                                {serviceCards[1].subtitle}
                              </p>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    </Link>
                  )}

                  {/* Weight Loss / Additional Card */}
                  {serviceCards[2] && (
                    <Link to={serviceCards[2].link} className="block group flex-1">
                      <Card 
                        className={`h-full ${serviceCards[2].bg_color || 'bg-amber-100'} border-0 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden relative`}
                        style={{ borderRadius: '12px' }}
                      >
                        {serviceCards[2].image_url ? (
                          <>
                            <img 
                              src={serviceCards[2].image_url} 
                              alt={serviceCards[2].title} 
                              className="absolute inset-0 w-full h-full object-cover object-right"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-100/95 via-amber-50/60 to-transparent" />
                            <CardContent className="p-4 h-full min-h-[140px] flex flex-col justify-center relative z-10">
                              <h3 className="font-bold text-teal-700 text-lg mb-0.5">
                                {serviceCards[2].title}
                              </h3>
                              {serviceCards[2].subtitle && (
                                <p className="text-sm text-teal-600/80">
                                  {serviceCards[2].subtitle}
                                </p>
                              )}
                            </CardContent>
                          </>
                        ) : (
                          <CardContent className="p-4 h-full min-h-[140px] flex flex-col justify-center">
                            <h3 className="font-bold text-teal-700 text-lg mb-0.5">
                              {serviceCards[2].title}
                            </h3>
                            {serviceCards[2].subtitle && (
                              <p className="text-sm text-teal-600/80">
                                {serviceCards[2].subtitle}
                              </p>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    </Link>
                  )}
                </div>

                {/* Right Column - Instant Doctor + Quick Access */}
                <div className="md:col-span-5 flex flex-col gap-3">
                  {/* Instant Doctor Card */}
                  {serviceCards[3] && (
                    <Link to={serviceCards[3].link} className="block group">
                      <Card 
                        className="h-full bg-gradient-to-r from-amber-50 to-white border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                        style={{ borderRadius: '12px' }}
                      >
                        <CardContent className="p-4 min-h-[100px] flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                              <Zap className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-bold text-amber-600 text-lg flex items-center gap-1">
                              INSTANT <span className="text-teal-600">DOCTOR</span>
                              <span className="text-amber-500">+</span>
                            </h3>
                            <p className="text-sm text-gray-600">
                              {serviceCards[3].subtitle || "Get Instant Relief in a Click"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )}

                  {/* Quick Access Icons Grid */}
                  <div className="grid grid-cols-5 gap-2">
                    {quickServices.map(service => (
                      <Link key={service.id} to={service.link} className="block group">
                        <Card className="h-full hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100" style={{ borderRadius: '12px' }}>
                          <CardContent className="p-2 md:p-3 flex flex-col items-center text-center">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden mb-1.5 group-hover:scale-105 transition-transform">
                              {service.id === 'labs' && (
                                <div className="w-full h-full bg-sky-50 flex items-center justify-center">
                                  <FlaskConical className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                                </div>
                              )}
                              {service.id === 'pharmacies' && (
                                <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                                  <Pill className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                                </div>
                              )}
                              {service.id === 'doctors' && (
                                <div className="w-full h-full bg-red-50 flex items-center justify-center">
                                  <Heart className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                                </div>
                              )}
                              {service.id === 'hospitals' && (
                                <div className="w-full h-full bg-teal-50 flex items-center justify-center">
                                  <Building2 className="w-5 h-5 md:w-6 md:h-6 text-teal-600" />
                                </div>
                              )}
                              {service.id === 'surgeries' && (
                                <div className="w-full h-full bg-purple-50 flex items-center justify-center">
                                  <Stethoscope className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                                </div>
                              )}
                            </div>
                            <h3 className="font-medium text-[10px] md:text-xs text-gray-700 group-hover:text-primary transition-colors">
                              {service.title}
                            </h3>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Consult Best Doctors Online - Specializations Section */}
          <ConsultSpecialists className="mb-8" maxItems={14} />

          {/* Search by Condition Section */}
          <SearchByCondition className="mb-8" maxItems={7} />

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

            {loading ? <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                {[...Array(6)].map((_, i) => <div key={i} className="bg-muted rounded-lg h-28 animate-pulse" />)}
              </div> : <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                {featuredLabs.map(lab => <Link key={lab.id} to={`/lab/${lab.slug}`} className="block group">
                    <Card className="h-full hover:shadow-md transition-all duration-300 overflow-hidden">
                      <CardContent className="p-2 md:p-3 flex flex-col items-center text-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-muted flex items-center justify-center mb-2 overflow-hidden">
                          {lab.logo_url ? <img src={lab.logo_url} alt={lab.name} className="w-full h-full object-cover" onError={e => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }} /> : null}
                          <FlaskConical className={`w-5 h-5 md:w-6 md:h-6 text-primary ${lab.logo_url ? 'hidden' : ''}`} />
                        </div>
                        <h3 className="font-medium text-xs md:text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {lab.name}
                        </h3>
                        {lab.rating && <div className="flex items-center gap-0.5 text-[10px] md:text-xs text-muted-foreground">
                            <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-yellow-400 text-yellow-400" />
                            <span>{lab.rating}</span>
                          </div>}
                        {lab.discount_percentage && lab.discount_percentage > 0 && <Badge variant="secondary" className="mt-1 text-[10px] md:text-xs px-1.5 py-0 bg-green-100 text-green-700">
                            {lab.discount_percentage}% OFF
                          </Badge>}
                      </CardContent>
                    </Card>
                  </Link>)}
              </div>}
          </div>

          {/* Featured Doctors Section */}
          <FeaturedDoctors className="mb-8" />

          {/* Featured Nurses Section */}
          <FeaturedNurses className="mb-8" />

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

            {loading ? <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {[...Array(8)].map((_, i) => <div key={i} className="bg-muted rounded-lg h-14 animate-pulse" />)}
              </div> : <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {popularTests.map(test => <Link key={test.id} to={`/labs?test=${test.slug}`} className="block group">
                    <Card className="h-full hover:shadow-sm hover:border-primary/30 transition-all duration-300">
                      <CardContent className="p-2 md:p-3">
                        <h3 className="font-medium text-xs md:text-sm group-hover:text-primary transition-colors line-clamp-2">
                          {test.name}
                        </h3>
                        {test.category && <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                            {test.category}
                          </p>}
                      </CardContent>
                    </Card>
                  </Link>)}
              </div>}
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

          {/* Custom Sections from Admin */}
          <CustomSections />
        </div>
      </main>

      <Footer />
    </div>;
};
export default Index;