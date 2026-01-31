import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Clock, Phone } from "lucide-react";

export interface DoctorPracticeLocation {
  id: string;
  type: 'hospital_doctor' | 'practice_location' | 'custom' | 'hospital';
  hospital_id?: string;
  location_name: string;
  address: string | null;
  city: string | null;
  contact_phone: string | null;
  consultation_fee: number;
  followup_fee: number | null;
  available_days: string[];
  available_time_start: string;
  available_time_end: string;
  appointment_duration: number;
  is_primary: boolean;
}

interface LocationSelectorProps {
  locations: DoctorPracticeLocation[];
  selectedLocationId: string | null;
  onSelect: (locationId: string) => void;
}

export const LocationSelector = ({
  locations,
  selectedLocationId,
  onSelect,
}: LocationSelectorProps) => {
  if (locations.length === 0) {
    return null;
  }

  if (locations.length === 1) {
    // If only one location, auto-select it
    if (!selectedLocationId) {
      onSelect(locations[0].id);
    }
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium">Select Location</p>
      <RadioGroup value={selectedLocationId || ""} onValueChange={onSelect}>
        <div className="space-y-2">
          {locations.map((location) => (
            <div key={location.id}>
              <Label
                htmlFor={location.id}
                className="cursor-pointer block"
              >
                <Card className={`transition-all ${
                  selectedLocationId === location.id 
                    ? "border-primary ring-1 ring-primary/20 bg-primary/5" 
                    : "hover:border-primary/50"
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value={location.id} id={location.id} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{location.location_name}</span>
                          {location.is_primary && (
                            <Badge className="text-[10px]" variant="secondary">Primary</Badge>
                          )}
                        </div>
                        
                        {location.address && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{location.address}{location.city && `, ${location.city}`}</span>
                          </p>
                        )}

                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                          <span className="font-semibold text-primary">
                            Rs. {location.consultation_fee}
                          </span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {location.available_time_start} - {location.available_time_end}
                          </span>
                          {location.contact_phone && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {location.contact_phone}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {location.available_days.slice(0, 5).map((day) => (
                            <Badge key={day} variant="outline" className="text-[10px] px-1.5 py-0">
                              {day.substring(0, 3)}
                            </Badge>
                          ))}
                          {location.available_days.length > 5 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              +{location.available_days.length - 5}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
};

export default LocationSelector;
