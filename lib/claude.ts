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
import type {
  ClaudeAnalysisResponse,
  PropertySnapshot,
  ComparableProperty,
} from "@/types";

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
  snapshotFromApi?: PropertySnapshot | null;
  comparablesFromApi?: ComparableProperty[] | null;
}): Promise<ClaudeAnalysisResponse> {
  // Fall back to mock data if no API key configured
  if (!anthropic || !apiKey) {
    console.log("[DealBreakr] No API key — using mock data");
    // Simulate analysis delay
    await new Promise((r) => setTimeout(r, 1500));
    return getMockAnalysis(params.address);
  }

  const userPrompt = buildAnalysisPrompt(params);

  console.log("[DealBreakr] 🤖 Calling Claude API for:", params.address);
  console.log("[DealBreakr] 📝 Prompt length:", userPrompt.length, "characters");

  try {
    const startTime = Date.now();
    
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // Updated to current stable model
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const duration = Date.now() - startTime;
    console.log(`[DealBreakr] ✅ Claude API response received in ${duration}ms`);

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
    return getMockAnalysis(params.address);
  }
}
