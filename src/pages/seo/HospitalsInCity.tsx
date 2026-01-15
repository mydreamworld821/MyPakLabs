import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HospitalListCard from "@/components/directory/HospitalListCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Building2 } from "lucide-react";

interface Hospital {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  rating: number | null;
  review_count: number | null;
  opening_time: string | null;
  closing_time: string | null;
  contact_phone: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  departments: string[] | null;
  specialties: string[] | null;
  emergency_available: boolean | null;
  description: string | null;
}

const HospitalsInCity = () => {
  const params = useParams();
  const city = (params.city ?? params["*"]) as string | undefined;
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [validCity, setValidCity] = useState(true);

  const formattedCity = city ? city.charAt(0).toUpperCase() + city.slice(1).toLowerCase() : "";

  useEffect(() => {
    const fetchHospitals = async () => {
      if (!city) return;
      
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .eq("is_active", true)
        .ilike("city", formattedCity)
        .order("is_featured", { ascending: false })
        .limit(12);

      if (error) {
        console.error("Error fetching hospitals:", error);
      } else {
        setHospitals(data || []);
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

    fetchHospitals();
  }, [city, formattedCity]);

  if (!validCity) {
    return <Navigate to="/hospitals" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Best Hospitals in {formattedCity} - Find Top Healthcare Facilities | MyPakLabs</title>
        <meta name="description" content={`Find the best hospitals in ${formattedCity}. View departments, facilities, emergency services, and doctor profiles. Book appointments at top hospitals.`} />
        <meta name="keywords" content={`hospitals in ${formattedCity}, best hospitals ${formattedCity}, healthcare ${formattedCity}, emergency hospital ${formattedCity}, medical facilities ${formattedCity}`} />
        <link rel="canonical" href={`https://mypaklab.lovable.app/hospitals-in-${city?.toLowerCase()}`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {formattedCity}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Hospitals in {formattedCity}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-6">
              Find top hospitals in {formattedCity} with comprehensive healthcare services. View facilities, departments, and book appointments with specialists.
            </p>
            <Button asChild size="lg">
              <Link to={`/hospitals?city=${formattedCity}`}>
                View All Hospitals <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-6">Featured Hospitals in {formattedCity}</h2>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : hospitals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hospitals.map((hospital) => (
                  <HospitalListCard key={hospital.id} hospital={hospital} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No hospitals found in {formattedCity} yet.</p>
                <Button asChild variant="outline">
                  <Link to="/hospitals">Browse All Hospitals</Link>
                </Button>
              </div>
            )}

            {hospitals.length > 0 && (
              <div className="text-center mt-8">
                <Button asChild variant="outline" size="lg">
                  <Link to={`/hospitals?city=${formattedCity}`}>
                    See All Hospitals in {formattedCity} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-4">Healthcare in {formattedCity}</h2>
            <p className="text-muted-foreground mb-6">
              {formattedCity} has excellent healthcare infrastructure with modern hospitals offering 
              comprehensive medical services. Find hospitals with 24/7 emergency services, specialized 
              departments including Cardiology, Orthopedics, Neurology, Oncology, and more.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to={`/doctors-in-${city?.toLowerCase()}`} className="p-4 bg-background rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-medium">Doctors in {formattedCity}</h3>
              </Link>
              <Link to={`/labs-in-${city?.toLowerCase()}`} className="p-4 bg-background rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-medium">Labs in {formattedCity}</h3>
              </Link>
              <Link to={`/home-nursing-${city?.toLowerCase()}`} className="p-4 bg-background rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-medium">Home Nursing in {formattedCity}</h3>
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

export default HospitalsInCity;
