/**
 * components/dashboard/FitBreakdown.tsx
 *
 * Full breakdown of the Fit Score showing:
 * - Category scores bar chart
 * - Accessibility flags (blockers, concerns)
 * - Matched / missed features
 * - Personalized suggestions
 *
 * DROP-IN: import { FitBreakdown } from "@/components/dashboard/FitBreakdown"
 */

"use client";

import { useState } from "react";
import {
  CheckCircle2, XCircle, HelpCircle, AlertTriangle, Ban,
  Accessibility, Search, MessageCircleQuestion, Wrench,
  Eye, ChevronDown, ChevronUp, Sparkles, ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FitScoreResult, AccessibilityFlag, FitFeatureMatch, PropertySuggestion } from "@/types/buyer-profile";

interface FitBreakdownProps {
  result: FitScoreResult;
}

export function FitBreakdown({ result }: FitBreakdownProps) {
  return (
    <div className="space-y-4">
      {/* Category score bars */}
      <CategoryBars categories={result.breakdown} />

      {/* Accessibility section — only if there are flags */}
      {result.accessibilityFlags.length > 0 && (
        <AccessibilitySection flags={result.accessibilityFlags} />
      )}

      {/* Feature match grid */}
      {(result.matchedFeatures.length > 0 || result.missedFeatures.length > 0) && (
        <FeatureMatchSection matched={result.matchedFeatures} missed={result.missedFeatures} />
      )}

      {/* Personalized suggestions */}
      {result.suggestions.length > 0 && (
        <SuggestionsSection suggestions={result.suggestions} />
      )}
    </div>
  );
}

// ─── Category score bars ───────────────────────────────────────────
function CategoryBars({ categories }: { categories: FitScoreResult["breakdown"] }) {
  return (
    <Card className="border-white/10 bg-white/[0.02]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono tracking-wide text-muted-foreground">
          FIT BREAKDOWN
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((cat) => {
          const color =
            cat.score >= 80 ? "bg-emerald-400" :
            cat.score >= 60 ? "bg-cyan-400" :
            cat.score >= 40 ? "bg-amber-400" :
            "bg-rose-400";
          return (
            <div key={cat.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-muted-foreground">{cat.name}</span>
                <span className="text-xs font-mono text-foreground">{cat.score}</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-1000", color)}
                  style={{ width: `${cat.score}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">{cat.details}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Accessibility flags ───────────────────────────────────────────
function AccessibilitySection({ flags }: { flags: AccessibilityFlag[] }) {
  const blockers = flags.filter(f => f.severity === "blocker");
  const concerns = flags.filter(f => f.severity === "concern");
  const manageable = flags.filter(f => f.severity === "manageable");
  const clear = flags.filter(f => f.severity === "clear");

  return (
    <Card className={cn(
      "border-white/10 bg-white/[0.02]",
      blockers.length > 0 && "border-rose-500/30 bg-rose-500/[0.03]",
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono tracking-wide flex items-center gap-2">
          <Accessibility className="w-4 h-4 text-amber-400" />
          <span className="text-muted-foreground">ACCESSIBILITY ASSESSMENT</span>
          {blockers.length > 0 && (
            <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px]">
              {blockers.length} blocker{blockers.length > 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {[...blockers, ...concerns, ...manageable, ...clear].map((flag, i) => (
          <AccessibilityFlagCard key={i} flag={flag} />
        ))}
      </CardContent>
    </Card>
  );
}

function AccessibilityFlagCard({ flag }: { flag: AccessibilityFlag }) {
  const [expanded, setExpanded] = useState(flag.severity === "blocker");

  const severityConfig = {
    blocker: { icon: <Ban className="w-3.5 h-3.5" />, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", label: "Blocker" },
    concern: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Concern" },
    manageable: { icon: <Wrench className="w-3.5 h-3.5" />, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", label: "Manageable" },
    clear: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Clear" },
  };

  const config = severityConfig[flag.severity];

  return (
    <div
      className={cn("border rounded-lg p-3 cursor-pointer transition-all", config.bg)}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2">
        <span className={cn("mt-0.5", config.color)}>{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-mono font-semibold", config.color)}>{config.label}</span>
            <span className="text-xs text-muted-foreground capitalize">{flag.label}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{flag.issue}</p>
          {expanded && (
            <div className="mt-2 p-2 rounded-md bg-white/[0.03] border border-white/5">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase mb-1">Recommendation</p>
              <p className="text-xs text-foreground/80">{flag.recommendation}</p>
            </div>
          )}
        </div>
        {expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground/40" /> : <ChevronDown className="w-3 h-3 text-muted-foreground/40" />}
      </div>
    </div>
  );
}

// ─── Feature match section ─────────────────────────────────────────
function FeatureMatchSection({ matched, missed }: { matched: FitFeatureMatch[]; missed: FitFeatureMatch[] }) {
  return (
    <Card className="border-white/10 bg-white/[0.02]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono tracking-wide text-muted-foreground">
          FEATURE MATCH
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Matched */}
          <div>
            <p className="text-[10px] font-mono text-emerald-400/70 uppercase tracking-wider mb-2">
              ✓ Matched ({matched.filter(f => f.status === "matched").length})
            </p>
            <div className="space-y-1">
              {matched.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {feat.status === "matched" ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <HelpCircle className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={feat.status === "matched" ? "text-foreground" : "text-muted-foreground"}>
                    {feat.label}
                  </span>
                  <span className={cn(
                    "text-[9px] font-mono",
                    feat.importance === "must_have" ? "text-emerald-400/60" : "text-cyan-300/60",
                  )}>
                    {feat.importance === "must_have" ? "MUST" : "NICE"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Missed */}
          <div>
            <p className="text-[10px] font-mono text-rose-400/70 uppercase tracking-wider mb-2">
              ✕ Missing / Flagged ({missed.length})
            </p>
            <div className="space-y-1">
              {missed.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {feat.status === "violated" ? (
                    <Ban className="w-3 h-3 text-rose-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3 h-3 text-amber-400 shrink-0" />
                  )}
                  <span className={feat.status === "violated" ? "text-rose-300" : "text-muted-foreground"}>
                    {feat.label}
                  </span>
                  <span className={cn(
                    "text-[9px] font-mono",
                    feat.importance === "dealbreaker" ? "text-rose-400/60" :
                    feat.importance === "must_have" ? "text-amber-400/60" : "text-muted-foreground/40",
                  )}>
                    {feat.importance === "dealbreaker" ? "BREAKER" : feat.importance === "must_have" ? "MUST" : "NICE"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Suggestions section ───────────────────────────────────────────
function SuggestionsSection({ suggestions }: { suggestions: PropertySuggestion[] }) {
  const iconMap: Record<string, React.ReactNode> = {
    look_for: <Eye className="w-4 h-4 text-cyan-300" />,
    watch_out: <ShieldAlert className="w-4 h-4 text-amber-400" />,
    ask_about: <MessageCircleQuestion className="w-4 h-4 text-fuchsia-300" />,
    modify: <Wrench className="w-4 h-4 text-emerald-400" />,
  };

  const categoryLabel: Record<string, string> = {
    look_for: "Look For",
    watch_out: "Watch Out",
    ask_about: "Ask About",
    modify: "Modification Potential",
  };

  // Group by priority
  const high = suggestions.filter(s => s.priority === "high");
  const medium = suggestions.filter(s => s.priority === "medium");
  const low = suggestions.filter(s => s.priority === "low");
  const sorted = [...high, ...medium, ...low];

  return (
    <Card className="border-white/10 bg-white/[0.02]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono tracking-wide flex items-center gap-2 text-muted-foreground">
          <Sparkles className="w-4 h-4 text-fuchsia-300" />
          PERSONALIZED SUGGESTIONS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sorted.map((sug, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-all",
              sug.priority === "high" && "border-amber-500/20 bg-amber-500/[0.03]",
              sug.priority === "medium" && "border-white/10 bg-white/[0.02]",
              sug.priority === "low" && "border-white/5 bg-white/[0.01]",
            )}
          >
            <div className="mt-0.5">{iconMap[sug.category]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium text-foreground">{sug.title}</span>
                <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">
                  {categoryLabel[sug.category]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{sug.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
