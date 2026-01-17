import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  History,
  TrendingUp,
  TrendingDown,
  Stethoscope,
  TestTube,
  HeartPulse,
  ShoppingBag,
  Settings,
} from "lucide-react";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  credits: number;
  service_type: string;
  description: string | null;
  created_at: string;
}

interface WalletHistoryProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const serviceTypeConfig: Record<string, { icon: any; label: string; color: string }> = {
  doctor_appointment: {
    icon: Stethoscope,
    label: "Doctor Appointment",
    color: "text-blue-600",
  },
  lab_test: {
    icon: TestTube,
    label: "Lab Test Booking",
    color: "text-purple-600",
  },
  lab_discount: {
    icon: TestTube,
    label: "Lab Test Discount",
    color: "text-red-600",
  },
  nursing_booking: {
    icon: HeartPulse,
    label: "Nursing Staff Booking",
    color: "text-pink-600",
  },
  home_sample: {
    icon: ShoppingBag,
    label: "Home Sample Collection",
    color: "text-green-600",
  },
  admin_adjustment: {
    icon: Settings,
    label: "Admin Adjustment",
    color: "text-gray-600",
  },
  other: {
    icon: ShoppingBag,
    label: "Service Booking",
    color: "text-gray-600",
  },
};

const WalletHistory = ({ transactions, isLoading }: WalletHistoryProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No transactions yet</p>
            <p className="text-sm mt-1">
              Book services to earn wallet credits!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {transactions.map((tx) => {
                const config =
                  serviceTypeConfig[tx.service_type] || serviceTypeConfig.other;
                const Icon = config.icon;
                const isCredit = tx.type === "credit";

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCredit ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        {isCredit ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{config.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), "dd MMM yyyy, hh:mm a")}
                        </p>
                        {tx.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {tx.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          isCredit ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isCredit ? "+" : "-"}{tx.credits.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">credits</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletHistory;
