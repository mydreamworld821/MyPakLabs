import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { CitySelect } from "@/components/ui/city-select";
import { usePageLayoutSettings } from "@/hooks/usePageLayoutSettings";
import { useGeolocation } from "@/hooks/useGeolocation";
import PharmacyListCard from "@/components/directory/PharmacyListCard";
import { toast } from "sonner";
import { 
  Store, 
  Search, 
  MapPin, 
  Loader2,
  Star,
  Navigation,
  RefreshCw,
  AlertCircle,
  LocateFixed,
  List,
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
  location_lat?: number | null;
  location_lng?: number | null;
  google_maps_url?: string | null;
}

interface NearbyStore extends MedicalStore {
  distance: number;
  hasCoordinates: boolean;
}

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const FindPharmacies = () => {
  const navigate = useNavigate();
  const { getCurrentPosition } = useGeolocation();
  const [stores, setStores] = useState<MedicalStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");

  // GPS / Nearby state
  const [activeTab, setActiveTab] = useState<"all" | "nearby">("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [radius, setRadius] = useState(10);

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

  // Compute nearby stores when location or radius changes
  const computeNearby = useCallback((allStores: MedicalStore[], lat: number, lng: number, r: number) => {
    const result: NearbyStore[] = allStores
      .filter(s => s.location_lat && s.location_lng)
      .map(s => ({
        ...s,
        distance: calculateDistance(lat, lng, s.location_lat!, s.location_lng!),
        hasCoordinates: true,
      }))
      .filter(s => s.distance <= r)
      .sort((a, b) => a.distance - b.distance);
    setNearbyStores(result);
  }, []);

  useEffect(() => {
    if (userLocation && stores.length > 0) {
      computeNearby(stores, userLocation.lat, userLocation.lng, radius);
    }
  }, [userLocation, stores, radius, computeNearby]);

  const enableLocation = async () => {
    setGpsLoading(true);
    setLocationError(null);
    const position = await getCurrentPosition();
    if (position) {
      setUserLocation({ lat: position.latitude, lng: position.longitude });
      setActiveTab("nearby");
      toast.success("Location found! Showing nearby pharmacies.");
    } else {
      setLocationError("Could not get your location. Please allow location access.");
    }
    setGpsLoading(false);
  };

  const filteredStores = stores.filter(store =>
    store.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.area?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNearby = nearbyStores.filter(store =>
    store.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.area?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredStores = filteredStores.filter(s => s.is_featured);
  const regularStores = filteredStores.filter(s => !s.is_featured);

  const displayStores = activeTab === "nearby" ? filteredNearby : filteredStores;

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

          {/* Tabs: Nearby / All */}
          <div className="max-w-2xl mx-auto mb-5">
            <div className="flex rounded-lg border border-border bg-muted/30 p-1 gap-1">
              <Button
                variant={activeTab === "nearby" ? "default" : "ghost"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => {
                  if (!userLocation && !gpsLoading) {
                    enableLocation();
                  } else {
                    setActiveTab("nearby");
                  }
                }}
                disabled={gpsLoading}
              >
                {gpsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LocateFixed className="w-4 h-4" />
                )}
                Nearby
              </Button>
              <Button
                variant={activeTab === "all" ? "default" : "ghost"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setActiveTab("all")}
              >
                <List className="w-4 h-4" />
                All Pharmacies
              </Button>
            </div>
          </div>

          {/* Nearby Controls */}
          {activeTab === "nearby" && userLocation && (
            <div className="max-w-2xl mx-auto mb-5">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">GPS Active</span>
                      <Badge variant="outline" className="text-xs">
                        {radius} km radius
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={enableLocation}
                      disabled={gpsLoading}
                      className="h-8 w-8 p-0"
                    >
                      <RefreshCw className={`w-4 h-4 ${gpsLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                  <Slider
                    value={[radius]}
                    onValueChange={(v) => setRadius(v[0])}
                    min={3}
                    max={25}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">3 km</span>
                    <span className="text-[10px] text-muted-foreground">25 km</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Location Error */}
          {activeTab === "nearby" && locationError && (
            <div className="max-w-2xl mx-auto mb-5">
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                  <p className="text-sm text-muted-foreground">{locationError}</p>
                  <Button onClick={enableLocation} variant="outline" size="sm">
                    <Navigation className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search & Filter (show city filter only for "All" tab) */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={activeTab === "nearby" ? "Search nearby pharmacies..." : "Search pharmacies or areas..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              {activeTab === "all" && (
                <CitySelect
                  value={selectedCity}
                  onValueChange={setSelectedCity}
                  showAllOption
                  allOptionLabel="All Cities"
                  className="w-40"
                />
              )}
            </div>
          </div>

          {/* Results */}
          {(loading || (activeTab === "nearby" && gpsLoading)) ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : activeTab === "nearby" && !userLocation ? (
            // Waiting for GPS — prompt is already shown above via enableLocation
            <div className="text-center py-12">
              <LocateFixed className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Enable Location</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Allow location access to find pharmacies near you
              </p>
              <Button onClick={enableLocation} disabled={gpsLoading}>
                <Navigation className="w-4 h-4 mr-2" />
                Enable GPS
              </Button>
            </div>
          ) : displayStores.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No Pharmacies Found</h3>
              <p className="text-sm text-muted-foreground">
                {activeTab === "nearby"
                  ? `No pharmacies found within ${radius} km. Try increasing the radius.`
                  : "Try adjusting your search or selecting a different city"}
              </p>
            </div>
          ) : activeTab === "nearby" ? (
            /* Nearby results with distance badges */
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found {filteredNearby.length} {filteredNearby.length === 1 ? "pharmacy" : "pharmacies"} within {radius} km
              </p>
              <div
                className={getGridClasses()}
                style={{ gap: `${layoutSettings.items_gap}px` }}
              >
                {filteredNearby.map((store) => (
                  <div key={store.id} className="relative">
                    <Badge className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground text-[10px]">
                      {store.distance.toFixed(1)} km
                    </Badge>
                    <PharmacyListCard store={store} settings={layoutSettings} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* All pharmacies */
            <div className="space-y-8">
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
    </div>
  );
};

export default FindPharmacies;
