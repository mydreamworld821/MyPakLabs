import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2, Stethoscope, Heart, Brain, Eye, Baby, Bone, Ear, Activity, UserRound, Star, MapPin, Clock, Phone } from "lucide-react";

interface Specialization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  doctor_count: number;
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
}

const iconMap: { [key: string]: React.ComponentType<any> } = {
  Stethoscope,
  Heart,
  Brain,
  Eye,
  Baby,
  Bone,
  Ear,
  Activity,
};

const FindDoctors = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const specialtySlug = searchParams.get("specialty");
  
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"popular" | "all">("popular");
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialization | null>(null);

  useEffect(() => {
    fetchSpecializations();
  }, []);

  useEffect(() => {
    if (specialtySlug && specializations.length > 0) {
      const spec = specializations.find(s => s.slug === specialtySlug);
      if (spec) {
        setSelectedSpecialty(spec);
        fetchDoctorsBySpecialty(spec.id);
      }
    }
  }, [specialtySlug, specializations]);

  const fetchSpecializations = async () => {
    try {
      const { data: specs, error } = await supabase
        .from("doctor_specializations")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;

      // Get doctor counts
      const { data: doctors } = await supabase
        .from("doctors")
        .select("specialization_id")
        .eq("status", "approved");

      const countsMap = new Map<string, number>();
      doctors?.forEach((doc) => {
        if (doc.specialization_id) {
          countsMap.set(doc.specialization_id, (countsMap.get(doc.specialization_id) || 0) + 1);
        }
      });

      const specsWithCounts = specs?.map((spec) => ({
        ...spec,
        doctor_count: countsMap.get(spec.id) || 0,
      })) || [];

      setSpecializations(specsWithCounts);
    } catch (error) {
      console.error("Error fetching specializations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDoctorsBySpecialty = async (specId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*, specialization:doctor_specializations(name)")
        .eq("status", "approved")
        .eq("specialization_id", specId)
        .order("is_featured", { ascending: false });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpecialtyClick = (spec: Specialization) => {
    navigate(`/find-doctors?specialty=${spec.slug}`);
  };

  const handleBackToSpecialties = () => {
    setSelectedSpecialty(null);
    setDoctors([]);
    navigate("/find-doctors");
  };

  const filteredSpecs = specializations.filter((spec) =>
    spec.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedSpecs = viewMode === "popular" 
    ? [...filteredSpecs].sort((a, b) => b.doctor_count - a.doctor_count)
    : [...filteredSpecs].sort((a, b) => a.name.localeCompare(b.name));

  const getIcon = (iconName: string | null) => {
    const Icon = iconMap[iconName || "Stethoscope"] || Stethoscope;
    return Icon;
  };

  if (selectedSpecialty) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 pb-8">
          {/* Header */}
          <div className="bg-primary text-primary-foreground py-6">
            <div className="container mx-auto px-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary-foreground/80 hover:text-primary-foreground mb-2"
                onClick={handleBackToSpecialties}
              >
                ← Back to Specialties
              </Button>
              <h1 className="text-lg md:text-xl font-bold">{selectedSpecialty.name}s</h1>
              <p className="text-xs text-primary-foreground/80">
                {doctors.length} Doctor(s) available
              </p>
            </div>
          </div>

          {/* Doctor List */}
          <div className="container mx-auto px-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-12">
                <UserRound className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No doctors available in this category yet</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {doctors.map((doctor) => (
                  <Card key={doctor.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        {doctor.photo_url ? (
                          <img
                            src={doctor.photo_url}
                            alt={doctor.full_name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                            <UserRound className="w-8 h-8 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-sm font-semibold text-foreground">
                                {doctor.full_name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {doctor.qualification}
                              </p>
                              <p className="text-xs text-primary">
                                {doctor.specialization?.name}
                              </p>
                            </div>
                            {doctor.rating && doctor.rating > 0 && (
                              <div className="flex items-center gap-0.5 text-xs">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span>{doctor.rating}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                            {doctor.experience_years && (
                              <span>{doctor.experience_years} yrs exp</span>
                            )}
                            {doctor.city && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" />
                                {doctor.city}
                              </span>
                            )}
                            {doctor.availability && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {doctor.availability}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-semibold text-primary">
                              Rs. {doctor.consultation_fee}
                            </span>
                            <Button size="sm" className="text-xs h-7">
                              Book Appointment
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-8">
        {/* Hero Section */}
        <div className="bg-primary text-primary-foreground py-8">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-xl md:text-2xl font-bold mb-4">
              Find The Best Doctors Near You
            </h1>
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search medical specialties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white text-foreground text-xs h-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Specialties Section */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Most Viewed Specialities
            </h2>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={viewMode === "popular" ? "default" : "outline"}
                className="text-xs h-7"
                onClick={() => setViewMode("popular")}
              >
                Most Popular
              </Button>
              <Button
                size="sm"
                variant={viewMode === "all" ? "default" : "outline"}
                className="text-xs h-7"
                onClick={() => setViewMode("all")}
              >
                All Specialties (a-z)
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : sortedSpecs.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No specialties found" : "No specialties available yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedSpecs.map((spec) => {
                const Icon = getIcon(spec.icon_name);
                return (
                  <Card
                    key={spec.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleSpecialtyClick(spec)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground mb-1">
                            {spec.name}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {spec.description || `Specialists in ${spec.name.toLowerCase()} care`}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-primary font-medium">
                              {spec.doctor_count} Doctor(s)
                            </span>
                            <span className="text-xs text-primary hover:underline">
                              Learn More
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FindDoctors;
