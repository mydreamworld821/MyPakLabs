import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Download, Loader2, FileText, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LabTestsCsvUploadProps {
  labId: string;
  labName: string;
  onSuccess: () => void;
}

interface TestRow {
  test_name: string;
  price: number;
  discounted_price?: number;
  is_available: boolean;
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
      .select("name, slug")
      .eq("is_active", true)
      .order("name");

    if (error) {
      toast.error("Failed to fetch tests");
      return;
    }

    const headers = ["test_name", "price", "discounted_price", "is_available"];
    const rows = tests?.map(test => [test.name, "0", "", "true"]) || [];
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${labName.toLowerCase().replace(/\s+/g, "-")}-tests-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Template downloaded with all available tests");
  };

  const parseCSV = (text: string): TestRow[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const testNameIndex = headers.findIndex(h => h === "test_name");
    const priceIndex = headers.findIndex(h => h === "price");
    const discountedPriceIndex = headers.findIndex(h => h === "discounted_price");
    const isAvailableIndex = headers.findIndex(h => h === "is_available");

    if (testNameIndex === -1 || priceIndex === -1) {
      throw new Error("CSV must have 'test_name' and 'price' columns");
    }

    return lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim());
      const price = parseFloat(values[priceIndex]) || 0;
      const discountedPriceValue = discountedPriceIndex >= 0 ? values[discountedPriceIndex] : "";
      
      return {
        test_name: values[testNameIndex],
        price,
        discounted_price: discountedPriceValue ? parseFloat(discountedPriceValue) : undefined,
        is_available: isAvailableIndex >= 0 ? values[isAvailableIndex].toLowerCase() !== "false" : true
      };
    }).filter(row => row.test_name && row.price > 0);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setResults([]);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        toast.error("No valid data found in CSV. Ensure price > 0 for tests to import.");
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

      const importResults: ImportResult[] = [];

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

        // Check if entry already exists
        const { data: existing } = await supabase
          .from("lab_tests")
          .select("id")
          .eq("lab_id", labId)
          .eq("test_id", testId)
          .single();

        const labTestData = {
          lab_id: labId,
          test_id: testId,
          price: row.price,
          discounted_price: row.discounted_price || null,
          is_available: row.is_available
        };

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from("lab_tests")
            .update(labTestData)
            .eq("id", existing.id);

          importResults.push({
            success: !error,
            test_name: row.test_name,
            message: error ? error.message : "Updated"
          });
        } else {
          // Insert new
          const { error } = await supabase
            .from("lab_tests")
            .insert(labTestData);

          importResults.push({
            success: !error,
            test_name: row.test_name,
            message: error ? error.message : "Added"
          });
        }
      }

      setResults(importResults);
      
      const successCount = importResults.filter(r => r.success).length;
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} tests`);
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process CSV");
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
              <FileText className="w-4 h-4" />
              CSV Format
            </h4>
            <p className="text-sm text-muted-foreground">
              Required columns: <code className="bg-muted px-1 rounded">test_name</code>, <code className="bg-muted px-1 rounded">price</code>
            </p>
            <p className="text-sm text-muted-foreground">
              Optional: <code className="bg-muted px-1 rounded">discounted_price</code>, <code className="bg-muted px-1 rounded">is_available</code>
            </p>
            <p className="text-sm text-muted-foreground">
              Only tests with price &gt; 0 will be imported. Test names must match existing tests exactly.
            </p>
          </div>

          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download Template (with all tests)
          </Button>

          <div className="relative">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
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
                        result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
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
