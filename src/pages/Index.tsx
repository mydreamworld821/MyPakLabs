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
import DynamicServicesGrid from "@/components/home/DynamicServicesGrid";
import SeoFooterSection from "@/components/home/SeoFooterSection";
import TrustSection from "@/components/home/TrustSection";
import FAQSection from "@/components/home/FAQSection";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import { PatientTestimonials } from "@/components/home/PatientTestimonials";
import OurPartners from "@/components/home/OurPartners";

import { useSectionConfig } from "@/hooks/useHomepageSections";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import myPakLabsLogo from "@/assets/mypaklabs-logo.jpeg";
import { Star, ChevronRight, TrendingDown, Award, AlertTriangle, FlaskConical, Shield, Clock } from "lucide-react";
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
  card_size: string | null;
  col_span: number | null;
  row_span: number | null;
}

interface QuickAccessService {
  id: string;
  title: string;
  icon_name: string;
  icon_color: string | null;
  icon_size: number | null;
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
  const [quickAccessServices, setQuickAccessServices] = useState<QuickAccessService[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get service cards section config from admin
  const { config: serviceCardsConfig } = useSectionConfig('service_cards');
  const { config: quickAccessConfig } = useSectionConfig('quick_access');
  
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

        // Fetch quick access services
        const {
          data: quickAccessData
        } = await supabase.from("quick_access_services").select("*").eq("is_active", true).order("display_order", {
          ascending: true
        });
        if (quickAccessData) setQuickAccessServices(quickAccessData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return <div className="min-h-screen bg-background">
      {/* Breadcrumb Schema for SEO */}
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://mypaklabs.com/" }
      ]} />

      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      <main className="py-6 md:py-8 relative z-0" style={{ minHeight: '800px' }}>
        <div className="container mx-auto px-4 relative" style={{ minHeight: '750px' }}>
          {/* Services Section - Dynamic Grid from Admin with Quick Access */}
          {serviceCardsConfig?.is_visible !== false && (
            <DynamicServicesGrid
              cards={serviceCards}
              loading={loading}
              title={serviceCardsConfig?.title || "Our Services"}
              subtitle={serviceCardsConfig?.subtitle || "Access quality healthcare services"}
              quickAccessServices={quickAccessConfig?.is_visible !== false ? quickAccessServices : undefined}
              showQuickAccess={quickAccessConfig?.is_visible !== false}
              quickAccessLayout={{
                icon_container_size: quickAccessConfig?.icon_container_size,
                icon_size: quickAccessConfig?.icon_size,
                items_gap: quickAccessConfig?.items_gap,
                show_labels: quickAccessConfig?.show_labels,
                justify_content: quickAccessConfig?.justify_content,
                layout_mode: quickAccessConfig?.layout_mode,
              }}
            />
          )}

          {/* Consult Best Doctors Online - Specializations Section */}
          <ConsultSpecialists className="mb-8" maxItems={14} />

          {/* Search by Condition Section */}
          <SearchByCondition className="mb-8" maxItems={7} />

          {/* Featured Labs Section */}
          <div className="mb-8" style={{ minHeight: '176px' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-foreground">
                Featured Labs
              </h2>
              <Link to="/labs" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3" style={{ minHeight: '140px' }}>
                {[...Array(6)].map((_, i) => <div key={i} className="bg-muted rounded-lg h-28 animate-pulse" />)}
              </div> : <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3" style={{ minHeight: '140px' }}>
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

          {/* Custom Sections from Admin */}
          <CustomSections />
        </div>
      </main>

      {/* Patient Testimonials Section */}
      <PatientTestimonials />

      {/* Our Partners Section */}
      <OurPartners />

      {/* Trust Section */}
      <TrustSection />

      {/* FAQ Section with Schema */}
      <FAQSection />

      {/* SEO Footer Section - Above Footer */}
      <SeoFooterSection />

      <Footer />
    </div>;
};
export default Index;