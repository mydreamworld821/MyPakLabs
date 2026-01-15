import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePageLayoutSettings } from "@/hooks/usePageLayoutSettings";
import HospitalListCard from "@/components/directory/HospitalListCard";
import {
  Building2,
  Search,
  MapPin,
  Phone,
  Star,
  Clock,
  Loader2,
  ArrowLeft,
  Users,
  ChevronRight,
} from "lucide-react";

interface Hospital {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  specialties: string[] | null;
  departments: string[] | null;
  contact_phone: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  description: string | null;
  rating: number | null;
  review_count: number | null;
  opening_time: string | null;
  closing_time: string | null;
  emergency_available: boolean | null;
}

interface CityData {
  name: string;
  hospitalCount: number;
  doctorCount: number;
}

const Hospitals = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCity = searchParams.get("city");
  
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [cityHospitals, setCityHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [citiesWithCounts, setCitiesWithCounts] = useState<CityData[]>([]);

  // Get admin-managed layout settings
  const { settings: layoutSettings, getGridClasses } = usePageLayoutSettings("hospitals_listing");

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (selectedCity) {
      filterHospitalsByCity(selectedCity);
    }
  }, [selectedCity, hospitals]);

  const fetchHospitals = async () => {
    try {
      // Fetch hospitals
      const { data: hospitalsData, error: hospitalsError } = await supabase
        .from("hospitals")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false });

      if (hospitalsError) throw hospitalsError;

      // Fetch doctors count per city
      const { data: doctorsData, error: doctorsError } = await supabase
        .from("doctors")
        .select("city")
        .eq("status", "approved");

      if (doctorsError) throw doctorsError;

      if (hospitalsData) {
        setHospitals(hospitalsData);
        
        // Calculate hospital counts per city
        const hospitalCounts: Record<string, number> = {};
        hospitalsData.forEach((h) => {
          if (h.city) {
            hospitalCounts[h.city] = (hospitalCounts[h.city] || 0) + 1;
          }
        });

        // Calculate doctor counts per city
        const doctorCounts: Record<string, number> = {};
        (doctorsData || []).forEach((d) => {
          if (d.city) {
            doctorCounts[d.city] = (doctorCounts[d.city] || 0) + 1;
          }
        });

        // Build city data from actual database records
        const allCities = new Set<string>();
        hospitalsData.forEach((h) => h.city && allCities.add(h.city));
        
        const citiesArray: CityData[] = Array.from(allCities)
          .map((cityName) => ({
            name: cityName,
            hospitalCount: hospitalCounts[cityName] || 0,
            doctorCount: doctorCounts[cityName] || 0,
          }))
          .sort((a, b) => b.hospitalCount - a.hospitalCount);

        setCitiesWithCounts(citiesArray);
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterHospitalsByCity = (city: string) => {
    const filtered = hospitals.filter((h) => h.city === city);
    setCityHospitals(filtered);
  };

  const handleCityClick = (cityName: string) => {
    setSearchParams({ city: cityName });
  };

  const handleBackToCity = () => {
    setSearchParams({});
  };

  const filteredCityHospitals = cityHospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.specialties?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Show city list view
  if (!selectedCity) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-8">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Hospitals in Top Cities of Pakistan
              </h1>
              <p className="text-primary font-semibold text-lg">
                10 Million+ people Have Used MyPakLabs!
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : citiesWithCounts.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No hospitals found</h3>
                <p className="text-muted-foreground">Hospitals will appear here once added by admin</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {citiesWithCounts.map((city) => (
                  <Card
                    key={city.name}
                    className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300 group"
                    onClick={() => handleCityClick(city.name)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                        <MapPin className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {city.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-1">
                        {city.hospitalCount} Hospital{city.hospitalCount !== 1 ? "s" : ""}
                      </p>
                      {city.doctorCount > 0 && (
                        <div className="flex items-center justify-center gap-1 text-xs text-primary">
                          <Users className="w-3 h-3" />
                          <span>{city.doctorCount} Doctor{city.doctorCount !== 1 ? "s" : ""}</span>
                        </div>
                      )}
                      <ChevronRight className="w-4 h-4 mx-auto mt-2 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* All Hospitals Section */}
            <div className="mt-12">
              <h2 className="text-xl font-bold text-foreground mb-4">All Hospitals</h2>
              <div className="relative max-w-md mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search all hospitals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div 
                className={getGridClasses()}
                style={{ gap: `${layoutSettings.items_gap}px` }}
              >
                {hospitals
                  .filter(
                    (h) =>
                      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      h.city?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .slice(0, 12)
                  .map((hospital) => (
                    <HospitalListCard key={hospital.id} hospital={hospital} settings={layoutSettings} />
                  ))}
              </div>
              {hospitals.length > 12 && !searchQuery && (
                <p className="text-center text-muted-foreground mt-4">
                  Select a city above to view all hospitals in that area
                </p>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show hospitals in selected city
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4">
          {/* Back Button & Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              className="mb-4 -ml-2"
              onClick={handleBackToCity}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cities
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Hospitals in {selectedCity}
            </h1>
            <p className="text-muted-foreground">
              {cityHospitals.length} hospital{cityHospitals.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Hospital Grid */}
          {filteredCityHospitals.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No hospitals found</h3>
              <p className="text-muted-foreground">Try adjusting your search</p>
            </div>
          ) : (
            <div 
              className={getGridClasses()}
              style={{ gap: `${layoutSettings.items_gap}px` }}
            >
              {filteredCityHospitals.map((hospital) => (
                <HospitalListCard key={hospital.id} hospital={hospital} settings={layoutSettings} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

// Hospital Card Component
const HospitalCard = ({ hospital }: { hospital: Hospital }) => (
  <Link to={`/hospital/${hospital.slug}`}>
    <Card className="h-full hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Cover Image */}
      <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden">
        {hospital.cover_image_url ? (
          <img
            src={hospital.cover_image_url}
            alt={hospital.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-16 h-16 text-primary/30" />
          </div>
        )}
        {hospital.emergency_available && (
          <Badge className="absolute top-3 right-3 bg-red-500 text-white">
            24/7 Emergency
          </Badge>
        )}
        {hospital.logo_url && (
          <div className="absolute bottom-3 left-3 w-14 h-14 rounded-lg bg-white shadow-md overflow-hidden">
            <img
              src={hospital.logo_url}
              alt={hospital.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {hospital.name}
        </h3>

        {/* Location */}
        {hospital.address && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="line-clamp-1">{hospital.address}</span>
          </div>
        )}

        {/* Rating & Hours */}
        <div className="flex items-center gap-3 text-sm mb-3">
          {hospital.rating && hospital.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{hospital.rating}</span>
              {hospital.review_count && (
                <span className="text-muted-foreground">({hospital.review_count})</span>
              )}
            </div>
          )}
          {hospital.opening_time && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">{hospital.opening_time}</span>
            </div>
          )}
        </div>

        {/* Departments Preview */}
        {hospital.departments && hospital.departments.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {hospital.departments.slice(0, 4).map((dept) => (
              <Badge key={dept} variant="outline" className="text-xs px-2 py-0">
                {dept}
              </Badge>
            ))}
            {hospital.departments.length > 4 && (
              <Badge variant="secondary" className="text-xs px-2 py-0">
                +{hospital.departments.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Contact */}
        {hospital.contact_phone && (
          <div className="flex items-center gap-1.5 text-sm text-primary pt-2 border-t">
            <Phone className="w-3.5 h-3.5" />
            <span>{hospital.contact_phone}</span>
          </div>
        )}
      </CardContent>
    </Card>
  </Link>
);

export default Hospitals;