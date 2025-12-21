import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TestSelector from "@/components/labs/TestSelector";
import PrescriptionUploader from "@/components/labs/PrescriptionUploader";
import { getLabById, getTestsForLab, generateUniqueId } from "@/data/mockData";
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Clock,
  Shield,
  FileText,
  ShoppingCart,
  CheckCircle,
  Download,
  Copy,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const LabDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [uniqueId, setUniqueId] = useState("");

  const lab = getLabById(id || "");
  const tests = getTestsForLab(id || "");

  if (!lab) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Lab not found</h1>
          <Button onClick={() => navigate("/labs")}>Back to Labs</Button>
        </div>
      </div>
    );
  }

  const selectedTestItems = tests.filter((t: any) => selectedTests.includes(t.id));
  const totalOriginal = selectedTestItems.reduce((sum: number, t: any) => sum + t.originalPrice, 0);
  const totalDiscounted = selectedTestItems.reduce((sum: number, t: any) => sum + t.discountedPrice, 0);
  const totalSavings = totalOriginal - totalDiscounted;

  const handleConfirmBooking = () => {
    const newId = generateUniqueId();
    setUniqueId(newId);
    setBookingConfirmed(true);
    toast.success("Booking confirmed! Your discount ID has been generated.");
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(uniqueId);
    toast.success("ID copied to clipboard!");
  };

  const handleDownloadPDF = () => {
    toast.success("PDF download started!");
    // In a real app, this would generate and download a PDF
  };

  if (bookingConfirmed) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <Card variant="elevated" className="max-w-2xl mx-auto text-center p-8">
            <div className="w-20 h-20 gradient-hero rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
              <CheckCircle className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground mb-6">
              Your discount ID has been generated. Show this at {lab.name} to get your discounted price.
            </p>

            <Card className="bg-primary/5 border-primary/20 mb-6">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Your Unique Discount ID</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl md:text-3xl font-mono font-bold text-primary tracking-wider">
                    {uniqueId}
                  </span>
                  <Button variant="ghost" size="icon" onClick={handleCopyId}>
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Valid for 7 days from today
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3 text-left mb-6">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Lab</span>
                <span className="font-medium">{lab.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Tests</span>
                <span className="font-medium">{selectedTests.length} test(s)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Original Price</span>
                <span className="text-muted-foreground line-through">
                  Rs. {totalOriginal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Discount ({lab.discount}%)</span>
                <span className="text-medical-green font-medium">
                  - Rs. {totalSavings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-semibold">Final Price</span>
                <span className="text-xl font-bold text-primary">
                  Rs. {totalDiscounted.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4" />
                Download PDF Slip
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate("/labs")}>
                Browse More Labs
              </Button>
            </div>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-24 pb-8 gradient-hero relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <Button
            variant="ghost"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 mb-4"
            onClick={() => navigate("/labs")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Labs
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Badge className="bg-primary-foreground/10 text-primary-foreground border-0 mb-2">
                <Sparkles className="w-3 h-3 mr-1" />
                {lab.discount}% Discount
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                {lab.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-primary-foreground/80">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{lab.rating}</span>
                  <span className="text-sm">({lab.reviewCount.toLocaleString()} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{lab.city}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Select Your Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="manual">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="manual">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Select Tests
                      </TabsTrigger>
                      <TabsTrigger value="prescription">
                        <FileText className="w-4 h-4 mr-2" />
                        Upload Prescription
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual">
                      <TestSelector
                        tests={tests as any}
                        selectedTests={selectedTests}
                        onSelectionChange={setSelectedTests}
                      />
                    </TabsContent>

                    <TabsContent value="prescription">
                      <PrescriptionUploader
                        onUpload={setPrescriptionFile}
                        uploadedFile={prescriptionFile}
                        onRemove={() => setPrescriptionFile(null)}
                      />
                      {prescriptionFile && (
                        <p className="text-sm text-muted-foreground mt-4 text-center">
                          Our team will review your prescription and contact you with the final test list and pricing.
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Lab Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lab Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{lab.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{lab.branches.length} branches in {lab.city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Open 7 AM - 10 PM</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>+92 300 1234567</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span>ISO 15189 Certified</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="sticky top-32">
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTests.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {selectedTestItems.map((test: any) => (
                          <div key={test.id} className="flex justify-between text-sm">
                            <span className="truncate flex-1 pr-2">{test.name}</span>
                            <span className="font-medium">
                              Rs. {test.discountedPrice.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-border pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="line-through text-muted-foreground">
                            Rs. {totalOriginal.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Discount ({lab.discount}%)
                          </span>
                          <span className="text-medical-green">
                            - Rs. {totalSavings.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                          <span>Total</span>
                          <span className="text-primary">
                            Rs. {totalDiscounted.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <Badge variant="success" className="w-full justify-center py-2">
                        You save Rs. {totalSavings.toLocaleString()}!
                      </Badge>

                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleConfirmBooking}
                      >
                        Confirm & Get Discount ID
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Select tests to see pricing
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LabDetail;
