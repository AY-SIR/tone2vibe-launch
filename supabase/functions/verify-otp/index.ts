import { createClient } from "npm:@supabase/supabase-js@2";

// 1. Allowed Domains List
const ALLOWED_ORIGINS = [
  "https://www.tone2vibe.in",
  "https://tone2vibe.in",
  "https://tone2vibe-launch.vercel.app",
  "http://localhost:8080",
];

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  // 2. Dynamic CORS Headers setup
  const headers = new Headers({
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });

  // Domain check logic
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  // Handle Preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  headers.set("Content-Type", "application/json");

  // Allow only POST method
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, code: "method_not_allowed" }), {
      status: 405,
      headers,
    });
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, code: "invalid_json", message: "Invalid request body." }),
        { status: 400, headers }
      );
    }

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = typeof body?.otp === "string" ? body.otp.trim() : "";

    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

    // Validate inputs
    if (!email || !emailRegex.test(email) || email.length > 254 || !/^\d{6}$/.test(otp)) {
      return new Response(
        JSON.stringify({ success: false, code: "invalid_input", message: "Valid email and 6-digit OTP are required." }),
        { status: 400, headers }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch subscriber data
    const { data: subscriber, error: fetchError } = await supabase
      .from("subscribers")
      .select("id, otp_code, otp_expires_at, verified")
      .eq("email", email)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!subscriber) {
      return new Response(
        JSON.stringify({ success: false, code: "not_found", message: "No subscription found for this email." }),
        { status: 404, headers }
      );
    }

    // Check if already verified
    if (subscriber.verified) {
      return new Response(
        JSON.stringify({ success: true, code: "already_verified", message: "You're already subscribed!" }),
        { status: 200, headers }
      );
    }

    // Check if OTP is expired
    if (!subscriber.otp_expires_at || new Date(subscriber.otp_expires_at).getTime() < Date.now()) {
      return new Response(
        JSON.stringify({ success: false, code: "expired", message: "Code has expired. Please request a new one." }),
        { status: 400, headers }
      );
    }

    // Verify OTP
    if (subscriber.otp_code !== otp) {
      return new Response(
        JSON.stringify({ success: false, code: "wrong_otp", message: "Incorrect code. Please try again." }),
        { status: 401, headers }
      );
    }

    // Update verified status and clear OTP
    const { error: updateError } = await supabase
      .from("subscribers")
      .update({ verified: true, otp_code: null, otp_expires_at: null })
      .eq("id", subscriber.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, message: "Verification successful!" }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("verify-otp error:", error);
    return new Response(
      JSON.stringify({ success: false, code: "server_error", message: "An internal server error occurred." }),
      { status: 500, headers }
    );
  }
});