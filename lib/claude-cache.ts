/**
 * Simple in-memory cache for Claude API responses
 * 
 * Caches analysis results by address to avoid duplicate API calls.
 * This helps stay within budget by reusing previous analyses.
 */

import type { ClaudeAnalysisResponse } from "@/types";

interface CachedAnalysis {
  response: ClaudeAnalysisResponse;
  timestamp: number;
  address: string;
}

// Cache storage (in production, use Redis or database)
const cache = new Map<string, CachedAnalysis>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate cache key from property parameters
 */
function getCacheKey(params: {
  address: string;
  listingText?: string;
  listPrice?: number;
}): string {
  // Normalize address for consistent caching
  const normalizedAddress = params.address.toLowerCase().trim();
  const key = `${normalizedAddress}:${params.listPrice || 'no-price'}:${params.listingText?.slice(0, 50) || 'no-text'}`;
  return Buffer.from(key).toString('base64').slice(0, 64);
}

/**
 * Get cached analysis if available and not expired
 */
export function getCachedAnalysis(params: {
  address: string;
  listingText?: string;
  listPrice?: number;
}): ClaudeAnalysisResponse | null {
  const key = getCacheKey(params);
  const cached = cache.get(key);

  if (!cached) {
    return null;
  }

  // Check if cache is expired
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  console.log(`[Cache] ✅ Using cached analysis for: ${params.address} (age: ${Math.round(age / 1000 / 60)}min)`);
  return cached.response;
}

/**
 * Store analysis in cache
 */
export function setCachedAnalysis(
  params: {
    address: string;
    listingText?: string;
    listPrice?: number;
  },
  response: ClaudeAnalysisResponse
): void {
  const key = getCacheKey(params);
  cache.set(key, {
    response,
    timestamp: Date.now(),
    address: params.address,
  });
  console.log(`[Cache] 💾 Cached analysis for: ${params.address}`);
}

/**
 * Clear expired cache entries
 */
export function cleanCache(): void {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, cached] of cache.entries()) {
    if (now - cached.timestamp > CACHE_TTL) {
      cache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[Cache] 🧹 Cleaned ${cleaned} expired entries`);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; entries: Array<{ address: string; age: number }> } {
  const entries = Array.from(cache.entries()).map(([key, cached]) => ({
    address: cached.address,
    age: Date.now() - cached.timestamp,
  }));
  
  return {
    size: cache.size,
    entries,
  };
}
