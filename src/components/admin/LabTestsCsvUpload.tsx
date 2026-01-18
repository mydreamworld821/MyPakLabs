import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Download, Loader2, FileSpreadsheet, CheckCircle2, XCircle, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as XLSX from "xlsx";

interface LabTestsCsvUploadProps {
  labId: string;
  labName: string;
  onSuccess: () => void;
}

interface TestRow {
  test_name: string;
  original_price: number | null;
  discount_percentage: number | null;
  discounted_price: number | null;
}

interface ImportResult {
  success: boolean;
  test_name: string;
  message: string;
}

const LabTestsCsvUpload = ({ labId, labName, onSuccess }: LabTestsCsvUploadProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [existingTestCount, setExistingTestCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing test count when dialog opens
  const handleDialogOpen = async (open: boolean) => {
    setIsOpen(open);
    if (open) {
      const { count } = await supabase
        .from("lab_tests")
        .select("*", { count: "exact", head: true })
        .eq("lab_id", labId);
      setExistingTestCount(count || 0);
    }
  };

  const downloadTemplate = async () => {
    // Fetch ONLY tests that are already configured for THIS lab
    const { data: labTests, error } = await supabase
      .from("lab_tests")
      .select(`
        price,
        discounted_price,
        tests:test_id (name)
      `)
      .eq("lab_id", labId)
      .eq("is_available", true);

    if (error) {
      toast.error("Failed to fetch lab tests");
      return;
    }

    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    
    // Create data with headers - pre-fill with existing lab tests
    const data = [
      ["test_name", "original_price", "discount_%"],
      ...(labTests?.map((lt: any) => {
        const price = lt.price || "";
        const discountedPrice = lt.discounted_price || "";
        // Calculate discount % if both prices exist
        let discountPct = "";
        if (price && discountedPrice && price > 0) {
          discountPct = Math.round(((price - discountedPrice) / price) * 100).toString();
        }
        return [lt.tests?.name || "", price, discountPct];
      }) || [])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    ws["!cols"] = [
      { wch: 40 }, // test_name
      { wch: 15 }, // original_price
      { wch: 12 }  // discount_%
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, "Tests");
    
    // Download the file
    XLSX.writeFile(wb, `${labName.toLowerCase().replace(/\s+/g, "-")}-tests-template.xlsx`);
    
    const testCount = labTests?.length || 0;
    toast.success(testCount > 0 
      ? `Template downloaded with ${testCount} existing tests for ${labName}` 
      : `Empty template downloaded - add tests for ${labName}`
    );
  };

  // Helper function to parse price values with comma formatting (e.g., "1,500" -> 1500)
  const parsePrice = (value: any): number | null => {
    if (value === "" || value === null || value === undefined) return null;
    // Convert to string, remove commas and spaces, then parse
    const cleanValue = String(value).replace(/,/g, '').replace(/\s/g, '').trim();
    if (cleanValue === "") return null;
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? null : parsed;
  };

  const parseExcel = (data: ArrayBuffer): TestRow[] => {
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);
    
    // Use Map to automatically handle duplicates (last occurrence wins)
    const uniqueTests = new Map<string, TestRow>();
    
    jsonData.forEach(row => {
      // Support various column name formats - FLEXIBLE: only test_name is required
      const test_name = (
        row["test_name"] || 
        row["Test Name"] || 
        row["test name"] || 
        row["Test_Name"] || 
        row["name"] || 
        row["Name"] ||
        row["TEST NAME"] ||
        row["TEST_NAME"] ||
        ""
      ).toString().trim();
      
      // Parse price - allow empty/0, handle comma-formatted numbers
      const priceValue = row["original_price"] || row["Original Price"] || row["price"] || row["Price"] || row["PRICE"] || row["original price"] || "";
      const original_price = parsePrice(priceValue);
      
      // Parse discount - allow empty/0
      const discountValue = row["discount_%"] || row["discount"] || row["Discount"] || row["DISCOUNT"] || row["discount_percentage"] || row["Discount %"] || row["discount %"] || "";
      const discount_percentage = discountValue === "" ? null : (parseFloat(String(discountValue).replace(/,/g, '')) || 0);
      
      // Skip if no test name
      if (!test_name) return;
      
      // Auto-calculate discounted price only if we have price and discount
      let discounted_price: number | null = null;
      if (original_price !== null && original_price > 0) {
        if (discount_percentage !== null && discount_percentage > 0) {
          discounted_price = Math.round(original_price - (original_price * discount_percentage / 100));
        } else {
          discounted_price = original_price; // No discount = same as original
        }
      }
      
      // Use lowercase name as key to handle case-insensitive duplicates
      uniqueTests.set(test_name.toLowerCase(), {
        test_name,
        original_price,
        discount_percentage,
        discounted_price
      });
    });
    
    return Array.from(uniqueTests.values());
  };

  const deleteAllLabTests = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("lab_tests")
        .delete()
        .eq("lab_id", labId);

      if (error) throw error;

      toast.success(`All ${existingTestCount} tests deleted from ${labName}`);
      setExistingTestCount(0);
      setResults([]);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete tests");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setResults([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const rows = parseExcel(arrayBuffer);

      if (rows.length === 0) {
        toast.error("No valid test names found in the file");
        setIsUploading(false);
        return;
      }

      // Fetch all tests to map names to IDs
      const { data: allTests, error: testsError } = await supabase
        .from("tests")
        .select("id, name")
        .eq("is_active", true);

      if (testsError) throw testsError;

      const testNameToId = new Map(
        allTests?.map(t => [t.name.toLowerCase(), t.id]) || []
      );

      // Fetch existing lab tests in one query
      const { data: existingLabTests } = await supabase
        .from("lab_tests")
        .select("id, test_id")
        .eq("lab_id", labId);

      const existingTestMap = new Map(
        existingLabTests?.map(lt => [lt.test_id, lt.id]) || []
      );

      const importResults: ImportResult[] = [];
      const toInsert: any[] = [];
      const toUpdate: { id: string; data: any }[] = [];
      
      // First, create any missing tests in the system
      const missingTests: string[] = [];
      for (const row of rows) {
        if (!testNameToId.has(row.test_name.toLowerCase())) {
          missingTests.push(row.test_name);
        }
      }

      // Batch create missing tests
      if (missingTests.length > 0) {
        const testsToCreate = missingTests.map(name => ({
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          is_active: true
        }));

        const { data: createdTests, error: createError } = await supabase
          .from("tests")
          .insert(testsToCreate)
          .select("id, name");

        if (createError) {
          console.error("Error creating tests:", createError);
          // Try inserting one by one for tests with unique slug conflicts
          for (const testData of testsToCreate) {
            try {
              // Generate a unique slug with timestamp
              const uniqueSlug = `${testData.slug}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
              const { data: singleTest, error: singleError } = await supabase
                .from("tests")
                .insert({ ...testData, slug: uniqueSlug })
                .select("id, name")
                .single();
              
              if (singleTest) {
                testNameToId.set(singleTest.name.toLowerCase(), singleTest.id);
              }
            } catch (e) {
              console.error("Failed to create test:", testData.name, e);
            }
          }
        } else if (createdTests) {
          // Add newly created tests to our map
          createdTests.forEach(t => {
            testNameToId.set(t.name.toLowerCase(), t.id);
          });
        }
      }

      for (const row of rows) {
        let testId = testNameToId.get(row.test_name.toLowerCase());
        
        if (!testId) {
          importResults.push({
            success: false,
            test_name: row.test_name,
            message: "Failed to create test in system"
          });
          continue;
        }

        // Build lab test data - flexible fields
        const labTestData: any = {
          lab_id: labId,
          test_id: testId,
          is_available: true
        };

        // Only set price if provided
        if (row.original_price !== null) {
          labTestData.price = row.original_price;
        }

        // Only set discounted_price if calculated
        if (row.discounted_price !== null) {
          labTestData.discounted_price = row.discounted_price;
        }

        const existingId = existingTestMap.get(testId);
        
        if (existingId) {
          toUpdate.push({ id: existingId, data: labTestData });
          const priceInfo = row.discounted_price ? `Rs.${row.discounted_price}` : "price pending";
          importResults.push({
            success: true,
            test_name: row.test_name,
            message: `Updated (${priceInfo})`
          });
        } else {
          // For new inserts, we need a default price if not provided
          if (labTestData.price === undefined) {
            labTestData.price = 0; // Default price, user can update later
          }
          toInsert.push(labTestData);
          const priceInfo = row.discounted_price ? `Rs.${row.discounted_price}` : "price pending";
          importResults.push({
            success: true,
            test_name: row.test_name,
            message: `Added (${priceInfo})`
          });
        }
      }

      // Batch insert new tests
      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("lab_tests")
          .insert(toInsert);
        
        if (insertError) {
          // Mark insert results as failed
          importResults.forEach(r => {
            if (r.message.startsWith("Added")) {
              r.success = false;
              r.message = insertError.message;
            }
          });
        }
      }

      // Batch update existing tests
      for (const item of toUpdate) {
        const { error: updateError } = await supabase
          .from("lab_tests")
          .update(item.data)
          .eq("id", item.id);
        
        if (updateError) {
          const result = importResults.find(r => r.message.includes("Updated") && r.test_name === item.data.test_name);
          if (result) {
            result.success = false;
            result.message = updateError.message;
          }
        }
      }

      setResults(importResults);
      
      const successCount = importResults.filter(r => r.success).length;
      const failedCount = importResults.filter(r => !r.success).length;
      
      if (successCount > 0) {
        toast.success(`Imported ${successCount} tests successfully${failedCount > 0 ? `, ${failedCount} failed` : ""}`);
        onSuccess();
        
        // Update existing count
        const { count } = await supabase
          .from("lab_tests")
          .select("*", { count: "exact", head: true })
          .eq("lab_id", labId);
        setExistingTestCount(count || 0);
      } else {
        toast.error("No tests were imported");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process Excel file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Import Tests
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Tests for {labName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Existing tests info & delete option */}
          {existingTestCount > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {existingTestCount} tests already exist
                  </span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete All
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete all tests for {labName}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {existingTestCount} tests from this lab. 
                        You can then upload a fresh file. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAllLabTests} className="bg-destructive text-destructive-foreground">
                        Yes, Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                Uploading will merge with existing tests. Delete all first for a fresh start.
              </p>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Excel Format (.xlsx)
            </h4>
            <div className="bg-background border rounded-md p-3 font-mono text-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="text-left p-1">test_name *</th>
                    <th className="text-left p-1">original_price</th>
                    <th className="text-left p-1">discount_%</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-1">CBC</td><td className="p-1">500</td><td className="p-1">20</td></tr>
                  <tr><td className="p-1">Thyroid Panel</td><td className="p-1">1200</td><td className="p-1"></td></tr>
                  <tr><td className="p-1">Lipid Profile</td><td className="p-1"></td><td className="p-1"></td></tr>
                </tbody>
              </table>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>✓ Only <strong>test_name is required</strong></p>
              <p>✓ Price &amp; discount are <strong>optional</strong> (add later manually)</p>
              <p>✓ Discounted price is <strong>auto-calculated</strong></p>
              <p>✓ Duplicate test names are <strong>auto-removed</strong></p>
              <p>✓ Existing tests will be <strong>merged/updated</strong></p>
              <p>✓ Template shows only <strong>this lab's tests</strong></p>
            </div>
          </div>

          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download Template ({existingTestCount} tests)
          </Button>

          <div className="relative">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="cursor-pointer"
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
          </div>

          {results.length > 0 && (
            <div className="border rounded-lg">
              <div className="p-3 border-b bg-muted/30">
                <p className="text-sm font-medium">
                  Results: {results.filter(r => r.success).length} success, {results.filter(r => !r.success).length} failed
                </p>
              </div>
              <ScrollArea className="h-48">
                <div className="p-2 space-y-1">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                        result.success ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="truncate">{result.test_name}</span>
                      <span className="text-xs ml-auto">{result.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabTestsCsvUpload;
