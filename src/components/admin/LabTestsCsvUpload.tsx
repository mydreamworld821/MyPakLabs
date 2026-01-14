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

    // Create TXT content with format: test_name, original_price, discount_%
    const header = "test_name, original_price, discount_%";
    const rows = tests?.map(test => `${test.name}, 0, 0`) || [];
    
    const txtContent = [header, ...rows].join("\n");

    const blob = new Blob([txtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${labName.toLowerCase().replace(/\s+/g, "-")}-tests-template.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Template downloaded with all available tests");
  };

  const parseTXT = (text: string): TestRow[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];

    // Skip header line
    return lines.slice(1).map(line => {
      // Split by comma and trim each value
      const parts = line.split(",").map(v => v.trim());
      
      if (parts.length < 3) {
        return null;
      }

      const test_name = parts[0];
      const original_price = parseFloat(parts[1]) || 0;
      const discount_percentage = parseFloat(parts[2]) || 0;
      
      // Auto-calculate discounted price
      const discounted_price = original_price - (original_price * discount_percentage / 100);
      
      return {
        test_name,
        original_price,
        discount_percentage,
        discounted_price: Math.round(discounted_price) // Round to whole number
      };
    }).filter((row): row is TestRow => row !== null && row.test_name && row.original_price > 0);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setResults([]);

    try {
      const text = await file.text();
      const rows = parseTXT(text);

      if (rows.length === 0) {
        toast.error("No valid data found. Format: test_name, original_price, discount_%");
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
          price: row.original_price,
          discounted_price: row.discounted_price,
          is_available: true
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
            message: error ? error.message : `Updated (Rs.${row.discounted_price})`
          });
        } else {
          // Insert new
          const { error } = await supabase
            .from("lab_tests")
            .insert(labTestData);

          importResults.push({
            success: !error,
            test_name: row.test_name,
            message: error ? error.message : `Added (Rs.${row.discounted_price})`
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
      toast.error(error.message || "Failed to process file");
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
              TXT Format (Simple)
            </h4>
            <div className="bg-background border rounded-md p-3 font-mono text-sm">
              <p className="text-muted-foreground">test_name, original_price, discount_%</p>
              <p className="mt-1">CBC, 500, 20</p>
              <p>Thyroid Panel, 1200, 15</p>
              <p>Lipid Profile, 800, 25</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>✓ Discounted price is <strong>auto-calculated</strong></p>
              <p>✓ Only tests with price &gt; 0 will be imported</p>
              <p>✓ Test names must match existing tests</p>
            </div>
          </div>

          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download Template (with all tests)
          </Button>

          <div className="relative">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".txt"
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
