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
  patientCity?: string;
  patientAge?: number;
  patientGender?: string;
  adminNotes?: string;
  validityDays?: number;
}

export const generatePrescriptionPDF = async (details: PrescriptionPDFDetails) => {
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
  
  // Center align contact details
  doc.text('Web: www.mypaklabs.com  |  Phone: 0316-7523434', pageWidth / 2, y + 18, { align: 'center' });
  doc.text('Email: support@mypaklabs.com  |  Address: Islamabad, Pakistan', pageWidth / 2, y + 24, { align: 'center' });

  y += 30;

  // Separator line
  doc.setDrawColor(75, 0, 130);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 8;

  const displayId = details.uniqueId || `#${details.prescriptionId.slice(0, 8).toUpperCase()}`;

  // Patient Details Section - Fixed column layout
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  // Define columns with proper spacing
  const col1X = margin;           // Label column 1
  const col2X = margin + 32;      // Value column 1
  const col3X = pageWidth / 2 + 5;  // Label column 2
  const col4X = pageWidth / 2 + 40; // Value column 2
  
  // Row 1: Discount ID | Name
  doc.setFont('helvetica', 'bold');
  doc.text('Discount ID:', col1X, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(79, 70, 229);
  const discountIdText = displayId.length > 22 
    ? displayId.substring(0, 22) + '...' 
    : displayId;
  doc.text(discountIdText, col2X, y);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', col3X, y);
  doc.setFont('helvetica', 'normal');
  const nameText = (details.patientName || 'N/A').length > 20 
    ? (details.patientName || 'N/A').substring(0, 20) + '...' 
    : (details.patientName || 'N/A');
  doc.text(nameText, col4X, y);
  
  y += 8;
  
  // Row 2: Age/Gender | Contact No
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Age/Gender:', col1X, y);
  doc.setFont('helvetica', 'normal');
  const ageGenderText = [
    details.patientAge ? `${details.patientAge}Y` : null,
    details.patientGender || null
  ].filter(Boolean).join(' / ') || 'N/A';
  doc.text(ageGenderText, col2X, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Contact No:', col3X, y);
  doc.setFont('helvetica', 'normal');
  doc.text(details.patientPhone || 'N/A', col4X, y);
  
  y += 8;
  
  // Row 3: Lab | Discount
  doc.setFont('helvetica', 'bold');
  doc.text('Lab:', col1X, y);
  doc.setFont('helvetica', 'normal');
  const labNameText = details.labName.length > 30 
    ? details.labName.substring(0, 30) + '...' 
    : details.labName;
  doc.text(labNameText, col2X, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Discount:', col3X, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text(`${details.labDiscount}%`, col4X, y);
  
  y += 12;
  
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
  y += 12;

  // Tests List
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  
  details.tests.forEach((test) => {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    
    // Row border
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y + 4, pageWidth - margin, y + 4);
    
    const testName = test.name.length > 35 ? test.name.substring(0, 35) + '...' : test.name;
    const originalPrice = test.originalPrice || test.price;
    const discPercent = originalPrice > 0 
      ? Math.round((1 - test.price / originalPrice) * 100)
      : 0;
    
    doc.setTextColor(0, 0, 0);
    doc.text(testName, margin + 5, y);
    doc.text(`${originalPrice.toLocaleString()}`, pageWidth - margin - 80, y);
    doc.text(`${discPercent}%`, pageWidth - margin - 50, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${test.price.toLocaleString()}`, pageWidth - margin - 5, y, { align: 'right' });
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
  doc.text(`${details.subtotal.toLocaleString()}`, pageWidth - margin - 80, y);
  doc.setTextColor(16, 185, 129);
  doc.text(`${details.discountAmount.toLocaleString()}`, pageWidth - margin - 50, y);
  doc.setTextColor(75, 0, 130);
  doc.text(`${details.total.toLocaleString()}`, pageWidth - margin - 5, y, { align: 'right' });
  
  y += 15;

  // Validity Info
  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + (details.validityDays || 7));
  const validityStr = validityDate.toLocaleDateString('en-PK', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Approved On: ${details.approvedDate}`, margin, y);
  doc.text(`Valid Until: ${validityStr}`, pageWidth - margin - 50, y);
  
  y += 12;

  // Admin Notes (if any)
  if (details.adminNotes) {
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 16, 2, 2, 'F');
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin + 5, y + 10);
    doc.setFont('helvetica', 'normal');
    const notesText = details.adminNotes.length > 60 ? details.adminNotes.substring(0, 60) + '...' : details.adminNotes;
    doc.text(notesText, margin + 25, y + 10);
    y += 22;
  }

  // Instructions Box
  doc.setFillColor(254, 249, 195);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 44, 2, 2, 'F');
  
  doc.setTextColor(161, 98, 7);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Important Instructions:', margin + 5, y + 10);
  
  doc.setFont('helvetica', 'normal');
  const instructions = [
    '1. Take this slip with your original prescription to the lab',
    '2. Quote your Discount ID at the reception',
    `3. This slip is valid for ${details.validityDays || 7} days only`,
    '4. One-time use only - cannot be reused after redemption'
  ];
  
  let instY = y + 18;
  instructions.forEach(inst => {
    doc.text(inst, margin + 5, instY);
    instY += 6;
  });
  
  y += 52;

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
  const fileName = details.uniqueId 
    ? `MyPakLabs-Prescription-${details.uniqueId}.pdf`
    : `Prescription-${details.prescriptionId.slice(0, 8).toUpperCase()}.pdf`;
  doc.save(fileName);
};
