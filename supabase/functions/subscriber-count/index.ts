import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

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

    return new Response(
      JSON.stringify({ count: count ?? 0 }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    console.error("subscriber-count error:", error);
    return new Response(
      JSON.stringify({ count: 0 }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
