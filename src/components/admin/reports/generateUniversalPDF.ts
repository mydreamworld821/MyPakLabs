import jsPDF from "jspdf";
import { format } from "date-fns";
import { toast } from "sonner";
import type { BookingCategory, UniversalOrder, EntityOption } from "./types";

export const generateUniversalPDF = (
  orders: UniversalOrder[],
  grouped: Record<BookingCategory, UniversalOrder[]>,
  selectedCategories: BookingCategory[],
  categoryLabels: Record<BookingCategory, string>,
  startDate: string,
  endDate: string,
  selectedEntity: string,
  entityOptions: EntityOption[]
) => {
  if (orders.length === 0) {
    toast.error("No data to export");
    return;
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const usableWidth = pageWidth - margin * 2;
  const fontSize = 8;
  const lineHeight = 4.5;
  const cellPadding = 2.5;
  const headerHeight = 8;

  const entityLabel = selectedEntity === "all"
    ? "All"
    : entityOptions.find(e => e.id === selectedEntity)?.name || "Selected";

  // Header
  doc.setFillColor(0, 102, 153);
  doc.rect(0, 0, pageWidth, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("MyPakLabs - Universal Booking Report", margin, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const cats = selectedCategories.map(c => categoryLabels[c]).join(", ");
  doc.text(
    `Date: ${format(new Date(startDate), "dd MMM yyyy")} - ${format(new Date(endDate), "dd MMM yyyy")}  |  Filter: ${entityLabel}  |  Categories: ${cats}  |  Total: ${orders.length}`,
    margin, 19
  );

  let y = 28;

  const cols = [
    { header: "Name", width: usableWidth * 0.14 },
    { header: "Patient", width: usableWidth * 0.12 },
    { header: "Date", width: usableWidth * 0.09 },
    { header: "Status", width: usableWidth * 0.08 },
    { header: "Details", width: usableWidth * 0.33 },
    { header: "Total", width: usableWidth * 0.12 },
    { header: "Final", width: usableWidth * 0.12 },
  ];

  const drawSectionHeader = (title: string, count: number) => {
    if (y + 16 > pageHeight - 15) { doc.addPage(); y = 10; }
    y += 4;
    doc.setFillColor(230, 240, 250);
    doc.rect(margin, y, usableWidth, 9, "F");
    doc.setTextColor(0, 70, 120);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${title} (${count})`, margin + 3, y + 6.5);
    y += 12;
  };

  const drawTableHeader = () => {
    if (y + headerHeight > pageHeight - 15) { doc.addPage(); y = 10; }
    doc.setFillColor(0, 102, 153);
    doc.rect(margin, y, usableWidth, headerHeight, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "bold");
    let x = margin;
    cols.forEach(col => {
      doc.text(col.header, x + 2, y + 5.5);
      x += col.width;
    });
    y += headerHeight;
  };

  const drawRow = (order: UniversalOrder, idx: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);

    const nameLines = doc.splitTextToSize(order.entityName || "N/A", cols[0].width - 4);
    const patientLines = doc.splitTextToSize(order.patientName || "Unknown", cols[1].width - 4);
    const detailLines = doc.splitTextToSize(order.items || "-", cols[4].width - 4);

    const maxLines = Math.max(nameLines.length, patientLines.length, detailLines.length, 1);
    const rowHeight = Math.max(maxLines * lineHeight + cellPadding * 2, 8);

    if (y + rowHeight > pageHeight - 15) {
      doc.addPage();
      y = 10;
      drawTableHeader();
    }

    // Alternate row bg
    doc.setFillColor(idx % 2 === 0 ? 245 : 255, idx % 2 === 0 ? 247 : 255, idx % 2 === 0 ? 250 : 255);
    doc.rect(margin, y, usableWidth, rowHeight, "F");

    // Row border
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowHeight, margin + usableWidth, y + rowHeight);

    const textY = y + cellPadding + 3;
    doc.setTextColor(40, 40, 40);
    let x = margin;

    // Name
    doc.text(nameLines, x + 2, textY);
    x += cols[0].width;

    // Patient
    doc.text(patientLines, x + 2, textY);
    x += cols[1].width;

    // Date
    doc.text(format(new Date(order.bookingDate), "dd MMM yyyy"), x + 2, textY);
    x += cols[2].width;

    // Status
    if (order.isAvailed) doc.setTextColor(0, 128, 0);
    else doc.setTextColor(200, 100, 0);
    doc.text(order.status, x + 2, textY);
    doc.setTextColor(40, 40, 40);
    x += cols[3].width;

    // Details - same font, properly wrapped
    doc.text(detailLines, x + 2, textY);
    x += cols[4].width;

    // Total
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${order.originalTotal.toLocaleString()}`, x + 2, textY);
    x += cols[5].width;

    // Final
    doc.setTextColor(0, 102, 153);
    doc.text(`Rs. ${order.discountedTotal.toLocaleString()}`, x + 2, textY);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");

    y += rowHeight;
  };

  const drawSectionTotals = (catOrders: UniversalOrder[], label: string) => {
    const orig = catOrders.reduce((s, o) => s + o.originalTotal, 0);
    const disc = catOrders.reduce((s, o) => s + o.discountedTotal, 0);
    const availed = catOrders.filter(o => o.isAvailed).length;

    if (y + 10 > pageHeight - 15) { doc.addPage(); y = 10; }
    y += 2;
    doc.setFillColor(240, 245, 250);
    doc.rect(margin, y, usableWidth, 14, "F");
    doc.setTextColor(0, 70, 120);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`${label} Summary:  Orders: ${catOrders.length}  |  Completed: ${availed}  |  Total: Rs. ${orig.toLocaleString()}  |  Final: Rs. ${disc.toLocaleString()}  |  Savings: Rs. ${(orig - disc).toLocaleString()}`, margin + 3, y + 9);
    y += 18;
  };

  // Render each category section
  selectedCategories.forEach(cat => {
    const catOrders = grouped[cat];
    if (catOrders.length === 0) return;

    drawSectionHeader(categoryLabels[cat], catOrders.length);
    drawTableHeader();
    catOrders.forEach((order, idx) => drawRow(order, idx));
    drawSectionTotals(catOrders, categoryLabels[cat]);
  });

  // Grand summary
  if (selectedCategories.length > 1) {
    if (y + 20 > pageHeight - 15) { doc.addPage(); y = 10; }
    y += 4;
    doc.setFillColor(0, 102, 153);
    doc.rect(margin, y, usableWidth, 16, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const grandOrig = orders.reduce((s, o) => s + o.originalTotal, 0);
    const grandDisc = orders.reduce((s, o) => s + o.discountedTotal, 0);
    doc.text(`Grand Total:  ${orders.length} Bookings  |  Total: Rs. ${grandOrig.toLocaleString()}  |  Final: Rs. ${grandDisc.toLocaleString()}  |  Savings: Rs. ${(grandOrig - grandDisc).toLocaleString()}`, margin + 3, y + 10);
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.text(`Generated on ${format(new Date(), "dd MMM yyyy, hh:mm a")} | MyPakLabs | Page ${i}/${totalPages}`, margin, pageHeight - 5);
  }

  doc.save(`Universal-Report-${format(new Date(startDate), "dd-MMM-yyyy")}-to-${format(new Date(endDate), "dd-MMM-yyyy")}.pdf`);
  toast.success("PDF downloaded successfully!");
};
