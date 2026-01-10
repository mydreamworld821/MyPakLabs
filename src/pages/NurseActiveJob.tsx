import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  MapPin,
  Clock,
  Phone,
  Loader2,
  Navigation,
  CheckCircle2,
  User,
  MessageSquare,
  Play,
  Flag,
  DollarSign,
  AlertTriangle,
  ExternalLink
} from "lucide-react";

interface JobDetails {
  id: string;
  patient_name: string;
  patient_phone: string;
  location_lat: number;
  location_lng: number;
  location_address: string | null;
  city: string | null;
  services_needed: string[];
  urgency: string;
  notes: string | null;
  status: string;
  created_at: string;
  offer: {
    offered_price: number;
    eta_minutes: number;
  };
}

interface TrackingStatus {
  status: string;
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

export default function NurseActiveJob() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobDetails | null>(null);
  const [tracking, setTracking] = useState<TrackingStatus | null>(null);
  const [nurseId, setNurseId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    fetchNurseId();
  }, [user]);

  useEffect(() => {
    if (!nurseId) return;
    fetchJobDetails();
    fetchTracking();

    // Subscribe to updates
    const channel = supabase
      .channel(`job-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_nursing_requests',
          filter: `id=eq.${id}`,
        },
        () => fetchJobDetails()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nurse_emergency_tracking',
          filter: `request_id=eq.${id}`,
        },
        () => fetchTracking()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [nurseId, id]);

  const fetchNurseId = async () => {
    const { data } = await supabase
      .from("nurses")
      .select("id")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (data) {
      setNurseId(data.id);
    }
  };

  const fetchJobDetails = async () => {
    const { data: requestData } = await supabase
      .from("emergency_nursing_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (requestData && nurseId) {
      const { data: offerData } = await supabase
        .from("nurse_offers")
        .select("offered_price, eta_minutes")
        .eq("request_id", id)
        .eq("nurse_id", nurseId)
        .eq("status", "accepted")
        .maybeSingle();

      if (offerData) {
        setJob({
          ...requestData,
          offer: offerData,
        });
      }
    }
    setLoading(false);
  };

  const fetchTracking = async () => {
    if (!nurseId) return;
    
    const { data } = await supabase
      .from("nurse_emergency_tracking")
      .select("status, arrived_at, service_started_at")
      .eq("request_id", id)
      .eq("nurse_id", nurseId)
      .maybeSingle();

    setTracking(data);
  };

  const updateLocation = async () => {
    if (!nurseId || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
      await supabase
        .from("nurse_emergency_tracking")
        .upsert({
          request_id: id,
          nurse_id: nurseId,
          current_lat: position.coords.latitude,
          current_lng: position.coords.longitude,
          status: tracking?.status || "on_way",
        }, {
          onConflict: "request_id,nurse_id"
        });
    });
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!nurseId) return;
    setUpdating(true);

    const updateData: any = {
      request_id: id,
      nurse_id: nurseId,
      status: newStatus,
    };

    if (newStatus === "arrived") {
      updateData.arrived_at = new Date().toISOString();
    } else if (newStatus === "in_service") {
      updateData.service_started_at = new Date().toISOString();
    }

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        updateData.current_lat = position.coords.latitude;
        updateData.current_lng = position.coords.longitude;

        await supabase
          .from("nurse_emergency_tracking")
          .upsert(updateData, { onConflict: "request_id,nurse_id" });

        if (newStatus === "in_service") {
          await supabase
            .from("emergency_nursing_requests")
            .update({ status: "in_progress" })
            .eq("id", id);
        }

        setUpdating(false);
        fetchTracking();
        toast({ title: `Status updated: ${newStatus.replace("_", " ").toUpperCase()}` });
      });
    } else {
      setUpdating(false);
      toast({ title: "Error", description: "Could not get location", variant: "destructive" });
    }
  };

  const handleComplete = async () => {
    setUpdating(true);

    await supabase
      .from("emergency_nursing_requests")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    await supabase
      .from("nurse_emergency_tracking")
      .update({ status: "completed" })
      .eq("request_id", id)
      .eq("nurse_id", nurseId);

    setUpdating(false);
    toast({
      title: "Job Completed! 🎉",
      description: "Great work! The patient will be notified.",
    });
    navigate("/nurse-dashboard");
  };

  const openInMaps = () => {
    if (!job) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${job.location_lat},${job.location_lng}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Job not found</h2>
        <Button className="mt-4" onClick={() => navigate("/nurse-dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-background">
      <Navbar />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Status Header */}
        <div className="text-center mb-6">
          <Badge className={
            tracking?.status === "in_service" ? "bg-orange-500" :
            tracking?.status === "arrived" ? "bg-green-500" :
            "bg-blue-500"
          }>
            {tracking?.status === "in_service" ? "🩺 SERVICE IN PROGRESS" :
             tracking?.status === "arrived" ? "📍 ARRIVED" :
             "🚗 ON THE WAY"}
          </Badge>
          <h1 className="text-2xl font-bold mt-2">Active Job</h1>
        </div>

        {/* Patient Info Card */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Patient Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{job.patient_name}</p>
                <p className="text-muted-foreground">{job.patient_phone}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" asChild>
                  <a href={`tel:${job.patient_phone}`}>
                    <Phone className="w-4 h-4" />
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={`https://wa.me/${job.patient_phone.replace(/[^0-9]/g, '')}`} target="_blank">
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm">{job.location_address || job.city || "Location captured"}</p>
                <Button
                  size="sm"
                  variant="link"
                  className="p-0 h-auto text-primary"
                  onClick={openInMaps}
                >
                  Open in Google Maps <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {job.services_needed.map((s) => (
                <Badge key={s} variant="secondary">
                  {SERVICES_MAP[s] || s}
                </Badge>
              ))}
            </div>

            {job.notes && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <p className="font-medium text-amber-800">Patient Notes:</p>
                <p className="text-amber-700">{job.notes}</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="font-bold text-lg text-green-600">
                PKR {job.offer.offered_price.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Status Actions */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Update Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* On Way - Initial state */}
              <div className={`flex items-center gap-3 p-3 rounded-lg ${!tracking || tracking.status === "on_way" ? "bg-blue-50 border-2 border-blue-200" : "bg-muted"}`}>
                <CheckCircle2 className={`w-6 h-6 ${tracking ? "text-green-500" : "text-blue-500"}`} />
                <div className="flex-1">
                  <p className="font-medium">On the way</p>
                  {!tracking && <p className="text-xs text-muted-foreground">Your starting status</p>}
                </div>
                {(!tracking || tracking.status === "on_way") && (
                  <Button size="sm" variant="outline" onClick={updateLocation}>
                    <Navigation className="w-4 h-4 mr-1" /> Update Location
                  </Button>
                )}
              </div>

              {/* Arrived */}
              <div className={`flex items-center gap-3 p-3 rounded-lg ${tracking?.status === "arrived" ? "bg-green-50 border-2 border-green-200" : "bg-muted"}`}>
                <CheckCircle2 className={`w-6 h-6 ${tracking?.status === "arrived" || tracking?.status === "in_service" ? "text-green-500" : "text-gray-300"}`} />
                <div className="flex-1">
                  <p className="font-medium">Arrived</p>
                  {tracking?.arrived_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(tracking.arrived_at).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                {tracking?.status === "on_way" && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusUpdate("arrived")}
                    disabled={updating}
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark Arrived"}
                  </Button>
                )}
              </div>

              {/* In Service */}
              <div className={`flex items-center gap-3 p-3 rounded-lg ${tracking?.status === "in_service" ? "bg-orange-50 border-2 border-orange-200" : "bg-muted"}`}>
                <Play className={`w-6 h-6 ${tracking?.status === "in_service" ? "text-orange-500" : "text-gray-300"}`} />
                <div className="flex-1">
                  <p className="font-medium">Service Started</p>
                  {tracking?.service_started_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(tracking.service_started_at).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                {tracking?.status === "arrived" && (
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => handleStatusUpdate("in_service")}
                    disabled={updating}
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Service"}
                  </Button>
                )}
              </div>

              {/* Complete */}
              {tracking?.status === "in_service" && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  size="lg"
                  onClick={handleComplete}
                  disabled={updating}
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Flag className="w-5 h-5 mr-2" />
                      Mark Service Complete
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <div className="text-center text-sm text-muted-foreground">
          Need help? Contact support at <span className="font-medium">0300-1234567</span>
        </div>
      </main>

      <Footer />
    </div>
  );
}
