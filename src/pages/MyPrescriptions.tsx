import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  FileText,
  Loader2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  FlaskConical,
  ArrowLeft,
  Building2,
  Percent,
  Download,
} from "lucide-react";
import { generatePrescriptionPDF } from "@/utils/generatePrescriptionPDF";

interface ApprovedTest {
  test_id: string;
  test_name: string;
  price: number;
}

interface Prescription {
  id: string;
  image_url: string;
  status: string;
  admin_notes: string | null;
  approved_tests: ApprovedTest[] | null;
  reviewed_at: string | null;
  created_at: string;
  lab_id: string | null;
  labs?: {
    name: string;
    discount_percentage: number | null;
  } | null;
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending_review: {
    icon: Clock,
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    label: "Pending Review"
  },
  approved: {
    icon: CheckCircle,
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    label: "Approved"
  },
  rejected: {
    icon: XCircle,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    label: "Rejected"
  }
};

const MyPrescriptions = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { signedUrl, isLoading: isLoadingUrl } = useSignedUrl(
    selectedPrescription?.image_url || ""
  );

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchPrescriptions();
    }
  }, [user, authLoading, navigate]);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          *,
          labs:lab_id (
            name,
            discount_percentage
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const parsedData = (data || []).map(p => ({
        ...p,
        approved_tests: Array.isArray(p.approved_tests) ? p.approved_tests as unknown as ApprovedTest[] : null
      }));
      
      setPrescriptions(parsedData);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      toast.error("Failed to fetch prescriptions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsDialogOpen(true);
  };

  const handleDownloadPDF = (prescription: Prescription) => {
    if (!prescription.approved_tests || prescription.approved_tests.length === 0) {
      toast.error("No approved tests to download");
      return;
    }

    const subtotal = prescription.approved_tests.reduce((sum, t) => sum + t.price, 0);
    const discountPct = prescription.labs?.discount_percentage || 0;
    const discountAmount = subtotal * discountPct / 100;
    const total = subtotal - discountAmount;

    generatePrescriptionPDF({
      prescriptionId: prescription.id,
      labName: prescription.labs?.name || "Unknown Lab",
      labDiscount: discountPct,
      tests: prescription.approved_tests.map(t => ({
        name: t.test_name,
        price: t.price
      })),
      subtotal,
      discountAmount,
      total,
      approvedDate: prescription.reviewed_at 
        ? format(new Date(prescription.reviewed_at), "dd MMM yyyy")
        : format(new Date(), "dd MMM yyyy"),
    });

    toast.success("PDF downloaded successfully!");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
            My Prescriptions
          </h1>
          <p className="text-primary-foreground/80">
            View your uploaded prescriptions and approved tests
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : prescriptions.length === 0 ? (
            <Card className="max-w-md mx-auto text-center p-8">
              <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Prescriptions Yet</h2>
              <p className="text-muted-foreground mb-4">
                You haven't uploaded any prescriptions yet. Upload one to get your tests approved by our admin team.
              </p>
              <Button onClick={() => navigate("/labs")}>
                Browse Labs
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prescriptions.map((prescription) => {
                const config = statusConfig[prescription.status] || statusConfig.pending_review;
                const StatusIcon = config.icon;
                const totalPrice = prescription.approved_tests?.reduce((sum, t) => sum + t.price, 0) || 0;
                const discount = prescription.labs?.discount_percentage || 0;
                const discountedTotal = totalPrice - (totalPrice * discount / 100);

                return (
                  <Card key={prescription.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-mono">
                          #{prescription.id.slice(0, 8)}
                        </CardTitle>
                        <Badge className={config.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      {prescription.labs && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Building2 className="w-3 h-3" />
                          <span>{prescription.labs.name}</span>
                          {discount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Percent className="w-3 h-3 mr-1" />
                              {discount}% off
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <p>Submitted: {format(new Date(prescription.created_at), "dd MMM yyyy, HH:mm")}</p>
                        {prescription.reviewed_at && (
                          <p>Reviewed: {format(new Date(prescription.reviewed_at), "dd MMM yyyy, HH:mm")}</p>
                        )}
                      </div>

                      {prescription.status === "approved" && prescription.approved_tests && (
                        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <FlaskConical className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-sm text-green-700">
                              {prescription.approved_tests.length} Test(s) Approved
                            </span>
                          </div>
                          <div className="space-y-1">
                            {prescription.approved_tests.slice(0, 3).map(test => (
                              <div key={test.test_id} className="flex justify-between text-sm">
                                <span className="truncate flex-1 text-muted-foreground">{test.test_name}</span>
                                <span className="font-medium">Rs. {test.price}</span>
                              </div>
                            ))}
                            {prescription.approved_tests.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{prescription.approved_tests.length - 3} more test(s)
                              </p>
                            )}
                          </div>
                          <div className="border-t border-green-500/20 mt-2 pt-2 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Subtotal</span>
                              <span>Rs. {totalPrice}</span>
                            </div>
                            {discount > 0 && (
                              <div className="flex justify-between text-sm text-green-600">
                                <span>Discount ({discount}%)</span>
                                <span>-Rs. {(totalPrice * discount / 100).toFixed(0)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-semibold text-green-700">
                              <span>Total</span>
                              <span>Rs. {discountedTotal.toFixed(0)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {prescription.status === "rejected" && prescription.admin_notes && (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                          <p className="text-sm text-red-700">
                            <span className="font-medium">Reason: </span>
                            {prescription.admin_notes}
                          </p>
                        </div>
                      )}

                      {prescription.status === "pending_review" && (
                        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                          <p className="text-sm text-yellow-700">
                            Your prescription is being reviewed by our admin team. You'll be notified once it's approved.
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleViewPrescription(prescription)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        {prescription.status === "approved" && prescription.approved_tests && prescription.approved_tests.length > 0 && (
                          <Button
                            variant="default"
                            className="flex-1"
                            onClick={() => handleDownloadPDF(prescription)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* View Prescription Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>

          {selectedPrescription && (
            <div className="space-y-4 mt-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge className={statusConfig[selectedPrescription.status]?.color}>
                  {statusConfig[selectedPrescription.status]?.label}
                </Badge>
              </div>

              {/* Prescription Image */}
              <div className="border rounded-lg overflow-hidden">
                {isLoadingUrl ? (
                  <div className="flex items-center justify-center h-64 bg-muted">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : signedUrl ? (
                  <img
                    src={signedUrl}
                    alt="Prescription"
                    className="w-full max-h-96 object-contain bg-muted"
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 bg-muted text-muted-foreground">
                    Unable to load prescription image
                  </div>
                )}
              </div>

              {/* Approved Tests */}
              {selectedPrescription.status === "approved" && selectedPrescription.approved_tests && (
                <Card className="bg-green-500/5 border-green-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-green-700">
                      <FlaskConical className="w-4 h-4" />
                      Approved Tests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedPrescription.approved_tests.map(test => (
                        <div key={test.test_id} className="flex justify-between py-1 border-b border-green-500/10 last:border-0">
                          <span>{test.test_name}</span>
                          <span className="font-medium">Rs. {test.price}</span>
                        </div>
                      ))}
                      {(() => {
                        const subtotal = selectedPrescription.approved_tests.reduce((sum, t) => sum + t.price, 0);
                        const discountPct = selectedPrescription.labs?.discount_percentage || 0;
                        const discountAmt = subtotal * discountPct / 100;
                        const finalTotal = subtotal - discountAmt;
                        return (
                          <>
                            <div className="flex justify-between pt-2 text-sm">
                              <span>Subtotal</span>
                              <span>Rs. {subtotal}</span>
                            </div>
                            {discountPct > 0 && (
                              <div className="flex justify-between text-sm text-green-600">
                                <span>Discount ({discountPct}%)</span>
                                <span>-Rs. {discountAmt.toFixed(0)}</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-1 font-semibold text-green-700 border-t border-green-500/20">
                              <span>Total</span>
                              <span>Rs. {finalTotal.toFixed(0)}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Admin Notes */}
              {selectedPrescription.admin_notes && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin Notes</label>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    {selectedPrescription.admin_notes}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Submitted: {format(new Date(selectedPrescription.created_at), "dd MMM yyyy, HH:mm")}</p>
                {selectedPrescription.reviewed_at && (
                  <p>Reviewed: {format(new Date(selectedPrescription.reviewed_at), "dd MMM yyyy, HH:mm")}</p>
                )}
              </div>

              {/* Download PDF Button */}
              {selectedPrescription.status === "approved" && selectedPrescription.approved_tests && selectedPrescription.approved_tests.length > 0 && (
                <Button
                  className="w-full"
                  onClick={() => handleDownloadPDF(selectedPrescription)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF Slip
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyPrescriptions;