import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    if (!email || typeof email !== "string") {
      throw new Error("Email is required");
    }

    if (email.length > 255) {
      throw new Error("Email must be 255 characters or less");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate password reset link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${req.headers.get("origin") || supabaseUrl}/`,
      },
    });

    if (error) {
      console.error("Error generating reset link:", error);
      throw error;
    }

    const resetLink = data.properties.action_link;

    // Create HTML email content
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 20px 0 48px;">
            <tr>
              <td align="center">
                <table width="580" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #1e40af; padding: 32px 24px; text-align: center;">
                      <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0 0 8px; line-height: 1.2;">🏥 MedDoc</h1>
                      <p style="color: #93c5fd; font-size: 14px; margin: 0; font-weight: 500;">Medical Documentation Platform</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px 24px;">
                      <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 16px;">Password Reset Request</h2>
                      <p style="color: #475569; font-size: 16px; line-height: 24px; margin: 16px 0;">
                        We received a request to reset your password for your MedDoc account.
                      </p>
                      <p style="color: #475569; font-size: 16px; line-height: 24px; margin: 16px 0;">
                        Click the button below to create a new password:
                      </p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                        <tr>
                          <td align="center">
                            <a href="${resetLink}" style="background-color: #1e40af; border-radius: 6px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: 600; padding: 16px 32px; text-decoration: none; text-align: center;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #64748b; font-size: 14px; line-height: 20px; margin: 24px 0 8px;">
                        Or copy and paste this link into your browser:
                      </p>
                      <p style="color: #1e40af; font-size: 13px; word-break: break-all; margin: 0 0 16px;">
                        ${resetLink}
                      </p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; margin: 24px 0; border-radius: 4px;">
                        <tr>
                          <td style="padding: 16px;">
                            <p style="color: #92400e; font-size: 14px; line-height: 20px; margin: 8px 0;">
                              ⚠️ <strong>Security Notice:</strong> This link will expire in 1 hour for your security.
                            </p>
                            <p style="color: #92400e; font-size: 14px; line-height: 20px; margin: 8px 0;">
                              If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="text-align: center; padding: 24px 0 32px;">
                      <p style="color: #94a3b8; font-size: 12px; line-height: 16px; margin: 4px 0;">
                        MedDoc - Professional Medical Documentation
                      </p>
                      <p style="color: #94a3b8; font-size: 12px; line-height: 16px; margin: 4px 0;">
                        Secure • Compliant • Efficient
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Send the email
    const emailResponse = await resend.emails.send({
      from: "MedDoc <onboarding@resend.dev>",
      to: [email],
      subject: "Reset Your MedDoc Password",
      html,
    });

    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      
      // Handle Resend validation errors (unverified domain)
      if (emailResponse.error.name === "validation_error" && 
          emailResponse.error.message?.includes("verify a domain")) {
        return new Response(
          JSON.stringify({ 
            error: "Email service configuration required. Please contact support.",
            success: false 
          }),
          {
            status: 503,
            headers: { 
              "Content-Type": "application/json", 
              ...corsHeaders 
            },
          }
        );
      }
      
      throw emailResponse.error;
    }

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "If an account with that email exists, you'll receive a password reset link." 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Unable to process password reset request. Please try again later.",
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
