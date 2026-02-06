import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { usePageLayoutSettings } from "@/hooks/usePageLayoutSettings";
import DoctorListCard from "@/components/directory/DoctorListCard";
import useCities from "@/hooks/useCities";
import {
  Search,
  Loader2,
  Stethoscope,
  Filter,
  X,
  UserRound,
} from "lucide-react";

interface Specialization {
  id: string;
  name: string;
  slug: string;
}

interface Hospital {
  id: string;
  name: string;
}

interface Doctor {
  id: string;
  full_name: string;
  photo_url: string | null;
  qualification: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  city: string | null;
  clinic_name: string | null;
  availability: string | null;
  rating: number | null;
  review_count: number | null;
  specialization?: { name: string } | null;
  hospital_name?: string | null;
}

const FEE_RANGES = [
  { value: "all", label: "Any Fee" },
  { value: "0-1000", label: "Under Rs. 1,000" },
  { value: "1000-2000", label: "Rs. 1,000 - 2,000" },
  { value: "2000-3000", label: "Rs. 2,000 - 3,000" },
  { value: "3000-5000", label: "Rs. 3,000 - 5,000" },
  { value: "5000+", label: "Rs. 5,000+" },
];

const EXPERIENCE_RANGES = [
  { value: "all", label: "Any Experience" },
  { value: "1-3", label: "1-3 Years" },
  { value: "3-5", label: "3-5 Years" },
  { value: "5-10", label: "5-10 Years" },
  { value: "10+", label: "10+ Years" },
];

const GENDER_OPTIONS = [
  { value: "all", label: "Any Gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const FindDoctors = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const specialtySlug = searchParams.get("specialty") || searchParams.get("specialization");
  const consultationType = searchParams.get("type");
  const cityFilter = searchParams.get("city");

  const { cities } = useCities();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState(cityFilter || "all");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedHospital, setSelectedHospital] = useState("all");
  const [selectedExperience, setSelectedExperience] = useState("all");
  const [selectedFee, setSelectedFee] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [videoConsultOnly, setVideoConsultOnly] = useState(consultationType === "online");

  const { settings: layoutSettings, getGridClasses } = usePageLayoutSettings("doctors_listing");

  // Initialize specialty from URL
  useEffect(() => {
    if (specialtySlug && specializations.length > 0) {
      const spec = specializations.find((s) => s.slug === specialtySlug);
      if (spec) {
        setSelectedSpecialty(spec.id);
      }
    }
  }, [specialtySlug, specializations]);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      const [specsRes, hospitalsRes] = await Promise.all([
        supabase
          .from("doctor_specializations")
          .select("id, name, slug")
          .eq("is_active", true)
          .order("display_order", { ascending: true }),
        supabase
          .from("hospitals")
          .select("id, name")
          .eq("is_active", true)
          .order("name", { ascending: true }),
      ]);

      if (specsRes.data) setSpecializations(specsRes.data);
      if (hospitalsRes.data) setHospitals(hospitalsRes.data);
    };

    fetchFilterOptions();
  }, []);

  // Fetch doctors when filters change
  useEffect(() => {
    fetchDoctors();
  }, [selectedCity, selectedSpecialty, selectedHospital, selectedExperience, selectedFee, selectedGender, videoConsultOnly]);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("doctors")
        .select("*, specialization:doctor_specializations(name)")
        .eq("status", "approved")
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false });

      // Database-level filters
      if (selectedCity !== "all") {
        query = query.ilike("city", `%${selectedCity}%`);
      }

      if (selectedSpecialty !== "all") {
        query = query.eq("specialization_id", selectedSpecialty);
      }

      if (selectedGender !== "all") {
        query = query.eq("gender", selectedGender);
      }

      if (videoConsultOnly) {
        query = query.eq("video_consultation", true);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredDoctors: Doctor[] = data || [];

      // Client-side filters
      // Hospital filter
      if (selectedHospital !== "all") {
        const hospitalName = hospitals.find((h) => h.id === selectedHospital)?.name;
        if (hospitalName) {
          filteredDoctors = filteredDoctors.filter(
            (d) => d.hospital_name?.toLowerCase().includes(hospitalName.toLowerCase())
          );
        }
      }

      // Experience filter
      if (selectedExperience !== "all") {
        filteredDoctors = filteredDoctors.filter((d) => {
          const exp = d.experience_years || 0;
          switch (selectedExperience) {
            case "1-3": return exp >= 1 && exp <= 3;
            case "3-5": return exp >= 3 && exp <= 5;
            case "5-10": return exp >= 5 && exp <= 10;
            case "10+": return exp >= 10;
            default: return true;
          }
        });
      }

      // Fee filter
      if (selectedFee !== "all") {
        filteredDoctors = filteredDoctors.filter((d) => {
          const fee = d.consultation_fee || 0;
          switch (selectedFee) {
            case "0-1000": return fee <= 1000;
            case "1000-2000": return fee >= 1000 && fee <= 2000;
            case "2000-3000": return fee >= 2000 && fee <= 3000;
            case "3000-5000": return fee >= 3000 && fee <= 5000;
            case "5000+": return fee >= 5000;
            default: return true;
          }
        });
      }

      // Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filteredDoctors = filteredDoctors.filter(
          (d) =>
            d.full_name?.toLowerCase().includes(q) ||
            d.city?.toLowerCase().includes(q) ||
            d.clinic_name?.toLowerCase().includes(q) ||
            d.qualification?.toLowerCase().includes(q) ||
            d.specialization?.name?.toLowerCase().includes(q) ||
            d.hospital_name?.toLowerCase().includes(q)
        );
      }

      setDoctors(filteredDoctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCity("all");
    setSelectedSpecialty("all");
    setSelectedHospital("all");
    setSelectedExperience("all");
    setSelectedFee("all");
    setSelectedGender("all");
    setVideoConsultOnly(false);
    navigate("/find-doctors");
  };

  const activeFiltersCount = [
    selectedCity !== "all",
    selectedSpecialty !== "all",
    selectedHospital !== "all",
    selectedExperience !== "all",
    selectedFee !== "all",
    selectedGender !== "all",
    videoConsultOnly,
  ].filter(Boolean).length;

  const headerBg = consultationType === "online"
    ? "gradient-hero"
    : consultationType === "physical"
      ? "bg-gradient-to-r from-amber-500 to-orange-500"
      : "bg-primary";

  const headerTitle = consultationType === "online"
    ? "Video Consultation Doctors"
    : consultationType === "physical"
      ? "In-Clinic Visit Doctors"
      : "Find The Best Doctors Near You";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-8">
        {/* Header */}
        <div className={`${headerBg} text-white py-6`}>
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-3">
              <Stethoscope className="w-6 h-6" />
              <h1 className="text-lg font-bold">{headerTitle}</h1>
            </div>
            <p className="text-xs text-white/80 mb-4">
              Search and filter doctors by city, speciality, hospital, experience & fees
            </p>

            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, speciality, city, hospital..."
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* City Filter */}
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

                {/* Speciality Filter */}
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Speciality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Specialities</SelectItem>
                    {specializations.map((spec) => (
                      <SelectItem key={spec.id} value={spec.id} className="text-xs">
                        {spec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Hospital Filter */}
                <Select value={selectedHospital} onValueChange={setSelectedHospital}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Hospitals</SelectItem>
                    {hospitals.map((hospital) => (
                      <SelectItem key={hospital.id} value={hospital.id} className="text-xs">
                        {hospital.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Experience Filter */}
                <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_RANGES.map((exp) => (
                      <SelectItem key={exp.value} value={exp.value} className="text-xs">
                        {exp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Fee Range Filter */}
                <Select value={selectedFee} onValueChange={setSelectedFee}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Fee Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {FEE_RANGES.map((fee) => (
                      <SelectItem key={fee.value} value={fee.value} className="text-xs">
                        {fee.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Gender Filter */}
                <Select value={selectedGender} onValueChange={setSelectedGender}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((g) => (
                      <SelectItem key={g.value} value={g.value} className="text-xs">
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Video Consultation Toggle */}
                <Button
                  variant={videoConsultOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVideoConsultOnly(!videoConsultOnly)}
                  className={`text-xs h-8 ${videoConsultOnly ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                >
                  🎥 Video Consult
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="container mx-auto px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12">
              <UserRound className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-semibold mb-1">No doctors found</h3>
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
                {doctors.length} doctor{doctors.length !== 1 ? "s" : ""} found
                {selectedCity !== "all" && ` in ${selectedCity}`}
                {selectedSpecialty !== "all" && ` • ${specializations.find(s => s.id === selectedSpecialty)?.name}`}
              </p>
              <div
                className={getGridClasses()}
                style={{ gap: `${layoutSettings.items_gap}px` }}
              >
                {doctors.map((doctor) => (
                  <DoctorListCard
                    key={doctor.id}
                    doctor={doctor}
                    settings={layoutSettings}
                    consultationType={consultationType}
                  />
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

export default FindDoctors;
