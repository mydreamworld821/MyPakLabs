import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Labs from "./pages/Labs";
import LabDetail from "./pages/LabDetail";
import Compare from "./pages/Compare";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import MyPrescriptions from "./pages/MyPrescriptions";
import Terms from "./pages/Terms";
import HelpCenter from "./pages/HelpCenter";
import PartnerTerms from "./pages/PartnerTerms";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLabs from "./pages/admin/Labs";
import AdminTests from "./pages/admin/Tests";
import AdminLabTests from "./pages/admin/LabTests";
import AdminOrders from "./pages/admin/Orders";
import AdminPrescriptions from "./pages/admin/Prescriptions";
import AdminUsers from "./pages/admin/Users";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/labs" element={<Labs />} />
            <Route path="/labs/:id" element={<LabDetail />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/my-prescriptions" element={<MyPrescriptions />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/partner-terms" element={<PartnerTerms />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/labs" element={<ProtectedRoute requireAdmin><AdminLabs /></ProtectedRoute>} />
            <Route path="/admin/tests" element={<ProtectedRoute requireAdmin><AdminTests /></ProtectedRoute>} />
            <Route path="/admin/lab-tests" element={<ProtectedRoute requireAdmin><AdminLabTests /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/prescriptions" element={<ProtectedRoute requireAdmin><AdminPrescriptions /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
