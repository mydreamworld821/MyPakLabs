import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Copy, Check, FileSpreadsheet, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const ImportInstructions = () => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const { data: labs } = useQuery({
    queryKey: ["import-labs-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labs")
        .select("name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: tests } = useQuery({
    queryKey: ["import-tests-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tests")
        .select("name, category")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const copyToClipboard = (text: string, itemId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(itemId);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const exampleCSV = `lab_name,test_name,price,discounted_price,is_available
"${labs?.[0]?.name || "Aga Khan Lab"}","Complete Blood Count (CBC)",1500,1200,true
"${labs?.[1]?.name || "Chughtai Lab"}","Lipid Profile",2500,2000,true
"${labs?.[2]?.name || "Dr. Essa Lab"}","Vitamin D (25-OH)",3500,,true
"${labs?.[3]?.name || "Excel Labs"}","Thyroid Profile (T3 T4 TSH)",4000,3500,false`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="w-4 h-4 mr-2" />
          Import Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            CSV/Excel Import Guide
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[65vh] pr-4">
          <Accordion type="single" collapsible defaultValue="quick-start" className="w-full">
            {/* Quick Start */}
            <AccordionItem value="quick-start">
              <AccordionTrigger className="text-base font-semibold">
                🚀 Quick Start Guide
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <ol className="list-decimal list-inside space-y-2">
                  <li><strong>Download Template:</strong> Click "Template" button to get a pre-formatted CSV file</li>
                  <li><strong>Fill Data:</strong> Open in Excel/Google Sheets and add your pricing data</li>
                  <li><strong>Save as CSV:</strong> File → Save As → CSV (Comma delimited)</li>
                  <li><strong>Import:</strong> Click "Import CSV" and select your file</li>
                </ol>
                <div className="bg-muted p-3 rounded-lg mt-3">
                  <p className="text-muted-foreground">
                    <strong>💡 Tip:</strong> Existing entries will be updated, new ones will be added. Names must match exactly!
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* CSV Format */}
            <AccordionItem value="format">
              <AccordionTrigger className="text-base font-semibold">
                📋 CSV Format Reference
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-3 font-semibold">Column</th>
                        <th className="py-2 px-3 font-semibold">Required</th>
                        <th className="py-2 px-3 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-2 px-3"><code className="bg-muted px-1 rounded">lab_name</code></td>
                        <td className="py-2 px-3"><Badge>Required</Badge></td>
                        <td className="py-2 px-3">Exact lab name (see list below)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3"><code className="bg-muted px-1 rounded">test_name</code></td>
                        <td className="py-2 px-3"><Badge>Required</Badge></td>
                        <td className="py-2 px-3">Exact test name (see list below)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3"><code className="bg-muted px-1 rounded">price</code></td>
                        <td className="py-2 px-3"><Badge>Required</Badge></td>
                        <td className="py-2 px-3">Original price (number, e.g., 1500)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3"><code className="bg-muted px-1 rounded">discounted_price</code></td>
                        <td className="py-2 px-3"><Badge variant="secondary">Optional</Badge></td>
                        <td className="py-2 px-3">Discounted price (leave empty for no discount)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3"><code className="bg-muted px-1 rounded">is_available</code></td>
                        <td className="py-2 px-3"><Badge variant="secondary">Optional</Badge></td>
                        <td className="py-2 px-3">true/false (defaults to true)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <p className="font-medium mb-2">Example CSV:</p>
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{exampleCSV}</pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => copyToClipboard(exampleCSV, "example")}
                  >
                    {copiedItem === "example" ? (
                      <Check className="w-3 h-3 mr-1" />
                    ) : (
                      <Copy className="w-3 h-3 mr-1" />
                    )}
                    Copy Example
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Available Labs */}
            <AccordionItem value="labs">
              <AccordionTrigger className="text-base font-semibold">
                🏥 Available Labs ({labs?.length || 0})
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Use these exact names in your CSV file:
                </p>
                <div className="space-y-1">
                  {labs?.map((lab) => (
                    <div
                      key={lab.name}
                      className="flex items-center justify-between p-2 bg-muted rounded hover:bg-muted/80 group"
                    >
                      <span className="text-sm font-mono">{lab.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7"
                        onClick={() => copyToClipboard(lab.name, `lab-${lab.name}`)}
                      >
                        {copiedItem === `lab-${lab.name}` ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Available Tests */}
            <AccordionItem value="tests">
              <AccordionTrigger className="text-base font-semibold">
                🧪 Available Tests ({tests?.length || 0})
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Use these exact names in your CSV file:
                </p>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {tests?.map((test) => (
                    <div
                      key={test.name}
                      className="flex items-center justify-between p-2 bg-muted rounded hover:bg-muted/80 group"
                    >
                      <div>
                        <span className="text-sm font-mono">{test.name}</span>
                        {test.category && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {test.category}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7"
                        onClick={() => copyToClipboard(test.name, `test-${test.name}`)}
                      >
                        {copiedItem === `test-${test.name}` ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Excel Conversion */}
            <AccordionItem value="excel">
              <AccordionTrigger className="text-base font-semibold">
                📊 Excel to CSV Conversion
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-2">Microsoft Excel:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Open your Excel file</li>
                    <li>Go to File → Save As</li>
                    <li>Choose "CSV (Comma delimited) (*.csv)"</li>
                    <li>Click Save</li>
                  </ol>
                </div>
                <div>
                  <p className="font-medium mb-2">Google Sheets:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Open your spreadsheet</li>
                    <li>Go to File → Download</li>
                    <li>Select "Comma-separated values (.csv)"</li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Troubleshooting */}
            <AccordionItem value="troubleshooting">
              <AccordionTrigger className="text-base font-semibold">
                ⚠️ Troubleshooting
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Lab/Test not found</p>
                      <p className="text-muted-foreground">Names must match exactly (case-insensitive). Copy names from the lists above.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Invalid price</p>
                      <p className="text-muted-foreground">Price must be a positive number without currency symbols (e.g., 1500 not Rs.1500).</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">File not parsing</p>
                      <p className="text-muted-foreground">Ensure your file is saved as CSV, not Excel format (.xlsx). Check for special characters in names.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Partial import</p>
                      <p className="text-muted-foreground">Check browser console for detailed error messages about which rows failed.</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ImportInstructions;
