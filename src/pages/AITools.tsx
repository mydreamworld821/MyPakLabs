import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrescriptionAnalyzer } from "@/components/ai/PrescriptionAnalyzer";
import { FileText, Bot } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const AITools = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">AI Health Tools</h1>
            <p className="text-muted-foreground">
              Use AI-powered tools to analyze prescriptions and get health information
            </p>
          </div>

          <Tabs defaultValue="prescription" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="prescription" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Prescription Analyzer
              </TabsTrigger>
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                How It Works
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prescription">
              <PrescriptionAnalyzer />
            </TabsContent>

            <TabsContent value="info">
              <div className="prose prose-sm max-w-none">
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Prescription Analyzer
                  </h3>
                  <p className="text-muted-foreground">
                    Upload any prescription image and our AI will extract:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Medicine names and dosages</li>
                    <li>Frequency and duration of medication</li>
                    <li>Special instructions</li>
                    <li>Doctor and patient information (if visible)</li>
                  </ul>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      Health Assistant Chatbot
                    </h3>
                    <p className="text-muted-foreground mt-2">
                      Click the chat icon in the bottom-right corner to access our AI health assistant. It can help you:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Understand symptoms and when to seek care</li>
                      <li>Find the right type of specialist</li>
                      <li>Learn about common health tests</li>
                      <li>Get general wellness tips</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-amber-800">
                      <strong>⚠️ Important:</strong> These AI tools are for informational purposes only and do not replace professional medical advice. Always consult a qualified healthcare provider for diagnosis and treatment.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AITools;
