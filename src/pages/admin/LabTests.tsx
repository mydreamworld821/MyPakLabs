import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Filter, Download, Upload } from "lucide-react";

interface LabTest {
  id: string;
  lab_id: string;
  test_id: string;
  price: number;
  discounted_price: number | null;
  is_available: boolean;
  labs: { name: string } | null;
  tests: { name: string; category: string | null } | null;
}

interface Lab {
  id: string;
  name: string;
}

interface Test {
  id: string;
  name: string;
  category: string | null;
}

interface CSVRow {
  lab_name: string;
  test_name: string;
  price: string;
  discounted_price: string;
  is_available: string;
}

const LabTests = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLabTest, setEditingLabTest] = useState<LabTest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLabId, setFilterLabId] = useState<string>("all");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    lab_id: "",
    test_id: "",
    price: "",
    discounted_price: "",
    is_available: true,
  });

  // Fetch lab tests with lab and test details
  const { data: labTests, isLoading } = useQuery({
    queryKey: ["admin-lab-tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_tests")
        .select(`
          *,
          labs:lab_id (name),
          tests:test_id (name, category)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as LabTest[];
    },
  });

  // Fetch all labs for dropdown
  const { data: labs } = useQuery({
    queryKey: ["admin-labs-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labs")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data as Lab[];
    },
  });

  // Fetch all tests for dropdown
  const { data: tests } = useQuery({
    queryKey: ["admin-tests-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tests")
        .select("id, name, category")
        .order("name");
      
      if (error) throw error;
      return data as Test[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("lab_tests").insert({
        lab_id: data.lab_id,
        test_id: data.test_id,
        price: parseFloat(data.price),
        discounted_price: data.discounted_price ? parseFloat(data.discounted_price) : null,
        is_available: data.is_available,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lab-tests"] });
      toast.success("Lab test pricing added successfully");
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add lab test pricing");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("lab_tests")
        .update({
          lab_id: data.lab_id,
          test_id: data.test_id,
          price: parseFloat(data.price),
          discounted_price: data.discounted_price ? parseFloat(data.discounted_price) : null,
          is_available: data.is_available,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lab-tests"] });
      toast.success("Lab test pricing updated successfully");
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update lab test pricing");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lab_tests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lab-tests"] });
      toast.success("Lab test pricing deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete lab test pricing");
    },
  });

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await supabase
        .from("lab_tests")
        .update({ is_available })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lab-tests"] });
      toast.success("Availability updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update availability");
    },
  });

  const resetForm = () => {
    setFormData({
      lab_id: "",
      test_id: "",
      price: "",
      discounted_price: "",
      is_available: true,
    });
    setEditingLabTest(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (labTest: LabTest) => {
    setEditingLabTest(labTest);
    setFormData({
      lab_id: labTest.lab_id,
      test_id: labTest.test_id,
      price: labTest.price.toString(),
      discounted_price: labTest.discounted_price?.toString() || "",
      is_available: labTest.is_available,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lab_id || !formData.test_id || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (editingLabTest) {
      updateMutation.mutate({ id: editingLabTest.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Filter lab tests
  const filteredLabTests = labTests?.filter((lt) => {
    const matchesSearch =
      lt.labs?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lt.tests?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLab = filterLabId === "all" || lt.lab_id === filterLabId;
    return matchesSearch && matchesLab;
  });

  const calculateDiscount = (price: number, discountedPrice: number | null) => {
    if (!discountedPrice) return null;
    return Math.round(((price - discountedPrice) / price) * 100);
  };

  // CSV Export function
  const handleExport = () => {
    if (!labTests || labTests.length === 0) {
      toast.error("No data to export");
      return;
    }

    const csvHeader = "lab_name,test_name,price,discounted_price,is_available\n";
    const csvRows = labTests.map((lt) => {
      const labName = lt.labs?.name || "";
      const testName = lt.tests?.name || "";
      const price = lt.price;
      const discountedPrice = lt.discounted_price || "";
      const isAvailable = lt.is_available ? "true" : "false";
      return `"${labName}","${testName}",${price},${discountedPrice},${isAvailable}`;
    }).join("\n");

    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lab_test_pricing_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  // Download template function
  const handleDownloadTemplate = () => {
    const csvHeader = "lab_name,test_name,price,discounted_price,is_available\n";
    const exampleRow = '"Example Lab","Blood Test",500,450,true';
    const csvContent = csvHeader + exampleRow;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lab_test_pricing_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  // Parse CSV function
  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];

    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      if (values.length >= 3) {
        rows.push({
          lab_name: values[0] || "",
          test_name: values[1] || "",
          price: values[2] || "",
          discounted_price: values[3] || "",
          is_available: values[4] || "true",
        });
      }
    }
    return rows;
  };

  // CSV Import function
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!labs || !tests) {
      toast.error("Labs and tests data not loaded yet");
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCSV(text);

        if (rows.length === 0) {
          toast.error("No valid data found in CSV");
          setIsImporting(false);
          return;
        }

        const labMap = new Map(labs.map((l) => [l.name.toLowerCase(), l.id]));
        const testMap = new Map(tests.map((t) => [t.name.toLowerCase(), t.id]));

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const row of rows) {
          const labId = labMap.get(row.lab_name.toLowerCase());
          const testId = testMap.get(row.test_name.toLowerCase());

          if (!labId) {
            errors.push(`Lab not found: ${row.lab_name}`);
            errorCount++;
            continue;
          }
          if (!testId) {
            errors.push(`Test not found: ${row.test_name}`);
            errorCount++;
            continue;
          }

          const price = parseFloat(row.price);
          if (isNaN(price) || price < 0) {
            errors.push(`Invalid price for ${row.lab_name} - ${row.test_name}`);
            errorCount++;
            continue;
          }

          const discountedPrice = row.discounted_price ? parseFloat(row.discounted_price) : null;
          const isAvailable = row.is_available.toLowerCase() !== "false";

          // Upsert: check if exists, then update or insert
          const { data: existing } = await supabase
            .from("lab_tests")
            .select("id")
            .eq("lab_id", labId)
            .eq("test_id", testId)
            .maybeSingle();

          if (existing) {
            const { error } = await supabase
              .from("lab_tests")
              .update({
                price,
                discounted_price: discountedPrice,
                is_available: isAvailable,
              })
              .eq("id", existing.id);

            if (error) {
              errors.push(`Failed to update ${row.lab_name} - ${row.test_name}: ${error.message}`);
              errorCount++;
            } else {
              successCount++;
            }
          } else {
            const { error } = await supabase.from("lab_tests").insert({
              lab_id: labId,
              test_id: testId,
              price,
              discounted_price: discountedPrice,
              is_available: isAvailable,
            });

            if (error) {
              errors.push(`Failed to add ${row.lab_name} - ${row.test_name}: ${error.message}`);
              errorCount++;
            } else {
              successCount++;
            }
          }
        }

        queryClient.invalidateQueries({ queryKey: ["admin-lab-tests"] });

        if (successCount > 0 && errorCount === 0) {
          toast.success(`Successfully imported ${successCount} pricing entries`);
        } else if (successCount > 0 && errorCount > 0) {
          toast.warning(`Imported ${successCount} entries, ${errorCount} failed`);
          console.error("Import errors:", errors);
        } else {
          toast.error(`Import failed: ${errors.slice(0, 3).join(", ")}`);
        }
      } catch (error) {
        toast.error("Failed to parse CSV file");
        console.error(error);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.readAsText(file);
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Lab Test Pricing</h1>
            <p className="text-muted-foreground">
              Manage test prices for each laboratory
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={!labTests?.length}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? "Importing..." : "Import CSV"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pricing
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingLabTest ? "Edit Lab Test Pricing" : "Add Lab Test Pricing"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lab_id">Laboratory *</Label>
                  <Select
                    value={formData.lab_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, lab_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lab" />
                    </SelectTrigger>
                    <SelectContent>
                      {labs?.map((lab) => (
                        <SelectItem key={lab.id} value={lab.id}>
                          {lab.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test_id">Test *</Label>
                  <Select
                    value={formData.test_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, test_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a test" />
                    </SelectTrigger>
                    <SelectContent>
                      {tests?.map((test) => (
                        <SelectItem key={test.id} value={test.id}>
                          {test.name} {test.category && `(${test.category})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discounted_price">Discounted Price (₹)</Label>
                    <Input
                      id="discounted_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.discounted_price}
                      onChange={(e) =>
                        setFormData({ ...formData, discounted_price: e.target.value })
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_available: checked })
                    }
                  />
                  <Label htmlFor="is_available">Available for booking</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingLabTest ? "Update" : "Add"} Pricing
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by lab or test name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterLabId} onValueChange={setFilterLabId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by lab" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Labs</SelectItem>
                {labs?.map((lab) => (
                  <SelectItem key={lab.id} value={lab.id}>
                    {lab.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Laboratory</TableHead>
                <TableHead>Test</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Discounted</TableHead>
                <TableHead className="text-center">Discount %</TableHead>
                <TableHead className="text-center">Available</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredLabTests?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No lab test pricing found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLabTests?.map((labTest) => {
                  const discount = calculateDiscount(labTest.price, labTest.discounted_price);
                  return (
                    <TableRow key={labTest.id}>
                      <TableCell className="font-medium">
                        {labTest.labs?.name || "Unknown Lab"}
                      </TableCell>
                      <TableCell>{labTest.tests?.name || "Unknown Test"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {labTest.tests?.category || "-"}
                      </TableCell>
                      <TableCell className="text-right">₹{labTest.price}</TableCell>
                      <TableCell className="text-right">
                        {labTest.discounted_price ? (
                          <span className="text-green-600">₹{labTest.discounted_price}</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {discount ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                            {discount}% OFF
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={labTest.is_available}
                          onCheckedChange={(checked) =>
                            toggleAvailabilityMutation.mutate({
                              id: labTest.id,
                              is_available: checked,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(labTest)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(labTest.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default LabTests;
