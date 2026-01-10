import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Stethoscope, 
  Users, 
  Calendar, 
  TrendingUp, 
  Shield, 
  Video,
  CheckCircle
} from "lucide-react";

const JoinAsDoctor = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Users,
      title: "Reach More Patients",
      description: "Connect with thousands of patients looking for quality healthcare",
    },
    {
      icon: Calendar,
      title: "Easy Scheduling",
      description: "Manage your appointments and availability with our smart calendar",
    },
    {
      icon: Video,
      title: "Video Consultations",
      description: "Offer online consultations to patients across Pakistan",
    },
    {
      icon: TrendingUp,
      title: "Grow Your Practice",
      description: "Build your online presence and grow your patient base",
    },
    {
      icon: Shield,
      title: "Verified Profile",
      description: "PMC verified badge builds trust with patients",
    },
  ];

  const steps = [
    { num: 1, title: "Create Account", description: "Sign up with your email and create your account" },
    { num: 2, title: "Complete Profile", description: "Fill in your professional details and qualifications" },
    { num: 3, title: "Upload Documents", description: "Submit your PMC certificate and degree for verification" },
    { num: 4, title: "Get Verified", description: "Our team reviews and approves your profile within 24-48 hours" },
    { num: 5, title: "Start Practicing", description: "Accept appointments and grow your practice online" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-8">
        {/* Hero Section */}
        <div className="bg-primary text-primary-foreground py-10">
          <div className="container mx-auto px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold mb-3">
              Join MyPakLabs as a Doctor
            </h1>
            <p className="text-xs md:text-sm text-primary-foreground/80 max-w-md mx-auto mb-6">
              Connect with patients across Pakistan. Offer physical and online consultations, 
              manage appointments, and grow your practice.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-sm"
              onClick={() => navigate("/doctor-register")}
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
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-muted/30 py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-lg font-bold text-center mb-6">How It Works</h2>
            <div className="max-w-2xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.num} className="flex gap-4 mb-4 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {step.num}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-0.5 h-full bg-primary/20 mt-1" />
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
        </div>

        {/* Requirements */}
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-lg font-bold text-center mb-6">Requirements</h2>
          <Card className="max-w-md mx-auto">
            <CardContent className="p-4 space-y-2">
              {[
                "Valid PMC/PMDC registration",
                "Medical degree (MBBS or equivalent)",
                "At least 1 year of experience",
                "Valid CNIC for verification",
                "Professional profile photo",
              ].map((req, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs">{req}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-lg font-bold mb-2">Ready to Get Started?</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Join thousands of doctors already on our platform
          </p>
          <Button onClick={() => navigate("/doctor-register")}>
            Register as Doctor
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default JoinAsDoctor;
