import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Star, Heart, MapPin, Clock, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Nurse {
  id: string;
  full_name: string;
  photo_url: string | null;
  experience_years: number | null;
  per_visit_fee: number | null;
  rating: number | null;
  city: string | null;
  qualification: string | null;
  services_offered: string[] | null;
  available_shifts: string[] | null;
  emergency_available: boolean | null;
}

interface FeaturedNursesProps {
  className?: string;
}

const FeaturedNurses = ({ className }: FeaturedNursesProps) => {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedNurses = async () => {
      try {
        // First try to get featured nurses
        let { data, error } = await supabase
          .from("nurses")
          .select(`
            id,
            full_name,
            photo_url,
            experience_years,
            per_visit_fee,
            rating,
            city,
            qualification,
            services_offered,
            available_shifts,
            emergency_available
          `)
          .eq("status", "approved")
          .eq("is_featured", true)
          .order("featured_order", { ascending: true })
          .limit(12);

        // If no featured nurses, fallback to top rated approved nurses
        if (!data || data.length === 0) {
          const fallback = await supabase
            .from("nurses")
            .select(`
              id,
              full_name,
              photo_url,
              experience_years,
              per_visit_fee,
              rating,
              city,
              qualification,
              services_offered,
              available_shifts,
              emergency_available
            `)
            .eq("status", "approved")
            .order("rating", { ascending: false })
            .limit(12);
          
          data = fallback.data;
          error = fallback.error;
        }

        if (error) throw error;

        setNurses(data || []);

        // Extract unique cities
        const uniqueCities = [...new Set((data || [])
          .map(n => n.city)
          .filter((city): city is string => !!city)
        )];
        setCities(uniqueCities);
      } catch (error) {
        console.error("Error fetching featured nurses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedNurses();
  }, []);

  const filteredNurses = selectedCity === "all" 
    ? nurses 
    : nurses.filter(n => n.city === selectedCity);

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

  if (nurses.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-base md:text-lg font-semibold text-foreground">
            {selectedCity === "all" ? "Home Nursing Services" : `Nurses in ${selectedCity}`}
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
          to={selectedCity === "all" ? "/find-nurses" : `/find-nurses?city=${selectedCity}`} 
          className="text-rose-600 text-sm font-medium flex items-center gap-1 hover:underline"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {filteredNurses.slice(0, 6).map((nurse) => (
          <Link
            key={nurse.id}
            to={`/nurse/${nurse.id}`}
            className="block group"
          >
            <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-rose-600 to-rose-500 text-white p-3 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3">
                {/* Profile Picture */}
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0 bg-white/20">
                  {nurse.photo_url ? (
                    <img
                      src={nurse.photo_url}
                      alt={nurse.full_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center ${nurse.photo_url ? 'hidden' : ''}`}>
                    <Heart className="w-6 h-6 text-white/70" />
                  </div>
                </div>

                {/* Nurse Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm md:text-base truncate group-hover:underline">
                    {nurse.full_name}
                  </h3>
                  <p className="text-xs text-white/80 truncate">
                    {nurse.qualification || "Registered Nurse"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-white/70">
                      {nurse.experience_years || 0} yrs exp
                    </span>
                    {nurse.emergency_available && (
                      <Badge className="bg-orange-500 text-white text-[9px] px-1 py-0">
                        <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                        Emergency
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Fee */}
                {nurse.per_visit_fee && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-white/70">Per Visit</p>
                    <p className="text-sm font-bold">
                      Rs. {nurse.per_visit_fee.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Services Preview */}
              {nurse.services_offered && nurse.services_offered.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {nurse.services_offered.slice(0, 2).map((service, idx) => (
                    <span 
                      key={idx} 
                      className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded"
                    >
                      {service.split(" ")[0]}
                    </span>
                  ))}
                  {nurse.services_offered.length > 2 && (
                    <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded">
                      +{nurse.services_offered.length - 2} more
                    </span>
                  )}
                </div>
              )}

              {/* Rating */}
              {nurse.rating && nurse.rating > 0 && (
                <div className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-white/20 px-1.5 py-0.5 rounded">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{nurse.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filteredNurses.length > 6 && (
        <div className="mt-3 text-center">
          <Link
            to={selectedCity === "all" ? "/find-nurses" : `/find-nurses?city=${selectedCity}`}
            className="inline-flex items-center gap-1 text-rose-600 text-sm font-medium hover:underline"
          >
            View All {filteredNurses.length} Nurses <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default FeaturedNurses;
