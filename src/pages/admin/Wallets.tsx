import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, Settings, Plus, Minus, Loader2, Users, Coins, History, Search, ArrowUpCircle, ArrowDownCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface WalletWithProfile {
  id: string;
  user_id: string;
  total_credits: number;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
}

interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: "credit" | "debit";
  credits: number;
  service_type: string;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

interface WalletSettings {
  id: string;
  is_enabled: boolean;
  credits_per_booking: number;
  minimum_redemption_credits: number;
  credits_to_pkr_ratio: number;
}

const Wallets = () => {
  const queryClient = useQueryClient();
  const [selectedWallet, setSelectedWallet] = useState<WalletWithProfile | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "deduct">("add");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userTransactions, setUserTransactions] = useState<WalletTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Fetch all wallets with user profiles
  const { data: wallets = [], isLoading: isLoadingWallets } = useQuery({
    queryKey: ["admin-wallets-full"],
    queryFn: async () => {
      // First get all wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from("wallets")
        .select("*")
        .order("total_credits", { ascending: false });

      if (walletsError) throw walletsError;

      // Then get profiles for each wallet
      const walletsWithProfiles: WalletWithProfile[] = await Promise.all(
        (walletsData || []).map(async (wallet) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone, city")
            .eq("user_id", wallet.user_id)
            .maybeSingle();

          return {
            ...wallet,
            full_name: profile?.full_name || null,
            phone: profile?.phone || null,
            city: profile?.city || null,
          };
        })
      );

      return walletsWithProfiles;
    },
  });

  // Fetch wallet settings
  const { data: settings } = useQuery({
    queryKey: ["wallet-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data as WalletSettings;
    },
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<WalletSettings>) => {
      const { error } = await supabase
        .from("wallet_settings")
        .update(updates)
        .eq("id", settings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-settings"] });
      toast.success("Settings updated");
    },
    onError: () => {
      toast.error("Failed to update settings");
    },
  });

  // Admin add credits
  const adminAddCredits = useMutation({
    mutationFn: async ({ userId, credits, description }: { userId: string; credits: number; description?: string }) => {
      const { error } = await supabase.rpc("add_wallet_credits", {
        p_user_id: userId,
        p_credits: credits,
        p_service_type: "admin_adjustment",
        p_reference_id: null,
        p_description: description || "Admin credit adjustment",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-wallets-full"] });
      toast.success("Credits added successfully");
    },
    onError: () => {
      toast.error("Failed to add credits");
    },
  });

  // Admin deduct credits
  const adminDeductCredits = useMutation({
    mutationFn: async ({ userId, credits, description }: { userId: string; credits: number; description?: string }) => {
      const { data, error } = await supabase.rpc("deduct_wallet_credits", {
        p_user_id: userId,
        p_credits: credits,
        p_service_type: "admin_adjustment",
        p_reference_id: null,
        p_description: description || "Admin debit adjustment",
      });
      if (error) throw error;
      if (!data) throw new Error("Insufficient credits");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-wallets-full"] });
      toast.success("Credits deducted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to deduct credits");
    },
  });

  // Fetch user transactions
  const fetchUserTransactions = async (userId: string) => {
    setIsLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setUserTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to fetch transaction history");
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleViewHistory = (wallet: WalletWithProfile) => {
    setSelectedWallet(wallet);
    fetchUserTransactions(wallet.user_id);
    setIsHistoryOpen(true);
  };

  const handleOpenAdjustment = (wallet: WalletWithProfile, type: "add" | "deduct") => {
    setSelectedWallet(wallet);
    setAdjustmentType(type);
    setAdjustmentAmount("");
    setAdjustmentReason("");
    setIsAdjustDialogOpen(true);
  };

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
      setIsAdjustDialogOpen(false);
      // Refresh history if open
      if (isHistoryOpen) {
        fetchUserTransactions(selectedWallet.user_id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Filter wallets by search
  const filteredWallets = wallets.filter((wallet) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      wallet.full_name?.toLowerCase().includes(query) ||
      wallet.phone?.includes(query) ||
      wallet.city?.toLowerCase().includes(query)
    );
  });

  const totalCredits = wallets.reduce((sum, w) => sum + w.total_credits, 0);
  const ratio = settings?.credits_to_pkr_ratio || 10;

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      lab_test: "Lab Test Booking",
      doctor_appointment: "Doctor Appointment",
      nurse_booking: "Nurse Booking",
      admin_adjustment: "Admin Adjustment",
      redemption: "Credit Redemption",
    };
    return labels[type] || type;
  };

  return (
    <AdminLayout>
      <div className="p-4 lg:p-6 space-y-6">
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
                <p className="text-sm text-muted-foreground">Total Credits (PKR {Math.floor(totalCredits / ratio).toLocaleString()})</p>
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
                <Label>Credits to PKR Ratio (e.g., 10 = 10 credits = 1 PKR)</Label>
                <Input
                  type="number"
                  defaultValue={settings?.credits_to_pkr_ratio || 10}
                  onBlur={(e) => updateSettings.mutate({ credits_to_pkr_ratio: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Wallets Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>User Wallets ({filteredWallets.length})</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-[300px]"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingWallets ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredWallets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No wallets found matching your search" : "No wallets created yet"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>PKR Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWallets.map((wallet) => (
                      <TableRow key={wallet.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{wallet.full_name || "Unknown User"}</p>
                            <p className="text-xs text-muted-foreground">{wallet.phone || "No phone"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{wallet.city || "-"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">
                            {wallet.total_credits.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-primary">
                            PKR {Math.floor(wallet.total_credits / ratio).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewHistory(wallet)}
                              title="View History"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => handleOpenAdjustment(wallet, "add")}
                              title="Add Credits"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleOpenAdjustment(wallet, "deduct")}
                              title="Deduct Credits"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Adjustment Dialog */}
        <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {adjustmentType === "add" ? (
                  <>
                    <ArrowUpCircle className="w-5 h-5 text-green-600" />
                    Add Credits
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="w-5 h-5 text-red-600" />
                    Deduct Credits
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">User</p>
                <p className="font-medium">{selectedWallet?.full_name || "Unknown"}</p>
                <p className="text-sm">Current Balance: <span className="font-mono">{selectedWallet?.total_credits.toLocaleString()}</span> credits</p>
              </div>
              <div className="space-y-2">
                <Label>Amount (Credits)</Label>
                <Input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="Enter credits amount"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Reason / Description</Label>
                <Input
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g., Bonus, Refund, Correction, Promotion"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAdjustment}
                disabled={adminAddCredits.isPending || adminDeductCredits.isPending}
                className={adjustmentType === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              >
                {(adminAddCredits.isPending || adminDeductCredits.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {adjustmentType === "add" ? "Add Credits" : "Deduct Credits"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transaction History Sheet */}
        <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Wallet History
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              {selectedWallet && (
                <div className="p-4 bg-muted rounded-lg mb-4">
                  <p className="font-medium text-lg">{selectedWallet.full_name || "Unknown User"}</p>
                  <p className="text-sm text-muted-foreground">{selectedWallet.phone}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div>
                      <p className="text-2xl font-bold">{selectedWallet.total_credits.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Credits</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">PKR {Math.floor(selectedWallet.total_credits / ratio).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">PKR Value</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleOpenAdjustment(selectedWallet, "add")}>
                      <Plus className="w-4 h-4 mr-1" /> Add Credits
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleOpenAdjustment(selectedWallet, "deduct")}>
                      <Minus className="w-4 h-4 mr-1" /> Deduct
                    </Button>
                  </div>
                </div>
              )}

              <h4 className="font-medium mb-3">Transaction History</h4>
              <ScrollArea className="h-[calc(100vh-320px)]">
                {isLoadingTransactions ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : userTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-start justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          {tx.type === "credit" ? (
                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                              <ArrowUpCircle className="w-4 h-4 text-green-600" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                              <ArrowDownCircle className="w-4 h-4 text-red-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{getServiceTypeLabel(tx.service_type)}</p>
                            {tx.description && (
                              <p className="text-xs text-muted-foreground">{tx.description}</p>
                            )}
                            {tx.reference_id && (
                              <p className="text-xs text-muted-foreground font-mono">Ref: {tx.reference_id}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(tx.created_at), "dd MMM yyyy, hh:mm a")}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={tx.type === "credit" ? "default" : "destructive"}
                          className={tx.type === "credit" ? "bg-green-600" : ""}
                        >
                          {tx.type === "credit" ? "+" : "-"}{tx.credits}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
};

export default Wallets;
