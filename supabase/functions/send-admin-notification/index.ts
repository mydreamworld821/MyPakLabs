import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Official sender email - domain must be verified in Resend
const OFFICIAL_EMAIL = "MyPakLabs <support@mypaklabs.com>";

interface NotificationRequest {
  type: "prescription" | "order" | "doctor_appointment" | "nurse_booking" | "emergency_request" | "medicine_order";
  patientName: string;
  patientPhone?: string;
  patientEmail?: string; // Customer email for confirmation
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
}

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
                  💡 <strong>Next Steps:</strong> Please visit the lab with your booking ID and a valid ID. Our team will assist you with the sample collection.
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

    // Send admin notification email
    console.log("Sending admin email to:", data.adminEmail);
    const adminEmailResponse = await resend.emails.send({
      from: OFFICIAL_EMAIL,
      to: [data.adminEmail],
      subject,
      html,
    });

    console.log("Admin notification email sent:", adminEmailResponse);

    // Send customer confirmation email if patientEmail is provided
    let customerEmailResponse = null;
    if (data.patientEmail) {
      const customerEmail = generateCustomerConfirmationHtml(data);
      if (customerEmail) {
        console.log("Sending customer confirmation email to:", data.patientEmail);
        customerEmailResponse = await resend.emails.send({
          from: OFFICIAL_EMAIL,
          to: [data.patientEmail],
          subject: customerEmail.subject,
          html: customerEmail.html,
        });
        console.log("Customer confirmation email sent:", customerEmailResponse);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      adminEmail: adminEmailResponse,
      customerEmail: customerEmailResponse 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
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
