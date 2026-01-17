import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Coins, Gift, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WalletCardProps {
  totalCredits: number;
  totalPKR: number;
  minimumCredits: number;
  creditsPerBooking: number;
  isEnabled: boolean;
}

const WalletCard = ({
  totalCredits,
  totalPKR,
  minimumCredits,
  creditsPerBooking,
  isEnabled,
}: WalletCardProps) => {
  if (!isEnabled) {
    return null;
  }

  const canRedeem = totalCredits >= minimumCredits;
  const minimumPKR = minimumCredits / 10;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="w-5 h-5 text-primary" />
            MyPakLabs Wallet
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Earn {creditsPerBooking} credits on every booking. 
                  Redeem credits only on lab test bookings.
                  10 credits = PKR 1
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Credits Display */}
        <div className="text-center py-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Coins className="w-6 h-6 text-yellow-500" />
            <span className="text-3xl font-bold text-foreground">
              {totalCredits.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Available Credits</p>
          <p className="text-lg font-semibold text-primary mt-1">
            = PKR {totalPKR.toLocaleString()}
          </p>
        </div>

        {/* Redemption Status */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Lab Test Discount</span>
          </div>
          {canRedeem ? (
            <Badge variant="default" className="bg-green-600">
              Ready to Redeem
            </Badge>
          ) : (
            <Badge variant="secondary">
              Need {(minimumCredits - totalCredits).toLocaleString()} more
            </Badge>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center">
          🎁 Redeem on lab tests only • Min: {minimumCredits.toLocaleString()} credits (PKR {minimumPKR})
        </p>
      </CardContent>
    </Card>
  );
};

export default WalletCard;
