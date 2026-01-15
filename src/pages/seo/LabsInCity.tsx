import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LabListCard from "@/components/labs/LabListCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, FlaskConical } from "lucide-react";

interface Lab {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cities: string[] | null;
  rating: number | null;
  review_count: number | null;
  discount_percentage: number | null;
  branches: unknown;
  popular_tests: string[] | null;
}

const LabsInCity = () => {
  const { city } = useParams<{ city: string }>();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [validCity, setValidCity] = useState(true);

  const formattedCity = city ? city.charAt(0).toUpperCase() + city.slice(1).toLowerCase() : "";

  useEffect(() => {
    const fetchLabs = async () => {
      if (!city) return;
      
      const { data, error } = await supabase
        .from("labs")
        .select("*")
        .eq("is_active", true)
        .contains("cities", [formattedCity])
        .order("is_featured", { ascending: false })
        .limit(12);

      if (error) {
        console.error("Error fetching labs:", error);
      } else {
        setLabs(data || []);
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

    fetchLabs();
  }, [city, formattedCity]);

  if (!validCity) {
    return <Navigate to="/labs" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Best Diagnostic Labs in {formattedCity} - Up to 35% Off | MyPakLabs</title>
        <meta name="description" content={`Find top diagnostic labs in ${formattedCity} with discounts up to 35%. Book blood tests, X-rays, MRI, CT scans and more. Home sample collection available.`} />
        <meta name="keywords" content={`labs in ${formattedCity}, diagnostic labs ${formattedCity}, blood test ${formattedCity}, lab tests ${formattedCity}, medical tests ${formattedCity}`} />
        <link rel="canonical" href={`https://mypaklab.lovable.app/labs-in-${city?.toLowerCase()}`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <FlaskConical className="h-8 w-8 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {formattedCity}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Diagnostic Labs in {formattedCity}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-6">
              Get up to 35% discount on lab tests in {formattedCity}. Compare prices from ISO certified labs and book with home sample collection.
            </p>
            <Button asChild size="lg">
              <Link to={`/labs?city=${formattedCity}`}>
                View All Labs <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-6">Featured Labs in {formattedCity}</h2>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : labs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {labs.map((lab) => (
                  <LabListCard key={lab.id} lab={lab} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No labs found in {formattedCity} yet.</p>
                <Button asChild variant="outline">
                  <Link to="/labs">Browse All Labs</Link>
                </Button>
              </div>
            )}

            {labs.length > 0 && (
              <div className="text-center mt-8">
                <Button asChild variant="outline" size="lg">
                  <Link to={`/labs?city=${formattedCity}`}>
                    See All Labs in {formattedCity} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-4">Lab Tests in {formattedCity}</h2>
            <p className="text-muted-foreground mb-6">
              MyPakLabs partners with top diagnostic laboratories in {formattedCity} to bring you 
              discounted lab tests. Get blood tests, urine tests, X-rays, ultrasounds, MRI, CT scans, 
              and specialized tests at affordable prices. Home sample collection available across {formattedCity}.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to={`/doctors-in-${city?.toLowerCase()}`} className="p-4 bg-background rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-medium">Doctors in {formattedCity}</h3>
              </Link>
              <Link to={`/hospitals-in-${city?.toLowerCase()}`} className="p-4 bg-background rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-medium">Hospitals in {formattedCity}</h3>
              </Link>
              <Link to={`/medical-tests-in-${city?.toLowerCase()}`} className="p-4 bg-background rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-medium">Medical Tests in {formattedCity}</h3>
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

export default LabsInCity;
