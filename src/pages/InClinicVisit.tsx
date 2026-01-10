import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Calendar, Stethoscope, Users } from "lucide-react";

interface Specialization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  doctor_count: number;
}

const InClinicVisit = () => {
  const navigate = useNavigate();
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const cities = [
    "All Cities",
    "Karachi",
    "Lahore",
    "Islamabad",
    "Rawalpindi",
    "Faisalabad",
    "Multan",
    "Peshawar",
    "Quetta",
  ];

  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        // Fetch specializations
        const { data: specs, error: specsError } = await supabase
          .from("doctor_specializations")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (specsError) throw specsError;

        // Fetch doctor counts for each specialization (physical consultation)
        const specsWithCounts = await Promise.all(
          (specs || []).map(async (spec) => {
            const { count } = await supabase
              .from("doctors")
              .select("*", { count: "exact", head: true })
              .eq("specialization_id", spec.id)
              .eq("status", "approved");

            return {
              ...spec,
              doctor_count: count || 0,
            };
          })
        );

        setSpecializations(specsWithCounts);
      } catch (error) {
        console.error("Error fetching specializations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecializations();
  }, []);

  const filteredSpecializations = specializations.filter((spec) =>
    spec.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSpecializationClick = (spec: Specialization) => {
    const params = new URLSearchParams();
    params.set("specialization", spec.slug);
    params.set("type", "physical");
    if (selectedCity && selectedCity !== "All Cities") {
      params.set("city", selectedCity);
    }
    navigate(`/find-doctors?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="gradient-hero text-white pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-center">
              Book In-Clinic Appointments with Top Doctors
            </h1>
          </div>
          <p className="text-center text-white/90 mb-8 max-w-lg mx-auto">
            Find and book appointments with the best doctors near you. PMC verified and trusted healthcare providers.
          </p>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-xl p-2 shadow-xl">
              <div className="flex items-center gap-2 px-3 py-2 sm:border-r border-gray-200">
                <MapPin className="w-5 h-5 text-primary" />
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="border-0 shadow-none bg-transparent min-w-[120px] h-10 focus:ring-0 text-gray-700 font-medium">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400 ml-2" />
                <Input
                  type="text"
                  placeholder="Search by specialities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 shadow-none bg-transparent focus-visible:ring-0 text-gray-700 placeholder:text-gray-400 h-10"
                />
                <Button size="lg" className="shrink-0 px-6 rounded-lg">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specializations Grid */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">
          Choose a Speciality ({filteredSpecializations.length} available)
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-14 h-14 bg-muted rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-32 mb-2" />
                    <div className="h-3 bg-muted rounded w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpecializations.map((spec) => (
              <Card
                key={spec.id}
                className="cursor-pointer hover:shadow-lg hover:border-amber-500/50 transition-all duration-300 group"
                onClick={() => handleSpecializationClick(spec)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <Stethoscope className="w-7 h-7 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-amber-600 transition-colors">
                      {spec.name}
                    </h3>
                    <p className="text-sm text-amber-600 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {spec.doctor_count} Doctors Available
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredSpecializations.length === 0 && (
          <div className="text-center py-12">
            <Stethoscope className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No specializations found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search query
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default InClinicVisit;
