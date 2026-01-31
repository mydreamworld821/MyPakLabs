import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "@/hooks/use-toast";
import { format, startOfDay } from "date-fns";
import { sendAdminEmailNotification } from "@/utils/adminNotifications";
import { generateBookingUniqueId } from "@/utils/generateBookingId";
import { useDoctorLocations, type DoctorPracticeLocation } from "@/hooks/useDoctorLocations";
import LocationSelector from "@/components/doctor/LocationSelector";
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Phone,
  Video,
  Building2,
  GraduationCap,
  Briefcase,
  Languages,
  Calendar as CalendarIcon,
  CheckCircle,
  UserRound,
  Loader2,
  MessageCircle,
} from "lucide-react";
import HospitalBadges from "@/components/HospitalBadges";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";

interface Doctor {
  id: string;
  full_name: string;
  photo_url: string | null;
  qualification: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  online_consultation_fee: number | null;
  followup_fee: number | null;
  city: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  hospital_name: string | null;
  availability: string | null;
  available_days: string[] | null;
  available_time_start: string | null;
  available_time_end: string | null;
  rating: number | null;
  review_count: number | null;
  bio: string | null;
  about: string | null;
  phone: string | null;
  email: string | null;
  pmc_number: string;
  sub_specialty: string | null;
  languages_spoken: string[] | null;
  areas_of_expertise: string[] | null;
  services_offered: string[] | null;
  video_consultation: boolean | null;
  consultation_type: string | null;
  emergency_available: boolean | null;
  appointment_duration: number | null;
  specialization?: { name: string; slug: string } | null;
}

interface HospitalAffiliation {
  hospital_id: string;
  hospital_name: string;
  hospital_slug: string;
  department: string | null;
  is_current: boolean;
}

const DoctorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addCredits, creditsPerBooking, isEnabled: walletEnabled } = useWallet();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [hospitals, setHospitals] = useState<HospitalAffiliation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState<"physical" | "online">("physical");
  const [isBooking, setIsBooking] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    full_name: string | null;
    phone: string | null;
    city: string | null;
    age: number | null;
    gender: string | null;
  } | null>(null);

  // Fetch doctor locations with scheduling
  const { locations: practiceLocations, isLoading: locationsLoading } = useDoctorLocations(id);

  // Get the selected location details
  const selectedLocation = useMemo(() => {
    if (!selectedLocationId) return null;
    return practiceLocations.find(l => l.id === selectedLocationId) || null;
  }, [selectedLocationId, practiceLocations]);

  // Auto-select first location if only one exists
  useEffect(() => {
    if (practiceLocations.length === 1 && !selectedLocationId) {
      setSelectedLocationId(practiceLocations[0].id);
    } else if (practiceLocations.length > 0 && !selectedLocationId) {
      // Select primary location by default
      const primary = practiceLocations.find(l => l.is_primary);
      if (primary) {
        setSelectedLocationId(primary.id);
      }
    }
  }, [practiceLocations, selectedLocationId]);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        return;
      }
      
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, city, age, gender")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (!error && data) {
        setUserProfile(data);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    if (id) {
      fetchDoctor();
      fetchHospitalAffiliations();
    }
  }, [id]);

  // Reset time when date or location changes
  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDate, selectedLocationId]);

  const fetchDoctor = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*, specialization:doctor_specializations(name, slug)")
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setIsLoading(false);
        return;
      }

      setDoctor(data);
    } catch (error) {
      console.error("Error fetching doctor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHospitalAffiliations = async () => {
    try {
      const { data } = await supabase
        .from("hospital_doctors")
        .select(`
          hospital_id,
          department,
          is_current,
          hospital:hospitals(name, slug)
        `)
        .eq("doctor_id", id);

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

  const parseHmToMinutes = (value: string) => {
    const [h, m] = value.split(":");
    const hh = Number.parseInt(h || "0", 10);
    const mm = Number.parseInt(m || "0", 10);
    return hh * 60 + mm;
  };

  const minutesToDisplay = (totalMinutes: number) => {
    const hh24 = Math.floor(totalMinutes / 60) % 24;
    const mm = totalMinutes % 60;
    const period = hh24 >= 12 ? "PM" : "AM";
    const hh12 = hh24 % 12 === 0 ? 12 : hh24 % 12;
    return `${hh12.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")} ${period}`;
  };

  // Generate time slots based on selected location or doctor default
  const timeSlots = useMemo(() => {
    // Use location-specific times if available
    const timeStart = selectedLocation?.available_time_start || doctor?.available_time_start;
    const timeEnd = selectedLocation?.available_time_end || doctor?.available_time_end;
    const duration = selectedLocation?.appointment_duration || doctor?.appointment_duration || 15;

    if (!timeStart || !timeEnd) {
      return ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];
    }

    const startMins = parseHmToMinutes(timeStart);
    const endMins = parseHmToMinutes(timeEnd);

    const slots: string[] = [];
    for (let mins = startMins; mins + duration <= endMins; mins += duration) {
      slots.push(minutesToDisplay(mins));
    }
    return slots;
  }, [doctor, selectedLocation]);

  // Get fee based on consultation type and selected location
  const getFee = () => {
    if (consultationType === "online") {
      return doctor?.online_consultation_fee || doctor?.consultation_fee || 0;
    }
    // For physical, use location-specific fee if available
    if (selectedLocation) {
      return selectedLocation.consultation_fee;
    }
    return doctor?.consultation_fee || 0;
  };

  const parseTimeLabel = (timeLabel: string) => {
    const match = timeLabel.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/i);
    if (!match) return null;
    let hh = Number(match[1]);
    const mm = Number(match[2]);
    const period = match[3].toUpperCase();
    if (period === "PM" && hh !== 12) hh += 12;
    if (period === "AM" && hh === 12) hh = 0;
    return hh * 60 + mm;
  };

  const getDateKey = (date: Date) => format(date, "yyyy-MM-dd");

  const getPakistanTime = () => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const pktOffset = 5 * 60 * 60 * 1000;
    return new Date(utc + pktOffset);
  };

  const getPakistanTodayKey = () => getDateKey(getPakistanTime());
  const getPakistanTodayStart = () => startOfDay(getPakistanTime());

  const isTimeSlotDisabled = (timeLabel: string, forDate?: Date) => {
    const checkDate = forDate || selectedDate;
    if (!checkDate) return false;

    const todayKey = getPakistanTodayKey();
    const checkKey = getDateKey(checkDate);
    if (checkKey !== todayKey) return false;

    const pktNow = getPakistanTime();
    const nowMins = pktNow.getHours() * 60 + pktNow.getMinutes();

    const slotMins = parseTimeLabel(timeLabel);
    if (slotMins === null) return false;

    return slotMins <= nowMins + 15;
  };

  const hasTodayAvailableSlots = useMemo(() => {
    const pktTodayStart = getPakistanTodayStart();
    return timeSlots.some((slot) => !isTimeSlotDisabled(slot, pktTodayStart));
  }, [timeSlots]);

  // Check if locations are available for physical consultations
  const hasMultipleLocations = practiceLocations.length > 1;
  const hasLocations = practiceLocations.length > 0;

  const handleBookAppointment = async () => {
    const authUser = user ?? (await supabase.auth.getUser()).data.user;

    if (!authUser) {
      toast({
        title: "Login Required",
        description: "Please login to book an appointment",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Select Date & Time",
        description: "Please select a date and time slot",
        variant: "destructive",
      });
      return;
    }

    // For physical consultations with multiple locations, require location selection
    if (consultationType === "physical" && hasMultipleLocations && !selectedLocationId) {
      toast({
        title: "Select Location",
        description: "Please select a clinic/hospital location",
        variant: "destructive",
      });
      return;
    }

    if (isTimeSlotDisabled(selectedTime)) {
      toast({
        title: "Time Slot Not Available",
        description: "Please select a future time slot.",
        variant: "destructive",
      });
      return;
    }

    if (!doctor) return;

    setIsBooking(true);

    try {
      const fee = getFee();
      const appointmentDate = format(selectedDate, "yyyy-MM-dd");

      // Prevent double booking
      const { data: existing, error: existingError } = await supabase
        .from("appointments")
        .select("id")
        .eq("doctor_id", doctor.id)
        .eq("appointment_date", appointmentDate)
        .eq("appointment_time", selectedTime)
        .neq("status", "cancelled")
        .limit(1);

      if (existingError) throw existingError;
      if (existing && existing.length > 0) {
        toast({
          title: "Slot Already Booked",
          description: "This time slot is already booked. Please choose another time.",
          variant: "destructive",
        });
        return;
      }

      const uniqueId = await generateBookingUniqueId('doctor');

      // Determine location reference
      const locationData: {
        hospital_doctor_id?: string;
        practice_location_id?: string;
        location_name?: string;
      } = {};

      if (consultationType === "physical" && selectedLocation) {
        locationData.location_name = selectedLocation.location_name;
        if (selectedLocation.type === 'hospital_doctor') {
          locationData.hospital_doctor_id = selectedLocation.id;
        } else if (selectedLocation.type === 'practice_location') {
          locationData.practice_location_id = selectedLocation.id;
        }
      }

      const { error } = await supabase
        .from("appointments")
        .insert({
          doctor_id: doctor.id,
          patient_id: authUser.id,
          appointment_date: appointmentDate,
          appointment_time: selectedTime,
          consultation_type: consultationType,
          fee,
          status: "pending",
          unique_id: uniqueId,
          ...locationData,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Send email notification
      sendAdminEmailNotification({
        type: 'doctor_appointment',
        bookingId: uniqueId,
        patientName: userProfile?.full_name || authUser.email?.split('@')[0] || 'Patient',
        patientPhone: userProfile?.phone || undefined,
        patientEmail: authUser.email || undefined,
        patientAge: userProfile?.age || undefined,
        patientGender: userProfile?.gender || undefined,
        patientCity: userProfile?.city || undefined,
        doctorName: doctor.full_name,
        appointmentDate: format(selectedDate, "dd MMM yyyy"),
        appointmentTime: selectedTime,
        consultationType,
        appointmentFee: fee,
        locationName: selectedLocation?.location_name,
        locationAddress: selectedLocation?.address || undefined,
      }).catch(console.error);

      // Award wallet credits
      if (walletEnabled) {
        try {
          await addCredits.mutateAsync({
            credits: creditsPerBooking,
            serviceType: "doctor_appointment",
            referenceId: uniqueId,
            description: `Doctor appointment with Dr. ${doctor.full_name}`,
          });
          toast({
            title: "🎉 Wallet Credits Earned!",
            description: `You earned ${creditsPerBooking} wallet credits for this booking.`,
          });
        } catch (e) {
          console.error("Failed to add wallet credits:", e);
        }
      }

      const locationText = selectedLocation ? ` at ${selectedLocation.location_name}` : '';
      toast({
        title: "Appointment Booked!",
        description: `Your ${consultationType} appointment with Dr. ${doctor.full_name}${locationText} on ${format(selectedDate, "dd MMM yyyy")} at ${selectedTime} has been booked successfully.`,
      });

      setSelectedDate(undefined);
      setSelectedTime(null);

      navigate("/my-bookings");
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      toast({
        title: "Booking Failed",
        description: error?.message || "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <UserRound className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-foreground">Doctor Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The doctor you're looking for doesn't exist or may have been removed.
          </p>
          <Button onClick={() => navigate("/find-doctors")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Browse All Doctors
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-8">
        {/* Header */}
        <div className="bg-primary text-primary-foreground py-4">
          <div className="container mx-auto px-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary-foreground/80 hover:text-primary-foreground mb-2"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Doctor Profile */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {doctor.photo_url ? (
                      <img
                        src={doctor.photo_url}
                        alt={doctor.full_name}
                        className="w-32 h-32 rounded-xl object-cover mx-auto sm:mx-0"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-xl bg-primary/10 flex items-center justify-center mx-auto sm:mx-0">
                        <UserRound className="w-16 h-16 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                        <h1 className="text-xl font-bold text-foreground">
                          {doctor.full_name}
                        </h1>
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          PMC Verified
                        </Badge>
                      </div>
                      <p className="text-sm text-primary font-medium mb-1">
                        {doctor.specialization?.name}
                        {doctor.sub_specialty && ` - ${doctor.sub_specialty}`}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {doctor.qualification}
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-muted-foreground">
                        {doctor.experience_years && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {doctor.experience_years} Years Experience
                          </span>
                        )}
                        {doctor.rating && doctor.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {doctor.rating} ({doctor.review_count || 0} Reviews)
                          </span>
                        )}
                      </div>
                      {doctor.city && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center sm:justify-start gap-1">
                          <MapPin className="w-3 h-3" />
                          {doctor.clinic_name && `${doctor.clinic_name}, `}{doctor.city}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Info - Show all locations fees if multiple */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t">
                    {hasLocations ? (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-lg font-bold text-primary">
                          {practiceLocations.length > 1 
                            ? `Rs. ${Math.min(...practiceLocations.map(l => l.consultation_fee))}+`
                            : `Rs. ${practiceLocations[0].consultation_fee}`
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {practiceLocations.length > 1 ? 'Starting Fee' : 'Consultation Fee'}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-lg font-bold text-primary">Rs. {doctor.consultation_fee || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">Consultation Fee</p>
                      </div>
                    )}
                    {doctor.online_consultation_fee && (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-lg font-bold text-primary">Rs. {doctor.online_consultation_fee}</p>
                        <p className="text-xs text-muted-foreground">Online Fee</p>
                      </div>
                    )}
                    {(selectedLocation?.followup_fee || doctor.followup_fee) && (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-lg font-bold text-primary">Rs. {selectedLocation?.followup_fee || doctor.followup_fee}</p>
                        <p className="text-xs text-muted-foreground">Follow-up Fee</p>
                      </div>
                    )}
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-lg font-bold text-primary">
                        {selectedLocation?.appointment_duration || doctor.appointment_duration || 15} min
                      </p>
                      <p className="text-xs text-muted-foreground">Appointment</p>
                    </div>
                  </div>

                  {/* Show available locations summary */}
                  {hasLocations && practiceLocations.length > 1 && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-200 flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        Available at {practiceLocations.length} locations
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        Choose your preferred location when booking
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Details Tabs */}
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="about" className="text-xs">About</TabsTrigger>
                  <TabsTrigger value="services" className="text-xs">Services</TabsTrigger>
                  <TabsTrigger value="location" className="text-xs">Location</TabsTrigger>
                  <TabsTrigger value="reviews" className="text-xs">Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="mt-4">
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      {doctor.about && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2">About Doctor</h3>
                          <p className="text-xs text-muted-foreground">{doctor.about}</p>
                        </div>
                      )}
                      {doctor.bio && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2">Bio</h3>
                          <p className="text-xs text-muted-foreground">{doctor.bio}</p>
                        </div>
                      )}
                      {doctor.areas_of_expertise && doctor.areas_of_expertise.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2">Areas of Expertise</h3>
                          <div className="flex flex-wrap gap-2">
                            {doctor.areas_of_expertise.map((area, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {doctor.languages_spoken && doctor.languages_spoken.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                            <Languages className="w-4 h-4" /> Languages
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {doctor.languages_spoken.join(", ")}
                          </p>
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" /> Qualification
                        </h3>
                        <p className="text-xs text-muted-foreground">{doctor.qualification}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PMC Registration: {doctor.pmc_number}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="services" className="mt-4">
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold mb-3">Consultation Types</h3>
                        <div className="flex flex-wrap gap-2">
                          {(doctor.consultation_type === "both" || doctor.consultation_type === "physical") && (
                            <Badge className="text-xs flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> In-Clinic Visit
                            </Badge>
                          )}
                          {(doctor.consultation_type === "both" || doctor.consultation_type === "online" || doctor.video_consultation) && (
                            <Badge className="text-xs flex items-center gap-1" variant="secondary">
                              <Video className="w-3 h-3" /> Video Consultation
                            </Badge>
                          )}
                          {doctor.emergency_available && (
                            <Badge className="text-xs" variant="destructive">
                              Emergency Available
                            </Badge>
                          )}
                        </div>
                      </div>
                      {doctor.services_offered && doctor.services_offered.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold mb-3">Services Offered</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {doctor.services_offered.map((service, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CheckCircle className="w-3 h-3 text-primary" />
                                {service}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="location" className="mt-4">
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      {/* Practice Locations with Schedules */}
                      {hasLocations && (
                        <div>
                          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1">
                            <Building2 className="w-4 h-4" /> Practice Locations
                          </h3>
                          <div className="space-y-3">
                            {practiceLocations.map((location) => (
                              <div key={location.id} className="p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-sm">{location.location_name}</span>
                                  {location.is_primary && (
                                    <Badge variant="secondary" className="text-[10px]">Primary</Badge>
                                  )}
                                </div>
                                {location.address && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {location.address}{location.city && `, ${location.city}`}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="font-medium text-primary">Rs. {location.consultation_fee}</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {location.available_time_start} - {location.available_time_end}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {location.available_days.map(day => (
                                    <Badge key={day} variant="outline" className="text-[10px] px-1.5">
                                      {day.substring(0, 3)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hospital Affiliations */}
                      {hospitals.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                            <Building2 className="w-4 h-4" /> Hospital Affiliations
                          </h3>
                          <HospitalBadges hospitals={hospitals} showDepartment />
                        </div>
                      )}

                      {doctor.clinic_name && !hasLocations && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                            <Building2 className="w-4 h-4" /> Clinic
                          </h3>
                          <p className="text-xs text-muted-foreground">{doctor.clinic_name}</p>
                        </div>
                      )}
                      {doctor.hospital_name && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2">Hospital</h3>
                          <p className="text-xs text-muted-foreground">{doctor.hospital_name}</p>
                        </div>
                      )}
                      {doctor.clinic_address && !hasLocations && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                            <MapPin className="w-4 h-4" /> Address
                          </h3>
                          <p className="text-xs text-muted-foreground">{doctor.clinic_address}</p>
                          {doctor.city && <p className="text-xs text-muted-foreground">{doctor.city}</p>}
                        </div>
                      )}
                      {doctor.available_days && doctor.available_days.length > 0 && !hasLocations && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                            <Clock className="w-4 h-4" /> Availability
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {doctor.available_days.join(", ")}
                          </p>
                          {doctor.available_time_start && doctor.available_time_end && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {doctor.available_time_start} - {doctor.available_time_end}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <ReviewsSection
                        entityType="doctor"
                        entityId={doctor.id}
                        entityName={`Dr. ${doctor.full_name}`}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Book Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Consultation Type */}
                  <div>
                    <p className="text-xs font-medium mb-2">Consultation Type</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={consultationType === "physical" ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-9"
                        onClick={() => setConsultationType("physical")}
                        disabled={doctor.consultation_type === "online"}
                      >
                        <Building2 className="w-3 h-3 mr-1" /> In-Clinic
                      </Button>
                      <Button
                        variant={consultationType === "online" ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-9"
                        onClick={() => setConsultationType("online")}
                        disabled={!doctor.video_consultation && doctor.consultation_type !== "both" && doctor.consultation_type !== "online"}
                      >
                        <Video className="w-3 h-3 mr-1" /> Online
                      </Button>
                    </div>
                  </div>

                  {/* Location Selector - Only for physical consultations */}
                  {consultationType === "physical" && hasLocations && (
                    <LocationSelector
                      locations={practiceLocations}
                      selectedLocationId={selectedLocationId}
                      onSelect={setSelectedLocationId}
                    />
                  )}

                  {/* Calendar */}
                  <div>
                    <p className="text-xs font-medium mb-2">Select Date</p>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => {
                        const pktNow = getPakistanTime();
                        const pktTodayStart = startOfDay(pktNow);
                        const dateStart = startOfDay(date);

                        if (dateStart.getTime() < pktTodayStart.getTime()) return true;

                        const maxDate = new Date(pktTodayStart.getTime() + 30 * 24 * 60 * 60 * 1000);
                        if (dateStart.getTime() > maxDate.getTime()) return true;

                        if (dateStart.getTime() === pktTodayStart.getTime()) {
                          return !hasTodayAvailableSlots;
                        }

                        return false;
                      }}
                      className="rounded-md border w-full"
                    />
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <p className="text-xs font-medium mb-2">Select Time</p>
                      <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                        {timeSlots.map((time) => (
                          <Button
                            key={time}
                            variant={selectedTime === time ? "default" : "outline"}
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => setSelectedTime(time)}
                            disabled={isTimeSlotDisabled(time)}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fee & Book */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Consultation Fee</span>
                      <span className="text-lg font-bold text-primary">Rs. {getFee()}</span>
                    </div>
                    {selectedLocation && consultationType === "physical" && (
                      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {selectedLocation.location_name}
                      </p>
                    )}
                    <Button 
                      className="w-full text-sm"
                      onClick={handleBookAppointment}
                      disabled={!selectedDate || !selectedTime || isBooking || (consultationType === "physical" && hasMultipleLocations && !selectedLocationId)}
                    >
                      {isBooking ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Booking...
                        </>
                      ) : (
                        "Book Appointment"
                      )}
                    </Button>
                  </div>

                  {/* Contact */}
                  {(selectedLocation?.contact_phone || doctor.phone) && (
                    <div className="pt-4 border-t">
                      <a 
                        href={`tel:${selectedLocation?.contact_phone || doctor.phone}`}
                        className="flex items-center justify-center gap-2 text-xs text-primary hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        Call: {selectedLocation?.contact_phone || doctor.phone}
                      </a>
                    </div>
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

export default DoctorDetail;
