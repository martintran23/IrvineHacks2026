"use client";

import { useEffect, useState } from "react";
import { getTrustRingColor } from "@/lib/utils";
import type { TrustLabel } from "@/types";

interface TrustScoreRingProps {
  score: number;
  label: TrustLabel;
  size?: number;
}

/**
 * Animated circular trust score gauge.
 * Uses SVG with a dasharray/dashoffset animation trick.
 */
export function TrustScoreRing({ score, label, size = 180 }: TrustScoreRingProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // How much of the ring to fill (score is 0-100)
  const offset = circumference - (score / 100) * circumference;
  const color = getTrustRingColor(label);

  const labelText = label === "high" ? "HIGH TRUST" : label === "medium" ? "MODERATE" : label === "low" ? "LOW TRUST" : "PENDING";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
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
        {/* Score ring with animation */}
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
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-4xl font-display font-bold tabular-nums"
          style={{ color }}
        >
          {mounted ? score : 0}
        </span>
        <span
          className="text-[10px] font-mono font-semibold tracking-[0.2em] mt-1"
          style={{ color }}
        >
          {labelText}
        </span>
      </div>
    </div>
  );
}
