"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, AlertTriangle, ArrowLeft, MessageCircleQuestion,
  FileText, Search, Filter, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionItemCard } from "@/components/dashboard/ActionItemCard";
import { TrustScoreRing } from "@/components/dashboard/TrustScoreRing";
import { AnalysisLoading } from "@/components/dashboard/AnalysisLoading";
import { cn, getTrustBg } from "@/lib/utils";

type Priority = "critical" | "high" | "medium" | "low";
type Category = "question" | "document" | "inspection";

export default function WarRoomPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<"all" | Category>("all");
  const [filterPriority, setFilterPriority] = useState<"all" | Priority>("all");
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/properties/${params.id}`);
        if (!res.ok) throw new Error("Not found");
        setData(await res.json());
      } catch {
        // error state handled by !data
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchData();
  }, [params.id]);

  if (loading) return <AnalysisLoading />;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-12 h-12 text-cyan-300 mb-4" />
        <p className="text-muted-foreground">Analysis not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>Go Home</Button>
      </div>
    );
  }

  const actionItems = data.actionItems || [];

  // Priority ordering
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...actionItems].sort(
    (a: any, b: any) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
  );

  const filtered = sorted.filter((item: any) => {
    if (filterCategory !== "all" && item.category !== filterCategory) return false;
    if (filterPriority !== "all" && item.priority !== filterPriority) return false;
    return true;
  });

  // Stats
  const categoryStats = {
    question: actionItems.filter((i: any) => i.category === "question").length,
    document: actionItems.filter((i: any) => i.category === "document").length,
    inspection: actionItems.filter((i: any) => i.category === "inspection").length,
  };
  const criticalCount = actionItems.filter((i: any) => i.priority === "critical").length;

  function toggleComplete(id: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
        <div className="shrink-0">
          <TrustScoreRing score={data.trustScore} label={data.trustLabel} size={120} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/results/${data.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-display text-foreground">Buyer War Room</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{data.address}</p>
          <p className="text-xs text-muted-foreground/60 max-w-xl leading-relaxed">
            {data.overallVerdict}
          </p>
        </div>
      </div>

      {/* War room stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          {
            icon: <AlertTriangle className="w-4 h-4 text-rose-300" />,
            label: "Critical Actions",
            value: criticalCount,
            accent: criticalCount > 0 ? "border-rose-400/25 bg-rose-400/10" : "",
          },
          {
            icon: <MessageCircleQuestion className="w-4 h-4 text-cyan-300" />,
            label: "Questions",
            value: categoryStats.question,
            accent: "",
          },
          {
            icon: <FileText className="w-4 h-4 text-fuchsia-300" />,
            label: "Documents",
            value: categoryStats.document,
            accent: "",
          },
          {
            icon: <Search className="w-4 h-4 text-amber-400" />,
            label: "Inspections",
            value: categoryStats.inspection,
            accent: "",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border border-cyan-300/20 bg-cyan-500/[0.04] backdrop-blur-sm",
              stat.accent
            )}
          >
            {stat.icon}
            <div>
              <p className="text-xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] font-mono text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-muted-foreground" />

        {/* Category filters */}
        {(["all", "question", "document", "inspection"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-mono transition-all",
              filterCategory === cat
                ? "cyber-chip text-foreground"
                : "bg-slate-400/[0.07] text-muted-foreground hover:bg-fuchsia-400/[0.12]"
            )}
          >
            {cat === "all" ? "All Types" : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}

        <span className="w-px h-4 bg-cyan-300/20 mx-1" />

        {/* Priority filters */}
        {(["all", "critical", "high", "medium", "low"] as const).map((pri) => (
          <button
            key={pri}
            onClick={() => setFilterPriority(pri)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-mono transition-all",
              filterPriority === pri
                ? "cyber-chip text-foreground"
                : "bg-slate-400/[0.07] text-muted-foreground hover:bg-fuchsia-400/[0.12]"
            )}
          >
            {pri === "all" ? "All Priorities" : pri.charAt(0).toUpperCase() + pri.slice(1)}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-6 p-3 rounded-lg border border-cyan-300/20 bg-cyan-500/[0.04]">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-muted-foreground">
              Due Diligence Progress
            </span>
            <span className="text-xs font-mono text-foreground">
              {completed.size}/{actionItems.length}
            </span>
          </div>
          <div className="w-full h-1.5 bg-cyan-950/70 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(completed.size / Math.max(actionItems.length, 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action items */}
      <div className="space-y-3">
        {filtered.map((item: any) => (
          <div key={item.id} className="flex items-start gap-3">
            <button
              onClick={() => toggleComplete(item.id)}
              className={cn(
                "mt-4 w-5 h-5 rounded-full border-2 shrink-0 transition-all",
                completed.has(item.id)
                  ? "bg-emerald-500 border-emerald-500"
                  : "border-cyan-300/30 hover:border-cyan-200/60"
              )}
            >
              {completed.has(item.id) && (
                <CheckCircle2 className="w-4 h-4 text-white -mt-px -ml-px" />
              )}
            </button>
            <div className={cn("flex-1 transition-opacity", completed.has(item.id) && "opacity-40")}>
              <ActionItemCard
                category={item.category}
                priority={item.priority}
                title={item.title}
                description={item.description}
              />
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No action items match your filters.
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-12 p-4 rounded-lg border border-fuchsia-400/20 bg-fuchsia-500/[0.06]">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-fuchsia-300 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-fuchsia-200 mb-1">Disclaimer</p>
            <p>
              DealBreakr AI is a research tool, not a licensed inspection, appraisal,
              or legal service. All findings are based on AI analysis and publicly
              available data patterns. Always verify findings with licensed professionals
              before making purchase decisions. Claims marked "unverified" indicate
              missing evidence — not confirmed issues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
