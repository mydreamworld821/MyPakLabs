import jsPDF from 'jspdf';

interface BookingDetails {
  uniqueId: string;
  labName: string;
  tests: Array<{
    name: string;
    originalPrice: number;
    discountedPrice: number;
  }>;
  totalOriginal: number;
  totalDiscounted: number;
  totalSavings: number;
  discountPercentage: number;
  validityDays?: number;
}

export const generateBookingPDF = (booking: BookingDetails) => {
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
  doc.text('Discount Booking Slip', margin, 42);

  // Reset text color
  doc.setTextColor(0, 0, 0);
  y = 70;

  // Discount ID Box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y - 10, pageWidth - 2 * margin, 35, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('Your Unique Discount ID', pageWidth / 2, y, { align: 'center' });
  
  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.uniqueId, pageWidth / 2, y + 15, { align: 'center' });
  
  y += 45;

  // Lab Information
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Lab Details', margin, y);
  y += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(`Lab: ${booking.labName}`, margin, y);
  y += 7;
  
  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + (booking.validityDays || 7));
  doc.text(`Valid Until: ${validityDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, margin, y);
  y += 15;

  // Tests Table Header
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Selected Tests', margin, y);
  y += 10;

  // Table Header
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, y - 5, pageWidth - 2 * margin, 10, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('Test Name', margin + 5, y + 2);
  doc.text('Original', pageWidth - margin - 70, y + 2);
  doc.text('Discounted', pageWidth - margin - 25, y + 2);
  y += 12;

  // Tests List
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'normal');
  
  booking.tests.forEach((test) => {
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    const testName = test.name.length > 35 ? test.name.substring(0, 35) + '...' : test.name;
    doc.text(testName, margin + 5, y);
    doc.text(`Rs. ${test.originalPrice.toLocaleString()}`, pageWidth - margin - 70, y);
    doc.setTextColor(16, 185, 129);
    doc.text(`Rs. ${test.discountedPrice.toLocaleString()}`, pageWidth - margin - 25, y);
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
  doc.setTextColor(156, 163, 175);
  doc.text(`Rs. ${booking.totalOriginal.toLocaleString()}`, pageWidth - margin - 25, y);
  y += 8;

  doc.setTextColor(107, 114, 128);
  doc.text(`Discount (${booking.discountPercentage}%):`, margin, y);
  doc.setTextColor(16, 185, 129);
  doc.text(`- Rs. ${booking.totalSavings.toLocaleString()}`, pageWidth - margin - 25, y);
  y += 12;

  // Total
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y - 5, pageWidth - 2 * margin, 18, 3, 3, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Total Amount:', margin + 5, y + 7);
  doc.setTextColor(79, 70, 229);
  doc.text(`Rs. ${booking.totalDiscounted.toLocaleString()}`, pageWidth - margin - 25, y + 7);
  
  y += 30;

  // Savings Badge
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 15, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(`You save Rs. ${booking.totalSavings.toLocaleString()}!`, pageWidth / 2, y + 10, { align: 'center' });
  
  y += 30;

  // Instructions
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Instructions:', margin, y);
  y += 7;
  doc.text('1. Show this slip at the lab reception', margin + 5, y);
  y += 6;
  doc.text('2. Provide your Discount ID to avail the discounted price', margin + 5, y);
  y += 6;
  doc.text('3. This discount is valid for 7 days from the booking date', margin + 5, y);
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
  doc.save(`MediCompare-Booking-${booking.uniqueId}.pdf`);
};
