import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "./useAuth";
import { fetchForumPermission } from "@/lib/forum.functions";
import type { BlockReason } from "@/lib/forum";

/**
 * Får den inloggade skriva i forumet?
 *
 * Frågan avgörs i databasen (forum_post_block_reason), inte här — sidan har
 * anonym inloggning påslagen, så "det finns en användare" säger ingenting om
 * huruvida det är en människa. Klientsvaret används bara för att visa rätt
 * ruta; själva spärren sitter i RPC:erna.
 */
export function useForumPermission() {
  const { user, loading } = useAuth();
  const [reason, setReason] = useState<BlockReason | null>("gast");
  const [checked, setChecked] = useState(false);
  const check = useServerFn(fetchForumPermission);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setReason("gast");
      setChecked(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await check({});
        if (!cancelled) setReason(res.reason);
      } catch {
        if (!cancelled) setReason("konto");
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, check]);

  return { canPost: checked && reason === null, reason, checked, userId: user?.id ?? null };
}
