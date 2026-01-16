import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Star, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Doctor {
  id: string;
  full_name: string;
  photo_url: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  rating: number | null;
  city: string | null;
  specialization_id: string | null;
  specialization?: {
    name: string;
  } | null;
}

interface FeaturedDoctorsProps {
  className?: string;
}

const FeaturedDoctors = ({ className }: FeaturedDoctorsProps) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedDoctors = async () => {
      try {
        const { data, error } = await supabase
          .from("doctors")
          .select(`
            id,
            full_name,
            photo_url,
            experience_years,
            consultation_fee,
            rating,
            city,
            specialization_id,
            doctor_specializations (
              name
            )
          `)
          .eq("status", "approved")
          .eq("is_featured", true)
          .order("featured_order", { ascending: true })
          .limit(12);

        if (error) throw error;

        const formattedDoctors = data?.map(doc => ({
          ...doc,
          specialization: doc.doctor_specializations
        })) || [];

        setDoctors(formattedDoctors);

        // Extract unique cities
        const uniqueCities = [...new Set(formattedDoctors
          .map(d => d.city)
          .filter((city): city is string => !!city)
        )];
        setCities(uniqueCities);
      } catch (error) {
        console.error("Error fetching featured doctors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedDoctors();
  }, []);

  const filteredDoctors = selectedCity === "all" 
    ? doctors 
    : doctors.filter(d => d.city === selectedCity);

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 bg-muted animate-pulse rounded" />
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (doctors.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-base md:text-lg font-semibold text-foreground">
            {selectedCity === "all" ? "Book Verified Doctors Online in Islamabad & Rawalpindi" : `Doctors in ${selectedCity}`}
          </h2>
          {cities.length > 0 && (
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Link 
          to={selectedCity === "all" ? "/find-doctors" : `/find-doctors?city=${selectedCity}`} 
          className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {filteredDoctors.slice(0, 6).map((doctor) => (
          <Link
            key={doctor.id}
            to={`/doctor/${doctor.id}`}
            className="block group"
          >
            <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-primary to-primary/80 text-white p-3 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3">
                {/* Profile Picture */}
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0 bg-white/20">
                  {doctor.photo_url ? (
                    <img
                      src={doctor.photo_url}
                      alt={doctor.full_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center ${doctor.photo_url ? 'hidden' : ''}`}>
                    <User className="w-6 h-6 text-white/70" />
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm md:text-base truncate group-hover:underline">
                    {doctor.full_name}
                  </h3>
                  <p className="text-xs text-white/80 truncate">
                    {doctor.specialization?.name || "General Physician"}
                  </p>
                  <p className="text-xs text-white/70">
                    {doctor.experience_years || 0} years experience
                  </p>
                </div>

                {/* Fee */}
                {doctor.consultation_fee && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold">
                      Rs. {doctor.consultation_fee.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Rating */}
              {doctor.rating && doctor.rating > 0 && (
                <div className="absolute bottom-2 left-3 flex items-center gap-1 text-xs">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{doctor.rating.toFixed(1)}/5</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filteredDoctors.length > 6 && (
        <div className="mt-3 text-center">
          <Link
            to={selectedCity === "all" ? "/find-doctors" : `/find-doctors?city=${selectedCity}`}
            className="inline-flex items-center gap-1 text-primary text-sm font-medium hover:underline"
          >
            View All {filteredDoctors.length} Doctors <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default FeaturedDoctors;
