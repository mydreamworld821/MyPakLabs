import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2, MapPin, Phone, Mail, ExternalLink, Building2 } from "lucide-react";

export interface Branch {
  id: string;
  city: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  google_maps_url?: string;
  timing?: string;
}

interface BranchManagerProps {
  branches: Branch[];
  onChange: (branches: Branch[]) => void;
}

const DEFAULT_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Hyderabad",
  "Sialkot",
  "Gujranwala",
  "Bahawalpur",
];

const BranchManager = ({ branches, onChange }: BranchManagerProps) => {
  const [newCity, setNewCity] = useState("");
  const [showAddCity, setShowAddCity] = useState(false);

  // Get unique cities from branches
  const cities = [...new Set(branches.map((b) => b.city))];

  // Get available cities (not yet added)
  const availableCities = DEFAULT_CITIES.filter((c) => !cities.includes(c));

  const addCity = (city: string) => {
    if (!city.trim() || cities.includes(city.trim())) return;
    
    // Add a default branch for the new city
    const newBranch: Branch = {
      id: `branch_${Date.now()}`,
      city: city.trim(),
      name: "Main Branch",
      address: "",
      phone: "",
    };
    
    onChange([...branches, newBranch]);
    setNewCity("");
    setShowAddCity(false);
  };

  const addBranch = (city: string) => {
    const newBranch: Branch = {
      id: `branch_${Date.now()}`,
      city,
      name: "",
      address: "",
      phone: "",
    };
    onChange([...branches, newBranch]);
  };

  const updateBranch = (branchId: string, updates: Partial<Branch>) => {
    onChange(
      branches.map((b) => (b.id === branchId ? { ...b, ...updates } : b))
    );
  };

  const deleteBranch = (branchId: string) => {
    onChange(branches.filter((b) => b.id !== branchId));
  };

  const deleteCity = (city: string) => {
    if (!confirm(`Delete all branches in ${city}?`)) return;
    onChange(branches.filter((b) => b.city !== city));
  };

  const getBranchesForCity = (city: string) => {
    return branches.filter((b) => b.city === city);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Cities & Branches
        </Label>
        <Badge variant="secondary">{branches.length} branches in {cities.length} cities</Badge>
      </div>

      {/* Cities Accordion */}
      {cities.length > 0 && (
        <Accordion type="multiple" className="w-full space-y-2">
          {cities.map((city) => (
            <AccordionItem
              key={city}
              value={city}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium">{city}</span>
                  <Badge variant="outline" className="ml-2">
                    {getBranchesForCity(city).length} branch(es)
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-3">
                  {getBranchesForCity(city).map((branch, index) => (
                    <Card key={branch.id} className="border-dashed">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Branch #{index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => deleteBranch(branch.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Branch Name *</Label>
                            <Input
                              value={branch.name}
                              onChange={(e) =>
                                updateBranch(branch.id, { name: e.target.value })
                              }
                              placeholder="Main Branch"
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Phone className="w-3 h-3" /> Phone *
                            </Label>
                            <Input
                              value={branch.phone}
                              onChange={(e) =>
                                updateBranch(branch.id, { phone: e.target.value })
                              }
                              placeholder="+92 300 1234567"
                              className="h-9"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Address *
                          </Label>
                          <Input
                            value={branch.address}
                            onChange={(e) =>
                              updateBranch(branch.id, { address: e.target.value })
                            }
                            placeholder="123 Main Street, Area Name"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Mail className="w-3 h-3" /> Email
                            </Label>
                            <Input
                              type="email"
                              value={branch.email || ""}
                              onChange={(e) =>
                                updateBranch(branch.id, { email: e.target.value })
                              }
                              placeholder="branch@lab.com"
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Timing</Label>
                            <Input
                              value={branch.timing || ""}
                              onChange={(e) =>
                                updateBranch(branch.id, { timing: e.target.value })
                              }
                              placeholder="9 AM - 9 PM"
                              className="h-9"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Google Maps URL
                          </Label>
                          <Input
                            type="url"
                            value={branch.google_maps_url || ""}
                            onChange={(e) =>
                              updateBranch(branch.id, {
                                google_maps_url: e.target.value,
                              })
                            }
                            placeholder="https://maps.google.com/..."
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBranch(city)}
                      className="flex-1"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Branch in {city}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCity(city)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove City
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Add New City */}
      {!showAddCity ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAddCity(true)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add City
        </Button>
      ) : (
        <Card className="border-primary/50">
          <CardContent className="p-4 space-y-3">
            <Label>Add New City</Label>
            
            {availableCities.length > 0 && (
              <Select onValueChange={(value) => addCity(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a city..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex gap-2">
              <Input
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="Or type a new city name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCity(newCity);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => addCity(newCity)}
                disabled={!newCity.trim()}
              >
                Add
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddCity(false);
                setNewCity("");
              }}
              className="w-full"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {cities.length === 0 && !showAddCity && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No branches added yet. Click "Add City" to get started.
        </p>
      )}
    </div>
  );
};

export default BranchManager;