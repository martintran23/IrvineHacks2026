/**
 * lib/prompts-fit.ts
 *
 * Additional Claude prompt section that injects the buyer profile
 * into the analysis prompt. This makes Claude's analysis personalized:
 * it will call out accessibility issues, budget concerns, and
 * feature gaps specific to this buyer.
 *
 * INTEGRATION: Add the output of buildBuyerProfilePromptSection()
 * to your existing buildAnalysisPrompt() in lib/prompts.ts
 *
 * DROP-IN: import { buildBuyerProfilePromptSection } from "@/lib/prompts-fit"
 */

import type { BuyerProfile } from "@/types/buyer-profile";
import {
  BUYER_SITUATION_LABELS,
  HOUSEHOLD_LABELS,
  ACCESSIBILITY_LABELS,
  ACCESSIBILITY_PROPERTY_REQS,
  FEATURE_LABELS,
} from "@/types/buyer-profile";

/**
 * Generates the buyer profile section to append to the Claude analysis prompt.
 * Returns empty string if no profile is provided.
 */
export function buildBuyerProfilePromptSection(profile?: BuyerProfile | null): string {
  if (!profile) return "";

  const accessNeeds = profile.accessibilityNeeds.filter(n => n !== "none");
  const accessReqs = accessNeeds.flatMap(n =>
    (ACCESSIBILITY_PROPERTY_REQS[n] || []).map(r => `  - ${r}`)
  );

  return `
## BUYER PROFILE (PERSONALIZED ANALYSIS)
This buyer has provided their profile. Incorporate these needs into your analysis.
When evaluating claims, ADD SPECIFIC CALLOUTS about how findings affect THIS buyer.

Situation: ${BUYER_SITUATION_LABELS[profile.situation]}
Household: ${profile.householdMembers.map(m => HOUSEHOLD_LABELS[m]).join(", ")} (${profile.householdSize} people)
Budget: $${profile.budgetMin.toLocaleString()} – $${profile.budgetMax.toLocaleString()} (stretch: $${profile.budgetStretch.toLocaleString()})
Max monthly payment: $${profile.monthlyPaymentMax.toLocaleString()}/mo

${accessNeeds.length > 0 ? `### ACCESSIBILITY NEEDS (CRITICAL — FLAG ANY ISSUES)
${accessNeeds.map(n => `- ${ACCESSIBILITY_LABELS[n]}`).join("\n")}

Required property features for accessibility:
${accessReqs.join("\n")}

${profile.accessibilityNotes ? `Additional notes from buyer: "${profile.accessibilityNotes}"` : ""}

IMPORTANT: For EACH accessibility need, add a claim evaluating whether this property
meets that need. Use category "neighborhood_fit" or "record_mismatch" as appropriate.
Be specific about what works and what doesn't. If the property is multi-story and the
buyer needs wheelchair access, that is a CRITICAL severity finding.
` : "No specific accessibility needs."}

### MUST-HAVE FEATURES
${profile.mustHaves.length > 0 ? profile.mustHaves.map(f => `- ${FEATURE_LABELS[f]}`).join("\n") : "None specified"}

### NICE-TO-HAVE FEATURES
${profile.niceToHaves.length > 0 ? profile.niceToHaves.map(f => `- ${FEATURE_LABELS[f]}`).join("\n") : "None specified"}

### DEALBREAKERS (buyer does NOT want these)
${profile.dealbreakers.length > 0 ? profile.dealbreakers.map(f => `- ${FEATURE_LABELS[f]}`).join("\n") : "None specified"}

### LIFESTYLE
${profile.commuteDestination ? `Commutes to: ${profile.commuteDestination} (${profile.commuteMode}, max ${profile.maxCommuteMinutes} min)` : "Remote / no commute specified"}
Minimum: ${profile.bedsMin} beds, ${profile.bathsMin} baths, ${profile.sqftMin} sqft
${profile.hasPets ? `Has pets: ${profile.petTypes.join(", ")}` : "No pets"}
${profile.prioritizeOutdoorSpace ? "Outdoor space is a priority" : ""}

### INSTRUCTIONS FOR PERSONALIZED ANALYSIS
1. In your overallVerdict, mention how well this property fits THIS specific buyer.
2. Add 2-3 extra claims specifically about buyer-property fit (accessibility, commute, lifestyle).
3. In actionItems, add personalized items like "Verify wheelchair accessibility at entry" or "Check school district ratings for family with young children".
4. If the property triggers a dealbreaker or has critical accessibility issues, reflect that prominently in the trust score and verdict.
`;
}
