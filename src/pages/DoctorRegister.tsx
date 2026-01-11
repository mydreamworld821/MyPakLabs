import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Stethoscope, 
  Building2, 
  Calendar, 
  Phone, 
  Video, 
  FileText, 
  Shield,
  Upload,
  X,
  CheckCircle
} from "lucide-react";
import { HospitalSelector, SelectedHospital } from "@/components/HospitalSelector";

interface Specialization {
  id: string;
  name: string;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LANGUAGES = ["Urdu", "English", "Punjabi", "Sindhi", "Pashto", "Balochi", "Saraiki"];
const PLATFORMS = ["In-App", "Zoom", "WhatsApp", "Google Meet"];

const DoctorRegister = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    // Personal
    full_name: "",
    gender: "",
    date_of_birth: "",
    photo_url: "",
    
    // Professional
    specialization_id: "",
    sub_specialty: "",
    qualification: "",
    experience_years: "",
    pmc_number: "",
    registration_council: "PMC",
    
    // Practice
    hospital_name: "",
    clinic_name: "",
    clinic_address: "",
    city: "",
    consultation_type: "both",
    consultation_fee: "",
    followup_fee: "",
    
    // Availability
    available_days: [] as string[],
    available_time_start: "09:00",
    available_time_end: "17:00",
    appointment_duration: "15",
    emergency_available: false,
    
    // Contact
    phone: "",
    email: "",
    whatsapp_number: "",
    
    // Online Consultation
    video_consultation: false,
    preferred_platform: "",
    online_consultation_fee: "",
    
    // Documents
    degree_certificate_url: "",
    pmc_certificate_url: "",
    cnic_url: "",
    
    // Profile
    bio: "",
    areas_of_expertise: "",
    services_offered: "",
    languages_spoken: [] as string[],
    
    // Legal
    terms_accepted: false,
    privacy_accepted: false,
  });

  // Hospital affiliations
  const [selectedHospitals, setSelectedHospitals] = useState<SelectedHospital[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth", { state: { from: "/doctor-register" } });
      return;
    }
    fetchSpecializations();
    // Pre-fill email
    setFormData(prev => ({ ...prev, email: user.email || "" }));
  }, [user, navigate]);

  const fetchSpecializations = async () => {
    const { data } = await supabase
      .from("doctor_specializations")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    setSpecializations(data || []);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter(d => d !== day)
        : [...prev.available_days, day]
    }));
  };

  const handleLanguageToggle = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages_spoken: prev.languages_spoken.includes(lang)
        ? prev.languages_spoken.filter(l => l !== lang)
        : [...prev.languages_spoken, lang]
    }));
  };

  const handleFileUpload = async (file: File, field: string, bucket: string) => {
    if (!user) return;
    
    setUploadingField(field);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${field}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      handleInputChange(field, urlData.publicUrl);
      toast.success("File uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploadingField(null);
    }
  };

  const handleDocumentUpload = async (file: File, field: string) => {
    if (!user) return;
    
    setUploadingField(field);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${field}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('doctor-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // For private bucket, store the path (we'll use signed URLs for viewing)
      handleInputChange(field, fileName);
      toast.success("Document uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploadingField(null);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.full_name || !formData.gender || !formData.date_of_birth) {
          toast.error("Please fill all personal information fields");
          return false;
        }
        break;
      case 2:
        if (!formData.specialization_id || !formData.qualification || !formData.experience_years || !formData.pmc_number) {
          toast.error("Please fill all professional information fields");
          return false;
        }
        break;
      case 3:
        if (!formData.clinic_name || !formData.city || !formData.consultation_fee) {
          toast.error("Please fill clinic name, city, and consultation fee");
          return false;
        }
        break;
      case 4:
        if (formData.available_days.length === 0) {
          toast.error("Please select at least one available day");
          return false;
        }
        break;
      case 5:
        if (!formData.phone) {
          toast.error("Please enter your phone number");
          return false;
        }
        break;
      case 7:
        if (!formData.degree_certificate_url || !formData.pmc_certificate_url || !formData.cnic_url) {
          toast.error("Please upload all required documents");
          return false;
        }
        break;
      case 9:
        if (!formData.terms_accepted || !formData.privacy_accepted) {
          toast.error("Please accept Terms & Conditions and Privacy Policy");
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 9));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please login to continue");
      return;
    }

    if (!validateStep(9)) return;

    setIsLoading(true);
    try {
      const { data: doctorData, error } = await supabase.from("doctors").insert({
        user_id: user.id,
        full_name: formData.full_name.trim(),
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        photo_url: formData.photo_url || null,
        specialization_id: formData.specialization_id,
        sub_specialty: formData.sub_specialty || null,
        qualification: formData.qualification.trim(),
        experience_years: parseInt(formData.experience_years),
        pmc_number: formData.pmc_number.trim(),
        registration_council: formData.registration_council,
        hospital_name: formData.hospital_name || null,
        clinic_name: formData.clinic_name.trim(),
        clinic_address: formData.clinic_address || null,
        city: formData.city.trim(),
        consultation_type: formData.consultation_type,
        consultation_fee: parseInt(formData.consultation_fee),
        followup_fee: formData.followup_fee ? parseInt(formData.followup_fee) : null,
        available_days: formData.available_days,
        available_time_start: formData.available_time_start,
        available_time_end: formData.available_time_end,
        appointment_duration: parseInt(formData.appointment_duration),
        emergency_available: formData.emergency_available,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        whatsapp_number: formData.whatsapp_number || null,
        video_consultation: formData.video_consultation,
        preferred_platform: formData.preferred_platform || null,
        online_consultation_fee: formData.online_consultation_fee ? parseInt(formData.online_consultation_fee) : null,
        degree_certificate_url: formData.degree_certificate_url,
        pmc_certificate_url: formData.pmc_certificate_url,
        cnic_url: formData.cnic_url,
        bio: formData.bio || null,
        areas_of_expertise: formData.areas_of_expertise ? formData.areas_of_expertise.split(',').map(s => s.trim()) : [],
        services_offered: formData.services_offered ? formData.services_offered.split(',').map(s => s.trim()) : [],
        languages_spoken: formData.languages_spoken,
        terms_accepted: formData.terms_accepted,
        privacy_accepted: formData.privacy_accepted,
        status: "pending",
      }).select("id").single();

      if (error) throw error;

      // Save hospital associations (only for hospitals from database, not custom ones)
      if (doctorData && selectedHospitals.length > 0) {
        const hospitalAssociations = selectedHospitals
          .filter(h => !h.is_custom)
          .map(h => ({
            doctor_id: doctorData.id,
            hospital_id: h.hospital_id,
            department: h.department || null,
            is_current: h.is_current,
          }));

        if (hospitalAssociations.length > 0) {
          await supabase.from("hospital_doctors").insert(hospitalAssociations);
        }
      }

      toast.success("Registration submitted successfully! We'll review your profile within 24-48 hours.");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit registration");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { num: 1, title: "Personal", icon: User },
    { num: 2, title: "Professional", icon: Stethoscope },
    { num: 3, title: "Practice", icon: Building2 },
    { num: 4, title: "Schedule", icon: Calendar },
    { num: 5, title: "Contact", icon: Phone },
    { num: 6, title: "Online", icon: Video },
    { num: 7, title: "Documents", icon: FileText },
    { num: 8, title: "Profile", icon: User },
    { num: 9, title: "Legal", icon: Shield },
  ];

  const FileUploadButton = ({ 
    field, 
    label, 
    accept, 
    isDocument = false 
  }: { 
    field: string; 
    label: string; 
    accept: string; 
    isDocument?: boolean;
  }) => {
    const value = formData[field as keyof typeof formData] as string;
    const isUploading = uploadingField === field;
    
    return (
      <div>
        <Label className="text-xs">{label} *</Label>
        <div className="mt-1">
          {value ? (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 flex-1 truncate">File uploaded</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleInputChange(field, "")}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {isUploading ? "Uploading..." : "Click to upload"}
              </span>
              <input
                type="file"
                accept={accept}
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (isDocument) {
                      handleDocumentUpload(file, field);
                    } else {
                      handleFileUpload(file, field, 'doctor-photos');
                    }
                  }
                }}
              />
            </label>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-8">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-lg font-bold text-foreground">Doctor Registration</h1>
              <p className="text-xs text-muted-foreground">
                Complete your profile to start accepting appointments
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-center mb-6 overflow-x-auto pb-2">
              <div className="flex gap-1">
                {steps.map((step) => (
                  <button
                    key={step.num}
                    onClick={() => step.num < currentStep && setCurrentStep(step.num)}
                    className={`flex flex-col items-center p-1.5 rounded-lg min-w-[50px] transition-colors ${
                      currentStep === step.num
                        ? "bg-primary text-primary-foreground"
                        : step.num < currentStep
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <step.icon className="w-3 h-3" />
                    <span className="text-[10px] mt-0.5">{step.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">
                  Step {currentStep}: {steps[currentStep - 1].title} Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <>
                    <div>
                      <Label className="text-xs">Full Name *</Label>
                      <Input
                        value={formData.full_name}
                        onChange={(e) => handleInputChange("full_name", e.target.value)}
                        placeholder="Dr. Muhammad Ahmed"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Gender *</Label>
                        <Select value={formData.gender} onValueChange={(v) => handleInputChange("gender", v)}>
                          <SelectTrigger className="text-xs h-8">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male" className="text-xs">Male</SelectItem>
                            <SelectItem value="female" className="text-xs">Female</SelectItem>
                            <SelectItem value="other" className="text-xs">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Date of Birth *</Label>
                        <Input
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                    <FileUploadButton field="photo_url" label="Profile Photo (Optional)" accept="image/*" />
                  </>
                )}

                {/* Step 2: Professional Information */}
                {currentStep === 2 && (
                  <>
                    <div>
                      <Label className="text-xs">Medical Specialty *</Label>
                      <Select value={formData.specialization_id} onValueChange={(v) => handleInputChange("specialization_id", v)}>
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          {specializations.map((spec) => (
                            <SelectItem key={spec.id} value={spec.id} className="text-xs">
                              {spec.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Sub-Specialty (if any)</Label>
                      <Input
                        value={formData.sub_specialty}
                        onChange={(e) => handleInputChange("sub_specialty", e.target.value)}
                        placeholder="e.g., Interventional Cardiology"
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Qualifications *</Label>
                      <Input
                        value={formData.qualification}
                        onChange={(e) => handleInputChange("qualification", e.target.value)}
                        placeholder="e.g., MBBS, FCPS (Medicine)"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Years of Experience *</Label>
                        <Input
                          type="number"
                          value={formData.experience_years}
                          onChange={(e) => handleInputChange("experience_years", e.target.value)}
                          placeholder="e.g., 10"
                          className="text-xs h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Registration Council</Label>
                        <Select value={formData.registration_council} onValueChange={(v) => handleInputChange("registration_council", v)}>
                          <SelectTrigger className="text-xs h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PMC" className="text-xs">PMC (Pakistan Medical Commission)</SelectItem>
                            <SelectItem value="PMDC" className="text-xs">PMDC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">PMC/PMDC Registration Number *</Label>
                      <Input
                        value={formData.pmc_number}
                        onChange={(e) => handleInputChange("pmc_number", e.target.value)}
                        placeholder="e.g., 12345-P"
                        className="text-xs h-8"
                      />
                    </div>
                  </>
                )}

                {/* Step 3: Practice Details */}
                {currentStep === 3 && (
                  <>
                    {/* Hospital Affiliations */}
                    <HospitalSelector
                      selectedHospitals={selectedHospitals}
                      onChange={setSelectedHospitals}
                      maxSelections={5}
                    />

                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs text-muted-foreground mb-3">Or enter hospital name manually (for quick setup)</p>
                      <div>
                        <Label className="text-xs">Hospital Name (Optional)</Label>
                        <Input
                          value={formData.hospital_name}
                          onChange={(e) => handleInputChange("hospital_name", e.target.value)}
                          placeholder="e.g., Aga Khan University Hospital"
                          className="text-xs h-8"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Clinic Name *</Label>
                      <Input
                        value={formData.clinic_name}
                        onChange={(e) => handleInputChange("clinic_name", e.target.value)}
                        placeholder="e.g., City Care Clinic"
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Clinic Address</Label>
                      <Textarea
                        value={formData.clinic_address}
                        onChange={(e) => handleInputChange("clinic_address", e.target.value)}
                        placeholder="Full address with area"
                        className="text-xs min-h-[60px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">City *</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        placeholder="e.g., Karachi"
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Consultation Type *</Label>
                      <Select value={formData.consultation_type} onValueChange={(v) => handleInputChange("consultation_type", v)}>
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="physical" className="text-xs">Physical Only</SelectItem>
                          <SelectItem value="online" className="text-xs">Online Only</SelectItem>
                          <SelectItem value="both" className="text-xs">Both Physical & Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Consultation Fee (Rs.) *</Label>
                        <Input
                          type="number"
                          value={formData.consultation_fee}
                          onChange={(e) => handleInputChange("consultation_fee", e.target.value)}
                          placeholder="e.g., 2000"
                          className="text-xs h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Follow-up Fee (Rs.)</Label>
                        <Input
                          type="number"
                          value={formData.followup_fee}
                          onChange={(e) => handleInputChange("followup_fee", e.target.value)}
                          placeholder="e.g., 1000"
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Step 4: Availability */}
                {currentStep === 4 && (
                  <>
                    <div>
                      <Label className="text-xs mb-2 block">Available Days *</Label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleDayToggle(day)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              formData.available_days.includes(day)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {day.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
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
                      <Label className="text-xs">Appointment Duration (minutes)</Label>
                      <Select value={formData.appointment_duration} onValueChange={(v) => handleInputChange("appointment_duration", v)}>
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
                      <Label htmlFor="emergency" className="text-xs">Available for emergency consultations</Label>
                    </div>
                  </>
                )}

                {/* Step 5: Contact Information */}
                {currentStep === 5 && (
                  <>
                    <div>
                      <Label className="text-xs">Mobile Number *</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="03XX-XXXXXXX"
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Email Address *</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="doctor@example.com"
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">WhatsApp Number (optional)</Label>
                      <Input
                        value={formData.whatsapp_number}
                        onChange={(e) => handleInputChange("whatsapp_number", e.target.value)}
                        placeholder="03XX-XXXXXXX"
                        className="text-xs h-8"
                      />
                    </div>
                  </>
                )}

                {/* Step 6: Online Consultation */}
                {currentStep === 6 && (
                  <>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="video"
                        checked={formData.video_consultation}
                        onCheckedChange={(checked) => handleInputChange("video_consultation", checked)}
                      />
                      <Label htmlFor="video" className="text-xs">I offer video consultations</Label>
                    </div>
                    {formData.video_consultation && (
                      <>
                        <div>
                          <Label className="text-xs">Preferred Platform</Label>
                          <Select value={formData.preferred_platform} onValueChange={(v) => handleInputChange("preferred_platform", v)}>
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
                        <div>
                          <Label className="text-xs">Online Consultation Fee (Rs.)</Label>
                          <Input
                            type="number"
                            value={formData.online_consultation_fee}
                            onChange={(e) => handleInputChange("online_consultation_fee", e.target.value)}
                            placeholder="e.g., 1500"
                            className="text-xs h-8"
                          />
                        </div>
                      </>
                    )}
                    {!formData.video_consultation && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Enable video consultation to configure online appointment settings
                      </p>
                    )}
                  </>
                )}

                {/* Step 7: Documents */}
                {currentStep === 7 && (
                  <>
                    <p className="text-xs text-muted-foreground mb-3">
                      Upload your documents for verification. These will be reviewed by our team.
                    </p>
                    <FileUploadButton 
                      field="degree_certificate_url" 
                      label="Medical Degree Certificate" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      isDocument
                    />
                    <FileUploadButton 
                      field="pmc_certificate_url" 
                      label="PMC/PMDC Registration Certificate" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      isDocument
                    />
                    <FileUploadButton 
                      field="cnic_url" 
                      label="CNIC (Front & Back)" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      isDocument
                    />
                  </>
                )}

                {/* Step 8: Profile Content */}
                {currentStep === 8 && (
                  <>
                    <div>
                      <Label className="text-xs">Professional Bio</Label>
                      <Textarea
                        value={formData.bio}
                        onChange={(e) => handleInputChange("bio", e.target.value)}
                        placeholder="Write a short bio about yourself and your practice..."
                        className="text-xs min-h-[80px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Areas of Expertise (comma separated)</Label>
                      <Input
                        value={formData.areas_of_expertise}
                        onChange={(e) => handleInputChange("areas_of_expertise", e.target.value)}
                        placeholder="e.g., Diabetes, Hypertension, Heart Disease"
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Services Offered (comma separated)</Label>
                      <Input
                        value={formData.services_offered}
                        onChange={(e) => handleInputChange("services_offered", e.target.value)}
                        placeholder="e.g., General Checkup, ECG, Echo"
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
                  </>
                )}

                {/* Step 9: Legal */}
                {currentStep === 9 && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="terms"
                          checked={formData.terms_accepted}
                          onCheckedChange={(checked) => handleInputChange("terms_accepted", checked)}
                          className="mt-0.5"
                        />
                        <Label htmlFor="terms" className="text-xs">
                          I accept the <a href="/terms" className="text-primary underline" target="_blank">Terms & Conditions</a> *
                        </Label>
                      </div>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="privacy"
                          checked={formData.privacy_accepted}
                          onCheckedChange={(checked) => handleInputChange("privacy_accepted", checked)}
                          className="mt-0.5"
                        />
                        <Label htmlFor="privacy" className="text-xs">
                          I accept the <a href="/privacy" className="text-primary underline" target="_blank">Privacy Policy</a> *
                        </Label>
                      </div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg mt-4">
                      <p className="text-xs text-muted-foreground">
                        By submitting this form, you confirm that all the information provided is accurate and you authorize us to verify your credentials.
                      </p>
                    </div>
                  </>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-2 pt-4">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={handlePrevious}
                    >
                      Previous
                    </Button>
                  )}
                  <div className="flex-1" />
                  {currentStep < 9 ? (
                    <Button
                      type="button"
                      size="sm"
                      className="text-xs"
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="text-xs"
                      onClick={handleSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Registration"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DoctorRegister;
