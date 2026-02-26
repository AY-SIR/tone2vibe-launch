import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "http://localhost:8080",
  "http://localhost:5173",
  "https://tone2vibe.in",
  "https://www.tone2vibe.in",
  "https://tone2vibe-launch.vercel.app",
]);

const previewOriginRegex = /^https:\/\/[a-z0-9-]+\.(lovableproject\.com|lovable\.app)$/i;

function resolveAllowedOrigin(origin: string | null) {
  if (!origin) return "https://tone2vibe.in";
  if (allowedOrigins.has(origin) || previewOriginRegex.test(origin)) return origin;
  return null;
}

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = resolveAllowedOrigin(origin);
  return {
    "Access-Control-Allow-Origin": allowedOrigin ?? "https://tone2vibe.in",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const isOriginAllowed = !origin || resolveAllowedOrigin(origin) !== null;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: isOriginAllowed ? 204 : 403, headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  if (!isOriginAllowed) {
    return new Response(
      JSON.stringify({ success: false, code: "origin_not_allowed", message: "Origin not allowed" }),
      { status: 403, headers: jsonHeaders }
    );
  }

  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = typeof body?.otp === "string" ? body.otp.trim() : "";

    // Validation: Missing fields
    if (!email || !otp) {
      return new Response(
        JSON.stringify({ success: false, code: "invalid_input", message: "Email and OTP are required." }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Validation: OTP Format
    if (!/^\d{6}$/.test(otp)) {
      return new Response(
        JSON.stringify({ success: false, code: "invalid_otp", message: "OTP must be 6 digits." }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the subscriber
    const { data: subscriber, error: fetchError } = await supabase
      .from("subscribers")
      .select("id, otp_code, otp_expires_at, verified")
      .eq("email", email)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!subscriber) {
      return new Response(
        JSON.stringify({ success: false, code: "not_found", message: "No subscription found for this email." }),
        { status: 404, headers: jsonHeaders }
      );
    }

    // Check if user is already verified
    if (subscriber.verified) {
      return new Response(
        JSON.stringify({ success: false, code: "already_verified", message: "You're already subscribed!" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Check for expiration
    if (!subscriber.otp_expires_at || new Date(subscriber.otp_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, code: "expired", message: "Code has expired. Please request a new one." }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Compare OTP (Simple comparison is safe here given network jitter vs timing attack risk on 6 digits)
    if (subscriber.otp_code !== otp) {
      return new Response(
        JSON.stringify({ success: false, code: "wrong_otp", message: "Incorrect code. Please try again." }),
        { status: 401, headers: jsonHeaders }
      );
    }

    // 2. Perform the Update: Set verified and clear OTP fields
    const { error: updateError } = await supabase
      .from("subscribers")
      .update({ 
        verified: true, 
        otp_code: null, 
        otp_expires_at: null 
      })
      .eq("id", subscriber.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, message: "Verification successful!" }),
      { status: 200, headers: jsonHeaders }
    );

  } catch (error) {
    console.error("verify-otp error:", error);
    return new Response(
      JSON.stringify({ success: false, code: "server_error", message: "An internal server error occurred." }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
