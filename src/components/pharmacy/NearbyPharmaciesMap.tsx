import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  Store, 
  Clock, 
  Truck,
  AlertCircle,
  RefreshCw,
  Phone
} from "lucide-react";

interface NearbyStore {
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
  location_lat: number;
  location_lng: number;
  google_maps_url: string | null;
  distance: number;
}

const NearbyPharmaciesMap = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [radius, setRadius] = useState(10); // Default 10km
  const [showMap, setShowMap] = useState(false);

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchNearbyStores = useCallback(async (lat: number, lng: number, searchRadius: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("medical_stores")
        .select("*")
        .eq("status", "approved")
        .eq("is_active", true)
        .not("location_lat", "is", null)
        .not("location_lng", "is", null);

      if (error) throw error;

      // Calculate distance for each store and filter by radius
      const storesWithDistance = (data || [])
        .map(store => ({
          ...store,
          distance: calculateDistance(lat, lng, store.location_lat, store.location_lng)
        }))
        .filter(store => store.distance <= searchRadius)
        .sort((a, b) => a.distance - b.distance);

      setNearbyStores(storesWithDistance);
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.error("Failed to fetch nearby pharmacies");
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserLocation = useCallback(() => {
    setLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        fetchNearbyStores(latitude, longitude, radius);
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Please allow location access to find nearby pharmacies");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out");
            break;
          default:
            setLocationError("An unknown error occurred");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [fetchNearbyStores, radius]);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyStores(userLocation.lat, userLocation.lng, radius);
    }
  }, [radius, userLocation, fetchNearbyStores]);

  const openDirections = (store: NearbyStore) => {
    if (store.google_maps_url) {
      window.open(store.google_maps_url, "_blank");
    } else if (store.location_lat && store.location_lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${store.location_lat},${store.location_lng}`, "_blank");
    }
  };

  const generateMapEmbedUrl = () => {
    if (!userLocation || nearbyStores.length === 0) return null;
    
    // Create a map centered on user location with markers for nearby stores
    const markers = nearbyStores
      .slice(0, 10)
      .map(store => `${store.location_lat},${store.location_lng}`)
      .join("|");
    
    return `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=pharmacy&center=${userLocation.lat},${userLocation.lng}&zoom=13`;
  };

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Find Nearby Pharmacies</h3>
              <p className="text-xs text-muted-foreground">Use GPS to find pharmacies near you</p>
            </div>
          </div>
          {userLocation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={getUserLocation}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>

        {!userLocation && !loading && !locationError && (
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={getUserLocation}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Enable Location
          </Button>
        )}

        {loading && !userLocation && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mr-2" />
            <span className="text-sm text-muted-foreground">Getting your location...</span>
          </div>
        )}

        {locationError && (
          <div className="flex flex-col items-center py-4 text-center">
            <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
            <p className="text-sm text-muted-foreground mb-3">{locationError}</p>
            <Button onClick={getUserLocation} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        )}

        {userLocation && (
          <>
            {/* Radius Slider */}
            <div className="mb-4 p-3 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Search Radius</span>
                <Badge variant="outline" className="text-xs">
                  {radius} km
                </Badge>
              </div>
              <Slider
                value={[radius]}
                onValueChange={(value) => setRadius(value[0])}
                min={5}
                max={20}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">5 km</span>
                <span className="text-[10px] text-muted-foreground">20 km</span>
              </div>
            </div>

            {/* Toggle Map View */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={!showMap ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setShowMap(false)}
              >
                List View
              </Button>
              <Button
                variant={showMap ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setShowMap(true)}
              >
                Map View
              </Button>
            </div>

            {/* Map View */}
            {showMap && (
              <div className="mb-4 rounded-lg overflow-hidden border">
                <iframe
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${userLocation.lat},${userLocation.lng}&z=14&output=embed`}
                />
              </div>
            )}

            {/* Results */}
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : nearbyStores.length === 0 ? (
              <div className="text-center py-6">
                <Store className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No pharmacies found within {radius} km
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try increasing the search radius
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                <p className="text-xs text-muted-foreground mb-2">
                  Found {nearbyStores.length} {nearbyStores.length === 1 ? "pharmacy" : "pharmacies"} within {radius} km
                </p>
                {nearbyStores.map((store) => (
                  <Card 
                    key={store.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow bg-white"
                    onClick={() => navigate(`/pharmacy/${store.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          {store.logo_url ? (
                            <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Store className="w-5 h-5 text-emerald-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-sm truncate">{store.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {store.area}, {store.city}
                              </p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px] ml-2">
                              {store.distance.toFixed(1)} km
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mt-2">
                            {store.delivery_available && (
                              <Badge variant="outline" className="text-[10px]">
                                <Truck className="w-2 h-2 mr-1" />
                                Delivery
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px]">
                              <Clock className="w-2 h-2 mr-1" />
                              {store.is_24_hours ? "24/7" : `${store.opening_time}`}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <a 
                              href={`tel:${store.phone}`}
                              className="text-xs text-primary flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="w-3 h-3" />
                              {store.phone}
                            </a>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-6 text-[10px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDirections(store);
                              }}
                            >
                              <Navigation className="w-3 h-3 mr-1" />
                              Directions
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NearbyPharmaciesMap;
