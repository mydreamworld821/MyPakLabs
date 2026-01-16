import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import InquiryTrendsChart from "@/components/admin/InquiryTrendsChart";
import {
  Building2,
  TestTube,
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
  FileText,
  Activity,
  Star,
  Stethoscope,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  FlaskConical,
  Calendar,
  Percent,
  Eye,
  TrendingDown,
  AlertTriangle,
  Heart,
  Scissors,
  MessageSquare,
  MapPin,
  Store,
  Pill
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

interface DashboardStats {
  // Labs
  totalLabs: number;
  activeLabs: number;
  featuredLabs: number;
  avgLabDiscount: number;
  
  // Tests
  totalTests: number;
  activeTests: number;
  testCategories: number;
  labTestPrices: number;
  
  // Orders
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  availedOrders: number;
  
  // Prescriptions
  totalPrescriptions: number;
  pendingPrescriptions: number;
  approvedPrescriptions: number;
  rejectedPrescriptions: number;
  
  // Users
  totalUsers: number;
  adminUsers: number;
  moderatorUsers: number;
  patientUsers: number;
  
  // Doctors
  totalDoctors: number;
  approvedDoctors: number;
  pendingDoctors: number;
  featuredDoctors: number;
  
  // Specializations
  totalSpecializations: number;
  activeSpecializations: number;
  
  // Revenue & Savings
  totalRevenue: number;
  totalSavings: number;
  monthlyRevenue: number;
  todayOrders: number;
  
  // Service Cards
  totalServiceCards: number;
  activeServiceCards: number;
  
  // Appointments
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  
  // Surgery Inquiries
  totalSurgeryInquiries: number;
  pendingSurgeryInquiries: number;
  
  // Emergency Nursing
  totalEmergencyRequests: number;
  liveEmergencyRequests: number;
  
  // Nurse Bookings
  totalNurseBookings: number;
  pendingNurseBookings: number;
  
  // Nurses
  totalNurses: number;
  approvedNurses: number;
  pendingNurses: number;
  
  // Pharmacies/Medical Stores
  totalPharmacies: number;
  approvedPharmacies: number;
  pendingPharmacies: number;
  
  // Medicine Orders
  totalMedicineOrders: number;
  pendingMedicineOrders: number;
  
  // Reviews & Partners
  pendingReviews: number;
  pendingPartners: number;
}

interface RecentOrder {
  id: string;
  unique_id: string;
  status: string;
  discounted_total: number;
  created_at: string;
  labs: { name: string } | null;
}

interface RecentPrescription {
  id: string;
  unique_id: string | null;
  status: string;
  created_at: string;
}

interface RecentSurgeryInquiry {
  id: string;
  name: string;
  surgery_name: string;
  status: string;
  created_at: string;
}

interface RecentEmergencyRequest {
  id: string;
  patient_name: string;
  city: string | null;
  urgency: string;
  status: string;
  created_at: string;
}

interface RecentNurseBooking {
  id: string;
  patient_name: string;
  service_needed: string;
  status: string;
  created_at: string;
}

interface RecentAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: string;
  status: string;
  fee: number;
  created_at: string;
  doctors: {
    full_name: string;
  } | null;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalLabs: 0, activeLabs: 0, featuredLabs: 0, avgLabDiscount: 0,
    totalTests: 0, activeTests: 0, testCategories: 0, labTestPrices: 0,
    totalOrders: 0, pendingOrders: 0, confirmedOrders: 0, completedOrders: 0, cancelledOrders: 0, availedOrders: 0,
    totalPrescriptions: 0, pendingPrescriptions: 0, approvedPrescriptions: 0, rejectedPrescriptions: 0,
    totalUsers: 0, adminUsers: 0, moderatorUsers: 0, patientUsers: 0,
    totalDoctors: 0, approvedDoctors: 0, pendingDoctors: 0, featuredDoctors: 0,
    totalSpecializations: 0, activeSpecializations: 0,
    totalRevenue: 0, totalSavings: 0, monthlyRevenue: 0, todayOrders: 0,
    totalServiceCards: 0, activeServiceCards: 0,
    totalAppointments: 0, pendingAppointments: 0, confirmedAppointments: 0,
    totalSurgeryInquiries: 0, pendingSurgeryInquiries: 0,
    totalEmergencyRequests: 0, liveEmergencyRequests: 0,
    totalNurseBookings: 0, pendingNurseBookings: 0,
    totalNurses: 0, approvedNurses: 0, pendingNurses: 0,
    totalPharmacies: 0, approvedPharmacies: 0, pendingPharmacies: 0,
    totalMedicineOrders: 0, pendingMedicineOrders: 0,
    pendingReviews: 0, pendingPartners: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<RecentPrescription[]>([]);
  const [recentSurgeryInquiries, setRecentSurgeryInquiries] = useState<RecentSurgeryInquiry[]>([]);
  const [recentEmergencyRequests, setRecentEmergencyRequests] = useState<RecentEmergencyRequest[]>([]);
  const [recentNurseBookings, setRecentNurseBookings] = useState<RecentNurseBooking[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      const [
        // Labs
        { count: totalLabs },
        { count: activeLabs },
        { count: featuredLabs },
        { data: labDiscounts },
        
        // Tests
        { count: totalTests },
        { count: activeTests },
        { data: testCategories },
        { count: labTestPrices },
        
        // Orders
        { count: totalOrders },
        { count: pendingOrders },
        { count: confirmedOrders },
        { count: completedOrders },
        { count: cancelledOrders },
        { count: availedOrders },
        { count: todayOrders },
        
        // Order revenue data
        { data: allOrdersData },
        { data: monthlyOrdersData },
        
        // Prescriptions
        { count: totalPrescriptions },
        { count: pendingPrescriptions },
        { count: approvedPrescriptions },
        { count: rejectedPrescriptions },
        
        // Users & Roles
        { count: totalUsers },
        { count: adminUsers },
        { count: moderatorUsers },
        { count: patientUsers },
        
        // Doctors
        { count: totalDoctors },
        { count: approvedDoctors },
        { count: pendingDoctors },
        { count: featuredDoctors },
        
        // Specializations
        { count: totalSpecializations },
        { count: activeSpecializations },
        
        // Service Cards
        { count: totalServiceCards },
        { count: activeServiceCards },
        
        // Appointments
        { count: totalAppointments },
        { count: pendingAppointments },
        { count: confirmedAppointments },
        
        // Surgery Inquiries
        { count: totalSurgeryInquiries },
        { count: pendingSurgeryInquiries },
        
        // Emergency Nursing
        { count: totalEmergencyRequests },
        { count: liveEmergencyRequests },
        
        // Nurse Bookings
        { count: totalNurseBookings },
        { count: pendingNurseBookings },
        
        // Nurses
        { count: totalNurses },
        { count: approvedNurses },
        { count: pendingNurses },
        
        // Pharmacies
        { count: totalPharmacies },
        { count: approvedPharmacies },
        { count: pendingPharmacies },
        
        // Medicine Orders
        { count: totalMedicineOrders },
        { count: pendingMedicineOrders },
        
        // Reviews & Partners
        { count: pendingReviews },
        { count: pendingPartners },
        
        // Recent data
        { data: recentOrdersData },
        { data: recentPrescriptionsData },
        { data: recentSurgeryInquiriesData },
        { data: recentEmergencyRequestsData },
        { data: recentNurseBookingsData },
        { data: recentAppointmentsData }
      ] = await Promise.all([
        // Labs
        supabase.from("labs").select("*", { count: "exact", head: true }),
        supabase.from("labs").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("labs").select("*", { count: "exact", head: true }).eq("is_featured", true),
        supabase.from("labs").select("discount_percentage"),
        
        // Tests
        supabase.from("tests").select("*", { count: "exact", head: true }),
        supabase.from("tests").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("tests").select("category"),
        supabase.from("lab_tests").select("*", { count: "exact", head: true }),
        
        // Orders
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("is_availed", true),
        supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", today),
        
        // Revenue calculations
        supabase.from("orders").select("discounted_total, original_total"),
        supabase.from("orders").select("discounted_total").gte("created_at", monthStart).lte("created_at", monthEnd),
        
        // Prescriptions
        supabase.from("prescriptions").select("*", { count: "exact", head: true }),
        supabase.from("prescriptions").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
        supabase.from("prescriptions").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("prescriptions").select("*", { count: "exact", head: true }).eq("status", "rejected"),
        
        // Users & Roles
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "moderator"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "patient"),
        
        // Doctors
        supabase.from("doctors").select("*", { count: "exact", head: true }),
        supabase.from("doctors").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("doctors").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("doctors").select("*", { count: "exact", head: true }).eq("is_featured", true),
        
        // Specializations
        supabase.from("doctor_specializations").select("*", { count: "exact", head: true }),
        supabase.from("doctor_specializations").select("*", { count: "exact", head: true }).eq("is_active", true),
        
        // Service Cards
        supabase.from("service_cards").select("*", { count: "exact", head: true }),
        supabase.from("service_cards").select("*", { count: "exact", head: true }).eq("is_active", true),
        
        // Appointments
        supabase.from("appointments").select("*", { count: "exact", head: true }),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
        
        // Surgery Inquiries
        supabase.from("surgery_inquiries").select("*", { count: "exact", head: true }),
        supabase.from("surgery_inquiries").select("*", { count: "exact", head: true }).eq("status", "pending"),
        
        // Emergency Nursing
        supabase.from("emergency_nursing_requests").select("*", { count: "exact", head: true }),
        supabase.from("emergency_nursing_requests").select("*", { count: "exact", head: true }).eq("status", "live"),
        
        // Nurse Bookings
        supabase.from("nurse_bookings").select("*", { count: "exact", head: true }),
        supabase.from("nurse_bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
        
        // Nurses
        supabase.from("nurses").select("*", { count: "exact", head: true }),
        supabase.from("nurses").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("nurses").select("*", { count: "exact", head: true }).eq("status", "pending"),
        
        // Pharmacies
        supabase.from("medical_stores").select("*", { count: "exact", head: true }),
        supabase.from("medical_stores").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("medical_stores").select("*", { count: "exact", head: true }).eq("status", "pending"),
        
        // Medicine Orders
        supabase.from("medicine_orders").select("*", { count: "exact", head: true }),
        supabase.from("medicine_orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        
        // Reviews & Partners
        supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("partners").select("*", { count: "exact", head: true }).eq("is_approved", false),
        
        // Recent data
        supabase.from("orders").select("id, unique_id, status, discounted_total, created_at, labs(name)").order("created_at", { ascending: false }).limit(5),
        supabase.from("prescriptions").select("id, unique_id, status, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("surgery_inquiries").select("id, name, surgery_name, status, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("emergency_nursing_requests").select("id, patient_name, city, urgency, status, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("nurse_bookings").select("id, patient_name, service_needed, status, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("appointments").select("id, appointment_date, appointment_time, consultation_type, status, fee, created_at, doctors:doctor_id(full_name)").order("created_at", { ascending: false }).limit(5)
      ]);

      // Calculate averages and totals
      const avgDiscount = labDiscounts?.length 
        ? Math.round(labDiscounts.reduce((sum, l) => sum + (l.discount_percentage || 0), 0) / labDiscounts.length)
        : 0;
      
      const uniqueCategories = new Set(testCategories?.map(t => t.category).filter(Boolean));
      
      const totalRevenue = allOrdersData?.reduce((sum, o) => sum + (Number(o.discounted_total) || 0), 0) || 0;
      const totalSavings = allOrdersData?.reduce((sum, o) => sum + ((Number(o.original_total) || 0) - (Number(o.discounted_total) || 0)), 0) || 0;
      const monthlyRevenue = monthlyOrdersData?.reduce((sum, o) => sum + (Number(o.discounted_total) || 0), 0) || 0;

      setStats({
        totalLabs: totalLabs || 0,
        activeLabs: activeLabs || 0,
        featuredLabs: featuredLabs || 0,
        avgLabDiscount: avgDiscount,
        
        totalTests: totalTests || 0,
        activeTests: activeTests || 0,
        testCategories: uniqueCategories.size,
        labTestPrices: labTestPrices || 0,
        
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        confirmedOrders: confirmedOrders || 0,
        completedOrders: completedOrders || 0,
        cancelledOrders: cancelledOrders || 0,
        availedOrders: availedOrders || 0,
        todayOrders: todayOrders || 0,
        
        totalPrescriptions: totalPrescriptions || 0,
        pendingPrescriptions: pendingPrescriptions || 0,
        approvedPrescriptions: approvedPrescriptions || 0,
        rejectedPrescriptions: rejectedPrescriptions || 0,
        
        totalUsers: totalUsers || 0,
        adminUsers: adminUsers || 0,
        moderatorUsers: moderatorUsers || 0,
        patientUsers: patientUsers || 0,
        
        totalDoctors: totalDoctors || 0,
        approvedDoctors: approvedDoctors || 0,
        pendingDoctors: pendingDoctors || 0,
        featuredDoctors: featuredDoctors || 0,
        
        totalSpecializations: totalSpecializations || 0,
        activeSpecializations: activeSpecializations || 0,
        
        totalRevenue,
        totalSavings,
        monthlyRevenue,
        
        totalServiceCards: totalServiceCards || 0,
        activeServiceCards: activeServiceCards || 0,
        
        totalAppointments: totalAppointments || 0,
        pendingAppointments: pendingAppointments || 0,
        confirmedAppointments: confirmedAppointments || 0,
        
        totalSurgeryInquiries: totalSurgeryInquiries || 0,
        pendingSurgeryInquiries: pendingSurgeryInquiries || 0,
        
        totalEmergencyRequests: totalEmergencyRequests || 0,
        liveEmergencyRequests: liveEmergencyRequests || 0,
        
        totalNurseBookings: totalNurseBookings || 0,
        pendingNurseBookings: pendingNurseBookings || 0,
        
        totalNurses: totalNurses || 0,
        approvedNurses: approvedNurses || 0,
        pendingNurses: pendingNurses || 0,
        
        totalPharmacies: totalPharmacies || 0,
        approvedPharmacies: approvedPharmacies || 0,
        pendingPharmacies: pendingPharmacies || 0,
        
        totalMedicineOrders: totalMedicineOrders || 0,
        pendingMedicineOrders: pendingMedicineOrders || 0,
        
        pendingReviews: pendingReviews || 0,
        pendingPartners: pendingPartners || 0
      });

      setRecentOrders(recentOrdersData as RecentOrder[] || []);
      setRecentPrescriptions(recentPrescriptionsData as RecentPrescription[] || []);
      setRecentSurgeryInquiries(recentSurgeryInquiriesData as RecentSurgeryInquiry[] || []);
      setRecentEmergencyRequests(recentEmergencyRequestsData as RecentEmergencyRequest[] || []);
      setRecentNurseBookings(recentNurseBookingsData as RecentNurseBooking[] || []);
      setRecentAppointments(recentAppointmentsData as RecentAppointment[] || []);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_review':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'confirmed':
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Completed</Badge>;
      case 'cancelled':
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's an overview of your platform.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </div>
        </div>

        {/* Key Metrics - Top Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold">Rs. {stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-emerald-200 text-xs mt-1">This Month: Rs. {stats.monthlyRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="w-10 h-10 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Customer Savings</p>
                  <p className="text-2xl font-bold">Rs. {stats.totalSavings.toLocaleString()}</p>
                  <p className="text-blue-200 text-xs mt-1">{stats.availedOrders} orders availed</p>
                </div>
                <TrendingDown className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  <p className="text-purple-200 text-xs mt-1">Today: {stats.todayOrders}</p>
                </div>
                <ShoppingCart className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-orange-200 text-xs mt-1">Patients: {stats.patientUsers}</p>
                </div>
                <Users className="w-10 h-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Actions - Alerts */}
        {(stats.pendingOrders > 0 || stats.pendingPrescriptions > 0 || stats.pendingDoctors > 0 || stats.liveEmergencyRequests > 0 || stats.pendingSurgeryInquiries > 0 || stats.pendingNurseBookings > 0 || stats.pendingNurses > 0 || stats.pendingPharmacies > 0 || stats.pendingMedicineOrders > 0) && (
          <div className="space-y-4">
            {/* Critical - Emergency & Live */}
            {(stats.liveEmergencyRequests > 0) && (
              <Link to="/admin/emergency-requests">
                <Card className="border-red-300 bg-red-100 hover:shadow-md transition-shadow cursor-pointer animate-pulse">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-200 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-900">🚨 {stats.liveEmergencyRequests} Live Emergency Requests</p>
                      <p className="text-sm text-red-700">Patients waiting for nurses NOW</p>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-red-600 ml-auto" />
                  </CardContent>
                </Card>
              </Link>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.pendingOrders > 0 && (
                <Link to="/admin/orders">
                  <Card className="border-yellow-200 bg-yellow-50 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-yellow-900">{stats.pendingOrders} Pending Orders</p>
                        <p className="text-sm text-yellow-700">Require confirmation</p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-yellow-600 ml-auto" />
                    </CardContent>
                  </Card>
                </Link>
              )}
              
              {stats.pendingPrescriptions > 0 && (
                <Link to="/admin/prescriptions">
                  <Card className="border-red-200 bg-red-50 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-red-900">{stats.pendingPrescriptions} Pending Prescriptions</p>
                        <p className="text-sm text-red-700">Need review</p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-red-600 ml-auto" />
                    </CardContent>
                  </Card>
                </Link>
              )}
              
              {stats.pendingDoctors > 0 && (
                <Link to="/admin/doctors">
                  <Card className="border-blue-200 bg-blue-50 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Stethoscope className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900">{stats.pendingDoctors} Pending Doctors</p>
                        <p className="text-sm text-blue-700">Awaiting approval</p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-blue-600 ml-auto" />
                    </CardContent>
                  </Card>
                </Link>
              )}
              
              {stats.pendingNurses > 0 && (
                <Link to="/admin/nurses">
                  <Card className="border-pink-200 bg-pink-50 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                        <Heart className="w-6 h-6 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-pink-900">{stats.pendingNurses} Pending Nurses</p>
                        <p className="text-sm text-pink-700">Awaiting approval</p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-pink-600 ml-auto" />
                    </CardContent>
                  </Card>
                </Link>
              )}
              
              {stats.pendingSurgeryInquiries > 0 && (
                <Link to="/admin/surgery-inquiries">
                  <Card className="border-purple-200 bg-purple-50 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <Scissors className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-purple-900">{stats.pendingSurgeryInquiries} Surgery Inquiries</p>
                        <p className="text-sm text-purple-700">Need follow-up</p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-purple-600 ml-auto" />
                    </CardContent>
                  </Card>
                </Link>
              )}
              
              {stats.pendingNurseBookings > 0 && (
                <Link to="/admin/nurses">
                  <Card className="border-rose-200 bg-rose-50 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-rose-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-rose-900">{stats.pendingNurseBookings} Nurse Bookings</p>
                        <p className="text-sm text-rose-700">Pending confirmation</p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-rose-600 ml-auto" />
                    </CardContent>
                  </Card>
                </Link>
              )}
              
              {stats.pendingPharmacies > 0 && (
                <Link to="/admin/medical-stores">
                  <Card className="border-emerald-200 bg-emerald-50 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Store className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-emerald-900">{stats.pendingPharmacies} Pending Pharmacies</p>
                        <p className="text-sm text-emerald-700">Awaiting approval</p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-emerald-600 ml-auto" />
                    </CardContent>
                  </Card>
                </Link>
              )}
              
              {stats.pendingMedicineOrders > 0 && (
                <Link to="/admin/medical-stores">
                  <Card className="border-teal-200 bg-teal-50 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                        <Pill className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-teal-900">{stats.pendingMedicineOrders} Medicine Orders</p>
                        <p className="text-sm text-teal-700">Pending fulfillment</p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-teal-600 ml-auto" />
                    </CardContent>
                  </Card>
                </Link>
              )}
              
              {stats.pendingReviews > 0 && (
                <Link to="/admin/reviews">
                  <Card className="border-purple-200 bg-purple-50 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-purple-900">{stats.pendingReviews} Reviews</p>
                        <p className="text-sm text-purple-700">Awaiting approval</p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-purple-600 ml-auto" />
                    </CardContent>
                  </Card>
                </Link>
              )}
              
              {stats.pendingPartners > 0 && (
                <Link to="/admin/partners">
                  <Card className="border-indigo-200 bg-indigo-50 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-indigo-900">{stats.pendingPartners} Partners</p>
                        <p className="text-sm text-indigo-700">Registration requests</p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-indigo-600 ml-auto" />
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Labs Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                Labs Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{stats.totalLabs}</p>
                  <p className="text-xs text-muted-foreground">Total Labs</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{stats.activeLabs}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{stats.featuredLabs}</p>
                  <p className="text-xs text-muted-foreground">Featured</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{stats.avgLabDiscount}%</p>
                  <p className="text-xs text-muted-foreground">Avg Discount</p>
                </div>
              </div>
              <Link to="/admin/labs">
                <Button variant="outline" size="sm" className="w-full">
                  Manage Labs <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Tests Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TestTube className="w-5 h-5 text-purple-500" />
                Tests Catalog
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{stats.totalTests}</p>
                  <p className="text-xs text-muted-foreground">Total Tests</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{stats.activeTests}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{stats.testCategories}</p>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{stats.labTestPrices}</p>
                  <p className="text-xs text-muted-foreground">Price Entries</p>
                </div>
              </div>
              <Link to="/admin/tests">
                <Button variant="outline" size="sm" className="w-full">
                  Manage Tests <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Orders Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-green-500" />
                Orders Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium">{stats.pendingOrders}</span>
                </div>
                <Progress value={(stats.pendingOrders / Math.max(stats.totalOrders, 1)) * 100} className="h-2 bg-yellow-100" />
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Confirmed</span>
                  <span className="font-medium">{stats.confirmedOrders}</span>
                </div>
                <Progress value={(stats.confirmedOrders / Math.max(stats.totalOrders, 1)) * 100} className="h-2 bg-blue-100" />
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium">{stats.completedOrders}</span>
                </div>
                <Progress value={(stats.completedOrders / Math.max(stats.totalOrders, 1)) * 100} className="h-2 bg-green-100" />
              </div>
              <Link to="/admin/orders">
                <Button variant="outline" size="sm" className="w-full">
                  View Orders <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doctors Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-500" />
                Doctors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{stats.totalDoctors}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats.approvedDoctors}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingDoctors}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{stats.featuredDoctors}</p>
                  <p className="text-xs text-muted-foreground">Featured</p>
                </div>
              </div>
              <Link to="/admin/doctors">
                <Button variant="outline" size="sm" className="w-full">
                  Manage Doctors <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Users Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                User Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{stats.adminUsers}</p>
                  <p className="text-xs text-muted-foreground">Admins</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats.moderatorUsers}</p>
                  <p className="text-xs text-muted-foreground">Moderators</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats.patientUsers}</p>
                  <p className="text-xs text-muted-foreground">Patients</p>
                </div>
              </div>
              <Link to="/admin/users">
                <Button variant="outline" size="sm" className="w-full">
                  Manage Users <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Prescriptions Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-500" />
                Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{stats.totalPrescriptions}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingPrescriptions}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats.approvedPrescriptions}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{stats.rejectedPrescriptions}</p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
              <Link to="/admin/prescriptions">
                <Button variant="outline" size="sm" className="w-full">
                  Review Prescriptions <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Pharmacy Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-500" />
                Pharmacies Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{stats.totalPharmacies}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats.approvedPharmacies}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingPharmacies}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
              <Link to="/admin/medical-stores">
                <Button variant="outline" size="sm" className="w-full">
                  Manage Pharmacies <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-500" />
                Medicine Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{stats.totalMedicineOrders}</p>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingMedicineOrders}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
              <Link to="/admin/medical-stores">
                <Button variant="outline" size="sm" className="w-full">
                  View Orders <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Specializations</p>
                <p className="font-bold">{stats.activeSpecializations} / {stats.totalSpecializations}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Appointments</p>
                <p className="font-bold">{stats.totalAppointments}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Service Cards</p>
                <p className="font-bold">{stats.activeServiceCards} / {stats.totalServiceCards}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Availed Discounts</p>
                <p className="font-bold">{stats.availedOrders}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inquiry Trends Chart */}
        <InquiryTrendsChart />

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Recent Orders</CardTitle>
              <Link to="/admin/orders">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{order.unique_id}</p>
                        <p className="text-xs text-muted-foreground">{order.labs?.name || 'Unknown Lab'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">Rs. {Number(order.discounted_total).toLocaleString()}</p>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Prescriptions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Recent Prescriptions</CardTitle>
              <Link to="/admin/prescriptions">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentPrescriptions.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No prescriptions yet</p>
              ) : (
                <div className="space-y-3">
                  {recentPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{prescription.unique_id || prescription.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(prescription.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      {getStatusBadge(prescription.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Inquiries Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-500" />
                Doctor Appointments
              </CardTitle>
              <Link to="/admin/doctor-appointments">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentAppointments.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No appointments yet</p>
              ) : (
                <div className="space-y-3">
                  {recentAppointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{apt.doctors?.full_name || "Unknown Doctor"}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(apt.appointment_date), 'MMM d')} at {apt.appointment_time}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">Rs. {apt.fee}</p>
                        {getStatusBadge(apt.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nurse Bookings Quick View */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                Recent Nurse Bookings
              </CardTitle>
              <Link to="/admin/nurse-bookings">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentNurseBookings.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No bookings yet</p>
              ) : (
                <div className="space-y-3">
                  {recentNurseBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{booking.patient_name}</p>
                        <p className="text-xs text-muted-foreground">{booking.service_needed}</p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Surgery Inquiries */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Scissors className="w-4 h-4 text-purple-500" />
                Surgery Inquiries
              </CardTitle>
              <Link to="/admin/surgery-inquiries">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentSurgeryInquiries.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No inquiries yet</p>
              ) : (
                <div className="space-y-3">
                  {recentSurgeryInquiries.map((inquiry) => (
                    <div key={inquiry.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{inquiry.name}</p>
                        <p className="text-xs text-muted-foreground">{inquiry.surgery_name}</p>
                      </div>
                      {getStatusBadge(inquiry.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Emergency Requests
              </CardTitle>
              <Link to="/admin/emergency-requests">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentEmergencyRequests.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No emergencies yet</p>
              ) : (
                <div className="space-y-3">
                  {recentEmergencyRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{request.patient_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {request.city || "GPS Location"}
                        </p>
                      </div>
                      <Badge className={
                        request.status === "live" ? "bg-green-500" :
                        request.status === "accepted" ? "bg-blue-500" :
                        request.status === "completed" ? "bg-emerald-500" :
                        "bg-gray-500"
                      }>
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nurse Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                Nurse Bookings
              </CardTitle>
              <Link to="/admin/nurse-bookings">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentNurseBookings.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No bookings yet</p>
              ) : (
                <div className="space-y-3">
                  {recentNurseBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{booking.patient_name}</p>
                        <p className="text-xs text-muted-foreground">{booking.service_needed}</p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
