import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, FileText, Filter, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface OrderRow {
  id: string;
  unique_id: string;
  user_id: string;
  lab_id: string | null;
  tests: any[];
  original_total: number;
  discounted_total: number;
  discount_percentage: number;
  is_availed: boolean;
  availed_at: string | null;
  created_at: string;
  status: string;
  lab_name?: string;
  patient_name?: string;
}

interface Lab {
  id: string;
  name: string;
}

const LabReports = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLab, setSelectedLab] = useState<string>("all");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return format(d, "yyyy-MM-dd");
  });
  const [endDate, setEndDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  // Fetch labs list
  useEffect(() => {
    const fetchLabs = async () => {
      const { data } = await supabase.from("labs").select("id, name").order("name");
      if (data) setLabs(data);
    };
    fetchLabs();
  }, []);

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select("id, unique_id, user_id, lab_id, tests, original_total, discounted_total, discount_percentage, is_availed, availed_at, created_at, status")
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: false });

      if (selectedLab !== "all") {
        query = query.eq("lab_id", selectedLab);
      }

      const { data: ordersData, error } = await query;
      if (error) throw error;

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch lab names
      const labIds = [...new Set(ordersData.map((o) => o.lab_id).filter(Boolean))];
      const { data: labsData } = await supabase.from("labs").select("id, name").in("id", labIds);
      const labMap: Record<string, string> = {};
      labsData?.forEach((l) => (labMap[l.id] = l.name));

      // Fetch patient names
      const userIds = [...new Set(ordersData.map((o) => o.user_id))];
      const { data: profilesData } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const profileMap: Record<string, string> = {};
      profilesData?.forEach((p) => (profileMap[p.user_id] = p.full_name || "Unknown"));

      const enriched = ordersData.map((o) => ({
        ...o,
        tests: Array.isArray(o.tests) ? o.tests : [],
        lab_name: o.lab_id ? labMap[o.lab_id] || "Unknown Lab" : "N/A",
        patient_name: profileMap[o.user_id] || "Unknown",
      }));

      setOrders(enriched);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [startDate, endDate, selectedLab]);

  // Totals
  const totals = useMemo(() => {
    const totalOriginal = orders.reduce((s, o) => s + Number(o.original_total || 0), 0);
    const totalDiscounted = orders.reduce((s, o) => s + Number(o.discounted_total || 0), 0);
    return { totalOriginal, totalDiscounted, totalSavings: totalOriginal - totalDiscounted };
  }, [orders]);

  // Generate PDF
  const generatePDF = () => {
    if (orders.length === 0) {
      toast.error("No data to export");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pageWidth - margin * 2;

    // Header
    doc.setFillColor(0, 102, 153);
    doc.rect(0, 0, pageWidth, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("MyPakLabs - Lab Details Report", margin, 14);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const labLabel = selectedLab === "all" ? "All Labs" : labs.find((l) => l.id === selectedLab)?.name || "Selected Lab";
    doc.text(`Date: ${format(new Date(startDate), "dd MMM yyyy")} - ${format(new Date(endDate), "dd MMM yyyy")}  |  Lab: ${labLabel}  |  Total Orders: ${orders.length}`, margin, 20);

    // Column definitions
    const cols = [
      { header: "Lab Name", width: usableWidth * 0.15 },
      { header: "Patient Name", width: usableWidth * 0.12 },
      { header: "Booking Date", width: usableWidth * 0.10 },
      { header: "Avail Date", width: usableWidth * 0.10 },
      { header: "Availed", width: usableWidth * 0.08 },
      { header: "Test Names", width: usableWidth * 0.23 },
      { header: "Total Price", width: usableWidth * 0.11 },
      { header: "Discount Price", width: usableWidth * 0.11 },
    ];

    let y = 28;
    const lineHeight = 5;
    const cellPadding = 3;
    const headerHeight = 9;

    const drawTableHeader = () => {
      doc.setFillColor(0, 102, 153);
      doc.rect(margin, y, usableWidth, headerHeight, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      let x = margin;
      cols.forEach((col) => {
        doc.text(col.header, x + 2, y + 6);
        x += col.width;
      });
      y += headerHeight;
    };

    drawTableHeader();

    // Calculate total discount availed
    const totalDiscountAvailed = orders
      .filter((o) => o.is_availed)
      .reduce((s, o) => s + Number(o.discounted_total || 0), 0);

    // Total tests count
    const totalTests = orders.reduce((s, o) => s + (o.tests?.length || 0), 0);

    orders.forEach((order, idx) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      // Pre-calculate wrapped text for all columns
      const labLines = doc.splitTextToSize(order.lab_name || "N/A", cols[0].width - 4);
      const patientLines = doc.splitTextToSize(order.patient_name || "Unknown", cols[1].width - 4);
      const testNames = order.tests.map((t: any) => t.test_name || "Unknown").join(", ");
      const testLines = doc.splitTextToSize(testNames, cols[5].width - 4);
      const availText = order.is_availed ? "Availed" : "Not Availed";

      // Calculate row height based on tallest cell
      const maxLines = Math.max(labLines.length, patientLines.length, testLines.length, 1);
      const rowHeight = Math.max(maxLines * lineHeight + cellPadding * 2, 10);

      // Page break check
      if (y + rowHeight > pageHeight - 20) {
        doc.addPage();
        y = 10;
        drawTableHeader();
      }

      // Alternate row background
      if (idx % 2 === 0) {
        doc.setFillColor(245, 247, 250);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(margin, y, usableWidth, rowHeight, "F");

      // Draw bottom border for each row
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, y + rowHeight, margin + usableWidth, y + rowHeight);

      // Draw vertical column separators
      let separatorX = margin;
      cols.forEach((col) => {
        separatorX += col.width;
        if (separatorX < margin + usableWidth) {
          doc.setDrawColor(230, 230, 230);
          doc.setLineWidth(0.2);
          doc.line(separatorX, y, separatorX, y + rowHeight);
        }
      });

      const textY = y + cellPadding + 3;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      let x = margin;

      // Lab Name
      doc.text(labLines, x + 2, textY);
      x += cols[0].width;

      // Patient Name
      doc.text(patientLines, x + 2, textY);
      x += cols[1].width;

      // Booking Date
      doc.text(format(new Date(order.created_at), "dd MMM yyyy"), x + 2, textY);
      x += cols[2].width;

      // Avail Date
      doc.text(order.availed_at ? format(new Date(order.availed_at), "dd MMM yyyy") : "-", x + 2, textY);
      x += cols[3].width;

      // Availed status
      if (order.is_availed) {
        doc.setTextColor(0, 128, 0);
      } else {
        doc.setTextColor(200, 0, 0);
      }
      doc.text(availText, x + 2, textY);
      doc.setTextColor(40, 40, 40);
      x += cols[4].width;

      // Test Names
      doc.text(testLines, x + 2, textY);
      x += cols[5].width;

      // Total Price
      doc.setFont("helvetica", "bold");
      doc.text(`Rs. ${Number(order.original_total).toLocaleString()}`, x + 2, textY);
      x += cols[6].width;

      // Discount Price
      doc.setTextColor(0, 102, 153);
      doc.text(`Rs. ${Number(order.discounted_total).toLocaleString()}`, x + 2, textY);
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "normal");

      y += rowHeight;
    });

    // Summary footer — line by line
    const summaryLineHeight = 8;
    const summaryLines = 5;
    const summaryHeight = summaryLines * summaryLineHeight + 10;

    if (y + summaryHeight + 10 > pageHeight - 10) {
      doc.addPage();
      y = 10;
    }

    y += 8;
    doc.setFillColor(0, 102, 153);
    doc.rect(margin, y, usableWidth, summaryHeight, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");

    let sy = y + 8;
    doc.text(`Total Orders:  ${orders.length}`, margin + 5, sy);
    sy += summaryLineHeight;
    doc.text(`Total Tests:  ${totalTests}`, margin + 5, sy);
    sy += summaryLineHeight;
    doc.text(`Total Price of Tests:  Rs. ${totals.totalOriginal.toLocaleString()}`, margin + 5, sy);
    sy += summaryLineHeight;
    doc.text(`Total Discount of Tests:  Rs. ${totals.totalDiscounted.toLocaleString()}`, margin + 5, sy);
    sy += summaryLineHeight;
    doc.text(`Total Discount Availed:  Rs. ${totalDiscountAvailed.toLocaleString()}`, margin + 5, sy);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${format(new Date(), "dd MMM yyyy, hh:mm a")} | MyPakLabs`, margin, pageHeight - 5);

    doc.save(`Lab-Report-${format(new Date(startDate), "dd-MMM-yyyy")}-to-${format(new Date(endDate), "dd-MMM-yyyy")}.pdf`);
    toast.success("PDF downloaded successfully!");
  };

  return (
    <AdminLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Lab Reports</h1>
            <p className="text-muted-foreground text-sm">Generate and download detailed lab booking reports</p>
          </div>
          <Button onClick={generatePDF} disabled={orders.length === 0} className="gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Start Date</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Date</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Select Lab</label>
                <Select value={selectedLab} onValueChange={setSelectedLab}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Labs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Labs</SelectItem>
                    {labs.map((lab) => (
                      <SelectItem key={lab.id} value={lab.id}>{lab.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{orders.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Total Original</p>
              <p className="text-2xl font-bold text-foreground">Rs. {totals.totalOriginal.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Total Discounted</p>
              <p className="text-2xl font-bold text-primary">Rs. {totals.totalDiscounted.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Total Savings</p>
              <p className="text-2xl font-bold text-green-600">Rs. {totals.totalSavings.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <FileText className="w-12 h-12 mb-3 opacity-40" />
                <p className="font-medium">No orders found</p>
                <p className="text-sm">Try adjusting the date range or lab filter</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Lab Name</TableHead>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Booking Date</TableHead>
                      <TableHead>Avail Date</TableHead>
                      <TableHead>Availed</TableHead>
                      <TableHead>Test Names</TableHead>
                      <TableHead className="text-right">Total Price</TableHead>
                      <TableHead className="text-right">Discount Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order, idx) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{order.lab_name}</TableCell>
                        <TableCell>{order.patient_name}</TableCell>
                        <TableCell>{format(new Date(order.created_at), "dd MMM yyyy")}</TableCell>
                        <TableCell>{order.availed_at ? format(new Date(order.availed_at), "dd MMM yyyy") : "-"}</TableCell>
                        <TableCell>
                          <Badge variant={order.is_availed ? "default" : "secondary"} className={order.is_availed ? "bg-green-500 hover:bg-green-600" : ""}>
                            {order.is_availed ? "Availed" : "Not Availed"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          <div className="space-y-0.5">
                            {order.tests.map((t: any, i: number) => (
                              <div key={i} className="text-xs">
                                {t.test_name || "Unknown"}
                                <span className="text-muted-foreground ml-1">(Rs. {Number(t.price || 0).toLocaleString()} → Rs. {Number(t.discounted_price || 0).toLocaleString()})</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">Rs. {Number(order.original_total).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium text-primary">Rs. {Number(order.discounted_total).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={7} className="text-right">Grand Total:</TableCell>
                      <TableCell className="text-right">Rs. {totals.totalOriginal.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-primary">Rs. {totals.totalDiscounted.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default LabReports;
