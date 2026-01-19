import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { NurseWallet, CommissionSettings } from "@/hooks/useNurseWallet";
import { format, differenceInDays } from "date-fns";

interface NurseWalletCardProps {
  wallet: NurseWallet | null;
  settings: CommissionSettings | undefined;
}

export const NurseWalletCard = ({ wallet, settings }: NurseWalletCardProps) => {
  const commissionRate = settings?.commission_percentage || 10;
  const paymentCycleDays = settings?.payment_cycle_days || 7;

  const getDaysUntilDue = () => {
    if (!wallet?.last_payment_date) {
      // If never paid, check from first transaction
      return paymentCycleDays;
    }
    const lastPayment = new Date(wallet.last_payment_date);
    const dueDate = new Date(lastPayment);
    dueDate.setDate(dueDate.getDate() + paymentCycleDays);
    return differenceInDays(dueDate, new Date());
  };

  const daysUntilDue = getDaysUntilDue();
  const isOverdue = daysUntilDue < 0 && (wallet?.pending_commission || 0) > 0;

  if (!wallet) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5 text-primary" />
            My Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Complete your first booking to activate your wallet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border ${wallet.is_suspended ? 'border-destructive bg-destructive/5' : 'border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5 text-primary" />
            My Wallet
          </CardTitle>
          {wallet.is_suspended && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Suspended
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {wallet.is_suspended && (
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm text-destructive font-medium">
              Your account is suspended: {wallet.suspension_reason}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Please pay your pending commission to resume services
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Earnings</p>
            <p className="text-2xl font-bold text-primary">
              Rs. {wallet.total_earnings.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Net Earnings ({100 - commissionRate}%)</p>
            <p className="text-2xl font-bold text-green-600">
              Rs. {(wallet.total_earnings - wallet.total_commission_owed).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Pending Commission</p>
            <p className={`text-lg font-semibold ${wallet.pending_commission > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              Rs. {wallet.pending_commission.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="text-lg font-semibold text-green-600">
              Rs. {wallet.total_commission_paid.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Commission Rate</p>
            <p className="text-lg font-semibold">{commissionRate}%</p>
          </div>
        </div>

        {wallet.pending_commission > 0 && (
          <div className={`flex items-center gap-2 p-2 rounded-lg ${isOverdue ? 'bg-destructive/10' : 'bg-amber-500/10'}`}>
            <Clock className={`h-4 w-4 ${isOverdue ? 'text-destructive' : 'text-amber-600'}`} />
            <span className={`text-sm ${isOverdue ? 'text-destructive' : 'text-amber-600'}`}>
              {isOverdue 
                ? `Payment overdue by ${Math.abs(daysUntilDue)} days` 
                : `Payment due in ${daysUntilDue} days`}
            </span>
          </div>
        )}

        {wallet.last_payment_date && (
          <p className="text-xs text-muted-foreground">
            Last payment: {format(new Date(wallet.last_payment_date), 'PPP')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
