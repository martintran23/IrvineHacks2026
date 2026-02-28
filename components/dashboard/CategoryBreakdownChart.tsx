"use client";

import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_LABELS, type ScoringCategory } from "@/types";
import { getCategoryChartColor } from "@/lib/utils";

interface ClaimSummary {
  category: ScoringCategory;
  total: number;
  contradictions: number;
  unverified: number;
  verified: number;
}

interface Props {
  claims: ClaimSummary[];
}

export function CategoryBreakdownChart({ claims }: Props) {
  // Radar chart data — risk score per category (higher = more issues)
  const radarData = claims.map((c) => ({
    category: CATEGORY_LABELS[c.category].replace(" / ", "/\n"),
    risk: Math.round(((c.contradictions * 3 + c.unverified * 1.5) / Math.max(c.total, 1)) * 33),
    fullMark: 100,
  }));

  // Bar chart data — stacked claim verdicts
  const barData = claims.map((c) => ({
    name: CATEGORY_LABELS[c.category].split(" ")[0], // short label
    category: c.category,
    verified: c.verified,
    unverified: c.unverified,
    contradictions: c.contradictions,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Radar */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono tracking-wide text-muted-foreground">
            RISK RADAR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="Risk"
                dataKey="risk"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Stacked bar */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono tracking-wide text-muted-foreground">
            CLAIM VERDICTS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(0,0,0,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="verified" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="unverified" stackId="a" fill="#6b7280" />
              <Bar dataKey="contradictions" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-2">
            {[
              { label: "Verified", color: "#10b981" },
              { label: "Unverified", color: "#6b7280" },
              { label: "Contradiction", color: "#ef4444" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                <span className="text-[10px] text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
