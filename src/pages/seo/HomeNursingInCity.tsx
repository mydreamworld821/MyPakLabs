import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NurseListCard from "@/components/directory/NurseListCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Heart } from "lucide-react";

interface Nurse {
  id: string;
  full_name: string;
  photo_url: string | null;
  qualification: string;
  experience_years: number | null;
  city: string | null;
  area_of_service: string | null;
  rating: number | null;
  review_count: number | null;
  services_offered: string[];
  per_visit_fee: number | null;
  per_hour_fee: number | null;
  emergency_available: boolean | null;
  available_shifts: string[] | null;
  gender: string | null;
}

const HomeNursingInCity = () => {
  const { city } = useParams<{ city: string }>();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [validCity, setValidCity] = useState(true);

  const formattedCity = city ? city.charAt(0).toUpperCase() + city.slice(1).toLowerCase() : "";

  useEffect(() => {
    const fetchNurses = async () => {
      if (!city) return;
      
      const { data, error } = await supabase
        .from("nurses")
        .select("*")
        .eq("status", "approved")
        .ilike("city", formattedCity)
        .order("is_featured", { ascending: false })
        .limit(12);

      if (error) {
        console.error("Error fetching nurses:", error);
      } else {
        setNurses(data || []);
        if (data?.length === 0) {
          const { data: cityData } = await supabase
            .from("cities")
            .select("name")
            .ilike("name", formattedCity)
            .single();
          
          if (!cityData) setValidCity(false);
        }
      }
      setLoading(false);
    };

    fetchNurses();
  }, [city, formattedCity]);

  if (!validCity) {
    return <Navigate to="/find-nurses" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Home Nursing Services in {formattedCity} - Professional Nurses | MyPakLabs</title>
        <meta name="description" content={`Book professional home nursing services in ${formattedCity}. Qualified nurses for elderly care, post-surgery care, injections, wound dressing, and 24/7 patient care.`} />
        <meta name="keywords" content={`home nursing ${formattedCity}, nurses in ${formattedCity}, home healthcare ${formattedCity}, patient care ${formattedCity}, nursing services ${formattedCity}`} />
        <link rel="canonical" href={`https://mypaklab.lovable.app/home-nursing-${city?.toLowerCase()}`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {formattedCity}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Home Nursing in {formattedCity}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-6">
              Get professional home nursing services in {formattedCity}. Qualified nurses available for elderly care, post-surgery care, and medical assistance at home.
            </p>
            <Button asChild size="lg">
              <Link to={`/find-nurses?city=${formattedCity}`}>
                Find Nurses <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-6">Available Nurses in {formattedCity}</h2>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : nurses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nurses.map((nurse) => (
                  <NurseListCard key={nurse.id} nurse={nurse} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No nurses found in {formattedCity} yet.</p>
                <Button asChild variant="outline">
                  <Link to="/find-nurses">Browse All Nurses</Link>
                </Button>
              </div>
            )}

            {nurses.length > 0 && (
              <div className="text-center mt-8">
                <Button asChild variant="outline" size="lg">
                  <Link to={`/find-nurses?city=${formattedCity}`}>
                    See All Nurses in {formattedCity} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-4">Nursing Services in {formattedCity}</h2>
            <p className="text-muted-foreground mb-6">
              MyPakLabs connects you with verified professional nurses in {formattedCity}. Services include 
              elderly care, post-operative care, wound dressing, IV therapy, injections, catheter care, 
              physiotherapy assistance, and 24/7 patient monitoring. All nurses are qualified and background verified.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to={`/doctors-in-${city?.toLowerCase()}`} className="p-4 bg-background rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-medium">Doctors in {formattedCity}</h3>
              </Link>
              <Link to={`/labs-in-${city?.toLowerCase()}`} className="p-4 bg-background rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-medium">Labs in {formattedCity}</h3>
              </Link>
              <Link to={`/hospitals-in-${city?.toLowerCase()}`} className="p-4 bg-background rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-medium">Hospitals in {formattedCity}</h3>
              </Link>
              <Link to={`/pharmacies-in-${city?.toLowerCase()}`} className="p-4 bg-background rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-medium">Pharmacies in {formattedCity}</h3>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default HomeNursingInCity;
