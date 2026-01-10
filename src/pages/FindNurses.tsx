import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  Heart, 
  MapPin, 
  Star, 
  Clock, 
  Phone,
  Loader2,
  Filter,
  X,
  AlertCircle,
  Syringe,
  Stethoscope
} from "lucide-react";
import useCities from "@/hooks/useCities";

interface Nurse {
  id: string;
  full_name: string;
  photo_url: string | null;
  qualification: string;
  experience_years: number;
  city: string;
  area_of_service: string | null;
  services_offered: string[];
  available_shifts: string[];
  emergency_available: boolean;
  per_visit_fee: number;
  per_hour_fee: number | null;
  rating: number;
  review_count: number;
  gender: string;
}

const SERVICES = [
  "Injection (IM / IV)",
  "IV Cannula Insertion",
  "Wound Dressing",
  "Catheterization",
  "Oxygen Therapy",
  "Blood Pressure Monitoring",
  "Post-operative Care",
  "Elderly Care",
  "Bedridden Patient Care",
];

const QUALIFICATIONS = [
  { value: "all", label: "All Qualifications" },
  { value: "RN", label: "RN (Registered Nurse)" },
  { value: "BSc", label: "BSc Nursing" },
  { value: "LPN", label: "LPN" },
];

const FindNurses = () => {
  const { cities } = useCities();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedService, setSelectedService] = useState("all");
  const [selectedQualification, setSelectedQualification] = useState("all");
  const [selectedExperience, setSelectedExperience] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  useEffect(() => {
    fetchNurses();
  }, [selectedCity, selectedService, selectedQualification, selectedExperience, selectedGender, emergencyOnly]);

  const fetchNurses = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("nurses")
        .select("*")
        .eq("status", "approved")
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false });

      if (selectedCity !== "all") {
        query = query.eq("city", selectedCity);
      }

      if (selectedGender !== "all") {
        query = query.eq("gender", selectedGender);
      }

      if (emergencyOnly) {
        query = query.eq("emergency_available", true);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredNurses = data || [];

      // Filter by service
      if (selectedService !== "all") {
        filteredNurses = filteredNurses.filter(n => 
          n.services_offered?.includes(selectedService)
        );
      }

      // Filter by qualification
      if (selectedQualification !== "all") {
        filteredNurses = filteredNurses.filter(n => 
          n.qualification?.includes(selectedQualification)
        );
      }

      // Filter by experience
      if (selectedExperience !== "all") {
        if (selectedExperience === "1-3") {
          filteredNurses = filteredNurses.filter(n => n.experience_years >= 1 && n.experience_years <= 3);
        } else if (selectedExperience === "3-5") {
          filteredNurses = filteredNurses.filter(n => n.experience_years >= 3 && n.experience_years <= 5);
        } else if (selectedExperience === "5+") {
          filteredNurses = filteredNurses.filter(n => n.experience_years >= 5);
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredNurses = filteredNurses.filter(n =>
          n.full_name?.toLowerCase().includes(query) ||
          n.city?.toLowerCase().includes(query) ||
          n.services_offered?.some(s => s.toLowerCase().includes(query))
        );
      }

      setNurses(filteredNurses);
    } catch (error) {
      console.error("Error fetching nurses:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCity("all");
    setSelectedService("all");
    setSelectedQualification("all");
    setSelectedExperience("all");
    setSelectedGender("all");
    setEmergencyOnly(false);
  };

  const activeFiltersCount = [
    selectedCity !== "all",
    selectedService !== "all",
    selectedQualification !== "all",
    selectedExperience !== "all",
    selectedGender !== "all",
    emergencyOnly,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-8">
        {/* Header */}
        <div className="bg-rose-600 text-white py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-3">
              <Heart className="w-6 h-6" />
              <h1 className="text-lg font-bold">Find Home Nurses</h1>
            </div>
            <p className="text-xs text-white/80 mb-4">
              Book professional nursing care at your doorstep
            </p>
            
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, service, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white text-foreground text-xs h-9"
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-1"
              >
                <Filter className="w-4 h-4" />
                {activeFiltersCount > 0 && (
                  <Badge variant="destructive" className="h-4 w-4 p-0 text-[10px]">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-card border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Filters</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7">
                  <X className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.name} className="text-xs">
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Services</SelectItem>
                    {SERVICES.map((service) => (
                      <SelectItem key={service} value={service} className="text-xs">
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedQualification} onValueChange={setSelectedQualification}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Qualification" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALIFICATIONS.map((q) => (
                      <SelectItem key={q.value} value={q.value} className="text-xs">
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Any Experience</SelectItem>
                    <SelectItem value="1-3" className="text-xs">1-3 Years</SelectItem>
                    <SelectItem value="3-5" className="text-xs">3-5 Years</SelectItem>
                    <SelectItem value="5+" className="text-xs">5+ Years</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedGender} onValueChange={setSelectedGender}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Any Gender</SelectItem>
                    <SelectItem value="female" className="text-xs">Female</SelectItem>
                    <SelectItem value="male" className="text-xs">Male</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={emergencyOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEmergencyOnly(!emergencyOnly)}
                  className={`text-xs h-8 ${emergencyOnly ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Emergency
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="container mx-auto px-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
            </div>
          ) : nurses.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-semibold mb-1">No nurses found</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Try adjusting your filters or search query
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                {nurses.length} nurse{nurses.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nurses.map((nurse) => (
                  <Link key={nurse.id} to={`/nurse/${nurse.id}`}>
                    <Card className="hover:shadow-md transition-shadow h-full">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {nurse.photo_url ? (
                              <img 
                                src={nurse.photo_url} 
                                alt={nurse.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Heart className="w-6 h-6 text-rose-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold truncate">{nurse.full_name}</h3>
                            <p className="text-xs text-muted-foreground">{nurse.qualification}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-[10px]">
                                {nurse.experience_years} yrs exp
                              </Badge>
                              {nurse.emergency_available && (
                                <Badge variant="destructive" className="text-[10px]">
                                  Emergency
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{nurse.city}{nurse.area_of_service ? `, ${nurse.area_of_service}` : ""}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{nurse.available_shifts?.join(", ") || "Flexible"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{nurse.rating || "New"}</span>
                            <span className="text-muted-foreground">
                              ({nurse.review_count || 0} reviews)
                            </span>
                          </div>
                        </div>

                        {/* Services Preview */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {nurse.services_offered?.slice(0, 3).map((service, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px] px-1.5">
                              {service.split(" ")[0]}
                            </Badge>
                          ))}
                          {nurse.services_offered?.length > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1.5">
                              +{nurse.services_offered.length - 3}
                            </Badge>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Per Visit</p>
                            <p className="text-sm font-bold text-rose-600">
                              PKR {nurse.per_visit_fee?.toLocaleString()}
                            </p>
                          </div>
                          <Button size="sm" className="text-xs bg-rose-600 hover:bg-rose-700">
                            <Phone className="w-3 h-3 mr-1" />
                            Book Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FindNurses;
