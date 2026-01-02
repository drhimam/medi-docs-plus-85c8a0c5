import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PrescriptionEmailRequest {
  recipientEmail: string;
  ccEmails?: string[];
  bccEmails?: string[];
  subject: string;
  patientName: string;
  prescription: string;
  additionalMessage?: string;
  doctorName: string;
  clinicName?: string;
  clinicAddress?: string;
  specialty?: string;
  licenseNumber?: string;
  phone?: string;
  pdfBase64?: string;
  pdfFilename?: string;
}

const formatPrescriptionContent = (html: string): string => {
  if (!html) return '<p style="color: #6b7280; font-style: italic;">No prescription details provided</p>';
  
  let content = html
    .replace(/<br\s*\/?>/gi, '<br>')
    .replace(/<p>/gi, '<p style="margin: 8px 0;">')
    .replace(/<strong>/gi, '<strong>')
    .replace(/<b>/gi, '<strong>')
    .replace(/<\/b>/gi, '</strong>')
    .replace(/<em>/gi, '<em>')
    .replace(/<i>/gi, '<em>')
    .replace(/<\/i>/gi, '</em>')
    .replace(/<u>/gi, '<u>')
    .replace(/<ul>/gi, '<ul style="margin: 8px 0; padding-left: 20px;">')
    .replace(/<ol>/gi, '<ol style="margin: 8px 0; padding-left: 20px;">')
    .replace(/<li>/gi, '<li style="margin: 4px 0;">')
    .replace(/&nbsp;/g, ' ');
  
  return content;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-prescription-email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      recipientEmail,
      ccEmails,
      bccEmails,
      subject,
      patientName,
      prescription,
      additionalMessage,
      doctorName,
      clinicName,
      clinicAddress,
      specialty,
      licenseNumber,
      phone,
      pdfBase64,
      pdfFilename,
    }: PrescriptionEmailRequest = await req.json();

    console.log(`Sending prescription email to: ${recipientEmail}`);
    if (ccEmails?.length) console.log(`CC: ${ccEmails.join(', ')}`);
    if (bccEmails?.length) console.log(`BCC: ${bccEmails.join(', ')}`);
    if (pdfBase64) console.log("PDF attachment included");

    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 25px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Prescription</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">${currentDate}</p>
          </div>
          
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 25px; border-radius: 0 0 8px 8px;">
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="margin: 0;"><strong>Patient:</strong> ${patientName}</p>
              ${clinicName ? `<p style="margin: 5px 0 0 0;"><strong>From:</strong> ${clinicName}</p>` : ''}
              ${clinicAddress ? `<p style="margin: 2px 0 0 0; font-size: 13px; color: #6b7280;">${clinicAddress}</p>` : ''}
              <p style="margin: 5px 0 0 0;"><strong>Provider:</strong> ${doctorName}${specialty ? ` (${specialty})` : ''}</p>
              ${licenseNumber ? `<p style="margin: 2px 0 0 0; font-size: 13px; color: #6b7280;">License: ${licenseNumber}</p>` : ''}
              ${phone ? `<p style="margin: 2px 0 0 0; font-size: 13px; color: #6b7280;">Phone: ${phone}</p>` : ''}
            </div>

            ${additionalMessage ? `
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 15px; margin-bottom: 20px; border-radius: 0 6px 6px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>Note from your provider:</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">${additionalMessage}</p>
              </div>
            ` : ''}

            <div style="margin-bottom: 20px;">
              <div style="background: #059669; color: white; padding: 10px 15px; border-radius: 6px 6px 0 0; font-weight: bold;">
                PRESCRIPTION DETAILS
              </div>
              <div style="border: 1px solid #e5e7eb; border-top: none; padding: 15px; border-radius: 0 0 6px 6px; font-size: 14px;">
                ${formatPrescriptionContent(prescription)}
              </div>
            </div>

            ${pdfBase64 ? `
              <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px 15px; margin-bottom: 20px; border-radius: 0 6px 6px 0;">
                <p style="margin: 0; font-size: 14px;">📎 <strong>PDF attachment included</strong> - A printable prescription document is attached to this email.</p>
              </div>
            ` : ''}

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
              <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
                This prescription was generated and sent electronically. Please present this email or the attached PDF to your pharmacist. If you have any questions, please contact your healthcare provider.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Build email options
    const emailOptions: any = {
      from: "Healthcare Provider <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: subject,
      html: emailHtml,
    };

    // Add CC if provided
    if (ccEmails && ccEmails.length > 0) {
      emailOptions.cc = ccEmails;
    }

    // Add BCC if provided
    if (bccEmails && bccEmails.length > 0) {
      emailOptions.bcc = bccEmails;
    }

    // Add PDF attachment if provided
    if (pdfBase64 && pdfFilename) {
      emailOptions.attachments = [
        {
          filename: pdfFilename,
          content: pdfBase64,
        },
      ];
    }

    const emailResponse = await resend.emails.send(emailOptions);

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-prescription-email function:", error);
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
