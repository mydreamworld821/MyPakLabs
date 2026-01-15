import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DoctorListCard from "@/components/directory/DoctorListCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Stethoscope } from "lucide-react";

interface Doctor {
  id: string;
  full_name: string;
  photo_url: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  rating: number | null;
  review_count: number | null;
  city: string | null;
  specialization: { name: string } | null;
  qualification: string | null;
  clinic_name: string | null;
  availability: string | null;
}

const DoctorsInCity = () => {
  const params = useParams();
  const city = (params.city ?? params["*"]) as string | undefined;
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [validCity, setValidCity] = useState(true);

  const formattedCity = city ? city.charAt(0).toUpperCase() + city.slice(1).toLowerCase() : "";

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!city) return;
      
      const { data, error } = await supabase
        .from("doctors")
        .select(`*, specialization:doctor_specializations(name)`)
        .eq("status", "approved")
        .ilike("city", formattedCity)
        .order("is_featured", { ascending: false })
        .limit(12);

      if (error) {
        console.error("Error fetching doctors:", error);
        setValidCity(false);
      } else {
        setDoctors(data || []);
        if (data?.length === 0) {
          // Check if city exists in our system
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

    fetchDoctors();
  }, [city, formattedCity]);

  if (!validCity) {
    return <Navigate to="/find-doctors" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Best Doctors in {formattedCity} - Book Appointment Online | MyPakLabs</title>
        <meta name="description" content={`Find and book appointments with the best doctors in ${formattedCity}. Consult top specialists, general physicians, and healthcare experts. Online & in-clinic consultations available.`} />
        <meta name="keywords" content={`doctors in ${formattedCity}, best doctors ${formattedCity}, book doctor ${formattedCity}, specialists ${formattedCity}, healthcare ${formattedCity}`} />
        <link rel="canonical" href={`https://mypaklab.lovable.app/doctors-in-${city?.toLowerCase()}`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Stethoscope className="h-8 w-8 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {formattedCity}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Best Doctors in {formattedCity}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-6">
              Book appointments with verified doctors in {formattedCity}. Find specialists across all medical fields with online and in-clinic consultation options.
            </p>
            <Button asChild size="lg">
              <Link to={`/find-doctors?city=${formattedCity}`}>
                View All Doctors <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Doctors Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-6">Featured Doctors in {formattedCity}</h2>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : doctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                  <DoctorListCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No doctors found in {formattedCity} yet.</p>
                <Button asChild variant="outline">
                  <Link to="/find-doctors">Browse All Doctors</Link>
                </Button>
              </div>
            )}

            {doctors.length > 0 && (
              <div className="text-center mt-8">
                <Button asChild variant="outline" size="lg">
                  <Link to={`/find-doctors?city=${formattedCity}`}>
                    See All Doctors in {formattedCity} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* SEO Content */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-4">Find Healthcare in {formattedCity}</h2>
            <p className="text-muted-foreground mb-6">
              MyPakLabs connects you with the best healthcare professionals in {formattedCity}. 
              Our platform features verified doctors across all specializations including General Physicians, 
              Cardiologists, Dermatologists, Gynecologists, Pediatricians, and more. Book your appointment 
              online and get quality healthcare services in {formattedCity}.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to={`/labs-in-${city?.toLowerCase()}`} className="p-4 bg-background rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-medium">Labs in {formattedCity}</h3>
              </Link>
              <Link to={`/hospitals-in-${city?.toLowerCase()}`} className="p-4 bg-background rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-medium">Hospitals in {formattedCity}</h3>
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

export default DoctorsInCity;
