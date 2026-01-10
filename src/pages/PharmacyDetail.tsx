import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Store, 
  MapPin, 
  Clock, 
  Truck, 
  Star,
  Phone,
  Mail,
  Loader2,
  ArrowLeft,
  ShoppingCart,
  Navigation
} from "lucide-react";

interface MedicalStore {
  id: string;
  name: string;
  logo_url: string | null;
  cover_image_url: string | null;
  city: string;
  area: string;
  full_address: string;
  phone: string;
  email: string | null;
  delivery_available: boolean;
  is_24_hours: boolean;
  opening_time: string;
  closing_time: string;
  rating: number;
  review_count: number;
  location_lat: number | null;
  location_lng: number | null;
}

const PharmacyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<MedicalStore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchStore();
  }, [id]);

  const fetchStore = async () => {
    try {
      const { data, error } = await supabase
        .from("medical_stores")
        .select("*")
        .eq("id", id)
        .eq("status", "approved")
        .eq("is_active", true)
        .single();

      if (error) throw error;
      setStore(data);
    } catch (error) {
      console.error("Error fetching store:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderMedicine = () => {
    navigate(`/order-medicine/${id}`);
  };

  const openGoogleMaps = () => {
    if (store?.location_lat && store?.location_lng) {
      window.open(`https://www.google.com/maps?q=${store.location_lat},${store.location_lng}`, "_blank");
    } else {
      window.open(`https://www.google.com/maps/search/${encodeURIComponent(store?.full_address || "")}`, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-12 text-center">
            <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Pharmacy Not Found</h1>
            <p className="text-muted-foreground mb-4">The pharmacy you're looking for doesn't exist or is unavailable.</p>
            <Button onClick={() => navigate("/pharmacies")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pharmacies
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-8">
        {/* Header/Cover */}
        <div className="relative h-48 bg-gradient-to-r from-emerald-600 to-emerald-800">
          {store.cover_image_url && (
            <img 
              src={store.cover_image_url} 
              alt={store.name} 
              className="w-full h-full object-cover absolute inset-0 opacity-30"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          <div className="container mx-auto px-4 h-full relative">
            <Button 
              variant="ghost" 
              className="absolute top-4 left-4 text-white hover:bg-white/20"
              onClick={() => navigate("/pharmacies")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4">
          {/* Store Info Card */}
          <Card className="-mt-16 relative z-10 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-24 h-24 rounded-xl bg-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0 -mt-12 md:-mt-16 border-4 border-background">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-10 h-10 text-emerald-600" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h1 className="text-xl font-bold mb-1">{store.name}</h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="w-4 h-4" />
                    {store.area}, {store.city}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {store.delivery_available && (
                      <Badge className="bg-blue-100 text-blue-700">
                        <Truck className="w-3 h-3 mr-1" />
                        Home Delivery
                      </Badge>
                    )}
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {store.is_24_hours ? "Open 24/7" : `${store.opening_time} - ${store.closing_time}`}
                    </Badge>
                    {store.rating > 0 && (
                      <Badge variant="outline">
                        <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
                        {store.rating.toFixed(1)} ({store.review_count} reviews)
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={handleOrderMedicine} className="bg-emerald-600 hover:bg-emerald-700">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Order Medicine
                  </Button>
                  <Button variant="outline" onClick={openGoogleMaps}>
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a 
                  href={`tel:${store.phone}`} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{store.phone}</p>
                  </div>
                </a>
                
                {store.email && (
                  <a 
                    href={`mailto:${store.email}`} 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{store.email}</p>
                    </div>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Store Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">{store.full_address}</p>
                    <p className="text-sm text-muted-foreground mt-1">{store.city}</p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-sm mt-2"
                      onClick={openGoogleMaps}
                    >
                      View on Google Maps
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PharmacyDetail;