import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PharmacyListCard from "@/components/directory/PharmacyListCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Pill } from "lucide-react";

interface MedicalStore {
  id: string;
  name: string;
  city: string;
  area: string;
  full_address: string;
  phone: string;
  rating: number;
  review_count: number;
  logo_url: string | null;
  is_24_hours: boolean;
  is_featured: boolean;
  delivery_available: boolean;
  opening_time: string;
  closing_time: string;
}

const PharmaciesInCity = () => {
  const { city } = useParams<{ city: string }>();
  const [pharmacies, setPharmacies] = useState<MedicalStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [validCity, setValidCity] = useState(true);

  const formattedCity = city ? city.charAt(0).toUpperCase() + city.slice(1).toLowerCase() : "";

  useEffect(() => {
    const fetchPharmacies = async () => {
      if (!city) return;
      
      const { data, error } = await supabase
        .from("medical_stores")
        .select("*")
        .eq("is_active", true)
        .eq("status", "approved")
        .ilike("city", formattedCity)
        .order("is_featured", { ascending: false })
        .limit(12);

      if (error) {
        console.error("Error fetching pharmacies:", error);
      } else {
        setPharmacies((data || []) as MedicalStore[]);
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

    fetchPharmacies();
  }, [city, formattedCity]);

  if (!validCity) {
    return <Navigate to="/pharmacies" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Pharmacies in {formattedCity} - Medicine Delivery & 24/7 Stores | MyPakLabs</title>
        <meta name="description" content={`Find pharmacies in ${formattedCity}. 24/7 medical stores, medicine delivery, and verified pharmacies near you.`} />
        <link rel="canonical" href={`https://mypaklab.lovable.app/pharmacies-in-${city?.toLowerCase()}`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Pill className="h-8 w-8 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {formattedCity}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Pharmacies in {formattedCity}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-6">
              Find verified pharmacies in {formattedCity} with medicine delivery service.
            </p>
            <Button asChild size="lg">
              <Link to={`/pharmacies?city=${formattedCity}`}>
                Find Pharmacies <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-6">Pharmacies in {formattedCity}</h2>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : pharmacies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pharmacies.map((store) => (
                  <PharmacyListCard key={store.id} store={store} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No pharmacies found in {formattedCity} yet.</p>
                <Button asChild variant="outline">
                  <Link to="/pharmacies">Browse All Pharmacies</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default PharmaciesInCity;
