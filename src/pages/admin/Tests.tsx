import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Search, TestTube, Loader2 } from "lucide-react";

interface Test {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  sample_type: string | null;
  turnaround_time: string | null;
  is_active: boolean | null;
  created_at: string;
}

const AdminTests = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    sample_type: "",
    turnaround_time: "",
    is_active: true
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from("tests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast.error("Failed to fetch tests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (test?: Test) => {
    if (test) {
      setEditingTest(test);
      setFormData({
        name: test.name,
        slug: test.slug,
        description: test.description || "",
        category: test.category || "",
        sample_type: test.sample_type || "",
        turnaround_time: test.turnaround_time || "",
        is_active: test.is_active ?? true
      });
    } else {
      setEditingTest(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        category: "",
        sample_type: "",
        turnaround_time: "",
        is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error("Name and slug are required");
      return;
    }

    setIsSaving(true);

    try {
      const testData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        category: formData.category || null,
        sample_type: formData.sample_type || null,
        turnaround_time: formData.turnaround_time || null,
        is_active: formData.is_active
      };

      if (editingTest) {
        const { error } = await supabase
          .from("tests")
          .update(testData)
          .eq("id", editingTest.id);

        if (error) throw error;
        toast.success("Test updated successfully");
      } else {
        const { error } = await supabase
          .from("tests")
          .insert(testData);

        if (error) throw error;
        toast.success("Test created successfully");
      }

      setIsDialogOpen(false);
      fetchTests();
    } catch (error: any) {
      console.error("Error saving test:", error);
      toast.error(error.message || "Failed to save test");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this test?")) return;

    try {
      const { error } = await supabase
        .from("tests")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Test deleted successfully");
      fetchTests();
    } catch (error) {
      console.error("Error deleting test:", error);
      toast.error("Failed to delete test");
    }
  };

  const filteredTests = tests.filter(test =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Tests</h1>
            <p className="text-muted-foreground mt-1">
              Manage diagnostic tests catalog
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTest ? "Edit Test" : "Add New Test"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Test Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Complete Blood Count (CBC)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="complete-blood-count"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Test description..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Hematology"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sample_type">Sample Type</Label>
                  <Input
                    id="sample_type"
                    value={formData.sample_type}
                    onChange={(e) => setFormData({ ...formData, sample_type: e.target.value })}
                    placeholder="Blood"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="turnaround_time">Turnaround Time</Label>
                  <Input
                    id="turnaround_time"
                    value={formData.turnaround_time}
                    onChange={(e) => setFormData({ ...formData, turnaround_time: e.target.value })}
                    placeholder="24 hours"
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
                      "Save Test"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tests Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <TestTube className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Sample</TableHead>
                      <TableHead>TAT</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{test.name}</p>
                            <p className="text-sm text-muted-foreground">{test.slug}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{test.category || "—"}</Badge>
                        </TableCell>
                        <TableCell>{test.sample_type || "—"}</TableCell>
                        <TableCell>{test.turnaround_time || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={test.is_active ? "default" : "secondary"}>
                            {test.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(test)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(test.id)}
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

export default AdminTests;
