"use client";

import { useState } from "react";
import {
  FileWarning, DollarSign, Shield, Eye, MapPin, Hammer,
  ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, HelpCircle, Megaphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, getVerdictBg, getVerdictLabel, getSeverityColor, formatPercent } from "@/lib/utils";
import type { Verdict, Severity, ScoringCategory } from "@/types";

// Icon lookup by category
const CATEGORY_ICON: Record<ScoringCategory, React.ReactNode> = {
  record_mismatch: <FileWarning className="w-4 h-4" />,
  pricing_anomaly: <DollarSign className="w-4 h-4" />,
  ownership_title: <Shield className="w-4 h-4" />,
  disclosure_ambiguity: <Eye className="w-4 h-4" />,
  neighborhood_fit: <MapPin className="w-4 h-4" />,
  renovation_permit: <Hammer className="w-4 h-4" />,
};

const VERDICT_ICON: Record<Verdict, React.ReactNode> = {
  verified: <CheckCircle2 className="w-3.5 h-3.5" />,
  unverified: <HelpCircle className="w-3.5 h-3.5" />,
  contradiction: <AlertTriangle className="w-3.5 h-3.5" />,
  marketing: <Megaphone className="w-3.5 h-3.5" />,
};

interface EvidenceData {
  type: "supports" | "contradicts" | "neutral";
  source: string;
  description: string;
  dataPoint?: string | null;
}

interface ClaimCardProps {
  category: ScoringCategory;
  statement: string;
  source: string;
  verdict: Verdict;
  confidence: number;
  explanation: string;
  severity: Severity;
  evidence: EvidenceData[];
}

export function ClaimCard({
  category, statement, source, verdict, confidence, explanation, severity, evidence,
}: ClaimCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "group border rounded-lg p-4 transition-smooth cursor-pointer hover-lift",
        "hover:border-white/20 hover:bg-white/[0.02]",
        severity === "critical" && "border-red-500/30 bg-red-500/[0.03]",
        severity === "warning" && "border-amber-500/20",
        severity === "caution" && "border-yellow-500/10",
        severity === "info" && "border-white/10",
      )}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 p-1.5 rounded-md bg-white/5", getSeverityColor(severity))}>
          {CATEGORY_ICON[category]}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">{statement}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge className={cn("text-[10px] gap-1", getVerdictBg(verdict))}>
              {VERDICT_ICON[verdict]}
              {getVerdictLabel(verdict)}
            </Badge>
            <span className="text-[10px] font-mono text-muted-foreground">
              {formatPercent(confidence)} confidence
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              via {source}
            </span>
          </div>
        </div>

        <button className="text-muted-foreground/40 hover:text-foreground transition-colors mt-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 ml-10 space-y-3 animate-fade-in">
          {/* Explanation */}
          <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>

          {/* Evidence items */}
          {evidence.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-mono font-semibold text-muted-foreground/60 tracking-wider uppercase">
                Evidence
              </p>
              {evidence.map((ev, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-2 text-xs p-2 rounded-md border",
                    ev.type === "supports" && "border-emerald-500/20 bg-emerald-500/5",
                    ev.type === "contradicts" && "border-red-500/20 bg-red-500/5",
                    ev.type === "neutral" && "border-white/10 bg-white/[0.02]",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 w-1.5 h-1.5 rounded-full mt-1.5",
                      ev.type === "supports" && "bg-emerald-400",
                      ev.type === "contradicts" && "bg-red-400",
                      ev.type === "neutral" && "bg-gray-400",
                    )}
                  />
                  <div className="flex-1">
                    <p className="text-muted-foreground">{ev.description}</p>
                    {ev.dataPoint && (
                      <p className="mt-1 font-mono text-[10px] text-foreground/70">
                        → {ev.dataPoint}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                      Source: {ev.source}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
