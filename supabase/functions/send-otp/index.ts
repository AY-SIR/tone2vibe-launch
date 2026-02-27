import { createClient } from "npm:@supabase/supabase-js@2";

// 1. Allowed Domains List
const ALLOWED_ORIGINS = [
  "https://www.tone2vibe.in",
  "https://tone2vibe.in",
  "https://tone2vibe-launch.vercel.app",
  "http://localhost:8080",
];

function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (100000 + (array[0] % 900000)).toString();
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  // 2. Dynamic CORS Header Logic
  const headers = new Headers({
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  headers.set("Content-Type", "application/json");

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
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

    if (!email || !emailRegex.test(email) || email.length > 254) {
      return new Response(
        JSON.stringify({ success: false, code: "invalid_email", message: "Invalid email format" }),
        { status: 400, headers }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limiting & duplicate check logic
    const { data: existing, error: existingError } = await supabase
      .from("subscribers")
      .select("id, verified, otp_expires_at")
      .eq("email", email)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing?.verified) {
      return new Response(
        JSON.stringify({ success: false, code: "already_subscribed", message: "This email is already subscribed." }),
        { status: 200, headers }
      );
    }

    if (existing?.otp_expires_at) {
      const lastSentAtMs = new Date(existing.otp_expires_at).getTime() - 10 * 60 * 1000;
      if (Number.isFinite(lastSentAtMs)) {
        const secondsSinceLastSend = (Date.now() - lastSentAtMs) / 1000;
        if (secondsSinceLastSend < 30) {
          return new Response(
            JSON.stringify({
              success: false,
              code: "rate_limited",
              message: "Please wait 30 seconds before requesting again.",
            }),
            { status: 429, headers }
          );
        }
      }
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    if (existing) {
      const { error: updateError } = await supabase
        .from("subscribers")
        .update({ otp_code: otp, otp_expires_at: otpExpiresAt })
        .eq("id", existing.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("subscribers")
        .insert({ email, otp_code: otp, otp_expires_at: otpExpiresAt });
      if (insertError) throw insertError;
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      return new Response(
        JSON.stringify({ success: false, code: "missing_brevo_key", message: "Email service is not configured." }),
        { status: 500, headers }
      );
    }

    // Email Sending with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Tone2vibe", email: "noreply@tone2vibe.in" },
          to: [{ email }],
          subject: "Your Tone2vibe Verification Code",
          htmlContent: `
          <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #faf9f7; border-radius: 12px;">

              <h1 style="font-size: 28px; color: #2a2520; margin: 0 0 16px; font-weight: 600;">Tone<span style="font-weight: 300; color: #8a8078;">2</span>vibe</h1>

              <div style="background: #fff; border-radius: 8px; padding: 32px; text-align: center; border: 1px solid #ede9e3;">

                <p style="color: #5a5550; font-size: 14px; margin: 0 0 16px;">Your verification code is:</p>

                <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #2a2520; margin: 0 0 16px;">${otp}</div>

                <p style="color: #8a8078; font-size: 12px; margin: 0;">This code expires in 10 minutes</p>

              </div>

<div style="text-align: center; margin-top: 24px;">

    <p style="color: #b0a89e; font-size: 11px; margin: 0 0 8px;">

      If you didn't request this, you can safely ignore this email.

    </p>

    <p style="color: #b0a89e; font-size: 11px; margin: 0;">

      Need help? <a href="mailto:info@tone2vibe.in" style="color: #8a8078; text-decoration: underline;">info@tone2vibe.in</a>

    </p>

  </div>

  </div>
          `,
        }),
        signal: controller.signal,
      });

      if (!brevoResponse.ok) {
        const errText = await brevoResponse.text();
        console.error("Brevo error:", errText);
        return new Response(
          JSON.stringify({ success: false, code: "send_failed", message: "Failed to send email." }),
          { status: 502, headers }
        );
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        return new Response(
          JSON.stringify({ success: false, code: "send_timeout", message: "Email service timeout." }),
          { status: 504, headers }
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });

  } catch (error) {
    console.error("send-otp error:", error);
    return new Response(
      JSON.stringify({ success: false, code: "server_error", message: "Something went wrong." }),
      { status: 500, headers }
    );
  }
});