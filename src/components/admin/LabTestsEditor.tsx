import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Edit3, 
  Loader2, 
  Save, 
  Trash2, 
  Search, 
  X,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface LabTestsEditorProps {
  labId: string;
  labName: string;
  onSuccess: () => void;
}

interface LabTest {
  id: string;
  test_id: string;
  test_name: string;
  price: number;
  discounted_price: number | null;
  discount_percentage: number;
  is_available: boolean;
  isDirty?: boolean;
}

const LabTestsEditor = ({ labId, labName, onSuccess }: LabTestsEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  const fetchLabTests = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("lab_tests")
        .select(`
          id,
          test_id,
          price,
          discounted_price,
          is_available,
          tests!inner(name)
        `)
        .eq("lab_id", labId)
        .order("tests(name)");

      if (error) throw error;

      const formattedTests: LabTest[] = (data || []).map((item: any) => {
        const price = Number(item.price) || 0;
        const discounted_price = item.discounted_price ? Number(item.discounted_price) : null;
        const discount_percentage = discounted_price && price > 0 
          ? Math.round(((price - discounted_price) / price) * 100) 
          : 0;

        return {
          id: item.id,
          test_id: item.test_id,
          test_name: item.tests?.name || "Unknown",
          price,
          discounted_price,
          discount_percentage,
          is_available: item.is_available ?? true,
          isDirty: false
        };
      });

      setTests(formattedTests);
      setHasChanges(false);
      setSelectedTests(new Set());
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch tests");
    } finally {
      setIsLoading(false);
    }
  }, [labId]);

  useEffect(() => {
    if (isOpen) {
      fetchLabTests();
    }
  }, [isOpen, fetchLabTests]);

  const updateTest = (id: string, field: keyof LabTest, value: any) => {
    setTests(prev => prev.map(test => {
      if (test.id !== id) return test;

      const updated = { ...test, [field]: value, isDirty: true };

      // Auto-calculate discounted price when price or discount changes
      if (field === "price" || field === "discount_percentage") {
        const price = field === "price" ? Number(value) : test.price;
        const discount = field === "discount_percentage" ? Number(value) : test.discount_percentage;
        
        if (price > 0 && discount >= 0) {
          updated.discounted_price = Math.round(price - (price * discount / 100));
        }
        if (field === "price") {
          updated.price = Number(value) || 0;
        }
        if (field === "discount_percentage") {
          updated.discount_percentage = Math.max(0, Math.min(100, Number(value) || 0));
        }
      }

      return updated;
    }));
    setHasChanges(true);
  };

  const saveChanges = async () => {
    const dirtyTests = tests.filter(t => t.isDirty);
    if (dirtyTests.length === 0) {
      toast.info("No changes to save");
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const test of dirtyTests) {
        const { error } = await supabase
          .from("lab_tests")
          .update({
            price: test.price,
            discounted_price: test.discounted_price,
            is_available: test.is_available
          })
          .eq("id", test.id);

        if (error) {
          errorCount++;
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Updated ${successCount} tests`);
        await fetchLabTests();
        onSuccess();
      }
      if (errorCount > 0) {
        toast.error(`Failed to update ${errorCount} tests`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSelectedTests = async () => {
    if (selectedTests.size === 0) return;

    const confirmed = window.confirm(`Delete ${selectedTests.size} selected tests from ${labName}?`);
    if (!confirmed) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("lab_tests")
        .delete()
        .in("id", Array.from(selectedTests));

      if (error) throw error;

      toast.success(`Deleted ${selectedTests.size} tests`);
      await fetchLabTests();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete tests");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedTests.size === filteredTests.length) {
      setSelectedTests(new Set());
    } else {
      setSelectedTests(new Set(filteredTests.map(t => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedTests);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTests(newSelected);
  };

  const filteredTests = tests.filter(test =>
    test.test_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const dirtyCount = tests.filter(t => t.isDirty).length;
  const noPriceCount = tests.filter(t => !t.price || t.price === 0).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit3 className="w-4 h-4 mr-2" />
          Edit Prices
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Tests for {labName}
            <Badge variant="secondary">{tests.length} tests</Badge>
            {noPriceCount > 0 && (
              <Badge variant="destructive">{noPriceCount} need pricing</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {selectedTests.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelectedTests}
                disabled={isSaving}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete ({selectedTests.size})
              </Button>
            )}

            <Button
              onClick={saveChanges}
              disabled={isSaving || !hasChanges}
              className="ml-auto"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes {dirtyCount > 0 && `(${dirtyCount})`}
            </Button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No tests found for this lab</p>
              <p className="text-sm">Import tests using the "Import Tests" button</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedTests.size === filteredTests.length && filteredTests.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Test Name</TableHead>
                    <TableHead className="w-[120px]">Original Price</TableHead>
                    <TableHead className="w-[100px]">Discount %</TableHead>
                    <TableHead className="w-[120px]">Final Price</TableHead>
                    <TableHead className="w-[80px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTests.map((test) => (
                    <TableRow 
                      key={test.id}
                      className={test.isDirty ? "bg-amber-50 dark:bg-amber-950/20" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedTests.has(test.id)}
                          onCheckedChange={() => toggleSelect(test.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {test.test_name}
                          {test.isDirty && (
                            <Badge variant="outline" className="text-xs">Modified</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={test.price || ""}
                          onChange={(e) => updateTest(test.id, "price", e.target.value)}
                          className={`w-full ${!test.price || test.price === 0 ? 'border-destructive' : ''}`}
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={test.discount_percentage || ""}
                          onChange={(e) => updateTest(test.id, "discount_percentage", e.target.value)}
                          className="w-full"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        <div className={`font-semibold ${test.discounted_price && test.discounted_price < test.price ? 'text-green-600' : ''}`}>
                          Rs. {test.discounted_price || test.price || 0}
                        </div>
                        {test.discount_percentage > 0 && (
                          <div className="text-xs text-muted-foreground line-through">
                            Rs. {test.price}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {test.price > 0 ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}

          {/* Footer info */}
          {tests.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {filteredTests.length} of {tests.length} tests
              </span>
              <span>
                Tip: Changes are highlighted in yellow. Click "Save Changes" to apply.
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabTestsEditor;
