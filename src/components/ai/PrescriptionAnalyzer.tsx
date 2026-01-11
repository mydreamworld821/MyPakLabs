import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Pill, AlertCircle, CheckCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Medicine {
  name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
}

interface AnalysisResult {
  medicines: Medicine[];
  doctorName: string | null;
  patientName: string | null;
  date: string | null;
  notes: string | null;
  rawText?: string;
}

export function PrescriptionAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload and analyze
    await uploadAndAnalyze(file);
  };

  const uploadAndAnalyze = async (file: File) => {
    setIsUploading(true);
    setResult(null);

    try {
      // Upload to Supabase storage temporarily
      const fileName = `temp-analysis/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("prescriptions")
        .upload(fileName, file);

      if (uploadError) {
        throw new Error("Failed to upload image");
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("prescriptions")
        .getPublicUrl(fileName);

      setIsUploading(false);
      setIsAnalyzing(true);

      // Analyze the prescription
      const { data, error } = await supabase.functions.invoke("analyze-prescription", {
        body: { imageUrl: urlData.publicUrl },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setResult(data.data);
      toast.success("Prescription analyzed successfully!");

      // Clean up temporary file
      await supabase.storage.from("prescriptions").remove([fileName]);

    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze prescription");
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setPreviewUrl(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          AI Prescription Analyzer
        </CardTitle>
        <CardDescription>
          Upload a prescription image to extract medicine names, dosages, and instructions using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result ? (
          <>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Prescription preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  {(isUploading || isAnalyzing) && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isUploading ? "Uploading..." : "Analyzing prescription..."}</span>
                    </div>
                  )}
                </div>
              ) : (
                <Label htmlFor="prescription-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <span className="text-sm font-medium">Click to upload prescription</span>
                    <span className="text-xs text-muted-foreground">PNG, JPG up to 10MB</span>
                  </div>
                  <Input
                    id="prescription-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading || isAnalyzing}
                  />
                </Label>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {/* Analysis Result */}
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Analysis Complete</span>
            </div>

            {/* Prescription Info */}
            {(result.doctorName || result.patientName || result.date) && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                {result.doctorName && <p><strong>Doctor:</strong> {result.doctorName}</p>}
                {result.patientName && <p><strong>Patient:</strong> {result.patientName}</p>}
                {result.date && <p><strong>Date:</strong> {result.date}</p>}
              </div>
            )}

            {/* Medicines List */}
            {result.medicines && result.medicines.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Medicines Found ({result.medicines.length})
                </h4>
                {result.medicines.map((medicine, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="default" className="text-sm">
                        {medicine.name}
                      </Badge>
                      {medicine.dosage && (
                        <span className="text-sm text-muted-foreground">{medicine.dosage}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      {medicine.frequency && (
                        <p><strong>Frequency:</strong> {medicine.frequency}</p>
                      )}
                      {medicine.duration && (
                        <p><strong>Duration:</strong> {medicine.duration}</p>
                      )}
                    </div>
                    {medicine.instructions && (
                      <p className="text-xs bg-amber-50 text-amber-800 p-2 rounded">
                        💊 {medicine.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : result.rawText ? (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap">{result.rawText}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                <span>No medicines could be extracted from this image</span>
              </div>
            )}

            {/* Notes */}
            {result.notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> {result.notes}
                </p>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                ⚠️ This AI analysis is for reference only. Always consult your doctor or pharmacist for accurate medication information.
              </p>
            </div>

            <Button onClick={reset} variant="outline" className="w-full">
              Analyze Another Prescription
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
