/**
 * types/buyer-profile.ts
 *
 * Buyer Match Profile — types, enums, and Zod schemas.
 * Covers personal situation, accessibility/disability needs,
 * budget, lifestyle, and dealbreakers.
 *
 * DROP-IN: import from "@/types/buyer-profile"
 */

import { z } from "zod";

// ─── Buyer Situation ───────────────────────────────────────────────
export const BUYER_SITUATIONS = [
  "first_time",
  "upgrading",
  "downsizing",
  "investor",
  "relocating",
  "retiring",
  "multigenerational", // living with elderly parents or extended family
] as const;

export type BuyerSituation = (typeof BUYER_SITUATIONS)[number];

export const BUYER_SITUATION_LABELS: Record<BuyerSituation, string> = {
  first_time: "First-Time Buyer",
  upgrading: "Upgrading Home",
  downsizing: "Downsizing",
  investor: "Investor / Rental",
  relocating: "Relocating",
  retiring: "Retiring",
  multigenerational: "Multi-Generational Living",
};

// ─── Household Members ─────────────────────────────────────────────
export const HOUSEHOLD_MEMBERS = [
  "solo",
  "couple",
  "family_young_kids",
  "family_teens",
  "elderly_parent",
  "roommates",
  "caregiver_present",
] as const;

export type HouseholdMember = (typeof HOUSEHOLD_MEMBERS)[number];

export const HOUSEHOLD_LABELS: Record<HouseholdMember, string> = {
  solo: "Living Alone",
  couple: "With Partner",
  family_young_kids: "Family (Young Children)",
  family_teens: "Family (Teenagers)",
  elderly_parent: "Aging Parent(s)",
  roommates: "With Roommates",
  caregiver_present: "Live-In Caregiver",
};

// ─── Accessibility & Disability Needs ──────────────────────────────
// This is the core differentiator. We model specific needs, not labels.
export const ACCESSIBILITY_NEEDS = [
  "wheelchair_full",       // full-time wheelchair user
  "wheelchair_occasional", // sometimes uses wheelchair/scooter
  "mobility_limited",      // walker, cane, difficulty with stairs
  "visual_impairment",     // low vision or blind
  "hearing_impairment",    // deaf or hard of hearing
  "sensory_sensitivity",   // autism, SPD — sensitive to noise/light/crowds
  "chronic_fatigue",       // fibromyalgia, ME/CFS, lupus — needs low-effort layout
  "respiratory",           // asthma, COPD — air quality & ventilation matter
  "cognitive",             // TBI, dementia, developmental — needs simple safe layout
  "child_disability",      // child with disability in household
  "temporary_injury",      // recovering from surgery, broken limb, etc.
  "aging_in_place",        // planning to stay long-term as mobility changes
  "none",                  // no accessibility needs
] as const;

export type AccessibilityNeed = (typeof ACCESSIBILITY_NEEDS)[number];

export const ACCESSIBILITY_LABELS: Record<AccessibilityNeed, string> = {
  wheelchair_full: "Full-Time Wheelchair / Power Chair",
  wheelchair_occasional: "Part-Time Wheelchair / Scooter",
  mobility_limited: "Mobility Aid (Walker, Cane, Difficulty with Stairs)",
  visual_impairment: "Visual Impairment (Low Vision / Blind)",
  hearing_impairment: "Hearing Impairment (Deaf / Hard of Hearing)",
  sensory_sensitivity: "Sensory Sensitivity (Noise, Light, Crowds)",
  chronic_fatigue: "Chronic Fatigue / Energy-Limiting Condition",
  respiratory: "Respiratory (Asthma, COPD)",
  cognitive: "Cognitive / Memory Support Needs",
  child_disability: "Child with Disability in Household",
  temporary_injury: "Temporary Injury / Recovery",
  aging_in_place: "Planning to Age in Place",
  none: "No Specific Accessibility Needs",
};

// What each accessibility need translates to in property requirements
export const ACCESSIBILITY_PROPERTY_REQS: Record<AccessibilityNeed, string[]> = {
  wheelchair_full: [
    "Single story or elevator access",
    "Wide doorways (36\"+ clear)",
    "Roll-in shower or adaptable bathroom",
    "Accessible kitchen counter heights",
    "No-step entry / ramp access",
    "Accessible garage with clearance",
    "Proximity to accessible transit",
  ],
  wheelchair_occasional: [
    "Single story preferred or elevator",
    "Wide hallways and doorways",
    "Minimal steps at entry (1-2 max with ramp potential)",
    "At least one accessible bathroom on main floor",
  ],
  mobility_limited: [
    "Few or no stairs (single story ideal)",
    "Grab bar-ready bathrooms",
    "Walk-in shower or tub with low threshold",
    "Well-lit pathways, minimal tripping hazards",
    "Close parking to entry",
  ],
  visual_impairment: [
    "Well-lit interior and exterior",
    "Simple, predictable floor plan",
    "Proximity to public transit",
    "Walkable neighborhood (safe pedestrian infrastructure)",
    "Minimal level changes between rooms",
  ],
  hearing_impairment: [
    "Visual doorbell / alert systems installable",
    "Open floor plan for line-of-sight",
    "Good natural lighting for sign language",
    "Proximity to deaf community resources (if desired)",
  ],
  sensory_sensitivity: [
    "Quiet neighborhood (away from highways, airports, bars)",
    "Good sound insulation between rooms",
    "Not adjacent to commercial or high-traffic areas",
    "Private outdoor space (enclosed yard)",
    "Ability to control lighting (no mandatory shared lighting)",
  ],
  chronic_fatigue: [
    "Single story preferred",
    "Low-maintenance yard or HOA-maintained landscaping",
    "Short distance from parking to door",
    "Laundry on main floor",
    "Nearby essential services (grocery, pharmacy)",
  ],
  respiratory: [
    "Good ventilation / modern HVAC",
    "Away from freeways and industrial zones",
    "No mold history",
    "Central air with filtration",
    "Not in high wildfire smoke area",
  ],
  cognitive: [
    "Simple, predictable layout",
    "Secure perimeter (fenced yard, lockable gates)",
    "Quiet, low-stimulation neighborhood",
    "Proximity to care facilities",
    "Safe kitchen layout",
  ],
  child_disability: [
    "Accessible bedroom and bathroom on main floor",
    "Safe, enclosed outdoor play area",
    "Proximity to specialized schools and therapy centers",
    "Wide doorways for equipment",
    "Low-allergen materials if respiratory issues",
  ],
  temporary_injury: [
    "Main floor bedroom and bathroom available",
    "Minimal stairs during recovery",
    "Accessible shower",
    "Close parking",
  ],
  aging_in_place: [
    "Single story or main-floor master suite",
    "Bathroom adaptable for grab bars",
    "Wide doorways (future wheelchair possibility)",
    "Low-maintenance exterior",
    "Near medical facilities",
    "Good neighborhood walkability",
  ],
  none: [],
};

// ─── Must-Haves & Dealbreakers ─────────────────────────────────────
export const PROPERTY_FEATURES = [
  "single_story",
  "elevator",
  "wide_doorways",
  "accessible_bathroom",
  "roll_in_shower",
  "no_step_entry",
  "garage",
  "yard",
  "pool",
  "good_schools",
  "walkable",
  "near_transit",
  "near_medical",
  "near_grocery",
  "quiet_street",
  "low_hoa",
  "no_hoa",
  "new_construction",
  "central_ac",
  "solar",
  "ev_charging",
  "home_office",
  "guest_suite",
  "low_maintenance",
  "pet_friendly",
  "gated_community",
  "flat_lot",
  "laundry_main_floor",
] as const;

export type PropertyFeature = (typeof PROPERTY_FEATURES)[number];

export const FEATURE_LABELS: Record<PropertyFeature, string> = {
  single_story: "Single Story",
  elevator: "Elevator Access",
  wide_doorways: "Wide Doorways (36\"+)",
  accessible_bathroom: "Accessible Bathroom",
  roll_in_shower: "Roll-In Shower",
  no_step_entry: "No-Step Entry",
  garage: "Garage",
  yard: "Private Yard",
  pool: "Pool",
  good_schools: "Good School District",
  walkable: "Walkable Area",
  near_transit: "Near Public Transit",
  near_medical: "Near Medical Facilities",
  near_grocery: "Near Grocery / Essentials",
  quiet_street: "Quiet Street",
  low_hoa: "Low HOA (<$200/mo)",
  no_hoa: "No HOA",
  new_construction: "New Construction",
  central_ac: "Central A/C",
  solar: "Solar Panels",
  ev_charging: "EV Charging",
  home_office: "Dedicated Home Office",
  guest_suite: "Guest / In-Law Suite",
  low_maintenance: "Low-Maintenance Property",
  pet_friendly: "Pet-Friendly",
  gated_community: "Gated Community",
  flat_lot: "Flat Lot (No Hillside)",
  laundry_main_floor: "Laundry on Main Floor",
};

// ─── Commute & Lifestyle ───────────────────────────────────────────
export const COMMUTE_MODES = [
  "driving",
  "transit",
  "biking",
  "walking",
  "remote",
  "wheelchair_accessible_transit",
] as const;

export type CommuteMode = (typeof COMMUTE_MODES)[number];

// ─── The Full Buyer Profile ────────────────────────────────────────
export interface BuyerProfile {
  id?: string;

  // Step 1: Who you are
  situation: BuyerSituation;
  householdMembers: HouseholdMember[];
  householdSize: number;

  // Step 2: Accessibility & disability needs
  accessibilityNeeds: AccessibilityNeed[];
  accessibilityNotes: string; // free-text for anything we didn't cover

  // Step 3: Budget
  budgetMin: number;
  budgetMax: number;
  budgetStretch: number; // absolute max if the place is perfect
  monthlyPaymentMax: number; // max comfortable monthly housing cost

  // Step 4: Must-haves, nice-to-haves, dealbreakers
  mustHaves: PropertyFeature[];
  niceToHaves: PropertyFeature[];
  dealbreakers: PropertyFeature[]; // inverted — these features MUST NOT be present, or their absence is required

  // Step 5: Lifestyle
  commuteDestination: string;
  commuteMode: CommuteMode;
  maxCommuteMinutes: number;
  bedsMin: number;
  bathsMin: number;
  sqftMin: number;
  prioritizeOutdoorSpace: boolean;
  hasPets: boolean;
  petTypes: string[];
}

// ─── Zod schema for API validation ─────────────────────────────────
export const BuyerProfileSchema = z.object({
  situation: z.enum(BUYER_SITUATIONS),
  householdMembers: z.array(z.enum(HOUSEHOLD_MEMBERS)),
  householdSize: z.number().min(1).max(20),
  accessibilityNeeds: z.array(z.enum(ACCESSIBILITY_NEEDS)),
  accessibilityNotes: z.string().max(500).default(""),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
  budgetStretch: z.number().min(0),
  monthlyPaymentMax: z.number().min(0),
  mustHaves: z.array(z.enum(PROPERTY_FEATURES)),
  niceToHaves: z.array(z.enum(PROPERTY_FEATURES)),
  dealbreakers: z.array(z.enum(PROPERTY_FEATURES)),
  commuteDestination: z.string().default(""),
  commuteMode: z.enum(COMMUTE_MODES).default("driving"),
  maxCommuteMinutes: z.number().min(0).max(180).default(45),
  bedsMin: z.number().min(0).max(10).default(2),
  bathsMin: z.number().min(0).max(10).default(1),
  sqftMin: z.number().min(0).default(0),
  prioritizeOutdoorSpace: z.boolean().default(false),
  hasPets: z.boolean().default(false),
  petTypes: z.array(z.string()).default([]),
});

export type BuyerProfileInput = z.infer<typeof BuyerProfileSchema>;

// ─── Fit Score Result ──────────────────────────────────────────────
export interface FitScoreResult {
  overallScore: number; // 0–100
  label: "great_match" | "good_match" | "fair" | "poor_match" | "dealbreaker";
  summary: string;
  breakdown: FitCategory[];
  matchedFeatures: FitFeatureMatch[];
  missedFeatures: FitFeatureMatch[];
  accessibilityFlags: AccessibilityFlag[];
  suggestions: PropertySuggestion[];
}

export interface FitCategory {
  name: string;
  score: number; // 0–100
  weight: number; // how much it matters (0–1)
  details: string;
}

export interface FitFeatureMatch {
  feature: string;
  label: string;
  importance: "must_have" | "nice_to_have" | "dealbreaker";
  status: "matched" | "missing" | "unknown" | "violated";
  explanation: string;
}

export interface AccessibilityFlag {
  need: AccessibilityNeed;
  label: string;
  severity: "blocker" | "concern" | "manageable" | "clear";
  issue: string;
  recommendation: string;
}

export interface PropertySuggestion {
  category: "look_for" | "watch_out" | "ask_about" | "modify";
  icon: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}
