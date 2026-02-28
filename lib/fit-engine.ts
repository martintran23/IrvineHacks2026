/**
 * lib/fit-engine.ts
 *
 * Computes a Fit Score (0–100) by comparing the buyer's profile
 * against the property analysis. Handles accessibility needs,
 * budget, features, and lifestyle requirements.
 *
 * This runs client-side so there's no API cost.
 * For deeper personalized analysis, the profile is also sent to Claude.
 *
 * DROP-IN: import { computeFitScore } from "@/lib/fit-engine"
 */

import type {
  BuyerProfile,
  FitScoreResult,
  FitCategory,
  FitFeatureMatch,
  AccessibilityFlag,
  PropertySuggestion,
  AccessibilityNeed,
  PropertyFeature,
} from "@/types/buyer-profile";
import type { PropertySnapshot, MarketContext } from "@/types";

// Accessibility requirements by need
const ACCESSIBILITY_REQS: Record<string, string[]> = {
  wheelchair_full: [
    "Single story or elevator access",
    'Wide doorways (36"+ clear)',
    "Roll-in shower or adaptable bathroom",
    "No-step entry / ramp access",
  ],
  wheelchair_occasional: [
    "Single story preferred or elevator",
    "Wide hallways and doorways",
    "At least one accessible bathroom on main floor",
  ],
  mobility_limited: [
    "Few or no stairs (single story ideal)",
    "Walk-in shower or tub with low threshold",
    "Well-lit pathways",
    "Close parking to entry",
  ],
  visual_impairment: [
    "Well-lit interior and exterior",
    "Simple, predictable floor plan",
    "Proximity to public transit",
    "Walkable neighborhood",
  ],
  hearing_impairment: [
    "Visual doorbell / alert systems installable",
    "Open floor plan for line-of-sight",
    "Good natural lighting",
  ],
  sensory_sensitivity: [
    "Quiet neighborhood",
    "Good sound insulation",
    "Not adjacent to commercial or high-traffic",
    "Private outdoor space",
  ],
  chronic_fatigue: [
    "Single story preferred",
    "Low-maintenance yard",
    "Short distance parking to door",
    "Nearby essential services",
  ],
  respiratory: [
    "Good ventilation / modern HVAC",
    "Away from freeways",
    "No mold history",
    "Not in high wildfire smoke area",
  ],
  cognitive: [
    "Simple, predictable layout",
    "Secure perimeter",
    "Quiet neighborhood",
  ],
  child_disability: [
    "Accessible bedroom and bathroom on main floor",
    "Safe, enclosed outdoor area",
    "Proximity to specialized schools",
  ],
  temporary_injury: [
    "Main floor bedroom and bathroom",
    "Minimal stairs",
    "Accessible shower",
  ],
  aging_in_place: [
    "Single story or main-floor master",
    "Bathroom adaptable for grab bars",
    "Wide doorways",
    "Near medical facilities",
  ],
  none: [],
};

interface AnalysisData {
  propertySnapshot: PropertySnapshot | null;
  marketContext: MarketContext | null;
  trustScore: number;
  trustLabel: string;
  listPrice: number | null;
  claims: any[];
  actionItems: any[];
}

/**
 * Determine the best available price for budget comparison.
 * Priority: listPrice > taxAssessedValue > lastSalePrice
 */
function getEffectivePrice(analysis: AnalysisData): number | null {
  if (analysis.listPrice && analysis.listPrice > 0) return analysis.listPrice;
  const snap = analysis.propertySnapshot;
  if (!snap) return null;
  if (snap.taxAssessedValue && snap.taxAssessedValue > 0) return snap.taxAssessedValue;
  if (snap.lastSalePrice && snap.lastSalePrice > 0) return snap.lastSalePrice;
  return null;
}

export function computeFitScore(
  profile: BuyerProfile,
  analysis: AnalysisData
): FitScoreResult {
  const snapshot = analysis.propertySnapshot;
  const categories: FitCategory[] = [];
  const matchedFeatures: FitFeatureMatch[] = [];
  const missedFeatures: FitFeatureMatch[] = [];
  const accessibilityFlags: AccessibilityFlag[] = [];
  const suggestions: PropertySuggestion[] = [];

  // ─── 1. Budget Fit (weight: 0.25) ────────────────────────────────
  let budgetScore = 100;
  let budgetDetails = "";
  const effectivePrice = getEffectivePrice(analysis);

  if (effectivePrice) {
    const price = effectivePrice;
    const priceLabel = analysis.listPrice ? "list price" : "estimated value";

    if (price <= profile.budgetMax) {
      budgetScore = 100;
      budgetDetails = "At $" + price.toLocaleString() + " (" + priceLabel + "), within your $" + profile.budgetMax.toLocaleString() + " budget.";
    } else if (price <= profile.budgetStretch) {
      const overBy = price - profile.budgetMax;
      const stretchRange = profile.budgetStretch - profile.budgetMax;
      budgetScore = Math.round(60 - (overBy / stretchRange) * 40);
      budgetDetails = "At $" + price.toLocaleString() + " (" + priceLabel + "), $" + overBy.toLocaleString() + " over preferred max but within stretch.";
      suggestions.push({
        category: "watch_out",
        icon: "DollarSign",
        title: "Over your preferred budget",
        description: "This property is $" + overBy.toLocaleString() + " above your preferred maximum of $" + profile.budgetMax.toLocaleString() + ".",
        priority: "high",
      });
    } else {
      // Over stretch budget — BAD fit
      const overStretch = price - profile.budgetStretch;
      const pctOver = (overStretch / profile.budgetStretch) * 100;
      budgetScore = Math.max(0, 15 - Math.round(pctOver / 2));
      budgetDetails = "At $" + price.toLocaleString() + " (" + priceLabel + "), exceeds your stretch budget of $" + profile.budgetStretch.toLocaleString() + " by $" + overStretch.toLocaleString() + ".";
      suggestions.push({
        category: "watch_out",
        icon: "DollarSign",
        title: "Significantly over budget",
        description: "This property is $" + overStretch.toLocaleString() + " above your absolute maximum. Likely not affordable.",
        priority: "high",
      });
    }
  } else {
    budgetScore = 40;
    budgetDetails = "No price data available. Cannot evaluate budget fit.";
  }
  categories.push({ name: "Budget Fit", score: budgetScore, weight: 0.25, details: budgetDetails });

  // ─── 2. Size & Layout Fit (weight: 0.20) ─────────────────────────
  let sizeScore = 100;
  let sizeDetails = "";
  const sizeIssues: string[] = [];

  if (snapshot) {
    if (snapshot.beds !== null && profile.bedsMin > 0) {
      if (snapshot.beds < profile.bedsMin) {
        const gap = profile.bedsMin - snapshot.beds;
        sizeScore -= gap * 25;
        sizeIssues.push(snapshot.beds + " beds (you need " + profile.bedsMin + "+)");
      }
    } else if (profile.bedsMin > 0) {
      sizeScore -= 10;
      sizeIssues.push("Bed count unknown (you need " + profile.bedsMin + "+)");
    }

    if (snapshot.baths !== null && profile.bathsMin > 0) {
      if (snapshot.baths < profile.bathsMin) {
        sizeScore -= 20;
        sizeIssues.push(snapshot.baths + " baths (you need " + profile.bathsMin + "+)");
      }
    } else if (profile.bathsMin > 0) {
      sizeScore -= 5;
      sizeIssues.push("Bath count unknown (you need " + profile.bathsMin + "+)");
    }

    if (profile.sqftMin > 0) {
      if (snapshot.sqft !== null) {
        if (snapshot.sqft < profile.sqftMin) {
          const deficit = ((profile.sqftMin - snapshot.sqft) / profile.sqftMin) * 100;
          sizeScore -= Math.min(35, Math.round(deficit));
          sizeIssues.push(snapshot.sqft.toLocaleString() + " sqft (you want " + profile.sqftMin.toLocaleString() + "+)");
        }
      } else {
        sizeScore -= 10;
        sizeIssues.push("Square footage unknown (you want " + profile.sqftMin.toLocaleString() + "+)");
      }
    }

    sizeDetails = sizeIssues.length > 0
      ? "Size concerns: " + sizeIssues.join("; ")
      : "Property meets your size requirements.";
  } else {
    sizeScore = 35;
    sizeDetails = "No property details available — cannot verify size requirements.";
  }
  sizeScore = Math.max(0, Math.min(100, sizeScore));
  categories.push({ name: "Size & Layout", score: sizeScore, weight: 0.20, details: sizeDetails });

  // ─── 3. Accessibility Fit (weight: 0.30 if needs, 0.05 if not) ───
  const hasAccessibilityNeeds = profile.accessibilityNeeds.filter(n => n !== "none").length > 0;
  let accessScore = 100;
  let accessDetails = "";

  if (hasAccessibilityNeeds) {
    const stories = snapshot?.stories ?? null;
    const isMultiStory = stories !== null && stories > 1;
    const isSingleStory = stories !== null && stories === 1;

    for (const need of profile.accessibilityNeeds) {
      if (need === "none") continue;

      if (
        (need === "wheelchair_full" || need === "wheelchair_occasional" || need === "mobility_limited" || need === "chronic_fatigue") &&
        isMultiStory
      ) {
        accessScore -= need === "wheelchair_full" ? 50 : 25;
        accessibilityFlags.push({
          need,
          label: need.replace(/_/g, " "),
          severity: need === "wheelchair_full" ? "blocker" : "concern",
          issue: stories + "-story home. " + (need === "wheelchair_full" ? "Full-time wheelchair users need single-story or elevator." : "Multi-story may be challenging."),
          recommendation: need === "wheelchair_full"
            ? "This property likely won't work without a residential elevator ($20K-$50K). Consider single-story alternatives."
            : "Check if main floor has bedroom, bathroom, kitchen, and laundry.",
        });
        suggestions.push({
          category: "ask_about",
          icon: "Accessibility",
          title: "Ask about main floor livability",
          description: "With " + need.replace(/_/g, " ") + " needs, confirm bedroom and full bathroom on main floor.",
          priority: "high",
        });
      } else if (
        (need === "wheelchair_full" || need === "wheelchair_occasional" || need === "mobility_limited") &&
        isSingleStory
      ) {
        accessibilityFlags.push({
          need,
          label: need.replace(/_/g, " "),
          severity: "manageable",
          issue: "Single-story is positive for mobility needs.",
          recommendation: 'Verify doorway widths (36"+), entry step height, and bathroom configuration.',
        });
      } else if (
        (need === "wheelchair_full" || need === "wheelchair_occasional" || need === "mobility_limited") &&
        stories === null
      ) {
        accessScore -= 15;
        accessibilityFlags.push({
          need,
          label: need.replace(/_/g, " "),
          severity: "concern",
          issue: "Number of stories unknown — cannot verify accessibility.",
          recommendation: "Confirm if single-story or has elevator access before visiting.",
        });
      }

      if (need === "sensory_sensitivity") {
        const noiseClaims = (analysis.claims || []).filter(
          (c: any) => c.category === "neighborhood_fit" && (
            c.statement.toLowerCase().includes("noise") ||
            c.statement.toLowerCase().includes("traffic") ||
            c.statement.toLowerCase().includes("highway") ||
            c.statement.toLowerCase().includes("airport")
          )
        );
        if (noiseClaims.length > 0) {
          accessScore -= 25;
          accessibilityFlags.push({
            need,
            label: "Sensory Sensitivity",
            severity: "concern",
            issue: "Potential noise concerns found in the neighborhood.",
            recommendation: "Visit at multiple times of day. Check proximity to major roads.",
          });
        }
      }

      if (need === "respiratory") {
        const oldBuild = snapshot?.yearBuilt && snapshot.yearBuilt < 1990;
        if (oldBuild) {
          accessScore -= 15;
          accessibilityFlags.push({
            need,
            label: "Respiratory Needs",
            severity: "concern",
            issue: "Built in " + snapshot?.yearBuilt + " — older homes may have ventilation issues.",
            recommendation: "Request mold inspection and air quality test. Check HVAC.",
          });
        }
      }

      if (need === "aging_in_place" && isMultiStory) {
        accessScore -= 20;
        accessibilityFlags.push({
          need,
          label: "Aging in Place",
          severity: "concern",
          issue: "Multi-story may become challenging as mobility changes.",
          recommendation: "Evaluate main-floor master suite potential.",
        });
        suggestions.push({
          category: "modify",
          icon: "Wrench",
          title: "Aging-in-place modification potential",
          description: "Get estimate for: main-floor bedroom, grab bars, walk-in shower, wider doorways.",
          priority: "medium",
        });
      }
    }

    accessDetails = accessibilityFlags.length > 0
      ? accessibilityFlags.filter(f => f.severity === "blocker").length + " blockers, " + accessibilityFlags.filter(f => f.severity === "concern").length + " concerns for accessibility."
      : "No major accessibility conflicts detected (verify during inspection).";
  } else {
    accessDetails = "No specific accessibility requirements.";
  }
  accessScore = Math.max(0, Math.min(100, accessScore));
  const accessWeight = hasAccessibilityNeeds ? 0.30 : 0.05;
  categories.push({ name: "Accessibility", score: accessScore, weight: accessWeight, details: accessDetails });

  // ─── 4. Feature Match (weight: 0.15) ─────────────────────────────
  let featureScore = 100;

  for (const feat of profile.mustHaves) {
    const status = checkFeaturePresent(feat, snapshot, analysis);
    if (status === "matched") {
      matchedFeatures.push({ feature: feat, label: featureName(feat), importance: "must_have", status: "matched", explanation: "Required feature present." });
    } else if (status === "missing") {
      featureScore -= 18;
      missedFeatures.push({ feature: feat, label: featureName(feat), importance: "must_have", status: "missing", explanation: "This must-have feature appears to be missing." });
    } else {
      featureScore -= 8;
      missedFeatures.push({ feature: feat, label: featureName(feat), importance: "must_have", status: "unknown", explanation: "Could not verify — check during visit." });
    }
  }

  for (const feat of profile.niceToHaves) {
    const status = checkFeaturePresent(feat, snapshot, analysis);
    if (status === "matched") {
      matchedFeatures.push({ feature: feat, label: featureName(feat), importance: "nice_to_have", status: "matched", explanation: "Bonus feature present!" });
    } else if (status === "missing") {
      featureScore -= 5;
      missedFeatures.push({ feature: feat, label: featureName(feat), importance: "nice_to_have", status: "missing", explanation: "Nice-to-have not present." });
    }
  }

  for (const feat of profile.dealbreakers) {
    const status = checkDealbreaker(feat, snapshot, analysis);
    if (status === "violated") {
      featureScore -= 50;
      missedFeatures.push({ feature: feat, label: featureName(feat), importance: "dealbreaker", status: "violated", explanation: "Dealbreaker triggered." });
    }
  }

  featureScore = Math.max(0, Math.min(100, featureScore));
  categories.push({ name: "Feature Match", score: featureScore, weight: 0.15, details: matchedFeatures.length + " matched, " + missedFeatures.length + " missing or flagged." });

  // ─── 5. Trust & Risk (weight: 0.10) ──────────────────────────────
  categories.push({
    name: "Trust & Risk",
    score: Math.round(analysis.trustScore),
    weight: 0.10,
    details: "Listing trust score is " + analysis.trustScore + "/100.",
  });

  // ─── 6. Lifestyle Fit (weight: remainder) ────────────────────────
  let lifestyleScore = 65;
  if (profile.situation === "multigenerational" && snapshot?.beds && snapshot.beds >= 4) {
    lifestyleScore += 15;
  }
  if (profile.situation === "retiring" && snapshot?.stories === 1) {
    lifestyleScore += 15;
  }
  if (profile.householdMembers.includes("elderly_parent")) {
    if (snapshot?.stories && snapshot.stories > 1) {
      lifestyleScore -= 20;
      suggestions.push({
        category: "ask_about",
        icon: "Users",
        title: "Elderly parent accommodations",
        description: "Verify main-floor bedroom/bathroom and proximity to medical facilities.",
        priority: "high",
      });
    } else if (snapshot?.stories === 1) {
      lifestyleScore += 10;
    }
  }
  if (profile.householdMembers.includes("family_young_kids")) {
    suggestions.push({
      category: "look_for",
      icon: "Baby",
      title: "Child safety check",
      description: "Check pool fencing, stair gates, window locks, fenced yard. Verify school district.",
      priority: "medium",
    });
  }

  lifestyleScore = Math.max(0, Math.min(100, lifestyleScore));
  const remainingWeight = 1 - (0.25 + 0.20 + accessWeight + 0.15 + 0.10);
  categories.push({ name: "Lifestyle Fit", score: lifestyleScore, weight: Math.max(0.05, remainingWeight), details: "Based on household and lifestyle preferences." });

  // ─── Weighted overall ────────────────────────────────────────────
  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
  const weightedSum = categories.reduce((sum, c) => sum + c.score * c.weight, 0);
  let overallScore = Math.round(weightedSum / totalWeight);

  // Hard caps for dealbreakers / budget
  const hasDealbreaker = missedFeatures.some(f => f.importance === "dealbreaker" && f.status === "violated");
  const hasAccessBlocker = accessibilityFlags.some(f => f.severity === "blocker");
  if (hasDealbreaker || hasAccessBlocker) {
    overallScore = Math.min(overallScore, 25);
  }

  if (effectivePrice && effectivePrice > profile.budgetStretch) {
    const pctOver = ((effectivePrice - profile.budgetStretch) / profile.budgetStretch) * 100;
    if (pctOver > 20) {
      overallScore = Math.min(overallScore, 30);
    } else if (pctOver > 10) {
      overallScore = Math.min(overallScore, 40);
    }
  }

  overallScore = Math.max(0, Math.min(100, overallScore));

  let label: FitScoreResult["label"];
  if (hasDealbreaker || hasAccessBlocker) label = "dealbreaker";
  else if (overallScore >= 75) label = "great_match";
  else if (overallScore >= 60) label = "good_match";
  else if (overallScore >= 40) label = "fair";
  else label = "poor_match";

  const summaryMap: Record<string, string> = {
    great_match: "This property is a strong match for your needs and preferences.",
    good_match: "This property is a good fit with a few areas to investigate.",
    fair: "This property partially meets your needs — review the gaps carefully.",
    poor_match: "This property has significant mismatches with your requirements.",
    dealbreaker: "This property triggers one or more dealbreakers or has critical accessibility barriers.",
  };

  if (profile.hasPets && profile.petTypes.length > 0) {
    suggestions.push({
      category: "ask_about",
      icon: "PawPrint",
      title: "Pet policy check",
      description: "You have " + profile.petTypes.join(", ") + ". " + (snapshot?.hoa ? "HOA detected — verify pet restrictions." : "No HOA, but check CC&Rs."),
      priority: "medium",
    });
  }

  return {
    overallScore,
    label,
    summary: summaryMap[label],
    breakdown: categories,
    matchedFeatures,
    missedFeatures,
    accessibilityFlags,
    suggestions,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────
const FEATURE_NAME_MAP: Record<string, string> = {
  single_story: "Single Story", elevator: "Elevator", wide_doorways: "Wide Doorways",
  accessible_bathroom: "Accessible Bathroom", roll_in_shower: "Roll-In Shower",
  no_step_entry: "No-Step Entry", garage: "Garage", yard: "Yard", pool: "Pool",
  good_schools: "Good Schools", walkable: "Walkable", near_transit: "Near Transit",
  near_medical: "Near Medical", near_grocery: "Near Grocery", quiet_street: "Quiet Street",
  low_hoa: "Low HOA", no_hoa: "No HOA", new_construction: "New Construction",
  central_ac: "Central A/C", solar: "Solar", ev_charging: "EV Charging",
  home_office: "Home Office", guest_suite: "Guest Suite", low_maintenance: "Low Maintenance",
  pet_friendly: "Pet Friendly", gated_community: "Gated", flat_lot: "Flat Lot",
  laundry_main_floor: "Main Floor Laundry",
};

function featureName(feat: string): string {
  return FEATURE_NAME_MAP[feat] || feat.replace(/_/g, " ");
}

function checkFeaturePresent(
  feat: PropertyFeature,
  snapshot: PropertySnapshot | null,
  _analysis: AnalysisData
): "matched" | "missing" | "unknown" {
  if (!snapshot) return "unknown";

  switch (feat) {
    case "single_story":
      return snapshot.stories === 1 ? "matched" : (snapshot.stories && snapshot.stories > 1) ? "missing" : "unknown";
    case "garage":
      return (snapshot.garage && snapshot.garage !== "None") ? "matched" : snapshot.garage === "None" ? "missing" : "unknown";
    case "no_hoa":
      return (snapshot.hoa === null || snapshot.hoa === 0) ? "matched" : (snapshot.hoa && snapshot.hoa > 0) ? "missing" : "unknown";
    case "low_hoa":
      return (snapshot.hoa !== null && snapshot.hoa > 0 && snapshot.hoa <= 200) ? "matched" : (snapshot.hoa !== null && snapshot.hoa > 200) ? "missing" : "unknown";
    case "new_construction":
      return (snapshot.yearBuilt && snapshot.yearBuilt >= 2020) ? "matched" : snapshot.yearBuilt ? "missing" : "unknown";
    case "yard":
      return (snapshot.lotSqft && snapshot.lotSqft > 2000) ? "matched" : (snapshot.lotSqft && snapshot.lotSqft <= 2000) ? "missing" : "unknown";
    default:
      return "unknown";
  }
}

function checkDealbreaker(
  feat: PropertyFeature,
  snapshot: PropertySnapshot | null,
  _analysis: AnalysisData
): "violated" | "clear" | "unknown" {
  if (!snapshot) return "unknown";

  switch (feat) {
    case "no_hoa":
      return (snapshot.hoa && snapshot.hoa > 0) ? "violated" : "clear";
    case "pool":
      return "unknown";
    case "single_story":
      return (snapshot.stories && snapshot.stories > 1) ? "violated" : "clear";
    default:
      return "unknown";
  }
}
