import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "prescription" | "order";
  patientName: string;
  labName?: string;
  orderId?: string;
  adminEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, patientName, labName, orderId, adminEmail }: NotificationRequest = await req.json();

    let subject: string;
    let html: string;

    if (type === "prescription") {
      subject = "📋 New Prescription Uploaded - Action Required";
      html = `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9, #6366f1); padding: 30px; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Prescription Uploaded</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              <strong>${patientName}</strong> has uploaded a new prescription that requires your review.
            </p>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">Patient Name</p>
              <p style="margin: 5px 0 0; color: #1e293b; font-size: 18px; font-weight: 600;">${patientName}</p>
            </div>
            <a href="https://tdxhlewkukiyjkptorpl.lovableproject.com/admin/prescriptions" 
               style="display: inline-block; background: #0ea5e9; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 10px;">
              Review Prescription
            </a>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">
              This is an automated notification from Medilabs Admin Panel.
            </p>
          </div>
        </div>
      `;
    } else {
      subject = `🛒 New Order Placed - ${orderId}`;
      html = `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #22c55e, #10b981); padding: 30px; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Order Placed</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              <strong>${patientName}</strong> has placed a new order for lab tests.
            </p>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">Order ID</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 18px; font-weight: 600;">${orderId}</p>
              </div>
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">Patient</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${patientName}</p>
              </div>
              <div>
                <p style="margin: 0; color: #64748b; font-size: 14px;">Lab</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px;">${labName || 'N/A'}</p>
              </div>
            </div>
            <a href="https://tdxhlewkukiyjkptorpl.lovableproject.com/admin/orders" 
               style="display: inline-block; background: #22c55e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 10px;">
              View Order
            </a>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">
              This is an automated notification from Medilabs Admin Panel.
            </p>
          </div>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Medilabs <onboarding@resend.dev>",
      to: [adminEmail],
      subject,
      html,
    });

    console.log("Admin notification email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending admin notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
