import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TrustLabel, Verdict, Severity, ScoringCategory } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Trust score color helpers ─────────────────────────────────────
export function getTrustColor(label: TrustLabel): string {
  switch (label) {
    case "high": return "text-trust-high";
    case "medium": return "text-trust-medium";
    case "low": return "text-trust-low";
    default: return "text-muted-foreground";
  }
}

export function getTrustBg(label: TrustLabel): string {
  switch (label) {
    case "high": return "bg-trust-high/10 border-trust-high/30";
    case "medium": return "bg-trust-medium/10 border-trust-medium/30";
    case "low": return "bg-trust-low/10 border-trust-low/30";
    default: return "bg-muted border-border";
  }
}

export function getTrustRingColor(label: TrustLabel): string {
  switch (label) {
    case "high": return "#10b981";
    case "medium": return "#f59e0b";
    case "low": return "#ef4444";
    default: return "#6b7280";
  }
}

// ─── Verdict helpers ───────────────────────────────────────────────
export function getVerdictColor(verdict: Verdict): string {
  switch (verdict) {
    case "verified": return "text-verdict-verified";
    case "unverified": return "text-verdict-unverified";
    case "contradiction": return "text-verdict-contradiction";
    case "marketing": return "text-verdict-marketing";
  }
}

export function getVerdictBg(verdict: Verdict): string {
  switch (verdict) {
    case "verified": return "bg-verdict-verified/10 text-verdict-verified border-verdict-verified/30";
    case "unverified": return "bg-verdict-unverified/10 text-verdict-unverified border-verdict-unverified/30";
    case "contradiction": return "bg-verdict-contradiction/10 text-verdict-contradiction border-verdict-contradiction/30";
    case "marketing": return "bg-verdict-marketing/10 text-verdict-marketing border-verdict-marketing/30";
  }
}

export function getVerdictLabel(verdict: Verdict): string {
  switch (verdict) {
    case "verified": return "Verified";
    case "unverified": return "Unverified";
    case "contradiction": return "Contradiction";
    case "marketing": return "Marketing";
  }
}

// ─── Severity helpers ──────────────────────────────────────────────
export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case "critical": return "text-red-400";
    case "warning": return "text-amber-400";
    case "caution": return "text-yellow-300";
    case "info": return "text-sky-400";
  }
}

export function getSeverityBg(severity: Severity): string {
  switch (severity) {
    case "critical": return "bg-red-500/10 border-red-500/30";
    case "warning": return "bg-amber-500/10 border-amber-500/30";
    case "caution": return "bg-yellow-500/10 border-yellow-500/30";
    case "info": return "bg-sky-500/10 border-sky-500/30";
  }
}

// ─── Format helpers ────────────────────────────────────────────────
export function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

// ─── Category risk chart data ──────────────────────────────────────
export function getCategoryChartColor(category: ScoringCategory): string {
  const colors: Record<ScoringCategory, string> = {
    record_mismatch: "#f97316",
    pricing_anomaly: "#ef4444",
    ownership_title: "#8b5cf6",
    disclosure_ambiguity: "#f59e0b",
    neighborhood_fit: "#06b6d4",
    renovation_permit: "#ec4899",
  };
  return colors[category];
}
