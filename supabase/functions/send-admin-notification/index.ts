import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Official sender email - domain verified in Resend
const OFFICIAL_EMAIL = "MyPakLabs <support@mypaklabs.com>";
const FALLBACK_EMAIL = "MyPakLabs <onboarding@resend.dev>";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestDetail {
  name: string;
  originalPrice: number;
  discountedPrice: number;
}

interface NotificationRequest {
  type: "prescription" | "order" | "doctor_appointment" | "nurse_booking" | "emergency_request" | "medicine_order";
  status?: "pending" | "confirmed" | "completed" | "cancelled";
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;
  patientCity?: string;
  labName?: string;
  orderId?: string;
  bookingId?: string;
  adminEmail: string;
  adminNotes?: string;
  // Provider IDs for routing notifications
  doctorId?: string;
  nurseId?: string;
  storeId?: string;
  // Doctor appointment specific
  doctorName?: string;
  doctorQualification?: string;
  doctorSpecialization?: string;
  doctorPhone?: string;
  clinicName?: string;
  clinicAddress?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  consultationType?: string;
  appointmentFee?: number;
  // Nurse booking specific
  nurseName?: string;
  nurseQualification?: string;
  nursePhone?: string;
  serviceNeeded?: string;
  preferredDate?: string;
  preferredTime?: string;
  patientAddress?: string;
  nurseNotes?: string;
  serviceFee?: number;
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

// MyPakLabs logo as base64 PNG
const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGpGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDI0LTAxLTE1VDEyOjAwOjAwKzA1OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI0LTAxLTE1VDEyOjAwOjAwKzA1OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNC0wMS0xNVQxMjowMDowMCswNTowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6MDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiBzdEV2dDp3aGVuPSIyMDI0LTAxLTE1VDEyOjAwOjAwKzA1OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+AAACkklEQVR4nO3dQW7CMBBA0XT/h+5dde1VJYiT2DNvieQQO/+TmATyx8/Pz+8P0N+vpy8A8xQAuAoAXAUArgLAf3cHwK+A/n58u4r+Mv0N7D/wu+6fJ+Be4O4A6A7g7gDoDoCuAO4OgO4A7g6A7gDuDoDuAO4OgO4A6Arg7gDoDuDuAOgO4O4A6A6ArgDuDoDuAO4OgO4A6A7g7gD4K+DuAOgO4O4A6A6ArgDuDoDuAO4OgO4A7g6A7gDoDoC/Au4OgO4A6A7g7gDoDuDuAOgKgO4A6A7g7gDoDuDuAOgO4O4A+Cvg7gDoDoDuAO4OgO4A6A6AvwLuDoDuAOgO4O4A6A7g7gDoCuDuAOgO4O4A6A7g7gDoDoCuAO4OgO4A7g6A7gDuDoDuAO4OgL8C7g6A7gDoDoC/Au4OgO4A6A7g7gDoDuDuAOgK4O4A6A7g7gDoDuDuAOgOgK4A7g6A7gDuDoDuAO4OgO4A7g6AvwLuDoDuAOgO4O4A6A7g7gDoCuDuAOgO4O4A6A7g7gDoDoCuAO4OgO4A7g6A7gDuDoDuAO4OgL8C7g6A7gDoDoC/Au4OgO4A6A7g7gDoDuDuAOgK4O4A6A7g7gDoDuDuAOgOgK4A7g6A7gDuDoDuAO4OgO4A7g6AvwLuDoDuAOgO4O4A6A7g7gDoCuDuAOgO4O4A6A7g7gDoDoCuAO4OgO4A7g6A7gDuDoDuAO4OgL8C7g6A7gDoDoC/Au4OgO4A6A7g7gDoDuDuAOgK4O4A6A7g7gDoDuDuAOgOgK4A7g6A7gDuDoDuAO4OgO4A7g6A/gq4OwC6A6A7gLsDoDuAuwOgK4C7A6A7gLsDoDuAuwOgOwC6Arg7ALoD/AUAAP//dHNLCwDU/5YAAAAASUVORK5CYII=";

// Fetch provider email from database
async function getProviderEmail(type: string, id: string): Promise<string | null> {
  try {
    let tableName = "";
    switch (type) {
      case "doctor":
        tableName = "doctors";
        break;
      case "nurse":
        tableName = "nurses";
        break;
      case "pharmacy":
        tableName = "medical_stores";
        break;
      default:
        return null;
    }
    
    const { data, error } = await supabase
      .from(tableName)
      .select("email")
      .eq("id", id)
      .single();
    
    if (error || !data) {
      console.log(`Could not fetch ${type} email for ID ${id}:`, error?.message);
      return null;
    }
    
    return (data as { email: string | null }).email || null;
  } catch (err) {
    console.error(`Error fetching ${type} email:`, err);
    return null;
  }
}

// Fetch all approved nurses' emails for emergency notifications
async function getApprovedNursesEmails(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("nurses")
      .select("email")
      .eq("status", "approved")
      .eq("emergency_available", true)
      .not("email", "is", null);
    
    if (error || !data) {
      console.log("Could not fetch approved nurses emails:", error?.message);
      return [];
    }
    
    return data.map(n => n.email).filter(Boolean) as string[];
  } catch (err) {
    console.error("Error fetching nurses emails:", err);
    return [];
  }
}

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

    // Company Name
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

    // Patient Details
    const col1X = margin;
    const col2X = margin + 32;
    const col3X = pageWidth / 2 + 10;
    const col4X = pageWidth / 2 + 45;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Discount ID:', col1X, y);
    doc.setTextColor(75, 0, 130);
    doc.text(data.orderId || 'N/A', col2X, y);
    
    doc.setTextColor(0, 0, 0);
    doc.text('Name:', col3X, y);
    doc.setFont('helvetica', 'normal');
    const nameText = (data.patientName || 'N/A').length > 18 
      ? (data.patientName || 'N/A').substring(0, 18) + '...' 
      : (data.patientName || 'N/A');
    doc.text(nameText, col4X, y);
    
    y += 8;
    
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
    
    doc.setFont('helvetica', 'bold');
    doc.text('Lab:', col1X, y);
    doc.setFont('helvetica', 'normal');
    const labNameText = (data.labName || 'N/A').length > 45 
      ? (data.labName || 'N/A').substring(0, 45) + '...' 
      : (data.labName || 'N/A');
    doc.text(labNameText, col2X, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Discount:', pageWidth - margin - 45, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129);
    doc.text(`${data.discountPercentage || 0}%`, pageWidth - margin - 10, y);
    
    y += 10;
    
    // Separator
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
    const bookingDate = data.bookingDate || new Date().toLocaleDateString('en-PK');
    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + (data.validityDays || 7));
    const validityStr = validityDate.toLocaleDateString('en-PK');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Booking Date: ${bookingDate}`, margin, y);
    doc.text(`Valid Until: ${validityStr}`, pageWidth - margin - 50, y);
    
    y += 15;

    // Instructions
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

    return doc.output('datauristring').split(',')[1];
  } catch (error) {
    console.error("Error generating lab PDF:", error);
    return null;
  }
};

// Generate PDF for Doctor Appointment
const generateDoctorAppointmentPDF = (data: NotificationRequest): string | null => {
  if (data.type !== 'doctor_appointment') return null;

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

    // Company Name
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

    y += 32;

    // Title
    doc.setFillColor(139, 92, 246);
    doc.rect(margin, y, pageWidth - 2 * margin, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DOCTOR APPOINTMENT CONFIRMATION', pageWidth / 2, y + 8, { align: 'center' });

    y += 20;

    // Booking ID
    if (data.bookingId) {
      doc.setTextColor(75, 0, 130);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Booking ID: ${data.bookingId}`, pageWidth / 2, y, { align: 'center' });
      y += 10;
    }

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Patient Section
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, pageWidth - 2 * margin, 35, 'F');
    
    doc.setTextColor(75, 0, 130);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT DETAILS', margin + 5, y + 8);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const patientCol1 = margin + 5;
    const patientCol2 = pageWidth / 2 + 5;
    
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', patientCol1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.patientName || 'N/A', patientCol1 + 25, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Phone:', patientCol2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.patientPhone || 'N/A', patientCol2 + 25, y);
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Age:', patientCol1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.patientAge ? `${data.patientAge} Years` : 'N/A', patientCol1 + 25, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Gender:', patientCol2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.patientGender || 'N/A', patientCol2 + 25, y);
    
    y += 8;
    if (data.patientCity) {
      doc.setFont('helvetica', 'bold');
      doc.text('City:', patientCol1, y);
      doc.setFont('helvetica', 'normal');
      doc.text(data.patientCity, patientCol1 + 25, y);
    }

    y += 15;

    // Doctor Section
    doc.setFillColor(139, 92, 246, 0.1);
    doc.rect(margin, y, pageWidth - 2 * margin, 40, 'F');
    
    doc.setTextColor(139, 92, 246);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DOCTOR DETAILS', margin + 5, y + 8);
    
    y += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Doctor:', patientCol1, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(139, 92, 246);
    doc.text(`Dr. ${data.doctorName || 'N/A'}`, patientCol1 + 25, y);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Phone:', patientCol2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.doctorPhone || 'N/A', patientCol2 + 25, y);
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Qualification:', patientCol1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.doctorQualification || 'N/A', patientCol1 + 35, y);
    
    y += 8;
    if (data.doctorSpecialization) {
      doc.setFont('helvetica', 'bold');
      doc.text('Specialization:', patientCol1, y);
      doc.setFont('helvetica', 'normal');
      doc.text(data.doctorSpecialization, patientCol1 + 38, y);
    }
    
    y += 8;
    if (data.clinicName) {
      doc.setFont('helvetica', 'bold');
      doc.text('Clinic:', patientCol1, y);
      doc.setFont('helvetica', 'normal');
      doc.text(data.clinicName, patientCol1 + 25, y);
    }

    y += 15;

    // Appointment Details Table
    doc.setFillColor(75, 0, 130);
    doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('APPOINTMENT DETAILS', pageWidth / 2, y + 7, { align: 'center' });
    
    y += 16;

    // Appointment info rows
    const detailsStartY = y;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', patientCol1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.appointmentDate || 'N/A', patientCol1 + 30, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Time:', patientCol2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.appointmentTime || 'N/A', patientCol2 + 25, y);
    
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Consultation Type:', patientCol1, y);
    doc.setFont('helvetica', 'normal');
    doc.text((data.consultationType || 'Physical').toUpperCase(), patientCol1 + 50, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Fee:', patientCol2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74);
    doc.text(`Rs. ${data.appointmentFee?.toLocaleString() || 'N/A'}`, patientCol2 + 25, y);

    y += 20;

    // Instructions Box
    doc.setFillColor(254, 249, 195);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 40, 2, 2, 'F');
    
    doc.setTextColor(161, 98, 7);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Important Instructions:', margin + 5, y + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const doctorInstructions = [
      '1. Please arrive 10-15 minutes before your scheduled appointment time',
      '2. Bring this slip and a valid CNIC/ID for verification',
      '3. Bring any previous medical records or prescriptions',
      '4. In case of cancellation, please inform at least 2 hours in advance',
      '5. Payment is due at the time of consultation'
    ];
    
    let instY = y + 15;
    doctorInstructions.forEach(inst => {
      doc.text(inst, margin + 5, instY);
      instY += 5;
    });

    y += 50;

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

    return doc.output('datauristring').split(',')[1];
  } catch (error) {
    console.error("Error generating doctor appointment PDF:", error);
    return null;
  }
};

// Generate PDF for Nurse Booking
const generateNurseBookingPDF = (data: NotificationRequest): string | null => {
  if (data.type !== 'nurse_booking') return null;

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

    // Company Name
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

    y += 32;

    // Title
    doc.setFillColor(236, 72, 153);
    doc.rect(margin, y, pageWidth - 2 * margin, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('HOME NURSING SERVICE CONFIRMATION', pageWidth / 2, y + 8, { align: 'center' });

    y += 20;

    // Booking ID
    if (data.bookingId) {
      doc.setTextColor(236, 72, 153);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Booking ID: ${data.bookingId}`, pageWidth / 2, y, { align: 'center' });
      y += 10;
    }

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Patient Section
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, pageWidth - 2 * margin, 45, 'F');
    
    doc.setTextColor(236, 72, 153);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT DETAILS', margin + 5, y + 8);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    const patientCol1 = margin + 5;
    const patientCol2 = pageWidth / 2 + 5;
    
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', patientCol1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.patientName || 'N/A', patientCol1 + 25, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Phone:', patientCol2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.patientPhone || 'N/A', patientCol2 + 25, y);
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Age:', patientCol1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.patientAge ? `${data.patientAge} Years` : 'N/A', patientCol1 + 25, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Gender:', patientCol2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.patientGender || 'N/A', patientCol2 + 25, y);
    
    y += 8;
    if (data.patientAddress) {
      doc.setFont('helvetica', 'bold');
      doc.text('Address:', patientCol1, y);
      doc.setFont('helvetica', 'normal');
      const addressText = data.patientAddress.length > 60 
        ? data.patientAddress.substring(0, 60) + '...' 
        : data.patientAddress;
      doc.text(addressText, patientCol1 + 30, y);
    }

    y += 20;

    // Nurse Section
    doc.setFillColor(236, 72, 153, 0.1);
    doc.rect(margin, y, pageWidth - 2 * margin, 35, 'F');
    
    doc.setTextColor(236, 72, 153);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('NURSE DETAILS', margin + 5, y + 8);
    
    y += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Nurse:', patientCol1, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(236, 72, 153);
    doc.text(data.nurseName || 'N/A', patientCol1 + 25, y);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Phone:', patientCol2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.nursePhone || 'N/A', patientCol2 + 25, y);
    
    y += 8;
    if (data.nurseQualification) {
      doc.setFont('helvetica', 'bold');
      doc.text('Qualification:', patientCol1, y);
      doc.setFont('helvetica', 'normal');
      doc.text(data.nurseQualification, patientCol1 + 35, y);
    }

    y += 15;

    // Service Details Table
    doc.setFillColor(75, 0, 130);
    doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVICE DETAILS', pageWidth / 2, y + 7, { align: 'center' });
    
    y += 16;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Service:', patientCol1, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(236, 72, 153);
    doc.text(data.serviceNeeded || 'N/A', patientCol1 + 30, y);
    
    y += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', patientCol1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.preferredDate || 'N/A', patientCol1 + 30, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Time:', patientCol2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.preferredTime || 'N/A', patientCol2 + 25, y);
    
    if (data.serviceFee) {
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Fee:', patientCol1, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(22, 163, 74);
      doc.text(`Rs. ${data.serviceFee.toLocaleString()}`, patientCol1 + 30, y);
    }

    // Nurse Notes Section
    if (data.nurseNotes) {
      y += 15;
      doc.setFillColor(254, 243, 199);
      doc.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
      
      doc.setTextColor(180, 83, 9);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Additional Notes / Medicines:', margin + 5, y + 8);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const notesText = data.nurseNotes.length > 150 
        ? data.nurseNotes.substring(0, 150) + '...' 
        : data.nurseNotes;
      doc.text(notesText, margin + 5, y + 16, { maxWidth: pageWidth - 2 * margin - 10 });
      
      y += 30;
    } else {
      y += 15;
    }

    // Instructions Box
    doc.setFillColor(254, 249, 195);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 45, 2, 2, 'F');
    
    doc.setTextColor(161, 98, 7);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Important Instructions:', margin + 5, y + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const nurseInstructions = [
      '1. Please ensure someone is available to receive the nurse at the scheduled time',
      '2. Keep this slip ready for verification',
      '3. Ensure the patient area is clean and accessible',
      '4. In case of cancellation, please inform at least 2 hours in advance',
      '5. Payment is due upon completion of service',
      '6. For emergencies, contact our helpline: 0316-7523434'
    ];
    
    let instY = y + 15;
    nurseInstructions.forEach(inst => {
      doc.text(inst, margin + 5, instY);
      instY += 5;
    });

    y += 55;

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

    return doc.output('datauristring').split(',')[1];
  } catch (error) {
    console.error("Error generating nurse booking PDF:", error);
    return null;
  }
};

// Generate pending notification email HTML (when booking is first created)
const generatePendingEmailHtml = (data: NotificationRequest): { subject: string; html: string } | null => {
  const baseUrl = "https://mypaklab.lovable.app";
  const footer = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
      <p style="color: #64748b; font-size: 14px; margin: 0;">Thank you for choosing MyPakLabs!</p>
      <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0;">
        For any queries, contact us at:<br>
        📞 +92 316 7523434 | 📧 support@mypaklabs.com
      </p>
    </div>
  `;

  if (data.type === 'prescription') {
    return {
      subject: `⏳ Prescription Uploaded - Awaiting Review`,
      html: `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #fbbf24, #f59e0b); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📋 Prescription Uploaded</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              Dear <strong>${data.patientName}</strong>,
            </p>
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              Your prescription has been uploaded successfully and is now under review by our medical team.
            </p>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
              ${data.labName ? `
              <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Selected Lab</p>
                <p style="margin: 5px 0 0; color: #22c55e; font-size: 18px; font-weight: 700;">${data.labName}</p>
              </div>
              ` : ''}
              <div style="margin-bottom: 12px;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Status</p>
                <p style="margin: 5px 0 0; color: #f59e0b; font-size: 16px; font-weight: 600;">⏳ Pending Review</p>
              </div>
            </div>
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⏰ <strong>What's Next:</strong> Our team will review your prescription and confirm the tests. Once approved, you'll receive a confirmation email with your discount slip (PDF) containing your unique Discount ID.
              </p>
            </div>
            <a href="${baseUrl}/my-bookings" 
               style="display: block; background: #f59e0b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
              Track My Prescriptions
            </a>
            ${footer}
          </div>
        </div>
      `
    };
  }

  if (data.type === 'doctor_appointment') {
    return {
      subject: `⏳ Appointment Request Received - Dr. ${data.doctorName}`,
      html: `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #fbbf24, #f59e0b); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⏳ Booking Request Received</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              Dear <strong>${data.patientName}</strong>,
            </p>
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              We have received your appointment request. Our team will review and confirm your booking shortly.
            </p>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
              <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Doctor</p>
                <p style="margin: 5px 0 0; color: #8b5cf6; font-size: 20px; font-weight: 700;">Dr. ${data.doctorName}</p>
              </div>
              <div style="display: flex; gap: 20px; margin-bottom: 12px;">
                <div style="flex: 1;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">📅 Requested Date</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.appointmentDate}</p>
                </div>
                <div style="flex: 1;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">🕐 Requested Time</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.appointmentTime}</p>
                </div>
              </div>
              <div style="margin-bottom: 12px;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Consultation Type</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.consultationType || 'Physical Visit'}</p>
              </div>
            </div>
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⏰ <strong>What's Next:</strong> You will receive a confirmation email with your appointment slip once the booking is confirmed by our team or the doctor.
              </p>
            </div>
            <a href="${baseUrl}/my-bookings" 
               style="display: block; background: #f59e0b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
              Track My Booking
            </a>
            ${footer}
          </div>
        </div>
      `
    };
  }

  if (data.type === 'nurse_booking') {
    return {
      subject: `⏳ Nurse Booking Request Received - ${data.nurseName}`,
      html: `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #fbbf24, #f59e0b); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⏳ Booking Request Received</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              Dear <strong>${data.patientName}</strong>,
            </p>
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              We have received your home nursing service request. Our team will review and confirm your booking shortly.
            </p>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
              <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Nurse</p>
                <p style="margin: 5px 0 0; color: #ec4899; font-size: 20px; font-weight: 700;">${data.nurseName}</p>
              </div>
              <div style="margin-bottom: 12px;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Service Needed</p>
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
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⏰ <strong>What's Next:</strong> You will receive a confirmation email with your booking slip once the nurse confirms the visit. The nurse may also contact you directly.
              </p>
            </div>
            <a href="${baseUrl}/my-bookings" 
               style="display: block; background: #f59e0b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
              Track My Booking
            </a>
            ${footer}
          </div>
        </div>
      `
    };
  }

  return null;
};

// Generate confirmed notification email HTML (when booking is confirmed)
const generateConfirmedEmailHtml = (data: NotificationRequest): { subject: string; html: string } | null => {
  const baseUrl = "https://mypaklab.lovable.app";
  const footer = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
      <p style="color: #64748b; font-size: 14px; margin: 0;">Thank you for choosing MyPakLabs!</p>
      <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0;">
        For any queries, contact us at:<br>
        📞 +92 316 7523434 | 📧 support@mypaklabs.com
      </p>
    </div>
  `;

  if (data.type === 'prescription') {
    const testsHtml = data.tests?.map(t => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${t.name}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; text-decoration: line-through; color: #94a3b8;">Rs. ${t.originalPrice.toLocaleString()}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #22c55e; font-weight: 600;">Rs. ${t.discountedPrice.toLocaleString()}</td>
      </tr>
    `).join('') || '';

    return {
      subject: `✅ Prescription Approved - Your Discount ID: ${data.orderId}`,
      html: `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #22c55e, #10b981); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Prescription Approved!</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              Dear <strong>${data.patientName}</strong>,
            </p>
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              Great news! Your prescription has been reviewed and approved. Please find your discount details below.
            </p>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
              <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Your Discount ID</p>
                <p style="margin: 5px 0 0; color: #22c55e; font-size: 24px; font-weight: 700; letter-spacing: 2px;">${data.orderId}</p>
              </div>
              <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Lab</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 18px; font-weight: 600;">${data.labName || 'N/A'}</p>
              </div>
              
              ${data.tests && data.tests.length > 0 ? `
              <div style="margin-bottom: 16px;">
                <p style="margin: 0 0 12px; color: #64748b; font-size: 12px; text-transform: uppercase;">Approved Tests</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <thead>
                    <tr style="color: #64748b; font-size: 12px; text-transform: uppercase;">
                      <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #e2e8f0;">Test</th>
                      <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #e2e8f0;">Original</th>
                      <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #e2e8f0;">Payable</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${testsHtml}
                  </tbody>
                </table>
              </div>
              ` : ''}
              
              <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin-top: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #64748b;">Original Total:</span>
                  <span style="text-decoration: line-through; color: #94a3b8;">Rs. ${(data.totalOriginal || 0).toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #16a34a; font-weight: 600;">You Save:</span>
                  <span style="color: #16a34a; font-weight: 600;">Rs. ${(data.totalSavings || 0).toLocaleString()} (${data.discountPercentage || 0}% OFF)</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 2px solid #22c55e;">
                  <span style="font-size: 18px; font-weight: 700; color: #1e293b;">Total Payable:</span>
                  <span style="font-size: 18px; font-weight: 700; color: #22c55e;">Rs. ${(data.totalDiscounted || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            ${data.adminNotes ? `
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                📝 <strong>Notes from Admin:</strong> ${data.adminNotes}
              </p>
            </div>
            ` : ''}
            
            <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                📎 <strong>Attachment:</strong> Your discount slip is attached to this email. Please print or save it and present it at the lab along with your original prescription.
              </p>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⏰ <strong>Important:</strong> This discount is valid for ${data.validityDays || 7} days only. Please visit the lab with your Discount ID and original prescription.
              </p>
            </div>
            
            <a href="${baseUrl}/my-bookings" 
               style="display: block; background: #22c55e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
              View My Prescriptions
            </a>
            ${footer}
          </div>
        </div>
      `
    };
  }

  if (data.type === 'doctor_appointment') {
    return {
      subject: `✅ Appointment Confirmed - Dr. ${data.doctorName} on ${data.appointmentDate}`,
      html: `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #22c55e, #10b981); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Appointment Confirmed!</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              Dear <strong>${data.patientName}</strong>,
            </p>
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              Great news! Your appointment has been confirmed. Please find your appointment details below.
            </p>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
              ${data.bookingId ? `
              <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Booking ID</p>
                <p style="margin: 5px 0 0; color: #22c55e; font-size: 18px; font-weight: 700;">${data.bookingId}</p>
              </div>
              ` : ''}
              <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Doctor</p>
                <p style="margin: 5px 0 0; color: #8b5cf6; font-size: 20px; font-weight: 700;">Dr. ${data.doctorName}</p>
                ${data.doctorQualification ? `<p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">${data.doctorQualification}</p>` : ''}
                ${data.doctorSpecialization ? `<p style="margin: 5px 0 0; color: #8b5cf6; font-size: 14px;">${data.doctorSpecialization}</p>` : ''}
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
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${(data.consultationType || 'Physical').toUpperCase()}</p>
              </div>
              ${data.clinicName ? `
              <div style="margin-bottom: 12px;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">📍 Location</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 14px;">${data.clinicName}${data.clinicAddress ? `, ${data.clinicAddress}` : ''}</p>
              </div>
              ` : ''}
              ${data.appointmentFee ? `
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Consultation Fee</p>
                <p style="margin: 5px 0 0; color: #22c55e; font-size: 20px; font-weight: 700;">Rs. ${data.appointmentFee.toLocaleString()}</p>
              </div>
              ` : ''}
            </div>
            <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                📎 <strong>Attachment:</strong> Your appointment slip is attached to this email. Please print or save it and bring it to your appointment.
              </p>
            </div>
            <a href="${baseUrl}/my-bookings" 
               style="display: block; background: #22c55e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
              View My Appointments
            </a>
            ${footer}
          </div>
        </div>
      `
    };
  }

  if (data.type === 'nurse_booking') {
    return {
      subject: `✅ Nurse Booking Confirmed - ${data.nurseName}`,
      html: `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #22c55e, #10b981); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Booking Confirmed!</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              Dear <strong>${data.patientName}</strong>,
            </p>
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              Great news! Your home nursing service has been confirmed. Please find your booking details below.
            </p>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
              ${data.bookingId ? `
              <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Booking ID</p>
                <p style="margin: 5px 0 0; color: #22c55e; font-size: 18px; font-weight: 700;">${data.bookingId}</p>
              </div>
              ` : ''}
              <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Nurse</p>
                <p style="margin: 5px 0 0; color: #ec4899; font-size: 20px; font-weight: 700;">${data.nurseName}</p>
                ${data.nurseQualification ? `<p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">${data.nurseQualification}</p>` : ''}
                ${data.nursePhone ? `<p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">📞 ${data.nursePhone}</p>` : ''}
              </div>
              <div style="margin-bottom: 12px;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Service</p>
                <p style="margin: 5px 0 0; color: #ec4899; font-size: 16px; font-weight: 600;">${data.serviceNeeded}</p>
              </div>
              <div style="display: flex; gap: 20px; margin-bottom: 12px;">
                <div style="flex: 1;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">📅 Date</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.preferredDate}</p>
                </div>
                ${data.preferredTime ? `
                <div style="flex: 1;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">🕐 Time</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.preferredTime}</p>
                </div>
                ` : ''}
              </div>
              ${data.patientAddress ? `
              <div style="margin-bottom: 12px;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">📍 Visit Address</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 14px;">${data.patientAddress}</p>
              </div>
              ` : ''}
              ${data.nurseNotes ? `
              <div style="margin-bottom: 12px; background: #fef3c7; padding: 12px; border-radius: 8px;">
                <p style="margin: 0; color: #92400e; font-size: 12px; text-transform: uppercase;">📝 Additional Notes</p>
                <p style="margin: 5px 0 0; color: #78350f; font-size: 14px;">${data.nurseNotes}</p>
              </div>
              ` : ''}
              ${data.serviceFee ? `
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Service Fee</p>
                <p style="margin: 5px 0 0; color: #22c55e; font-size: 20px; font-weight: 700;">Rs. ${data.serviceFee.toLocaleString()}</p>
              </div>
              ` : ''}
            </div>
            <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                📎 <strong>Attachment:</strong> Your booking slip is attached to this email. Please keep it for reference.
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
  }

  return null;
};

// Generate customer confirmation email HTML for other types
const generateCustomerConfirmationHtml = (data: NotificationRequest): { subject: string; html: string } | null => {
  const baseUrl = "https://mypaklab.lovable.app";
  const footer = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
      <p style="color: #64748b; font-size: 14px; margin: 0;">Thank you for choosing MyPakLabs!</p>
      <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0;">
        For any queries, contact us at:<br>
        📞 +92 316 7523434 | 📧 support@mypaklabs.com
      </p>
    </div>
  `;

  // For prescription, doctor/nurse bookings, use status-based emails
  if (data.type === 'prescription' || data.type === 'doctor_appointment' || data.type === 'nurse_booking') {
    if (data.status === 'confirmed') {
      return generateConfirmedEmailHtml(data);
    }
    // Default to pending for new bookings
    return generatePendingEmailHtml(data);
  }

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

// Generate provider notification email HTML
const generateProviderNotificationHtml = (data: NotificationRequest, providerType: string): { subject: string; html: string } | null => {
  const baseUrl = "https://mypaklab.lovable.app";
  
  // Only send provider notification for new bookings (pending status or no status)
  if (data.status === 'confirmed') {
    // For confirmed status, we're sending confirmation to patient, not a new notification to provider
    return null;
  }
  
  switch (data.type) {
    case "doctor_appointment":
      return {
        subject: `🔔 New Appointment - ${data.patientName} on ${data.appointmentDate}`,
        html: `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #8b5cf6, #6366f1); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔔 New Appointment Booking</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                You have a new appointment booking from <strong>${data.patientName}</strong>.
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
                <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Patient Name</p>
                  <p style="margin: 5px 0 0; color: #8b5cf6; font-size: 20px; font-weight: 700;">${data.patientName}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">📅 Date & Time</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.appointmentDate} at ${data.appointmentTime}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Consultation Type</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.consultationType || 'Physical Visit'}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">📞 Patient Phone</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.patientPhone || 'N/A'}</p>
                </div>
                ${data.appointmentFee ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Consultation Fee</p>
                  <p style="margin: 5px 0 0; color: #22c55e; font-size: 20px; font-weight: 700;">Rs. ${data.appointmentFee}</p>
                </div>
                ` : ''}
              </div>
              <a href="${baseUrl}/doctor-dashboard" 
                 style="display: block; background: #8b5cf6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                View in Dashboard
              </a>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; text-align: center;">
                This is an automated notification from MyPakLabs.
              </p>
            </div>
          </div>
        `
      };

    case "nurse_booking":
      return {
        subject: `🔔 New Booking Request - ${data.patientName}`,
        html: `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ec4899, #f43f5e); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔔 New Booking Request</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                You have a new booking request from <strong>${data.patientName}</strong>.
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
                <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Patient Name</p>
                  <p style="margin: 5px 0 0; color: #ec4899; font-size: 20px; font-weight: 700;">${data.patientName}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Service Needed</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.serviceNeeded}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">📅 Preferred Date</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.preferredDate}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">🕐 Preferred Time</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.preferredTime || 'Flexible'}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">📞 Patient Phone</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.patientPhone || 'N/A'}</p>
                </div>
                ${data.patientAddress ? `
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">📍 Address</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 14px;">${data.patientAddress}</p>
                </div>
                ` : ''}
              </div>
              <a href="${baseUrl}/nurse-dashboard" 
                 style="display: block; background: #ec4899; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                View in Dashboard
              </a>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; text-align: center;">
                This is an automated notification from MyPakLabs.
              </p>
            </div>
          </div>
        `
      };

    case "emergency_request":
      const urgencyColor = data.urgency === 'critical' ? '#ef4444' : data.urgency === 'within_1_hour' ? '#f97316' : '#3b82f6';
      const urgencyLabel = data.urgency === 'critical' ? '🚨 CRITICAL' : data.urgency === 'within_1_hour' ? '⏰ URGENT' : '📅 SCHEDULED';
      return {
        subject: `${urgencyLabel} Emergency Nursing Request - ${data.patientName}`,
        html: `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: ${urgencyColor}; padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">${urgencyLabel} Emergency Request</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                A patient needs emergency nursing care. Open the app to view details and respond.
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
                <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Patient</p>
                  <p style="margin: 5px 0 0; color: ${urgencyColor}; font-size: 20px; font-weight: 700;">${data.patientName}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Location</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.city || 'N/A'}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Services</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 14px;">${data.services?.join(', ') || 'N/A'}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">📞 Phone</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.patientPhone || 'N/A'}</p>
                </div>
              </div>
              <a href="${baseUrl}/nurse-emergency-feed" 
                 style="display: block; background: ${urgencyColor}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                Respond to Request
              </a>
            </div>
          </div>
        `
      };

    case "medicine_order":
      return {
        subject: `🔔 New Medicine Order - ${data.orderId}`,
        html: `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #14b8a6, #0d9488); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔔 New Medicine Order</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                You have received a new medicine order from <strong>${data.patientName}</strong>.
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
                <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Order ID</p>
                  <p style="margin: 5px 0 0; color: #14b8a6; font-size: 20px; font-weight: 700;">${data.orderId}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Patient Name</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.patientName}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">📞 Patient Phone</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.patientPhone || 'N/A'}</p>
                </div>
                ${data.deliveryAddress ? `
                <div>
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">📍 Delivery Address</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 14px;">${data.deliveryAddress}</p>
                </div>
                ` : ''}
              </div>
              <a href="${baseUrl}/pharmacy-dashboard" 
                 style="display: block; background: #14b8a6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                View in Dashboard
              </a>
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
    const body = await req.json();
    
    // Handle special action to get user email
    if (body.action === 'get_user_email' && body.userId) {
      console.log("Getting user email for:", body.userId);
      try {
        const { data: userData, error } = await supabase.auth.admin.getUserById(body.userId);
        if (error) {
          console.error("Error getting user:", error);
          return new Response(
            JSON.stringify({ email: null, error: error.message }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        console.log("User email found:", userData?.user?.email);
        return new Response(
          JSON.stringify({ email: userData?.user?.email || null }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } catch (err) {
        console.error("Exception getting user:", err);
        return new Response(
          JSON.stringify({ email: null }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }
    
    const data: NotificationRequest = body;
    console.log("Notification request:", data);

    const isConfirmation = data.status === 'confirmed';
    let subject: string;
    let html: string;
    const baseUrl = "https://mypaklab.lovable.app";

    // Generate PDF based on type and status
    let pdfBase64: string | null = null;
    
    if (data.type === 'order' && data.tests && data.tests.length > 0) {
      console.log("Generating PDF for lab order...");
      pdfBase64 = generateLabBookingPDF(data);
    } else if (data.type === 'prescription' && isConfirmation && data.tests && data.tests.length > 0) {
      console.log("Generating PDF for prescription confirmation...");
      // Use lab booking PDF format for prescription confirmations
      pdfBase64 = generateLabBookingPDF({...data, type: 'order'});
    } else if (data.type === 'doctor_appointment' && isConfirmation) {
      console.log("Generating PDF for doctor appointment confirmation...");
      pdfBase64 = generateDoctorAppointmentPDF(data);
    } else if (data.type === 'nurse_booking' && isConfirmation) {
      console.log("Generating PDF for nurse booking confirmation...");
      pdfBase64 = generateNurseBookingPDF(data);
    }
    
    if (pdfBase64) {
      console.log("PDF generated successfully");
    }

    // Generate admin email content
    switch (data.type) {
      case "prescription":
        subject = isConfirmation 
          ? `✅ Prescription Approved - ${data.orderId}`
          : "📋 New Prescription Uploaded - Action Required";
        html = isConfirmation ? `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #22c55e, #10b981); padding: 30px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">✅ Prescription Approved</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                Prescription for <strong>${data.patientName}</strong> has been approved with ${data.tests?.length || 0} test(s).
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">Discount ID</p>
                <p style="margin: 5px 0 0; color: #22c55e; font-size: 18px; font-weight: 600;">${data.orderId}</p>
                <p style="margin: 15px 0 0; color: #64748b; font-size: 14px;">Lab</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.labName || 'N/A'}</p>
                ${data.totalDiscounted ? `
                <p style="margin: 15px 0 0; color: #64748b; font-size: 14px;">Total Payable</p>
                <p style="margin: 5px 0 0; color: #22c55e; font-size: 18px; font-weight: 600;">Rs. ${data.totalDiscounted.toLocaleString()}</p>
                ` : ''}
              </div>
              <a href="${baseUrl}/admin/prescriptions" 
                 style="display: inline-block; background: #22c55e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 10px;">
                View Prescriptions
              </a>
            </div>
          </div>
        ` : `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0ea5e9, #6366f1); padding: 30px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Prescription Uploaded</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                <strong>${data.patientName}</strong> has uploaded a new prescription that requires your review.
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                ${data.labName ? `
                <p style="margin: 0; color: #64748b; font-size: 14px;">Selected Lab</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${data.labName}</p>
                ` : ''}
                ${data.patientPhone ? `
                <p style="margin: 15px 0 0; color: #64748b; font-size: 14px;">Patient Phone</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${data.patientPhone}</p>
                ` : ''}
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
        subject = isConfirmation 
          ? `✅ Appointment Confirmed - ${data.patientName} with Dr. ${data.doctorName}`
          : `👨‍⚕️ New Doctor Appointment - ${data.patientName}`;
        html = `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, ${isConfirmation ? '#22c55e, #10b981' : '#8b5cf6, #6366f1'}); padding: 30px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">${isConfirmation ? '✅ Appointment Confirmed' : 'New Doctor Appointment'}</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px;">
                ${isConfirmation ? `Appointment for <strong>${data.patientName}</strong> has been confirmed.` : `<strong>${data.patientName}</strong> has booked an appointment.`}
              </p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; color: #64748b; font-size: 14px;">Doctor</p>
                  <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">Dr. ${data.doctorName || 'N/A'}</p>
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
        subject = isConfirmation 
          ? `✅ Nurse Booking Confirmed - ${data.patientName}`
          : `👩‍⚕️ New Nurse Booking - ${data.patientName}`;
        html = `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, ${isConfirmation ? '#22c55e, #10b981' : '#ec4899, #f43f5e'}); padding: 30px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">${isConfirmation ? '✅ Booking Confirmed' : 'New Nurse Booking'}</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 16px;">
                ${isConfirmation ? `Booking for <strong>${data.patientName}</strong> has been confirmed.` : `<strong>${data.patientName}</strong> has requested a nurse booking.`}
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
                ${data.nurseNotes ? `
                <div style="margin-top: 12px; background: #fef3c7; padding: 12px; border-radius: 8px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Notes:</strong> ${data.nurseNotes}</p>
                </div>
                ` : ''}
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

    // Prepare attachments
    let attachmentFilename = '';
    if (data.type === 'order') {
      attachmentFilename = `MyPakLabs-Booking-${data.orderId}.pdf`;
    } else if (data.type === 'prescription' && isConfirmation) {
      attachmentFilename = `MyPakLabs-Prescription-${data.orderId}.pdf`;
    } else if (data.type === 'doctor_appointment') {
      attachmentFilename = `MyPakLabs-Appointment-${data.bookingId || data.appointmentDate}.pdf`;
    } else if (data.type === 'nurse_booking') {
      attachmentFilename = `MyPakLabs-NurseBooking-${data.bookingId || data.preferredDate}.pdf`;
    }
    
    const attachments = pdfBase64
      ? [{ filename: attachmentFilename, content: pdfBase64 }]
      : undefined;

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
      attachments?: any[];
    }) => {
      const primary = await resend.emails.send({
        from: OFFICIAL_EMAIL,
        to: args.to,
        subject: args.subject,
        html: args.html,
        attachments: args.attachments,
      });

      if (primary?.error && isDomainNotVerified(primary.error)) {
        console.warn("Sender domain not verified. Retrying with fallback sender.");
        const fallback = await resend.emails.send({
          from: FALLBACK_EMAIL,
          to: args.to,
          subject: args.subject,
          html: args.html,
          attachments: args.attachments,
        });
        return { primary, fallback };
      }

      return { primary, fallback: null };
    };

    // ===== SEND ADMIN NOTIFICATION =====
    console.log("Sending admin email to:", data.adminEmail);
    const adminSend = await sendWithFallback({
      to: [data.adminEmail],
      subject,
      html,
      attachments,
    });
    console.log("Admin notification email sent:", adminSend);

    // ===== SEND PROVIDER NOTIFICATION (only for new bookings, not confirmations) =====
    let providerSend: any = null;
    let providerEmails: string[] = [];

    if (!isConfirmation) {
      if (data.type === "doctor_appointment" && data.doctorId) {
        const doctorEmail = await getProviderEmail("doctor", data.doctorId);
        if (doctorEmail) {
          providerEmails.push(doctorEmail);
          console.log("Doctor email found:", doctorEmail);
        }
      } else if (data.type === "nurse_booking" && data.nurseId) {
        const nurseEmail = await getProviderEmail("nurse", data.nurseId);
        if (nurseEmail) {
          providerEmails.push(nurseEmail);
          console.log("Nurse email found:", nurseEmail);
        }
      } else if (data.type === "emergency_request") {
        const nursesEmails = await getApprovedNursesEmails();
        providerEmails = nursesEmails;
        console.log("Emergency available nurses emails:", providerEmails.length);
      } else if (data.type === "medicine_order" && data.storeId) {
        const pharmacyEmail = await getProviderEmail("pharmacy", data.storeId);
        if (pharmacyEmail) {
          providerEmails.push(pharmacyEmail);
          console.log("Pharmacy email found:", pharmacyEmail);
        }
      }

      if (providerEmails.length > 0) {
        const providerEmailContent = generateProviderNotificationHtml(data, data.type);
        if (providerEmailContent) {
          console.log("Sending provider notification to:", providerEmails);
          providerSend = await sendWithFallback({
            to: providerEmails,
            subject: providerEmailContent.subject,
            html: providerEmailContent.html,
          });
          console.log("Provider notification email sent:", providerSend);
        }
      }
    }

    // ===== SEND CUSTOMER CONFIRMATION EMAIL =====
    let customerSend: any = null;
    if (data.patientEmail) {
      const customerEmail = generateCustomerConfirmationHtml(data);
      if (customerEmail) {
        console.log("Sending customer confirmation email to:", data.patientEmail);
        customerSend = await sendWithFallback({
          to: [data.patientEmail],
          subject: customerEmail.subject,
          html: customerEmail.html,
          attachments,
        });
        console.log("Customer confirmation email sent:", customerSend);
      }
    }

    const adminError = adminSend?.fallback?.error || adminSend?.primary?.error || null;
    const customerError = customerSend?.fallback?.error || customerSend?.primary?.error || null;
    const providerError = providerSend?.fallback?.error || providerSend?.primary?.error || null;
    const ok = !adminError && (!data.patientEmail || !customerError);

    return new Response(
      JSON.stringify({
        success: ok,
        adminEmail: adminSend,
        customerEmail: customerSend,
        providerEmail: providerSend,
        pdfGenerated: !!pdfBase64,
        providerEmailsCount: providerEmails.length,
        status: data.status || 'pending',
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
