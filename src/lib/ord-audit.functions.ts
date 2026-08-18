/**
 * ord-audit.functions.ts
 * ──────────────────────────────────────────────────────────────
 * Admin-only server function som applicerar de manuellt
 * granskade ORD-fixarna. Datat ligger i .ord-audit/manual-
 * fixes.json (versionerat i git).
 *
 * Säkerhet:
 *   - Bara inloggade användare (requireSupabaseAuth).
 *   - Plus extra is_admin-koll mot users-tabellen.
 *   - Idempotent: UPDATE körs bara där current correct_answer
 *     matchar fix.from. En redan rättad rad rörs aldrig.
 *
 * Returnerar en sammanfattning (ok/skipped/failed) + per-fix
 * resultat så admin-UI kan visa rapporten.
 * ──────────────────────────────────────────────────────────────
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import fixesData from "./ord-audit-fixes.data.json";

type Fix = {
  word: string;
  from: string;
  to: string;
  confidence: "high" | "medium" | "low";
  why: string;
};

type ResultRow = {
  word: string;
  from?: string;
  to?: string;
  status: "fixed" | "already_correct" | "not_found" | "mismatched" | "failed";
  note?: string;
};

export type OrdAuditResult = {
  total_attempted: number;
  fixed: number;
  already_correct: number;
  not_found: number;
  mismatched: number;
  failed: number;
  results: ResultRow[];
};

export const applyOrdAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { includeMedium?: boolean; includeLow?: boolean; dryRun?: boolean }) =>
    z
      .object({
        includeMedium: z.boolean().optional().default(true),
        includeLow: z.boolean().optional().default(false),
        dryRun: z.boolean().optional().default(false),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ context, data }): Promise<OrdAuditResult> => {
    const { userId } = context;

    // Admin-koll (utöver auth-middleware).
    const { data: me, error: meErr } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();
    if (meErr) throw new Error(`Admin-koll misslyckades: ${meErr.message}`);
    if (!me?.is_admin) {
      throw new Response("Forbidden: kräver admin", { status: 403 });
    }

    const allFixes: Fix[] = (fixesData as { fixes: Fix[] }).fixes;
    const fixes = allFixes.filter((f) => {
      if (f.confidence === "high") return true;
      if (f.confidence === "medium") return data.includeMedium;
      if (f.confidence === "low") return data.includeLow;
      return false;
    });

    const result: OrdAuditResult = {
      total_attempted: fixes.length,
      fixed: 0,
      already_correct: 0,
      not_found: 0,
      mismatched: 0,
      failed: 0,
      results: [],
    };

    for (const fix of fixes) {
      // Hitta raden by question_text (case-insensitive exact).
      const { data: rows, error: findErr } = await supabaseAdmin
        .from("questions")
        .select("id, correct_answer")
        .eq("category", "ORD")
        .ilike("question_text", fix.word);

      if (findErr) {
        result.results.push({
          word: fix.word,
          status: "failed",
          note: `lookup: ${findErr.message}`,
        });
        result.failed++;
        continue;
      }
      if (!rows || rows.length === 0) {
        result.results.push({ word: fix.word, status: "not_found" });
        result.not_found++;
        continue;
      }

      for (const row of rows as Array<{ id: string; correct_answer: string }>) {
        if (row.correct_answer === fix.to) {
          result.results.push({
            word: fix.word,
            from: fix.from,
            to: fix.to,
            status: "already_correct",
          });
          result.already_correct++;
          continue;
        }
        if (row.correct_answer !== fix.from) {
          result.results.push({
            word: fix.word,
            from: row.correct_answer,
            to: fix.to,
            status: "mismatched",
            note: `current=${row.correct_answer}, expected from=${fix.from}`,
          });
          result.mismatched++;
          continue;
        }
        if (data.dryRun) {
          result.results.push({
            word: fix.word,
            from: fix.from,
            to: fix.to,
            status: "fixed",
            note: "DRY RUN, not written",
          });
          result.fixed++;
          continue;
        }
        const { error: updErr } = await supabaseAdmin
          .from("questions")
          .update({ correct_answer: fix.to })
          .eq("id", row.id);
        if (updErr) {
          result.results.push({
            word: fix.word,
            from: fix.from,
            to: fix.to,
            status: "failed",
            note: updErr.message,
          });
          result.failed++;
        } else {
          result.results.push({
            word: fix.word,
            from: fix.from,
            to: fix.to,
            status: "fixed",
          });
          result.fixed++;
        }
      }
    }

    return result;
  });
