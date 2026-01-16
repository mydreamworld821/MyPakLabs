import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "prescription" | "order" | "doctor_appointment" | "nurse_booking" | "emergency_request" | "medicine_order";
  patientName: string;
  patientPhone?: string;
  labName?: string;
  orderId?: string;
  adminEmail: string;
  // Doctor appointment specific
  doctorName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  consultationType?: string;
  // Nurse booking specific
  nurseName?: string;
  serviceNeeded?: string;
  preferredDate?: string;
  // Emergency request specific
  city?: string;
  urgency?: string;
  services?: string[];
  // Medicine order specific
  pharmacyName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationRequest = await req.json();
    console.log("Admin notification request:", data);

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

    // Add footer to all emails
    html = html.replace('</div>\n        </div>', `
              <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                This is an automated notification from MyPakLabs.<br>
                Contact: +923167523434 | support@mypaklabs.com
              </p>
            </div>
          </div>
    `);

    const emailResponse = await resend.emails.send({
      from: "MyPakLabs <onboarding@resend.dev>",
      to: [data.adminEmail],
      subject,
      html,
    });

    console.log("Admin notification email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending admin notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
