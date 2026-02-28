/**
 * Claude API client for DealBreakr AI
 *
 * Handles communication with the Anthropic API and parses
 * structured JSON responses. Falls back to mock data when
 * the API key is not set (for demo / hackathon purposes).
 */

import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildAnalysisPrompt } from "./prompts";
import { getMockAnalysis } from "./mock-data";
import type { ClaudeAnalysisResponse } from "@/types";
import {
  canMakeClaudeCall,
  recordClaudeUsage,
  getUsageStats,
  estimateTokens,
} from "./claude-rate-limit";
import {
  getCachedAnalysis,
  setCachedAnalysis,
} from "./claude-cache";

// Initialize Anthropic client - check API key at startup
const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

if (apiKey) {
  console.log("[DealBreakr] ✅ Anthropic API key found - using Claude API");
  // Verify API key format
  if (!apiKey.startsWith("sk-ant-")) {
    console.warn("[DealBreakr] ⚠️  API key format looks incorrect");
  }
} else {
  console.log("[DealBreakr] ⚠️  No ANTHROPIC_API_KEY found - will use mock data");
}

export async function analyzeProperty(params: {
  address: string;
  listingText?: string;
  listPrice?: number;
  propertyType?: string;
  realieData?: {
    beds?: number;
    baths?: number;
    sqft?: number;
    lotSqft?: number;
    yearBuilt?: number;
  };
}): Promise<ClaudeAnalysisResponse> {
  // Check cache first to avoid duplicate API calls
  const cached = getCachedAnalysis({
    address: params.address,
    listingText: params.listingText,
    listPrice: params.listPrice,
  });
  
  if (cached) {
    console.log("[DealBreakr] ✅ Using cached analysis (saving API cost)");
    return cached;
  }

  // Fall back to mock data if no API key configured
  if (!anthropic || !apiKey) {
    console.log("[DealBreakr] No API key — using mock data");
    // Simulate analysis delay
    await new Promise((r) => setTimeout(r, 1500));
    const mockResult = getMockAnalysis(params.address);
    // Cache mock result too
    setCachedAnalysis({
      address: params.address,
      listingText: params.listingText,
      listPrice: params.listPrice,
    }, mockResult);
    return mockResult;
  }

  const userPrompt = buildAnalysisPrompt({
    address: params.address,
    listingText: params.listingText,
    listPrice: params.listPrice,
    propertyType: params.propertyType,
    realieData: params.realieData,
  });

  // Check rate limits and budget before making API call
  const rateLimitCheck = canMakeClaudeCall();
  if (!rateLimitCheck.allowed) {
    console.warn(`[DealBreakr] ⚠️  Claude API call blocked: ${rateLimitCheck.reason}`);
    console.log(`[DealBreakr] 📊 Current usage: $${rateLimitCheck.stats.estimatedCost.toFixed(2)} / $5.00`);
    console.log(`[DealBreakr] 🔄 Falling back to mock data`);
    await new Promise((r) => setTimeout(r, 1500));
    return getMockAnalysis(params.address);
  }

  const estimatedInputTokens = estimateTokens(SYSTEM_PROMPT + userPrompt);
  console.log("[DealBreakr] 🤖 Calling Claude API for:", params.address);
  console.log(`[DealBreakr] 📝 Estimated input tokens: ~${estimatedInputTokens}`);
  console.log(`[DealBreakr] 💰 Current cost: $${rateLimitCheck.stats.estimatedCost.toFixed(2)} / $5.00`);

  try {
    const startTime = Date.now();
    
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514", // Claude Sonnet 4
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const duration = Date.now() - startTime;
    
    // Get actual token usage from response
    const inputTokens = message.usage?.input_tokens || estimatedInputTokens;
    const outputTokens = message.usage?.output_tokens || 0;
    
    // Record usage for cost tracking
    recordClaudeUsage(inputTokens, outputTokens);
    
    const currentStats = getUsageStats();
    console.log(`[DealBreakr] ✅ Claude API response received in ${duration}ms`);
    console.log(`[DealBreakr] 📊 Tokens: ${inputTokens} in, ${outputTokens} out`);
    console.log(`[DealBreakr] 💰 Total cost: $${currentStats.estimatedCost.toFixed(2)} / $5.00`);

    // Extract text from the response
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Parse JSON — strip any accidental markdown fences
    let raw = textBlock.text.trim();
    
    // Remove markdown code fences if present
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    }

    // Try to parse JSON
    let parsed: ClaudeAnalysisResponse;
    try {
      parsed = JSON.parse(raw);
    } catch (parseError) {
      console.error("[DealBreakr] ❌ JSON parse error:", parseError);
      console.error("[DealBreakr] Raw response (first 500 chars):", raw.substring(0, 500));
      throw new Error(`Failed to parse Claude response as JSON: ${parseError}`);
    }

    // Validate response structure
    if (!parsed.trustScore || !parsed.claims || !parsed.actionItems) {
      console.warn("[DealBreakr] ⚠️  Response missing required fields, using fallback");
      throw new Error("Invalid response structure from Claude");
    }

    console.log(`[DealBreakr] ✅ Analysis complete: ${parsed.claims.length} claims, trust score: ${parsed.trustScore}`);
    
    // Cache the result to avoid duplicate API calls
    setCachedAnalysis({
      address: params.address,
      listingText: params.listingText,
      listPrice: params.listPrice,
    }, parsed);
    
    return parsed;
  } catch (error: any) {
    console.error("[DealBreakr] ❌ Claude API error:", error);
    
    // Log specific error details
    if (error.status === 401) {
      console.error("[DealBreakr] ❌ Authentication failed - check your API key");
    } else if (error.status === 429) {
      console.error("[DealBreakr] ❌ Rate limit exceeded - too many requests");
    } else if (error.status === 400) {
      console.error("[DealBreakr] ❌ Bad request - check prompt format");
    }
    
    // On API failure, fall back to mock data so the demo still works
    console.log("[DealBreakr] 🔄 Falling back to mock data");
    const mockResult = getMockAnalysis(params.address);
    // Cache mock result
    setCachedAnalysis({
      address: params.address,
      listingText: params.listingText,
      listPrice: params.listPrice,
    }, mockResult);
    return mockResult;
  }
}
