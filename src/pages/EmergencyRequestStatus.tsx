import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  MapPin,
  Clock,
  Phone,
  Loader2,
  Star,
  CheckCircle2,
  XCircle,
  Timer,
  Navigation,
  Heart,
  MessageSquare,
  User,
  DollarSign,
  Ban,
  Sparkles,
  ArrowRight,
  RefreshCw
} from "lucide-react";

interface NurseOffer {
  id: string;
  nurse_id: string;
  offered_price: number;
  eta_minutes: number;
  message: string | null;
  status: string;
  distance_km: number | null;
  created_at: string;
  nurse: {
    id: string;
    full_name: string;
    photo_url: string | null;
    qualification: string;
    experience_years: number | null;
    rating: number | null;
    review_count: number | null;
    phone: string | null;
    services_offered: string[];
  };
}

interface EmergencyRequest {
  id: string;
  patient_name: string;
  patient_phone: string;
  location_lat: number;
  location_lng: number;
  location_address: string | null;
  city: string | null;
  services_needed: string[];
  urgency: string;
  patient_offer_price: number | null;
  notes: string | null;
  status: string;
  accepted_offer_id: string | null;
  accepted_nurse_id: string | null;
  patient_rating: number | null;
  created_at: string;
}

interface Tracking {
  status: string;
  current_lat: number;
  current_lng: number;
  arrived_at: string | null;
  service_started_at: string | null;
}

const SERVICES_MAP: Record<string, string> = {
  iv_cannula: "IV Cannula",
  injection: "Injection",
  wound_dressing: "Wound Dressing",
  medication_administration: "Medication Administration",
  vital_signs: "Vital Signs Monitoring",
  catheterization: "Catheterization",
  nebulization: "Nebulization",
  blood_sugar: "Blood Sugar Test",
  elderly_care: "Elderly Care",
  post_surgical: "Post-Surgical Care",
};

export default function EmergencyRequestStatus() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [offers, setOffers] = useState<NurseOffer[]>([]);
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [acceptingOffer, setAcceptingOffer] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [tip, setTip] = useState("");

  useEffect(() => {
    if (!id || !user) return;
    
    fetchRequest();
    fetchOffers();

    // Subscribe to real-time updates
    const requestChannel = supabase
      .channel(`request-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_nursing_requests',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (payload.new) {
            setRequest(payload.new as EmergencyRequest);
          }
        }
      )
      .subscribe();

    const offersChannel = supabase
      .channel(`offers-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nurse_offers',
          filter: `request_id=eq.${id}`,
        },
        () => {
          fetchOffers();
        }
      )
      .subscribe();

    const trackingChannel = supabase
      .channel(`tracking-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nurse_emergency_tracking',
          filter: `request_id=eq.${id}`,
        },
        (payload) => {
          if (payload.new) {
            setTracking(payload.new as Tracking);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestChannel);
      supabase.removeChannel(offersChannel);
      supabase.removeChannel(trackingChannel);
    };
  }, [id, user]);

  const fetchRequest = async () => {
    const { data, error } = await supabase
      .from("emergency_nursing_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (data) {
      setRequest(data);
      
      if (data.status === "accepted" || data.status === "in_progress") {
        fetchTracking();
      }
    }
    setLoading(false);
  };

  const fetchOffers = async () => {
    const { data } = await supabase
      .from("nurse_offers")
      .select(`
        *,
        nurse:nurses(id, full_name, photo_url, qualification, experience_years, rating, review_count, phone, services_offered)
      `)
      .eq("request_id", id)
      .order("created_at", { ascending: false });

    if (data) {
      setOffers(data as NurseOffer[]);
    }
  };

  const fetchTracking = async () => {
    const { data } = await supabase
      .from("nurse_emergency_tracking")
      .select("*")
      .eq("request_id", id)
      .maybeSingle();

    if (data) {
      setTracking(data);
    }
  };

  const handleAcceptOffer = async (offer: NurseOffer) => {
    setAcceptingOffer(offer.id);

    // Update offer status
    const { error: offerError } = await supabase
      .from("nurse_offers")
      .update({ status: "accepted" })
      .eq("id", offer.id);

    if (offerError) {
      toast({ title: "Error", description: "Failed to accept offer", variant: "destructive" });
      setAcceptingOffer(null);
      return;
    }

    // Reject other offers
    await supabase
      .from("nurse_offers")
      .update({ status: "rejected" })
      .eq("request_id", id)
      .neq("id", offer.id);

    // Update request status
    const { error: requestError } = await supabase
      .from("emergency_nursing_requests")
      .update({
        status: "accepted",
        accepted_offer_id: offer.id,
        accepted_nurse_id: offer.nurse_id,
      })
      .eq("id", id);

    if (requestError) {
      toast({ title: "Error", description: "Failed to update request", variant: "destructive" });
      setAcceptingOffer(null);
      return;
    }

    toast({
      title: "Offer Accepted! 🎉",
      description: `${offer.nurse.full_name} is on the way. ETA: ${offer.eta_minutes} minutes`,
    });

    setAcceptingOffer(null);
    fetchRequest();
  };

  const handleCancelRequest = async () => {
    const { error } = await supabase
      .from("emergency_nursing_requests")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to cancel request", variant: "destructive" });
      return;
    }

    toast({ title: "Request Cancelled" });
    setCancelDialogOpen(false);
    navigate("/");
  };

  const handleSubmitRating = async () => {
    const { error } = await supabase
      .from("emergency_nursing_requests")
      .update({
        patient_rating: rating,
        patient_review: review,
        tip_amount: tip ? parseInt(tip) : null,
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to submit rating", variant: "destructive" });
      return;
    }

    toast({ title: "Thank you for your feedback! 🙏" });
    setRatingDialogOpen(false);
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      live: "bg-green-500",
      accepted: "bg-blue-500",
      in_progress: "bg-orange-500",
      completed: "bg-emerald-500",
      cancelled: "bg-gray-500",
    };
    return <Badge className={styles[status] || "bg-gray-500"}>{status.replace("_", " ").toUpperCase()}</Badge>;
  };

  const acceptedNurse = offers.find(o => o.status === "accepted")?.nurse;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Request not found</h2>
        <Button className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Status Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            {request.status === "live" && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            )}
            {getStatusBadge(request.status)}
          </div>
          <h1 className="text-2xl font-bold">
            {request.status === "live" && "Waiting for Nurse Offers..."}
            {request.status === "accepted" && "Nurse is on the way!"}
            {request.status === "in_progress" && "Service in Progress"}
            {request.status === "completed" && "Service Completed"}
            {request.status === "cancelled" && "Request Cancelled"}
          </h1>
        </div>

        {/* Request Details Card */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <span>{request.location_address || `${request.city || "Location captured"}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Requested {new Date(request.created_at).toLocaleString()}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {request.services_needed.map((s) => (
                <Badge key={s} variant="secondary">{SERVICES_MAP[s] || s}</Badge>
              ))}
            </div>
            {request.patient_offer_price && (
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <DollarSign className="w-4 h-4" />
                Your offer: PKR {request.patient_offer_price.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Tracking Section */}
        {(request.status === "accepted" || request.status === "in_progress") && acceptedNurse && (
          <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                Live Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-16 h-16 border-2 border-blue-500">
                  <AvatarImage src={acceptedNurse.photo_url || undefined} />
                  <AvatarFallback>{acceptedNurse.full_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{acceptedNurse.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{acceptedNurse.qualification}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{acceptedNurse.rating || "New"}</span>
                  </div>
                </div>
              </div>

              {/* Status Steps */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`w-5 h-5 ${tracking?.status === "on_way" || tracking?.status === "arrived" || tracking?.status === "in_service" ? "text-green-500" : "text-gray-300"}`} />
                  <span className={tracking?.status === "on_way" ? "font-semibold" : ""}>
                    On the way
                    {tracking?.status === "on_way" && " 🚗"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`w-5 h-5 ${tracking?.status === "arrived" || tracking?.status === "in_service" ? "text-green-500" : "text-gray-300"}`} />
                  <span className={tracking?.status === "arrived" ? "font-semibold" : ""}>
                    Arrived
                    {tracking?.arrived_at && ` at ${new Date(tracking.arrived_at).toLocaleTimeString()}`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`w-5 h-5 ${tracking?.status === "in_service" ? "text-green-500" : "text-gray-300"}`} />
                  <span className={tracking?.status === "in_service" ? "font-semibold" : ""}>
                    Service in progress
                    {tracking?.service_started_at && ` started at ${new Date(tracking.service_started_at).toLocaleTimeString()}`}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button className="flex-1" asChild>
                  <a href={`tel:${acceptedNurse.phone}`}>
                    <Phone className="w-4 h-4 mr-2" /> Call Nurse
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={`https://wa.me/${acceptedNurse.phone?.replace(/[^0-9]/g, '')}`} target="_blank">
                    <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Offers Section */}
        {request.status === "live" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Nurse Offers ({offers.filter(o => o.status === "pending").length})
              </h2>
              <Button variant="ghost" size="sm" onClick={fetchOffers}>
                <RefreshCw className="w-4 h-4 mr-1" /> Refresh
              </Button>
            </div>

            {offers.filter(o => o.status === "pending").length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Waiting for nurses to respond...</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll be notified when offers arrive
                  </p>
                </CardContent>
              </Card>
            ) : (
              offers.filter(o => o.status === "pending").map((offer) => (
                <Card key={offer.id} className="hover:border-red-200 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={offer.nurse.photo_url || undefined} />
                        <AvatarFallback>{offer.nurse.full_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{offer.nurse.full_name}</h3>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              PKR {offer.offered_price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{offer.nurse.qualification}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {offer.nurse.rating || "New"}
                          </span>
                          <span>{offer.nurse.experience_years || 0} yrs exp</span>
                          <span className="flex items-center gap-1 text-blue-600">
                            <Timer className="w-4 h-4" />
                            {offer.eta_minutes} min ETA
                          </span>
                        </div>
                        {offer.message && (
                          <p className="mt-2 text-sm bg-muted p-2 rounded italic">
                            "{offer.message}"
                          </p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleAcceptOffer(offer)}
                            disabled={acceptingOffer === offer.id}
                          >
                            {acceptingOffer === offer.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>Accept <CheckCircle2 className="w-4 h-4 ml-1" /></>
                            )}
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <a href={`/nurse/${offer.nurse.id}`} target="_blank">
                              View Profile
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Completed - Rating Section */}
        {request.status === "completed" && !request.patient_rating && (
          <Card className="border-2 border-emerald-200 bg-emerald-50">
            <CardContent className="py-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Service Completed!</h3>
              <p className="text-muted-foreground mb-4">How was your experience?</p>
              <Button onClick={() => setRatingDialogOpen(true)}>
                <Star className="w-4 h-4 mr-2" /> Rate & Review
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Cancel Button */}
        {request.status === "live" && (
          <div className="mt-6 text-center">
            <Button variant="ghost" className="text-red-600" onClick={() => setCancelDialogOpen(true)}>
              <Ban className="w-4 h-4 mr-2" /> Cancel Request
            </Button>
          </div>
        )}

        {/* Cancel Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Emergency Request?</DialogTitle>
              <DialogDescription>
                This will cancel your request and notify any nurses who have sent offers.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                Keep Request
              </Button>
              <Button variant="destructive" onClick={handleCancelRequest}>
                Yes, Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rating Dialog */}
        <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate Your Experience</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)}>
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Review (optional)</Label>
                <Textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your experience..."
                />
              </div>
              <div className="space-y-2">
                <Label>Add a Tip (optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₨</span>
                  <Input
                    type="number"
                    value={tip}
                    onChange={(e) => setTip(e.target.value)}
                    placeholder="e.g., 200"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmitRating}>Submit Rating</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}
