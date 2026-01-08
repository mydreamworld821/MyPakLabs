import jsPDF from 'jspdf';

interface PrescriptionPDFDetails {
  prescriptionId: string;
  uniqueId?: string;
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
  patientPhone?: string;
  adminNotes?: string;
  validityDays?: number;
}

export const generatePrescriptionPDF = async (details: PrescriptionPDFDetails) => {
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
  doc.roundedRect(pageWidth / 2 - 45, y, 90, 12, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Approved Prescription Slip', pageWidth / 2, y + 8, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);
  y += 25;

  // Prescription ID Box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y - 10, pageWidth - 2 * margin, 45, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('Your Discount ID', pageWidth / 2, y, { align: 'center' });
  
  // Use uniqueId if provided, otherwise generate from prescriptionId
  const displayId = details.uniqueId || `#${details.prescriptionId.slice(0, 8).toUpperCase()}`;
  
  doc.setFontSize(24);
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.text(displayId, pageWidth / 2, y + 18, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('Show this ID at the lab to avail discount', pageWidth / 2, y + 28, { align: 'center' });
  
  y += 55;

  // Patient & Lab Information
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Prescription Details', margin, y);
  y += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  
  if (details.patientName) {
    doc.text(`Patient: ${details.patientName}`, margin, y);
    y += 7;
  }
  
  if (details.patientPhone) {
    doc.text(`Phone: ${details.patientPhone}`, margin, y);
    y += 7;
  }
  
  doc.text(`Lab: ${details.labName}`, margin, y);
  y += 7;
  
  doc.text(`Approved On: ${details.approvedDate}`, margin, y);
  y += 7;
  
  // Validity
  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + (details.validityDays || 7));
  doc.setTextColor(16, 185, 129);
  doc.text(`Valid Until: ${validityDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, margin, y);
  y += 7;
  
  if (details.labDiscount > 0) {
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(margin, y, 80, 14, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${details.labDiscount}% DISCOUNT APPLIED`, margin + 5, y + 9);
    y += 18;
  }
  
  y += 5;

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
    if (y > 230) {
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
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 18, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text(`🎉 You save Rs. ${details.discountAmount.toLocaleString()}!`, pageWidth / 2, y + 12, { align: 'center' });
    y += 28;
  }

  // Admin Notes (if any)
  if (details.adminNotes) {
    doc.setFillColor(239, 246, 255); // Light blue
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 25, 3, 3, 'F');
    doc.setTextColor(30, 64, 175); // Dark blue
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('📝 Admin Notes:', margin + 5, y + 10);
    doc.setFont('helvetica', 'normal');
    const notesText = details.adminNotes.length > 80 ? details.adminNotes.substring(0, 80) + '...' : details.adminNotes;
    doc.text(notesText, margin + 5, y + 19);
    y += 32;
  }

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
  doc.text('1. Take this slip along with your original prescription to the lab', margin + 5, y);
  y += 7;
  doc.text('2. Show the Discount ID at the reception', margin + 5, y);
  y += 7;
  doc.text('3. Avail the discounted prices as shown above', margin + 5, y);
  y += 7;
  doc.text(`4. This slip is valid for ${details.validityDays || 7} days only`, margin + 5, y);
  y += 7;
  doc.text('5. One-time use only - cannot be reused after redemption', margin + 5, y);

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
  const fileName = details.uniqueId 
    ? `MyPakLabs-Prescription-${details.uniqueId}.pdf`
    : `Prescription-${details.prescriptionId.slice(0, 8).toUpperCase()}.pdf`;
  doc.save(fileName);
};
