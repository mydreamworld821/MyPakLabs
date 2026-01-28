import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Loader2,
  User,
  Calendar,
  Clock,
  Settings,
  Save,
  UserRound,
  MapPin,
  Phone,
  Mail,
  Video,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";
import DoctorAppointmentsTab from "@/components/doctor/DoctorAppointmentsTab";

interface Specialization {
  id: string;
  name: string;
}

interface DoctorProfile {
  id: string;
  full_name: string;
  gender: string | null;
  photo_url: string | null;
  specialization_id: string | null;
  sub_specialty: string | null;
  qualification: string | null;
  experience_years: number | null;
  pmc_number: string;
  registration_council: string | null;
  hospital_name: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  city: string | null;
  consultation_type: string | null;
  consultation_fee: number | null;
  followup_fee: number | null;
  available_days: string[] | null;
  available_time_start: string | null;
  available_time_end: string | null;
  appointment_duration: number | null;
  emergency_available: boolean | null;
  phone: string | null;
  email: string | null;
  whatsapp_number: string | null;
  video_consultation: boolean | null;
  preferred_platform: string | null;
  online_consultation_fee: number | null;
  bio: string | null;
  areas_of_expertise: string[] | null;
  services_offered: string[] | null;
  languages_spoken: string[] | null;
  status: string;
  is_featured: boolean | null;
  rating: number | null;
  review_count: number | null;
  specialization?: { name: string } | null;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LANGUAGES = ["Urdu", "English", "Punjabi", "Sindhi", "Pashto", "Balochi", "Saraiki"];
const PLATFORMS = ["In-App", "Zoom", "WhatsApp", "Google Meet"];

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    bio: "",
    areas_of_expertise: "",
    services_offered: "",
    languages_spoken: [] as string[],
    clinic_name: "",
    clinic_address: "",
    city: "",
    hospital_name: "",
    consultation_fee: "",
    followup_fee: "",
    phone: "",
    whatsapp_number: "",
    video_consultation: false,
    preferred_platform: "",
    online_consultation_fee: "",
    available_days: [] as string[],
    available_time_start: "09:00",
    available_time_end: "17:00",
    appointment_duration: "15",
    emergency_available: false,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth", { state: { from: "/doctor-dashboard" } });
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [profileRes, specsRes] = await Promise.all([
        supabase
          .from("doctors")
          .select("*, specialization:doctor_specializations(name)")
          .eq("user_id", user!.id)
          .maybeSingle(),
        supabase
          .from("doctor_specializations")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
      ]);

      if (profileRes.error) throw profileRes.error;

      if (!profileRes.data) {
        toast.error("No doctor profile found");
        navigate("/doctor-register");
        return;
      }

      setProfile(profileRes.data);
      setSpecializations(specsRes.data || []);

      // Initialize form with profile data
      setFormData({
        bio: profileRes.data.bio || "",
        areas_of_expertise: profileRes.data.areas_of_expertise?.join(", ") || "",
        services_offered: profileRes.data.services_offered?.join(", ") || "",
        languages_spoken: profileRes.data.languages_spoken || [],
        clinic_name: profileRes.data.clinic_name || "",
        clinic_address: profileRes.data.clinic_address || "",
        city: profileRes.data.city || "",
        hospital_name: profileRes.data.hospital_name || "",
        consultation_fee: profileRes.data.consultation_fee?.toString() || "",
        followup_fee: profileRes.data.followup_fee?.toString() || "",
        phone: profileRes.data.phone || "",
        whatsapp_number: profileRes.data.whatsapp_number || "",
        video_consultation: profileRes.data.video_consultation || false,
        preferred_platform: profileRes.data.preferred_platform || "",
        online_consultation_fee: profileRes.data.online_consultation_fee?.toString() || "",
        available_days: profileRes.data.available_days || [],
        available_time_start: profileRes.data.available_time_start || "09:00",
        available_time_end: profileRes.data.available_time_end || "17:00",
        appointment_duration: profileRes.data.appointment_duration?.toString() || "15",
        emergency_available: profileRes.data.emergency_available || false,
      });
    } catch (error: any) {
      toast.error("Failed to load profile");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter((d) => d !== day)
        : [...prev.available_days, day],
    }));
  };

  const handleLanguageToggle = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages_spoken: prev.languages_spoken.includes(lang)
        ? prev.languages_spoken.filter((l) => l !== lang)
        : [...prev.languages_spoken, lang],
    }));
  };

  const handlePhotoUpload = async (file: File) => {
    if (!user || !profile) return;

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/photo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("doctor-photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("doctor-photos")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("doctors")
        .update({ photo_url: urlData.publicUrl })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setProfile((prev) => (prev ? { ...prev, photo_url: urlData.publicUrl } : null));
      toast.success("Photo updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("doctors")
        .update({
          bio: formData.bio || null,
          areas_of_expertise: formData.areas_of_expertise
            ? formData.areas_of_expertise.split(",").map((s) => s.trim())
            : [],
          services_offered: formData.services_offered
            ? formData.services_offered.split(",").map((s) => s.trim())
            : [],
          languages_spoken: formData.languages_spoken,
          clinic_name: formData.clinic_name || null,
          clinic_address: formData.clinic_address || null,
          city: formData.city || null,
          hospital_name: formData.hospital_name || null,
          consultation_fee: formData.consultation_fee ? parseInt(formData.consultation_fee) : null,
          followup_fee: formData.followup_fee ? parseInt(formData.followup_fee) : null,
          phone: formData.phone || null,
          whatsapp_number: formData.whatsapp_number || null,
          video_consultation: formData.video_consultation,
          preferred_platform: formData.preferred_platform || null,
          online_consultation_fee: formData.online_consultation_fee
            ? parseInt(formData.online_consultation_fee)
            : null,
        })
        .eq("id", profile.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAvailability = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("doctors")
        .update({
          available_days: formData.available_days,
          available_time_start: formData.available_time_start,
          available_time_end: formData.available_time_end,
          appointment_duration: parseInt(formData.appointment_duration),
          emergency_available: formData.emergency_available,
        })
        .eq("id", profile.id);

      if (error) throw error;
      toast.success("Availability updated successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update availability");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = () => {
    switch (profile?.status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" /> Verified
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 text-xs">
            <AlertCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 text-xs">
            <Clock className="w-3 h-3 mr-1" /> Pending Approval
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-muted-foreground">No doctor profile found</p>
            <Button className="mt-4" onClick={() => navigate("/doctor-register")}>
              Register as Doctor
            </Button>
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
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
              <div className="relative">
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt={profile.full_name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserRound className="w-10 h-10 text-primary" />
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90">
                  {uploadingPhoto ? (
                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3 text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingPhoto}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file);
                    }}
                  />
                </label>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg font-bold text-foreground">{profile.full_name}</h1>
                  {getStatusBadge()}
                </div>
                <p className="text-xs text-muted-foreground">{profile.qualification}</p>
                <p className="text-xs text-primary">{profile.specialization?.name}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">PMC: {profile.pmc_number}</div>
                {profile.rating !== null && profile.rating > 0 && (
                  <div className="text-xs">⭐ {profile.rating} ({profile.review_count} reviews)</div>
                )}
              </div>
            </div>

            {profile.status === "pending" && (
              <Card className="mb-6 border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <p className="text-xs text-yellow-800">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Your profile is pending approval. Our team will review your documents and verify your credentials within 24-48 hours.
                  </p>
                </CardContent>
              </Card>
            )}

            {profile.status === "rejected" && (
              <Card className="mb-6 border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <p className="text-xs text-red-800">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Your profile was rejected. Please contact support for more information.
                  </p>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid grid-cols-4 h-9">
                <TabsTrigger value="profile" className="text-xs">
                  <User className="w-3 h-3 mr-1" /> Profile
                </TabsTrigger>
                <TabsTrigger value="availability" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" /> Availability
                </TabsTrigger>
                <TabsTrigger value="appointments" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" /> Appointments
                </TabsTrigger>
                <TabsTrigger
                  value="chats"
                  className="text-xs"
                  onClick={() => navigate("/chats")}
                >
                  <MessageCircle className="w-3 h-3 mr-1" /> Chats
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Practice Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Hospital Name</Label>
                        <Input
                          value={formData.hospital_name}
                          onChange={(e) => handleInputChange("hospital_name", e.target.value)}
                          placeholder="Hospital name"
                          className="text-xs h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Clinic Name</Label>
                        <Input
                          value={formData.clinic_name}
                          onChange={(e) => handleInputChange("clinic_name", e.target.value)}
                          placeholder="Clinic name"
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Clinic Address</Label>
                      <Textarea
                        value={formData.clinic_address}
                        onChange={(e) => handleInputChange("clinic_address", e.target.value)}
                        placeholder="Full address"
                        className="text-xs min-h-[60px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">City</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        placeholder="City"
                        className="text-xs h-8"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Fees</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Consultation Fee (Rs.)</Label>
                        <Input
                          type="number"
                          value={formData.consultation_fee}
                          onChange={(e) => handleInputChange("consultation_fee", e.target.value)}
                          className="text-xs h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Follow-up Fee (Rs.)</Label>
                        <Input
                          type="number"
                          value={formData.followup_fee}
                          onChange={(e) => handleInputChange("followup_fee", e.target.value)}
                          className="text-xs h-8"
                        />
                      </div>
                      {formData.video_consultation && (
                        <div>
                          <Label className="text-xs">Online Fee (Rs.)</Label>
                          <Input
                            type="number"
                            value={formData.online_consultation_fee}
                            onChange={(e) => handleInputChange("online_consultation_fee", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Phone</Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder="03XX-XXXXXXX"
                          className="text-xs h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">WhatsApp</Label>
                        <Input
                          value={formData.whatsapp_number}
                          onChange={(e) => handleInputChange("whatsapp_number", e.target.value)}
                          placeholder="03XX-XXXXXXX"
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="video"
                        checked={formData.video_consultation}
                        onCheckedChange={(checked) => handleInputChange("video_consultation", checked)}
                      />
                      <Label htmlFor="video" className="text-xs">
                        I offer video consultations
                      </Label>
                    </div>
                    {formData.video_consultation && (
                      <div>
                        <Label className="text-xs">Preferred Platform</Label>
                        <Select
                          value={formData.preferred_platform}
                          onValueChange={(v) => handleInputChange("preferred_platform", v)}
                        >
                          <SelectTrigger className="text-xs h-8">
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            {PLATFORMS.map((platform) => (
                              <SelectItem key={platform} value={platform} className="text-xs">
                                {platform}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Profile Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Professional Bio</Label>
                      <Textarea
                        value={formData.bio}
                        onChange={(e) => handleInputChange("bio", e.target.value)}
                        placeholder="Write about yourself and your practice..."
                        className="text-xs min-h-[80px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Areas of Expertise (comma separated)</Label>
                      <Input
                        value={formData.areas_of_expertise}
                        onChange={(e) => handleInputChange("areas_of_expertise", e.target.value)}
                        placeholder="Diabetes, Hypertension, etc."
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Services Offered (comma separated)</Label>
                      <Input
                        value={formData.services_offered}
                        onChange={(e) => handleInputChange("services_offered", e.target.value)}
                        placeholder="General Checkup, ECG, etc."
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-2 block">Languages Spoken</Label>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => handleLanguageToggle(lang)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              formData.languages_spoken.includes(lang)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full text-xs">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3 mr-1" /> Save Profile
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* Availability Tab */}
              <TabsContent value="availability" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Working Days</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`px-3 py-2 rounded text-xs transition-colors ${
                            formData.available_days.includes(day)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Working Hours</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Start Time</Label>
                        <Input
                          type="time"
                          value={formData.available_time_start}
                          onChange={(e) => handleInputChange("available_time_start", e.target.value)}
                          className="text-xs h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">End Time</Label>
                        <Input
                          type="time"
                          value={formData.available_time_end}
                          onChange={(e) => handleInputChange("available_time_end", e.target.value)}
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Appointment Duration</Label>
                      <Select
                        value={formData.appointment_duration}
                        onValueChange={(v) => handleInputChange("appointment_duration", v)}
                      >
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10" className="text-xs">10 minutes</SelectItem>
                          <SelectItem value="15" className="text-xs">15 minutes</SelectItem>
                          <SelectItem value="20" className="text-xs">20 minutes</SelectItem>
                          <SelectItem value="30" className="text-xs">30 minutes</SelectItem>
                          <SelectItem value="45" className="text-xs">45 minutes</SelectItem>
                          <SelectItem value="60" className="text-xs">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="emergency"
                        checked={formData.emergency_available}
                        onCheckedChange={(checked) => handleInputChange("emergency_available", checked)}
                      />
                      <Label htmlFor="emergency" className="text-xs">
                        Available for emergency consultations
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={handleSaveAvailability} disabled={isSaving} className="w-full text-xs">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3 mr-1" /> Save Availability
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* Appointments Tab */}
              <TabsContent value="appointments" className="mt-4">
                <DoctorAppointmentsTab 
                  doctorId={profile.id} 
                  isApproved={profile.status === "approved"} 
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DoctorDashboard;
