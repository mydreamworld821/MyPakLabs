import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { sendAdminEmailNotification } from "@/utils/adminNotifications";
import { toast } from "sonner";
import { 
  Heart, 
  User, 
  Calendar, 
  Clock,
  MapPin,
  Phone,
  Star,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  AlertCircle,
  MessageSquare,
  AlertTriangle,
  Bell,
  BellOff,
  Wallet
} from "lucide-react";
import { useNurseWallet } from "@/hooks/useNurseWallet";
import { NurseWalletCard } from "@/components/nurse/NurseWalletCard";
import { NurseWalletTransactions } from "@/components/nurse/NurseWalletTransactions";
import { NurseCommissionPaymentSection } from "@/components/nurse/NurseCommissionPayment";
import { format } from "date-fns";

interface Nurse {
  id: string;
  full_name: string;
  photo_url: string | null;
  qualification: string;
  experience_years: number;
  city: string;
  area_of_service: string | null;
  home_visit_radius: number | null;
  phone: string;
  email: string;
  services_offered: string[];
  available_days: string[];
  available_shifts: string[];
  emergency_available: boolean;
  per_visit_fee: number;
  per_hour_fee: number | null;
  monthly_package_fee: number | null;
  fee_negotiable: boolean;
  languages_spoken: string[];
  certifications: string[];
  rating: number;
  review_count: number;
  status: string;
}

interface Booking {
  id: string;
  patient_id?: string | null;
  patient_name: string;
  patient_phone: string;
  patient_address: string | null;
  service_needed: string;
  preferred_date: string;
  preferred_time: string;
  notes: string | null;
  status: string;
  nurse_notes: string | null;
  created_at: string;
}

interface ActiveEmergencyJob {
  id: string;
  patient_name: string;
  patient_phone: string;
  city: string | null;
  location_address: string | null;
  house_address: string | null;
  services_needed: string[];
  urgency: string;
  status: string;
  created_at: string;
  offer: {
    offered_price: number;
    eta_minutes: number;
  } | null;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHIFTS = ["Morning", "Evening", "Night"];
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

// Notification Toggle Button Component
const NotificationToggleButton = () => {
  const { notificationPermission, requestNotificationPermission } = useNotifications();
  const [requesting, setRequesting] = useState(false);

  const handleClick = async () => {
    if (notificationPermission === 'granted') {
      toast.info("Notifications are already enabled");
      return;
    }
    setRequesting(true);
    await requestNotificationPermission();
    setRequesting(false);
  };

  if (notificationPermission === 'granted') {
    return (
      <Button size="sm" variant="outline" className="gap-2 text-green-600 border-green-200">
        <Bell className="w-4 h-4" />
        Alerts On
      </Button>
    );
  }

  return (
    <Button 
      size="sm" 
      variant="outline" 
      className="gap-2" 
      onClick={handleClick}
      disabled={requesting}
    >
      {requesting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      Enable Alerts
    </Button>
  );
};

// Nurse Wallet Section Component
const NurseWalletSection = () => {
  const { wallet, transactions, commissionPayments, commissionSettings, isLoading, submitPayment } = useNurseWallet();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <NurseWalletCard wallet={wallet} settings={commissionSettings} />
      <NurseWalletTransactions transactions={transactions} />
      <NurseCommissionPaymentSection
        wallet={wallet}
        payments={commissionPayments}
        onSubmitPayment={(data) => submitPayment.mutate(data)}
        isSubmitting={submitPayment.isPending}
      />
    </div>
  );
};

const NurseDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [nurse, setNurse] = useState<Nurse | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeJobs, setActiveJobs] = useState<ActiveEmergencyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingNotes, setBookingNotes] = useState("");
  
  // Editable form data
  const [formData, setFormData] = useState({
    phone: "",
    area_of_service: "",
    home_visit_radius: "",
    services_offered: [] as string[],
    available_days: [] as string[],
    available_shifts: [] as string[],
    emergency_available: false,
    per_visit_fee: "",
    per_hour_fee: "",
    monthly_package_fee: "",
    fee_negotiable: true,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth", { state: { from: "/nurse-dashboard" } });
      return;
    }
    fetchNurseProfile();
    fetchBookings();
    fetchActiveEmergencyJobs();
  }, [user, navigate]);

  // Subscribe to offer status changes (to know when patient accepts)
  useEffect(() => {
    if (!nurse) return;

    const channel = supabase
      .channel('nurse-offer-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'nurse_offers',
          filter: `nurse_id=eq.${nurse.id}`,
        },
        (payload: any) => {
          if (payload.new.status === 'accepted') {
            toast.success("🎉 Your offer was accepted! Patient is waiting for you.", {
              duration: 10000,
              action: {
                label: "Go to Job",
                onClick: () => navigate(`/nurse-active-job/${payload.new.request_id}`)
              }
            });
            fetchActiveEmergencyJobs();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [nurse, navigate]);

  const fetchNurseProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("nurses")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No nurse profile found
          toast.error("You don't have a nurse profile. Please register first.");
          navigate("/nurse-register");
          return;
        }
        throw error;
      }

      if (data.status !== "approved") {
        toast.info("Your profile is pending approval. You'll get access once approved.");
      }

      setNurse(data);
      setFormData({
        phone: data.phone || "",
        area_of_service: data.area_of_service || "",
        home_visit_radius: data.home_visit_radius?.toString() || "",
        services_offered: data.services_offered || [],
        available_days: data.available_days || [],
        available_shifts: data.available_shifts || [],
        emergency_available: data.emergency_available || false,
        per_visit_fee: data.per_visit_fee?.toString() || "",
        per_hour_fee: data.per_hour_fee?.toString() || "",
        monthly_package_fee: data.monthly_package_fee?.toString() || "",
        fee_negotiable: data.fee_negotiable ?? true,
      });
    } catch (error) {
      console.error("Error fetching nurse profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const { data: nurseData } = await supabase
        .from("nurses")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!nurseData) return;

      const { data, error } = await supabase
        .from("nurse_bookings")
        .select("*")
        .eq("nurse_id", nurseData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const fetchActiveEmergencyJobs = async () => {
    if (!user) return;

    try {
      const { data: nurseData } = await supabase
        .from("nurses")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!nurseData) return;

      // Get accepted emergency requests for this nurse
      const { data: requests, error } = await supabase
        .from("emergency_nursing_requests")
        .select("*")
        .eq("accepted_nurse_id", nurseData.id)
        .in("status", ["accepted", "in_progress"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get offers for these requests
      const jobs: ActiveEmergencyJob[] = [];
      for (const request of requests || []) {
        const { data: offerData } = await supabase
          .from("nurse_offers")
          .select("offered_price, eta_minutes")
          .eq("request_id", request.id)
          .eq("nurse_id", nurseData.id)
          .eq("status", "accepted")
          .maybeSingle();

        jobs.push({
          ...request,
          offer: offerData,
        });
      }

      setActiveJobs(jobs);
    } catch (error) {
      console.error("Error fetching active jobs:", error);
    }
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

  const handleSaveProfile = async () => {
    if (!nurse) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("nurses")
        .update({
          phone: formData.phone,
          area_of_service: formData.area_of_service || null,
          home_visit_radius: formData.home_visit_radius ? parseInt(formData.home_visit_radius) : null,
          services_offered: formData.services_offered,
          available_days: formData.available_days,
          available_shifts: formData.available_shifts,
          emergency_available: formData.emergency_available,
          per_visit_fee: parseInt(formData.per_visit_fee) || null,
          per_hour_fee: formData.per_hour_fee ? parseInt(formData.per_hour_fee) : null,
          monthly_package_fee: formData.monthly_package_fee ? parseInt(formData.monthly_package_fee) : null,
          fee_negotiable: formData.fee_negotiable,
        })
        .eq("id", nurse.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      fetchNurseProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const updateData: any = { status, nurse_notes: bookingNotes };

      if (status === "confirmed") updateData.confirmed_at = new Date().toISOString();
      if (status === "completed") updateData.completed_at = new Date().toISOString();
      if (status === "cancelled") updateData.cancelled_at = new Date().toISOString();

      const { error } = await supabase
        .from("nurse_bookings")
        .update(updateData)
        .eq("id", bookingId);

      if (error) throw error;

      // Send confirmation emails (nurse-confirm flow)
      if (status === "confirmed") {
        const booking = bookings.find((b) => b.id === bookingId);
        if (booking) {
          try {
            let patientEmail: string | undefined;
            if (booking.patient_id) {
              const { data: emailData, error: emailErr } = await supabase.functions.invoke(
                "send-admin-notification",
                { body: { action: "get_user_email", userId: booking.patient_id } }
              );
              if (emailErr) throw emailErr;
              patientEmail = emailData?.email || undefined;
            }

            await sendAdminEmailNotification({
              type: "nurse_booking",
              status: "confirmed",
              bookingId: booking.id.slice(0, 8).toUpperCase(),
              patientName: booking.patient_name,
              patientPhone: booking.patient_phone || undefined,
              patientEmail,
              patientAddress: booking.patient_address || undefined,
              nurseName: nurse?.full_name || "Nurse",
              nurseQualification: nurse?.qualification || undefined,
              nursePhone: nurse?.phone || undefined,
              serviceNeeded: booking.service_needed,
              preferredDate: format(new Date(booking.preferred_date), "d MMM yyyy"),
              preferredTime: booking.preferred_time || undefined,
              nurseNotes: bookingNotes || undefined,
              serviceFee: nurse?.per_visit_fee || undefined,
            });
          } catch (notifyErr: any) {
            console.error("Nurse confirmation email failed:", notifyErr);
            toast.error("Booking confirmed, but email could not be sent.");
          }
        }
      }

      toast.success(`Booking ${status}`);
      setSelectedBooking(null);
      setBookingNotes("");
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || "Failed to update booking");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-700">Confirmed</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-700">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
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
            <h2 className="text-lg font-semibold mb-2">No Nurse Profile Found</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Please register as a nurse to access this dashboard.
            </p>
            <Button onClick={() => navigate("/nurse-register")} className="bg-rose-600 hover:bg-rose-700">
              Register as Nurse
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const pendingBookings = bookings.filter(b => b.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-8">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center overflow-hidden">
                {nurse.photo_url ? (
                  <img src={nurse.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Heart className="w-8 h-8 text-rose-600" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold">{nurse.full_name}</h1>
                <p className="text-sm text-muted-foreground">{nurse.qualification}</p>
                <div className="flex items-center gap-2 mt-1">
                  {nurse.status === "approved" ? (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending Approval
                    </Badge>
                  )}
                  {pendingBookings > 0 && (
                    <Badge variant="destructive">
                      {pendingBookings} New Booking{pendingBookings > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {nurse.status === "approved" && (
                <>
                  <NotificationToggleButton />
                  <Link to="/nurse-emergency-feed">
                    <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700">
                      <AlertTriangle className="w-4 h-4" />
                      Emergency Requests
                    </Button>
                  </Link>
                </>
              )}
              <Link to={`/nurse/${nurse.id}`} target="_blank">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  View Public Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Active Emergency Jobs Banner */}
          {activeJobs.length > 0 && (
            <div className="mb-6 space-y-3">
              {activeJobs.map((job) => (
                <Card key={job.id} className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-white" />
                          </div>
                          <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-green-800 text-sm">🎉 ACTIVE JOB - PATIENT WAITING</p>
                          <p className="text-sm text-green-700">{job.patient_name} • {job.city || 'Location shared'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-green-600 text-white text-xs">
                              PKR {job.offer?.offered_price?.toLocaleString() || 'N/A'}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                              {job.status === "in_progress" ? "In Progress" : "Accepted"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button 
                        className="bg-green-600 hover:bg-green-700 shrink-0"
                        onClick={() => navigate(`/nurse-active-job/${job.id}`)}
                      >
                        Start Service →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{nurse.rating || "New"}</p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <MessageSquare className="w-5 h-5 text-rose-600 mx-auto mb-1" />
                <p className="text-lg font-bold">{bookings.length}</p>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-lg font-bold">{bookings.filter(b => b.status === "completed").length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                <p className="text-lg font-bold">{pendingBookings}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
              <TabsTrigger value="services" className="text-xs">Services</TabsTrigger>
              <TabsTrigger value="availability" className="text-xs">Availability</TabsTrigger>
              <TabsTrigger value="bookings" className="text-xs">
                Bookings
                {pendingBookings > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-[10px]">
                    {pendingBookings}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="wallet" className="text-xs">
                <Wallet className="w-3 h-3 mr-1" />
                Wallet
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Phone Number</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Area of Service</Label>
                    <Input
                      value={formData.area_of_service}
                      onChange={(e) => setFormData(prev => ({ ...prev, area_of_service: e.target.value }))}
                      placeholder="e.g., DHA, Gulberg, Model Town"
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Home Visit Radius (km)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.home_visit_radius}
                        onChange={(e) => setFormData(prev => ({ ...prev, home_visit_radius: e.target.value }))}
                        placeholder="e.g., 10"
                        className="text-xs h-8 flex-1"
                      />
                      <span className="text-xs text-muted-foreground">km</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Maximum distance you're willing to travel for home visits
                    </p>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                    <Checkbox
                      checked={formData.emergency_available}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emergency_available: !!checked }))}
                    />
                    <Label className="text-xs">Available for Emergency Calls</Label>
                  </div>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={saving}
                    className="w-full bg-rose-600 hover:bg-rose-700"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Services You Offer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={saving}
                    className="w-full bg-rose-600 hover:bg-rose-700"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Services
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent value="availability">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Availability & Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs mb-2 block">Available Days</Label>
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
                    <Label className="text-xs mb-2 block">Available Shifts</Label>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Per Visit Fee (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.per_visit_fee}
                        onChange={(e) => setFormData(prev => ({ ...prev, per_visit_fee: e.target.value }))}
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Per Hour Fee (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.per_hour_fee}
                        onChange={(e) => setFormData(prev => ({ ...prev, per_hour_fee: e.target.value }))}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Monthly Package (PKR)</Label>
                    <Input
                      type="number"
                      value={formData.monthly_package_fee}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthly_package_fee: e.target.value }))}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.fee_negotiable}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, fee_negotiable: !!checked }))}
                    />
                    <Label className="text-xs">Fee is Negotiable</Label>
                  </div>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={saving}
                    className="w-full bg-rose-600 hover:bg-rose-700"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Availability
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Booking Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No booking requests yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setBookingNotes(booking.nurse_notes || "");
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium">{booking.patient_name}</p>
                              <p className="text-xs text-muted-foreground">{booking.service_needed}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(booking.preferred_date), "MMM d, yyyy")}
                                <Clock className="w-3 h-3 ml-2" />
                                {booking.preferred_time}
                              </div>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wallet Tab - Using a wrapper component */}
            <TabsContent value="wallet">
              <NurseWalletSection />
            </TabsContent>
          </Tabs>
        </div>

        {/* Booking Detail Dialog */}
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">Booking Details</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Patient</span>
                    <span className="text-sm font-medium">{selectedBooking.patient_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Phone</span>
                    <a href={`tel:${selectedBooking.patient_phone}`} className="text-sm text-rose-600">
                      {selectedBooking.patient_phone}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Service</span>
                    <span className="text-sm">{selectedBooking.service_needed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Date</span>
                    <span className="text-sm">{format(new Date(selectedBooking.preferred_date), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Time</span>
                    <span className="text-sm">{selectedBooking.preferred_time}</span>
                  </div>
                  {selectedBooking.patient_address && (
                    <div className="flex items-start justify-between">
                      <span className="text-xs text-muted-foreground">Address</span>
                      <span className="text-sm text-right max-w-[200px]">{selectedBooking.patient_address}</span>
                    </div>
                  )}
                  {selectedBooking.notes && (
                    <div>
                      <span className="text-xs text-muted-foreground">Patient Notes</span>
                      <p className="text-sm mt-1 p-2 bg-muted rounded">{selectedBooking.notes}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs">Your Notes</Label>
                  <Textarea
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Add notes about this booking..."
                    className="text-xs mt-1"
                    rows={2}
                  />
                </div>

                {selectedBooking.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateBookingStatus(selectedBooking.id, "confirmed")}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Confirm
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleUpdateBookingStatus(selectedBooking.id, "cancelled")}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                )}
                {selectedBooking.status === "confirmed" && (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleUpdateBookingStatus(selectedBooking.id, "completed")}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Mark as Completed
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default NurseDashboard;
