import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { sendEmergencyNotificationToNurses } from "@/utils/fcmNotifications";
import { sendAdminEmailNotification } from "@/utils/adminNotifications";
import {
  AlertTriangle,
  MapPin,
  Clock,
  Phone,
  Loader2,
  Navigation,
  Syringe,
  Heart,
  Activity,
  Pill,
  UserRound,
  Stethoscope,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Timer
} from "lucide-react";

const EMERGENCY_SERVICES = [
  { id: "iv_cannula", label: "IV Cannula", icon: Syringe },
  { id: "injection", label: "Injection", icon: Syringe },
  { id: "wound_dressing", label: "Wound Dressing", icon: Heart },
  { id: "medication_administration", label: "Medication Administration", icon: Pill },
  { id: "vital_signs", label: "Vital Signs Monitoring", icon: Activity },
  { id: "catheterization", label: "Catheterization", icon: Stethoscope },
  { id: "nebulization", label: "Nebulization", icon: Activity },
  { id: "blood_sugar", label: "Blood Sugar Test", icon: Activity },
  { id: "elderly_care", label: "Elderly Care", icon: UserRound },
  { id: "post_surgical", label: "Post-Surgical Care", icon: Heart },
];

const URGENCY_OPTIONS = [
  { value: "critical", label: "Critical (ASAP)", color: "bg-red-500", description: "Need nurse immediately" },
  { value: "within_1_hour", label: "Within 1 Hour", color: "bg-orange-500", description: "Urgent but not critical" },
  { value: "scheduled", label: "Scheduled", color: "bg-blue-500", description: "Plan ahead" },
];

export default function EmergencyNursingRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    patientName: "",
    patientPhone: "",
    locationLat: null as number | null,
    locationLng: null as number | null,
    locationAddress: "",
    city: "",
    servicesNeeded: [] as string[],
    urgency: "critical" as "critical" | "within_1_hour" | "scheduled",
    patientOfferPrice: "",
    notes: "",
  });

  // Get user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, city")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setFormData(prev => ({
          ...prev,
          patientName: data.full_name || "",
          patientPhone: data.phone || "",
          city: data.city || "",
        }));
      }
    };
    
    fetchProfile();
  }, [user]);

  const getCurrentLocation = useCallback(() => {
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      setLocationLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          locationLat: latitude,
          locationLng: longitude,
        }));
        
        // Try to get address from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          if (data.display_name) {
            setFormData(prev => ({
              ...prev,
              locationAddress: data.display_name,
              city: data.address?.city || data.address?.town || data.address?.village || prev.city,
            }));
          }
        } catch (error) {
          console.log("Could not fetch address");
        }
        
        setLocationLoading(false);
        toast({
          title: "Location Captured",
          description: "Your GPS location has been recorded",
        });
      },
      (error) => {
        setLocationLoading(false);
        toast({
          title: "Location Error",
          description: error.message,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      servicesNeeded: prev.servicesNeeded.includes(serviceId)
        ? prev.servicesNeeded.filter(s => s !== serviceId)
        : [...prev.servicesNeeded, serviceId],
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to request emergency nursing",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!formData.locationLat || !formData.locationLng) {
      toast({
        title: "Location Required",
        description: "Please capture your GPS location",
        variant: "destructive",
      });
      return;
    }

    if (formData.servicesNeeded.length === 0) {
      toast({
        title: "Service Required",
        description: "Please select at least one service",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { data, error } = await supabase
      .from("emergency_nursing_requests")
      .insert({
        patient_id: user.id,
        patient_name: formData.patientName,
        patient_phone: formData.patientPhone,
        location_lat: formData.locationLat,
        location_lng: formData.locationLng,
        location_address: formData.locationAddress,
        city: formData.city,
        services_needed: formData.servicesNeeded,
        urgency: formData.urgency,
        patient_offer_price: formData.patientOfferPrice ? parseInt(formData.patientOfferPrice) : null,
        notes: formData.notes,
        status: "live",
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Send FCM push notification to all nurses
    sendEmergencyNotificationToNurses(
      data.id,
      formData.city,
      formData.servicesNeeded,
      formData.urgency
    ).then((result) => {
      console.log('FCM notification sent:', result);
    });

    // Send email notification to admin and customer
    const { data: { user: authUser } } = await supabase.auth.getUser();
    sendAdminEmailNotification({
      type: 'emergency_request',
      patientName: formData.patientName,
      patientPhone: formData.patientPhone,
      patientEmail: authUser?.email || undefined,
      city: formData.city,
      urgency: formData.urgency,
      services: formData.servicesNeeded,
    }).catch(console.error);

    toast({
      title: "🚨 Emergency Request Live!",
      description: "Nearby nurses are being notified. You'll receive offers soon.",
    });

    navigate(`/emergency-request/${data.id}`);
  };

  const canProceedStep1 = formData.patientName && formData.patientPhone && formData.locationLat;
  const canProceedStep2 = formData.servicesNeeded.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Emergency Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Home Nursing</h1>
          <p className="text-muted-foreground">
            Request immediate nursing care at your doorstep
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step >= s
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-1 mx-1 ${step > s ? "bg-red-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Location & Contact */}
        {step === 1 && (
          <Card className="border-2 border-red-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-600" />
                Your Location & Contact
              </CardTitle>
              <CardDescription>
                We need your exact location to find nearby nurses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Name *</Label>
                  <Input
                    id="patientName"
                    value={formData.patientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                    placeholder="Enter patient name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientPhone">Contact Number *</Label>
                  <Input
                    id="patientPhone"
                    value={formData.patientPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientPhone: e.target.value }))}
                    placeholder="03XX-XXXXXXX"
                  />
                </div>
              </div>

              {/* GPS Location */}
              <div className="space-y-2">
                <Label>GPS Location *</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.locationLat ? "outline" : "default"}
                    className={formData.locationLat ? "border-green-500 text-green-600" : ""}
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                  >
                    {locationLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4 mr-2" />
                    )}
                    {formData.locationLat ? "Location Captured ✓" : "Get My Location"}
                  </Button>
                </div>
                {formData.locationAddress && (
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    📍 {formData.locationAddress}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Your city"
                />
              </div>

              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Services & Urgency */}
        {step === 2 && (
          <Card className="border-2 border-red-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-red-600" />
                Service & Urgency
              </CardTitle>
              <CardDescription>
                Select the nursing services you need
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Services Grid */}
              <div className="space-y-2">
                <Label>Services Needed * (Select multiple)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {EMERGENCY_SERVICES.map((service) => {
                    const Icon = service.icon;
                    const isSelected = formData.servicesNeeded.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        onClick={() => handleServiceToggle(service.id)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-red-200"
                        }`}
                      >
                        <Checkbox checked={isSelected} />
                        <Icon className={`w-4 h-4 ${isSelected ? "text-red-600" : "text-gray-500"}`} />
                        <span className="text-sm font-medium">{service.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Urgency */}
              <div className="space-y-2">
                <Label>Urgency Level *</Label>
                <div className="grid gap-2">
                  {URGENCY_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, urgency: option.value as typeof prev.urgency }))}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.urgency === option.value
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-red-200"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full ${option.color}`} />
                      <div className="flex-1">
                        <p className="font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                      {formData.urgency === option.value && (
                        <CheckCircle2 className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={!canProceedStep2}
                  onClick={() => setStep(3)}
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Price Offer & Notes */}
        {step === 3 && (
          <Card className="border-2 border-red-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-red-600" />
                Your Offer (Optional)
              </CardTitle>
              <CardDescription>
                Set your budget - nurses will respond with their offers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Your Price Offer (PKR)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₨</span>
                  <Input
                    id="price"
                    type="number"
                    value={formData.patientOfferPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientOfferPrice: e.target.value }))}
                    placeholder="e.g., 2000"
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to receive offers without a set budget
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any specific requirements or medical conditions to mention..."
                  rows={3}
                />
              </div>

              {/* Summary */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-semibold">Request Summary</h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Patient:</span> {formData.patientName}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {formData.patientPhone}</p>
                  <p><span className="text-muted-foreground">Location:</span> {formData.city || "GPS Captured"}</p>
                  <p>
                    <span className="text-muted-foreground">Services:</span>{" "}
                    {formData.servicesNeeded.map(s => 
                      EMERGENCY_SERVICES.find(es => es.id === s)?.label
                    ).join(", ")}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Urgency:</span>{" "}
                    <Badge className={URGENCY_OPTIONS.find(u => u.value === formData.urgency)?.color}>
                      {URGENCY_OPTIONS.find(u => u.value === formData.urgency)?.label}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-2" />
                  )}
                  Send Emergency Request
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex gap-3">
            <Timer className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">How it works:</p>
              <ul className="mt-1 text-amber-700 space-y-1">
                <li>• Your request is broadcast to all nearby verified nurses</li>
                <li>• Nurses send you their price and ETA offers</li>
                <li>• Compare and choose the best offer</li>
                <li>• Track nurse arrival in real-time</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
