/**
 * GET /api/usage
 * 
 * Returns current Claude API usage statistics and budget status
 */

import { NextResponse } from "next/server";
import { getUsageStats } from "@/lib/claude-rate-limit";

export async function GET() {
  const stats = getUsageStats();
  const budgetLimit = 5.0;
  const remaining = budgetLimit - stats.estimatedCost;
  const percentage = (stats.estimatedCost / budgetLimit) * 100;

  return NextResponse.json({
    usage: {
      totalCalls: stats.totalCalls,
      totalInputTokens: stats.totalInputTokens,
      totalOutputTokens: stats.totalOutputTokens,
      estimatedCost: parseFloat(stats.estimatedCost.toFixed(4)),
      budgetLimit: budgetLimit,
      remaining: parseFloat(remaining.toFixed(4)),
      percentageUsed: parseFloat(percentage.toFixed(2)),
    },
    status: stats.estimatedCost >= 4.5 ? "limit_reached" : stats.estimatedCost >= 4.0 ? "warning" : "ok",
    canMakeCalls: stats.estimatedCost < 4.5,
  });
}
