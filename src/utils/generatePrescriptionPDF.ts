import jsPDF from 'jspdf';

interface PrescriptionPDFDetails {
  prescriptionId: string;
  labName: string;
  labDiscount: number;
  tests: Array<{
    name: string;
    price: number;
    originalPrice?: number;
  }>;
  subtotal: number;
  discountAmount: number;
  total: number;
  approvedDate: string;
  patientName?: string;
}

export const generatePrescriptionPDF = (details: PrescriptionPDFDetails) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Header
  doc.setFillColor(79, 70, 229); // Primary color
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('MediCompare', margin, 30);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Approved Prescription Slip', margin, 42);

  // Reset text color
  doc.setTextColor(0, 0, 0);
  y = 70;

  // Prescription ID Box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y - 10, pageWidth - 2 * margin, 35, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('Prescription Reference', pageWidth / 2, y, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${details.prescriptionId.slice(0, 8).toUpperCase()}`, pageWidth / 2, y + 15, { align: 'center' });
  
  y += 45;

  // Patient & Lab Information
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Details', margin, y);
  y += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  
  if (details.patientName) {
    doc.text(`Patient: ${details.patientName}`, margin, y);
    y += 7;
  }
  
  doc.text(`Lab: ${details.labName}`, margin, y);
  y += 7;
  
  doc.text(`Approved On: ${details.approvedDate}`, margin, y);
  y += 7;
  
  if (details.labDiscount > 0) {
    doc.setTextColor(16, 185, 129);
    doc.text(`Lab Discount: ${details.labDiscount}% OFF`, margin, y);
    doc.setTextColor(75, 85, 99);
    y += 7;
  }
  
  y += 10;

  // Tests Table Header
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Approved Tests', margin, y);
  y += 10;

  // Table Header
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, y - 5, pageWidth - 2 * margin, 10, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('Test Name', margin + 5, y + 2);
  doc.text('Original', pageWidth - margin - 55, y + 2);
  doc.text('Discounted', pageWidth - margin - 20, y + 2);
  y += 12;

  // Tests List
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'normal');
  
  details.tests.forEach((test) => {
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    const testName = test.name.length > 35 ? test.name.substring(0, 35) + '...' : test.name;
    const originalPrice = test.originalPrice || test.price;
    doc.text(testName, margin + 5, y);
    doc.setTextColor(156, 163, 175);
    doc.text(`Rs. ${originalPrice.toLocaleString()}`, pageWidth - margin - 55, y);
    doc.setTextColor(16, 185, 129);
    doc.text(`Rs. ${test.price.toLocaleString()}`, pageWidth - margin - 20, y);
    doc.setTextColor(55, 65, 81);
    y += 8;
  });

  y += 5;
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  // Pricing Summary
  doc.setFontSize(11);
  doc.setTextColor(107, 114, 128);
  doc.text('Subtotal:', margin, y);
  doc.setTextColor(55, 65, 81);
  doc.text(`Rs. ${details.subtotal.toLocaleString()}`, pageWidth - margin - 25, y);
  y += 8;

  if (details.labDiscount > 0 && details.discountAmount > 0) {
    doc.setTextColor(107, 114, 128);
    doc.text(`Discount (${details.labDiscount}%):`, margin, y);
    doc.setTextColor(16, 185, 129);
    doc.text(`- Rs. ${details.discountAmount.toLocaleString()}`, pageWidth - margin - 25, y);
    y += 12;
  } else {
    y += 4;
  }

  // Total
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y - 5, pageWidth - 2 * margin, 18, 3, 3, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Total Amount:', margin + 5, y + 7);
  doc.setTextColor(79, 70, 229);
  doc.text(`Rs. ${details.total.toLocaleString()}`, pageWidth - margin - 25, y + 7);
  
  y += 30;

  // Savings Badge (only if there's a discount)
  if (details.discountAmount > 0) {
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 15, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(`You save Rs. ${details.discountAmount.toLocaleString()}!`, pageWidth / 2, y + 10, { align: 'center' });
    y += 30;
  }

  // Instructions
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Instructions:', margin, y);
  y += 7;
  doc.text('1. Take this slip along with your original prescription to the lab', margin + 5, y);
  y += 6;
  doc.text('2. Show the prescription reference number at the reception', margin + 5, y);
  y += 6;
  doc.text('3. Avail the discounted prices as shown above', margin + 5, y);
  y += 15;

  // Footer
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, y);
  doc.text('www.medicompare.pk', pageWidth - margin, y, { align: 'right' });

  // Save the PDF
  doc.save(`Prescription-${details.prescriptionId.slice(0, 8).toUpperCase()}.pdf`);
};
