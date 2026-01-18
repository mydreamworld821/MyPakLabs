import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Package, Star, X } from "lucide-react";

interface Lab {
  id: string;
  name: string;
  logo_url: string | null;
}

interface TestItem {
  name: string;
  details?: string;
}

interface HealthPackage {
  id: string;
  lab_id: string;
  name: string;
  description: string | null;
  original_price: number;
  discount_percentage: number;
  discounted_price: number;
  tests_included: TestItem[];
  is_featured: boolean;
  featured_order: number | null;
  is_active: boolean;
  created_at: string;
  lab?: Lab;
}

const AdminHealthPackages = () => {
  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLab, setSelectedLab] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<HealthPackage | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    lab_id: "",
    name: "",
    description: "",
    original_price: 0,
    discount_percentage: 0,
    is_featured: false,
    featured_order: null as number | null,
    is_active: true,
  });
  const [testsIncluded, setTestsIncluded] = useState<TestItem[]>([]);
  const [newTestName, setNewTestName] = useState("");
  const [newTestDetails, setNewTestDetails] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch labs
      const { data: labsData } = await supabase
        .from("labs")
        .select("id, name, logo_url")
        .eq("is_active", true)
        .order("name");
      
      setLabs(labsData || []);

      // Fetch packages with lab info
      const { data: packagesData, error } = await supabase
        .from("health_packages")
        .select(`
          id,
          lab_id,
          name,
          description,
          original_price,
          discount_percentage,
          discounted_price,
          tests_included,
          is_featured,
          featured_order,
          is_active,
          created_at,
          lab:labs(id, name, logo_url)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPackages((packagesData || []).map(pkg => ({
        ...pkg,
        tests_included: (pkg.tests_included as unknown as TestItem[]) || []
      })));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (pkg?: HealthPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      // Calculate original price from discounted_price and discount_percentage
      const discountPct = (pkg as any).discount_percentage || 0;
      const originalPrice = discountPct > 0 
        ? Math.round(pkg.discounted_price / (1 - discountPct / 100))
        : pkg.discounted_price;
      setFormData({
        lab_id: pkg.lab_id,
        name: pkg.name,
        description: pkg.description || "",
        original_price: originalPrice,
        discount_percentage: discountPct,
        is_featured: pkg.is_featured,
        featured_order: pkg.featured_order,
        is_active: pkg.is_active,
      });
      setTestsIncluded(pkg.tests_included || []);
    } else {
      setEditingPackage(null);
      setFormData({
        lab_id: "",
        name: "",
        description: "",
        original_price: 0,
        discount_percentage: 0,
        is_featured: false,
        featured_order: null,
        is_active: true,
      });
      setTestsIncluded([]);
    }
    setNewTestName("");
    setNewTestDetails("");
    setDialogOpen(true);
  };

  const handleAddTest = () => {
    if (!newTestName.trim()) {
      toast.error("Please enter test name");
      return;
    }
    setTestsIncluded([...testsIncluded, { name: newTestName.trim(), details: newTestDetails.trim() || undefined }]);
    setNewTestName("");
    setNewTestDetails("");
  };

  const handleRemoveTest = (index: number) => {
    setTestsIncluded(testsIncluded.filter((_, i) => i !== index));
  };

  const handleUpdateTest = (index: number, field: 'name' | 'details', value: string) => {
    const updated = [...testsIncluded];
    if (field === 'name') {
      updated[index].name = value;
    } else {
      updated[index].details = value || undefined;
    }
    setTestsIncluded(updated);
  };

  const handleSave = async () => {
    if (!formData.lab_id || !formData.name || testsIncluded.length === 0) {
      toast.error("Please fill in all required fields and add at least one test");
      return;
    }

    if (formData.original_price <= 0) {
      toast.error("Please enter a valid package price");
      return;
    }

    // Calculate discounted price based on discount percentage
    const discountedPrice = formData.discount_percentage > 0
      ? Math.round(formData.original_price * (1 - formData.discount_percentage / 100))
      : formData.original_price;

    setSaving(true);
    try {
      const packageData = {
        lab_id: formData.lab_id,
        name: formData.name,
        description: formData.description || null,
        original_price: formData.original_price,
        discount_percentage: formData.discount_percentage || 0,
        discounted_price: discountedPrice,
        tests_included: JSON.parse(JSON.stringify(testsIncluded)),
        is_featured: formData.is_featured,
        featured_order: formData.is_featured ? formData.featured_order : null,
        is_active: formData.is_active,
      };

      if (editingPackage) {
        const { error } = await supabase
          .from("health_packages")
          .update(packageData)
          .eq("id", editingPackage.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("health_packages")
          .insert([packageData]);

        if (error) throw error;
      }

      toast.success(editingPackage ? "Package updated successfully" : "Package created successfully");
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error("Failed to save package");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      const { error } = await supabase
        .from("health_packages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Package deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting package:", error);
      toast.error("Failed to delete package");
    }
  };

  const handleToggleFeatured = async (pkg: HealthPackage) => {
    try {
      const { error } = await supabase
        .from("health_packages")
        .update({ is_featured: !pkg.is_featured })
        .eq("id", pkg.id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error updating featured status:", error);
      toast.error("Failed to update featured status");
    }
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.lab?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLab = selectedLab === "all" || pkg.lab_id === selectedLab;
    return matchesSearch && matchesLab;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              Health Packages
            </h1>
            <p className="text-muted-foreground">
              Manage lab health packages with bundled tests
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Package
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedLab} onValueChange={setSelectedLab}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by lab" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Labs</SelectItem>
              {labs.map(lab => (
                <SelectItem key={lab.id} value={lab.id}>{lab.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package Name</TableHead>
                <TableHead>Lab</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredPackages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No packages found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPackages.map(pkg => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {pkg.lab?.logo_url && (
                          <img
                            src={pkg.lab.logo_url}
                            alt={pkg.lab?.name}
                            className="h-6 w-6 rounded object-contain"
                          />
                        )}
                        {pkg.lab?.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {pkg.tests_included?.length || 0} tests
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-semibold text-primary">
                          Rs. {pkg.discounted_price.toLocaleString()}
                        </span>
                        {pkg.discount_percentage > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <span className="line-through">Rs. {pkg.original_price.toLocaleString()}</span>
                            <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                              -{pkg.discount_percentage}%
                            </Badge>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFeatured(pkg)}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            pkg.is_featured ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                          }`}
                        />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pkg.is_active ? "default" : "secondary"}>
                        {pkg.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(pkg)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(pkg.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? "Edit Health Package" : "Create Health Package"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lab *</Label>
                <Select
                  value={formData.lab_id}
                  onValueChange={(val) => setFormData({ ...formData, lab_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lab" />
                  </SelectTrigger>
                  <SelectContent>
                    {labs.map(lab => (
                      <SelectItem key={lab.id} value={lab.id}>
                        {lab.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Package Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Complete Health Checkup"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Package description..."
                rows={2}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Tests Included *</Label>
                <Badge variant="outline">
                  {testsIncluded.length} tests added
                </Badge>
              </div>

              {/* Add new test form */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Test name (e.g., CBC - Complete Blood Count)"
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTest()}
                  />
                </div>
                <div className="w-40">
                  <Input
                    placeholder="Details (optional)"
                    value={newTestDetails}
                    onChange={(e) => setNewTestDetails(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTest()}
                  />
                </div>
                <Button type="button" onClick={handleAddTest}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Tests list */}
              {testsIncluded.length > 0 && (
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {testsIncluded.map((test, index) => (
                    <div key={index} className="flex items-center gap-2 p-3">
                      <div className="flex-1">
                        <Input
                          value={test.name}
                          onChange={(e) => handleUpdateTest(index, 'name', e.target.value)}
                          placeholder="Test name"
                          className="h-8"
                        />
                      </div>
                      <div className="w-40">
                        <Input
                          value={test.details || ""}
                          onChange={(e) => handleUpdateTest(index, 'details', e.target.value)}
                          placeholder="Details"
                          className="h-8"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleRemoveTest(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Package Price (Rs.) *</Label>
                <Input
                  type="number"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter package price"
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Discount % (Optional)</Label>
                <Input
                  type="number"
                  value={formData.discount_percentage || ""}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 10"
                  min={0}
                  max={100}
                />
                {formData.discount_percentage > 0 && formData.original_price > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Final Price: Rs. {Math.round(formData.original_price * (1 - formData.discount_percentage / 100)).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
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
                    value={formData.featured_order || ""}
                    onChange={(e) => setFormData({ ...formData, featured_order: parseInt(e.target.value) || null })}
                    className="w-20 h-8"
                    placeholder="1"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingPackage ? "Update Package" : "Create Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminHealthPackages;