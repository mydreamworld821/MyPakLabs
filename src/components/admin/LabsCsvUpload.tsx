import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Download, FileText, Loader2, CheckCircle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LabsCsvUploadProps {
  onSuccess: () => void;
}

interface ImportResult {
  success: boolean;
  name: string;
  error?: string;
}

const LabsCsvUpload = ({ onSuccess }: LabsCsvUploadProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = ["name", "slug", "description", "logo_url", "cover_image_url", "discount_percentage", "cities", "is_active"];
    const exampleRow = ["Chughtai Lab", "chughtai-lab", "Leading diagnostic laboratory", "https://example.com/logo.png", "https://example.com/cover.png", "20", "Lahore, Karachi, Islamabad", "true"];
    
    const csvContent = [
      headers.join(","),
      exampleRow.join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "labs_template.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      
      rows.push(row);
    }

    return rows;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setIsUploading(true);
    setResults([]);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        toast.error("No data found in CSV file");
        setIsUploading(false);
        return;
      }

      const importResults: ImportResult[] = [];

      for (const row of rows) {
        if (!row.name || !row.slug) {
          importResults.push({
            success: false,
            name: row.name || "Unknown",
            error: "Name and slug are required"
          });
          continue;
        }

        try {
          const labData = {
            name: row.name,
            slug: row.slug,
            description: row.description || null,
            logo_url: row.logo_url || null,
            cover_image_url: row.cover_image_url || null,
            discount_percentage: row.discount_percentage ? Number(row.discount_percentage) : 0,
            cities: row.cities ? row.cities.split("|").map(c => c.trim()).filter(Boolean) : null,
            is_active: row.is_active?.toLowerCase() !== "false"
          };

          const { error } = await supabase.from("labs").insert(labData);

          if (error) {
            importResults.push({
              success: false,
              name: row.name,
              error: error.message
            });
          } else {
            importResults.push({
              success: true,
              name: row.name
            });
          }
        } catch (err: any) {
          importResults.push({
            success: false,
            name: row.name,
            error: err.message
          });
        }
      }

      setResults(importResults);
      
      const successCount = importResults.filter(r => r.success).length;
      const failCount = importResults.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`Imported ${successCount} lab(s) successfully`);
        onSuccess();
      }
      if (failCount > 0) {
        toast.error(`Failed to import ${failCount} lab(s)`);
      }
    } catch (error) {
      console.error("Error parsing CSV:", error);
      toast.error("Failed to parse CSV file");
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
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Upload Labs</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Instructions */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              CSV Format
            </h4>
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with the following columns:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li><strong>name</strong> - Lab name (required)</li>
              <li><strong>slug</strong> - URL-friendly identifier (required)</li>
              <li><strong>description</strong> - Lab description</li>
              <li><strong>logo_url</strong> - Logo image URL</li>
              <li><strong>cover_image_url</strong> - Cover image URL</li>
              <li><strong>discount_percentage</strong> - Discount (0-100)</li>
              <li><strong>cities</strong> - Cities separated by | (pipe)</li>
              <li><strong>is_active</strong> - true/false</li>
            </ul>
          </div>

          {/* Download Template */}
          <Button variant="secondary" className="w-full" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>

          {/* Upload Button */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <Button
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV File
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Import Results</h4>
              <ScrollArea className="h-48 rounded-lg border p-2">
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2 p-2 rounded text-sm ${
                        result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">{result.name}</p>
                        {result.error && (
                          <p className="text-xs opacity-80">{result.error}</p>
                        )}
                      </div>
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

export default LabsCsvUpload;
