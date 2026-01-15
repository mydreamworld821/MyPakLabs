import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, TestTube, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Test {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  sample_type: string | null;
}

const MedicalTestsInCity = () => {
  const { city } = useParams<{ city: string }>();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [validCity, setValidCity] = useState(true);

  const formattedCity = city ? city.charAt(0).toUpperCase() + city.slice(1).toLowerCase() : "";

  useEffect(() => {
    const fetchTests = async () => {
      if (!city) return;
      
      // First verify city exists
      const { data: cityData } = await supabase
        .from("cities")
        .select("name")
        .ilike("name", formattedCity)
        .single();
      
      if (!cityData) {
        setValidCity(false);
        setLoading(false);
        return;
      }

      // Fetch popular tests
      const { data, error } = await supabase
        .from("tests")
        .select("*")
        .eq("is_active", true)
        .order("name")
        .limit(24);

      if (error) {
        console.error("Error fetching tests:", error);
      } else {
        setTests(data || []);
      }
      setLoading(false);
    };

    fetchTests();
  }, [city, formattedCity]);

  if (!validCity) {
    return <Navigate to="/labs" replace />;
  }

  const categories = [...new Set(tests.map(t => t.category).filter(Boolean))];

  return (
    <>
      <Helmet>
        <title>Medical Tests in {formattedCity} - Book Lab Tests with Discounts | MyPakLabs</title>
        <meta name="description" content={`Book medical tests in ${formattedCity} with up to 35% discount. Blood tests, CBC, LFT, RFT, thyroid tests, diabetes tests, and more. Home sample collection available.`} />
        <meta name="keywords" content={`medical tests ${formattedCity}, lab tests ${formattedCity}, blood test ${formattedCity}, CBC test ${formattedCity}, thyroid test ${formattedCity}, diabetes test ${formattedCity}`} />
        <link rel="canonical" href={`https://mypaklab.lovable.app/medical-tests-in-${city?.toLowerCase()}`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <TestTube className="h-8 w-8 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {formattedCity}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Medical Tests in {formattedCity}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-6">
              Book lab tests in {formattedCity} with up to 35% discount. Home sample collection available. Compare prices from multiple labs and save on your medical tests.
            </p>
            <Button asChild size="lg">
              <Link to={`/labs?city=${formattedCity}`}>
                <Search className="mr-2 h-4 w-4" /> Find Labs in {formattedCity}
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-6">Popular Tests Available in {formattedCity}</h2>
            
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : tests.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tests.map((test) => (
                  <Card key={test.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-medium text-sm mb-1 line-clamp-2">{test.name}</h3>
                      {test.category && (
                        <span className="text-xs text-muted-foreground">{test.category}</span>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No tests information available yet.</p>
              </div>
            )}

            <div className="text-center mt-8">
              <Button asChild variant="outline" size="lg">
                <Link to={`/labs?city=${formattedCity}`}>
                  Book Tests in {formattedCity} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {categories.length > 0 && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-semibold mb-6">Test Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.slice(0, 8).map((category) => (
                  <Card key={category} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <h3 className="font-medium">{category}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-4">Lab Tests in {formattedCity}</h2>
            <p className="text-muted-foreground mb-6">
              MyPakLabs offers discounted lab tests in {formattedCity}. Get CBC, LFT, RFT, Lipid Profile, 
              Thyroid Profile, HbA1c, Vitamin D, Vitamin B12, Complete Urine Examination, and many more tests 
              at affordable prices. Our partner labs are ISO certified and offer home sample collection across {formattedCity}.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to={`/doctors-in-${city?.toLowerCase()}`} className="p-4 bg-muted/50 rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-medium">Doctors in {formattedCity}</h3>
              </Link>
              <Link to={`/labs-in-${city?.toLowerCase()}`} className="p-4 bg-muted/50 rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-medium">Labs in {formattedCity}</h3>
              </Link>
              <Link to={`/hospitals-in-${city?.toLowerCase()}`} className="p-4 bg-muted/50 rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-medium">Hospitals in {formattedCity}</h3>
              </Link>
              <Link to={`/pharmacies-in-${city?.toLowerCase()}`} className="p-4 bg-muted/50 rounded-lg hover:shadow-md transition-shadow">
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

export default MedicalTestsInCity;
