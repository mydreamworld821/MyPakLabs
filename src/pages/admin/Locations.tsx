import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, MapPin, Building, Upload, FileText } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface Province {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

interface City {
  id: string;
  name: string;
  province_id: string;
  display_order: number;
  is_active: boolean;
}

const Locations = () => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Province form state
  const [provinceDialogOpen, setProvinceDialogOpen] = useState(false);
  const [editingProvince, setEditingProvince] = useState<Province | null>(null);
  const [provinceName, setProvinceName] = useState("");
  const [provinceOrder, setProvinceOrder] = useState(0);
  const [provinceActive, setProvinceActive] = useState(true);

  // City form state
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [cityName, setCityName] = useState("");
  const [cityProvinceId, setCityProvinceId] = useState("");
  const [cityOrder, setCityOrder] = useState(0);
  const [cityActive, setCityActive] = useState(true);

  // Bulk import state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkProvinceId, setBulkProvinceId] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [provincesRes, citiesRes] = await Promise.all([
        supabase.from("provinces").select("*").order("display_order"),
        supabase.from("cities").select("*").order("display_order")
      ]);

      if (provincesRes.data) setProvinces(provincesRes.data);
      if (citiesRes.data) setCities(citiesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Province handlers
  const openProvinceDialog = (province?: Province) => {
    if (province) {
      setEditingProvince(province);
      setProvinceName(province.name);
      setProvinceOrder(province.display_order);
      setProvinceActive(province.is_active);
    } else {
      setEditingProvince(null);
      setProvinceName("");
      setProvinceOrder(provinces.length);
      setProvinceActive(true);
    }
    setProvinceDialogOpen(true);
  };

  const handleSaveProvince = async () => {
    if (!provinceName.trim()) {
      toast.error("Province name is required");
      return;
    }

    try {
      if (editingProvince) {
        const { error } = await supabase
          .from("provinces")
          .update({
            name: provinceName.trim(),
            display_order: provinceOrder,
            is_active: provinceActive
          })
          .eq("id", editingProvince.id);

        if (error) throw error;
        toast.success("Province updated");
      } else {
        const { error } = await supabase
          .from("provinces")
          .insert({
            name: provinceName.trim(),
            display_order: provinceOrder,
            is_active: provinceActive
          });

        if (error) throw error;
        toast.success("Province added");
      }

      setProvinceDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save province");
    }
  };

  const handleDeleteProvince = async (id: string) => {
    if (!confirm("Delete this province? All cities under it will also be deleted.")) return;

    try {
      const { error } = await supabase.from("provinces").delete().eq("id", id);
      if (error) throw error;
      toast.success("Province deleted");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete province");
    }
  };

  // City handlers
  const openCityDialog = (city?: City) => {
    if (city) {
      setEditingCity(city);
      setCityName(city.name);
      setCityProvinceId(city.province_id);
      setCityOrder(city.display_order);
      setCityActive(city.is_active);
    } else {
      setEditingCity(null);
      setCityName("");
      setCityProvinceId(provinces[0]?.id || "");
      setCityOrder(cities.length);
      setCityActive(true);
    }
    setCityDialogOpen(true);
  };

  const handleSaveCity = async () => {
    if (!cityName.trim()) {
      toast.error("City name is required");
      return;
    }
    if (!cityProvinceId) {
      toast.error("Please select a province");
      return;
    }

    try {
      if (editingCity) {
        const { error } = await supabase
          .from("cities")
          .update({
            name: cityName.trim(),
            province_id: cityProvinceId,
            display_order: cityOrder,
            is_active: cityActive
          })
          .eq("id", editingCity.id);

        if (error) throw error;
        toast.success("City updated");
      } else {
        const { error } = await supabase
          .from("cities")
          .insert({
            name: cityName.trim(),
            province_id: cityProvinceId,
            display_order: cityOrder,
            is_active: cityActive
          });

        if (error) throw error;
        toast.success("City added");
      }

      setCityDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save city");
    }
  };

  const handleDeleteCity = async (id: string) => {
    if (!confirm("Delete this city?")) return;

    try {
      const { error } = await supabase.from("cities").delete().eq("id", id);
      if (error) throw error;
      toast.success("City deleted");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete city");
    }
  };

  const getCitiesByProvince = (provinceId: string) => {
    return cities.filter(c => c.province_id === provinceId);
  };

  // Bulk import handler
  const handleBulkImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!bulkProvinceId) {
      toast.error("Please select a province first");
      return;
    }

    setBulkImporting(true);

    try {
      const text = await file.text();
      
      // Parse city names - split by newlines, commas, or semicolons
      const cityNames = text
        .split(/[\n\r,;]+/)
        .map(name => name.trim())
        .filter(name => name.length > 0 && name.length < 100);

      if (cityNames.length === 0) {
        toast.error("No valid city names found in file");
        return;
      }

      // Get existing cities for this province to avoid duplicates
      const existingCities = cities
        .filter(c => c.province_id === bulkProvinceId)
        .map(c => c.name.toLowerCase());

      // Filter out duplicates
      const newCityNames = cityNames.filter(
        name => !existingCities.includes(name.toLowerCase())
      );

      if (newCityNames.length === 0) {
        toast.info("All cities already exist in this province");
        return;
      }

      // Prepare cities for insert
      const startOrder = cities.filter(c => c.province_id === bulkProvinceId).length;
      const citiesToInsert = newCityNames.map((name, index) => ({
        name,
        province_id: bulkProvinceId,
        display_order: startOrder + index,
        is_active: true
      }));

      // Insert in batches of 50
      const batchSize = 50;
      let insertedCount = 0;

      for (let i = 0; i < citiesToInsert.length; i += batchSize) {
        const batch = citiesToInsert.slice(i, i + batchSize);
        const { error } = await supabase.from("cities").insert(batch);
        
        if (error) throw error;
        insertedCount += batch.length;
      }

      toast.success(`Successfully imported ${insertedCount} cities`);
      setBulkDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Bulk import error:", error);
      toast.error(error.message || "Failed to import cities");
    } finally {
      setBulkImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Locations</h1>
            <p className="text-muted-foreground">Manage provinces and cities used across the platform</p>
          </div>
        </div>

        {/* Provinces Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Provinces
            </CardTitle>
            <Dialog open={provinceDialogOpen} onOpenChange={setProvinceDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => openProvinceDialog()}>
                  <Plus className="w-4 h-4 mr-1" /> Add Province
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProvince ? "Edit Province" : "Add Province"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Province Name</Label>
                    <Input
                      value={provinceName}
                      onChange={(e) => setProvinceName(e.target.value)}
                      placeholder="e.g., Punjab"
                    />
                  </div>
                  <div>
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={provinceOrder}
                      onChange={(e) => setProvinceOrder(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={provinceActive} onCheckedChange={setProvinceActive} />
                    <Label>Active</Label>
                  </div>
                  <Button onClick={handleSaveProvince} className="w-full">
                    {editingProvince ? "Update" : "Add"} Province
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {provinces.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No provinces added yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {provinces.map((province) => (
                  <div
                    key={province.id}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      province.is_active ? "bg-background" : "bg-muted opacity-60"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{province.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getCitiesByProvince(province.id).length} cities
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openProvinceDialog(province)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteProvince(province.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cities Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Cities
            </CardTitle>
            <div className="flex gap-2">
              {/* Bulk Import Button */}
              <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={provinces.length === 0}>
                    <Upload className="w-4 h-4 mr-1" /> Bulk Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Import Cities</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        How to use
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Create a text file (.txt) with city names</li>
                        <li>• One city name per line</li>
                        <li>• Or separate with commas: Lahore, Karachi, Islamabad</li>
                        <li>• Duplicate cities will be skipped automatically</li>
                      </ul>
                    </div>
                    
                    <div>
                      <Label>Select Province</Label>
                      <Select value={bulkProvinceId} onValueChange={setBulkProvinceId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select province for cities" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Upload File</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.csv,.text"
                        onChange={handleBulkImport}
                        disabled={!bulkProvinceId || bulkImporting}
                        className="mt-1 block w-full text-sm text-muted-foreground
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary file:text-primary-foreground
                          hover:file:bg-primary/90
                          file:cursor-pointer cursor-pointer
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    {bulkImporting && (
                      <div className="flex items-center justify-center gap-2 py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                        <span className="text-sm text-muted-foreground">Importing cities...</span>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Add Single City Button */}
              <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => openCityDialog()} disabled={provinces.length === 0}>
                    <Plus className="w-4 h-4 mr-1" /> Add City
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCity ? "Edit City" : "Add City"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>City Name</Label>
                    <Input
                      value={cityName}
                      onChange={(e) => setCityName(e.target.value)}
                      placeholder="e.g., Lahore"
                    />
                  </div>
                  <div>
                    <Label>Province</Label>
                    <Select value={cityProvinceId} onValueChange={setCityProvinceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={cityOrder}
                      onChange={(e) => setCityOrder(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={cityActive} onCheckedChange={setCityActive} />
                    <Label>Active</Label>
                  </div>
                  <Button onClick={handleSaveCity} className="w-full">
                    {editingCity ? "Update" : "Add"} City
                  </Button>
                </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {provinces.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Add a province first</p>
            ) : cities.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No cities added yet</p>
            ) : (
              <div className="space-y-4">
                {provinces.map((province) => {
                  const provinceCities = getCitiesByProvince(province.id);
                  if (provinceCities.length === 0) return null;
                  
                  return (
                    <div key={province.id}>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">{province.name}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {provinceCities.map((city) => (
                          <div
                            key={city.id}
                            className={`p-2 rounded-lg border flex items-center justify-between ${
                              city.is_active ? "bg-background" : "bg-muted opacity-60"
                            }`}
                          >
                            <span className="text-sm">{city.name}</span>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openCityDialog(city)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeleteCity(city.id)}>
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Locations;
