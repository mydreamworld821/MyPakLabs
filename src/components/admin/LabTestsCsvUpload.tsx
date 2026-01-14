import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Download, Loader2, FileSpreadsheet, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as XLSX from "xlsx";

interface LabTestsCsvUploadProps {
  labId: string;
  labName: string;
  onSuccess: () => void;
}

interface TestRow {
  test_name: string;
  original_price: number;
  discount_percentage: number;
  discounted_price: number;
}

interface ImportResult {
  success: boolean;
  test_name: string;
  message: string;
}

const LabTestsCsvUpload = ({ labId, labName, onSuccess }: LabTestsCsvUploadProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = async () => {
    // Fetch all available tests
    const { data: tests, error } = await supabase
      .from("tests")
      .select("name")
      .eq("is_active", true)
      .order("name");

    if (error) {
      toast.error("Failed to fetch tests");
      return;
    }

    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    
    // Create data with headers
    const data = [
      ["test_name", "original_price", "discount_%"],
      ...(tests?.map(test => [test.name, 0, 0]) || [])
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
    
    toast.success("Excel template downloaded with all available tests");
  };

  const parseExcel = (data: ArrayBuffer): TestRow[] => {
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);
    
    // Use Map to automatically handle duplicates (last occurrence wins)
    const uniqueTests = new Map<string, TestRow>();
    
    jsonData.forEach(row => {
      // Support various column name formats
      const test_name = (row["test_name"] || row["Test Name"] || row["test name"] || "").toString().trim();
      const original_price = parseFloat(row["original_price"] || row["Original Price"] || row["price"] || 0) || 0;
      const discount_percentage = parseFloat(row["discount_%"] || row["discount"] || row["Discount"] || row["discount_percentage"] || 0) || 0;
      
      if (!test_name || original_price <= 0) return;
      
      // Auto-calculate discounted price
      const discounted_price = Math.round(original_price - (original_price * discount_percentage / 100));
      
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setResults([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const rows = parseExcel(arrayBuffer);

      if (rows.length === 0) {
        toast.error("No valid data found. Ensure columns: test_name, original_price, discount_%");
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

      for (const row of rows) {
        const testId = testNameToId.get(row.test_name.toLowerCase());
        
        if (!testId) {
          importResults.push({
            success: false,
            test_name: row.test_name,
            message: "Test not found in system"
          });
          continue;
        }

        const labTestData = {
          lab_id: labId,
          test_id: testId,
          price: row.original_price,
          discounted_price: row.discounted_price,
          is_available: true
        };

        const existingId = existingTestMap.get(testId);
        
        if (existingId) {
          toUpdate.push({ id: existingId, data: labTestData });
          importResults.push({
            success: true,
            test_name: row.test_name,
            message: `Updated (Rs.${row.discounted_price})`
          });
        } else {
          toInsert.push(labTestData);
          importResults.push({
            success: true,
            test_name: row.test_name,
            message: `Added (Rs.${row.discounted_price})`
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
      const duplicatesRemoved = rows.length;
      
      if (successCount > 0) {
        toast.success(`Imported ${successCount} tests (duplicates auto-merged)`);
        onSuccess();
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Excel Format (.xlsx)
            </h4>
            <div className="bg-background border rounded-md p-3 font-mono text-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="text-left p-1">test_name</th>
                    <th className="text-left p-1">original_price</th>
                    <th className="text-left p-1">discount_%</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-1">CBC</td><td className="p-1">500</td><td className="p-1">20</td></tr>
                  <tr><td className="p-1">Thyroid Panel</td><td className="p-1">1200</td><td className="p-1">15</td></tr>
                  <tr><td className="p-1">Lipid Profile</td><td className="p-1">800</td><td className="p-1">25</td></tr>
                </tbody>
              </table>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>✓ Discounted price is <strong>auto-calculated</strong></p>
              <p>✓ Duplicate test names are <strong>auto-removed</strong></p>
              <p>✓ Existing tests will be <strong>merged/updated</strong></p>
              <p>✓ Only tests with price &gt; 0 will be imported</p>
            </div>
          </div>

          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download Excel Template (with all tests)
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
