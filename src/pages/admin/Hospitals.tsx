import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Star,
  MapPin,
  Search,
  Loader2,
  X,
  Users,
  Bed,
  Ambulance,
} from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import HospitalDoctorManager from "@/components/admin/HospitalDoctorManager";

// Predefined cities in Pakistan
const PAKISTAN_CITIES = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Gujranwala",
  "Sialkot",
  "Sargodha",
  "Bahawalpur",
  "Hyderabad",
  "Sukkur",
  "Larkana",
  "Abbottabad",
  "Mardan",
  "Gujrat",
  "Sahiwal",
  "Sheikhupura",
];

// Predefined departments
const HOSPITAL_DEPARTMENTS = [
  "OPD (Outpatient)",
  "IPD (Inpatient)",
  "ICU (Intensive Care)",
  "CCU (Cardiac Care)",
  "NICU (Neonatal ICU)",
  "Emergency",
  "Radiology",
  "Laboratory",
  "Pharmacy",
  "Physiotherapy",
  "Dialysis",
  "Operation Theater",
  "Blood Bank",
  "Dental",
  "ENT",
  "Ophthalmology",
  "Dermatology",
  "Psychiatry",
  "Orthopedics",
  "Gynecology",
  "Pediatrics",
  "Neurology",
  "Cardiology",
  "Oncology",
  "Urology",
  "Nephrology",
  "Gastroenterology",
  "Pulmonology",
  "Endocrinology",
];

// Predefined facilities
const HOSPITAL_FACILITIES = [
  "Ambulance Service",
  "24/7 Pharmacy",
  "Parking",
  "Cafeteria",
  "ATM",
  "Wheelchair Access",
  "WiFi",
  "Prayer Room",
  "Waiting Lounge",
  "CCTV Surveillance",
  "Generator Backup",
  "Air Conditioning",
  "Private Rooms",
  "VIP Suites",
  "Online Appointments",
  "Home Sample Collection",
  "Insurance Accepted",
  "Credit Card Payment",
];

interface Hospital {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  specialties: string[] | null;
  departments: string[] | null;
  facilities: string[] | null;
  bed_count: number | null;
  emergency_available: boolean | null;
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  description: string | null;
  rating: number | null;
  review_count: number | null;
  opening_time: string | null;
  closing_time: string | null;
  is_active: boolean;
  is_featured: boolean;
  featured_order: number | null;
}

interface HospitalDoctorCount {
  hospital_id: string;
  count: number;
}

const AdminHospitals = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctorCounts, setDoctorCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [saving, setSaving] = useState(false);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [customCityInput, setCustomCityInput] = useState("");
  const [showCustomCity, setShowCustomCity] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    city: "",
    address: "",
    specialties: [] as string[],
    departments: [] as string[],
    facilities: [] as string[],
    bed_count: 0,
    emergency_available: true,
    contact_phone: "",
    contact_email: "",
    website: "",
    logo_url: "",
    cover_image_url: "",
    description: "",
    rating: 0,
    opening_time: "8:00 AM",
    closing_time: "10:00 PM",
    is_active: true,
    is_featured: false,
    featured_order: 0,
  });

  useEffect(() => {
    fetchHospitals();
    fetchDoctorCounts();
  }, []);

  const fetchHospitals = async () => {
    try {
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHospitals(data || []);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      toast.error("Failed to fetch hospitals");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorCounts = async () => {
    try {
      const { data, error } = await supabase
        .from("hospital_doctors")
        .select("hospital_id");

      if (error) throw error;
      
      // Count doctors per hospital
      const counts: Record<string, number> = {};
      (data || []).forEach(item => {
        counts[item.hospital_id] = (counts[item.hospital_id] || 0) + 1;
      });
      setDoctorCounts(counts);
    } catch (error) {
      console.error("Error fetching doctor counts:", error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const finalCity = getFinalCity();
      const hospitalData = {
        ...formData,
        city: finalCity,
        slug: formData.slug || generateSlug(formData.name),
        rating: formData.rating || null,
        bed_count: formData.bed_count || null,
      };

      if (editingHospital) {
        const { error } = await supabase
          .from("hospitals")
          .update(hospitalData)
          .eq("id", editingHospital.id);

        if (error) throw error;
        toast.success("Hospital updated successfully");
      } else {
        const { error } = await supabase.from("hospitals").insert([hospitalData]);

        if (error) throw error;
        toast.success("Hospital created successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchHospitals();
    } catch (error: any) {
      console.error("Error saving hospital:", error);
      toast.error(error.message || "Failed to save hospital");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (hospital: Hospital) => {
    setEditingHospital(hospital);
    const cityInList = PAKISTAN_CITIES.includes(hospital.city || "");
    setShowCustomCity(!cityInList && !!hospital.city);
    setCustomCityInput(!cityInList ? hospital.city || "" : "");
    
    setFormData({
      name: hospital.name,
      slug: hospital.slug,
      city: cityInList ? hospital.city || "" : "custom",
      address: hospital.address || "",
      specialties: hospital.specialties || [],
      departments: hospital.departments || [],
      facilities: hospital.facilities || [],
      bed_count: hospital.bed_count || 0,
      emergency_available: hospital.emergency_available ?? true,
      contact_phone: hospital.contact_phone || "",
      contact_email: hospital.contact_email || "",
      website: hospital.website || "",
      logo_url: hospital.logo_url || "",
      cover_image_url: hospital.cover_image_url || "",
      description: hospital.description || "",
      rating: hospital.rating || 0,
      opening_time: hospital.opening_time || "8:00 AM",
      closing_time: hospital.closing_time || "10:00 PM",
      is_active: hospital.is_active,
      is_featured: hospital.is_featured,
      featured_order: hospital.featured_order || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hospital?")) return;

    try {
      const { error } = await supabase.from("hospitals").delete().eq("id", id);

      if (error) throw error;
      toast.success("Hospital deleted successfully");
      fetchHospitals();
    } catch (error) {
      console.error("Error deleting hospital:", error);
      toast.error("Failed to delete hospital");
    }
  };

  const toggleActive = async (hospital: Hospital) => {
    try {
      const { error } = await supabase
        .from("hospitals")
        .update({ is_active: !hospital.is_active })
        .eq("id", hospital.id);

      if (error) throw error;
      toast.success(`Hospital ${hospital.is_active ? "deactivated" : "activated"}`);
      fetchHospitals();
    } catch (error) {
      console.error("Error toggling hospital status:", error);
      toast.error("Failed to update hospital status");
    }
  };

  const toggleFeatured = async (hospital: Hospital) => {
    try {
      const { error } = await supabase
        .from("hospitals")
        .update({ is_featured: !hospital.is_featured })
        .eq("id", hospital.id);

      if (error) throw error;
      toast.success(`Hospital ${hospital.is_featured ? "unfeatured" : "featured"}`);
      fetchHospitals();
    } catch (error) {
      console.error("Error toggling featured status:", error);
      toast.error("Failed to update featured status");
    }
  };

  const resetForm = () => {
    setEditingHospital(null);
    setShowCustomCity(false);
    setCustomCityInput("");
    setFormData({
      name: "",
      slug: "",
      city: "",
      address: "",
      specialties: [],
      departments: [],
      facilities: [],
      bed_count: 0,
      emergency_available: true,
      contact_phone: "",
      contact_email: "",
      website: "",
      logo_url: "",
      cover_image_url: "",
      description: "",
      rating: 0,
      opening_time: "8:00 AM",
      closing_time: "10:00 PM",
      is_active: true,
      is_featured: false,
      featured_order: 0,
    });
    setSpecialtyInput("");
  };

  const addSpecialty = () => {
    if (specialtyInput.trim() && !formData.specialties.includes(specialtyInput.trim())) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialtyInput.trim()],
      });
      setSpecialtyInput("");
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter((s) => s !== specialty),
    });
  };

  const toggleDepartment = (dept: string) => {
    if (formData.departments.includes(dept)) {
      setFormData({
        ...formData,
        departments: formData.departments.filter((d) => d !== dept),
      });
    } else {
      setFormData({
        ...formData,
        departments: [...formData.departments, dept],
      });
    }
  };

  const toggleFacility = (facility: string) => {
    if (formData.facilities.includes(facility)) {
      setFormData({
        ...formData,
        facilities: formData.facilities.filter((f) => f !== facility),
      });
    } else {
      setFormData({
        ...formData,
        facilities: [...formData.facilities, facility],
      });
    }
  };

  const handleCityChange = (value: string) => {
    if (value === "custom") {
      setShowCustomCity(true);
      setFormData({ ...formData, city: "custom" });
    } else {
      setShowCustomCity(false);
      setCustomCityInput("");
      setFormData({ ...formData, city: value });
    }
  };

  const getFinalCity = () => {
    if (showCustomCity && customCityInput.trim()) {
      return customCityInput.trim();
    }
    return formData.city === "custom" ? "" : formData.city;
  };

  const filteredHospitals = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hospitals</h1>
            <p className="text-muted-foreground">Manage hospital listings</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Hospital
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingHospital ? "Edit Hospital" : "Add New Hospital"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Select value={formData.city} onValueChange={handleCityChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAKISTAN_CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">+ Add Custom City</SelectItem>
                      </SelectContent>
                    </Select>
                    {showCustomCity && (
                      <Input
                        placeholder="Enter city name"
                        value={customCityInput}
                        onChange={(e) => setCustomCityInput(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Full Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g., Main Boulevard, DHA Phase 5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Phone</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Specialties</Label>
                  <div className="flex gap-2">
                    <Input
                      value={specialtyInput}
                      onChange={(e) => setSpecialtyInput(e.target.value)}
                      placeholder="Add specialty"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
                    />
                    <Button type="button" onClick={addSpecialty}>
                      Add
                    </Button>
                  </div>
                  {formData.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.specialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="gap-1">
                          {specialty}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => removeSpecialty(specialty)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Image Uploads */}
                <div className="grid grid-cols-2 gap-6">
                  <ImageUpload
                    label="Hospital Logo"
                    bucket="hospital-images"
                    folder="logos"
                    currentUrl={formData.logo_url}
                    onUpload={(url) => setFormData({ ...formData, logo_url: url })}
                    aspectRatio="square"
                    skipCrop={true}
                  />
                  <ImageUpload
                    label="Cover Image"
                    bucket="hospital-images"
                    folder="banners"
                    currentUrl={formData.cover_image_url}
                    onUpload={(url) => setFormData({ ...formData, cover_image_url: url })}
                    aspectRatio="banner"
                    skipCrop={true}
                  />
                </div>

                {/* Departments Section */}
                <div className="space-y-2">
                  <Label>Departments</Label>
                  <p className="text-xs text-muted-foreground">Select available departments</p>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {HOSPITAL_DEPARTMENTS.map((dept) => (
                      <label
                        key={dept}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.departments.includes(dept)}
                          onChange={() => toggleDepartment(dept)}
                          className="rounded"
                        />
                        <span className="truncate">{dept}</span>
                      </label>
                    ))}
                  </div>
                  {formData.departments.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formData.departments.length} department(s) selected
                    </p>
                  )}
                </div>

                {/* Facilities Section */}
                <div className="space-y-2">
                  <Label>Facilities</Label>
                  <p className="text-xs text-muted-foreground">Select available facilities</p>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    {HOSPITAL_FACILITIES.map((facility) => (
                      <label
                        key={facility}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.facilities.includes(facility)}
                          onChange={() => toggleFacility(facility)}
                          className="rounded"
                        />
                        <span className="truncate">{facility}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Bed Count & Emergency */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bed_count">Bed Count</Label>
                    <Input
                      id="bed_count"
                      type="number"
                      min="0"
                      value={formData.bed_count}
                      onChange={(e) => setFormData({ ...formData, bed_count: parseInt(e.target.value) || 0 })}
                      placeholder="e.g., 200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>24/7 Emergency</Label>
                    <div className="flex items-center gap-2 pt-2">
                      <Switch
                        checked={formData.emergency_available}
                        onCheckedChange={(checked) => setFormData({ ...formData, emergency_available: checked })}
                      />
                      <span className="text-sm text-muted-foreground">
                        {formData.emergency_available ? "Available" : "Not Available"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="opening_time">Opening Time</Label>
                    <Input
                      id="opening_time"
                      value={formData.opening_time}
                      onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closing_time">Closing Time</Label>
                    <Input
                      id="closing_time"
                      value={formData.closing_time}
                      onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating</Label>
                    <Input
                      id="rating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                    <Label>Featured</Label>
                  </div>
                  {formData.is_featured && (
                    <div className="flex items-center gap-2">
                      <Label>Order:</Label>
                      <Input
                        type="number"
                        className="w-20"
                        value={formData.featured_order}
                        onChange={(e) => setFormData({ ...formData, featured_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingHospital ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search hospitals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{hospitals.length}</p>
                  <p className="text-xs text-muted-foreground">Total Hospitals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {hospitals.filter((h) => h.is_active).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {hospitals.filter((h) => h.is_featured).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Featured</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {new Set(hospitals.map((h) => h.city).filter(Boolean)).size}
                  </p>
                  <p className="text-xs text-muted-foreground">Cities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Departments</TableHead>
                    <TableHead>Doctors</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHospitals.map((hospital) => {
                    const doctorCount = doctorCounts[hospital.id] || 0;
                    return (
                    <TableRow key={hospital.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                            {hospital.logo_url ? (
                              <img
                                src={hospital.logo_url}
                                alt={hospital.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building2 className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{hospital.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{hospital.contact_phone || "-"}</span>
                              {hospital.emergency_available && (
                                <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                  <Ambulance className="w-2.5 h-2.5 mr-0.5" />
                                  24/7
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          {hospital.city || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {hospital.departments?.slice(0, 2).map((d) => (
                            <Badge key={d} variant="secondary" className="text-xs">
                              {d.split(" ")[0]}
                            </Badge>
                          ))}
                          {hospital.departments && hospital.departments.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{hospital.departments.length - 2}
                            </Badge>
                          )}
                          {(!hospital.departments || hospital.departments.length === 0) && (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className={doctorCount > 0 ? "text-primary font-medium" : ""}>
                              {doctorCount}
                            </span>
                          </div>
                          <HospitalDoctorManager
                            hospitalId={hospital.id}
                            hospitalName={hospital.name}
                            departments={hospital.departments || []}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={hospital.is_active}
                          onCheckedChange={() => toggleActive(hospital)}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={hospital.is_featured}
                          onCheckedChange={() => toggleFeatured(hospital)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(hospital)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(hospital.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );})}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminHospitals;