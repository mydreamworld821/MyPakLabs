import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAdminWallet } from "@/hooks/useWallet";
import { Wallet, Settings, Plus, Minus, Loader2, Users, Coins } from "lucide-react";
import { toast } from "sonner";

const Wallets = () => {
  const { wallets, settings, isLoading, updateSettings, adminAddCredits, adminDeductCredits } = useAdminWallet();
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "deduct">("add");

  const handleAdjustment = async () => {
    if (!selectedWallet || !adjustmentAmount) return;
    const credits = parseInt(adjustmentAmount);
    if (isNaN(credits) || credits <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      if (adjustmentType === "add") {
        await adminAddCredits.mutateAsync({
          userId: selectedWallet.user_id,
          credits,
          description: adjustmentReason || undefined,
        });
      } else {
        await adminDeductCredits.mutateAsync({
          userId: selectedWallet.user_id,
          credits,
          description: adjustmentReason || undefined,
        });
      }
      setIsDialogOpen(false);
      setAdjustmentAmount("");
      setAdjustmentReason("");
    } catch (error) {
      console.error(error);
    }
  };

  const totalCredits = wallets.reduce((sum, w) => sum + w.total_credits, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6" /> Wallet Management
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <Users className="w-10 h-10 text-primary" />
              <div>
                <p className="text-2xl font-bold">{wallets.length}</p>
                <p className="text-sm text-muted-foreground">Total Wallets</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <Coins className="w-10 h-10 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{totalCredits.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Credits</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <Settings className="w-10 h-10 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{settings?.credits_per_booking || 10}</p>
                <p className="text-sm text-muted-foreground">Credits per Booking</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" /> Wallet Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Wallet System</Label>
              <Switch
                checked={settings?.is_enabled ?? true}
                onCheckedChange={(checked) => updateSettings.mutate({ is_enabled: checked })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Credits per Booking</Label>
                <Input
                  type="number"
                  defaultValue={settings?.credits_per_booking || 10}
                  onBlur={(e) => updateSettings.mutate({ credits_per_booking: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Redemption Credits</Label>
                <Input
                  type="number"
                  defaultValue={settings?.minimum_redemption_credits || 1000}
                  onBlur={(e) => updateSettings.mutate({ minimum_redemption_credits: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Credits to PKR Ratio</Label>
                <Input
                  type="number"
                  defaultValue={settings?.credits_to_pkr_ratio || 10}
                  onBlur={(e) => updateSettings.mutate({ credits_to_pkr_ratio: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallets Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>PKR Value</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallets.map((wallet: any) => (
                    <TableRow key={wallet.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{wallet.profiles?.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{wallet.profiles?.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{wallet.total_credits.toLocaleString()}</Badge>
                      </TableCell>
                      <TableCell>PKR {Math.floor(wallet.total_credits / 10).toLocaleString()}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedWallet(wallet);
                            setAdjustmentType("add");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedWallet(wallet);
                            setAdjustmentType("deduct");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Adjustment Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {adjustmentType === "add" ? "Add Credits" : "Deduct Credits"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="Enter credits"
                />
              </div>
              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Input
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g., Bonus, Refund, Correction"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleAdjustment}
                disabled={adminAddCredits.isPending || adminDeductCredits.isPending}
              >
                {(adminAddCredits.isPending || adminDeductCredits.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Wallets;
