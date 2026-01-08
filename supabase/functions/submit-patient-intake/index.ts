import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface IntakeSubmission {
  intakeToken: string;
  formData: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { intakeToken, formData }: IntakeSubmission = await req.json();

    if (!intakeToken || !formData) {
      return new Response(
        JSON.stringify({ error: "Intake token and form data are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the intake submission by token
    const { data: submission, error: fetchError } = await supabase
      .from("patient_intake_submissions")
      .select("*")
      .eq("intake_token", intakeToken)
      .single();

    if (fetchError || !submission) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired intake link" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if already submitted
    if (submission.status === "submitted" || submission.status === "approved") {
      return new Response(
        JSON.stringify({ error: "This intake form has already been submitted" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if expired
    if (new Date(submission.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This intake link has expired" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update the submission with form data
    const { error: updateError } = await supabase
      .from("patient_intake_submissions")
      .update({
        form_data: formData,
        patient_name: formData.first_name && formData.last_name 
          ? `${formData.first_name} ${formData.last_name}` 
          : null,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", submission.id);

    if (updateError) {
      console.error("Error updating intake submission:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to submit intake form" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Intake form submitted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error processing intake submission:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
