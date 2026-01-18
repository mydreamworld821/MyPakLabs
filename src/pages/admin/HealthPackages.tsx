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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

interface Lab {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Test {
  id: string;
  name: string;
  category: string | null;
}

interface PackageTest {
  test_id: string;
  test_price: number;
  test?: Test;
}

interface HealthPackage {
  id: string;
  lab_id: string;
  name: string;
  description: string | null;
  original_price: number;
  discount_percentage: number;
  discounted_price: number;
  is_featured: boolean;
  featured_order: number | null;
  is_active: boolean;
  created_at: string;
  lab?: Lab;
  package_tests?: PackageTest[];
}

const AdminHealthPackages = () => {
  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
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
    discount_percentage: 0,
    is_featured: false,
    featured_order: null as number | null,
    is_active: true,
  });
  const [selectedTests, setSelectedTests] = useState<{ test_id: string; test_price: number }[]>([]);
  const [testSearchQuery, setTestSearchQuery] = useState("");

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

      // Fetch tests
      const { data: testsData } = await supabase
        .from("tests")
        .select("id, name, category")
        .order("name");
      
      setTests(testsData || []);

      // Fetch packages with lab info and tests
      const { data: packagesData, error } = await supabase
        .from("health_packages")
        .select(`
          *,
          lab:labs(id, name, logo_url),
          package_tests(test_id, test_price, test:tests(id, name, category))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPackages(packagesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const calculatePrices = (tests: { test_id: string; test_price: number }[], discountPercentage: number) => {
    const originalPrice = tests.reduce((sum, t) => sum + t.test_price, 0);
    const discountedPrice = originalPrice - (originalPrice * discountPercentage / 100);
    return { originalPrice, discountedPrice: Math.round(discountedPrice) };
  };

  const handleOpenDialog = (pkg?: HealthPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        lab_id: pkg.lab_id,
        name: pkg.name,
        description: pkg.description || "",
        discount_percentage: pkg.discount_percentage,
        is_featured: pkg.is_featured,
        featured_order: pkg.featured_order,
        is_active: pkg.is_active,
      });
      setSelectedTests(
        pkg.package_tests?.map(pt => ({
          test_id: pt.test_id,
          test_price: pt.test_price,
        })) || []
      );
    } else {
      setEditingPackage(null);
      setFormData({
        lab_id: "",
        name: "",
        description: "",
        discount_percentage: 0,
        is_featured: false,
        featured_order: null,
        is_active: true,
      });
      setSelectedTests([]);
    }
    setTestSearchQuery("");
    setDialogOpen(true);
  };

  const handleLabChange = async (labId: string) => {
    setFormData({ ...formData, lab_id: labId });
    setSelectedTests([]);
    
    // Fetch lab-specific test prices
    if (labId) {
      const { data: labTests } = await supabase
        .from("lab_tests")
        .select("test_id, price, discounted_price")
        .eq("lab_id", labId)
        .eq("is_available", true);
      
      // Store for reference when adding tests
      if (labTests) {
        localStorage.setItem(`lab_tests_${labId}`, JSON.stringify(labTests));
      }
    }
  };

  const handleAddTest = (test: Test) => {
    if (selectedTests.some(t => t.test_id === test.id)) {
      return;
    }

    // Get lab-specific price if available
    let testPrice = 0;
    const labTestsStr = localStorage.getItem(`lab_tests_${formData.lab_id}`);
    if (labTestsStr) {
      const labTests = JSON.parse(labTestsStr);
      const labTest = labTests.find((lt: any) => lt.test_id === test.id);
      if (labTest) {
        testPrice = labTest.discounted_price || labTest.price;
      }
    }

    setSelectedTests([...selectedTests, { test_id: test.id, test_price: testPrice }]);
  };

  const handleRemoveTest = (testId: string) => {
    setSelectedTests(selectedTests.filter(t => t.test_id !== testId));
  };

  const handleTestPriceChange = (testId: string, price: number) => {
    setSelectedTests(
      selectedTests.map(t =>
        t.test_id === testId ? { ...t, test_price: price } : t
      )
    );
  };

  const handleSave = async () => {
    if (!formData.lab_id || !formData.name || selectedTests.length === 0) {
      toast.error("Please fill in all required fields and add at least one test");
      return;
    }

    setSaving(true);
    try {
      const { originalPrice, discountedPrice } = calculatePrices(selectedTests, formData.discount_percentage);

      const packageData = {
        lab_id: formData.lab_id,
        name: formData.name,
        description: formData.description || null,
        original_price: originalPrice,
        discount_percentage: formData.discount_percentage,
        discounted_price: discountedPrice,
        is_featured: formData.is_featured,
        featured_order: formData.is_featured ? formData.featured_order : null,
        is_active: formData.is_active,
      };

      let packageId: string;

      if (editingPackage) {
        const { error } = await supabase
          .from("health_packages")
          .update(packageData)
          .eq("id", editingPackage.id);

        if (error) throw error;
        packageId = editingPackage.id;

        // Delete existing tests
        await supabase
          .from("package_tests")
          .delete()
          .eq("package_id", packageId);
      } else {
        const { data, error } = await supabase
          .from("health_packages")
          .insert(packageData)
          .select()
          .single();

        if (error) throw error;
        packageId = data.id;
      }

      // Insert package tests
      const packageTests = selectedTests.map(t => ({
        package_id: packageId,
        test_id: t.test_id,
        test_price: t.test_price,
      }));

      const { error: testsError } = await supabase
        .from("package_tests")
        .insert(packageTests);

      if (testsError) throw testsError;

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

  const filteredTests = tests.filter(t =>
    t.name.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
    t.category?.toLowerCase().includes(testSearchQuery.toLowerCase())
  );

  const { originalPrice, discountedPrice } = calculatePrices(selectedTests, formData.discount_percentage);

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
                <TableHead>Original Price</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Final Price</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredPackages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
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
                        {pkg.package_tests?.length || 0} tests
                      </Badge>
                    </TableCell>
                    <TableCell>Rs. {pkg.original_price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-green-600">
                        {pkg.discount_percentage}% OFF
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      Rs. {pkg.discounted_price.toLocaleString()}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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
                  onValueChange={handleLabChange}
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

            {formData.lab_id && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Select Tests *</Label>
                  <Badge variant="outline">
                    {selectedTests.length} tests selected
                  </Badge>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tests..."
                    value={testSearchQuery}
                    onChange={(e) => setTestSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <ScrollArea className="h-48 border rounded-lg p-2">
                  <div className="space-y-1">
                    {filteredTests.map(test => {
                      const isSelected = selectedTests.some(t => t.test_id === test.id);
                      return (
                        <div
                          key={test.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted ${
                            isSelected ? "bg-primary/10" : ""
                          }`}
                          onClick={() => !isSelected && handleAddTest(test)}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox checked={isSelected} />
                            <span className="text-sm">{test.name}</span>
                            {test.category && (
                              <Badge variant="outline" className="text-xs">
                                {test.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {selectedTests.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Tests with Prices</Label>
                    <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                      {selectedTests.map(st => {
                        const test = tests.find(t => t.id === st.test_id);
                        return (
                          <div key={st.test_id} className="flex items-center justify-between p-3">
                            <span className="text-sm font-medium">{test?.name}</span>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={st.test_price}
                                onChange={(e) => handleTestPriceChange(st.test_id, parseFloat(e.target.value) || 0)}
                                className="w-24 h-8"
                                placeholder="Price"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleRemoveTest(st.test_id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Original Price (Auto)</Label>
                <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center">
                  Rs. {originalPrice.toLocaleString()}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Discount %</Label>
                <Input
                  type="number"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Final Price (Auto)</Label>
                <div className="h-10 px-3 py-2 bg-primary/10 text-primary font-semibold rounded-md flex items-center">
                  Rs. {discountedPrice.toLocaleString()}
                </div>
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
