import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate ICS calendar file content
const generateICS = (appointment: any, patient: any): string => {
  const startDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration
  
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Medical Clinic//Appointment//EN
BEGIN:VEVENT
UID:${appointment.id}@medicalclinic.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDateTime)}
DTEND:${formatDate(endDateTime)}
SUMMARY:Medical Appointment - ${appointment.reason}
DESCRIPTION:Appointment with Medical Clinic\\nReason: ${appointment.reason}
LOCATION:Medical Clinic
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId } = await req.json();

    if (!appointmentId) {
      throw new Error("appointmentId is required");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch appointment with patient details
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        reason,
        patients (
          first_name,
          last_name,
          email
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (fetchError) {
      console.error("Error fetching appointment:", fetchError);
      throw fetchError;
    }

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    const patient = appointment.patients as any;

    if (!patient?.email) {
      console.log(`No email for patient in appointment ${appointment.id}`);
      return new Response(
        JSON.stringify({ message: "Patient email not found" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate calendar invite
    const icsContent = generateICS(appointment, patient);
    const icsBase64 = btoa(icsContent);

    // Send confirmation email with calendar attachment
    const emailResponse = await resend.emails.send({
      from: "Medical Clinic <onboarding@resend.dev>",
      to: [patient.email],
      subject: "Appointment Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Appointment Confirmed</h1>
          <p>Dear ${patient.first_name} ${patient.last_name},</p>
          <p>Your appointment has been successfully scheduled. Here are the details:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(appointment.appointment_date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${appointment.appointment_time}</p>
            <p style="margin: 10px 0;"><strong>Reason:</strong> ${appointment.reason}</p>
          </div>
          <p>A calendar invite has been attached to this email for your convenience.</p>
          <p>Please arrive 10 minutes early to complete any necessary paperwork.</p>
          <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
          <p style="margin-top: 30px;">Best regards,<br>Medical Clinic Team</p>
        </div>
      `,
      attachments: [
        {
          filename: 'appointment.ics',
          content: icsBase64,
        },
      ],
    });

    console.log(`Confirmation email sent to ${patient.email}:`, emailResponse);

    return new Response(
      JSON.stringify({
        message: "Appointment confirmation sent successfully",
        emailId: emailResponse.data?.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-appointment-confirmation function:", error);
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
