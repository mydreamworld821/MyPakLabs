import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  MapPin,
  Video,
  Calendar,
  Zap,
  Dumbbell,
  FlaskConical,
  Pill,
  Heart,
  Building2,
  Stethoscope,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Profile {
  full_name: string | null;
}

const Index = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, [user]);

  // Cities list - can be fetched from database later
  const cities = [
    "Karachi",
    "Lahore", 
    "Islamabad",
    "Rawalpindi",
    "Faisalabad",
    "Multan",
    "Peshawar",
    "Quetta",
  ];

  // Main service cards
  const mainServices = [
    {
      id: "video-consultation",
      title: "Video Consultation",
      subtitle: "PMC Verified Doctors",
      icon: Video,
      bgColor: "bg-sky-50",
      iconColor: "text-primary",
      link: "/video-consultation",
      featured: false,
    },
    {
      id: "in-clinic",
      title: "In-clinic Visit",
      subtitle: "Book Appointment",
      icon: Calendar,
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      link: "/in-clinic-visit",
      featured: false,
    },
    {
      id: "instant-doctor",
      title: "INSTANT DOCTOR+",
      subtitle: "Get Instant Relief in a Click",
      icon: Zap,
      bgColor: "bg-sky-50",
      iconColor: "text-yellow-500",
      link: "/instant-doctor",
      featured: true,
    },
    {
      id: "weight-loss",
      title: "Weight Loss Clinic",
      subtitle: "Healthy Lifestyle",
      icon: Dumbbell,
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      link: "/weight-loss-clinic",
      featured: false,
    },
  ];

  // Quick access services (bottom icons)
  const quickServices = [
    {
      id: "labs",
      title: "Labs",
      icon: FlaskConical,
      link: "/labs",
      bgColor: "bg-sky-100",
      iconColor: "text-primary",
    },
    {
      id: "medicines",
      title: "Medicines",
      icon: Pill,
      link: "/medicines",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      id: "health-hub",
      title: "Health Hub",
      icon: Heart,
      link: "/health-hub",
      bgColor: "bg-red-100",
      iconColor: "text-red-500",
    },
    {
      id: "hospitals",
      title: "Hospitals",
      icon: Building2,
      link: "/hospitals",
      bgColor: "bg-teal-100",
      iconColor: "text-teal-600",
    },
    {
      id: "surgeries",
      title: "Surgeries",
      icon: Stethoscope,
      link: "/surgeries",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  const handleSearch = () => {
    // Search functionality - will be implemented later
    console.log("Search:", searchQuery, "City:", selectedCity);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4">
          {/* Greeting Section */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-lg">
                {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "G"}
              </div>
              <span className="text-foreground">
                Hello, {profile?.full_name || (user ? "User" : "Guest")}!
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Find the Best Doctor Near You
            </h1>
          </div>

          {/* Search Section */}
          <div className="flex flex-col sm:flex-row gap-2 mb-8 bg-card rounded-xl p-2 shadow-card border border-border">
            <div className="flex items-center gap-2 px-3 py-2 sm:border-r border-border">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="border-0 shadow-none bg-transparent min-w-[140px] focus:ring-0">
                  <SelectValue placeholder="Enter City" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <Input
                type="text"
                placeholder="Search by Doctors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 shadow-none bg-transparent focus-visible:ring-0"
              />
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleSearch}
                className="shrink-0"
              >
                <Search className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* How can we help section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              How can we help you today?
            </h2>

            {/* Main Service Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Video Consultation - Left column */}
              <Link 
                to={mainServices[0].link}
                className="block"
              >
                <Card className={`h-full ${mainServices[0].bgColor} border-0 hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden`}>
                  <CardContent className="p-5 h-full flex flex-col justify-between min-h-[200px]">
                    <div>
                      <h3 className="font-semibold text-primary text-lg mb-1">
                        {mainServices[0].title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {mainServices[0].subtitle}
                      </p>
                    </div>
                    <div className="flex justify-center mt-4">
                      <div className="w-24 h-24 rounded-full bg-white/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Video className="w-12 h-12 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Middle column - In-clinic + Weight Loss stacked */}
              <div className="flex flex-col gap-4">
                <Link to={mainServices[1].link} className="block flex-1">
                  <Card className={`h-full ${mainServices[1].bgColor} border-0 hover:shadow-lg transition-all duration-300 cursor-pointer group`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-amber-700 text-base mb-0.5">
                          {mainServices[1].title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {mainServices[1].subtitle}
                        </p>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-white/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Calendar className="w-7 h-7 text-amber-600" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to={mainServices[3].link} className="block flex-1">
                  <Card className={`h-full ${mainServices[3].bgColor} border-0 hover:shadow-lg transition-all duration-300 cursor-pointer group`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-emerald-700 text-base mb-0.5">
                          {mainServices[3].title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {mainServices[3].subtitle}
                        </p>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-white/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Dumbbell className="w-7 h-7 text-emerald-600" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Instant Doctor - Right column (featured) */}
              <Link 
                to={mainServices[2].link}
                className="block"
              >
                <Card className={`h-full ${mainServices[2].bgColor} border-0 hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden`}>
                  <CardContent className="p-5 h-full flex flex-col justify-between min-h-[200px]">
                    <div className="flex items-start gap-2">
                      <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      <div>
                        <h3 className="font-bold text-primary text-lg tracking-tight">
                          INSTANT
                        </h3>
                        <h3 className="font-bold text-primary text-lg -mt-1">
                          DOCTOR<span className="text-red-500">+</span>
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {mainServices[2].subtitle}
                    </p>
                    <div className="flex justify-end mt-4">
                      <div className="w-20 h-20 rounded-full bg-white/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Stethoscope className="w-10 h-10 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Quick Access Services */}
            <div className="grid grid-cols-5 gap-2 md:gap-4">
              {quickServices.map((service) => (
                <Link
                  key={service.id}
                  to={service.link}
                  className="block group"
                >
                  <div className="flex flex-col items-center gap-2 p-2 md:p-4 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl ${service.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                      <service.icon className={`w-7 h-7 md:w-8 md:h-8 ${service.iconColor}`} />
                    </div>
                    <span className="text-xs md:text-sm font-medium text-foreground text-center">
                      {service.title}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Underline indicator for Labs */}
            <div className="flex justify-center mt-2">
              <div className="w-16 h-1 bg-primary rounded-full" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
