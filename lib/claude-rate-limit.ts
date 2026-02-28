/**
 * Claude API Rate Limiter and Cost Tracker
 * 
 * Tracks API usage and enforces rate limits to stay within budget.
 * Claude Sonnet 4 pricing (as of 2025):
 * - Input: ~$3 per 1M tokens
 * - Output: ~$15 per 1M tokens
 * 
 * For $5 budget, estimate ~1.6M input tokens or ~330K output tokens
 * Conservative estimate: ~50-100 full analyses
 */

interface UsageStats {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCost: number; // in USD
  lastReset: number; // timestamp
}

// In-memory usage tracking (in production, use Redis or database)
let usageStats: UsageStats = {
  totalCalls: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  estimatedCost: 0,
  lastReset: Date.now(),
};

// Claude 3.5 Sonnet pricing (per 1M tokens)
const PRICING = {
  input: 3.0, // $3 per 1M input tokens
  output: 15.0, // $15 per 1M output tokens
};

// Budget limits
const BUDGET_LIMIT = 5.0; // $5 total budget
const WARNING_THRESHOLD = 4.0; // Warn at $4
const SAFE_LIMIT = 4.5; // Hard stop at $4.50 to leave buffer

// Rate limiting
const MAX_CALLS_PER_MINUTE = 5; // Prevent burst usage
const MAX_CALLS_PER_HOUR = 30;

// Track recent calls for rate limiting
const recentCalls: number[] = [];

/**
 * Estimate cost based on token counts
 */
function estimateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * PRICING.input;
  const outputCost = (outputTokens / 1_000_000) * PRICING.output;
  return inputCost + outputCost;
}

/**
 * Check if we can make an API call based on budget and rate limits
 */
export function canMakeClaudeCall(): { allowed: boolean; reason?: string; stats: UsageStats } {
  const now = Date.now();

  // Clean old calls (older than 1 hour)
  const oneHourAgo = now - 60 * 60 * 1000;
  while (recentCalls.length > 0 && recentCalls[0] < oneHourAgo) {
    recentCalls.shift();
  }

  // Check budget
  if (usageStats.estimatedCost >= SAFE_LIMIT) {
    return {
      allowed: false,
      reason: `Budget limit reached: $${usageStats.estimatedCost.toFixed(2)} / $${BUDGET_LIMIT}`,
      stats: usageStats,
    };
  }

  // Check hourly rate limit
  const callsLastHour = recentCalls.length;
  if (callsLastHour >= MAX_CALLS_PER_HOUR) {
    return {
      allowed: false,
      reason: `Hourly rate limit: ${callsLastHour} calls in last hour (max: ${MAX_CALLS_PER_HOUR})`,
      stats: usageStats,
    };
  }

  // Check per-minute rate limit
  const oneMinuteAgo = now - 60 * 1000;
  const callsLastMinute = recentCalls.filter((time) => time > oneMinuteAgo).length;
  if (callsLastMinute >= MAX_CALLS_PER_MINUTE) {
    return {
      allowed: false,
      reason: `Rate limit: ${callsLastMinute} calls in last minute (max: ${MAX_CALLS_PER_MINUTE})`,
      stats: usageStats,
    };
  }

  return { allowed: true, stats: usageStats };
}

/**
 * Record API usage after a call
 */
export function recordClaudeUsage(inputTokens: number, outputTokens: number): void {
  const cost = estimateCost(inputTokens, outputTokens);

  usageStats.totalCalls++;
  usageStats.totalInputTokens += inputTokens;
  usageStats.totalOutputTokens += outputTokens;
  usageStats.estimatedCost += cost;

  recentCalls.push(Date.now());

  // Log warning if approaching budget
  if (usageStats.estimatedCost >= WARNING_THRESHOLD && usageStats.estimatedCost < SAFE_LIMIT) {
    console.warn(
      `[RateLimit] ⚠️  Approaching budget: $${usageStats.estimatedCost.toFixed(2)} / $${BUDGET_LIMIT}`
    );
  }

  if (usageStats.estimatedCost >= SAFE_LIMIT) {
    console.error(
      `[RateLimit] 🛑 Budget limit reached: $${usageStats.estimatedCost.toFixed(2)}. Stopping Claude API calls.`
    );
  }
}

/**
 * Get current usage statistics
 */
export function getUsageStats(): UsageStats {
  return { ...usageStats };
}

/**
 * Reset usage stats (for testing or new billing period)
 */
export function resetUsageStats(): void {
  usageStats = {
    totalCalls: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    estimatedCost: 0,
    lastReset: Date.now(),
  };
  recentCalls.length = 0;
  console.log("[RateLimit] ✅ Usage stats reset");
}

/**
 * Estimate tokens for a prompt (rough approximation)
 * ~4 characters = 1 token for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
