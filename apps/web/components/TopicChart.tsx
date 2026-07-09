"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TopicStat } from "@/types";

export function TopicChart({ topics }: { topics: TopicStat[] }) {
  const data = topics.slice(0, 8).map((t) => ({
    category: t.category,
    count: t.count,
    risk: Math.round(t.avg_refund_risk),
  }));

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
          <XAxis dataKey="category" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid rgba(56,189,248,0.25)",
              borderRadius: 8,
            }}
          />
          <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} name="Mensagens" />
          <Bar dataKey="risk" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Risco médio" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
