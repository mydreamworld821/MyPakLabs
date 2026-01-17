import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Official sender email - domain verified in Resend
const OFFICIAL_EMAIL = "MyPakLabs <support@mypaklabs.com>";

interface TestDetail {
  name: string;
  originalPrice: number;
  discountedPrice: number;
}

interface NotificationRequest {
  type: "prescription" | "order" | "doctor_appointment" | "nurse_booking" | "emergency_request" | "medicine_order";
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;
  patientCity?: string;
  labName?: string;
  orderId?: string;
  adminEmail: string;
  // Doctor appointment specific
  doctorName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  consultationType?: string;
  appointmentFee?: number;
  // Nurse booking specific
  nurseName?: string;
  serviceNeeded?: string;
  preferredDate?: string;
  preferredTime?: string;
  // Emergency request specific
  city?: string;
  urgency?: string;
  services?: string[];
  // Medicine order specific
  pharmacyName?: string;
  deliveryAddress?: string;
  // Lab order specific
  testNames?: string[];
  totalAmount?: number;
  // PDF generation data
  tests?: TestDetail[];
  totalOriginal?: number;
  totalDiscounted?: number;
  totalSavings?: number;
  discountPercentage?: number;
  validityDays?: number;
  bookingDate?: string;
}

// MyPakLabs logo as base64 PNG (small purple/teal medical logo)
const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGpGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDI0LTAxLTE1VDEyOjAwOjAwKzA1OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI0LTAxLTE1VDEyOjAwOjAwKzA1OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNC0wMS0xNVQxMjowMDowMCswNTowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6MDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiBzdEV2dDp3aGVuPSIyMDI0LTAxLTE1VDEyOjAwOjAwKzA1OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+AAACkklEQVR4nO3dQW7CMBBA0XT/h+5dde1VJYiT2DNvieQQO/+TmATyx8/Pz+8P0N+vpy8A8xQAuAoAXAUArgLAf3cHwK+A/n58u4r+Mv0N7D/wu+6fJ+Be4O4A6A7g7gDoDoCuAO4OgO4A7g6A7gDuDoDuAO4OgO4A6Arg7gDoDuDuAOgO4O4A6A6ArgDuDoDuAO4OgO4A6A7g7gD4K+DuAOgO4O4A6A6ArgDuDoDuAO4OgO4A7g6A7gDoDoC/Au4OgO4A6A7g7gDoDuDuAOgKgO4A6A7g7gDoDuDuAOgO4O4A+Cvg7gDoDoDuAO4OgO4A6A6AvwLuDoDuAOgO4O4A6A7g7gDoCuDuAOgO4O4A6A7g7gDoDoCuAO4OgO4A7g6A7gDuDoDuAO4OgL8C7g6A7gDoDoC/Au4OgO4A6A7g7gDoDuDuAOgK4O4A6A7g7gDoDuDuAOgOgK4A7g6A7gDuDoDuAO4OgO4A7g6AvwLuDoDuAOgO4O4A6A7g7gDoCuDuAOgO4O4A6A7g7gDoDoCuAO4OgO4A7g6A7gDuDoDuAO4OgL8C7g6A7gDoDoC/Au4OgO4A6A7g7gDoDuDuAOgK4O4A6A7g7gDoDuDuAOgOgK4A7g6A7gDuDoDuAO4OgO4A7g6AvwLuDoDuAOgO4O4A6A7g7gDoCuDuAOgO4O4A6A7g7gDoDoCuAO4OgO4A7g6A7gDuDoDuAO4OgL8C7g6A7gDoDoC/Au4OgO4A6A7g7gDoDuDuAOgK4O4A6A7g7gDoDuDuAOgOgK4A7g6A7gDuDoDuAO4OgO4A7g6A/gq4OwC6A6A7gLsDoDuAuwOgK4C7A6A7gLsDoDuAuwOgOwC6Arg7ALoD/AUAAP//dHNLCwDU/5YAAAAASUVORK5CYII=";

// Generate PDF for lab booking
const generateLabBookingPDF = (data: NotificationRequest): string | null => {
  if (data.type !== 'order' || !data.tests || data.tests.length === 0) {
    return null;
  }

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 10;

    // Add logo
    try {
      doc.addImage(LOGO_BASE64, 'PNG', margin, y, 22, 22);
    } catch (e) {
      console.log('Logo could not be loaded in PDF');
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
    
    // Center align contact details
    doc.text('Web: www.mypaklabs.com  |  Phone: 0316-7523434', pageWidth / 2, y + 18, { align: 'center' });
    doc.text('Email: support@mypaklabs.com  |  Address: Islamabad, Pakistan', pageWidth / 2, y + 24, { align: 'center' });

    y += 30;

    // Separator line
    doc.setDrawColor(75, 0, 130);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    
    y += 8;

    // Patient Details Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const col1X = margin;
    const col2X = margin + 32;
    const col3X = pageWidth / 2 + 10;
    const col4X = pageWidth / 2 + 45;
    
    // Row 1: Discount ID | Name
    doc.setFont('helvetica', 'bold');
    doc.text('Discount ID:', col1X, y);
    doc.setTextColor(75, 0, 130);
    doc.text(data.orderId || 'N/A', col2X, y);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', col3X, y);
    doc.setFont('helvetica', 'normal');
    const nameText = (data.patientName || 'N/A').length > 18 
      ? (data.patientName || 'N/A').substring(0, 18) + '...' 
      : (data.patientName || 'N/A');
    doc.text(nameText, col4X, y);
    
    y += 8;
    
    // Row 2: Age/Gender | Contact No
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Age/Gender:', col1X, y);
    doc.setFont('helvetica', 'normal');
    const ageGenderText = [
      data.patientAge ? `${data.patientAge}Y` : null,
      data.patientGender || null
    ].filter(Boolean).join(' / ') || 'N/A';
    doc.text(ageGenderText, col2X, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Contact No:', col3X, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.patientPhone || 'N/A', col4X, y);
    
    y += 8;
    
    // Row 3: Lab
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Lab:', col1X, y);
    doc.setFont('helvetica', 'normal');
    const labNameText = (data.labName || 'N/A').length > 45 
      ? (data.labName || 'N/A').substring(0, 45) + '...' 
      : (data.labName || 'N/A');
    doc.text(labNameText, col2X, y);
    
    // Discount on same row
    doc.setFont('helvetica', 'bold');
    doc.text('Discount:', pageWidth - margin - 45, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129);
    doc.text(`${data.discountPercentage || 0}%`, pageWidth - margin - 10, y);
    
    y += 10;
    
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
    doc.setFontSize(10);
    
    data.tests.forEach((test) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
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
    doc.text(`${(data.totalOriginal || 0).toLocaleString()}`, pageWidth - margin - 80, y);
    doc.setTextColor(16, 185, 129);
    doc.text(`${(data.totalSavings || 0).toLocaleString()}`, pageWidth - margin - 50, y);
    doc.setTextColor(75, 0, 130);
    doc.text(`${(data.totalDiscounted || 0).toLocaleString()}`, pageWidth - margin - 5, y, { align: 'right' });
    
    y += 15;

    // Validity Info
    const bookingDate = data.bookingDate || new Date().toLocaleDateString('en-PK', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
    
    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + (data.validityDays || 7));
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
      `3. This discount is valid for ${data.validityDays || 7} days only`,
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

    // Return base64 encoded PDF
    return doc.output('datauristring').split(',')[1];
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
};

// Generate customer confirmation email HTML
const generateCustomerConfirmationHtml = (data: NotificationRequest): { subject: string; html: string } | null => {
  const baseUrl = "https://mypaklab.lovable.app";
  const footer = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
      <p style="color: #64748b; font-size: 14px; margin: 0;">Thank you for choosing MyPakLabs!</p>
      <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0;">
        For any queries, contact us at:<br>
        📞 +92 316 7523434 | 📧 support@mypaklabs.com
      </p>
      <a href="${baseUrl}" style="display: inline-block; margin-top: 15px; color: #0ea5e9; text-decoration: none; font-size: 14px;">
        Visit MyPakLabs
      </a>
    </div>
  `;

  switch (data.type) {
    case "order":
      return {
        subject: `✅ Your Lab Test Booking Confirmed - ${data.orderId}`,
        html: `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #22c55e, #10b981); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Booking Confirmed!</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                Dear <strong>${data.patientName}</strong>,
              </p>
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                Your lab test booking has been confirmed! Here are your booking details:
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
                <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Booking ID</p>
                  <p style="margin: 5px 0 0; color: #0ea5e9; font-size: 20px; font-weight: 700;">${data.orderId}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Lab</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.labName || 'N/A'}</p>
                </div>
                ${data.testNames && data.testNames.length > 0 ? `
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Tests</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 14px;">${data.testNames.join(', ')}</p>
                </div>
                ` : ''}
                ${data.totalAmount ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Total Amount</p>
                  <p style="margin: 5px 0 0; color: #22c55e; font-size: 20px; font-weight: 700;">Rs. ${data.totalAmount}</p>
                </div>
                ` : ''}
              </div>
              <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  💡 <strong>Next Steps:</strong> Please visit the lab with your booking ID and a valid ID. Your discount slip is attached to this email.
                </p>
              </div>
              <a href="${baseUrl}/my-bookings" 
                 style="display: block; background: #22c55e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                View My Bookings
              </a>
              ${footer}
            </div>
          </div>
        `
      };

    case "doctor_appointment":
      return {
        subject: `✅ Appointment Confirmed with Dr. ${data.doctorName}`,
        html: `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #8b5cf6, #6366f1); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">👨‍⚕️ Appointment Confirmed!</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                Dear <strong>${data.patientName}</strong>,
              </p>
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                Your appointment has been confirmed! Here are the details:
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
                <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Doctor</p>
                  <p style="margin: 5px 0 0; color: #8b5cf6; font-size: 20px; font-weight: 700;">Dr. ${data.doctorName}</p>
                </div>
                <div style="display: flex; gap: 20px; margin-bottom: 12px;">
                  <div style="flex: 1;">
                    <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">📅 Date</p>
                    <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.appointmentDate}</p>
                  </div>
                  <div style="flex: 1;">
                    <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">🕐 Time</p>
                    <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.appointmentTime}</p>
                  </div>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Consultation Type</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.consultationType || 'Physical Visit'}</p>
                </div>
                ${data.appointmentFee ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Consultation Fee</p>
                  <p style="margin: 5px 0 0; color: #8b5cf6; font-size: 20px; font-weight: 700;">Rs. ${data.appointmentFee}</p>
                </div>
                ` : ''}
              </div>
              <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  💡 <strong>Reminder:</strong> Please arrive 10 minutes before your scheduled time. Bring any previous medical records or prescriptions.
                </p>
              </div>
              <a href="${baseUrl}/my-bookings" 
                 style="display: block; background: #8b5cf6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                View My Appointments
              </a>
              ${footer}
            </div>
          </div>
        `
      };

    case "nurse_booking":
      return {
        subject: `✅ Nurse Booking Confirmed - ${data.nurseName}`,
        html: `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ec4899, #f43f5e); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">👩‍⚕️ Nurse Booking Confirmed!</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                Dear <strong>${data.patientName}</strong>,
              </p>
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                Your nurse booking request has been submitted! Here are the details:
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
                <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Nurse</p>
                  <p style="margin: 5px 0 0; color: #ec4899; font-size: 20px; font-weight: 700;">${data.nurseName}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Service</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.serviceNeeded}</p>
                </div>
                <div style="display: flex; gap: 20px; margin-bottom: 12px;">
                  <div style="flex: 1;">
                    <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">📅 Preferred Date</p>
                    <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.preferredDate}</p>
                  </div>
                  ${data.preferredTime ? `
                  <div style="flex: 1;">
                    <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">🕐 Preferred Time</p>
                    <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.preferredTime}</p>
                  </div>
                  ` : ''}
                </div>
              </div>
              <div style="background: #fce7f3; border: 1px solid #ec4899; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #9d174d; font-size: 14px;">
                  💡 <strong>Note:</strong> The nurse will contact you shortly to confirm the visit details.
                </p>
              </div>
              <a href="${baseUrl}/my-bookings" 
                 style="display: block; background: #ec4899; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                View My Bookings
              </a>
              ${footer}
            </div>
          </div>
        `
      };

    case "emergency_request":
      const urgencyColor = data.urgency === 'critical' ? '#ef4444' : data.urgency === 'within_1_hour' ? '#f97316' : '#3b82f6';
      const urgencyLabel = data.urgency === 'critical' ? 'Critical' : data.urgency === 'within_1_hour' ? 'Urgent' : 'Scheduled';
      return {
        subject: `🚨 Emergency Request Submitted - ${urgencyLabel}`,
        html: `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: ${urgencyColor}; padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Emergency Request Received!</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                Dear <strong>${data.patientName}</strong>,
              </p>
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                Your emergency nursing request has been received. Nurses in your area are being notified.
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
                <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Urgency Level</p>
                  <p style="margin: 5px 0 0; color: ${urgencyColor}; font-size: 20px; font-weight: 700;">${urgencyLabel}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Location</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.city || 'N/A'}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Services Needed</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 14px;">${data.services?.join(', ') || 'N/A'}</p>
                </div>
              </div>
              <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #991b1b; font-size: 14px;">
                  ⏰ <strong>What's Next:</strong> Available nurses will start sending you offers. You can track your request status in real-time.
                </p>
              </div>
              <a href="${baseUrl}/emergency-request-status" 
                 style="display: block; background: ${urgencyColor}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                Track Request Status
              </a>
              ${footer}
            </div>
          </div>
        `
      };

    case "medicine_order":
      return {
        subject: `✅ Medicine Order Confirmed - ${data.orderId}`,
        html: `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #14b8a6, #0d9488); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">💊 Order Confirmed!</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                Dear <strong>${data.patientName}</strong>,
              </p>
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                Your medicine order has been placed! Here are the details:
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
                <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Order ID</p>
                  <p style="margin: 5px 0 0; color: #14b8a6; font-size: 20px; font-weight: 700;">${data.orderId}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Pharmacy</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.pharmacyName || 'N/A'}</p>
                </div>
                ${data.deliveryAddress ? `
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Delivery Address</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 14px;">${data.deliveryAddress}</p>
                </div>
                ` : ''}
              </div>
              <div style="background: #ccfbf1; border: 1px solid #14b8a6; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #134e4a; font-size: 14px;">
                  💡 <strong>Note:</strong> The pharmacy will review your order and confirm availability. You will receive updates on your order status.
                </p>
              </div>
              <a href="${baseUrl}/my-bookings" 
                 style="display: block; background: #14b8a6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                Track My Order
              </a>
              ${footer}
            </div>
          </div>
        `
      };

    default:
      return null;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationRequest = await req.json();
    console.log("Notification request:", data);

    let subject: string;
    let html: string;
    const baseUrl = "https://mypaklab.lovable.app";

    // Generate PDF for lab orders
    let pdfBase64: string | null = null;
    if (data.type === 'order' && data.tests && data.tests.length > 0) {
      console.log("Generating PDF for lab order...");
      pdfBase64 = generateLabBookingPDF(data);
      if (pdfBase64) {
        console.log("PDF generated successfully");
      } else {
        console.log("PDF generation failed or skipped");
      }
    }

    switch (data.type) {
      case "prescription":
        subject = "📋 New Prescription Uploaded - Action Required";
        html = `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0ea5e9, #6366f1); padding: 30px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Prescription Uploaded</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                <strong>${data.patientName}</strong> has uploaded a new prescription that requires your review.
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">Patient Name</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 18px; font-weight: 600;">${data.patientName}</p>
              </div>
              <a href="${baseUrl}/admin/prescriptions" 
                 style="display: inline-block; background: #0ea5e9; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 10px;">
                Review Prescription
              </a>
            </div>
          </div>
        `;
        break;

      case "order":
        subject = `🛒 New Lab Order - ${data.orderId}`;
        html = `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #22c55e, #10b981); padding: 30px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Lab Order Placed</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px;">
                <strong>${data.patientName}</strong> has placed a new order for lab tests.
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">Order ID</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 18px; font-weight: 600;">${data.orderId}</p>
                <p style="margin: 15px 0 0; color: #64748b; font-size: 14px;">Lab</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.labName || 'N/A'}</p>
                ${data.testNames && data.testNames.length > 0 ? `
                <p style="margin: 15px 0 0; color: #64748b; font-size: 14px;">Tests</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 14px;">${data.testNames.join(', ')}</p>
                ` : ''}
                ${data.totalAmount ? `
                <p style="margin: 15px 0 0; color: #64748b; font-size: 14px;">Total Amount</p>
                <p style="margin: 5px 0 0; color: #22c55e; font-size: 18px; font-weight: 600;">Rs. ${data.totalAmount}</p>
                ` : ''}
              </div>
              <a href="${baseUrl}/admin/orders" 
                 style="display: inline-block; background: #22c55e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View Order
              </a>
            </div>
          </div>
        `;
        break;

      case "doctor_appointment":
        subject = `👨‍⚕️ New Doctor Appointment - ${data.patientName}`;
        html = `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #8b5cf6, #6366f1); padding: 30px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Doctor Appointment</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px;">
                <strong>${data.patientName}</strong> has booked an appointment.
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Doctor</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.doctorName || 'N/A'}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Date & Time</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.appointmentDate} at ${data.appointmentTime}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Consultation Type</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.consultationType || 'Physical'}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Patient Phone</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.patientPhone || 'N/A'}</p>
                </div>
              </div>
              <a href="${baseUrl}/admin/doctor-appointments" 
                 style="display: inline-block; background: #8b5cf6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View Appointments
              </a>
            </div>
          </div>
        `;
        break;

      case "nurse_booking":
        subject = `👩‍⚕️ New Nurse Booking - ${data.patientName}`;
        html = `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ec4899, #f43f5e); padding: 30px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Nurse Booking</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px;">
                <strong>${data.patientName}</strong> has requested a nurse booking.
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Nurse</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.nurseName || 'N/A'}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Service Needed</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.serviceNeeded || 'N/A'}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Preferred Date</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.preferredDate || 'N/A'}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Patient Phone</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.patientPhone || 'N/A'}</p>
                </div>
              </div>
              <a href="${baseUrl}/admin/nurse-bookings" 
                 style="display: inline-block; background: #ec4899; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View Bookings
              </a>
            </div>
          </div>
        `;
        break;

      case "emergency_request":
        const urgencyColor = data.urgency === 'critical' ? '#ef4444' : data.urgency === 'within_1_hour' ? '#f97316' : '#3b82f6';
        const urgencyLabel = data.urgency === 'critical' ? '🚨 CRITICAL' : data.urgency === 'within_1_hour' ? '⏰ URGENT' : '📅 SCHEDULED';
        subject = `${urgencyLabel} Emergency Nursing Request - ${data.patientName}`;
        html = `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: ${urgencyColor}; padding: 30px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">${urgencyLabel} Emergency Request</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px;">
                <strong>${data.patientName}</strong> has submitted an emergency nursing request.
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Location</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.city || 'N/A'}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Services Needed</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.services?.join(', ') || 'N/A'}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Patient Phone</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.patientPhone || 'N/A'}</p>
                </div>
              </div>
              <a href="${baseUrl}/admin/emergency-requests" 
                 style="display: inline-block; background: ${urgencyColor}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View Emergency Requests
              </a>
            </div>
          </div>
        `;
        break;

      case "medicine_order":
        subject = `💊 New Medicine Order - ${data.orderId}`;
        html = `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #14b8a6, #0d9488); padding: 30px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Medicine Order</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px;">
                <strong>${data.patientName}</strong> has placed a medicine order.
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Order ID</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 18px; font-weight: 600;">${data.orderId}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Pharmacy</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.pharmacyName || 'N/A'}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Patient Phone</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.patientPhone || 'N/A'}</p>
                </div>
              </div>
              <a href="${baseUrl}/admin/medicine-orders" 
                 style="display: inline-block; background: #14b8a6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View Medicine Orders
              </a>
            </div>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown notification type: ${data.type}`);
    }

    // Add footer to all admin emails
    html = html.replace('</div>\n          </div>', `
              <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                This is an automated notification from MyPakLabs.<br>
                Contact: +923167523434 | support@mypaklabs.com
              </p>
            </div>
          </div>
    `);

    // Prepare attachments if PDF was generated
    const attachments = pdfBase64
      ? [{ filename: `MyPakLabs-Booking-${data.orderId}.pdf`, content: pdfBase64 }]
      : undefined;

    const FALLBACK_EMAIL = "MyPakLabs <onboarding@resend.dev>";

    const isDomainNotVerified = (err: unknown) => {
      const msg = (err as any)?.message ?? "";
      const name = (err as any)?.name ?? "";
      const statusCode = (err as any)?.statusCode ?? (err as any)?.status ?? undefined;
      return (
        name === "validation_error" &&
        statusCode === 403 &&
        typeof msg === "string" &&
        msg.toLowerCase().includes("domain") &&
        msg.toLowerCase().includes("not verified")
      );
    };

    const sendWithFallback = async (args: {
      to: string[];
      subject: string;
      html: string;
    }) => {
      const primary = await resend.emails.send({
        from: OFFICIAL_EMAIL,
        to: args.to,
        subject: args.subject,
        html: args.html,
        attachments,
      });

      if (primary?.error && isDomainNotVerified(primary.error)) {
        console.warn(
          "Sender domain not verified for OFFICIAL_EMAIL. Retrying with fallback sender.",
          primary.error
        );
        const fallback = await resend.emails.send({
          from: FALLBACK_EMAIL,
          to: args.to,
          subject: args.subject,
          html: args.html,
          attachments,
        });
        return { primary, fallback };
      }

      return { primary, fallback: null };
    };

    // Send admin notification email
    console.log("Sending admin email to:", data.adminEmail);
    const adminSend = await sendWithFallback({
      to: [data.adminEmail],
      subject,
      html,
    });
    console.log("Admin notification email sent:", adminSend);

    // Send customer confirmation email if patientEmail is provided
    let customerSend: any = null;
    if (data.patientEmail) {
      const customerEmail = generateCustomerConfirmationHtml(data);
      if (customerEmail) {
        console.log("Sending customer confirmation email to:", data.patientEmail);
        customerSend = await sendWithFallback({
          to: [data.patientEmail],
          subject: customerEmail.subject,
          html: customerEmail.html,
        });
        console.log("Customer confirmation email sent:", customerSend);
      }
    }

    const adminError = adminSend?.fallback?.error || adminSend?.primary?.error || null;
    const customerError = customerSend?.fallback?.error || customerSend?.primary?.error || null;
    const ok = !adminError && (!data.patientEmail || !customerError);

    return new Response(
      JSON.stringify({
        success: ok,
        adminEmail: adminSend,
        customerEmail: customerSend,
        pdfGenerated: !!pdfBase64,
      }),
      {
        status: ok ? 200 : 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error sending notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
