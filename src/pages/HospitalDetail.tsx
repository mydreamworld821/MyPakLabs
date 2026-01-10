import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Clock,
  ArrowLeft,
  Loader2,
  Stethoscope,
} from "lucide-react";

interface Hospital {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  specialties: string[] | null;
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  description: string | null;
  rating: number | null;
  review_count: number | null;
  opening_time: string | null;
  closing_time: string | null;
}

const HospitalDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) fetchHospital();
  }, [slug]);

  const fetchHospital = async () => {
    try {
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      setHospital(data);
    } catch (error) {
      console.error("Error fetching hospital:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 text-center">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Hospital Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The hospital you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/hospitals">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Hospitals
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {/* Hero Section */}
        <div className="h-64 md:h-80 bg-gradient-to-br from-primary/20 to-primary/5 relative">
          {hospital.cover_image_url ? (
            <img
              src={hospital.cover_image_url}
              alt={hospital.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="w-24 h-24 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Back Button */}
          <Link
            to="/hospitals"
            className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <div className="container mx-auto px-4 -mt-20 relative z-10 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {hospital.logo_url ? (
                      <div className="w-20 h-20 rounded-xl bg-white shadow-md overflow-hidden shrink-0">
                        <img
                          src={hospital.logo_url}
                          alt={hospital.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-10 h-10 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold text-foreground mb-2">
                        {hospital.name}
                      </h1>
                      {hospital.address && (
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{hospital.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        {hospital.rating && hospital.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{hospital.rating}</span>
                            {hospital.review_count && (
                              <span className="text-muted-foreground">
                                ({hospital.review_count} reviews)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* About */}
              {hospital.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {hospital.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Specialties */}
              {hospital.specialties && hospital.specialties.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="w-5 h-5" />
                      Specialties & Departments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {hospital.specialties.map((specialty) => (
                        <Badge
                          key={specialty}
                          variant="secondary"
                          className="text-sm px-3 py-1"
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hospital.opening_time && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Working Hours</p>
                        <p className="font-medium">
                          {hospital.opening_time} - {hospital.closing_time}
                        </p>
                      </div>
                    </div>
                  )}

                  {hospital.contact_phone && (
                    <a
                      href={`tel:${hospital.contact_phone}`}
                      className="flex items-center gap-3 hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium text-primary">{hospital.contact_phone}</p>
                      </div>
                    </a>
                  )}

                  {hospital.contact_email && (
                    <a
                      href={`mailto:${hospital.contact_email}`}
                      className="flex items-center gap-3 hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium text-primary">{hospital.contact_email}</p>
                      </div>
                    </a>
                  )}

                  {hospital.website && (
                    <a
                      href={hospital.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Website</p>
                        <p className="font-medium text-primary">Visit Website</p>
                      </div>
                    </a>
                  )}

                  {hospital.city && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">City</p>
                        <p className="font-medium">{hospital.city}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold mb-2">Need an Appointment?</h3>
                  <p className="text-sm text-primary-foreground/80 mb-3">
                    Call the hospital directly to book your visit
                  </p>
                  {hospital.contact_phone && (
                    <a href={`tel:${hospital.contact_phone}`}>
                      <Button variant="secondary" className="w-full">
                        <Phone className="w-4 h-4 mr-2" />
                        Call Now
                      </Button>
                    </a>
                  )}
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

export default HospitalDetail;