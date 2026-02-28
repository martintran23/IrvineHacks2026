/**
 * components/dashboard/FitScoreRing.tsx
 *
 * Animated circular fit score gauge — mirrors TrustScoreRing but
 * uses the buyer match color scheme (emerald/amber/rose gradient).
 *
 * DROP-IN: import { FitScoreRing } from "@/components/dashboard/FitScoreRing"
 */

"use client";

import { useEffect, useState } from "react";
import type { FitScoreResult } from "@/types/buyer-profile";

interface FitScoreRingProps {
  result: FitScoreResult;
  size?: number;
}

function getFitColor(label: FitScoreResult["label"]): string {
  switch (label) {
    case "great_match": return "#10b981";
    case "good_match": return "#06b6d4";
    case "fair": return "#f59e0b";
    case "poor_match": return "#f97316";
    case "dealbreaker": return "#ef4444";
  }
}

function getFitLabel(label: FitScoreResult["label"]): string {
  switch (label) {
    case "great_match": return "GREAT MATCH";
    case "good_match": return "GOOD MATCH";
    case "fair": return "FAIR";
    case "poor_match": return "POOR MATCH";
    case "dealbreaker": return "DEALBREAKER";
  }
}

function getFitEmoji(label: FitScoreResult["label"]): string {
  switch (label) {
    case "great_match": return "🏡";
    case "good_match": return "👍";
    case "fair": return "🤔";
    case "poor_match": return "⚠️";
    case "dealbreaker": return "🚫";
  }
}

export function FitScoreRing({ result, size = 160 }: FitScoreRingProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (result.overallScore / 100) * circumference;
  const color = getFitColor(result.label);

  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-white/5"
          />
          {/* Score ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? offset : circumference}
            style={{
              transition: "stroke-dashoffset 1.5s ease-out",
              filter: `drop-shadow(0 0 8px ${color}40)`,
            }}
          />
        </svg>
        {/* Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg mb-0.5">{getFitEmoji(result.label)}</span>
          <span className="text-3xl font-display font-bold tabular-nums" style={{ color }}>
            {mounted ? result.overallScore : 0}
          </span>
          <span className="text-[9px] font-mono font-semibold tracking-[0.15em] mt-0.5" style={{ color }}>
            {getFitLabel(result.label)}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2 max-w-[200px]">
        {result.summary}
      </p>
    </div>
  );
}
