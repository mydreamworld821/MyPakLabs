import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Store, 
  Truck, 
  Clock, 
  MapPin, 
  Shield, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Phone,
  Users
} from "lucide-react";

const JoinAsPharmacy = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleRegister = () => {
    if (!user) {
      navigate("/auth", { state: { from: "/pharmacy-register" } });
    } else {
      navigate("/pharmacy-register");
    }
  };

  const benefits = [
    {
      icon: Users,
      title: "Reach More Customers",
      description: "Get discovered by thousands of users searching for medicines in your area"
    },
    {
      icon: Phone,
      title: "Easy Order Management",
      description: "Receive orders directly on your phone with instant notifications"
    },
    {
      icon: Truck,
      title: "Delivery Support",
      description: "Offer home delivery and reach customers who can't visit your store"
    },
    {
      icon: TrendingUp,
      title: "Grow Your Business",
      description: "Increase sales with our platform's marketing and visibility features"
    },
    {
      icon: Shield,
      title: "Verified Platform",
      description: "Join a trusted healthcare platform with verified pharmacies only"
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "List your store as 24/7 and serve customers round the clock"
    }
  ];

  const steps = [
    {
      num: 1,
      title: "Register Your Store",
      description: "Fill in your store details, license information, and location"
    },
    {
      num: 2,
      title: "Get Verified",
      description: "Our team verifies your license and store details within 24-48 hours"
    },
    {
      num: 3,
      title: "Start Receiving Orders",
      description: "Once approved, your store appears on the map and you start getting orders"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6">
                <Store className="w-5 h-5" />
                <span className="text-sm font-medium">Join as Medical Store Partner</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Grow Your Pharmacy Business with MyPakLabs
              </h1>
              <p className="text-lg text-emerald-100 mb-8">
                Register your medical store and reach thousands of customers across Pakistan. 
                Receive medicine orders online and deliver to customers' doorsteps.
              </p>
              <Button 
                size="lg" 
                className="bg-white text-emerald-700 hover:bg-emerald-50"
                onClick={handleRegister}
              >
                Register Your Store
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-3">Why Partner With Us?</h2>
              <p className="text-muted-foreground">
                Join the growing network of pharmacies serving customers across Pakistan
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <Card key={index} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <benefit.icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-3">How It Works</h2>
              <p className="text-muted-foreground">
                Get started in 3 simple steps
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                {steps.map((step) => (
                  <div key={step.num} className="text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                      {step.num}
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Requirements Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">Requirements to Join</h2>
              <Card>
                <CardContent className="p-6">
                  <ul className="space-y-4">
                    {[
                      "Valid Drug License from Provincial Health Department",
                      "Registered medical store with physical address",
                      "Active phone number for order notifications",
                      "Owner's CNIC (optional but recommended)",
                      "Store images/logo (optional but recommended)"
                    ].map((req, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-emerald-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of pharmacies already partnered with MyPakLabs and start growing your business today.
            </p>
            <Button 
              size="lg" 
              className="bg-white text-emerald-700 hover:bg-emerald-50"
              onClick={handleRegister}
            >
              Register Your Store Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default JoinAsPharmacy;