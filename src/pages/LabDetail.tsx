import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TestSelector from "@/components/labs/TestSelector";
import PrescriptionUploader from "@/components/labs/PrescriptionUploader";
import { generateBookingPDF } from "@/utils/generateBookingPDF";
import { usePrescriptionUpload } from "@/hooks/usePrescriptionUpload";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateLabId } from "@/utils/generateLabId";
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
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Lab {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  discount_percentage: number | null;
  rating: number | null;
  review_count: number | null;
  cities: string[] | null;
  branches: unknown;
  popular_tests: string[] | null;
}

interface LabTest {
  id: string;
  test_id: string;
  price: number;
  discounted_price: number | null;
  is_available: boolean | null;
  tests: {
    id: string;
    name: string;
    category: string | null;
    description: string | null;
    sample_type: string | null;
    turnaround_time: string | null;
  } | null;
}

interface TestItem {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
}

const LabDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { uploadPrescription, isUploading } = usePrescriptionUpload();
  
  const [lab, setLab] = useState<Lab | null>(null);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [uniqueId, setUniqueId] = useState("");
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);
  const [prescriptionSaved, setPrescriptionSaved] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLabData();
    }
  }, [id]);

  const fetchLabData = async () => {
    try {
      // Fetch lab details
      const { data: labData, error: labError } = await supabase
        .from("labs")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (labError) throw labError;
      if (!labData) {
        setIsLoading(false);
        return;
      }

      setLab(labData);
      const discount = labData.discount_percentage || 0;

      // Fetch lab tests with test details
      const { data: labTestsData, error: testsError } = await supabase
        .from("lab_tests")
        .select(`
          id,
          test_id,
          price,
          discounted_price,
          is_available,
          tests:test_id (
            id,
            name,
            category,
            description,
            sample_type,
            turnaround_time
          )
        `)
        .eq("lab_id", id)
        .eq("is_available", true);

      if (testsError) throw testsError;

      // Transform lab tests to the format expected by TestSelector
      const transformedTests: TestItem[] = (labTestsData || [])
        .filter((lt: any) => lt.tests)
        .map((lt: any) => ({
          id: lt.test_id,
          name: lt.tests.name,
          category: lt.tests.category,
          description: lt.tests.description,
          originalPrice: lt.price,
          discountedPrice: lt.discounted_price || Math.round(lt.price * (1 - discount / 100)),
          discount: discount,
        }));

      setTests(transformedTests);
    } catch (error) {
      console.error("Error fetching lab data:", error);
      toast.error("Failed to load lab details");
    } finally {
      setIsLoading(false);
    }
  };

  // Use the lab-based ID generator
  const generateUniqueIdForLab = (): string => {
    return generateLabId(lab?.name || "MEDI");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

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

  const discount = lab.discount_percentage || 0;
  const branches = Array.isArray(lab.branches) ? lab.branches as any[] : [];
  const cities = lab.cities || [];

  const selectedTestItems = tests.filter((t) => selectedTests.includes(t.id));
  const totalOriginal = selectedTestItems.reduce((sum, t) => sum + t.originalPrice, 0);
  const totalDiscounted = selectedTestItems.reduce((sum, t) => sum + t.discountedPrice, 0);
  const totalSavings = totalOriginal - totalDiscounted;

  const handleConfirmBooking = async () => {
    if (!user) {
      toast.error("Please sign in to book tests");
      navigate("/auth");
      return;
    }

    if (selectedTests.length === 0) {
      toast.error("Please select at least one test");
      return;
    }

    const newId = generateUniqueIdForLab();
    setUniqueId(newId);

    // Save order to database
    try {
      const validityDate = new Date();
      validityDate.setDate(validityDate.getDate() + 7);

      const { error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          lab_id: lab.id,
          unique_id: newId,
          tests: selectedTestItems.map(t => ({
            test_id: t.id,
            test_name: t.name,
            price: t.originalPrice,
            discounted_price: t.discountedPrice
          })),
          original_total: totalOriginal,
          discount_percentage: discount,
          discounted_total: totalDiscounted,
          validity_date: validityDate.toISOString().split('T')[0],
          status: 'pending'
        });

      if (error) {
        console.error("Error saving order:", error);
        toast.error("Failed to save order. Please try again.");
        return;
      }

      setBookingConfirmed(true);
      toast.success("Booking confirmed! Your discount ID has been generated.");
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Failed to save order. Please try again.");
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(uniqueId);
    toast.success("ID copied to clipboard!");
  };

  const handleDownloadPDF = async () => {
    try {
      await generateBookingPDF({
        uniqueId,
        labName: lab.name,
        tests: selectedTestItems.map((test) => ({
          name: test.name,
          originalPrice: test.originalPrice,
          discountedPrice: test.discountedPrice,
        })),
        totalOriginal,
        totalDiscounted,
        totalSavings,
        discountPercentage: discount,
        validityDays: 7,
      });
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const handlePrescriptionUpload = async (file: File) => {
    if (!user) {
      toast.error("Please sign in to upload prescriptions");
      navigate("/auth");
      return;
    }
    setPrescriptionFile(file);
  };

  const handleSubmitPrescription = async () => {
    if (!prescriptionFile || !user) return;

    setIsSavingPrescription(true);

    try {
      const uploadResult = await uploadPrescription(prescriptionFile);
      
      if (!uploadResult) {
        setIsSavingPrescription(false);
        return;
      }

      const { error } = await supabase
        .from("prescriptions")
        .insert({
          user_id: user.id,
          lab_id: id || null,
          image_url: uploadResult.path,
          status: "pending_review" as any,
        });

      if (error) {
        console.error("Error saving prescription:", error);
        toast.error("Failed to save prescription");
        return;
      }

      setPrescriptionSaved(true);
      toast.success("Prescription submitted for review!");
    } catch (error) {
      console.error("Error submitting prescription:", error);
      toast.error("Failed to submit prescription");
    } finally {
      setIsSavingPrescription(false);
    }
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
                <span className="text-muted-foreground">Discount ({discount}%)</span>
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

  if (prescriptionSaved) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <Card variant="elevated" className="max-w-2xl mx-auto text-center p-8">
            <div className="w-20 h-20 gradient-hero rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
              <FileText className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Prescription Submitted!</h1>
            <p className="text-muted-foreground mb-6">
              Your prescription has been sent to our admin team for review. You will be notified once the tests are approved.
            </p>

            <Card className="bg-primary/5 border-primary/20 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Badge variant="warning">Pending Review</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Our team will review your prescription and approve the appropriate tests. 
                  You can check the status in your <span className="font-medium">My Prescriptions</span> page.
                </p>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" onClick={() => navigate("/my-prescriptions")}>
                <FileText className="w-4 h-4 mr-2" />
                View My Prescriptions
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
            <div className="flex items-center gap-4">
              {lab.logo_url && (
                <img src={lab.logo_url} alt={lab.name} className="w-16 h-16 rounded-lg object-contain bg-white p-2" />
              )}
              <div>
                <Badge className="bg-primary-foreground/10 text-primary-foreground border-0 mb-2">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {discount}% Discount
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                  {lab.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-primary-foreground/80">
                  {lab.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{lab.rating}</span>
                      {lab.review_count && (
                        <span className="text-sm">({lab.review_count.toLocaleString()} reviews)</span>
                      )}
                    </div>
                  )}
                  {cities.length > 0 && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{cities.join(", ")}</span>
                    </div>
                  )}
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
                      {tests.length > 0 ? (
                        <TestSelector
                          tests={tests as any}
                          selectedTests={selectedTests}
                          onSelectionChange={setSelectedTests}
                        />
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No tests available for this lab yet.</p>
                          <p className="text-sm mt-2">Please check back later or contact the lab directly.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="prescription">
                      <PrescriptionUploader
                        onUpload={handlePrescriptionUpload}
                        uploadedFile={prescriptionFile}
                        onRemove={() => setPrescriptionFile(null)}
                      />
                      {prescriptionFile && (
                        <div className="mt-4 space-y-3">
                          <p className="text-sm text-muted-foreground text-center">
                            Click below to submit your prescription for admin review. Our team will approve the tests and notify you.
                          </p>
                          <Button 
                            className="w-full" 
                            onClick={handleSubmitPrescription}
                            disabled={isUploading || isSavingPrescription}
                          >
                            {(isUploading || isSavingPrescription) ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4 mr-2" />
                                Submit Prescription for Review
                              </>
                            )}
                          </Button>
                        </div>
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
                  {lab.description && (
                    <p className="text-sm text-muted-foreground">{lab.description}</p>
                  )}
                  <div className="space-y-2">
                    {branches.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{branches.length} branches in {cities.join(", ")}</span>
                      </div>
                    )}
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
                        {selectedTestItems.map((test) => (
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
                            Discount ({discount}%)
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
