import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreditCard, Upload, CheckCircle, XCircle, Clock, Image } from "lucide-react";
import { NurseCommissionPayment, NurseWallet } from "@/hooks/useNurseWallet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface NurseCommissionPaymentProps {
  wallet: NurseWallet | null;
  payments: NurseCommissionPayment[];
  onSubmitPayment: (data: {
    amount: number;
    paymentMethod: string;
    screenshotUrl: string;
    transactionReference?: string;
  }) => void;
  isSubmitting: boolean;
}

export const NurseCommissionPaymentSection = ({
  wallet,
  payments,
  onSubmitPayment,
  isSubmitting,
}: NurseCommissionPaymentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `commission-payments/${fileName}`;

      // Upload to nurse-photos bucket which is public
      const { error: uploadError } = await supabase.storage
        .from("nurse-photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("nurse-photos")
        .getPublicUrl(filePath);

      setScreenshotUrl(urlData.publicUrl);
      toast.success("Screenshot uploaded successfully");
    } catch (error: any) {
      toast.error("Failed to upload screenshot: " + (error.message || "Unknown error"));
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!amount || !paymentMethod || !screenshotUrl) {
      toast.error("Please fill all required fields and upload screenshot");
      return;
    }

    onSubmitPayment({
      amount: parseFloat(amount),
      paymentMethod,
      screenshotUrl,
      transactionReference: transactionRef || undefined,
    });

    setIsOpen(false);
    setAmount("");
    setPaymentMethod("");
    setTransactionRef("");
    setScreenshotUrl("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5" />
          Commission Payments
        </CardTitle>
        {wallet && wallet.pending_commission > 0 && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>Pay Commission</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Submit Commission Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    Pending Commission: <strong>Rs. {wallet.pending_commission.toLocaleString()}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Amount (PKR) *</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    max={wallet.pending_commission}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easypaisa">Easypaisa</SelectItem>
                      <SelectItem value="jazzcash">JazzCash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Transaction Reference</Label>
                  <Input
                    placeholder="Transaction ID or reference"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Screenshot *</Label>
                  {screenshotUrl ? (
                    <div className="relative">
                      <img
                        src={screenshotUrl}
                        alt="Payment screenshot"
                        className="w-full h-40 object-cover rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setScreenshotUrl("")}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="screenshot-upload"
                        disabled={uploading}
                      />
                      <label
                        htmlFor="screenshot-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        {uploading ? (
                          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Click to upload payment screenshot
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={isSubmitting || uploading}
                >
                  {isSubmitting ? "Submitting..." : "Submit Payment"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            No payment history yet
          </p>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    {payment.screenshot_url && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="relative group">
                            <img
                              src={payment.screenshot_url}
                              alt="Payment"
                              className="w-12 h-12 object-cover rounded-lg border"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                              <Image className="h-4 w-4 text-white" />
                            </div>
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Payment Screenshot</DialogTitle>
                          </DialogHeader>
                          <img
                            src={payment.screenshot_url}
                            alt="Payment screenshot"
                            className="w-full rounded-lg"
                          />
                        </DialogContent>
                      </Dialog>
                    )}
                    <div>
                      <p className="font-medium">Rs. {payment.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {payment.payment_method?.replace("_", " ")}
                        {payment.transaction_reference && ` • ${payment.transaction_reference}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.created_at), "PPp")}
                      </p>
                      {payment.admin_notes && payment.status === "rejected" && (
                        <p className="text-xs text-destructive mt-1">
                          Note: {payment.admin_notes}
                        </p>
                      )}
                      {payment.status === "approved" && (
                        <p className="text-xs text-green-600 mt-1 font-medium">
                          ✓ Payment verified! Commission cleared.
                        </p>
                      )}
                    </div>
                  </div>
                  <div>{getStatusBadge(payment.status)}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
