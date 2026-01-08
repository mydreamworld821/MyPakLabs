import jsPDF from 'jspdf';

interface BookingDetails {
  uniqueId: string;
  labName: string;
  patientName?: string;
  patientPhone?: string;
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
  bookingDate?: string;
}

export const generateBookingPDF = async (booking: BookingDetails) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 10;

  // Load and add logo
  try {
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = reject;
      logoImg.src = '/images/mypaklabs-logo.png';
    });
    doc.addImage(logoImg, 'PNG', margin, y, 25, 25);
  } catch (e) {
    console.log('Logo could not be loaded');
  }

  // Company Name - Center
  doc.setTextColor(75, 0, 130); // Purple color matching logo
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('My Pak Labs', pageWidth / 2, y + 12, { align: 'center' });

  // Contact Details - Two rows below company name
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  
  // Row 1: Web and Phone
  doc.text('Web: www.mypaklabs.com', pageWidth / 2 - 30, y + 22);
  doc.text('0316-7523434', pageWidth / 2 + 30, y + 22);
  
  // Row 2: Email and Address
  doc.text('Email: mhmmdaqib@gmail.com', pageWidth / 2 - 30, y + 28);
  doc.text('Address: Islamabad', pageWidth / 2 + 30, y + 28);

  y += 35;

  // Separator line
  doc.setDrawColor(75, 0, 130);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 8;

  // Document Title
  doc.setFillColor(75, 0, 130);
  doc.roundedRect(pageWidth / 2 - 40, y, 80, 12, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Discount Booking Slip', pageWidth / 2, y + 8, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);
  y += 25;

  // Discount ID Box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y - 10, pageWidth - 2 * margin, 40, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('Your Unique Discount ID', pageWidth / 2, y, { align: 'center' });
  
  doc.setFontSize(24);
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.uniqueId, pageWidth / 2, y + 18, { align: 'center' });
  
  y += 50;

  // Lab & Patient Information
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Booking Details', margin, y);
  y += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  
  doc.text(`Lab: ${booking.labName}`, margin, y);
  y += 7;
  
  if (booking.patientName) {
    doc.text(`Patient: ${booking.patientName}`, margin, y);
    y += 7;
  }
  
  if (booking.patientPhone) {
    doc.text(`Phone: ${booking.patientPhone}`, margin, y);
    y += 7;
  }
  
  const bookingDate = booking.bookingDate || new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(`Booking Date: ${bookingDate}`, margin, y);
  y += 7;
  
  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + (booking.validityDays || 7));
  doc.setTextColor(16, 185, 129);
  doc.text(`Valid Until: ${validityDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, margin, y);
  y += 15;

  // Discount Badge
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(margin, y - 3, 80, 14, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${booking.discountPercentage}% DISCOUNT APPLIED`, margin + 5, y + 6);
  y += 20;

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
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    
    const testName = test.name.length > 35 ? test.name.substring(0, 35) + '...' : test.name;
    doc.text(testName, margin + 5, y);
    doc.setTextColor(156, 163, 175);
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
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 18, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text(`🎉 You save Rs. ${booking.totalSavings.toLocaleString()}!`, pageWidth / 2, y + 12, { align: 'center' });
  
  y += 30;

  // Instructions Box
  doc.setFillColor(254, 249, 195); // Light yellow
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 55, 3, 3, 'F');
  
  doc.setTextColor(161, 98, 7); // Dark yellow
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('📋 Important Instructions:', margin + 5, y + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y += 18;
  doc.text('1. Present this slip at the lab reception', margin + 5, y);
  y += 7;
  doc.text('2. Provide your Discount ID to avail the discounted price', margin + 5, y);
  y += 7;
  doc.text(`3. This discount is valid for ${booking.validityDays || 7} days only`, margin + 5, y);
  y += 7;
  doc.text('4. One-time use only - ID cannot be reused after redemption', margin + 5, y);
  y += 7;
  doc.text('5. Original prescription may be required for certain tests', margin + 5, y);
  
  y += 20;

  // Footer
  doc.setDrawColor(75, 0, 130);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  
  doc.setFontSize(9);
  doc.setTextColor(75, 0, 130);
  doc.setFont('helvetica', 'bold');
  doc.text('My Pak Labs', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
  doc.text('www.mypaklabs.com', pageWidth - margin, y, { align: 'right' });

  // Save the PDF
  doc.save(`MyPakLabs-Booking-${booking.uniqueId}.pdf`);
};
