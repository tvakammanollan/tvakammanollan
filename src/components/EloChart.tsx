import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface Point {
  ts: number;
  date: string;
  verbal?: number;
  math?: number;
}

interface Row {
  match_type: "verbal" | "math";
  elo_after: number;
  created_at: string;
}

export function EloChart({ userId }: { userId: string }) {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: rows } = await supabase
        .from("elo_history")
        .select("match_type,elo_after,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (cancelled) return;
      const ordered = ((rows ?? []) as Row[]).slice().reverse();
      const points: Point[] = ordered.map((r) => ({
        ts: new Date(r.created_at).getTime(),
        date: new Date(r.created_at).toLocaleDateString("sv-SE", {
          month: "short",
          day: "numeric",
        }),
        verbal: r.match_type === "verbal" ? r.elo_after : undefined,
        math: r.match_type === "math" ? r.elo_after : undefined,
      }));
      setData(points);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Laddar ELO-historik…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/30 text-center">
        <p className="text-sm font-medium">Ingen matchhistorik ännu</p>
        <p className="text-xs text-muted-foreground">
          Spela din första battle så börjar din ELO-kurva ta form.
        </p>
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="oklch(0.92 0.01 85)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} />
          <YAxis stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} domain={["dataMin - 30", "dataMax + 30"]} />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid oklch(0.90 0.01 85)",
              fontSize: 12,
              boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.12)",
            }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
          <Line
            type="monotone"
            dataKey="verbal"
            name="Verbal"
            stroke="oklch(0.42 0.10 155)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="math"
            name="Matte"
            stroke="oklch(0.74 0.14 85)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
