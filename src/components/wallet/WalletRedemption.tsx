import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wallet, Coins, Gift, AlertCircle, CheckCircle } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

interface WalletRedemptionProps {
  maxDiscount: number; // Maximum discount allowed (usually the order total)
  onApplyDiscount: (discountAmount: number, creditsUsed: number) => void;
  onRemoveDiscount: () => void;
  appliedDiscount?: number;
}

const WalletRedemption = ({
  maxDiscount,
  onApplyDiscount,
  onRemoveDiscount,
  appliedDiscount = 0,
}: WalletRedemptionProps) => {
  const {
    totalCredits,
    totalPKR,
    minimumCredits,
    isEnabled,
    canRedeem,
    pkrToCredits,
  } = useWallet();

  const [useWalletBalance, setUseWalletBalance] = useState(appliedDiscount > 0);

  if (!isEnabled) {
    return null;
  }

  const maxRedeemablePKR = Math.min(totalPKR, maxDiscount);
  const maxRedeemableCredits = pkrToCredits(maxRedeemablePKR);
  const hasMinimumCredits = totalCredits >= minimumCredits;

  const handleToggle = (checked: boolean) => {
    setUseWalletBalance(checked);
    if (checked && hasMinimumCredits && maxRedeemablePKR > 0) {
      onApplyDiscount(maxRedeemablePKR, maxRedeemableCredits);
    } else {
      onRemoveDiscount();
    }
  };

  if (totalCredits === 0) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Wallet className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">MyPakLabs Wallet</p>
              <p className="text-xs text-muted-foreground">
                No credits yet. Book services to earn credits!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={appliedDiscount > 0 ? "border-green-500/50 bg-green-50/30" : ""}>
      <CardContent className="p-4 space-y-4">
        {/* Header with toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Use Wallet Balance</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Coins className="w-3 h-3" />
                <span>{totalCredits.toLocaleString()} credits</span>
                <span>= PKR {totalPKR.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <Switch
            checked={useWalletBalance}
            onCheckedChange={handleToggle}
            disabled={!hasMinimumCredits || maxRedeemablePKR === 0}
          />
        </div>

        {/* Status messages */}
        {!hasMinimumCredits && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />
            <p className="text-xs text-yellow-700">
              Minimum {minimumCredits.toLocaleString()} credits required to redeem.
              You need {(minimumCredits - totalCredits).toLocaleString()} more credits.
            </p>
          </div>
        )}

        {/* Applied discount display */}
        {appliedDiscount > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-green-100 border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Wallet discount applied!
              </span>
            </div>
            <Badge className="bg-green-600">
              - PKR {appliedDiscount.toLocaleString()}
            </Badge>
          </div>
        )}

        {/* Info */}
        {hasMinimumCredits && !appliedDiscount && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Gift className="w-3 h-3" />
            Toggle to apply PKR {maxRedeemablePKR.toLocaleString()} discount using{" "}
            {maxRedeemableCredits.toLocaleString()} credits
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletRedemption;
