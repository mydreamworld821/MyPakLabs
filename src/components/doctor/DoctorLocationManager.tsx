import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Building2, 
  Plus, 
  X, 
  Clock, 
  Phone, 
  MapPin, 
  Search, 
  Edit2,
  Trash2,
  Check
} from "lucide-react";
import { toast } from "sonner";

interface Hospital {
  id: string;
  name: string;
  city: string | null;
  slug: string;
  address: string | null;
}

export interface DoctorLocation {
  id: string;
  type: 'hospital' | 'custom';
  hospital_id?: string;
  location_name: string;
  address: string;
  city: string;
  contact_phone: string;
  consultation_fee: number;
  followup_fee: number | null;
  available_days: string[];
  available_time_start: string;
  available_time_end: string;
  appointment_duration: number;
  is_primary: boolean;
  is_active: boolean;
}

interface DoctorLocationManagerProps {
  locations: DoctorLocation[];
  onChange: (locations: DoctorLocation[]) => void;
  maxLocations?: number;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const DoctorLocationManager = ({
  locations,
  onChange,
  maxLocations = 10,
}: DoctorLocationManagerProps) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingLocation, setEditingLocation] = useState<DoctorLocation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Form state for new/edit location
  const [formData, setFormData] = useState<Partial<DoctorLocation>>({
    location_name: "",
    address: "",
    city: "",
    contact_phone: "",
    consultation_fee: 0,
    followup_fee: null,
    available_days: [],
    available_time_start: "09:00",
    available_time_end: "17:00",
    appointment_duration: 15,
    is_primary: false,
    is_active: true,
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const { data } = await supabase
        .from("hospitals")
        .select("id, name, city, slug, address")
        .eq("is_active", true)
        .order("name");
      setHospitals(data || []);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHospitals = hospitals.filter(h => {
    const selectedHospitalIds = locations.filter(l => l.type === 'hospital').map(l => l.hospital_id);
    return !selectedHospitalIds.includes(h.id) &&
      h.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelectHospital = (hospital: Hospital) => {
    if (locations.length >= maxLocations) {
      toast.error("Maximum locations reached");
      return;
    }

    setFormData({
      type: 'hospital',
      hospital_id: hospital.id,
      location_name: hospital.name,
      address: hospital.address || "",
      city: hospital.city || "",
      contact_phone: "",
      consultation_fee: 0,
      followup_fee: null,
      available_days: [],
      available_time_start: "09:00",
      available_time_end: "17:00",
      appointment_duration: 15,
      is_primary: locations.length === 0,
      is_active: true,
    });
    setSearchOpen(false);
    setSearchQuery("");
    setIsDialogOpen(true);
    setIsAddingCustom(false);
  };

  const handleAddCustomLocation = () => {
    if (locations.length >= maxLocations) {
      toast.error("Maximum locations reached");
      return;
    }

    setFormData({
      type: 'custom',
      location_name: "",
      address: "",
      city: "",
      contact_phone: "",
      consultation_fee: 0,
      followup_fee: null,
      available_days: [],
      available_time_start: "09:00",
      available_time_end: "17:00",
      appointment_duration: 15,
      is_primary: locations.length === 0,
      is_active: true,
    });
    setIsDialogOpen(true);
    setIsAddingCustom(true);
  };

  const handleEditLocation = (location: DoctorLocation) => {
    setEditingLocation(location);
    setFormData(location);
    setIsDialogOpen(true);
    setIsAddingCustom(location.type === 'custom');
  };

  const handleDayToggle = (day: string) => {
    const days = formData.available_days || [];
    setFormData({
      ...formData,
      available_days: days.includes(day)
        ? days.filter(d => d !== day)
        : [...days, day]
    });
  };

  const handleSaveLocation = () => {
    if (!formData.location_name || !formData.consultation_fee) {
      toast.error("Please fill location name and consultation fee");
      return;
    }

    if (!formData.available_days || formData.available_days.length === 0) {
      toast.error("Please select at least one available day");
      return;
    }

    const newLocation: DoctorLocation = {
      id: editingLocation?.id || `temp-${Date.now()}`,
      type: formData.type as 'hospital' | 'custom',
      hospital_id: formData.hospital_id,
      location_name: formData.location_name!,
      address: formData.address || "",
      city: formData.city || "",
      contact_phone: formData.contact_phone || "",
      consultation_fee: Number(formData.consultation_fee),
      followup_fee: formData.followup_fee ? Number(formData.followup_fee) : null,
      available_days: formData.available_days || [],
      available_time_start: formData.available_time_start || "09:00",
      available_time_end: formData.available_time_end || "17:00",
      appointment_duration: Number(formData.appointment_duration) || 15,
      is_primary: formData.is_primary || false,
      is_active: formData.is_active !== false,
    };

    let updatedLocations: DoctorLocation[];
    if (editingLocation) {
      updatedLocations = locations.map(l => 
        l.id === editingLocation.id ? newLocation : l
      );
    } else {
      updatedLocations = [...locations, newLocation];
    }

    // If this is primary, remove primary from others
    if (newLocation.is_primary) {
      updatedLocations = updatedLocations.map(l => ({
        ...l,
        is_primary: l.id === newLocation.id
      }));
    }

    onChange(updatedLocations);
    setIsDialogOpen(false);
    setEditingLocation(null);
    setFormData({});
    toast.success(editingLocation ? "Location updated" : "Location added");
  };

  const handleRemoveLocation = (locationId: string) => {
    onChange(locations.filter(l => l.id !== locationId));
    toast.success("Location removed");
  };

  const handleTogglePrimary = (locationId: string) => {
    onChange(locations.map(l => ({
      ...l,
      is_primary: l.id === locationId
    })));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Practice Locations & Schedules</Label>
        <Badge variant="outline" className="text-xs">
          {locations.length}/{maxLocations}
        </Badge>
      </div>

      {/* Existing Locations */}
      {locations.length > 0 && (
        <div className="space-y-3">
          {locations.map((location) => (
            <Card key={location.id} className={location.is_primary ? "border-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      location.type === 'hospital' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <Building2 className={`w-5 h-5 ${
                        location.type === 'hospital' ? 'text-blue-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-medium truncate">{location.location_name}</h4>
                        {location.is_primary && (
                          <Badge className="text-[10px]">Primary</Badge>
                        )}
                        <Badge variant={location.type === 'hospital' ? 'secondary' : 'outline'} className="text-[10px]">
                          {location.type === 'hospital' ? 'Hospital' : 'Clinic'}
                        </Badge>
                      </div>
                      {location.address && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {location.address}{location.city && `, ${location.city}`}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="font-medium text-primary">Rs. {location.consultation_fee}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {location.available_time_start} - {location.available_time_end}
                        </span>
                        {location.contact_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {location.contact_phone}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {location.available_days.map(day => (
                          <Badge key={day} variant="outline" className="text-[10px] px-1.5">
                            {day.substring(0, 3)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditLocation(location)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleRemoveLocation(location.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {!location.is_primary && locations.length > 1 && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="text-xs p-0 h-auto mt-2"
                    onClick={() => handleTogglePrimary(location.id)}
                  >
                    Set as Primary
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Location Buttons */}
      {locations.length < maxLocations && (
        <div className="flex gap-2">
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                Add from Hospital List
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search hospitals..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  {loading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>No hospitals found</CommandEmpty>
                      <CommandGroup>
                        {filteredHospitals.slice(0, 10).map((hospital) => (
                          <CommandItem
                            key={hospital.id}
                            value={hospital.name}
                            onSelect={() => handleSelectHospital(hospital)}
                            className="cursor-pointer"
                          >
                            <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm">{hospital.name}</p>
                              {hospital.city && (
                                <p className="text-xs text-muted-foreground">{hospital.city}</p>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleAddCustomLocation}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Location
          </Button>
        </div>
      )}

      {/* Location Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? "Edit Location" : "Add Practice Location"}
            </DialogTitle>
            <DialogDescription>
              Configure schedule and fees for this location
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Location Name */}
            <div>
              <Label className="text-xs">Location Name *</Label>
              <Input
                value={formData.location_name || ""}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                placeholder="Hospital or Clinic name"
                className="mt-1"
                disabled={formData.type === 'hospital'}
              />
            </div>

            {/* Address & City */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Address</Label>
                <Input
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">City</Label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City name"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Contact Phone */}
            <div>
              <Label className="text-xs">Contact Phone</Label>
              <Input
                value={formData.contact_phone || ""}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="0300-1234567"
                className="mt-1"
              />
            </div>

            {/* Fees */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Consultation Fee (Rs.) *</Label>
                <Input
                  type="number"
                  value={formData.consultation_fee || ""}
                  onChange={(e) => setFormData({ ...formData, consultation_fee: Number(e.target.value) })}
                  placeholder="2000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Follow-up Fee (Rs.)</Label>
                <Input
                  type="number"
                  value={formData.followup_fee || ""}
                  onChange={(e) => setFormData({ ...formData, followup_fee: e.target.value ? Number(e.target.value) : null })}
                  placeholder="1000"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Available Days */}
            <div>
              <Label className="text-xs mb-2 block">Available Days *</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`px-3 py-1.5 rounded text-xs transition-colors ${
                      (formData.available_days || []).includes(day)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Time & Duration */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Start Time</Label>
                <Input
                  type="time"
                  value={formData.available_time_start || "09:00"}
                  onChange={(e) => setFormData({ ...formData, available_time_start: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">End Time</Label>
                <Input
                  type="time"
                  value={formData.available_time_end || "17:00"}
                  onChange={(e) => setFormData({ ...formData, available_time_end: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Duration (min)</Label>
                <Input
                  type="number"
                  value={formData.appointment_duration || 15}
                  onChange={(e) => setFormData({ ...formData, appointment_duration: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Primary Location */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Switch
                checked={formData.is_primary || false}
                onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked })}
              />
              <div>
                <p className="text-sm font-medium">Primary Location</p>
                <p className="text-xs text-muted-foreground">
                  Default location shown on your profile
                </p>
              </div>
            </div>

            <Button onClick={handleSaveLocation} className="w-full">
              <Check className="w-4 h-4 mr-2" />
              {editingLocation ? "Update Location" : "Add Location"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">
        Add multiple practice locations with individual schedules and fees. Patients will choose their preferred location when booking.
      </p>
    </div>
  );
};

export default DoctorLocationManager;
