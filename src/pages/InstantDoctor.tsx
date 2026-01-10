import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import {
  Zap,
  Star,
  Phone,
  ChevronRight,
  Stethoscope,
  Loader2,
  Video,
  Heart,
  Brain,
  Eye,
  Ear,
  Bone,
  Pill,
  Thermometer,
  Activity,
  Droplets,
  Shield,
  Frown,
  Wind,
  X,
  HeartPulse,
} from "lucide-react";

interface HealthCondition {
  name: string;
  urdu: string;
  icon: React.ReactNode;
  specialty: string; // Related specialty slug
}

interface Specialization {
  id: string;
  name: string;
  slug: string;
  doctor_count?: number;
}

interface Doctor {
  id: string;
  full_name: string;
  photo_url: string | null;
  qualification: string | null;
  experience_years: number | null;
  rating: number | null;
  online_consultation_fee: number | null;
  consultation_fee: number | null;
  specialization: {
    name: string;
  } | null;
}

const healthConditions: HealthCondition[] = [
  { name: "Diabetes", urdu: "ذیابیطس", icon: <Droplets className="w-5 h-5" />, specialty: "endocrinologist" },
  { name: "Hypertension", urdu: "بلند فشار خون", icon: <Activity className="w-5 h-5" />, specialty: "cardiologist" },
  { name: "Heart Disease", urdu: "دل کی بیماری", icon: <Heart className="w-5 h-5" />, specialty: "cardiologist" },
  { name: "Stroke", urdu: "فالج", icon: <Brain className="w-5 h-5" />, specialty: "neurologist" },
  { name: "Asthma", urdu: "دمہ", icon: <HeartPulse className="w-5 h-5" />, specialty: "pulmonologist" },
  { name: "Allergies", urdu: "الرجی", icon: <Shield className="w-5 h-5" />, specialty: "allergist" },
  { name: "Anemia", urdu: "خون کی کمی", icon: <Droplets className="w-5 h-5" />, specialty: "hematologist" },
  { name: "Arthritis", urdu: "جوڑوں کا درد", icon: <Bone className="w-5 h-5" />, specialty: "rheumatologist" },
  { name: "Cancer", urdu: "کینسر", icon: <Activity className="w-5 h-5" />, specialty: "oncologist" },
  { name: "Tuberculosis", urdu: "تپ دق", icon: <HeartPulse className="w-5 h-5" />, specialty: "pulmonologist" },
  { name: "Hepatitis", urdu: "ہیپاٹائٹس", icon: <Activity className="w-5 h-5" />, specialty: "gastroenterologist" },
  { name: "Obesity", urdu: "موٹاپا", icon: <Activity className="w-5 h-5" />, specialty: "endocrinologist" },
  { name: "Depression", urdu: "ڈپریشن", icon: <Frown className="w-5 h-5" />, specialty: "psychiatrist" },
  { name: "Anxiety", urdu: "اضطراب", icon: <Brain className="w-5 h-5" />, specialty: "psychiatrist" },
  { name: "Migraine", urdu: "شدید سر درد", icon: <Brain className="w-5 h-5" />, specialty: "neurologist" },
  { name: "Flu", urdu: "فلو / زکام", icon: <Thermometer className="w-5 h-5" />, specialty: "general-physician" },
  { name: "Cold", urdu: "نزلہ / زکام", icon: <Wind className="w-5 h-5" />, specialty: "general-physician" },
  { name: "COVID-19", urdu: "کووڈ-۱۹", icon: <Shield className="w-5 h-5" />, specialty: "pulmonologist" },
  { name: "Pneumonia", urdu: "نمونیا", icon: <HeartPulse className="w-5 h-5" />, specialty: "pulmonologist" },
  { name: "Thyroid", urdu: "تھائرائڈ", icon: <Activity className="w-5 h-5" />, specialty: "endocrinologist" },
  { name: "Kidney Disease", urdu: "گردوں کی بیماری", icon: <Activity className="w-5 h-5" />, specialty: "nephrologist" },
  { name: "Liver Disease", urdu: "جگر کی بیماری", icon: <Activity className="w-5 h-5" />, specialty: "gastroenterologist" },
  { name: "Skin Infection", urdu: "جلدی انفیکشن", icon: <Stethoscope className="w-5 h-5" />, specialty: "dermatologist" },
  { name: "Eye Problems", urdu: "آنکھوں کے مسائل", icon: <Eye className="w-5 h-5" />, specialty: "ophthalmologist" },
  { name: "Ear Infection", urdu: "کان کا انفیکشن", icon: <Ear className="w-5 h-5" />, specialty: "ent-specialist" },
  { name: "Gastritis", urdu: "معدے کی سوزش", icon: <Activity className="w-5 h-5" />, specialty: "gastroenterologist" },
  { name: "Ulcer", urdu: "السر / زخم", icon: <Pill className="w-5 h-5" />, specialty: "gastroenterologist" },
  { name: "Fever", urdu: "بخار", icon: <Thermometer className="w-5 h-5" />, specialty: "general-physician" },
];

const InstantDoctor = () => {
  const navigate = useNavigate();
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [onlineDoctors, setOnlineDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [showAllConditions, setShowAllConditions] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch specializations with doctor counts
      const { data: specs, error: specsError } = await supabase
        .from("doctor_specializations")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (specsError) throw specsError;

      // Get doctor counts for each specialization (only approved doctors with video consultation)
      const specsWithCounts = await Promise.all(
        (specs || []).map(async (spec) => {
          const { count } = await supabase
            .from("doctors")
            .select("*", { count: "exact", head: true })
            .eq("specialization_id", spec.id)
            .eq("status", "approved")
            .eq("video_consultation", true);
          return { ...spec, doctor_count: count || 0 };
        })
      );

      setSpecializations(specsWithCounts.filter(s => s.doctor_count > 0));

      // Fetch online doctors (approved with video consultation)
      const { data: doctors, error: doctorsError } = await supabase
        .from("doctors")
        .select(`
          id,
          full_name,
          photo_url,
          qualification,
          experience_years,
          rating,
          online_consultation_fee,
          consultation_fee,
          specialization:specialization_id (name)
        `)
        .eq("status", "approved")
        .eq("video_consultation", true)
        .order("rating", { ascending: false })
        .limit(12);

      if (doctorsError) throw doctorsError;
      setOnlineDoctors(doctors || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConditionClick = (specialty: string) => {
    navigate(`/find-doctors?type=online&specialization=${specialty}`);
  };

  const handleSpecialtyClick = (slug: string) => {
    setSelectedSpecialty(slug);
    navigate(`/find-doctors?type=online&specialization=${slug}`);
  };

  const handleCallDoctor = (doctorId: string) => {
    navigate(`/doctor/${doctorId}?type=online`);
  };

  const filteredDoctors = selectedSpecialty
    ? onlineDoctors.filter(d => 
        d.specialization?.name.toLowerCase().includes(selectedSpecialty.toLowerCase())
      )
    : onlineDoctors;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-20 gradient-hero text-white">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                <Zap className="w-8 h-8 text-yellow-300" />
                <h1 className="text-2xl md:text-3xl font-bold">
                  INSTANT <span className="text-yellow-300">DOCTOR+</span>
                </h1>
              </div>
              <p className="text-white/90 text-sm md:text-base max-w-md">
                Connect with verified doctors instantly for online video consultations. 
                Get medical advice from the comfort of your home.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                <Video className="w-4 h-4 mr-2" />
                Available 24/7
              </Badge>
              <Badge className="bg-yellow-400 text-black border-0 px-4 py-2">
                <Zap className="w-4 h-4 mr-2" />
                Instant Connect
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 md:py-8 space-y-8">
        {/* Common Health Conditions */}
        <section>
          <h2 className="text-lg md:text-xl font-bold mb-4">Common Health Conditions</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {healthConditions.slice(0, 8).map((condition) => (
              <button
                key={condition.name}
                onClick={() => handleConditionClick(condition.specialty)}
                className="flex flex-col items-center p-3 rounded-xl bg-card hover:bg-accent transition-colors group"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <span className="text-primary">{condition.icon}</span>
                </div>
                <span className="text-xs md:text-sm font-medium text-center leading-tight">{condition.name}</span>
                <span className="text-[10px] text-muted-foreground">{condition.urdu}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAllConditions(true)}
              className="gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </section>

        {/* View All Conditions Dialog */}
        <Dialog open={showAllConditions} onOpenChange={setShowAllConditions}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">All Health Conditions</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mt-4">
              {healthConditions.map((condition) => (
                <button
                  key={condition.name}
                  onClick={() => {
                    setShowAllConditions(false);
                    handleConditionClick(condition.specialty);
                  }}
                  className="flex flex-col items-center p-3 rounded-xl bg-muted hover:bg-accent transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                    <span className="text-primary">{condition.icon}</span>
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">{condition.name}</span>
                  <span className="text-[10px] text-muted-foreground">{condition.urdu}</span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Top Specialties */}
        <section>
          <h2 className="text-lg md:text-xl font-bold mb-4">Top Specialties</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {specializations.slice(0, 10).map((spec) => (
                <Button
                  key={spec.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSpecialtyClick(spec.slug)}
                  className="rounded-full hover:bg-primary hover:text-white transition-colors"
                >
                  {spec.name}
                  {spec.doctor_count && spec.doctor_count > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {spec.doctor_count}
                    </Badge>
                  )}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/find-doctors?type=online")}
                className="rounded-full gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </section>

        {/* Online Doctors */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold">
              Top Doctors Online
              <span className="ml-2 inline-flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </span>
            </h2>
            <Button 
              variant="link" 
              onClick={() => navigate("/find-doctors?type=online")}
              className="gap-1"
            >
              See All <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-14 rounded-full bg-muted"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-10 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : onlineDoctors.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No doctors available for online consultation at the moment.</p>
              <Button className="mt-4" onClick={() => navigate("/find-doctors")}>
                Browse All Doctors
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {onlineDoctors.map((doctor) => (
                <Card key={doctor.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative">
                        {doctor.photo_url ? (
                          <img
                            src={doctor.photo_url}
                            alt={doctor.full_name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                            <Stethoscope className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{doctor.full_name}</h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {doctor.specialization?.name || "General Physician"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doctor.experience_years || 0} Years of experience
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">{doctor.rating?.toFixed(1) || "4.5"} / 5</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1 text-green-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-xs font-medium">Online</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">Fee: </span>
                        <span className="font-bold text-sm">
                          Rs {(doctor.online_consultation_fee || doctor.consultation_fee || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Button 
                      className="w-full gap-2" 
                      onClick={() => handleCallDoctor(doctor.id)}
                    >
                      <Phone className="w-4 h-4" />
                      Call Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* How It Works */}
        <section className="bg-card rounded-2xl p-6">
          <h2 className="text-lg md:text-xl font-bold mb-6 text-center">How Instant Doctor Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="font-semibold mb-1">Choose a Doctor</h3>
              <p className="text-sm text-muted-foreground">
                Browse through our verified doctors and select one based on specialty and availability.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="font-semibold mb-1">Book Appointment</h3>
              <p className="text-sm text-muted-foreground">
                Select your preferred time slot and confirm your video consultation booking.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="font-semibold mb-1">Start Consultation</h3>
              <p className="text-sm text-muted-foreground">
                Connect with your doctor via video call and get professional medical advice.
              </p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default InstantDoctor;