import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectTo: string;
}

const COOLDOWN_MINUTES = 5;
const MAX_ATTEMPTS_PER_EMAIL = 3;
const MAX_ATTEMPTS_PER_IP = 5;

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectTo }: PasswordResetRequest = await req.json();

    // Get client IP address
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                      req.headers.get("x-real-ip") || 
                      "unknown";

    console.log("Password reset requested for:", email, "from IP:", ipAddress);

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check recent attempts by email
    const emailCheckTime = new Date(Date.now() - COOLDOWN_MINUTES * 60 * 1000);
    const { data: emailAttempts, error: emailError } = await supabaseAdmin
      .from("password_reset_attempts")
      .select("*")
      .eq("email", email)
      .gte("created_at", emailCheckTime.toISOString());

    if (emailError) {
      console.error("Error checking email attempts:", emailError);
      throw new Error("Failed to check rate limit");
    }

    if (emailAttempts && emailAttempts.length >= MAX_ATTEMPTS_PER_EMAIL) {
      console.log("Rate limit exceeded for email:", email);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Too many password reset attempts. Please try again in 5 minutes.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check recent attempts by IP
    const { data: ipAttempts, error: ipError } = await supabaseAdmin
      .from("password_reset_attempts")
      .select("*")
      .eq("ip_address", ipAddress)
      .gte("created_at", emailCheckTime.toISOString());

    if (ipError) {
      console.error("Error checking IP attempts:", ipError);
      throw new Error("Failed to check rate limit");
    }

    if (ipAttempts && ipAttempts.length >= MAX_ATTEMPTS_PER_IP) {
      console.log("Rate limit exceeded for IP:", ipAddress);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Too many password reset attempts. Please try again in 5 minutes.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Record this attempt
    const { error: insertError } = await supabaseAdmin
      .from("password_reset_attempts")
      .insert({
        email,
        ip_address: ipAddress,
      });

    if (insertError) {
      console.error("Error recording attempt:", insertError);
      // Continue anyway - don't fail the request just because we couldn't log it
    }

    // Create regular client for password reset
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Attempt password reset
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (resetError) {
      console.error("Password reset error:", resetError);
      throw resetError;
    }

    console.log("Password reset email sent successfully to:", email);

    // Clean up old attempts (older than 1 hour)
    try {
      await supabaseAdmin.rpc("cleanup_old_reset_attempts");
    } catch (cleanupError) {
      console.error("Cleanup error (non-critical):", cleanupError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "If an account with that email exists, you'll receive a password reset link.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in password-reset-with-rate-limit function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unable to process password reset request. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
