import jsPDF from 'jspdf';

interface BookingDetails {
  uniqueId: string;
  labName: string;
  patientName?: string;
  patientPhone?: string;
  patientCity?: string;
  patientAge?: number;
  patientGender?: string;
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
  const margin = 15;
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
    doc.addImage(logoImg, 'PNG', margin, y, 22, 22);
  } catch (e) {
    console.log('Logo could not be loaded');
  }

  // Company Name - Center
  doc.setTextColor(75, 0, 130);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('My Pak Labs', pageWidth / 2, y + 10, { align: 'center' });

  // Contact Details - Two rows below company name
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  
  doc.text('Web: www.mypaklabs.com', pageWidth / 2 - 30, y + 18);
  doc.text('Phone: 0316-7523434', pageWidth / 2 + 25, y + 18);
  
  doc.text('Email: mhmmdaqib@gmail.com', pageWidth / 2 - 30, y + 24);
  doc.text('Address: Islamabad', pageWidth / 2 + 25, y + 24);

  y += 30;

  // Separator line
  doc.setDrawColor(75, 0, 130);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 6;

  // Document Title
  doc.setFillColor(75, 0, 130);
  doc.roundedRect(pageWidth / 2 - 35, y, 70, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Discount Booking Slip', pageWidth / 2, y + 7, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  y += 18;

  // Discount ID Box - Larger and prominent
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 32, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('Your Unique Discount ID', pageWidth / 2, y + 8, { align: 'center' });
  
  doc.setFontSize(28);
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.uniqueId, pageWidth / 2, y + 24, { align: 'center' });
  
  y += 40;

  // Patient & Lab Details - Two rows layout
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 36, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Patient & Lab Details', margin + 5, y + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  
  const col1X = margin + 5;
  const col2X = pageWidth / 2;
  
  // Row 1
  doc.text(`Name: ${booking.patientName || 'N/A'}`, col1X, y + 18);
  doc.text(`Lab: ${booking.labName}`, col2X, y + 18);
  
  // Row 2
  const ageGender = [
    booking.patientAge ? `Age: ${booking.patientAge}` : null,
    booking.patientGender ? `Gender: ${booking.patientGender}` : null
  ].filter(Boolean).join(' | ') || 'N/A';
  doc.text(ageGender, col1X, y + 28);
  
  // Discount badge inline
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text(`Discount: ${booking.discountPercentage}%`, col2X, y + 28);
  
  y += 44;

  // Booking & Validity dates
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  
  const bookingDate = booking.bookingDate || new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + (booking.validityDays || 7));
  const validityStr = validityDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  
  doc.text(`Booking Date: ${bookingDate}`, col1X, y);
  doc.setTextColor(16, 185, 129);
  doc.text(`Valid Until: ${validityStr}`, col2X, y);
  
  y += 10;

  // Tests Table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Selected Tests', margin, y);
  y += 8;

  // Table Header
  doc.setFillColor(75, 0, 130);
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Test Name', margin + 3, y + 7);
  doc.text('Original', pageWidth - margin - 75, y + 7);
  doc.text('Disc %', pageWidth - margin - 45, y + 7);
  doc.text('Final Price', pageWidth - margin - 20, y + 7, { align: 'right' });
  y += 12;

  // Tests List
  doc.setFont('helvetica', 'normal');
  let alternate = false;
  
  booking.tests.forEach((test, index) => {
    if (y > 245) {
      doc.addPage();
      y = 20;
    }
    
    // Alternate row background
    if (alternate) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y - 4, pageWidth - 2 * margin, 8, 'F');
    }
    alternate = !alternate;
    
    const testName = test.name.length > 32 ? test.name.substring(0, 32) + '...' : test.name;
    const discPercent = test.originalPrice > 0 
      ? Math.round((1 - test.discountedPrice / test.originalPrice) * 100)
      : 0;
    
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(9);
    doc.text(testName, margin + 3, y);
    
    doc.setTextColor(156, 163, 175);
    doc.text(`Rs. ${test.originalPrice.toLocaleString()}`, pageWidth - margin - 75, y);
    
    doc.setTextColor(16, 185, 129);
    doc.text(`${discPercent}%`, pageWidth - margin - 45, y);
    
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${test.discountedPrice.toLocaleString()}`, pageWidth - margin - 20, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    
    y += 8;
  });

  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Pricing Summary
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('Original Total:', margin, y);
  doc.setTextColor(156, 163, 175);
  doc.text(`Rs. ${booking.totalOriginal.toLocaleString()}`, pageWidth - margin - 5, y, { align: 'right' });
  y += 7;

  doc.setTextColor(107, 114, 128);
  doc.text(`Discount (${booking.discountPercentage}%):`, margin, y);
  doc.setTextColor(16, 185, 129);
  doc.text(`- Rs. ${booking.totalSavings.toLocaleString()}`, pageWidth - margin - 5, y, { align: 'right' });
  y += 10;

  // Total Box
  doc.setFillColor(75, 0, 130);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 16, 3, 3, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Final Amount to Pay:', margin + 5, y + 11);
  doc.setFontSize(14);
  doc.text(`Rs. ${booking.totalDiscounted.toLocaleString()}`, pageWidth - margin - 5, y + 11, { align: 'right' });
  
  y += 24;

  // Savings Badge
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 14, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(`You Save Rs. ${booking.totalSavings.toLocaleString()}!`, pageWidth / 2, y + 10, { align: 'center' });
  
  y += 22;

  // Instructions Box
  doc.setFillColor(254, 249, 195);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 48, 3, 3, 'F');
  
  doc.setTextColor(161, 98, 7);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Important Instructions:', margin + 5, y + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const instructions = [
    '1. Present this slip at the lab reception with your CNIC/ID',
    '2. Quote your Discount ID to avail the discounted prices',
    `3. This discount is valid for ${booking.validityDays || 7} days only`,
    '4. One-time use only - ID cannot be reused after redemption',
    '5. Original prescription may be required for certain tests'
  ];
  
  let instY = y + 18;
  instructions.forEach(inst => {
    doc.text(inst, margin + 5, instY);
    instY += 6;
  });
  
  y += 56;

  // Footer
  doc.setDrawColor(75, 0, 130);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  
  doc.setFontSize(8);
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
