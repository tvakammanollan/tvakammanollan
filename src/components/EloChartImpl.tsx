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
import { formatDate } from "@/lib/sv-format";

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

export function EloChartImpl({ userId }: { userId: string }) {
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
        date: formatDate(r.created_at),
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
          Spela din första match så börjar din ELO-kurva ta form.
        </p>
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="eloVerbalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6FB3B8" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#6FB3B8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="eloMathFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F2A65A" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#F2A65A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(232,228,218,0.12)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" stroke="rgba(232,228,218,0.55)" fontSize={11} tickLine={false} />
          <YAxis
            stroke="rgba(232,228,218,0.55)"
            fontSize={11}
            tickLine={false}
            domain={["dataMin - 30", "dataMax + 30"]}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid rgba(232,228,218,0.14)",
              background: "#1f1408",
              color: "#E8E4DA",
              fontSize: 12,
              boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.32)",
            }}
            labelStyle={{ fontWeight: 600, color: "#E8E4DA" }}
            itemStyle={{ color: "#E8E4DA" }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#E8E4DA" }} iconType="circle" />
          <Line
            type="monotone"
            dataKey="verbal"
            name="Verbal"
            stroke="#6FB3B8"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#6FB3B8" }}
            fill="url(#eloVerbalFill)"
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="math"
            name="Matte"
            stroke="#F2A65A"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#F2A65A" }}
            fill="url(#eloMathFill)"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
