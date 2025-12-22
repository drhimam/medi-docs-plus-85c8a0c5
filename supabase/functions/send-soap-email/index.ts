import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SOAPEmailRequest {
  recipientEmail: string;
  subject: string;
  patientName: string;
  soapNote: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  additionalMessage?: string;
  doctorName: string;
  clinicName?: string;
  specialty?: string;
}

const formatContent = (text: string): string => {
  if (!text) return '<p style="color: #6b7280; font-style: italic;">No data provided</p>';
  
  return text
    .split('\n')
    .map(line => {
      // Handle bold
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Handle italic
      line = line.replace(/\*(.+?)\*/g, '<em>$1</em>');
      // Handle bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return `<p style="margin: 2px 0; padding-left: 20px;">• ${line.replace(/^[\s]*[-•]\s*/, '')}</p>`;
      }
      // Handle numbered lists
      const numberedMatch = line.trim().match(/^(\d+)\.\s/);
      if (numberedMatch) {
        return `<p style="margin: 2px 0; padding-left: 20px;">${numberedMatch[1]}. ${line.replace(/^[\s]*\d+\.\s*/, '')}</p>`;
      }
      // Check if it's a section header
      if (line === line.toUpperCase() && line.length > 3 && line.trim().length > 0) {
        return `<p style="margin: 8px 0 4px 0; font-weight: bold;">${line}</p>`;
      }
      if (line.trim().endsWith(':') && line.length < 50) {
        return `<p style="margin: 6px 0 2px 0; font-weight: 600;">${line}</p>`;
      }
      return `<p style="margin: 2px 0;">${line || '&nbsp;'}</p>`;
    })
    .join('');
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-soap-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      recipientEmail,
      subject,
      patientName,
      soapNote,
      additionalMessage,
      doctorName,
      clinicName,
      specialty,
    }: SOAPEmailRequest = await req.json();

    console.log(`Sending SOAP note email to: ${recipientEmail}`);

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
          <div style="background: linear-gradient(135deg, #2980b9, #3498db); padding: 25px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">SOAP Note</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">${currentDate}</p>
          </div>
          
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 25px; border-radius: 0 0 8px 8px;">
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="margin: 0;"><strong>Patient:</strong> ${patientName}</p>
              ${clinicName ? `<p style="margin: 5px 0 0 0;"><strong>From:</strong> ${clinicName}</p>` : ''}
              <p style="margin: 5px 0 0 0;"><strong>Provider:</strong> ${doctorName}${specialty ? ` (${specialty})` : ''}</p>
            </div>

            ${additionalMessage ? `
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 15px; margin-bottom: 20px; border-radius: 0 6px 6px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>Note from your provider:</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">${additionalMessage}</p>
              </div>
            ` : ''}

            <div style="margin-bottom: 20px;">
              <div style="background: #3498db; color: white; padding: 10px 15px; border-radius: 6px 6px 0 0; font-weight: bold;">
                SUBJECTIVE
              </div>
              <div style="border: 1px solid #e5e7eb; border-top: none; padding: 15px; border-radius: 0 0 6px 6px; font-size: 14px;">
                ${formatContent(soapNote.subjective)}
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <div style="background: #2ecc71; color: white; padding: 10px 15px; border-radius: 6px 6px 0 0; font-weight: bold;">
                OBJECTIVE
              </div>
              <div style="border: 1px solid #e5e7eb; border-top: none; padding: 15px; border-radius: 0 0 6px 6px; font-size: 14px;">
                ${formatContent(soapNote.objective)}
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <div style="background: #9b59b6; color: white; padding: 10px 15px; border-radius: 6px 6px 0 0; font-weight: bold;">
                ASSESSMENT
              </div>
              <div style="border: 1px solid #e5e7eb; border-top: none; padding: 15px; border-radius: 0 0 6px 6px; font-size: 14px;">
                ${formatContent(soapNote.assessment)}
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <div style="background: #e67e22; color: white; padding: 10px 15px; border-radius: 6px 6px 0 0; font-weight: bold;">
                PLAN
              </div>
              <div style="border: 1px solid #e5e7eb; border-top: none; padding: 15px; border-radius: 0 0 6px 6px; font-size: 14px;">
                ${formatContent(soapNote.plan)}
              </div>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
              <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
                This SOAP note was generated and sent electronically. If you have any questions, please contact your healthcare provider.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Healthcare Provider <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-soap-email function:", error);
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
