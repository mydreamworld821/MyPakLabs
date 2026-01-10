import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Search,
  MapPin,
  Phone,
  Star,
  Clock,
  Loader2,
} from "lucide-react";

interface Hospital {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  specialties: string[] | null;
  contact_phone: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  description: string | null;
  rating: number | null;
  review_count: number | null;
  opening_time: string | null;
  closing_time: string | null;
}

const Hospitals = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    filterHospitals();
  }, [hospitals, searchQuery, selectedCity]);

  const fetchHospitals = async () => {
    try {
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("featured_order", { ascending: true })
        .order("rating", { ascending: false });

      if (error) throw error;

      if (data) {
        setHospitals(data);
        // Extract unique cities
        const uniqueCities = [...new Set(data.map((h) => h.city).filter(Boolean))] as string[];
        setCities(uniqueCities.sort());
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterHospitals = () => {
    let filtered = [...hospitals];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (h) =>
          h.name.toLowerCase().includes(query) ||
          h.city?.toLowerCase().includes(query) ||
          h.specialties?.some((s) => s.toLowerCase().includes(query))
      );
    }

    if (selectedCity && selectedCity !== "all") {
      filtered = filtered.filter((h) => h.city === selectedCity);
    }

    setFilteredHospitals(filtered);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Find Hospitals
            </h1>
            <p className="text-muted-foreground">
              Browse top hospitals in Pakistan with their specialties and contact information
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, city, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredHospitals.length} hospital{filteredHospitals.length !== 1 ? "s" : ""}
          </p>

          {/* Hospital Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredHospitals.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No hospitals found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHospitals.map((hospital) => (
                <Link key={hospital.id} to={`/hospital/${hospital.slug}`}>
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
                      {/* Logo overlay */}
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
                      {hospital.city && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="line-clamp-1">{hospital.address || hospital.city}</span>
                        </div>
                      )}

                      {/* Rating & Hours */}
                      <div className="flex items-center gap-3 text-sm mb-3">
                        {hospital.rating && hospital.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{hospital.rating}</span>
                            {hospital.review_count && (
                              <span className="text-muted-foreground">
                                ({hospital.review_count})
                              </span>
                            )}
                          </div>
                        )}
                        {hospital.opening_time && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{hospital.opening_time} - {hospital.closing_time}</span>
                          </div>
                        )}
                      </div>

                      {/* Specialties */}
                      {hospital.specialties && hospital.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {hospital.specialties.slice(0, 3).map((specialty) => (
                            <Badge
                              key={specialty}
                              variant="secondary"
                              className="text-xs px-2 py-0"
                            >
                              {specialty}
                            </Badge>
                          ))}
                          {hospital.specialties.length > 3 && (
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              +{hospital.specialties.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Contact */}
                      {hospital.contact_phone && (
                        <div className="flex items-center gap-1.5 text-sm text-primary mt-3 pt-3 border-t">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{hospital.contact_phone}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Hospitals;