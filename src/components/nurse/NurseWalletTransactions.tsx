import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, Siren, Calendar } from "lucide-react";
import { NurseWalletTransaction } from "@/hooks/useNurseWallet";
import { format } from "date-fns";

interface NurseWalletTransactionsProps {
  transactions: NurseWalletTransaction[];
}

export const NurseWalletTransactions = ({ transactions }: NurseWalletTransactionsProps) => {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Earnings History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-8">
            No transactions yet. Complete bookings to see your earnings here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5" />
          Earnings History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    transaction.booking_type === 'emergency' 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {transaction.booking_type === 'emergency' ? (
                      <Siren className="h-4 w-4" />
                    ) : (
                      <Calendar className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium capitalize">
                      {transaction.booking_type} Booking
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(transaction.created_at), 'PPp')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    +Rs. {transaction.net_amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total: Rs. {transaction.amount.toLocaleString()} | 
                    Commission: Rs. {transaction.commission_amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
