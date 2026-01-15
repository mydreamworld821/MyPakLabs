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
          {/* Services Section - Admin Managed */}
          {serviceCardsConfig?.is_visible !== false && (
            <div 
              className="mb-8"
              style={{
                backgroundColor: serviceCardsConfig?.background_color || 'transparent',
                padding: serviceCardsConfig ? `${serviceCardsConfig.section_padding_y || 0}px ${serviceCardsConfig.section_padding_x || 0}px` : undefined,
                borderRadius: serviceCardsConfig?.card_border_radius ? `${serviceCardsConfig.card_border_radius}px` : undefined,
              }}
            >
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

              {/* Main Service Cards Grid - Uses admin columns config */}
              <div 
                className="grid gap-3 mb-4"
                style={{
                  gridTemplateColumns: `repeat(${serviceCardsConfig?.columns_mobile || 1}, minmax(0, 1fr))`,
                }}
              >
                <style>
                  {`
                    @media (min-width: 768px) {
                      .service-cards-grid {
                        grid-template-columns: repeat(${serviceCardsConfig?.columns_tablet || 2}, minmax(0, 1fr)) !important;
                      }
                    }
                    @media (min-width: 1024px) {
                      .service-cards-grid {
                        grid-template-columns: repeat(${serviceCardsConfig?.columns_desktop || 3}, minmax(0, 1fr)) !important;
                      }
                    }
                  `}
                </style>
                <div 
                  className="service-cards-grid grid gap-3"
                  style={{ gap: serviceCardsConfig?.items_gap ? `${serviceCardsConfig.items_gap}px` : '12px' }}
                >
                  {serviceCards.length > 0 ? serviceCards.slice(0, serviceCardsConfig?.max_items || 8).map(card => {
                    const IconComponent = card.icon_name ? iconMap[card.icon_name] : null;
                    const cardHeight = serviceCardsConfig?.card_height || 160;
                    const cardBorderRadius = serviceCardsConfig?.card_border_radius || 12;
                    
                    return (
                      <Link key={card.id} to={card.link} className="block">
                        <Card 
                          className={`h-full ${card.bg_color || 'bg-primary/10'} border-0 hover:shadow-md transition-all duration-300 cursor-pointer group overflow-hidden relative`}
                          style={{ 
                            borderRadius: `${cardBorderRadius}px`,
                            boxShadow: serviceCardsConfig?.card_shadow === 'none' ? 'none' : 
                                       serviceCardsConfig?.card_shadow === 'sm' ? '0 1px 2px rgba(0,0,0,0.05)' :
                                       serviceCardsConfig?.card_shadow === 'lg' ? '0 10px 15px rgba(0,0,0,0.1)' :
                                       '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                        >
                          {card.image_url ? (
                            <>
                              <img 
                                src={card.image_url} 
                                alt={card.title} 
                                className="absolute inset-0 w-full h-full"
                                style={{
                                  objectFit: (serviceCardsConfig?.image_fit as any) || 'cover',
                                  objectPosition: `${serviceCardsConfig?.image_position_x || 50}% ${serviceCardsConfig?.image_position_y || 50}%`,
                                  borderRadius: `${serviceCardsConfig?.image_border_radius || 8}px`
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                              <CardContent 
                                className="p-4 h-full flex flex-col justify-end relative z-10"
                                style={{ minHeight: `${cardHeight}px` }}
                              >
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
                            <CardContent 
                              className="p-4 h-full flex flex-col justify-between"
                              style={{ minHeight: `${cardHeight - 20}px` }}
                            >
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
                  }) : (
                    // Fallback skeleton while loading
                    <>
                      {[1, 2, 3].map(i => (
                        <Card key={i} className="h-full bg-muted/50 border-0 animate-pulse">
                          <CardContent className="p-4 h-full min-h-[140px]" />
                        </Card>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Access Services Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-foreground">
                Quick Access
              </h2>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
              {quickServices.map(service => <Link key={service.id} to={service.link} className="block group">
                  <Card className="h-full hover:shadow-md transition-all duration-300 overflow-hidden">
                    <CardContent className="p-3 md:p-4 flex flex-col items-center text-center">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl ${service.bgColor} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-sm`}>
                        <service.icon className={`w-6 h-6 md:w-7 md:h-7 ${service.iconColor}`} />
                      </div>
                      <h3 className="font-medium text-xs md:text-sm group-hover:text-primary transition-colors">
                        {service.title}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>)}
            </div>
          </div>

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