import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { toast } from "sonner";
import {
  MapPin,
  Navigation,
  Loader2,
  Phone,
  Clock,
  Save,
  LocateFixed,
  Store,
  Truck,
} from "lucide-react";

interface PharmacySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  onSaved: () => void;
}

interface StoreSettings {
  name: string;
  phone: string;
  email: string;
  city: string;
  area: string;
  full_address: string;
  opening_time: string;
  closing_time: string;
  is_24_hours: boolean;
  delivery_available: boolean;
  location_lat: number | null;
  location_lng: number | null;
  google_maps_url: string;
}

const PharmacySettingsDialog = ({
  open,
  onOpenChange,
  storeId,
  onSaved,
}: PharmacySettingsDialogProps) => {
  const { getCurrentPosition } = useGeolocation();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingGps, setFetchingGps] = useState(false);

  useEffect(() => {
    if (open && storeId) {
      fetchSettings();
    }
  }, [open, storeId]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("medical_stores")
        .select(
          "name, phone, email, city, area, full_address, opening_time, closing_time, is_24_hours, delivery_available, location_lat, location_lng, google_maps_url"
        )
        .eq("id", storeId)
        .single();

      if (error) throw error;
      setSettings({
        name: data.name || "",
        phone: data.phone || "",
        email: data.email || "",
        city: data.city || "",
        area: data.area || "",
        full_address: data.full_address || "",
        opening_time: data.opening_time || "9:00 AM",
        closing_time: data.closing_time || "10:00 PM",
        is_24_hours: data.is_24_hours || false,
        delivery_available: data.delivery_available ?? true,
        location_lat: data.location_lat ? Number(data.location_lat) : null,
        location_lng: data.location_lng ? Number(data.location_lng) : null,
        google_maps_url: data.google_maps_url || "",
      });
    } catch (error) {
      console.error("Error fetching store settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchGps = async () => {
    setFetchingGps(true);
    const position = await getCurrentPosition();
    if (position && settings) {
      setSettings({
        ...settings,
        location_lat: position.latitude,
        location_lng: position.longitude,
      });
      toast.success("GPS location captured!");
    }
    setFetchingGps(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("medical_stores")
        .update({
          name: settings.name.trim(),
          phone: settings.phone.trim(),
          email: settings.email.trim() || null,
          city: settings.city.trim(),
          area: settings.area.trim(),
          full_address: settings.full_address.trim(),
          opening_time: settings.opening_time,
          closing_time: settings.closing_time,
          is_24_hours: settings.is_24_hours,
          delivery_available: settings.delivery_available,
          location_lat: settings.location_lat,
          location_lng: settings.location_lng,
          google_maps_url: settings.google_maps_url.trim() || null,
        })
        .eq("id", storeId);

      if (error) throw error;

      toast.success("Settings saved successfully!");
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof StoreSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Store Settings
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : settings ? (
          <div className="space-y-5">
            {/* Store Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Store Name</Label>
              <Input
                value={settings.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Pharmacy name"
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone
                </Label>
                <Input
                  value={settings.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="03XX-XXXXXXX"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email</Label>
                <Input
                  value={settings.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="store@email.com"
                  type="email"
                />
              </div>
            </div>

            {/* City & Area */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">City</Label>
                <Input
                  value={settings.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Area</Label>
                <Input
                  value={settings.area}
                  onChange={(e) => updateField("area", e.target.value)}
                  placeholder="Area / Sector"
                />
              </div>
            </div>

            {/* Full Address */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Full Address
              </Label>
              <Input
                value={settings.full_address}
                onChange={(e) => updateField("full_address", e.target.value)}
                placeholder="Complete store address"
              />
            </div>

            {/* GPS Location */}
            <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <LocateFixed className="w-3 h-3" /> GPS Location
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handleFetchGps}
                  disabled={fetchingGps}
                >
                  {fetchingGps ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Navigation className="w-3 h-3" />
                  )}
                  {fetchingGps ? "Fetching..." : "Fetch GPS"}
                </Button>
              </div>
              {settings.location_lat && settings.location_lng ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-primary/5">
                    {settings.location_lat.toFixed(6)}, {settings.location_lng.toFixed(6)}
                  </Badge>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No GPS coordinates set. Click "Fetch GPS" to capture your current location.
                </p>
              )}

              {/* Manual Lat/Lng */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={settings.location_lat ?? ""}
                    onChange={(e) =>
                      updateField("location_lat", e.target.value ? parseFloat(e.target.value) : null)
                    }
                    placeholder="e.g. 33.6844"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={settings.location_lng ?? ""}
                    onChange={(e) =>
                      updateField("location_lng", e.target.value ? parseFloat(e.target.value) : null)
                    }
                    placeholder="e.g. 73.0479"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Google Maps URL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Google Maps URL (optional)</Label>
              <Input
                value={settings.google_maps_url}
                onChange={(e) => updateField("google_maps_url", e.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </div>

            {/* Timings */}
            <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Store Timings
                </Label>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">24/7</Label>
                  <Switch
                    checked={settings.is_24_hours}
                    onCheckedChange={(val) => updateField("is_24_hours", val)}
                  />
                </div>
              </div>
              {!settings.is_24_hours && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Opening</Label>
                    <Input
                      value={settings.opening_time}
                      onChange={(e) => updateField("opening_time", e.target.value)}
                      placeholder="9:00 AM"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Closing</Label>
                    <Input
                      value={settings.closing_time}
                      onChange={(e) => updateField("closing_time", e.target.value)}
                      placeholder="10:00 PM"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-muted-foreground" />
                <Label className="text-xs font-medium">Delivery Available</Label>
              </div>
              <Switch
                checked={settings.delivery_available}
                onCheckedChange={(val) => updateField("delivery_available", val)}
              />
            </div>

            {/* Save */}
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default PharmacySettingsDialog;
