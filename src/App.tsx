import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import NotificationPermissionBanner from "@/components/NotificationPermissionBanner";
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
import HospitalDetail from "./pages/HospitalDetail";
import Surgeries from "./pages/Surgeries";
import SurgeryDetail from "./pages/SurgeryDetail";
import HealthHub from "./pages/HealthHub";
import HealthPostDetail from "./pages/HealthPostDetail";
import JoinAsDoctor from "./pages/JoinAsDoctor";
import JoinAsNurse from "./pages/JoinAsNurse";
import NurseRegister from "./pages/NurseRegister";
import FindNurses from "./pages/FindNurses";
import NurseDetail from "./pages/NurseDetail";
import NurseDashboard from "./pages/NurseDashboard";
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
import AdminQuickAccessServices from "./pages/admin/QuickAccessServices";
import AdminQuickAccessLayout from "./pages/admin/QuickAccessLayout";
import AdminFeaturedLabs from "./pages/admin/FeaturedLabs";
import AdminFeaturedDoctors from "./pages/admin/FeaturedDoctors";
import AdminSurgeries from "./pages/admin/Surgeries";
import AdminSurgeryInquiries from "./pages/admin/SurgeryInquiries";
import AdminHospitals from "./pages/admin/Hospitals";
import AdminLocations from "./pages/admin/Locations";
import AdminNurses from "./pages/admin/Nurses";
import AdminFeaturedNurses from "./pages/admin/FeaturedNurses";
import AdminEmergencyRequests from "./pages/admin/EmergencyRequests";
import AdminDoctorAppointments from "./pages/admin/DoctorAppointments";
import AdminNurseBookings from "./pages/admin/NurseBookings";
import AdminMedicalStores from "./pages/admin/MedicalStores";
import AdminMedicineOrders from "./pages/admin/MedicineOrders";
import AdminHeroSettings from "./pages/admin/HeroSettings";
import AdminHomepageLayout from "./pages/admin/HomepageLayout";
import AdminHomepageBuilder from "./pages/admin/HomepageBuilder";
import AdminPageLayouts from "./pages/admin/PageLayouts";
import AdminReviews from "./pages/admin/Reviews";
import AdminHealthPosts from "./pages/admin/HealthPosts";
import ModeratorPrescriptions from "./pages/moderator/Prescriptions";
import EmergencyNursingRequest from "./pages/EmergencyNursingRequest";
import EmergencyRequestStatus from "./pages/EmergencyRequestStatus";
import NurseEmergencyFeed from "./pages/NurseEmergencyFeed";
import JoinAsPharmacy from "./pages/JoinAsPharmacy";
import PharmacyRegister from "./pages/PharmacyRegister";
import FindPharmacies from "./pages/FindPharmacies";
import PharmacyDetail from "./pages/PharmacyDetail";
import PharmacyDashboard from "./pages/PharmacyDashboard";
import OrderMedicine from "./pages/OrderMedicine";
import NurseActiveJob from "./pages/NurseActiveJob";
import AITools from "./pages/AITools";
import Reviews from "./pages/Reviews";
import PartnerRegistration from "./pages/PartnerRegistration";
import AdminPartners from "./pages/admin/Partners";
import AdminWallets from "./pages/admin/Wallets";
import { HealthChatbot } from "./components/ai/HealthChatbot";
import NativeMobileWrapper from "./components/NativeMobileWrapper";

// SEO Pages
import DoctorsInCity from "./pages/seo/DoctorsInCity";
import LabsInCity from "./pages/seo/LabsInCity";
import HospitalsInCity from "./pages/seo/HospitalsInCity";
import HomeNursingInCity from "./pages/seo/HomeNursingInCity";
import PharmaciesInCity from "./pages/seo/PharmaciesInCity";
import MedicalTestsInCity from "./pages/seo/MedicalTestsInCity";
import SpecialistInCity from "./pages/seo/SpecialistInCity";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* NotificationProvider must be INSIDE BrowserRouter because EmergencyFlashNotification uses useNavigate */}
          <NotificationProvider>
            <ScrollToTop />
            <NotificationPermissionBanner />
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
              <Route path="/hospital/:slug" element={<HospitalDetail />} />
              <Route path="/surgeries" element={<Surgeries />} />
              <Route path="/surgery/:slug" element={<SurgeryDetail />} />
              <Route path="/health-hub" element={<HealthHub />} />
              <Route path="/health-hub/:postId" element={<HealthPostDetail />} />
              <Route path="/join-as-doctor" element={<JoinAsDoctor />} />
              <Route path="/join-as-nurse" element={<JoinAsNurse />} />
              <Route path="/nurse-register" element={<NurseRegister />} />
              <Route path="/find-nurses" element={<FindNurses />} />
              <Route path="/nurse/:id" element={<NurseDetail />} />
              <Route path="/nurse-dashboard" element={<NurseDashboard />} />
              <Route path="/emergency-nursing-request" element={<EmergencyNursingRequest />} />
              <Route path="/emergency-request/:id" element={<EmergencyRequestStatus />} />
              <Route path="/nurse-emergency-feed" element={<NurseEmergencyFeed />} />
              <Route path="/nurse-active-job/:id" element={<NurseActiveJob />} />
              <Route path="/doctor-register" element={<DoctorRegister />} />
              <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor/:id" element={<DoctorDetail />} />
              <Route path="/video-consultation" element={<VideoConsultation />} />
              <Route path="/in-clinic-visit" element={<InClinicVisit />} />
              <Route path="/instant-doctor" element={<InstantDoctor />} />
              <Route path="/join-as-pharmacy" element={<JoinAsPharmacy />} />
              <Route path="/pharmacy-register" element={<PharmacyRegister />} />
              <Route path="/pharmacies" element={<FindPharmacies />} />
              <Route path="/pharmacy/:id" element={<PharmacyDetail />} />
              <Route path="/pharmacy-dashboard" element={<PharmacyDashboard />} />
              <Route path="/order-medicine/:storeId" element={<OrderMedicine />} />
              <Route path="/ai-tools" element={<AITools />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/partner-registration" element={<PartnerRegistration />} />
              {/* SEO City Pages */}
              <Route path="/doctors-in-:city" element={<DoctorsInCity />} />
              <Route path="/labs-in-:city" element={<LabsInCity />} />
              <Route path="/hospitals-in-:city" element={<HospitalsInCity />} />
              <Route path="/home-nursing-:city" element={<HomeNursingInCity />} />
              <Route path="/pharmacies-in-:city" element={<PharmaciesInCity />} />
              <Route path="/medical-tests-in-:city" element={<MedicalTestsInCity />} />
              <Route path="/:city/:specialist" element={<SpecialistInCity />} />
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
              <Route path="/admin/quick-access-services" element={<ProtectedRoute requireAdmin><AdminQuickAccessServices /></ProtectedRoute>} />
              <Route path="/admin/quick-access-layout" element={<ProtectedRoute requireAdmin><AdminQuickAccessLayout /></ProtectedRoute>} />
              <Route path="/admin/featured-labs" element={<ProtectedRoute requireAdmin><AdminFeaturedLabs /></ProtectedRoute>} />
              <Route path="/admin/featured-doctors" element={<ProtectedRoute requireAdmin><AdminFeaturedDoctors /></ProtectedRoute>} />
              <Route path="/admin/surgeries" element={<ProtectedRoute requireAdmin><AdminSurgeries /></ProtectedRoute>} />
              <Route path="/admin/surgery-inquiries" element={<ProtectedRoute requireAdmin><AdminSurgeryInquiries /></ProtectedRoute>} />
              <Route path="/admin/hospitals" element={<ProtectedRoute requireAdmin><AdminHospitals /></ProtectedRoute>} />
              <Route path="/admin/locations" element={<ProtectedRoute requireAdmin><AdminLocations /></ProtectedRoute>} />
              <Route path="/admin/nurses" element={<ProtectedRoute requireAdmin><AdminNurses /></ProtectedRoute>} />
              <Route path="/admin/featured-nurses" element={<ProtectedRoute requireAdmin><AdminFeaturedNurses /></ProtectedRoute>} />
              <Route path="/admin/emergency-requests" element={<ProtectedRoute requireAdmin><AdminEmergencyRequests /></ProtectedRoute>} />
              <Route path="/admin/doctor-appointments" element={<ProtectedRoute requireAdmin><AdminDoctorAppointments /></ProtectedRoute>} />
              <Route path="/admin/nurse-bookings" element={<ProtectedRoute requireAdmin><AdminNurseBookings /></ProtectedRoute>} />
              <Route path="/admin/medical-stores" element={<ProtectedRoute requireAdmin><AdminMedicalStores /></ProtectedRoute>} />
              <Route path="/admin/medicine-orders" element={<ProtectedRoute requireAdmin><AdminMedicineOrders /></ProtectedRoute>} />
              <Route path="/admin/hero-settings" element={<ProtectedRoute requireAdmin><AdminHeroSettings /></ProtectedRoute>} />
              <Route path="/admin/homepage-layout" element={<ProtectedRoute requireAdmin><AdminHomepageLayout /></ProtectedRoute>} />
              <Route path="/admin/homepage-builder" element={<ProtectedRoute requireAdmin><AdminHomepageBuilder /></ProtectedRoute>} />
              <Route path="/admin/page-layouts" element={<ProtectedRoute requireAdmin><AdminPageLayouts /></ProtectedRoute>} />
              <Route path="/admin/reviews" element={<ProtectedRoute requireAdmin><AdminReviews /></ProtectedRoute>} />
              <Route path="/admin/health-posts" element={<ProtectedRoute requireAdmin><AdminHealthPosts /></ProtectedRoute>} />
              <Route path="/admin/partners" element={<ProtectedRoute requireAdmin><AdminPartners /></ProtectedRoute>} />
              <Route path="/admin/wallets" element={<ProtectedRoute requireAdmin><AdminWallets /></ProtectedRoute>} />
              
              {/* Moderator Routes */}
              <Route path="/moderator/prescriptions" element={<ProtectedRoute requireModerator><ModeratorPrescriptions /></ProtectedRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <HealthChatbot />
            <NativeMobileWrapper />
          </NotificationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
