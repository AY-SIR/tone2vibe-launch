import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (100000 + (array[0] % 900000)).toString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, code: "invalid_email", message: "Valid email is required" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email) || email.length > 254) {
      return new Response(
        JSON.stringify({ success: false, code: "invalid_email", message: "Invalid email format" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existing } = await supabase
      .from("subscribers")
      .select("id, verified, otp_expires_at")
      .eq("email", email)
      .maybeSingle();

    if (existing?.verified) {
      return new Response(
        JSON.stringify({ success: false, code: "already_subscribed", message: "This email is already subscribed." }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Rate limit check
    if (existing?.otp_expires_at) {
      const lastSent = new Date(existing.otp_expires_at).getTime() - 10 * 60 * 1000;
      const secondsSince = (Date.now() - lastSent) / 1000;
      if (secondsSince < 30) {
        return new Response(
          JSON.stringify({ success: false, code: "rate_limited", message: "Please wait 30 seconds before requesting again." }),
          { status: 429, headers: jsonHeaders }
        );
      }
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    if (existing) {
      await supabase
        .from("subscribers")
        .update({ otp_code: otp, otp_expires_at: otpExpiresAt })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("subscribers")
        .insert({ email, otp_code: otp, otp_expires_at: otpExpiresAt });
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      throw new Error("BREVO_API_KEY missing");
    }

    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Tone2vibe", email: "noreply@tone2vibe.in" },
        to: [{ email }],
        subject: "Your Tone2vibe Verification Code",
        htmlContent: `
          <div style="font-family: 'Georgia', serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #faf9f7; border-radius: 12px;">
            <h1 style="font-size: 28px; color: #2a2520; margin: 0 0 8px; font-weight: 600;">Tone<span style="font-weight: 300; color: #8a8078;">2</span>vibe</h1>
            <p style="color: #8a8078; font-size: 14px; margin: 0 0 32px;">Verify your subscription</p>
            <div style="background: #fff; border-radius: 8px; padding: 32px; text-align: center; border: 1px solid #ede9e3;">
              <p style="color: #5a5550; font-size: 14px; margin: 0 0 16px;">Your verification code is:</p>
              <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #2a2520; margin: 0 0 16px;">${otp}</div>
              <p style="color: #8a8078; font-size: 12px; margin: 0;">This code expires in 10 minutes</p>
            </div>
            <p style="color: #b0a89e; font-size: 11px; text-align: center; margin: 24px 0 0;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!brevoResponse.ok) {
      const errText = await brevoResponse.text();
      console.error("Brevo error:", errText);
      return new Response(
        JSON.stringify({ success: false, code: "send_failed", message: "Failed to send email." }),
        { status: 500, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    console.error("send-otp error:", error);
    return new Response(
      JSON.stringify({ success: false, code: "server_error", message: "Something went wrong." }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
