import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { generateBookingUniqueId } from "@/utils/generateBookingId";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";
import { sendAdminEmailNotification } from "@/utils/adminNotifications";
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
  MessageCircle,
  CalendarPlus,
  Building2
} from "lucide-react";
import HospitalBadges from "@/components/HospitalBadges";

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

interface HospitalAffiliation {
  hospital_id: string;
  hospital_name: string;
  hospital_slug: string;
  department: string | null;
  is_current: boolean;
}

const NurseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addCredits, creditsPerBooking, isEnabled: walletEnabled } = useWallet();
  const [nurse, setNurse] = useState<Nurse | null>(null);
  const [hospitals, setHospitals] = useState<HospitalAffiliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    patient_name: "",
    patient_phone: "",
    patient_address: "",
    service_needed: "",
    preferred_date: "",
    preferred_time: "",
    notes: "",
  });

  useEffect(() => {
    fetchNurse();
    fetchHospitalAffiliations();
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

  const fetchHospitalAffiliations = async () => {
    if (!id) return;
    try {
      const { data } = await supabase
        .from("nurse_hospitals")
        .select(`
          hospital_id,
          department,
          is_current,
          hospital:hospitals(name, slug)
        `)
        .eq("nurse_id", id);

      if (data) {
        const affiliations = data.map((item: any) => ({
          hospital_id: item.hospital_id,
          hospital_name: item.hospital?.name || "Unknown Hospital",
          hospital_slug: item.hospital?.slug || "",
          department: item.department,
          is_current: item.is_current ?? true,
        }));
        setHospitals(affiliations);
      }
    } catch (error) {
      console.error("Error fetching hospital affiliations:", error);
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

  const handleSubmitBooking = async () => {
    if (!nurse) return;
    
    if (!bookingForm.patient_name || !bookingForm.patient_phone || !bookingForm.service_needed || !bookingForm.preferred_date || !bookingForm.preferred_time) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmittingBooking(true);
    try {
      // Generate unique booking ID
      const uniqueId = await generateBookingUniqueId('nurse');

      const { error } = await supabase.from("nurse_bookings").insert({
        nurse_id: nurse.id,
        patient_id: user?.id || null,
        patient_name: bookingForm.patient_name.trim(),
        patient_phone: bookingForm.patient_phone.trim(),
        patient_address: bookingForm.patient_address || null,
        service_needed: bookingForm.service_needed,
        preferred_date: bookingForm.preferred_date,
        preferred_time: bookingForm.preferred_time,
        notes: bookingForm.notes || null,
        unique_id: uniqueId,
      });

      if (error) throw error;

      // Send email notification to admin and customer
      const { data: { user: authUser } } = await supabase.auth.getUser();
      sendAdminEmailNotification({
        type: 'nurse_booking',
        bookingId: uniqueId,
        patientName: bookingForm.patient_name,
        patientPhone: bookingForm.patient_phone,
        patientEmail: authUser?.email || undefined,
        nurseName: nurse.full_name,
        serviceNeeded: bookingForm.service_needed,
        preferredDate: bookingForm.preferred_date,
        preferredTime: bookingForm.preferred_time,
      }).catch(console.error);

      // Award wallet credits for booking
      if (walletEnabled && user) {
        try {
          await addCredits.mutateAsync({
            credits: creditsPerBooking,
            serviceType: "nursing_booking",
            referenceId: uniqueId,
            description: `Nurse booking with ${nurse.full_name}`,
          });
          toast.success(`🎉 You earned ${creditsPerBooking} wallet credits!`);
        } catch (e) {
          console.error("Failed to add wallet credits:", e);
        }
      }

      toast.success("Booking request submitted! The nurse will contact you shortly.");
      setShowBookingDialog(false);
      setBookingForm({
        patient_name: "",
        patient_phone: "",
        patient_address: "",
        service_needed: "",
        preferred_date: "",
        preferred_time: "",
        notes: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to submit booking");
    } finally {
      setSubmittingBooking(false);
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

              {/* Hospital Affiliations */}
              {hospitals.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-rose-600" />
                      Hospital Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <HospitalBadges hospitals={hospitals} showDepartment />
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

                  {/* Service Area Visualization */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-xs font-medium mb-3">
                      <MapPin className="w-4 h-4 text-rose-600" />
                      <span>Service Coverage Area</span>
                    </div>
                    <div className="relative flex items-center justify-center">
                      {/* Radius visualization */}
                      <div className="relative w-40 h-40">
                        {/* Outer ring - max coverage */}
                        <div 
                          className="absolute inset-0 rounded-full border-2 border-dashed border-rose-200 bg-rose-50/30"
                          style={{
                            animation: "pulse 3s ease-in-out infinite"
                          }}
                        />
                        {/* Middle ring */}
                        <div 
                          className="absolute rounded-full border border-rose-300/50 bg-rose-100/40"
                          style={{
                            top: "15%",
                            left: "15%",
                            right: "15%",
                            bottom: "15%"
                          }}
                        />
                        {/* Inner ring - core area */}
                        <div 
                          className="absolute rounded-full bg-rose-200/60"
                          style={{
                            top: "30%",
                            left: "30%",
                            right: "30%",
                            bottom: "30%"
                          }}
                        />
                        {/* Center point - nurse location */}
                        <div 
                          className="absolute rounded-full bg-rose-600 shadow-lg flex items-center justify-center"
                          style={{
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "36px",
                            height: "36px"
                          }}
                        >
                          <Heart className="w-4 h-4 text-white" />
                        </div>
                        {/* Radius label */}
                        <div 
                          className="absolute text-[10px] font-bold text-rose-600 bg-white px-1.5 py-0.5 rounded shadow-sm"
                          style={{
                            top: "4px",
                            right: "4px"
                          }}
                        >
                          {nurse.home_visit_radius || 10} km
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-center space-y-1">
                      <p className="text-sm font-medium text-rose-700">
                        {nurse.city}
                        {nurse.area_of_service ? ` - ${nurse.area_of_service}` : ""}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Home visits available within {nurse.home_visit_radius || 10} km radius
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-rose-600 hover:bg-rose-700" 
                      onClick={() => setShowBookingDialog(true)}
                    >
                      <CalendarPlus className="w-4 h-4 mr-2" />
                      Book Home Visit
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full" 
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

                  {/* Booking Dialog */}
                  <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-sm">Book Home Visit</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Your Name *</Label>
                          <Input
                            value={bookingForm.patient_name}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, patient_name: e.target.value }))}
                            placeholder="Enter your full name"
                            className="text-xs h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Phone Number *</Label>
                          <Input
                            value={bookingForm.patient_phone}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, patient_phone: e.target.value }))}
                            placeholder="0300-1234567"
                            className="text-xs h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Address</Label>
                          <Input
                            value={bookingForm.patient_address}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, patient_address: e.target.value }))}
                            placeholder="Your home address for visit"
                            className="text-xs h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Service Needed *</Label>
                          <Select 
                            value={bookingForm.service_needed} 
                            onValueChange={(v) => setBookingForm(prev => ({ ...prev, service_needed: v }))}
                          >
                            <SelectTrigger className="text-xs h-8">
                              <SelectValue placeholder="Select service" />
                            </SelectTrigger>
                            <SelectContent>
                              {nurse.services_offered?.map((service) => (
                                <SelectItem key={service} value={service} className="text-xs">
                                  {service}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Preferred Date *</Label>
                            <Input
                              type="date"
                              value={bookingForm.preferred_date}
                              onChange={(e) => setBookingForm(prev => ({ ...prev, preferred_date: e.target.value }))}
                              min={new Date().toISOString().split('T')[0]}
                              className="text-xs h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Preferred Time *</Label>
                            <Select 
                              value={bookingForm.preferred_time} 
                              onValueChange={(v) => setBookingForm(prev => ({ ...prev, preferred_time: v }))}
                            >
                              <SelectTrigger className="text-xs h-8">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Morning (8AM-12PM)" className="text-xs">Morning (8AM-12PM)</SelectItem>
                                <SelectItem value="Afternoon (12PM-5PM)" className="text-xs">Afternoon (12PM-5PM)</SelectItem>
                                <SelectItem value="Evening (5PM-9PM)" className="text-xs">Evening (5PM-9PM)</SelectItem>
                                <SelectItem value="Night (9PM-12AM)" className="text-xs">Night (9PM-12AM)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Additional Notes</Label>
                          <Textarea
                            value={bookingForm.notes}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Any specific requirements or health conditions..."
                            className="text-xs"
                            rows={2}
                          />
                        </div>
                        <Button 
                          className="w-full bg-rose-600 hover:bg-rose-700"
                          onClick={handleSubmitBooking}
                          disabled={submittingBooking}
                        >
                          {submittingBooking ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Submit Booking Request
                            </>
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
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
