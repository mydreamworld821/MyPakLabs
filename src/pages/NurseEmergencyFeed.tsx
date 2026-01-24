import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  MapPin,
  Clock,
  Loader2,
  DollarSign,
  Timer,
  Syringe,
  CheckCircle2,
  Bell,
  Navigation,
  RefreshCw,
  Send,
  XCircle,
  MapPinned
} from "lucide-react";

interface EmergencyRequest {
  id: string;
  patient_name: string;
  location_lat: number;
  location_lng: number;
  location_address: string | null;
  city: string | null;
  services_needed: string[];
  urgency: string;
  patient_offer_price: number | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface NurseProfile {
  id: string;
  full_name: string;
  services_offered: string[];
  home_visit_radius: number | null;
  city: string | null;
  per_visit_fee: number | null;
}

const SERVICES_MAP: Record<string, string> = {
  iv_cannula: "IV Cannula",
  injection: "Injection",
  wound_dressing: "Wound Dressing",
  medication_administration: "Medication",
  vital_signs: "Vital Signs",
  catheterization: "Catheterization",
  nebulization: "Nebulization",
  blood_sugar: "Blood Sugar",
  elderly_care: "Elderly Care",
  post_surgical: "Post-Surgical",
};

const URGENCY_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  within_1_hour: "bg-orange-500",
  scheduled: "bg-blue-500",
};

// Haversine formula to calculate distance
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function NurseEmergencyFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getCurrentPosition, loading: locationLoading } = useGeolocation();
  const [loading, setLoading] = useState(true);
  const [nurseProfile, setNurseProfile] = useState<NurseProfile | null>(null);
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [myOffers, setMyOffers] = useState<Record<string, boolean>>({});
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Offer dialog state
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerEta, setOfferEta] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    fetchNurseProfile();
    handleGetLocation();
  }, [user]);

  useEffect(() => {
    if (!nurseProfile) return;
    
    fetchRequests();

    // Subscribe to real-time updates for the feed page
    const channel = supabase
      .channel('emergency-requests-feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_nursing_requests',
          filter: `status=eq.live`,
        },
        () => {
          fetchRequests();
          // Play notification sound for new requests (in-page sound)
          playNotificationSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [nurseProfile, currentLocation]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log("Audio not available");
    }
  };

  const fetchNurseProfile = async () => {
    const { data, error } = await supabase
      .from("nurses")
      .select("id, full_name, services_offered, home_visit_radius, city, per_visit_fee")
      .eq("user_id", user?.id)
      .eq("status", "approved")
      .maybeSingle();

    if (error || !data) {
      toast({
        title: "Access Denied",
        description: "Only approved nurses can access emergency requests",
        variant: "destructive",
      });
      navigate("/nurse-dashboard");
      return;
    }

    setNurseProfile(data);
    if (data.per_visit_fee) {
      setOfferPrice(data.per_visit_fee.toString());
    }
  };

  const handleGetLocation = async () => {
    const position = await getCurrentPosition();
    if (position) {
      setCurrentLocation({
        lat: position.latitude,
        lng: position.longitude,
      });
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    
    const { data: requestsData } = await supabase
      .from("emergency_nursing_requests")
      .select("*")
      .eq("status", "live")
      .order("created_at", { ascending: false });

    if (requestsData) {
      // Filter by distance if we have location
      let filteredRequests = requestsData;
      if (currentLocation && nurseProfile?.home_visit_radius) {
        filteredRequests = requestsData.filter((req) => {
          const distance = calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            req.location_lat,
            req.location_lng
          );
          return distance <= (nurseProfile.home_visit_radius || 50);
        });
      }
      setRequests(filteredRequests);
    }

    // Fetch my existing offers
    if (nurseProfile) {
      const { data: offersData } = await supabase
        .from("nurse_offers")
        .select("request_id")
        .eq("nurse_id", nurseProfile.id);

      if (offersData) {
        const offersMap: Record<string, boolean> = {};
        offersData.forEach((o) => { offersMap[o.request_id] = true; });
        setMyOffers(offersMap);
      }
    }

    setLoading(false);
  };

  const openOfferDialog = (request: EmergencyRequest) => {
    setSelectedRequest(request);
    setOfferDialogOpen(true);
  };

  const handleSubmitOffer = async () => {
    if (!selectedRequest || !nurseProfile || !offerPrice || !offerEta) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setSubmittingOffer(true);

    let distance = null;
    if (currentLocation) {
      distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        selectedRequest.location_lat,
        selectedRequest.location_lng
      );
    }

    const { error } = await supabase
      .from("nurse_offers")
      .insert({
        request_id: selectedRequest.id,
        nurse_id: nurseProfile.id,
        offered_price: parseInt(offerPrice),
        eta_minutes: parseInt(offerEta),
        message: offerMessage || null,
        nurse_lat: currentLocation?.lat || null,
        nurse_lng: currentLocation?.lng || null,
        distance_km: distance ? Math.round(distance * 100) / 100 : null,
      });

    setSubmittingOffer(false);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already Sent", description: "You've already sent an offer for this request", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to submit offer", variant: "destructive" });
      }
      return;
    }

    toast({
      title: "Offer Sent! 🎉",
      description: "The patient will review your offer",
    });

    setOfferDialogOpen(false);
    setOfferMessage("");
    setMyOffers(prev => ({ ...prev, [selectedRequest.id]: true }));
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (!nurseProfile && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <XCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground mb-4">Only approved nurses can access this page</p>
        <Button onClick={() => navigate("/nurse-dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-background">
      <Navbar />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="w-6 h-6 text-red-600" />
              Emergency Requests
            </h1>
            <p className="text-sm text-muted-foreground">
              Respond to nearby patients needing urgent care
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleGetLocation} disabled={locationLoading}>
              <Navigation className="w-4 h-4 mr-1" />
              {currentLocation ? "📍" : "GPS"}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchRequests}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Location Warning */}
        {!currentLocation && !locationLoading && (
          <Card className="mb-4 border-amber-200 bg-amber-50">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-amber-800">
                <MapPinned className="w-5 h-5" />
                <span className="text-sm">Enable GPS to see requests within your service radius</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Requests List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        ) : requests.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Active Requests</h3>
              <p className="text-muted-foreground">
                No emergency requests in your area right now.
                <br />We'll notify you when new requests come in.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const distance = currentLocation
                ? calculateDistance(
                    currentLocation.lat,
                    currentLocation.lng,
                    request.location_lat,
                    request.location_lng
                  )
                : null;

              return (
                <Card
                  key={request.id}
                  className={`overflow-hidden ${
                    request.urgency === "critical" ? "border-red-300 bg-red-50/50" : ""
                  }`}
                >
                  <div className={`h-1.5 ${URGENCY_COLORS[request.urgency]}`} />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={URGENCY_COLORS[request.urgency]}>
                            {request.urgency === "critical" ? "🚨 CRITICAL" : 
                             request.urgency === "within_1_hour" ? "⏰ URGENT" : "📅 SCHEDULED"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(request.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{request.city || "Unknown location"}</span>
                          {distance !== null && (
                            <Badge variant="outline" className="text-xs">
                              {distance.toFixed(1)} km away
                            </Badge>
                          )}
                        </div>
                      </div>
                      {request.patient_offer_price && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Patient offers</p>
                          <p className="font-bold text-green-600">
                            PKR {request.patient_offer_price.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {request.services_needed.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {SERVICES_MAP[s] || s}
                        </Badge>
                      ))}
                    </div>

                    {request.notes && (
                      <p className="text-sm text-muted-foreground mb-3 italic">
                        "{request.notes}"
                      </p>
                    )}

                    <div className="flex gap-2">
                      {myOffers[request.id] ? (
                        <Button className="flex-1" variant="outline" disabled>
                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                          Offer Sent
                        </Button>
                      ) : (
                        <Button
                          className="flex-1 bg-red-600 hover:bg-red-700"
                          onClick={() => openOfferDialog(request)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Offer
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Offer Dialog */}
        <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Your Offer</DialogTitle>
              <DialogDescription>
                Set your price and estimated arrival time
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Your Price (PKR) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₨</span>
                  <Input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="e.g., 2000"
                    className="pl-8"
                  />
                </div>
                {selectedRequest?.patient_offer_price && (
                  <p className="text-xs text-muted-foreground">
                    Patient offered: PKR {selectedRequest.patient_offer_price.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Estimated Arrival Time (minutes) *</Label>
                <div className="relative">
                  <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={offerEta}
                    onChange={(e) => setOfferEta(e.target.value)}
                    placeholder="e.g., 20"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Message (optional)</Label>
                <Textarea
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="e.g., ICU experienced, bringing all required equipment..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOfferDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleSubmitOffer}
                disabled={submittingOffer || !offerPrice || !offerEta}
              >
                {submittingOffer ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Send Offer <Send className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}
