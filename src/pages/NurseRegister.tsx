import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  GraduationCap, 
  Briefcase, 
  Heart,
  Calendar, 
  Phone, 
  FileText, 
  Shield,
  Upload,
  X,
  CheckCircle,
  Award
} from "lucide-react";
import useCities from "@/hooks/useCities";

const QUALIFICATIONS = [
  "LPN (Licensed Practical Nurse)",
  "RN (Registered Nurse)",
  "BSc Nursing",
  "Post-RN BSc Nursing",
  "Diploma in Nursing",
  "Nursing Certificate (up to 6 months)"
];

// Qualifications that require minimum 1 year experience
const SHORT_DURATION_QUALIFICATIONS = [
  "Nursing Certificate (up to 6 months)"
];

const DEPARTMENTS = [
  "ICU", "Emergency", "OT", "Medical Ward", "Surgical Ward", 
  "Pediatric", "Geriatric Care", "Maternity", "Dialysis"
];

const SERVICES = [
  "Injection (IM / IV)",
  "IV Cannula Insertion",
  "IV Medication Administration",
  "Wound Dressing",
  "Diabetic Foot Care",
  "Catheterization",
  "NG Tube Insertion",
  "Tracheostomy Care",
  "Oxygen Therapy",
  "Nebulization",
  "Blood Pressure Monitoring",
  "Blood Sugar Monitoring",
  "Post-operative Care",
  "Elderly Care",
  "Infection Control Care",
  "Bedridden Patient Care",
  "Medication Administration at Home"
];

const CERTIFICATIONS = [
  "ICU Certified",
  "BLS / CPR Certified",
  "Infection Control Training",
  "Patient Handling & Safety",
  "COVID Care Training"
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHIFTS = ["Morning", "Evening", "Night"];
const LANGUAGES = ["Urdu", "English", "Punjabi", "Sindhi", "Pashto", "Balochi", "Saraiki"];
const EMPLOYMENT_TYPES = ["Hospital", "Clinic", "Home Care", "Freelance"];

const NurseRegister = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cities } = useCities();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    // Personal
    full_name: "",
    cnic: "",
    gender: "",
    date_of_birth: "",
    photo_url: "",
    phone: "",
    whatsapp_number: "",
    email: "",
    city: "",
    area_of_service: "",
    home_visit_radius: "10",
    
    // Professional
    qualification: "",
    institute_name: "",
    year_of_completion: "",
    pnc_number: "",
    pnc_expiry_date: "",
    degree_certificate_url: "",
    pnc_card_url: "",
    
    // Experience
    experience_years: "",
    current_employment: "",
    previous_workplaces: "",
    department_experience: [] as string[],
    
    // Services
    services_offered: [] as string[],
    
    // Availability
    available_days: [] as string[],
    available_shifts: [] as string[],
    emergency_available: false,
    per_visit_fee: "",
    per_hour_fee: "",
    monthly_package_fee: "",
    fee_negotiable: true,
    
    // Skills
    certifications: [] as string[],
    certificate_urls: [] as string[],
    
    // Languages
    languages_spoken: ["Urdu"] as string[],
    
    // Legal
    terms_accepted: false,
    background_check_consent: false,
    ethics_accepted: false,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth", { state: { from: "/nurse-register" } });
      return;
    }
    setFormData(prev => ({ ...prev, email: user.email || "" }));
  }, [user, navigate]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: string, value: string) => {
    setFormData(prev => {
      const arr = prev[field as keyof typeof prev] as string[];
      return {
        ...prev,
        [field]: arr.includes(value)
          ? arr.filter(v => v !== value)
          : [...arr, value]
      };
    });
  };

  const handleFileUpload = async (file: File, field: string, bucket: string, isPublic: boolean = false) => {
    if (!user) return;
    
    setUploadingField(field);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${field}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      if (isPublic) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        handleInputChange(field, urlData.publicUrl);
      } else {
        handleInputChange(field, fileName);
      }
      toast.success("File uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploadingField(null);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.full_name || !formData.gender || !formData.date_of_birth || !formData.phone || !formData.city) {
          toast.error("Please fill all required personal information fields");
          return false;
        }
        break;
      case 2:
        if (!formData.qualification || !formData.pnc_number || !formData.experience_years) {
          toast.error("Please fill qualification, PNC number, and experience");
          return false;
        }
        // Validate minimum 1 year experience for short-duration qualifications
        if (SHORT_DURATION_QUALIFICATIONS.includes(formData.qualification)) {
          const expYears = parseInt(formData.experience_years);
          if (isNaN(expYears) || expYears < 1) {
            toast.error("Nursing Certificate (up to 6 months) requires minimum 1 year of experience");
            return false;
          }
        }
        break;
      case 3:
        if (formData.department_experience.length === 0) {
          toast.error("Please select at least one department experience");
          return false;
        }
        break;
      case 4:
        if (formData.services_offered.length === 0) {
          toast.error("Please select at least one service you offer");
          return false;
        }
        break;
      case 5:
        if (formData.available_days.length === 0 || formData.available_shifts.length === 0 || !formData.per_visit_fee) {
          toast.error("Please select availability and set your visit fee");
          return false;
        }
        break;
      case 6:
        // Skills are optional
        break;
      case 7:
        // At least one document is required (either diploma/degree OR PNC card)
        if (!formData.degree_certificate_url && !formData.pnc_card_url) {
          toast.error("Please upload at least one document (Diploma/Degree OR PNC Card)");
          return false;
        }
        break;
      case 8:
        if (!formData.terms_accepted || !formData.background_check_consent || !formData.ethics_accepted) {
          toast.error("Please accept all terms and consents");
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 8));
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

    if (!validateStep(8)) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("nurses").insert({
        user_id: user.id,
        full_name: formData.full_name.trim(),
        cnic: formData.cnic || null,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        photo_url: formData.photo_url || null,
        phone: formData.phone.trim(),
        whatsapp_number: formData.whatsapp_number || null,
        email: formData.email.trim(),
        city: formData.city,
        area_of_service: formData.area_of_service || null,
        home_visit_radius: parseInt(formData.home_visit_radius) || 10,
        qualification: formData.qualification,
        institute_name: formData.institute_name || null,
        year_of_completion: formData.year_of_completion ? parseInt(formData.year_of_completion) : null,
        pnc_number: formData.pnc_number.trim(),
        pnc_expiry_date: formData.pnc_expiry_date || null,
        degree_certificate_url: formData.degree_certificate_url || null,
        pnc_card_url: formData.pnc_card_url || null,
        experience_years: parseInt(formData.experience_years),
        current_employment: formData.current_employment || null,
        previous_workplaces: formData.previous_workplaces ? formData.previous_workplaces.split(',').map(s => s.trim()) : [],
        department_experience: formData.department_experience,
        services_offered: formData.services_offered,
        available_days: formData.available_days,
        available_shifts: formData.available_shifts,
        emergency_available: formData.emergency_available,
        per_visit_fee: parseInt(formData.per_visit_fee),
        per_hour_fee: formData.per_hour_fee ? parseInt(formData.per_hour_fee) : null,
        monthly_package_fee: formData.monthly_package_fee ? parseInt(formData.monthly_package_fee) : null,
        fee_negotiable: formData.fee_negotiable,
        certifications: formData.certifications,
        languages_spoken: formData.languages_spoken,
        terms_accepted: formData.terms_accepted,
        background_check_consent: formData.background_check_consent,
        ethics_accepted: formData.ethics_accepted,
        status: "pending",
      });

      if (error) throw error;

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
    { num: 2, title: "Qualification", icon: GraduationCap },
    { num: 3, title: "Experience", icon: Briefcase },
    { num: 4, title: "Services", icon: Heart },
    { num: 5, title: "Availability", icon: Calendar },
    { num: 6, title: "Skills", icon: Award },
    { num: 7, title: "Documents", icon: FileText },
    { num: 8, title: "Legal", icon: Shield },
  ];

  const FileUploadButton = ({ 
    field, 
    label, 
    accept, 
    bucket,
    isPublic = false
  }: { 
    field: string; 
    label: string; 
    accept: string; 
    bucket: string;
    isPublic?: boolean;
  }) => {
    const value = formData[field as keyof typeof formData] as string;
    const isUploading = uploadingField === field;
    
    return (
      <div>
        <Label className="text-xs">{label}</Label>
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
            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-rose-400 transition-colors">
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
                    handleFileUpload(file, field, bucket, isPublic);
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
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-rose-600" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Nurse Registration</h1>
              <p className="text-xs text-muted-foreground">
                Complete your profile to start offering home nursing services
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
                        ? "bg-rose-600 text-white"
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
                  Step {currentStep}: {steps[currentStep - 1].title}
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
                        placeholder="Enter your full name"
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
                            <SelectItem value="female" className="text-xs">Female</SelectItem>
                            <SelectItem value="male" className="text-xs">Male</SelectItem>
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
                    <div>
                      <Label className="text-xs">CNIC (Optional - for verification)</Label>
                      <Input
                        value={formData.cnic}
                        onChange={(e) => handleInputChange("cnic", e.target.value)}
                        placeholder="12345-1234567-1"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Phone Number *</Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder="0300-1234567"
                          className="text-xs h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">WhatsApp Number</Label>
                        <Input
                          value={formData.whatsapp_number}
                          onChange={(e) => handleInputChange("whatsapp_number", e.target.value)}
                          placeholder="0300-1234567"
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        type="email"
                        className="text-xs h-8"
                        disabled
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">City *</Label>
                        <Select value={formData.city} onValueChange={(v) => handleInputChange("city", v)}>
                          <SelectTrigger className="text-xs h-8">
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city.id} value={city.name} className="text-xs">
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Area of Service</Label>
                        <Input
                          value={formData.area_of_service}
                          onChange={(e) => handleInputChange("area_of_service", e.target.value)}
                          placeholder="e.g., DHA, Gulberg"
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Home Visit Radius (km)</Label>
                      <Input
                        type="number"
                        value={formData.home_visit_radius}
                        onChange={(e) => handleInputChange("home_visit_radius", e.target.value)}
                        placeholder="10"
                        className="text-xs h-8"
                      />
                    </div>
                    <FileUploadButton 
                      field="photo_url" 
                      label="Profile Photo (Optional)" 
                      accept="image/*" 
                      bucket="nurse-photos"
                      isPublic
                    />
                  </>
                )}

                {/* Step 2: Professional Qualification */}
                {currentStep === 2 && (
                  <>
                    <div>
                      <Label className="text-xs">Highest Nursing Qualification *</Label>
                      <Select value={formData.qualification} onValueChange={(v) => handleInputChange("qualification", v)}>
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue placeholder="Select qualification" />
                        </SelectTrigger>
                        <SelectContent>
                          {QUALIFICATIONS.map((q) => (
                            <SelectItem key={q} value={q} className="text-xs">{q}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Institute / College Name</Label>
                      <Input
                        value={formData.institute_name}
                        onChange={(e) => handleInputChange("institute_name", e.target.value)}
                        placeholder="Enter institute name"
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Year of Completion</Label>
                      <Input
                        type="number"
                        value={formData.year_of_completion}
                        onChange={(e) => handleInputChange("year_of_completion", e.target.value)}
                        placeholder="2020"
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">PNC Registration Number *</Label>
                      <Input
                        value={formData.pnc_number}
                        onChange={(e) => handleInputChange("pnc_number", e.target.value)}
                        placeholder="PNC-XXXXX"
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">PNC Registration Expiry Date</Label>
                      <Input
                        type="date"
                        value={formData.pnc_expiry_date}
                        onChange={(e) => handleInputChange("pnc_expiry_date", e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Total Experience (Years) *</Label>
                      <Input
                        type="number"
                        value={formData.experience_years}
                        onChange={(e) => handleInputChange("experience_years", e.target.value)}
                        placeholder="3"
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Current Employment</Label>
                      <Select value={formData.current_employment} onValueChange={(v) => handleInputChange("current_employment", v)}>
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYMENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type} className="text-xs">{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Step 3: Experience Details */}
                {currentStep === 3 && (
                  <>
                    <div>
                      <Label className="text-xs mb-2 block">Department Experience *</Label>
                      <p className="text-[10px] text-muted-foreground mb-2">Select all departments you have worked in</p>
                      <div className="grid grid-cols-2 gap-2">
                        {DEPARTMENTS.map((dept) => (
                          <div
                            key={dept}
                            onClick={() => handleArrayToggle("department_experience", dept)}
                            className={`p-2 border rounded-lg cursor-pointer text-xs transition-colors ${
                              formData.department_experience.includes(dept)
                                ? "bg-rose-100 border-rose-400 text-rose-700"
                                : "hover:border-rose-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox checked={formData.department_experience.includes(dept)} />
                              <span>{dept}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Previous Workplaces (Optional)</Label>
                      <Input
                        value={formData.previous_workplaces}
                        onChange={(e) => handleInputChange("previous_workplaces", e.target.value)}
                        placeholder="Hospital A, Clinic B (comma separated)"
                        className="text-xs h-8"
                      />
                    </div>
                  </>
                )}

                {/* Step 4: Services Offered */}
                {currentStep === 4 && (
                  <>
                    <div>
                      <Label className="text-xs mb-2 block">Nursing Services You Offer *</Label>
                      <p className="text-[10px] text-muted-foreground mb-2">Select all services you can provide</p>
                      <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto">
                        {SERVICES.map((service) => (
                          <div
                            key={service}
                            onClick={() => handleArrayToggle("services_offered", service)}
                            className={`p-2 border rounded-lg cursor-pointer text-xs transition-colors ${
                              formData.services_offered.includes(service)
                                ? "bg-rose-100 border-rose-400 text-rose-700"
                                : "hover:border-rose-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox checked={formData.services_offered.includes(service)} />
                              <span>{service}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Step 5: Availability & Charges */}
                {currentStep === 5 && (
                  <>
                    <div>
                      <Label className="text-xs mb-2 block">Available Days *</Label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleArrayToggle("available_days", day)}
                            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                              formData.available_days.includes(day)
                                ? "bg-rose-600 text-white"
                                : "bg-muted hover:bg-rose-100"
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs mb-2 block">Available Shifts *</Label>
                      <div className="flex flex-wrap gap-2">
                        {SHIFTS.map((shift) => (
                          <button
                            key={shift}
                            type="button"
                            onClick={() => handleArrayToggle("available_shifts", shift)}
                            className={`px-4 py-2 rounded-lg text-xs transition-colors ${
                              formData.available_shifts.includes(shift)
                                ? "bg-rose-600 text-white"
                                : "bg-muted hover:bg-rose-100"
                            }`}
                          >
                            {shift}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                      <Checkbox
                        checked={formData.emergency_available}
                        onCheckedChange={(checked) => handleInputChange("emergency_available", checked)}
                      />
                      <Label className="text-xs">Available for Emergency Calls</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Per Visit Fee (PKR) *</Label>
                        <Input
                          type="number"
                          value={formData.per_visit_fee}
                          onChange={(e) => handleInputChange("per_visit_fee", e.target.value)}
                          placeholder="1000"
                          className="text-xs h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Per Hour Fee (PKR)</Label>
                        <Input
                          type="number"
                          value={formData.per_hour_fee}
                          onChange={(e) => handleInputChange("per_hour_fee", e.target.value)}
                          placeholder="500"
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Monthly Package Fee (PKR - Optional)</Label>
                      <Input
                        type="number"
                        value={formData.monthly_package_fee}
                        onChange={(e) => handleInputChange("monthly_package_fee", e.target.value)}
                        placeholder="40000"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.fee_negotiable}
                        onCheckedChange={(checked) => handleInputChange("fee_negotiable", checked)}
                      />
                      <Label className="text-xs">Fee is Negotiable</Label>
                    </div>
                  </>
                )}

                {/* Step 6: Skills & Certifications */}
                {currentStep === 6 && (
                  <>
                    <div>
                      <Label className="text-xs mb-2 block">Certifications (Optional)</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {CERTIFICATIONS.map((cert) => (
                          <div
                            key={cert}
                            onClick={() => handleArrayToggle("certifications", cert)}
                            className={`p-2 border rounded-lg cursor-pointer text-xs transition-colors ${
                              formData.certifications.includes(cert)
                                ? "bg-rose-100 border-rose-400 text-rose-700"
                                : "hover:border-rose-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox checked={formData.certifications.includes(cert)} />
                              <span>{cert}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs mb-2 block">Languages Spoken</Label>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => handleArrayToggle("languages_spoken", lang)}
                            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                              formData.languages_spoken.includes(lang)
                                ? "bg-rose-600 text-white"
                                : "bg-muted hover:bg-rose-100"
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Step 7: Documents */}
                {currentStep === 7 && (
                  <>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-3">
                      <p className="text-xs text-emerald-800 font-medium">
                        ✓ Upload at least ONE document to continue
                      </p>
                      <p className="text-[10px] text-emerald-700 mt-1">
                        You can upload either your Diploma/Degree OR PNC Card. The second document is optional.
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                      <p className="text-xs text-amber-800">
                        🔒 Your documents will be kept private and only used for verification purposes.
                      </p>
                    </div>
                    
                    {/* Show status of document uploads */}
                    {(formData.degree_certificate_url || formData.pnc_card_url) && (
                      <div className="p-2 bg-green-50 border border-green-200 rounded-lg mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-700">
                          Document uploaded - you can proceed to next step
                        </span>
                      </div>
                    )}
                    
                    <FileUploadButton 
                      field="degree_certificate_url" 
                      label="Nursing Degree/Diploma (Option 1)" 
                      accept=".pdf,image/*" 
                      bucket="nurse-documents"
                    />
                    <p className="text-center text-xs text-muted-foreground my-2">— OR —</p>
                    <FileUploadButton 
                      field="pnc_card_url" 
                      label="PNC Registration Card (Option 2)" 
                      accept=".pdf,image/*" 
                      bucket="nurse-documents"
                    />
                  </>
                )}

                {/* Step 8: Legal & Consent */}
                {currentStep === 8 && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 p-3 border rounded-lg">
                        <Checkbox
                          checked={formData.terms_accepted}
                          onCheckedChange={(checked) => handleInputChange("terms_accepted", checked)}
                          className="mt-0.5"
                        />
                        <div>
                          <Label className="text-xs">I agree to the Terms & Conditions *</Label>
                          <p className="text-[10px] text-muted-foreground">
                            By registering, you agree to our platform terms and service guidelines.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-3 border rounded-lg">
                        <Checkbox
                          checked={formData.background_check_consent}
                          onCheckedChange={(checked) => handleInputChange("background_check_consent", checked)}
                          className="mt-0.5"
                        />
                        <div>
                          <Label className="text-xs">I consent to Background Verification *</Label>
                          <p className="text-[10px] text-muted-foreground">
                            You authorize us to verify your credentials and professional background.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-3 border rounded-lg">
                        <Checkbox
                          checked={formData.ethics_accepted}
                          onCheckedChange={(checked) => handleInputChange("ethics_accepted", checked)}
                          className="mt-0.5"
                        />
                        <div>
                          <Label className="text-xs">I accept the Code of Ethics *</Label>
                          <p className="text-[10px] text-muted-foreground">
                            You commit to maintaining professional ethics and patient care standards.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    className="text-xs"
                  >
                    Previous
                  </Button>
                  {currentStep < 8 ? (
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={handleNext}
                      className="text-xs bg-rose-600 hover:bg-rose-700"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="text-xs bg-rose-600 hover:bg-rose-700"
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

export default NurseRegister;
