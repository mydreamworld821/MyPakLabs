import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CitySelect } from "@/components/ui/city-select";
import NearbyPharmaciesMap from "@/components/pharmacy/NearbyPharmaciesMap";
import { usePageLayoutSettings } from "@/hooks/usePageLayoutSettings";
import PharmacyListCard from "@/components/directory/PharmacyListCard";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Store, 
  Search, 
  MapPin, 
  Clock, 
  Truck, 
  Star,
  Phone,
  Loader2,
  Pill,
  X,
  Navigation
} from "lucide-react";

interface MedicalStore {
  id: string;
  name: string;
  logo_url: string | null;
  city: string;
  area: string;
  full_address: string;
  phone: string;
  delivery_available: boolean;
  is_24_hours: boolean;
  opening_time: string;
  closing_time: string;
  rating: number;
  review_count: number;
  is_featured: boolean;
}

const FindPharmacies = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<MedicalStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [medicineSearch, setMedicineSearch] = useState("");
  const [showMedicineSearch, setShowMedicineSearch] = useState(false);

  // Get admin-managed layout settings
  const { settings: layoutSettings, getGridClasses } = usePageLayoutSettings("pharmacies_listing");

  useEffect(() => {
    fetchStores();
  }, [selectedCity]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("medical_stores")
        .select("*")
        .eq("status", "approved")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false });

      if (selectedCity && selectedCity !== "all") {
        query = query.eq("city", selectedCity);
      }

      const { data, error } = await query;
      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter(store =>
    store.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.area?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredStores = filteredStores.filter(s => s.is_featured);
  const regularStores = filteredStores.filter(s => !s.is_featured);

  const handleOrderWithMedicine = (storeId: string) => {
    // Navigate to order page with medicine name pre-filled
    navigate(`/order-medicine/${storeId}?medicine=${encodeURIComponent(medicineSearch)}`);
    setShowMedicineSearch(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-8">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Find Pharmacies</h1>
            <p className="text-muted-foreground text-sm">
              Order medicines from verified pharmacies near you
            </p>
          </div>

          {/* Nearby Pharmacies Map */}
          <div className="max-w-2xl mx-auto mb-6">
            <NearbyPharmaciesMap />
          </div>

          {/* Medicine Search Card */}
          <Card className="max-w-2xl mx-auto mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Search for Medicine</h3>
                  <p className="text-xs text-muted-foreground">Find which pharmacies have your medicine</p>
                </div>
              </div>
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowMedicineSearch(true)}
              >
                <Search className="w-4 h-4 mr-2" />
                Search Medicine
              </Button>
            </CardContent>
          </Card>

          {/* Store Search & Filter */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search pharmacies or areas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <CitySelect
                value={selectedCity}
                onValueChange={setSelectedCity}
                showAllOption
                allOptionLabel="All Cities"
                className="w-40"
              />
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No Pharmacies Found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or selecting a different city
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Featured Stores */}
              {featuredStores.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    Featured Pharmacies
                  </h2>
                  <div 
                    className={getGridClasses()}
                    style={{ gap: `${layoutSettings.items_gap}px` }}
                  >
                    {featuredStores.map((store) => (
                      <PharmacyListCard key={store.id} store={store} settings={layoutSettings} />
                    ))}
                  </div>
                </div>
              )}

              {/* All Stores */}
              <div>
                {featuredStores.length > 0 && (
                  <h2 className="text-lg font-semibold mb-4">All Pharmacies</h2>
                )}
                <div 
                  className={getGridClasses()}
                  style={{ gap: `${layoutSettings.items_gap}px` }}
                >
                  {regularStores.map((store) => (
                    <PharmacyListCard key={store.id} store={store} settings={layoutSettings} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Medicine Search Dialog */}
      <Dialog open={showMedicineSearch} onOpenChange={setShowMedicineSearch}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-600" />
              Search Medicine
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter medicine name (e.g., Panadol, Augmentin)..."
                value={medicineSearch}
                onChange={(e) => setMedicineSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
              {medicineSearch && (
                <button
                  onClick={() => setMedicineSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {medicineSearch.length >= 2 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Select a pharmacy to order <span className="font-medium text-foreground">"{medicineSearch}"</span>
                </p>
                
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {stores.length === 0 ? (
                    <p className="text-center py-4 text-sm text-muted-foreground">
                      No pharmacies available. Please try again later.
                    </p>
                  ) : (
                    stores.slice(0, 10).map((store) => (
                      <Card 
                        key={store.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleOrderWithMedicine(store.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              {store.logo_url ? (
                                <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <Store className="w-5 h-5 text-emerald-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{store.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {store.area}, {store.city}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {store.delivery_available && (
                                <Badge variant="outline" className="text-[10px] bg-blue-50">
                                  <Truck className="w-3 h-3 mr-1" />
                                  Delivery
                                </Badge>
                              )}
                              <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
                                Order Here
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {medicineSearch.length < 2 && (
              <div className="text-center py-6">
                <Pill className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Type at least 2 characters to search for a medicine
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FindPharmacies;