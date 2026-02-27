import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ count: 0, code: "method_not_allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { count, error } = await supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .eq("verified", true);

    if (error) throw error;

    return new Response(JSON.stringify({ count: count ?? 0 }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (error) {
    console.error("subscriber-count error:", error);
    return new Response(JSON.stringify({ count: 0, code: "server_error" }), {
      status: 200,
      headers: jsonHeaders,
    });
  }
});
