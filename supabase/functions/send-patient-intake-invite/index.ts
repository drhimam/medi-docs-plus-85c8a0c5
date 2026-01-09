import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface IntakeInviteRequest {
  patientEmail: string;
  patientName?: string;
  intakeToken: string;
  clinicName?: string;
  doctorName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientEmail, patientName, intakeToken, clinicName, doctorName }: IntakeInviteRequest = await req.json();

    if (!patientEmail || !intakeToken) {
      return new Response(
        JSON.stringify({ error: "Patient email and intake token are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // Extract the project ref from the Supabase URL to build the app URL
    const projectRef = supabaseUrl?.replace("https://", "").split(".")[0];
    const intakeUrl = `https://${projectRef}.lovableproject.com/patient-intake/${intakeToken}`;

    const greeting = patientName ? `Dear ${patientName}` : "Dear Patient";
    const clinicInfo = clinicName || "our clinic";
    const doctorInfo = doctorName ? `Dr. ${doctorName}` : "Your healthcare provider";

    const emailResponse = await resend.emails.send({
      from: "eDoctorDesk <onboarding@resend.dev>",
      to: [patientEmail],
      subject: `Patient Intake Form - ${clinicInfo}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Patient Intake Form</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="padding: 20px 0;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Patient Intake Form</h1>
                      <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${clinicInfo}</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.6;">
                        ${greeting},
                      </p>
                      <p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.6;">
                        ${doctorInfo} has requested that you complete your patient intake form prior to your visit. This helps us prepare for your appointment and ensures we have your most up-to-date health information.
                      </p>
                      <p style="margin: 0 0 30px; color: #333; font-size: 16px; line-height: 1.6;">
                        Please click the button below to access and complete your intake form:
                      </p>
                      
                      <!-- CTA Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                        <tr>
                          <td style="border-radius: 8px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);">
                            <a href="${intakeUrl}" target="_blank" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                              Complete Intake Form
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 20px; color: #666; font-size: 14px; line-height: 1.6;">
                        <strong>Important:</strong> This link will expire in 7 days. Please complete the form before your scheduled appointment.
                      </p>
                      
                      <p style="margin: 0 0 10px; color: #666; font-size: 14px; line-height: 1.6;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin: 0 0 20px; color: #3b82f6; font-size: 12px; word-break: break-all;">
                        ${intakeUrl}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                        This is an automated message from eDoctorDesk. Please do not reply to this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Patient intake invite sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending patient intake invite:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
