/**
 * Claude Prompt Templates for DealBreakr AI
 *
 * All prompts request structured JSON output only.
 * We use a system prompt to set the role, then a user prompt
 * with the property details and listing text.
 *
 * IMPORTANT: We never make legal accusations or definitive fraud claims.
 * We use "unverified" when evidence is missing. We distinguish
 * facts, inferences, and marketing language.
 */

import type { ScoringCategory } from "@/types";

// ─── System prompt: sets Claude's role and output contract ─────────
export const SYSTEM_PROMPT = `You are DealBreakr AI — a meticulous real-estate due-diligence analyst.

Your job: cross-examine property listings to identify claims, verify them against
known property facts, and produce a structured buyer war room.

RULES:
1. NEVER make legal accusations or definitive fraud claims.
2. Use "unverified" when you cannot find evidence — not "false".
3. Always distinguish between FACTS (from records), INFERENCES (your analysis),
   and MARKETING LANGUAGE (subjective phrasing from the listing).
4. Be specific. Reference actual data points when possible.
5. Scoring categories: record_mismatch, pricing_anomaly, ownership_title,
   disclosure_ambiguity, neighborhood_fit, renovation_permit.
6. Trust score is 0–100 where 100 = fully trustworthy listing.
7. Output ONLY valid JSON. No markdown, no commentary outside JSON.

Your output must conform exactly to the JSON schema provided in the user message.`;

// ─── User prompt builder ───────────────────────────────────────────
export function buildAnalysisPrompt(params: {
  address: string;
  listingText?: string;
  listPrice?: number;
  propertyType?: string;
}): string {
  const { address, listingText, listPrice, propertyType } = params;

  return `Analyze this property listing and return a JSON object.

## PROPERTY INPUT
Address: ${address}
${listPrice ? `List Price: $${listPrice.toLocaleString()}` : "List Price: not provided"}
${propertyType ? `Property Type: ${propertyType}` : ""}
${listingText ? `\n## LISTING TEXT\n${listingText}` : "\nNo listing text provided — analyze based on address and public knowledge only."}

## INSTRUCTIONS
1. Generate a realistic property snapshot based on what you know or can infer about this address and area. If you don't have exact data, provide reasonable estimates and mark confidence accordingly.
2. Provide market context with comparable properties.
3. Extract every verifiable CLAIM from the listing text (or infer common claims if no text provided).
4. For each claim, provide evidence items that support or contradict it.
5. Generate action items for a buyer's due-diligence war room.
6. Calculate a trust score (0–100).

## REQUIRED JSON SCHEMA
{
  "propertySnapshot": {
    "beds": <number|null>,
    "baths": <number|null>,
    "sqft": <number|null>,
    "lotSqft": <number|null>,
    "yearBuilt": <number|null>,
    "stories": <number|null>,
    "garage": <string|null>,
    "hoa": <number|null>,
    "zoning": <string|null>,
    "taxAssessedValue": <number|null>,
    "lastSaleDate": <string|null>,
    "lastSalePrice": <number|null>
  },
  "marketContext": {
    "medianAreaPrice": <number|null>,
    "pricePerSqft": <number|null>,
    "areaMedianPpsf": <number|null>,
    "avgDaysOnMarket": <number|null>,
    "inventoryLevel": <"low"|"balanced"|"high"|null>,
    "comparables": [
      {
        "address": <string>,
        "price": <number>,
        "sqft": <number>,
        "beds": <number>,
        "baths": <number>,
        "soldDate": <string>,
        "ppsf": <number>
      }
    ]
  },
  "trustScore": <number 0-100>,
  "trustLabel": <"high"|"medium"|"low">,
  "overallVerdict": <string — 1-2 sentence summary>,
  "claims": [
    {
      "category": <"record_mismatch"|"pricing_anomaly"|"ownership_title"|"disclosure_ambiguity"|"neighborhood_fit"|"renovation_permit">,
      "statement": <string — the claim being examined>,
      "source": <"listing"|"public_record"|"inference">,
      "verdict": <"verified"|"unverified"|"contradiction"|"marketing">,
      "confidence": <number 0-1>,
      "explanation": <string — why this verdict>,
      "severity": <"info"|"caution"|"warning"|"critical">,
      "evidence": [
        {
          "type": <"supports"|"contradicts"|"neutral">,
          "source": <string — where this evidence comes from>,
          "description": <string>,
          "dataPoint": <string|null>
        }
      ]
    }
  ],
  "actionItems": [
    {
      "category": <"question"|"document"|"inspection">,
      "priority": <"critical"|"high"|"medium"|"low">,
      "title": <string>,
      "description": <string>,
      "relatedClaimCategories": [<string>]
    }
  ]
}

Generate 8-15 claims across all 6 scoring categories.
Generate 6-10 action items covering questions, documents, and inspections.
Include 3-5 comparable properties.

Return ONLY the JSON object. No markdown fences, no extra text.`;
}

// ─── Category-specific deep-dive prompt ────────────────────────────
export function buildCategoryDeepDivePrompt(
  address: string,
  category: ScoringCategory,
  existingClaims: string
): string {
  return `You previously analyzed the property at ${address}.

Here are the existing claims for the "${category}" category:
${existingClaims}

Provide 3-5 additional detailed claims for this category that a buyer should
investigate. Return ONLY a JSON array of claim objects using the same schema.

Return ONLY the JSON array. No markdown fences, no extra text.`;
}
