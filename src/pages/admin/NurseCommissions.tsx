import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Wallet,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Ban,
  Unlock,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react";
import { useAdminNurseCommissions } from "@/hooks/useNurseWallet";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";

const NurseCommissions = () => {
  const { user } = useAuth();
  const {
    nurseWallets,
    pendingPayments,
    settings,
    isLoading,
    updateSettings,
    reviewPayment,
    toggleSuspension,
  } = useAdminNurseCommissions();

  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commissionRate, setCommissionRate] = useState(settings?.commission_percentage || 10);
  const [paymentCycle, setPaymentCycle] = useState(settings?.payment_cycle_days || 7);
  const [gracePeriod, setGracePeriod] = useState(settings?.grace_period_days || 3);

  // Calculate totals
  const totalEarnings = nurseWallets.reduce((sum, w) => sum + (w.total_earnings || 0), 0);
  const totalCommissionOwed = nurseWallets.reduce((sum, w) => sum + (w.total_commission_owed || 0), 0);
  const totalCommissionPaid = nurseWallets.reduce((sum, w) => sum + (w.total_commission_paid || 0), 0);
  const totalPending = nurseWallets.reduce((sum, w) => sum + (w.pending_commission || 0), 0);
  const suspendedCount = nurseWallets.filter((w) => w.is_suspended).length;

  const handleReviewPayment = async (status: "approved" | "rejected") => {
    if (!selectedPayment || !user?.id) return;

    await reviewPayment.mutateAsync({
      paymentId: selectedPayment.id,
      status,
      adminNotes,
      userId: user.id,
    });

    setSelectedPayment(null);
    setAdminNotes("");
  };

  const handleUpdateSettings = async () => {
    await updateSettings.mutateAsync({
      commission_percentage: commissionRate,
      payment_cycle_days: paymentCycle,
      grace_period_days: gracePeriod,
    });
    setSettingsOpen(false);
  };

  const handleToggleSuspension = async (walletId: string, currentStatus: boolean) => {
    await toggleSuspension.mutateAsync({
      walletId,
      suspend: !currentStatus,
      reason: !currentStatus ? "Manual suspension by admin" : undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700">
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
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Nurse Commissions</h1>
            <p className="text-muted-foreground">
              Manage nurse earnings and commission payments
            </p>
          </div>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Commission Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Commission Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Commission Rate (%)</Label>
                  <Input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    min={0}
                    max={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Cycle (Days)</Label>
                  <Input
                    type="number"
                    value={paymentCycle}
                    onChange={(e) => setPaymentCycle(Number(e.target.value))}
                    min={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nurses must pay commission within this period
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Grace Period (Days)</Label>
                  <Input
                    type="number"
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(Number(e.target.value))}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Extra days before account suspension
                  </p>
                </div>
                <Button className="w-full" onClick={handleUpdateSettings}>
                  Save Settings
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rs. {totalEarnings.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Commission Owed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                Rs. {totalCommissionOwed.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Commission Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                Rs. {totalCommissionPaid.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                Rs. {totalPending.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Suspended Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {suspendedCount}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Payment Verification
              {pendingPayments.filter((p) => p.status === "pending").length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingPayments.filter((p) => p.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="wallets" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Nurse Wallets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nurse</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Screenshot</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={payment.nurses?.photo_url} />
                              <AvatarFallback>
                                {payment.nurses?.full_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{payment.nurses?.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {payment.nurses?.phone}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          Rs. {payment.amount?.toLocaleString()}
                        </TableCell>
                        <TableCell className="capitalize">
                          {payment.payment_method?.replace("_", " ")}
                        </TableCell>
                        <TableCell>
                          {payment.screenshot_url && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Payment Screenshot</DialogTitle>
                                </DialogHeader>
                                <img
                                  src={payment.screenshot_url}
                                  alt="Payment"
                                  className="w-full rounded-lg"
                                />
                                {payment.transaction_reference && (
                                  <p className="text-sm">
                                    <strong>Reference:</strong> {payment.transaction_reference}
                                  </p>
                                )}
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(payment.created_at), "PPp")}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          {payment.status === "pending" && (
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600"
                                    onClick={() => setSelectedPayment(payment)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Approve Payment</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 pt-4">
                                    <p>
                                      Approve payment of{" "}
                                      <strong>Rs. {payment.amount?.toLocaleString()}</strong> from{" "}
                                      {payment.nurses?.full_name}?
                                    </p>
                                    <div className="space-y-2">
                                      <Label>Admin Notes (Optional)</Label>
                                      <Textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Add any notes..."
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        className="flex-1"
                                        onClick={() => handleReviewPayment("approved")}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => handleReviewPayment("rejected")}
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {pendingPayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <p className="text-muted-foreground">No payment submissions</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallets">
            <Card>
              <CardHeader>
                <CardTitle>Nurse Wallets</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nurse</TableHead>
                      <TableHead>Total Earnings</TableHead>
                      <TableHead>Commission Owed</TableHead>
                      <TableHead>Commission Paid</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nurseWallets.map((wallet: any) => (
                      <TableRow key={wallet.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={wallet.nurses?.photo_url} />
                              <AvatarFallback>
                                {wallet.nurses?.full_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{wallet.nurses?.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {wallet.nurses?.city}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>Rs. {wallet.total_earnings?.toLocaleString()}</TableCell>
                        <TableCell className="text-amber-600">
                          Rs. {wallet.total_commission_owed?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-green-600">
                          Rs. {wallet.total_commission_paid?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-red-600 font-semibold">
                          Rs. {wallet.pending_commission?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {wallet.is_suspended ? (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Suspended
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {wallet.last_payment_date
                            ? format(new Date(wallet.last_payment_date), "PP")
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={wallet.is_suspended ? "outline" : "destructive"}
                            onClick={() =>
                              handleToggleSuspension(wallet.id, wallet.is_suspended)
                            }
                          >
                            {wallet.is_suspended ? (
                              <>
                                <Unlock className="h-4 w-4 mr-1" />
                                Unsuspend
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4 mr-1" />
                                Suspend
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {nurseWallets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <p className="text-muted-foreground">No nurse wallets found</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default NurseCommissions;
