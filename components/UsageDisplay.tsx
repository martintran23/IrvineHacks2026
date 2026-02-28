"use client";

import { useEffect, useState } from "react";
import { DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";

interface UsageData {
  usage: {
    estimatedCost: number;
    budgetLimit: number;
    remaining: number;
    percentageUsed: number;
    totalCalls: number;
  };
  status: "ok" | "warning" | "limit_reached";
  canMakeCalls: boolean;
}

export function UsageDisplay() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/usage");
        const data = await res.json();
        setUsage(data);
      } catch (error) {
        console.error("Failed to fetch usage:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !usage) {
    return null;
  }

  const { usage: stats, status, canMakeCalls } = usage;
  const percentage = stats.percentageUsed;

  const getStatusColor = () => {
    if (status === "limit_reached") return "text-red-400";
    if (status === "warning") return "text-amber-400";
    return "text-emerald-400";
  };

  const getStatusBg = () => {
    if (status === "limit_reached") return "bg-red-500/10 border-red-500/30";
    if (status === "warning") return "bg-amber-500/10 border-amber-500/30";
    return "bg-emerald-500/10 border-emerald-500/30";
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-3 rounded-lg border text-xs font-mono ${getStatusBg()}`}>
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className={`w-3.5 h-3.5 ${getStatusColor()}`} />
        <span className={getStatusColor()}>
          Claude API: ${stats.estimatedCost.toFixed(2)} / ${stats.budgetLimit.toFixed(2)}
        </span>
        {status === "limit_reached" ? (
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
        ) : status === "warning" ? (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        )}
      </div>
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
        <div
          className={`h-full transition-all ${
            status === "limit_reached"
              ? "bg-red-500"
              : status === "warning"
              ? "bg-amber-500"
              : "bg-emerald-500"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">
        {stats.totalCalls} calls • {percentage.toFixed(1)}% used
      </div>
    </div>
  );
}
