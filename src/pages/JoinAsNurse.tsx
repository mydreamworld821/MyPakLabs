import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  Users, 
  Calendar, 
  TrendingUp, 
  Shield, 
  Home,
  CheckCircle,
  Clock,
  MapPin
} from "lucide-react";

const JoinAsNurse = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Users,
      title: "Reach More Patients",
      description: "Connect with patients needing home nursing care across your city",
    },
    {
      icon: Calendar,
      title: "Flexible Schedule",
      description: "Set your own availability and work hours that suit you",
    },
    {
      icon: Home,
      title: "Home Visit Services",
      description: "Offer home nursing care to patients who need it most",
    },
    {
      icon: TrendingUp,
      title: "Grow Your Income",
      description: "Set competitive rates and build a loyal patient base",
    },
    {
      icon: Shield,
      title: "PNC Verified",
      description: "Get verified badge to build trust with patients",
    },
  ];

  const services = [
    "Injection (IM / IV)",
    "IV Cannula Insertion",
    "Wound Dressing",
    "Catheterization",
    "Oxygen Therapy",
    "Blood Pressure Monitoring",
    "Post-operative Care",
    "Elderly Care",
    "Bedridden Patient Care",
    "Medication Administration",
  ];

  const steps = [
    { num: 1, title: "Create Account", description: "Sign up with your email and create your account" },
    { num: 2, title: "Complete Profile", description: "Fill in your professional details and qualifications" },
    { num: 3, title: "Upload Documents", description: "Submit your PNC certificate and nursing degree for verification" },
    { num: 4, title: "Set Services & Rates", description: "Select services you offer and set your visit charges" },
    { num: 5, title: "Get Verified", description: "Our team reviews and approves your profile within 24-48 hours" },
    { num: 6, title: "Start Serving", description: "Accept bookings and provide home nursing care" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-8">
        {/* Hero Section */}
        <div className="bg-rose-600 text-white py-10">
          <div className="container mx-auto px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold mb-3">
              Join MyPakLabs as a Nurse
            </h1>
            <p className="text-xs md:text-sm text-white/80 max-w-md mx-auto mb-6">
              Provide home nursing services to patients across Pakistan. Set your own schedule, 
              offer quality care, and grow your nursing practice.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-sm"
              onClick={() => navigate("/nurse-register")}
            >
              Register Now
            </Button>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-lg font-bold text-center mb-6">Why Join Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-4">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3">
                    <benefit.icon className="w-5 h-5 text-rose-600" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Services You Can Offer */}
        <div className="bg-muted/30 py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-lg font-bold text-center mb-6">Services You Can Offer</h2>
            <div className="max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-3">
              {services.map((service, index) => (
                <div key={index} className="flex items-center gap-2 bg-background rounded-lg p-3 shadow-sm">
                  <CheckCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span className="text-xs">{service}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-lg font-bold text-center mb-6">How It Works</h2>
          <div className="max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.num} className="flex gap-4 mb-4 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-sm font-bold">
                    {step.num}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-full bg-rose-200 mt-1" />
                  )}
                </div>
                <div className="pb-4">
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-muted/30 py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-lg font-bold text-center mb-6">Requirements</h2>
            <Card className="max-w-md mx-auto">
              <CardContent className="p-4 space-y-2">
                {[
                  "Valid PNC (Pakistan Nursing Council) registration",
                  "Nursing qualification (LPN, RN, BSc Nursing, etc.)",
                  "At least 1 year of experience",
                  "Valid CNIC for verification",
                  "Professional profile photo",
                  "Home visit availability",
                ].map((req, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs">{req}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Earning Potential */}
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-lg font-bold text-center mb-6">Earning Potential</h2>
          <div className="max-w-lg mx-auto grid grid-cols-3 gap-4">
            <Card className="text-center">
              <CardContent className="p-4">
                <Clock className="w-6 h-6 text-rose-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Per Visit</p>
                <p className="text-sm font-bold">PKR 500-2000</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <Calendar className="w-6 h-6 text-rose-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Per Hour</p>
                <p className="text-sm font-bold">PKR 300-800</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <MapPin className="w-6 h-6 text-rose-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Monthly</p>
                <p className="text-sm font-bold">PKR 30K-80K</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-lg font-bold mb-2">Ready to Get Started?</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Join our growing network of professional nurses
          </p>
          <Button 
            className="bg-rose-600 hover:bg-rose-700"
            onClick={() => navigate("/nurse-register")}
          >
            Register as Nurse
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default JoinAsNurse;
