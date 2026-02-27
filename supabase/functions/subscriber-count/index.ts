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

  // 2. Dynamic CORS Header Setup
  const headers = new Headers({
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });

  // Check if the request origin is in our allowed list
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  // Handle Preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  headers.set("Content-Type", "application/json");

  // Only allow GET or POST
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ count: 0, code: "method_not_allowed" }), {
      status: 405,
      headers,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetching only the exact count of verified subscribers
    const { count, error } = await supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .eq("verified", true);

    if (error) throw error;

    return new Response(JSON.stringify({ count: count ?? 0 }), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("subscriber-count error:", error);
    // Returning 0 instead of crashing for better UI UX
    return new Response(JSON.stringify({ count: 0, code: "server_error" }), {
      status: 200,
      headers,
    });
  }
});