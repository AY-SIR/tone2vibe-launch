import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, code: "method_not_allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, code: "invalid_json", message: "Invalid request body." }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const email =
      typeof (body as { email?: unknown })?.email === "string"
        ? (body as { email: string }).email.trim().toLowerCase()
        : "";
    const otp = typeof (body as { otp?: unknown })?.otp === "string" ? (body as { otp: string }).otp.trim() : "";

    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email) || email.length > 254 || !/^\d{6}$/.test(otp)) {
      return new Response(
        JSON.stringify({ success: false, code: "invalid_input", message: "Valid email and 6-digit OTP are required." }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: subscriber, error: fetchError } = await supabase
      .from("subscribers")
      .select("id, otp_code, otp_expires_at, verified")
      .eq("email", email)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!subscriber) {
      return new Response(
        JSON.stringify({ success: false, code: "not_found", message: "No subscription found for this email." }),
        { status: 404, headers: jsonHeaders }
      );
    }

    if (subscriber.verified) {
      return new Response(
        JSON.stringify({ success: false, code: "already_verified", message: "You're already subscribed!" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    if (!subscriber.otp_expires_at || new Date(subscriber.otp_expires_at).getTime() < Date.now()) {
      return new Response(
        JSON.stringify({ success: false, code: "expired", message: "Code has expired. Please request a new one." }),
        { status: 400, headers: jsonHeaders }
      );
    }

    if (subscriber.otp_code !== otp) {
      return new Response(
        JSON.stringify({ success: false, code: "wrong_otp", message: "Incorrect code. Please try again." }),
        { status: 401, headers: jsonHeaders }
      );
    }

    const { error: updateError } = await supabase
      .from("subscribers")
      .update({ verified: true, otp_code: null, otp_expires_at: null })
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
