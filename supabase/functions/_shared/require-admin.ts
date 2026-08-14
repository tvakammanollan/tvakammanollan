import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

/**
 * Släpper bara igenom anrop från en inloggad admin.
 *
 * verify_jwt räcker inte som skydd: gästinloggning är påslagen, så vem som
 * helst kan skaffa en giltig JWT på en sekund. Funktionerna bakom den här
 * kontrollen är destruktiva (raderar frågor) eller kostsamma (AI-anrop), så de
 * behöver admin-behörighet — inte bara "är inloggad".
 *
 * Returnerar null när anroparen är admin, annars ett färdigt felsvar.
 */
export async function requireAdmin(
  req: Request,
  admin: SupabaseClient,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const deny = (status: number, message: string) =>
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return deny(401, "Inloggning krävs.");

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!anonKey || !supabaseUrl) return deny(500, "Backend är inte konfigurerad.");

  const asCaller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userData?.user) return deny(401, "Inloggning krävs.");

  // is_admin läses med service role: användaren får bara se sin egen rad via RLS.
  const { data: profile, error: profileErr } = await admin
    .from("users")
    .select("is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profileErr) return deny(500, "Kunde inte verifiera behörighet.");
  if (!profile?.is_admin) return deny(403, "Kräver administratörsbehörighet.");

  return null;
}
