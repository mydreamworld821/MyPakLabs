import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Building2, Loader2, Upload } from "lucide-react";
import LabsCsvUpload from "@/components/admin/LabsCsvUpload";
import LabTestsCsvUpload from "@/components/admin/LabTestsCsvUpload";

interface Lab {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  discount_percentage: number | null;
  rating: number | null;
  review_count: number | null;
  cities: string[] | null;
  is_active: boolean | null;
  created_at: string;
}

const AdminLabs = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    logo_url: "",
    cover_image_url: "",
    discount_percentage: 0,
    cities: "",
    is_active: true
  });

  // CSV file for new lab
  const [pendingCsvFile, setPendingCsvFile] = useState<File | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const { data, error } = await supabase
        .from("labs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLabs(data || []);
    } catch (error) {
      console.error("Error fetching labs:", error);
      toast.error("Failed to fetch labs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (lab?: Lab) => {
    if (lab) {
      setEditingLab(lab);
      setFormData({
        name: lab.name,
        slug: lab.slug,
        description: lab.description || "",
        logo_url: lab.logo_url || "",
        cover_image_url: lab.cover_image_url || "",
        discount_percentage: lab.discount_percentage || 0,
        cities: lab.cities?.join(", ") || "",
        is_active: lab.is_active ?? true
      });
    } else {
      setEditingLab(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        logo_url: "",
        cover_image_url: "",
        discount_percentage: 0,
        cities: "",
        is_active: true
      });
      setPendingCsvFile(null);
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
    setIsDialogOpen(true);
  };

  const importTestsFromCsv = async (labId: string, file: File) => {
    const text = await file.text();
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) return;

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const testNameIndex = headers.findIndex(h => h === "test_name");
    const priceIndex = headers.findIndex(h => h === "price");
    const discountedPriceIndex = headers.findIndex(h => h === "discounted_price");
    const isAvailableIndex = headers.findIndex(h => h === "is_available");

    if (testNameIndex === -1 || priceIndex === -1) {
      toast.error("CSV must have 'test_name' and 'price' columns");
      return;
    }

    const rows = lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim());
      const price = parseFloat(values[priceIndex]) || 0;
      const discountedPriceValue = discountedPriceIndex >= 0 ? values[discountedPriceIndex] : "";
      
      return {
        test_name: values[testNameIndex],
        price,
        discounted_price: discountedPriceValue ? parseFloat(discountedPriceValue) : null,
        is_available: isAvailableIndex >= 0 ? values[isAvailableIndex].toLowerCase() !== "false" : true
      };
    }).filter(row => row.test_name && row.price > 0);

    if (rows.length === 0) {
      toast.error("No valid test data in CSV");
      return;
    }

    // Fetch all tests to map names to IDs
    const { data: allTests } = await supabase
      .from("tests")
      .select("id, name")
      .eq("is_active", true);

    const testNameToId = new Map(
      allTests?.map(t => [t.name.toLowerCase(), t.id]) || []
    );

    let successCount = 0;
    for (const row of rows) {
      const testId = testNameToId.get(row.test_name.toLowerCase());
      if (!testId) continue;

      const { error } = await supabase
        .from("lab_tests")
        .insert({
          lab_id: labId,
          test_id: testId,
          price: row.price,
          discounted_price: row.discounted_price,
          is_available: row.is_available
        });

      if (!error) successCount++;
    }

    if (successCount > 0) {
      toast.success(`Imported ${successCount} tests for this lab`);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error("Name and slug are required");
      return;
    }

    setIsSaving(true);

    try {
      const labData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        logo_url: formData.logo_url || null,
        cover_image_url: formData.cover_image_url || null,
        discount_percentage: formData.discount_percentage,
        cities: formData.cities.split(",").map(c => c.trim()).filter(Boolean),
        is_active: formData.is_active
      };

      if (editingLab) {
        const { error } = await supabase
          .from("labs")
          .update(labData)
          .eq("id", editingLab.id);

        if (error) throw error;
        toast.success("Lab updated successfully");
      } else {
        const { data, error } = await supabase
          .from("labs")
          .insert(labData)
          .select()
          .single();

        if (error) throw error;
        toast.success("Lab created successfully");

        // Import tests from CSV if provided
        if (pendingCsvFile && data) {
          await importTestsFromCsv(data.id, pendingCsvFile);
        }
      }

      setPendingCsvFile(null);
      if (csvInputRef.current) csvInputRef.current.value = "";
      setIsDialogOpen(false);
      fetchLabs();
    } catch (error: any) {
      console.error("Error saving lab:", error);
      toast.error(error.message || "Failed to save lab");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lab?")) return;

    try {
      const { error } = await supabase
        .from("labs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Lab deleted successfully");
      fetchLabs();
    } catch (error) {
      console.error("Error deleting lab:", error);
      toast.error("Failed to delete lab");
    }
  };

  const filteredLabs = labs.filter(lab =>
    lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lab.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Labs</h1>
            <p className="text-muted-foreground mt-1">
              Manage diagnostic laboratories
            </p>
          </div>

          <div className="flex gap-2">
            <LabsCsvUpload onSuccess={fetchLabs} />
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lab
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingLab ? "Edit Lab" : "Add New Lab"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Lab Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Chughtai Lab"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="chughtai-lab"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Lab description..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover_image_url">Cover Image URL</Label>
                  <Input
                    id="cover_image_url"
                    value={formData.cover_image_url}
                    onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Discount Percentage</Label>
                  <Input
                    id="discount"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cities">Cities (comma-separated)</Label>
                  <Input
                    id="cities"
                    value={formData.cities}
                    onChange={(e) => setFormData({ ...formData, cities: e.target.value })}
                    placeholder="Lahore, Karachi, Islamabad"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <div className="border-t pt-4">
                  <Label className="mb-2 block">Bulk Import Tests (CSV)</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload a CSV file with test_name, price, discounted_price, is_available columns
                  </p>
                  {editingLab ? (
                    <LabTestsCsvUpload
                      labId={editingLab.id}
                      labName={editingLab.name}
                      onSuccess={() => {}}
                    />
                  ) : (
                    <Input
                      ref={csvInputRef}
                      type="file"
                      accept=".csv"
                      onChange={(e) => setPendingCsvFile(e.target.files?.[0] || null)}
                      className="cursor-pointer"
                    />
                  )}
                  {pendingCsvFile && !editingLab && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {pendingCsvFile.name} selected - will import after saving
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Lab"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search labs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Labs Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredLabs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No labs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lab</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Cities</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLabs.map((lab) => (
                      <TableRow key={lab.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {lab.logo_url ? (
                              <img
                                src={lab.logo_url}
                                alt={lab.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{lab.name}</p>
                              <p className="text-sm text-muted-foreground">{lab.slug}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {lab.discount_percentage || 0}% off
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {lab.cities?.slice(0, 2).join(", ")}
                            {(lab.cities?.length || 0) > 2 && (
                              <span className="text-muted-foreground">
                                +{(lab.cities?.length || 0) - 2} more
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={lab.is_active ? "default" : "secondary"}>
                            {lab.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <LabTestsCsvUpload
                              labId={lab.id}
                              labName={lab.name}
                              onSuccess={() => {}}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(lab)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(lab.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminLabs;
