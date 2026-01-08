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
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('My Pak Labs', pageWidth / 2, y + 12, { align: 'center' });

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
  
  y += 8;

  // Patient Details Section - Like template
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const col1X = margin;
  const col2X = margin + 65;
  const col3X = pageWidth / 2 + 10;
  const col4X = pageWidth / 2 + 55;
  
  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.text('Discount ID:', col1X, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(75, 0, 130);
  doc.text(booking.uniqueId, col2X, y);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', col3X, y);
  doc.setFont('helvetica', 'normal');
  doc.text(booking.patientName || 'N/A', col4X, y);
  
  y += 4;
  
  // Row 2
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Age/Gender:', col1X, y);
  doc.setFont('helvetica', 'normal');
  const ageGenderText = [
    booking.patientAge ? `${booking.patientAge}Y` : null,
    booking.patientGender || null
  ].filter(Boolean).join(' / ') || 'N/A';
  doc.text(ageGenderText, col2X, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Contact No:', col3X, y);
  doc.setFont('helvetica', 'normal');
  doc.text(booking.patientPhone || 'N/A', col4X, y);
  
  y += 4;
  
  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.text('Lab:', col1X, y);
  doc.setFont('helvetica', 'normal');
  doc.text(booking.labName, col2X, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Discount:', col3X, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text(`${booking.discountPercentage}%`, col4X, y);
  
  y += 6;
  
  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 8;

  // Table Header
  doc.setFillColor(75, 0, 130);
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Title', margin + 5, y + 7);
  doc.text('Rate', pageWidth - margin - 80, y + 7);
  doc.text('Discount', pageWidth - margin - 50, y + 7);
  doc.text('Payable', pageWidth - margin - 5, y + 7, { align: 'right' });
  y += 16;

  // Tests List
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  
  booking.tests.forEach((test, index) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    // Row border
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y + 4, pageWidth - margin, y + 4);
    
    const testName = test.name.length > 35 ? test.name.substring(0, 35) + '...' : test.name;
    const discPercent = test.originalPrice > 0 
      ? Math.round((1 - test.discountedPrice / test.originalPrice) * 100)
      : 0;
    
    doc.setTextColor(0, 0, 0);
    doc.text(testName, margin + 5, y);
    doc.text(`${test.originalPrice.toLocaleString()}`, pageWidth - margin - 80, y);
    doc.text(`${discPercent}%`, pageWidth - margin - 50, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${test.discountedPrice.toLocaleString()}`, pageWidth - margin - 5, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    
    y += 10;
  });

  // Total Row
  doc.setDrawColor(75, 0, 130);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Total', margin + 5, y);
  doc.text(`${booking.totalOriginal.toLocaleString()}`, pageWidth - margin - 80, y);
  doc.setTextColor(16, 185, 129);
  doc.text(`${booking.totalSavings.toLocaleString()}`, pageWidth - margin - 50, y);
  doc.setTextColor(75, 0, 130);
  doc.text(`${booking.totalDiscounted.toLocaleString()}`, pageWidth - margin - 5, y, { align: 'right' });
  
  y += 15;

  // Validity Info
  const bookingDate = booking.bookingDate || new Date().toLocaleDateString('en-PK', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
  
  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + (booking.validityDays || 7));
  const validityStr = validityDate.toLocaleDateString('en-PK', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Booking Date: ${bookingDate}`, margin, y);
  doc.text(`Valid Until: ${validityStr}`, pageWidth - margin - 50, y);
  
  y += 15;

  // Instructions Box
  doc.setFillColor(254, 249, 195);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 36, 2, 2, 'F');
  
  doc.setTextColor(161, 98, 7);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Important Instructions:', margin + 5, y + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const instructions = [
    '1. Present this slip at the lab reception with your CNIC/ID',
    '2. Quote your Discount ID to avail the discounted prices',
    `3. This discount is valid for ${booking.validityDays || 7} days only`,
    '4. One-time use only - ID cannot be reused after redemption'
  ];
  
  let instY = y + 14;
  instructions.forEach(inst => {
    doc.text(inst, margin + 5, instY);
    instY += 5;
  });
  
  y += 42;

  // Footer
  doc.setDrawColor(75, 0, 130);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  
  doc.setFontSize(10);
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
