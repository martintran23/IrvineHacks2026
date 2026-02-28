/**
 * Claude API client for DealBreakr AI
 *
 * Handles communication with the Anthropic API and parses
 * structured JSON responses. Requires ANTHROPIC_API_KEY; no mock fallback.
 */

import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildAnalysisPrompt } from "./prompts";
import type {
  ClaudeAnalysisResponse,
  PropertySnapshot,
  ComparableProperty,
} from "@/types";

function getApiKey(): string {
  const raw = process.env.ANTHROPIC_API_KEY ?? "";
  return raw.trim();
}

export async function analyzeProperty(params: {
  address: string;
  listingText?: string;
  listPrice?: number;
  propertyType?: string;
  snapshotFromApi?: PropertySnapshot | null;
  comparablesFromApi?: ComparableProperty[] | null;
  buyerProfile?: unknown;
}): Promise<ClaudeAnalysisResponse> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is required for analysis. Add it to your .env file and restart the server."
    );
  }
  if (!apiKey.startsWith("sk-ant-")) {
    throw new Error(
      "ANTHROPIC_API_KEY must start with sk-ant- (get a key at https://console.anthropic.com). You may have set the Realie key by mistake."
    );
  }

  const anthropic = new Anthropic({ apiKey });

  const userPrompt = buildAnalysisPrompt(params);

  console.log("[DealBreakr] 🤖 Calling Claude API for:", params.address);
  console.log("[DealBreakr] 📝 Prompt length:", userPrompt.length, "characters");

  try {
    const startTime = Date.now();
    
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
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

    if (error.status === 401) {
      console.error("[DealBreakr] ❌ Authentication failed - check your API key");
    } else if (error.status === 429) {
      console.error("[DealBreakr] ❌ Rate limit exceeded - too many requests");
    } else if (error.status === 400) {
      console.error("[DealBreakr] ❌ Bad request - check prompt format");
    }

    throw error;
  }
}
