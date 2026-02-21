import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if already verified
    const { data: existing } = await supabase
      .from("subscribers")
      .select("id, verified")
      .eq("email", trimmedEmail)
      .maybeSingle();

    if (existing?.verified) {
      return new Response(
        JSON.stringify({ error: "already_subscribed" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    if (existing) {
      // Update existing unverified record
      await supabase
        .from("subscribers")
        .update({ otp_code: otp, otp_expires_at: otpExpiresAt })
        .eq("id", existing.id);
    } else {
      // Insert new
      await supabase
        .from("subscribers")
        .insert({ email: trimmedEmail, otp_code: otp, otp_expires_at: otpExpiresAt });
    }

    // Send OTP via Brevo
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
        to: [{ email: trimmedEmail }],
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
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await brevoResponse.text();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-otp error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
