import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const secretKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SECRET_KEY") ??
  "";

const admin = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeFamilyName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function internalEmail(familyName: string, domain = "familykharcha.app") {
  return `${normalizeFamilyName(familyName)}@${domain}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!secretKey) return json({ error: "Auth service is not configured" }, 500);

  try {
    const body = await req.json();
    const familyName = String(body?.familyName ?? "").trim();
    const password = String(body?.password ?? "");
    const action = String(body?.action ?? "");

    if (action !== "create") return json({ error: "Invalid action" }, 400);
    if (familyName.length < 2 || familyName.length > 60) {
      return json({ error: "Family name must be 2–60 characters" }, 400);
    }
    if (password.length < 6 || password.length > 128) {
      return json({ error: "Password must be 6–128 characters" }, 400);
    }

    const slug = normalizeFamilyName(familyName);
    if (!slug) return json({ error: "Please choose a family name using letters or numbers" }, 400);

    // Keep compatibility with every previous Family Kharcha build.
    const candidates = [
      internalEmail(familyName, "familykharcha.app"),
      internalEmail(familyName, "familykharcha.local"),
    ];

    const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (usersError) {
      console.error("listUsers failed", usersError);
      return json({ error: "Could not check family name" }, 500);
    }

    const alreadyExists = (usersData.users ?? []).some((u) => candidates.includes((u.email ?? "").toLowerCase()));
    if (alreadyExists) {
      return json({ error: "Family name already taken" }, 409);
    }

    // Admin creation happens server-side, so the browser never calls the
    // public email-signup endpoint and Supabase does not send a confirmation email.
    const email = candidates[0];
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { family_name: familyName },
    });

    if (error) {
      console.error("createUser failed", error);
      if (error.message.toLowerCase().includes("already") || error.message.toLowerCase().includes("exists")) {
        return json({ error: "Family name already taken" }, 409);
      }
      return json({ error: "Could not create family" }, 400);
    }

    return json({ ok: true, email, userId: data.user?.id ?? null });
  } catch (error) {
    console.error("family-auth error", error);
    return json({ error: "Invalid request" }, 400);
  }
});
