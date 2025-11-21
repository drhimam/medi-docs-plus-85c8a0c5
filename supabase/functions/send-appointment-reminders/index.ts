import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate tomorrow's date (24 hours from now)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    console.log(`Checking for appointments on ${tomorrowDate}`);

    // Fetch appointments scheduled for tomorrow with patient details
    const { data: appointments, error: fetchError } = await supabase
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
      .eq("appointment_date", tomorrowDate)
      .eq("status", "scheduled");

    if (fetchError) {
      console.error("Error fetching appointments:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${appointments?.length || 0} appointments for tomorrow`);

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ message: "No appointments found for tomorrow" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailResults = [];

    // Send email to each patient
    for (const appointment of appointments) {
      const patient = appointment.patients as any;
      
      if (!patient?.email) {
        console.log(`No email for patient in appointment ${appointment.id}`);
        continue;
      }

      try {
        const emailResponse = await resend.emails.send({
          from: "Medical Clinic <onboarding@resend.dev>",
          to: [patient.email],
          subject: "Appointment Reminder - Tomorrow",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">Appointment Reminder</h1>
              <p>Dear ${patient.first_name} ${patient.last_name},</p>
              <p>This is a friendly reminder about your upcoming appointment:</p>
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
              <p>Please arrive 10 minutes early to complete any necessary paperwork.</p>
              <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
              <p style="margin-top: 30px;">Best regards,<br>Medical Clinic Team</p>
            </div>
          `,
        });

        console.log(`Email sent to ${patient.email}:`, emailResponse);
        emailResults.push({
          appointmentId: appointment.id,
          email: patient.email,
          success: true,
        });
      } catch (emailError: any) {
        console.error(`Error sending email to ${patient.email}:`, emailError);
        emailResults.push({
          appointmentId: appointment.id,
          email: patient.email,
          success: false,
          error: emailError.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${appointments.length} appointments`,
        results: emailResults,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-appointment-reminders function:", error);
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
