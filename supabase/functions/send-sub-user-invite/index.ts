import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  inviteToken: string;
  ownerEmail: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, inviteToken, ownerEmail }: InviteRequest = await req.json();

    if (!email || !inviteToken) {
      throw new Error("Email and invite token are required");
    }

    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || 
                   "https://xvpenhgywuxeaenebsji.lovable.app";
    const inviteUrl = `${baseUrl}/accept-invite?token=${inviteToken}`;

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">eDoctorDesk</h1>
    <p style="color: #666; margin-top: 5px;">Medical Practice Management</p>
  </div>
  
  <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h2 style="margin-top: 0;">You've been invited!</h2>
    <p>
      <strong>${ownerEmail}</strong> has invited you to join their medical practice team on eDoctorDesk.
    </p>
    <p>
      As a team member, you'll have restricted access to help manage the practice according to the permissions set by the account owner.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="background: #2563eb; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
        Accept Invitation
      </a>
    </div>
    <p style="font-size: 14px; color: #666;">
      This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
  
  <div style="text-align: center; font-size: 12px; color: #999;">
    <p>eDoctorDesk - Simplifying Medical Practice Management</p>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "eDoctorDesk <onboarding@resend.dev>",
        to: [email],
        subject: "You've been invited to join eDoctorDesk",
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend error:", errorData);
      throw new Error("Failed to send email");
    }

    const data = await res.json();

    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending invite:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
