import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ShoppingCart,
  Loader2,
  Eye,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Printer,
  ThumbsUp,
  Stethoscope,
  UserRound,
  TestTube,
  MapPin,
  Phone,
  AlertTriangle,
  Ban,
  Store,
  Pill,
  Truck,
  Package,
  FileText,
  ClipboardList,
} from "lucide-react";
import { generateBookingPDF } from "@/utils/generateBookingPDF";
import { generateDoctorAppointmentPDF } from "@/utils/generateDoctorAppointmentPDF";
import { generateNurseBookingPDF } from "@/utils/generateNurseBookingPDF";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface OrderTest {
  test_id: string;
  test_name: string;
  price: number;
  discounted_price?: number;
}

interface Order {
  id: string;
  unique_id: string;
  lab_id: string;
  tests: OrderTest[];
  original_total: number;
  discount_percentage: number | null;
  discounted_total: number;
  status: string;
  validity_date: string;
  notes: string | null;
  pdf_url: string | null;
  created_at: string;
  is_availed: boolean | null;
  availed_at: string | null;
  labs?: {
    name: string;
    logo_url: string | null;
  } | null;
}

interface DoctorAppointment {
  id: string;
  unique_id: string | null;
  appointment_date: string;
  appointment_time: string;
  consultation_type: string;
  status: string;
  fee: number;
  notes: string | null;
  consultation_notes: string | null;
  prescription_url: string | null;
  prescription_uploaded_at: string | null;
  created_at: string;
  doctors: {
    id: string;
    full_name: string;
    photo_url: string | null;
    qualification: string | null;
    clinic_name: string | null;
    clinic_address: string | null;
    phone: string | null;
    doctor_specializations?: {
      name: string;
    } | null;
  };
}

interface NurseBooking {
  id: string;
  unique_id: string | null;
  nurse_id: string;
  patient_name: string;
  patient_phone: string;
  patient_address: string | null;
  service_needed: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  notes: string | null;
  nurse_notes: string | null;
  created_at: string;
  nurses: {
    id: string;
    full_name: string;
    photo_url: string | null;
    qualification: string;
    phone: string | null;
    per_visit_fee: number | null;
  };
}

interface MedicineOrderItem {
  name: string;
  quantity: number;
  notes?: string;
}

interface MedicineOrder {
  id: string;
  unique_id: string;
  store_id: string;
  prescription_url: string | null;
  medicines: MedicineOrderItem[];
  delivery_address: string;
  notes: string | null;
  status: string;
  estimated_price: number | null;
  final_price: number | null;
  pharmacy_notes: string | null;
  created_at: string;
  medical_stores: {
    id: string;
    name: string;
    logo_url: string | null;
    phone: string;
    city: string;
    area: string;
  };
}

interface ApprovedTest {
  test_id: string;
  test_name: string;
  price: number;
  original_price: number;
}

interface Prescription {
  id: string;
  unique_id: string | null;
  image_url: string;
  status: string;
  approved_tests: ApprovedTest[];
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  labs?: {
    id: string;
    name: string;
    logo_url: string | null;
    discount_percentage: number | null;
  } | null;
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: {
    icon: Clock,
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    label: "Pending"
  },
  confirmed: {
    icon: CheckCircle,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    label: "Confirmed"
  },
  completed: {
    icon: CheckCircle,
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    label: "Completed"
  },
  cancelled: {
    icon: XCircle,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    label: "Cancelled"
  },
  no_show: {
    icon: AlertTriangle,
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    label: "No Show"
  },
  live: {
    icon: Clock,
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    label: "Live"
  },
  accepted: {
    icon: CheckCircle,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    label: "Accepted"
  },
  in_progress: {
    icon: Clock,
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    label: "In Progress"
  },
  preparing: {
    icon: Package,
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    label: "Preparing"
  },
  out_for_delivery: {
    icon: Truck,
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    label: "Out for Delivery"
  },
  delivered: {
    icon: CheckCircle,
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    label: "Delivered"
  },
  rejected: {
    icon: XCircle,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    label: "Rejected"
  },
  pending_review: {
    icon: Clock,
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    label: "Pending Review"
  },
  approved: {
    icon: CheckCircle,
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    label: "Approved"
  },
};

interface UserProfile {
  full_name: string | null;
  phone: string | null;
  city: string | null;
  age: number | null;
  gender: string | null;
}

const MyBookings = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [nurseBookings, setNurseBookings] = useState<NurseBooking[]>([]);
  const [medicineOrders, setMedicineOrders] = useState<MedicineOrder[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointment | null>(null);
  const [selectedNurseBooking, setSelectedNurseBooking] = useState<NurseBooking | null>(null);
  const [selectedMedicineOrder, setSelectedMedicineOrder] = useState<MedicineOrder | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'order' | 'appointment' | 'nurse' | 'medicine' | 'prescription'>('order');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("lab-tests");
  
  // Cancel dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelType, setCancelType] = useState<'appointment' | 'nurse'>('appointment');
  const [cancelItemId, setCancelItemId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchAllBookings();
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, city, age, gender")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) setUserProfile(data);
  };

  const fetchAllBookings = async () => {
    setIsLoading(true);
    await Promise.all([fetchOrders(), fetchAppointments(), fetchNurseBookings(), fetchMedicineOrders(), fetchPrescriptions()]);
    setIsLoading(false);
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          labs:lab_id (
            name,
            logo_url
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const parsedData = (data || []).map(o => ({
        ...o,
        tests: Array.isArray(o.tests) ? o.tests as unknown as OrderTest[] : []
      }));
      
      setOrders(parsedData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          doctors:doctor_id (
            id,
            full_name,
            photo_url,
            qualification,
            clinic_name,
            clinic_address,
            phone,
            doctor_specializations:specialization_id (
              name
            )
          )
        `)
        .eq("patient_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const fetchNurseBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("nurse_bookings")
        .select(`
          *,
          nurses:nurse_id (
            id,
            full_name,
            photo_url,
            qualification,
            phone,
            per_visit_fee
          )
        `)
        .eq("patient_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNurseBookings(data || []);
    } catch (error) {
      console.error("Error fetching nurse bookings:", error);
    }
  };

  const fetchMedicineOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("medicine_orders")
        .select(`
          *,
          medical_stores:store_id (
            id,
            name,
            logo_url,
            phone,
            city,
            area
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const parsedData = (data || []).map(o => ({
        ...o,
        medicines: Array.isArray(o.medicines) ? o.medicines as unknown as MedicineOrderItem[] : []
      }));
      
      setMedicineOrders(parsedData);
    } catch (error) {
      console.error("Error fetching medicine orders:", error);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          *,
          labs:lab_id (
            id,
            name,
            logo_url,
            discount_percentage
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const parsedData = (data || []).map(p => ({
        ...p,
        approved_tests: Array.isArray(p.approved_tests) ? p.approved_tests as unknown as ApprovedTest[] : []
      }));
      
      setPrescriptions(parsedData);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    }
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setDialogType('prescription');
    setIsDialogOpen(true);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDialogType('order');
    setIsDialogOpen(true);
  };

  const handleViewAppointment = (appointment: DoctorAppointment) => {
    setSelectedAppointment(appointment);
    setDialogType('appointment');
    setIsDialogOpen(true);
  };

  const handleViewNurseBooking = (booking: NurseBooking) => {
    setSelectedNurseBooking(booking);
    setDialogType('nurse');
    setIsDialogOpen(true);
  };

  const handleViewMedicineOrder = (order: MedicineOrder) => {
    setSelectedMedicineOrder(order);
    setDialogType('medicine');
    setIsDialogOpen(true);
  };

  const handleConfirmAvailed = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          is_availed: true, 
          availed_at: new Date().toISOString() 
        })
        .eq("id", orderId);

      if (error) throw error;
      
      toast.success("Discount availed confirmed!");
      fetchOrders();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error confirming availed:", error);
      toast.error("Failed to confirm");
    }
  };

  const openCancelDialog = (type: 'appointment' | 'nurse', id: string) => {
    setCancelType(type);
    setCancelItemId(id);
    setCancelReason("");
    setCancelDialogOpen(true);
  };

  const handleCancelAppointment = async () => {
    if (!cancelItemId) return;
    
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ 
          status: 'cancelled',
          cancellation_reason: cancelReason || null,
          cancelled_at: new Date().toISOString()
        })
        .eq("id", cancelItemId);

      if (error) throw error;
      
      toast.success("Appointment cancelled successfully");
      fetchAppointments();
      setCancelDialogOpen(false);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Failed to cancel appointment");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelNurseBooking = async () => {
    if (!cancelItemId) return;
    
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from("nurse_bookings")
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq("id", cancelItemId);

      if (error) throw error;
      
      toast.success("Nursing booking cancelled successfully");
      fetchNurseBookings();
      setCancelDialogOpen(false);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error cancelling nurse booking:", error);
      toast.error("Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmCancel = () => {
    if (cancelType === 'appointment') {
      handleCancelAppointment();
    } else {
      handleCancelNurseBooking();
    }
  };

  const approvedPrescriptions = prescriptions.filter(p => p.status === 'approved');
  const totalBookings = orders.length + appointments.length + nurseBookings.length + medicineOrders.length + approvedPrescriptions.length;
  const completedBookings = 
    orders.filter(o => o.status === "completed").length +
    appointments.filter(a => a.status === "completed").length +
    nurseBookings.filter(n => n.status === "completed").length +
    medicineOrders.filter(m => m.status === "delivered").length +
    approvedPrescriptions.length;
  const pendingBookings = 
    orders.filter(o => o.status === "pending").length +
    appointments.filter(a => a.status === "pending").length +
    nurseBookings.filter(n => n.status === "pending").length +
    medicineOrders.filter(m => m.status === "pending").length +
    prescriptions.filter(p => p.status === "pending_review").length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-24 pb-8 gradient-hero relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <Button
            variant="ghost"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 mb-4"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
            My Bookings
          </h1>
          <p className="text-primary-foreground/80">
            View all your lab tests, doctor appointments, and nursing bookings
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : totalBookings === 0 ? (
            <Card className="max-w-md mx-auto text-center p-8">
              <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Bookings Yet</h2>
              <p className="text-muted-foreground mb-4">
                You haven't made any bookings yet. Start exploring our services!
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={() => navigate("/labs")}>Browse Labs</Button>
                <Button variant="outline" onClick={() => navigate("/find-doctors")}>Find Doctors</Button>
                <Button variant="outline" onClick={() => navigate("/find-nurses")}>Find Nurses</Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{totalBookings}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">{completedBookings}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold">{pendingBookings}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hidden sm:block">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">This Month</p>
                      <p className="text-2xl font-bold">
                        {orders.filter(o => new Date(o.created_at).getMonth() === new Date().getMonth()).length +
                         appointments.filter(a => new Date(a.created_at).getMonth() === new Date().getMonth()).length +
                         nurseBookings.filter(n => new Date(n.created_at).getMonth() === new Date().getMonth()).length +
                         medicineOrders.filter(m => new Date(m.created_at).getMonth() === new Date().getMonth()).length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs for Different Booking Types */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="lab-tests" className="flex items-center gap-1 text-xs sm:text-sm">
                    <TestTube className="w-4 h-4" />
                    <span className="hidden sm:inline">Labs</span>
                    <Badge variant="secondary" className="ml-1 text-xs">{orders.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="prescriptions" className="flex items-center gap-1 text-xs sm:text-sm">
                    <ClipboardList className="w-4 h-4" />
                    <span className="hidden sm:inline">Rx Slips</span>
                    <Badge variant="secondary" className="ml-1 text-xs">{approvedPrescriptions.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="doctor" className="flex items-center gap-1 text-xs sm:text-sm">
                    <Stethoscope className="w-4 h-4" />
                    <span className="hidden sm:inline">Doctors</span>
                    <Badge variant="secondary" className="ml-1 text-xs">{appointments.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="nursing" className="flex items-center gap-1 text-xs sm:text-sm">
                    <UserRound className="w-4 h-4" />
                    <span className="hidden sm:inline">Nursing</span>
                    <Badge variant="secondary" className="ml-1 text-xs">{nurseBookings.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="medicine" className="flex items-center gap-1 text-xs sm:text-sm">
                    <Pill className="w-4 h-4" />
                    <span className="hidden sm:inline">Medicine</span>
                    <Badge variant="secondary" className="ml-1 text-xs">{medicineOrders.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                {/* Lab Tests Tab */}
                <TabsContent value="lab-tests" className="mt-6">
                  {orders.length === 0 ? (
                    <Card className="text-center p-8">
                      <TestTube className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">No lab test bookings yet</p>
                      <Button className="mt-4" onClick={() => navigate("/labs")}>Browse Labs</Button>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Lab Test Bookings</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Lab</TableHead>
                                <TableHead>Tests</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Availed</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {orders.map((order) => {
                                const config = statusConfig[order.status] || statusConfig.pending;
                                const StatusIcon = config.icon;
                                return (
                                  <TableRow key={order.id}>
                                    <TableCell>
                                      <span className="font-mono font-medium text-sm">{order.unique_id}</span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {order.labs?.logo_url ? (
                                          <img src={order.labs.logo_url} alt={order.labs.name} className="w-8 h-8 rounded object-cover" />
                                        ) : (
                                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                            <Building2 className="w-4 h-4 text-primary" />
                                          </div>
                                        )}
                                        <span className="font-medium">{order.labs?.name || "Unknown Lab"}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-sm">{order.tests.length} test(s)</span>
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <p className="font-medium">Rs. {order.discounted_total.toLocaleString()}</p>
                                        {order.discount_percentage && order.discount_percentage > 0 && (
                                          <p className="text-xs text-green-600">-{order.discount_percentage}% off</p>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={config.color}>
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {config.label}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {order.is_availed ? (
                                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Yes
                                        </Badge>
                                      ) : (
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button size="sm" variant="outline" className="h-7 text-xs">
                                              <ThumbsUp className="w-3 h-3 mr-1" />
                                              Confirm
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Confirm Discount Availed</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Did you visit the lab and avail this discount? This action cannot be undone.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>No, Cancel</AlertDialogCancel>
                                              <AlertDialogAction 
                                                onClick={() => handleConfirmAvailed(order.id)}
                                                className="bg-green-600 hover:bg-green-700"
                                              >
                                                Yes, Availed
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-sm">{format(new Date(order.created_at), "dd MMM yyyy")}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)}>
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Prescriptions Tab */}
                <TabsContent value="prescriptions" className="mt-6">
                  {approvedPrescriptions.length === 0 ? (
                    <Card className="text-center p-8">
                      <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">No approved prescription slips yet</p>
                      <p className="text-sm text-muted-foreground mt-2">Upload a prescription from any lab's detail page to get discounted test slips</p>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Approved Prescription Slips</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Slip ID</TableHead>
                                <TableHead>Lab</TableHead>
                                <TableHead>Tests</TableHead>
                                <TableHead>Total Payable</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {approvedPrescriptions.map((prescription) => {
                                const config = statusConfig[prescription.status] || statusConfig.pending;
                                const StatusIcon = config.icon;
                                const totalPayable = prescription.approved_tests.reduce((sum, t) => sum + (t.price || 0), 0);
                                const totalOriginal = prescription.approved_tests.reduce((sum, t) => sum + (t.original_price || t.price || 0), 0);
                                return (
                                  <TableRow key={prescription.id}>
                                    <TableCell>
                                      <span className="font-mono font-medium text-sm">{prescription.unique_id || 'Pending'}</span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {prescription.labs?.logo_url ? (
                                          <img src={prescription.labs.logo_url} alt={prescription.labs.name} className="w-8 h-8 rounded object-cover" />
                                        ) : (
                                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                            <Building2 className="w-4 h-4 text-primary" />
                                          </div>
                                        )}
                                        <span className="font-medium">{prescription.labs?.name || "Lab Pending"}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-sm">{prescription.approved_tests.length} test(s)</span>
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <p className="font-medium">Rs. {totalPayable.toLocaleString()}</p>
                                        {totalOriginal > totalPayable && (
                                          <p className="text-xs text-green-600">Save Rs. {(totalOriginal - totalPayable).toLocaleString()}</p>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={config.color}>
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {config.label}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-sm">{format(new Date(prescription.created_at), "dd MMM yyyy")}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="icon" onClick={() => handleViewPrescription(prescription)}>
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Doctor Appointments Tab */}
                <TabsContent value="doctor" className="mt-6">
                  {appointments.length === 0 ? (
                    <Card className="text-center p-8">
                      <Stethoscope className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">No doctor appointments yet</p>
                      <Button className="mt-4" onClick={() => navigate("/find-doctors")}>Find Doctors</Button>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Doctor Appointments</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Booking ID</TableHead>
                                <TableHead>Doctor</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Fee</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {appointments.map((appointment) => {
                                const config = statusConfig[appointment.status] || statusConfig.pending;
                                const StatusIcon = config.icon;
                                return (
                                  <TableRow key={appointment.id}>
                                    <TableCell>
                                      <span className="font-mono font-medium text-sm text-primary">{appointment.unique_id || 'Pending'}</span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {appointment.doctors?.photo_url ? (
                                          <img src={appointment.doctors.photo_url} alt={appointment.doctors.full_name} className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Stethoscope className="w-4 h-4 text-primary" />
                                          </div>
                                        )}
                                        <div>
                                          <p className="font-medium">{appointment.doctors?.full_name}</p>
                                          <p className="text-xs text-muted-foreground">{appointment.doctors?.doctor_specializations?.name || "General"}</p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="capitalize">
                                        {appointment.consultation_type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <p className="font-medium">{format(new Date(appointment.appointment_date), "dd MMM yyyy")}</p>
                                        <p className="text-xs text-muted-foreground">{appointment.appointment_time}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="font-medium">Rs. {appointment.fee.toLocaleString()}</span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Badge className={config.color}>
                                          <StatusIcon className="w-3 h-3 mr-1" />
                                          {config.label}
                                        </Badge>
                                        {appointment.prescription_url && (
                                          <Badge className="bg-green-100 text-green-700 text-xs">
                                            <FileText className="w-3 h-3 mr-1" />
                                            Prescription
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        {appointment.status === 'confirmed' && appointment.unique_id && (
                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="text-primary hover:text-primary/80"
                                            onClick={() => generateDoctorAppointmentPDF({
                                              bookingId: appointment.unique_id!,
                                              doctorName: appointment.doctors?.full_name || 'Doctor',
                                              doctorQualification: appointment.doctors?.qualification || undefined,
                                              doctorSpecialization: appointment.doctors?.doctor_specializations?.name || undefined,
                                              clinicName: appointment.doctors?.clinic_name || undefined,
                                              clinicAddress: appointment.doctors?.clinic_address || undefined,
                                              doctorPhone: appointment.doctors?.phone || undefined,
                                              patientName: userProfile?.full_name || undefined,
                                              patientPhone: userProfile?.phone || undefined,
                                              patientAge: userProfile?.age || undefined,
                                              patientGender: userProfile?.gender || undefined,
                                              appointmentDate: format(new Date(appointment.appointment_date), "dd MMM yyyy"),
                                              appointmentTime: appointment.appointment_time,
                                              consultationType: appointment.consultation_type,
                                              fee: appointment.fee,
                                            })}
                                            title="Download Slip"
                                          >
                                            <Download className="w-4 h-4" />
                                          </Button>
                                        )}
                                        {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => openCancelDialog('appointment', appointment.id)}
                                          >
                                            <Ban className="w-4 h-4" />
                                          </Button>
                                        )}
                                        <Button variant="ghost" size="icon" onClick={() => handleViewAppointment(appointment)}>
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Nursing Bookings Tab */}
                <TabsContent value="nursing" className="mt-6">
                  {nurseBookings.length === 0 ? (
                    <Card className="text-center p-8">
                      <UserRound className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">No nursing bookings yet</p>
                      <Button className="mt-4" onClick={() => navigate("/find-nurses")}>Find Nurses</Button>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Nursing Bookings</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Booking ID</TableHead>
                                <TableHead>Nurse</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {nurseBookings.map((booking) => {
                                const config = statusConfig[booking.status] || statusConfig.pending;
                                const StatusIcon = config.icon;
                                return (
                                  <TableRow key={booking.id}>
                                    <TableCell>
                                      <span className="font-mono font-medium text-sm text-primary">{booking.unique_id || 'Pending'}</span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {booking.nurses?.photo_url ? (
                                          <img src={booking.nurses.photo_url} alt={booking.nurses.full_name} className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <UserRound className="w-4 h-4 text-primary" />
                                          </div>
                                        )}
                                        <div>
                                          <p className="font-medium">{booking.nurses?.full_name}</p>
                                          <p className="text-xs text-muted-foreground">{booking.nurses?.qualification}</p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-sm">{booking.service_needed}</span>
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <p className="font-medium">{format(new Date(booking.preferred_date), "dd MMM yyyy")}</p>
                                        <p className="text-xs text-muted-foreground">{booking.preferred_time}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={config.color}>
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {config.label}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        {booking.status === 'confirmed' && booking.unique_id && (
                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="text-primary hover:text-primary/80"
                                            onClick={() => generateNurseBookingPDF({
                                              bookingId: booking.unique_id!,
                                              nurseName: booking.nurses?.full_name || 'Nurse',
                                              nurseQualification: booking.nurses?.qualification || undefined,
                                              nursePhone: booking.nurses?.phone || undefined,
                                              patientName: userProfile?.full_name || booking.patient_name || undefined,
                                              patientPhone: userProfile?.phone || booking.patient_phone || undefined,
                                              patientAge: userProfile?.age || undefined,
                                              patientGender: userProfile?.gender || undefined,
                                              patientAddress: booking.patient_address || undefined,
                                              serviceNeeded: booking.service_needed,
                                              preferredDate: format(new Date(booking.preferred_date), "dd MMM yyyy"),
                                              preferredTime: booking.preferred_time,
                                              fee: booking.nurses?.per_visit_fee || undefined,
                                            })}
                                            title="Download Slip"
                                          >
                                            <Download className="w-4 h-4" />
                                          </Button>
                                        )}
                                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => openCancelDialog('nurse', booking.id)}
                                          >
                                            <Ban className="w-4 h-4" />
                                          </Button>
                                        )}
                                        <Button variant="ghost" size="icon" onClick={() => handleViewNurseBooking(booking)}>
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Medicine Orders Tab */}
                <TabsContent value="medicine" className="mt-6">
                  {medicineOrders.length === 0 ? (
                    <Card className="text-center p-8">
                      <Pill className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">No medicine orders yet</p>
                      <Button className="mt-4" onClick={() => navigate("/pharmacies")}>Find Pharmacies</Button>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Medicine Orders</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Pharmacy</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Delivery Address</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {medicineOrders.map((order) => {
                                const config = statusConfig[order.status] || statusConfig.pending;
                                const StatusIcon = config.icon;
                                return (
                                  <TableRow key={order.id}>
                                    <TableCell>
                                      <span className="font-mono font-medium text-sm">{order.unique_id}</span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {order.medical_stores?.logo_url ? (
                                          <img src={order.medical_stores.logo_url} alt={order.medical_stores.name} className="w-8 h-8 rounded object-cover" />
                                        ) : (
                                          <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center">
                                            <Store className="w-4 h-4 text-emerald-600" />
                                          </div>
                                        )}
                                        <div>
                                          <p className="font-medium">{order.medical_stores?.name || "Unknown"}</p>
                                          <p className="text-xs text-muted-foreground">{order.medical_stores?.area}</p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {order.prescription_url ? (
                                        <Badge variant="outline" className="gap-1">
                                          <FileText className="w-3 h-3" />
                                          Prescription
                                        </Badge>
                                      ) : (
                                        <span className="text-sm">{order.medicines.length} medicine(s)</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-sm truncate max-w-[150px] block">{order.delivery_address}</span>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={config.color}>
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {config.label}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-sm">{format(new Date(order.created_at), "dd MMM yyyy")}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="icon" onClick={() => handleViewMedicineOrder(order)}>
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* View Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'order' && 'Lab Test Booking Details'}
              {dialogType === 'prescription' && 'Prescription Slip Details'}
              {dialogType === 'appointment' && 'Doctor Appointment Details'}
              {dialogType === 'nurse' && 'Nursing Booking Details'}
              {dialogType === 'medicine' && 'Medicine Order Details'}
            </DialogTitle>
          </DialogHeader>

          {/* Lab Order Details */}
          {dialogType === 'order' && selectedOrder && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono font-bold text-lg">{selectedOrder.unique_id}</p>
                </div>
                <Badge className={statusConfig[selectedOrder.status]?.color || ""}>
                  {statusConfig[selectedOrder.status]?.label}
                </Badge>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {selectedOrder.labs?.logo_url ? (
                      <img src={selectedOrder.labs.logo_url} alt={selectedOrder.labs.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{selectedOrder.labs?.name || "Unknown Lab"}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(selectedOrder.created_at), "dd MMM yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Valid till {format(new Date(selectedOrder.validity_date), "dd MMM yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Tests Booked</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedOrder.tests.map((test, index) => (
                      <div key={index} className="flex justify-between py-2 border-b last:border-0">
                        <span>{test.test_name}</span>
                        <div className="text-right">
                          {test.discounted_price && test.discounted_price < test.price ? (
                            <>
                              <span className="font-medium">Rs. {test.discounted_price}</span>
                              <span className="text-xs text-muted-foreground line-through ml-2">Rs. {test.price}</span>
                            </>
                          ) : (
                            <span className="font-medium">Rs. {test.price}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-4 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>Rs. {selectedOrder.original_total.toLocaleString()}</span>
                    </div>
                    {selectedOrder.discount_percentage && selectedOrder.discount_percentage > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({selectedOrder.discount_percentage}%)</span>
                        <span>-Rs. {(selectedOrder.original_total - selectedOrder.discounted_total).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span>Rs. {selectedOrder.discounted_total.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={selectedOrder.is_availed ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/30 bg-yellow-500/5"}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedOrder.is_availed ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <ThumbsUp className="w-6 h-6 text-yellow-600" />
                      )}
                      <div>
                        <p className="font-semibold">
                          {selectedOrder.is_availed ? "Discount Availed" : "Did you avail this discount?"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedOrder.is_availed && selectedOrder.availed_at
                            ? `Confirmed on ${format(new Date(selectedOrder.availed_at), "dd MMM yyyy")}`
                            : "Confirm after visiting the lab"}
                        </p>
                      </div>
                    </div>
                    {!selectedOrder.is_availed && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <ThumbsUp className="w-4 h-4 mr-2" />
                            Yes, Availed
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Discount Availed</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you visited the lab and availed this discount?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleConfirmAvailed(selectedOrder.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Yes, Confirm
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    generateBookingPDF({
                      uniqueId: selectedOrder.unique_id,
                      labName: selectedOrder.labs?.name || 'Lab',
                      patientName: userProfile?.full_name || undefined,
                      patientPhone: userProfile?.phone || undefined,
                      patientCity: userProfile?.city || undefined,
                      patientAge: userProfile?.age || undefined,
                      patientGender: userProfile?.gender || undefined,
                      tests: selectedOrder.tests.map(t => ({
                        name: t.test_name,
                        originalPrice: t.price,
                        discountedPrice: t.discounted_price || t.price
                      })),
                      totalOriginal: selectedOrder.original_total,
                      totalDiscounted: selectedOrder.discounted_total,
                      totalSavings: selectedOrder.original_total - selectedOrder.discounted_total,
                      discountPercentage: selectedOrder.discount_percentage || 0,
                      bookingDate: format(new Date(selectedOrder.created_at), 'dd/MM/yyyy'),
                    });
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          )}

          {/* Prescription Slip Details */}
          {dialogType === 'prescription' && selectedPrescription && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Slip ID</p>
                  <p className="font-mono font-bold text-lg">{selectedPrescription.unique_id || 'Pending Assignment'}</p>
                </div>
                <Badge className={statusConfig[selectedPrescription.status]?.color || ""}>
                  {statusConfig[selectedPrescription.status]?.label}
                </Badge>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {selectedPrescription.labs?.logo_url ? (
                      <img src={selectedPrescription.labs.logo_url} alt={selectedPrescription.labs.name} className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{selectedPrescription.labs?.name || 'Lab Pending'}</p>
                      {selectedPrescription.labs?.discount_percentage && (
                        <p className="text-sm text-green-600">{selectedPrescription.labs.discount_percentage}% Discount</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Approved Tests</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Test Name</TableHead>
                        <TableHead className="text-right">Original</TableHead>
                        <TableHead className="text-right">Payable</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPrescription.approved_tests.map((test, index) => (
                        <TableRow key={index}>
                          <TableCell>{test.test_name}</TableCell>
                          <TableCell className="text-right text-muted-foreground line-through">
                            Rs. {(test.original_price || test.price).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            Rs. {test.price.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Savings</p>
                      <p className="text-xl font-bold text-green-600">
                        Rs. {(selectedPrescription.approved_tests.reduce((sum, t) => sum + ((t.original_price || t.price) - t.price), 0)).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Amount Payable</p>
                      <p className="text-2xl font-bold">
                        Rs. {(selectedPrescription.approved_tests.reduce((sum, t) => sum + t.price, 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedPrescription.admin_notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{selectedPrescription.admin_notes}</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3">
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    const totalOriginal = selectedPrescription.approved_tests.reduce((sum, t) => sum + (t.original_price || t.price), 0);
                    const totalDiscounted = selectedPrescription.approved_tests.reduce((sum, t) => sum + t.price, 0);
                    generateBookingPDF({
                      uniqueId: selectedPrescription.unique_id || 'PENDING',
                      labName: selectedPrescription.labs?.name || 'Lab',
                      patientName: userProfile?.full_name || undefined,
                      patientPhone: userProfile?.phone || undefined,
                      patientCity: userProfile?.city || undefined,
                      patientAge: userProfile?.age || undefined,
                      patientGender: userProfile?.gender || undefined,
                      tests: selectedPrescription.approved_tests.map(t => ({
                        name: t.test_name,
                        originalPrice: t.original_price || t.price,
                        discountedPrice: t.price
                      })),
                      totalOriginal: totalOriginal,
                      totalDiscounted: totalDiscounted,
                      totalSavings: totalOriginal - totalDiscounted,
                      discountPercentage: selectedPrescription.labs?.discount_percentage || 0,
                      bookingDate: format(new Date(selectedPrescription.created_at), 'dd/MM/yyyy'),
                    });
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Slip
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          )}

          {/* Doctor Appointment Details */}
          {dialogType === 'appointment' && selectedAppointment && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Booking ID</p>
                  <p className="font-mono font-bold text-lg text-primary">{selectedAppointment.unique_id || 'Pending'}</p>
                </div>
                <Badge className={statusConfig[selectedAppointment.status]?.color || ""}>
                  {statusConfig[selectedAppointment.status]?.label}
                </Badge>
              </div>

              <Badge variant="outline" className="capitalize w-fit">
                {selectedAppointment.consultation_type} Consultation
              </Badge>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {selectedAppointment.doctors?.photo_url ? (
                      <img src={selectedAppointment.doctors.photo_url} alt={selectedAppointment.doctors.full_name} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Stethoscope className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-lg">{selectedAppointment.doctors?.full_name}</p>
                      <p className="text-muted-foreground">{selectedAppointment.doctors?.qualification}</p>
                      <p className="text-sm text-primary">{selectedAppointment.doctors?.doctor_specializations?.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">{format(new Date(selectedAppointment.appointment_date), "dd MMM yyyy")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">{selectedAppointment.appointment_time}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedAppointment.doctors?.clinic_name && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">{selectedAppointment.doctors.clinic_name}</p>
                        <p className="text-sm text-muted-foreground">{selectedAppointment.doctors.clinic_address}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Consultation Fee</span>
                    <span className="text-2xl font-bold">Rs. {selectedAppointment.fee.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {selectedAppointment.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Your Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{selectedAppointment.notes}</p>
                  </CardContent>
                </Card>
              )}

              {selectedAppointment.consultation_notes && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" />
                      Doctor's Consultation Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedAppointment.consultation_notes}</p>
                  </CardContent>
                </Card>
              )}

              {selectedAppointment.prescription_url && (
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="font-semibold">Prescription Available</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded on {selectedAppointment.prescription_uploaded_at 
                              ? format(new Date(selectedAppointment.prescription_uploaded_at), "dd MMM yyyy")
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={async () => {
                          try {
                            // prescription_url contains the file path like "appointmentId/timestamp.ext"
                            const filePath = selectedAppointment.prescription_url!;
                            
                            const { data, error } = await supabase.storage
                              .from("prescriptions")
                              .createSignedUrl(filePath, 300); // 5 min expiry
                            
                            if (error) {
                              console.error("Signed URL error:", error);
                              throw error;
                            }
                            
                            if (data?.signedUrl) {
                              window.open(data.signedUrl, '_blank');
                            } else {
                              throw new Error("No signed URL returned");
                            }
                          } catch (error: any) {
                            console.error("Error getting prescription:", error);
                            toast.error(error?.message || "Failed to download prescription");
                          }
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Download Slip for Confirmed Appointments */}
              {selectedAppointment.status === 'confirmed' && selectedAppointment.unique_id && (
                <div className="flex gap-3">
                  <Button 
                    className="flex-1"
                    onClick={() => generateDoctorAppointmentPDF({
                      bookingId: selectedAppointment.unique_id!,
                      doctorName: selectedAppointment.doctors?.full_name || 'Doctor',
                      doctorQualification: selectedAppointment.doctors?.qualification || undefined,
                      doctorSpecialization: selectedAppointment.doctors?.doctor_specializations?.name || undefined,
                      clinicName: selectedAppointment.doctors?.clinic_name || undefined,
                      clinicAddress: selectedAppointment.doctors?.clinic_address || undefined,
                      doctorPhone: selectedAppointment.doctors?.phone || undefined,
                      patientName: userProfile?.full_name || undefined,
                      patientPhone: userProfile?.phone || undefined,
                      patientAge: userProfile?.age || undefined,
                      patientGender: userProfile?.gender || undefined,
                      appointmentDate: format(new Date(selectedAppointment.appointment_date), "dd MMM yyyy"),
                      appointmentTime: selectedAppointment.appointment_time,
                      consultationType: selectedAppointment.consultation_type,
                      fee: selectedAppointment.fee,
                    })}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Slip
                  </Button>
                  <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => navigate(`/doctor/${selectedAppointment.doctors?.id}`)}>
                  View Doctor Profile
                </Button>
                {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'confirmed') && (
                  <Button 
                    variant="destructive" 
                    onClick={() => openCancelDialog('appointment', selectedAppointment.id)}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Nursing Booking Details */}
          {dialogType === 'nurse' && selectedNurseBooking && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Booking ID</p>
                  <p className="font-mono font-bold text-lg text-primary">{selectedNurseBooking.unique_id || 'Pending'}</p>
                </div>
                <Badge className={statusConfig[selectedNurseBooking.status]?.color || ""}>
                  {statusConfig[selectedNurseBooking.status]?.label}
                </Badge>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {selectedNurseBooking.nurses?.photo_url ? (
                      <img src={selectedNurseBooking.nurses.photo_url} alt={selectedNurseBooking.nurses.full_name} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserRound className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-lg">{selectedNurseBooking.nurses?.full_name}</p>
                      <p className="text-muted-foreground">{selectedNurseBooking.nurses?.qualification}</p>
                      {selectedNurseBooking.nurses?.phone && (
                        <p className="text-sm flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {selectedNurseBooking.nurses.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Service Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">Service Needed</span>
                    <span className="font-medium">{selectedNurseBooking.service_needed}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">Preferred Date</span>
                    <span className="font-medium">{format(new Date(selectedNurseBooking.preferred_date), "dd MMM yyyy")}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">Preferred Time</span>
                    <span className="font-medium">{selectedNurseBooking.preferred_time}</span>
                  </div>
                  {selectedNurseBooking.patient_address && (
                    <div className="py-2">
                      <span className="text-muted-foreground block mb-1">Address</span>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-primary mt-0.5" />
                        <span className="font-medium">{selectedNurseBooking.patient_address}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedNurseBooking.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Your Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{selectedNurseBooking.notes}</p>
                  </CardContent>
                </Card>
              )}

              {selectedNurseBooking.nurse_notes && (
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Nurse's Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedNurseBooking.nurse_notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Download Slip for Confirmed Nurse Bookings */}
              {selectedNurseBooking.status === 'confirmed' && selectedNurseBooking.unique_id && (
                <div className="flex gap-3">
                  <Button 
                    className="flex-1"
                    onClick={() => generateNurseBookingPDF({
                      bookingId: selectedNurseBooking.unique_id!,
                      nurseName: selectedNurseBooking.nurses?.full_name || 'Nurse',
                      nurseQualification: selectedNurseBooking.nurses?.qualification || undefined,
                      nursePhone: selectedNurseBooking.nurses?.phone || undefined,
                      patientName: userProfile?.full_name || selectedNurseBooking.patient_name || undefined,
                      patientPhone: userProfile?.phone || selectedNurseBooking.patient_phone || undefined,
                      patientAge: userProfile?.age || undefined,
                      patientGender: userProfile?.gender || undefined,
                      patientAddress: selectedNurseBooking.patient_address || undefined,
                      serviceNeeded: selectedNurseBooking.service_needed,
                      preferredDate: format(new Date(selectedNurseBooking.preferred_date), "dd MMM yyyy"),
                      preferredTime: selectedNurseBooking.preferred_time,
                      fee: selectedNurseBooking.nurses?.per_visit_fee || undefined,
                    })}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Slip
                  </Button>
                  <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => navigate(`/nurse/${selectedNurseBooking.nurses?.id}`)}>
                  View Nurse Profile
                </Button>
                {(selectedNurseBooking.status === 'pending' || selectedNurseBooking.status === 'confirmed') && (
                  <Button 
                    variant="destructive" 
                    onClick={() => openCancelDialog('nurse', selectedNurseBooking.id)}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Medicine Order Details */}
          {dialogType === 'medicine' && selectedMedicineOrder && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono font-bold text-lg">{selectedMedicineOrder.unique_id}</p>
                </div>
                <Badge className={statusConfig[selectedMedicineOrder.status]?.color || ""}>
                  {statusConfig[selectedMedicineOrder.status]?.label || selectedMedicineOrder.status}
                </Badge>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {selectedMedicineOrder.medical_stores?.logo_url ? (
                      <img src={selectedMedicineOrder.medical_stores.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Store className="w-6 h-6 text-emerald-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{selectedMedicineOrder.medical_stores?.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedMedicineOrder.medical_stores?.area}, {selectedMedicineOrder.medical_stores?.city}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedMedicineOrder.prescription_url ? (
                    <a href={selectedMedicineOrder.prescription_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                      <FileText className="w-4 h-4" />
                      View Prescription
                    </a>
                  ) : (
                    <div className="space-y-2">
                      {selectedMedicineOrder.medicines.map((med, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="font-medium">{med.name}</span>
                          <Badge variant="secondary">Qty: {med.quantity}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{selectedMedicineOrder.delivery_address}</p>
                </CardContent>
              </Card>

              {selectedMedicineOrder.final_price && (
                <Card className="bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Amount</span>
                      <span className="text-2xl font-bold">Rs. {selectedMedicineOrder.final_price.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button className="w-full" onClick={() => navigate(`/pharmacy/${selectedMedicineOrder.medical_stores?.id}`)}>
                View Pharmacy
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="w-5 h-5" />
              Cancel {cancelType === 'appointment' ? 'Appointment' : 'Booking'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this {cancelType === 'appointment' ? 'doctor appointment' : 'nursing booking'}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason for cancellation (optional)
              </label>
              <Textarea
                placeholder="Please let us know why you're cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCancelling}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  Yes, Cancel
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBookings;