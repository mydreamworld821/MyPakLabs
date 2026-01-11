import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Building2, Check, Plus, X, Search } from "lucide-react";

interface Hospital {
  id: string;
  name: string;
  city: string | null;
  slug: string;
}

export interface SelectedHospital {
  hospital_id: string;
  hospital_name: string;
  hospital_slug: string;
  department?: string;
  is_current: boolean;
  is_custom?: boolean; // For manually entered hospitals not in DB
}

interface HospitalSelectorProps {
  selectedHospitals: SelectedHospital[];
  onChange: (hospitals: SelectedHospital[]) => void;
  maxSelections?: number;
}

export const HospitalSelector = ({
  selectedHospitals,
  onChange,
  maxSelections = 5,
}: HospitalSelectorProps) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customHospitalName, setCustomHospitalName] = useState("");

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const { data } = await supabase
        .from("hospitals")
        .select("id, name, city, slug")
        .eq("is_active", true)
        .order("name");
      setHospitals(data || []);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHospitals = useMemo(() => {
    const selectedIds = selectedHospitals.map(h => h.hospital_id);
    return hospitals.filter(
      h => !selectedIds.includes(h.id) &&
        h.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [hospitals, selectedHospitals, searchQuery]);

  const handleSelectHospital = (hospital: Hospital) => {
    if (selectedHospitals.length >= maxSelections) return;
    
    onChange([
      ...selectedHospitals,
      {
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        hospital_slug: hospital.slug,
        is_current: true,
        is_custom: false,
      },
    ]);
    setOpen(false);
    setSearchQuery("");
  };

  const handleAddCustomHospital = () => {
    if (!customHospitalName.trim() || selectedHospitals.length >= maxSelections) return;
    
    onChange([
      ...selectedHospitals,
      {
        hospital_id: `custom-${Date.now()}`,
        hospital_name: customHospitalName.trim(),
        hospital_slug: "",
        is_current: true,
        is_custom: true,
      },
    ]);
    setCustomHospitalName("");
    setShowAddCustom(false);
  };

  const handleRemoveHospital = (hospitalId: string) => {
    onChange(selectedHospitals.filter(h => h.hospital_id !== hospitalId));
  };

  const handleToggleCurrent = (hospitalId: string) => {
    onChange(
      selectedHospitals.map(h =>
        h.hospital_id === hospitalId ? { ...h, is_current: !h.is_current } : h
      )
    );
  };

  const handleDepartmentChange = (hospitalId: string, department: string) => {
    onChange(
      selectedHospitals.map(h =>
        h.hospital_id === hospitalId ? { ...h, department } : h
      )
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Hospital Affiliations</Label>
        <span className="text-[10px] text-muted-foreground">
          {selectedHospitals.length}/{maxSelections} selected
        </span>
      </div>

      {/* Selected Hospitals */}
      {selectedHospitals.length > 0 && (
        <div className="space-y-2">
          {selectedHospitals.map((hospital) => (
            <Card key={hospital.hospital_id} className="bg-muted/30">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{hospital.hospital_name}</p>
                      {hospital.is_custom && (
                        <Badge variant="outline" className="text-[10px] mt-0.5">Custom</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => handleRemoveHospital(hospital.hospital_id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={hospital.is_current}
                      onCheckedChange={() => handleToggleCurrent(hospital.hospital_id)}
                      className="scale-75"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {hospital.is_current ? "Currently Working" : "Previously Worked"}
                    </span>
                  </div>
                </div>
                <Input
                  placeholder="Department (optional)"
                  value={hospital.department || ""}
                  onChange={(e) => handleDepartmentChange(hospital.hospital_id, e.target.value)}
                  className="h-7 text-xs"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Hospital Button */}
      {selectedHospitals.length < maxSelections && (
        <div className="space-y-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs h-8"
              >
                <Search className="w-3 h-3 mr-1" />
                Search & Add Hospital
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search hospitals..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="text-xs"
                />
                <CommandList>
                  {loading ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Loading hospitals...
                    </div>
                  ) : (
                    <>
                      <CommandEmpty className="py-2 px-3">
                        <p className="text-xs text-muted-foreground mb-2">
                          No hospitals found
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            setShowAddCustom(true);
                            setCustomHospitalName(searchQuery);
                            setOpen(false);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add "{searchQuery}" manually
                        </Button>
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredHospitals.slice(0, 10).map((hospital) => (
                          <CommandItem
                            key={hospital.id}
                            value={hospital.name}
                            onSelect={() => handleSelectHospital(hospital)}
                            className="text-xs cursor-pointer"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <Building2 className="w-3 h-3 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="truncate">{hospital.name}</p>
                                {hospital.city && (
                                  <p className="text-[10px] text-muted-foreground">{hospital.city}</p>
                                )}
                              </div>
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

          {/* Add Custom Hospital */}
          {!showAddCustom ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs h-7 text-muted-foreground"
              onClick={() => setShowAddCustom(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Hospital not listed? Add manually
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Enter hospital name"
                value={customHospitalName}
                onChange={(e) => setCustomHospitalName(e.target.value)}
                className="h-8 text-xs flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomHospital();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                className="h-8"
                onClick={handleAddCustomHospital}
                disabled={!customHospitalName.trim()}
              >
                <Check className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  setShowAddCustom(false);
                  setCustomHospitalName("");
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        Select hospitals where you currently work or have worked previously.
        Patients can click on these to view hospital details.
      </p>
    </div>
  );
};

export default HospitalSelector;
