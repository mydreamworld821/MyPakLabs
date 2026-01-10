import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Heart, 
  MapPin, 
  Star, 
  Clock, 
  Phone,
  Loader2,
  CheckCircle,
  ArrowLeft,
  Calendar,
  Award,
  Globe,
  AlertCircle,
  Syringe,
  MessageCircle
} from "lucide-react";

interface Nurse {
  id: string;
  full_name: string;
  photo_url: string | null;
  qualification: string;
  experience_years: number;
  city: string;
  area_of_service: string | null;
  home_visit_radius: number;
  services_offered: string[];
  department_experience: string[];
  available_days: string[];
  available_shifts: string[];
  emergency_available: boolean;
  per_visit_fee: number;
  per_hour_fee: number | null;
  monthly_package_fee: number | null;
  fee_negotiable: boolean;
  certifications: string[];
  languages_spoken: string[];
  rating: number;
  review_count: number;
  gender: string;
  phone: string;
  whatsapp_number: string | null;
}

const NurseDetail = () => {
  const { id } = useParams();
  const [nurse, setNurse] = useState<Nurse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNurse();
  }, [id]);

  const fetchNurse = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("nurses")
        .select("*")
        .eq("id", id)
        .eq("status", "approved")
        .single();

      if (error) throw error;
      setNurse(data);
    } catch (error) {
      console.error("Error fetching nurse:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (nurse?.phone) {
      window.location.href = `tel:${nurse.phone}`;
    }
  };

  const handleWhatsApp = () => {
    if (nurse?.whatsapp_number || nurse?.phone) {
      const number = (nurse.whatsapp_number || nurse.phone).replace(/[^0-9]/g, "");
      const formattedNumber = number.startsWith("0") ? "92" + number.slice(1) : number;
      window.open(`https://wa.me/${formattedNumber}?text=Hi, I found your profile on MyPakLabs and would like to book a home nursing visit.`, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 pb-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!nurse) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 pb-8">
          <div className="container mx-auto px-4 py-12 text-center">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Nurse not found</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This nurse profile may have been removed or is not available.
            </p>
            <Link to="/find-nurses">
              <Button>Browse Nurses</Button>
            </Link>
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
        {/* Header */}
        <div className="bg-rose-600 text-white py-6">
          <div className="container mx-auto px-4">
            <Link to="/find-nurses" className="inline-flex items-center gap-1 text-white/80 hover:text-white text-xs mb-4">
              <ArrowLeft className="w-3 h-3" />
              Back to Nurses
            </Link>
            
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {nurse.photo_url ? (
                  <img 
                    src={nurse.photo_url} 
                    alt={nurse.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Heart className="w-10 h-10 text-white/60" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold">{nurse.full_name}</h1>
                  <Badge className="bg-white/20 text-white">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    PNC Verified
                  </Badge>
                </div>
                <p className="text-sm text-white/80 mt-1">{nurse.qualification}</p>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <div className="flex items-center gap-1 text-xs">
                    <MapPin className="w-3 h-3" />
                    {nurse.city}{nurse.area_of_service ? `, ${nurse.area_of_service}` : ""}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {nurse.rating || "New"} ({nurse.review_count || 0} reviews)
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Award className="w-3 h-3" />
                    {nurse.experience_years} years experience
                  </div>
                </div>
                {nurse.emergency_available && (
                  <Badge variant="destructive" className="mt-2">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Available for Emergency
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Services Offered */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Syringe className="w-4 h-4 text-rose-600" />
                    Services Offered
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {nurse.services_offered?.map((service, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Department Experience */}
              {nurse.department_experience?.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Award className="w-4 h-4 text-rose-600" />
                      Department Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {nurse.department_experience.map((dept, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {dept}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Certifications */}
              {nurse.certifications?.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Award className="w-4 h-4 text-rose-600" />
                      Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {nurse.certifications.map((cert, idx) => (
                        <Badge key={idx} className="text-xs bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Availability */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-rose-600" />
                    Availability
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Available Days</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => {
                        const fullDay = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][idx];
                        const isAvailable = nurse.available_days?.includes(fullDay);
                        return (
                          <div
                            key={day}
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium ${
                              isAvailable
                                ? "bg-rose-100 text-rose-700"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Available Shifts</p>
                    <div className="flex flex-wrap gap-2">
                      {nurse.available_shifts?.map((shift, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {shift}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Languages */}
              {nurse.languages_spoken?.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4 text-rose-600" />
                      Languages Spoken
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {nurse.languages_spoken.map((lang, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Booking Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Book Home Visit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pricing */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
                      <span className="text-xs text-muted-foreground">Per Visit</span>
                      <span className="text-lg font-bold text-rose-600">
                        PKR {nurse.per_visit_fee?.toLocaleString()}
                      </span>
                    </div>
                    {nurse.per_hour_fee && (
                      <div className="flex items-center justify-between p-2 border rounded-lg">
                        <span className="text-xs text-muted-foreground">Per Hour</span>
                        <span className="text-sm font-semibold">
                          PKR {nurse.per_hour_fee.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {nurse.monthly_package_fee && (
                      <div className="flex items-center justify-between p-2 border rounded-lg">
                        <span className="text-xs text-muted-foreground">Monthly Package</span>
                        <span className="text-sm font-semibold">
                          PKR {nurse.monthly_package_fee.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {nurse.fee_negotiable && (
                      <p className="text-[10px] text-center text-muted-foreground">
                        * Fee is negotiable
                      </p>
                    )}
                  </div>

                  {/* Service Area */}
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="w-4 h-4 text-rose-600" />
                      <span>Serves within {nurse.home_visit_radius || 10} km radius</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-rose-600 hover:bg-rose-700" 
                      onClick={handleCall}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Now
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-green-600 text-green-600 hover:bg-green-50"
                      onClick={handleWhatsApp}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NurseDetail;
