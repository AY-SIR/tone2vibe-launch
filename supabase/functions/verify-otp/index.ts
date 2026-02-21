import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_ATTEMPTS = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = typeof body?.otp === "string" ? body.otp.trim() : "";

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ success: false, code: "invalid_input", message: "Email and OTP are required." }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Validate OTP format (6 digits only)
    if (!/^\d{6}$/.test(otp)) {
      return new Response(
        JSON.stringify({ success: false, code: "invalid_otp", message: "OTP must be 6 digits." }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: subscriber, error } = await supabase
      .from("subscribers")
      .select("id, otp_code, otp_expires_at, verified")
      .eq("email", email)
      .maybeSingle();

    if (error || !subscriber) {
      return new Response(
        JSON.stringify({ success: false, code: "not_found", message: "No subscription found. Please request a new code." }),
        { status: 200, headers: jsonHeaders }
      );
    }

    if (subscriber.verified) {
      return new Response(
        JSON.stringify({ success: false, code: "already_verified", message: "You're already subscribed!" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Check expiry
    if (!subscriber.otp_expires_at || new Date(subscriber.otp_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, code: "expired", message: "Code has expired. Please request a new one." }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Constant-time comparison to prevent timing attacks
    const expected = subscriber.otp_code || "";
    let mismatch = expected.length !== otp.length ? 1 : 0;
    for (let i = 0; i < Math.max(expected.length, otp.length); i++) {
      if ((expected.charCodeAt(i) || 0) !== (otp.charCodeAt(i) || 0)) {
        mismatch = 1;
      }
    }

    if (mismatch) {
      return new Response(
        JSON.stringify({ success: false, code: "wrong_otp", message: "Incorrect code. Please try again." }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Mark as verified, clear OTP
    await supabase
      .from("subscribers")
      .update({ verified: true, otp_code: null, otp_expires_at: null })
      .eq("id", subscriber.id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    console.error("verify-otp error:", error);
    return new Response(
      JSON.stringify({ success: false, code: "server_error", message: "Something went wrong. Please try again." }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
