import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Star, ArrowUp, ArrowDown, User, Save } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface Doctor {
  id: string;
  full_name: string;
  photo_url: string | null;
  city: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  rating: number | null;
  is_featured: boolean;
  featured_order: number;
  status: string;
  specialization?: {
    name: string;
  } | null;
}

const FeaturedDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [cities, setCities] = useState<string[]>([]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select(`
          id,
          full_name,
          photo_url,
          city,
          experience_years,
          consultation_fee,
          rating,
          is_featured,
          featured_order,
          status,
          doctor_specializations (
            name
          )
        `)
        .eq("status", "approved")
        .order("is_featured", { ascending: false })
        .order("featured_order", { ascending: true })
        .order("full_name", { ascending: true });

      if (error) throw error;

      const formattedDoctors = data?.map(doc => ({
        ...doc,
        is_featured: doc.is_featured || false,
        featured_order: doc.featured_order || 0,
        specialization: doc.doctor_specializations
      })) || [];

      setDoctors(formattedDoctors);

      // Extract unique cities
      const uniqueCities = [...new Set(formattedDoctors
        .map(d => d.city)
        .filter((city): city is string => !!city)
      )];
      setCities(uniqueCities);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const toggleFeatured = (doctorId: string) => {
    setDoctors(prev => prev.map(doc => {
      if (doc.id === doctorId) {
        return { ...doc, is_featured: !doc.is_featured };
      }
      return doc;
    }));
  };

  const updateOrder = (doctorId: string, newOrder: number) => {
    setDoctors(prev => prev.map(doc => {
      if (doc.id === doctorId) {
        return { ...doc, featured_order: newOrder };
      }
      return doc;
    }));
  };

  const moveUp = (doctorId: string) => {
    const featuredDocs = doctors.filter(d => d.is_featured);
    const idx = featuredDocs.findIndex(d => d.id === doctorId);
    if (idx > 0) {
      const currentOrder = featuredDocs[idx].featured_order;
      const prevOrder = featuredDocs[idx - 1].featured_order;
      
      setDoctors(prev => prev.map(doc => {
        if (doc.id === doctorId) return { ...doc, featured_order: prevOrder };
        if (doc.id === featuredDocs[idx - 1].id) return { ...doc, featured_order: currentOrder };
        return doc;
      }));
    }
  };

  const moveDown = (doctorId: string) => {
    const featuredDocs = doctors.filter(d => d.is_featured);
    const idx = featuredDocs.findIndex(d => d.id === doctorId);
    if (idx < featuredDocs.length - 1) {
      const currentOrder = featuredDocs[idx].featured_order;
      const nextOrder = featuredDocs[idx + 1].featured_order;
      
      setDoctors(prev => prev.map(doc => {
        if (doc.id === doctorId) return { ...doc, featured_order: nextOrder };
        if (doc.id === featuredDocs[idx + 1].id) return { ...doc, featured_order: currentOrder };
        return doc;
      }));
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const updates = doctors.map(doc => ({
        id: doc.id,
        is_featured: doc.is_featured,
        featured_order: doc.featured_order
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("doctors")
          .update({
            is_featured: update.is_featured,
            featured_order: update.featured_order
          })
          .eq("id", update.id);

        if (error) throw error;
      }

      toast.success("Featured doctors updated successfully!");
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === "all" || doc.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  const featuredDoctors = filteredDoctors.filter(d => d.is_featured).sort((a, b) => a.featured_order - b.featured_order);
  const nonFeaturedDoctors = filteredDoctors.filter(d => !d.is_featured);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Featured Doctors</h1>
            <p className="text-muted-foreground">Manage which doctors appear on the homepage</p>
          </div>
          <Button onClick={saveChanges} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Featured Doctors Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Featured Doctors ({featuredDoctors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : featuredDoctors.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No featured doctors yet. Toggle the switch to feature doctors.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Order</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead className="w-24">Featured</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featuredDoctors.map((doctor, idx) => (
                    <TableRow key={doctor.id}>
                      <TableCell>
                        <Input
                          type="number"
                          value={doctor.featured_order}
                          onChange={(e) => updateOrder(doctor.id, parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                            {doctor.photo_url ? (
                              <img src={doctor.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{doctor.full_name}</p>
                            <p className="text-xs text-muted-foreground">{doctor.experience_years || 0} yrs exp</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{doctor.specialization?.name || "-"}</TableCell>
                      <TableCell>
                        {doctor.city && <Badge variant="outline">{doctor.city}</Badge>}
                      </TableCell>
                      <TableCell>Rs. {doctor.consultation_fee?.toLocaleString() || "-"}</TableCell>
                      <TableCell>
                        <Switch
                          checked={doctor.is_featured}
                          onCheckedChange={() => toggleFeatured(doctor.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveUp(doctor.id)}
                            disabled={idx === 0}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveDown(doctor.id)}
                            disabled={idx === featuredDoctors.length - 1}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* All Approved Doctors */}
        <Card>
          <CardHeader>
            <CardTitle>All Approved Doctors ({nonFeaturedDoctors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : nonFeaturedDoctors.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                All doctors are featured or no doctors match the filter.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="w-24">Featured</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nonFeaturedDoctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                            {doctor.photo_url ? (
                              <img src={doctor.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{doctor.full_name}</p>
                            <p className="text-xs text-muted-foreground">{doctor.experience_years || 0} yrs exp</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{doctor.specialization?.name || "-"}</TableCell>
                      <TableCell>
                        {doctor.city && <Badge variant="outline">{doctor.city}</Badge>}
                      </TableCell>
                      <TableCell>Rs. {doctor.consultation_fee?.toLocaleString() || "-"}</TableCell>
                      <TableCell>
                        {doctor.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {doctor.rating.toFixed(1)}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={doctor.is_featured}
                          onCheckedChange={() => toggleFeatured(doctor.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default FeaturedDoctors;
