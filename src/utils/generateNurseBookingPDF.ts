import jsPDF from 'jspdf';

interface NurseBookingPDFDetails {
  bookingId: string;
  nurseName: string;
  nurseQualification?: string;
  nursePhone?: string;
  patientName?: string;
  patientPhone?: string;
  patientAge?: number;
  patientGender?: string;
  patientAddress?: string;
  serviceNeeded: string;
  preferredDate: string;
  preferredTime: string;
  fee?: number;
}

export const generateNurseBookingPDF = async (details: NurseBookingPDFDetails) => {
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

  // Contact Details
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Web: www.mypaklabs.com  |  Phone: 0316-7523434', pageWidth / 2, y + 18, { align: 'center' });
  doc.text('Email: support@mypaklabs.com  |  Address: Islamabad, Pakistan', pageWidth / 2, y + 24, { align: 'center' });

  y += 30;

  // Separator line
  doc.setDrawColor(75, 0, 130);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 8;

  // Title
  doc.setFillColor(16, 185, 129); // Teal/Green for nursing
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('HOME NURSING SERVICE CONFIRMATION SLIP', pageWidth / 2, y + 8, { align: 'center' });
  
  y += 20;

  // Booking ID
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Booking ID:', margin, y);
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(14);
  doc.text(details.bookingId, margin + 28, y);
  
  y += 12;

  // Patient Details Section
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 40, 2, 2, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT DETAILS', margin + 5, y + 8);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const col1 = margin + 5;
  const col2 = pageWidth / 2;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', col1, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(details.patientName || 'N/A', col1 + 18, y + 16);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Phone:', col2, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(details.patientPhone || 'N/A', col2 + 18, y + 16);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Age:', col1, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(details.patientAge ? `${details.patientAge} Years` : 'N/A', col1 + 12, y + 24);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Gender:', col2, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(details.patientGender || 'N/A', col2 + 20, y + 24);
  
  if (details.patientAddress) {
    doc.setFont('helvetica', 'bold');
    doc.text('Address:', col1, y + 32);
    doc.setFont('helvetica', 'normal');
    const addrText = details.patientAddress.length > 70 
      ? details.patientAddress.substring(0, 70) + '...' 
      : details.patientAddress;
    doc.text(addrText, col1 + 22, y + 32);
  }
  
  y += 48;

  // Nurse Details Section
  doc.setFillColor(236, 253, 245); // Light green
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 32, 2, 2, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.setFont('helvetica', 'bold');
  doc.text('NURSE DETAILS', margin + 5, y + 8);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(details.nurseName, margin + 5, y + 17);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  if (details.nurseQualification) {
    doc.text(details.nurseQualification, margin + 5, y + 24);
  }
  
  if (details.nursePhone) {
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Phone:', col2, y + 17);
    doc.setFont('helvetica', 'normal');
    doc.text(details.nursePhone, col2 + 18, y + 17);
  }
  
  y += 40;

  // Service Details Section
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 40, 2, 2, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICE DETAILS', margin + 5, y + 8);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Service:', col1, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text(details.serviceNeeded, col1 + 20, y + 18);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', col1, y + 28);
  doc.setFont('helvetica', 'normal');
  doc.text(details.preferredDate, col1 + 15, y + 28);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Time:', col2, y + 28);
  doc.setFont('helvetica', 'normal');
  doc.text(details.preferredTime, col2 + 15, y + 28);
  
  y += 48;

  // Fee Section (if available)
  if (details.fee) {
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 16, 2, 2, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Service Fee:', margin + 5, y + 11);
    doc.text(`Rs. ${details.fee.toLocaleString()}`, pageWidth - margin - 5, y + 11, { align: 'right' });
    
    y += 24;
  }

  // Instructions Box
  doc.setFillColor(254, 249, 195);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 32, 2, 2, 'F');
  
  doc.setTextColor(161, 98, 7);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Important Instructions:', margin + 5, y + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const instructions = [
    '1. The nurse will arrive at your provided address at the scheduled time',
    '2. Please ensure someone is available at the address to receive the nurse',
    '3. Keep this slip and a valid ID ready for verification',
    '4. Contact the nurse directly for any urgent changes or cancellations'
  ];
  
  let instY = y + 14;
  instructions.forEach(inst => {
    doc.text(inst, margin + 5, instY);
    instY += 5;
  });

  y += 38;

  // Footer
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  
  // Get current time in PKT
  const now = new Date();
  const pktTime = new Date(now.getTime() + (5 * 60 * 60 * 1000));
  const formattedTime = pktTime.toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text('My Pak Labs', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated: ${formattedTime} PKT`, pageWidth / 2, y, { align: 'center' });
  doc.text('www.mypaklabs.com', pageWidth - margin, y, { align: 'right' });

  // Save the PDF
  doc.save(`MyPakLabs-Nurse-Booking-${details.bookingId}.pdf`);
};
