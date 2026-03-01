import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { UniversalOrder, BookingCategory } from "./types";

interface ReportTableProps {
  orders: UniversalOrder[];
  category: BookingCategory;
}

const entityHeader: Record<BookingCategory, string> = {
  lab: "Lab Name",
  doctor: "Doctor Name",
  nurse: "Nurse Name",
  pharmacy: "Pharmacy Name",
};

const itemHeader: Record<BookingCategory, string> = {
  lab: "Tests / Packages",
  doctor: "Consultation Details",
  nurse: "Service Details",
  pharmacy: "Medicines",
};

export const ReportTable = ({ orders, category }: ReportTableProps) => {
  const totals = orders.reduce(
    (acc, o) => ({ orig: acc.orig + o.originalTotal, disc: acc.disc + o.discountedTotal }),
    { orig: 0, disc: 0 }
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>{entityHeader[category]}</TableHead>
            <TableHead>Patient Name</TableHead>
            <TableHead>Booking Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>{itemHeader[category]}</TableHead>
            <TableHead className="text-right">Total Price</TableHead>
            <TableHead className="text-right">Final Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, idx) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{idx + 1}</TableCell>
              <TableCell className="font-medium">{order.entityName}</TableCell>
              <TableCell>{order.patientName}</TableCell>
              <TableCell>{format(new Date(order.bookingDate), "dd MMM yyyy")}</TableCell>
              <TableCell>
                <Badge
                  variant={order.isAvailed ? "default" : "secondary"}
                  className={order.isAvailed ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[300px]">
                <p className="text-xs whitespace-pre-wrap break-words">{order.items}</p>
              </TableCell>
              <TableCell className="text-right font-medium">Rs. {order.originalTotal.toLocaleString()}</TableCell>
              <TableCell className="text-right font-medium text-primary">Rs. {order.discountedTotal.toLocaleString()}</TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/50 font-bold">
            <TableCell colSpan={6} className="text-right">Sub Total:</TableCell>
            <TableCell className="text-right">Rs. {totals.orig.toLocaleString()}</TableCell>
            <TableCell className="text-right text-primary">Rs. {totals.disc.toLocaleString()}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
