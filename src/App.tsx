import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Labs from "./pages/Labs";
import LabDetail from "./pages/LabDetail";
import Compare from "./pages/Compare";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import MyPrescriptions from "./pages/MyPrescriptions";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";
import HelpCenter from "./pages/HelpCenter";
import PartnerTerms from "./pages/PartnerTerms";
import Privacy from "./pages/Privacy";
import FindDoctors from "./pages/FindDoctors";
import Hospitals from "./pages/Hospitals";
import Surgeries from "./pages/Surgeries";
import SurgeryDetail from "./pages/SurgeryDetail";
import HealthHub from "./pages/HealthHub";
import JoinAsDoctor from "./pages/JoinAsDoctor";
import DoctorRegister from "./pages/DoctorRegister";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorDetail from "./pages/DoctorDetail";
import VideoConsultation from "./pages/VideoConsultation";
import InClinicVisit from "./pages/InClinicVisit";
import InstantDoctor from "./pages/InstantDoctor";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLabs from "./pages/admin/Labs";
import AdminTests from "./pages/admin/Tests";
import AdminLabTests from "./pages/admin/LabTests";
import AdminOrders from "./pages/admin/Orders";
import AdminPrescriptions from "./pages/admin/Prescriptions";
import AdminUsers from "./pages/admin/Users";
import AdminSpecializations from "./pages/admin/Specializations";
import AdminDoctors from "./pages/admin/Doctors";
import AdminServiceCards from "./pages/admin/ServiceCards";
import AdminFeaturedLabs from "./pages/admin/FeaturedLabs";
import AdminSurgeries from "./pages/admin/Surgeries";
import ModeratorPrescriptions from "./pages/moderator/Prescriptions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/labs" element={<Labs />} />
            <Route path="/lab/:slug" element={<LabDetail />} />
            <Route path="/labs/:id" element={<LabDetail />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/my-prescriptions" element={<MyPrescriptions />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/partner-terms" element={<PartnerTerms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/find-doctors" element={<FindDoctors />} />
            <Route path="/hospitals" element={<Hospitals />} />
            <Route path="/surgeries" element={<Surgeries />} />
            <Route path="/surgery/:slug" element={<SurgeryDetail />} />
            <Route path="/health-hub" element={<HealthHub />} />
            <Route path="/join-as-doctor" element={<JoinAsDoctor />} />
            <Route path="/doctor-register" element={<DoctorRegister />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/:id" element={<DoctorDetail />} />
            <Route path="/video-consultation" element={<VideoConsultation />} />
            <Route path="/in-clinic-visit" element={<InClinicVisit />} />
            <Route path="/instant-doctor" element={<InstantDoctor />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/labs" element={<ProtectedRoute requireAdmin><AdminLabs /></ProtectedRoute>} />
            <Route path="/admin/tests" element={<ProtectedRoute requireAdmin><AdminTests /></ProtectedRoute>} />
            <Route path="/admin/lab-tests" element={<ProtectedRoute requireAdmin><AdminLabTests /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/prescriptions" element={<ProtectedRoute requireAdmin><AdminPrescriptions /></ProtectedRoute>} />
            <Route path="/admin/specializations" element={<ProtectedRoute requireAdmin><AdminSpecializations /></ProtectedRoute>} />
            <Route path="/admin/doctors" element={<ProtectedRoute requireAdmin><AdminDoctors /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/service-cards" element={<ProtectedRoute requireAdmin><AdminServiceCards /></ProtectedRoute>} />
            <Route path="/admin/featured-labs" element={<ProtectedRoute requireAdmin><AdminFeaturedLabs /></ProtectedRoute>} />
            <Route path="/admin/surgeries" element={<ProtectedRoute requireAdmin><AdminSurgeries /></ProtectedRoute>} />
            
            {/* Moderator Routes */}
            <Route path="/moderator/prescriptions" element={<ProtectedRoute requireModerator><ModeratorPrescriptions /></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
