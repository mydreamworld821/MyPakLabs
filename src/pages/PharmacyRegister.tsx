import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CitySelect } from "@/components/ui/city-select";
import { 
  Loader2, 
  Store, 
  User, 
  FileText, 
  MapPin, 
  Clock,
  Shield,
  Upload,
  X,
  CheckCircle,
  Phone,
  Truck,
  Navigation
} from "lucide-react";

const PharmacyRegister = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    // Store Info
    name: "",
    owner_name: "",
    license_number: "",
    cnic: "",
    
    // Contact
    phone: "",
    email: "",
    
    // Location
    city: "",
    area: "",
    full_address: "",
    location_lat: "",
    location_lng: "",
    google_maps_url: "",
    
    // Images
    logo_url: "",
    cover_image_url: "",
    
    // Operations
    delivery_available: true,
    is_24_hours: false,
    opening_time: "09:00",
    closing_time: "22:00",
    
    // Legal
    terms_accepted: false,
    privacy_accepted: false,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth", { state: { from: "/pharmacy-register" } });
      return;
    }
    setFormData(prev => ({ ...prev, email: user.email || "" }));
  }, [user, navigate]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File, field: string) => {
    if (!user) return;
    
    setUploadingField(field);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${field}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pharmacy-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('pharmacy-images')
        .getPublicUrl(fileName);

      handleInputChange(field, urlData.publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploadingField(null);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleInputChange("location_lat", latitude.toString());
        handleInputChange("location_lng", longitude.toString());
        toast.success("Location captured successfully!");
        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Please allow location access to auto-fill coordinates");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Location information is unavailable");
            break;
          case error.TIMEOUT:
            toast.error("Location request timed out");
            break;
          default:
            toast.error("An error occurred getting your location");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.name || !formData.owner_name || !formData.license_number) {
          toast.error("Please fill all store information fields");
          return false;
        }
        break;
      case 2:
        if (!formData.phone) {
          toast.error("Please enter phone number");
          return false;
        }
        break;
      case 3:
        if (!formData.city || !formData.area || !formData.full_address) {
          toast.error("Please fill all location fields");
          return false;
        }
        if (!formData.location_lat || !formData.location_lng) {
          toast.error("GPS coordinates are required for nearby pharmacy search. Use 'Get My Location' or enter manually.");
          return false;
        }
        break;
      case 5:
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
      setCurrentStep(prev => Math.min(prev + 1, 5));
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

    if (!validateStep(5)) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("medical_stores").insert({
        user_id: user.id,
        name: formData.name.trim(),
        owner_name: formData.owner_name.trim(),
        license_number: formData.license_number.trim(),
        cnic: formData.cnic || null,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        city: formData.city.trim(),
        area: formData.area.trim(),
        full_address: formData.full_address.trim(),
        location_lat: formData.location_lat ? parseFloat(formData.location_lat) : null,
        location_lng: formData.location_lng ? parseFloat(formData.location_lng) : null,
        google_maps_url: formData.google_maps_url.trim() || null,
        logo_url: formData.logo_url || null,
        cover_image_url: formData.cover_image_url || null,
        delivery_available: formData.delivery_available,
        is_24_hours: formData.is_24_hours,
        opening_time: formData.is_24_hours ? "12:00 AM" : formData.opening_time,
        closing_time: formData.is_24_hours ? "11:59 PM" : formData.closing_time,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Registration submitted successfully! We'll review your application within 24-48 hours.");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit registration");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { num: 1, title: "Store Info", icon: Store },
    { num: 2, title: "Contact", icon: Phone },
    { num: 3, title: "Location", icon: MapPin },
    { num: 4, title: "Operations", icon: Clock },
    { num: 5, title: "Legal", icon: Shield },
  ];

  const FileUploadButton = ({ 
    field, 
    label, 
    accept = "image/*"
  }: { 
    field: string; 
    label: string; 
    accept?: string;
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
              <span className="text-xs text-green-700 flex-1 truncate">Image uploaded</span>
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
                  if (file) handleFileUpload(file, field);
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
              <h1 className="text-lg font-bold text-foreground">Medical Store Registration</h1>
              <p className="text-xs text-muted-foreground">
                Register your pharmacy to receive medicine orders
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-center mb-6 overflow-x-auto pb-2">
              <div className="flex gap-1">
                {steps.map((step) => (
                  <button
                    key={step.num}
                    onClick={() => step.num < currentStep && setCurrentStep(step.num)}
                    className={`flex flex-col items-center p-1.5 rounded-lg min-w-[60px] transition-colors ${
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
                  Step {currentStep}: {steps[currentStep - 1].title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Step 1: Store Info */}
                {currentStep === 1 && (
                  <>
                    <div>
                      <Label className="text-xs">Medical Store Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="e.g., HealthPlus Pharmacy"
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Owner Name *</Label>
                      <Input
                        value={formData.owner_name}
                        onChange={(e) => handleInputChange("owner_name", e.target.value)}
                        placeholder="Full name of owner"
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Drug License Number *</Label>
                      <Input
                        value={formData.license_number}
                        onChange={(e) => handleInputChange("license_number", e.target.value)}
                        placeholder="Enter license number"
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">CNIC (Optional)</Label>
                      <Input
                        value={formData.cnic}
                        onChange={(e) => handleInputChange("cnic", e.target.value)}
                        placeholder="XXXXX-XXXXXXX-X"
                        className="text-xs h-8"
                      />
                    </div>
                    <FileUploadButton field="logo_url" label="Store Logo (Optional)" />
                    <FileUploadButton field="cover_image_url" label="Store Image (Optional)" />
                  </>
                )}

                {/* Step 2: Contact */}
                {currentStep === 2 && (
                  <>
                    <div>
                      <Label className="text-xs">Phone Number *</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="03XX-XXXXXXX"
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="store@example.com"
                        className="text-xs h-8"
                      />
                    </div>
                  </>
                )}

                {/* Step 3: Location */}
                {currentStep === 3 && (
                  <>
                    <div>
                      <Label className="text-xs">City *</Label>
                      <CitySelect
                        value={formData.city}
                        onValueChange={(v) => handleInputChange("city", v)}
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Area / Neighborhood *</Label>
                      <Input
                        value={formData.area}
                        onChange={(e) => handleInputChange("area", e.target.value)}
                        placeholder="e.g., DHA Phase 5, Model Town"
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Full Address *</Label>
                      <Textarea
                        value={formData.full_address}
                        onChange={(e) => handleInputChange("full_address", e.target.value)}
                        placeholder="Complete store address"
                        className="text-xs"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Google Maps URL (Recommended)</Label>
                      <Input
                        value={formData.google_maps_url}
                        onChange={(e) => handleInputChange("google_maps_url", e.target.value)}
                        placeholder="https://maps.google.com/..."
                        className="text-xs h-8"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Paste your pharmacy's Google Maps link for easy directions
                      </p>
                    </div>
                    {/* GPS Coordinates Section */}
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs font-medium text-emerald-800">GPS Coordinates *</p>
                          <p className="text-[10px] text-emerald-600">Required for nearby pharmacy search</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs bg-white border-emerald-300 hover:bg-emerald-100"
                          onClick={handleGetLocation}
                          disabled={gettingLocation}
                        >
                          {gettingLocation ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Navigation className="w-3 h-3 mr-1" />
                          )}
                          {gettingLocation ? "Getting..." : "Get My Location"}
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Latitude *</Label>
                          <Input
                            type="number"
                            step="any"
                            value={formData.location_lat}
                            onChange={(e) => handleInputChange("location_lat", e.target.value)}
                            placeholder="e.g., 31.5204"
                            className="text-xs h-8 bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Longitude *</Label>
                          <Input
                            type="number"
                            step="any"
                            value={formData.location_lng}
                            onChange={(e) => handleInputChange("location_lng", e.target.value)}
                            placeholder="e.g., 74.3587"
                            className="text-xs h-8 bg-white"
                          />
                        </div>
                      </div>
                      {formData.location_lat && formData.location_lng && (
                        <div className="flex items-center gap-1 mt-2 text-emerald-700">
                          <CheckCircle className="w-3 h-3" />
                          <span className="text-[10px]">Location captured</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-[10px] text-blue-700 font-medium">📍 How to get coordinates manually:</p>
                      <ol className="text-[10px] text-blue-600 mt-1 list-decimal list-inside space-y-0.5">
                        <li>Open Google Maps and find your pharmacy</li>
                        <li>Right-click on the exact location</li>
                        <li>Copy the coordinates (e.g., 31.5204, 74.3587)</li>
                        <li>Enter latitude (first number) and longitude (second number)</li>
                      </ol>
                    </div>
                  </>
                )}

                {/* Step 4: Operations */}
                {currentStep === 4 && (
                  <>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs font-medium">Delivery Available</p>
                          <p className="text-[10px] text-muted-foreground">Can deliver medicines to customers</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.delivery_available}
                        onCheckedChange={(v) => handleInputChange("delivery_available", v)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs font-medium">24/7 Store</p>
                          <p className="text-[10px] text-muted-foreground">Open 24 hours</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.is_24_hours}
                        onCheckedChange={(v) => handleInputChange("is_24_hours", v)}
                      />
                    </div>

                    {!formData.is_24_hours && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Opening Time</Label>
                          <Input
                            type="time"
                            value={formData.opening_time}
                            onChange={(e) => handleInputChange("opening_time", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Closing Time</Label>
                          <Input
                            type="time"
                            value={formData.closing_time}
                            onChange={(e) => handleInputChange("closing_time", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Step 5: Legal */}
                {currentStep === 5 && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="terms"
                          checked={formData.terms_accepted}
                          onCheckedChange={(v) => handleInputChange("terms_accepted", v === true)}
                        />
                        <label htmlFor="terms" className="text-xs leading-none cursor-pointer">
                          I accept the <a href="/partner-terms" target="_blank" className="text-primary underline">Partner Terms & Conditions</a> *
                        </label>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="privacy"
                          checked={formData.privacy_accepted}
                          onCheckedChange={(v) => handleInputChange("privacy_accepted", v === true)}
                        />
                        <label htmlFor="privacy" className="text-xs leading-none cursor-pointer">
                          I accept the <a href="/privacy" target="_blank" className="text-primary underline">Privacy Policy</a> *
                        </label>
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="text-xs font-semibold mb-2">Before You Submit:</h4>
                      <ul className="text-[10px] text-muted-foreground space-y-1">
                        <li>• Your application will be reviewed within 24-48 hours</li>
                        <li>• Ensure your license information is accurate</li>
                        <li>• You'll receive notification once approved</li>
                        <li>• After approval, you can start receiving orders</li>
                      </ul>
                    </div>
                  </>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-2 pt-4">
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      className="flex-1 text-xs h-9"
                    >
                      Previous
                    </Button>
                  )}
                  {currentStep < 5 ? (
                    <Button
                      onClick={handleNext}
                      className="flex-1 text-xs h-9"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="flex-1 text-xs h-9"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
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

export default PharmacyRegister;