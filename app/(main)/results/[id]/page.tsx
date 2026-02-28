"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, AlertTriangle, ArrowRight, Eye, CheckCircle2, HelpCircle, Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrustScoreRing } from "@/components/dashboard/TrustScoreRing";
import { PropertySnapshot } from "@/components/dashboard/PropertySnapshot";
import { ClaimCard } from "@/components/dashboard/ClaimCard";
import { CategoryBreakdownChart } from "@/components/dashboard/CategoryBreakdownChart";
import { ComparablesTable } from "@/components/dashboard/ComparablesTable";
import { AnalysisLoading } from "@/components/dashboard/AnalysisLoading";
import { getTrustBg, cn } from "@/lib/utils";
import { CATEGORY_LABELS, SCORING_CATEGORIES, type ScoringCategory, type Verdict } from "@/types";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | ScoringCategory>("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/properties/${params.id}`);
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        setData(json);
      } catch {
        setError("Analysis not found");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchData();
  }, [params.id]);

  if (loading) return <AnalysisLoading />;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-muted-foreground">{error || "Something went wrong"}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
          Try Another Property
        </Button>
      </div>
    );
  }

  // Compute stats
  const claims = data.claims || [];
  const verdictCounts: Record<Verdict, number> = { verified: 0, unverified: 0, contradiction: 0, marketing: 0 };
  claims.forEach((c: any) => { verdictCounts[c.verdict as Verdict]++; });

  const categorySummary = SCORING_CATEGORIES.map((cat) => {
    const catClaims = claims.filter((c: any) => c.category === cat);
    return {
      category: cat,
      total: catClaims.length,
      contradictions: catClaims.filter((c: any) => c.verdict === "contradiction").length,
      unverified: catClaims.filter((c: any) => c.verdict === "unverified").length,
      verified: catClaims.filter((c: any) => c.verdict === "verified").length,
    };
  });

  const filteredClaims = activeCategory === "all"
    ? claims
    : claims.filter((c: any) => c.category === activeCategory);

  // Sort: critical first, then by confidence desc
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, caution: 2, info: 3 };
  filteredClaims.sort((a: any, b: any) => {
    const sevDiff = (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3);
    if (sevDiff !== 0) return sevDiff;
    return b.confidence - a.confidence;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top: Trust Score + Summary */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-10 mb-8">
        {/* Trust ring */}
        <div className="flex flex-col items-center shrink-0">
          <TrustScoreRing score={data.trustScore} label={data.trustLabel} />
          <div className="flex items-center gap-3 mt-4">
            {(
              [
                { verdict: "verified" as Verdict, icon: <CheckCircle2 className="w-3 h-3" />, count: verdictCounts.verified },
                { verdict: "contradiction" as Verdict, icon: <AlertTriangle className="w-3 h-3" />, count: verdictCounts.contradiction },
                { verdict: "unverified" as Verdict, icon: <HelpCircle className="w-3 h-3" />, count: verdictCounts.unverified },
                { verdict: "marketing" as Verdict, icon: <Megaphone className="w-3 h-3" />, count: verdictCounts.marketing },
              ] as const
            ).map((v) => (
              <div key={v.verdict} className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                <span className={cn(
                  v.verdict === "verified" && "text-verdict-verified",
                  v.verdict === "contradiction" && "text-verdict-contradiction",
                  v.verdict === "unverified" && "text-verdict-unverified",
                  v.verdict === "marketing" && "text-verdict-marketing",
                )}>
                  {v.icon}
                </span>
                {v.count}
              </div>
            ))}
          </div>
        </div>

        {/* Summary + verdict */}
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-display text-foreground mb-2">
            {data.address}
          </h1>
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-4",
            getTrustBg(data.trustLabel),
          )}>
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">
              Trust Score: {data.trustScore}/100
            </span>
          </div>
          <p className="text-muted-foreground leading-relaxed text-sm max-w-2xl">
            {data.overallVerdict}
          </p>

          {/* Quick link to war room */}
          <Link href={`/warroom/${data.id}`} className="inline-block mt-4">
            <Button variant="outline" size="sm" className="gap-2 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10">
              <Eye className="w-3.5 h-3.5" />
              Open Buyer War Room
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Property Snapshot & Market */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {data.propertySnapshot && (
          <PropertySnapshot
            snapshot={data.propertySnapshot}
            address={data.address}
            listPrice={data.listPrice}
          />
        )}
        {data.marketContext?.comparables && (
          <ComparablesTable
            comparables={data.marketContext.comparables}
            subjectPpsf={data.marketContext?.pricePerSqft}
          />
        )}
      </div>

      {/* Charts */}
      {categorySummary.some((c) => c.total > 0) && (
        <div className="mb-8">
          <CategoryBreakdownChart claims={categorySummary} />
        </div>
      )}

      {/* Claims Board */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display text-foreground">Claim Board</h2>
          <span className="text-xs font-mono text-muted-foreground">
            {claims.length} claims extracted
          </span>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-mono transition-all",
              activeCategory === "all"
                ? "bg-white/10 text-foreground"
                : "bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]"
            )}
          >
            All ({claims.length})
          </button>
          {SCORING_CATEGORIES.map((cat) => {
            const count = claims.filter((c: any) => c.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-mono transition-all",
                  activeCategory === cat
                    ? "bg-white/10 text-foreground"
                    : "bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]"
                )}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            );
          })}
        </div>

        {/* Claim cards */}
        <div className="space-y-3">
          {filteredClaims.map((claim: any) => (
            <ClaimCard
              key={claim.id}
              category={claim.category}
              statement={claim.statement}
              source={claim.source}
              verdict={claim.verdict}
              confidence={claim.confidence}
              explanation={claim.explanation}
              severity={claim.severity}
              evidence={claim.evidence || []}
            />
          ))}
        </div>
      </div>

      {/* CTA to war room */}
      <div className="text-center py-8 border-t border-white/5">
        <p className="text-muted-foreground text-sm mb-4">
          Ready to take action on these findings?
        </p>
        <Link href={`/warroom/${data.id}`}>
          <Button className="bg-red-500 hover:bg-red-600 text-white gap-2">
            <Shield className="w-4 h-4" />
            Enter Buyer War Room
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
