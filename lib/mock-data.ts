/**
 * Mock data for demo/hackathon purposes.
 * Two fully fleshed-out example properties:
 *  1. A suspiciously good deal in Irvine (low trust score)
 *  2. A well-documented home in Costa Mesa (high trust score)
 */

import type { ClaudeAnalysisResponse } from "@/types";

// ─── Property 1: Suspicious listing in Irvine ─────────────────────
const irvineProperty: ClaudeAnalysisResponse = {
  propertySnapshot: {
    beds: 4,
    baths: 3,
    sqft: 2450,
    lotSqft: 6200,
    yearBuilt: 1998,
    stories: 2,
    garage: "2-car attached",
    hoa: 285,
    zoning: "Residential (R-1)",
    taxAssessedValue: 875000,
    lastSaleDate: "2021-03-15",
    lastSalePrice: 920000,
  },
  marketContext: {
    medianAreaPrice: 1350000,
    pricePerSqft: 449,
    areaMedianPpsf: 551,
    avgDaysOnMarket: 18,
    inventoryLevel: "low",
    comparables: [
      { address: "14 Daybreak, Irvine CA", price: 1380000, sqft: 2500, beds: 4, baths: 3, soldDate: "2024-09-20", ppsf: 552 },
      { address: "22 Nighthawk, Irvine CA", price: 1290000, sqft: 2300, beds: 4, baths: 2.5, soldDate: "2024-10-05", ppsf: 561 },
      { address: "8 Sundance, Irvine CA", price: 1425000, sqft: 2600, beds: 4, baths: 3, soldDate: "2024-08-12", ppsf: 548 },
      { address: "31 Trailside, Irvine CA", price: 1310000, sqft: 2400, beds: 3, baths: 2.5, soldDate: "2024-11-01", ppsf: 546 },
    ],
  },
  trustScore: 42,
  trustLabel: "low",
  overallVerdict:
    "This listing contains multiple red flags including a price significantly below market, unverified renovation claims, and a recent ownership transfer that warrants title investigation. Proceed with heightened due diligence.",
  claims: [
    {
      category: "pricing_anomaly",
      statement: "Listed at $1,100,000 — approximately 18% below comparable sales in the area",
      source: "inference",
      verdict: "contradiction",
      confidence: 0.88,
      explanation:
        "Comparable homes within 0.5 miles sold between $1.29M–$1.43M in the last 90 days. A discount this steep in Irvine's low-inventory market is unusual and may indicate undisclosed issues.",
      severity: "critical",
      evidence: [
        { type: "contradicts", source: "comparable_sales", description: "Four recent comps average $1,351,250 — listing is $251K below", dataPoint: "$1,100,000 vs $1,351,250 avg" },
        { type: "contradicts", source: "market_analysis", description: "Irvine inventory is at historic lows with homes selling above ask", dataPoint: "18 avg DOM" },
      ],
    },
    {
      category: "record_mismatch",
      statement: 'Listing claims "2,650 sq ft of living space"',
      source: "listing",
      verdict: "contradiction",
      confidence: 0.82,
      explanation:
        "County tax records show 2,450 sq ft. The 200 sq ft discrepancy could indicate an unpermitted addition or an inflated listing measurement.",
      severity: "warning",
      evidence: [
        { type: "contradicts", source: "county_records", description: "Tax assessor records show 2,450 sq ft gross living area", dataPoint: "2,450 sqft" },
        { type: "neutral", source: "inference", description: "200 sqft difference may be a converted garage or enclosed patio not in records" },
      ],
    },
    {
      category: "renovation_permit",
      statement: 'Listing describes "completely remodeled kitchen with premium finishes"',
      source: "listing",
      verdict: "unverified",
      confidence: 0.45,
      explanation:
        "No building permits for kitchen renovation found in city records since the 2021 sale. Significant remodels typically require permits for electrical, plumbing, and structural work.",
      severity: "warning",
      evidence: [
        { type: "contradicts", source: "city_permits", description: "No permits pulled for this address since 2019", dataPoint: "0 permits since 2019" },
        { type: "neutral", source: "inference", description: "Cosmetic updates (paint, hardware) may not require permits but 'completely remodeled' implies more" },
      ],
    },
    {
      category: "ownership_title",
      statement: "Property changed hands twice in the last 3 years",
      source: "public_record",
      verdict: "unverified",
      confidence: 0.72,
      explanation:
        "Rapid ownership turnover can be normal but combined with the below-market price, it raises questions about potential title issues, liens, or flipping with minimal investment.",
      severity: "caution",
      evidence: [
        { type: "supports", source: "title_records", description: "Sold March 2021 for $920K, current owner acquired via quitclaim deed in 2023", dataPoint: "Quitclaim deed 2023" },
        { type: "contradicts", source: "inference", description: "Quitclaim deeds bypass warranty protections — unusual for arm's-length transactions" },
      ],
    },
    {
      category: "disclosure_ambiguity",
      statement: 'Listing says "sold as-is"',
      source: "listing",
      verdict: "unverified",
      confidence: 0.65,
      explanation:
        "As-is sales are legal but the phrase often signals the seller is aware of issues they don't want to repair or formally disclose. California law still requires material defect disclosure.",
      severity: "warning",
      evidence: [
        { type: "neutral", source: "legal_context", description: "CA Civil Code §1102 still requires Transfer Disclosure Statement even in as-is sales" },
        { type: "contradicts", source: "inference", description: "Combined with below-market pricing, as-is suggests potential undisclosed defects" },
      ],
    },
    {
      category: "neighborhood_fit",
      statement: "Property is marketed as 'quiet cul-de-sac location'",
      source: "listing",
      verdict: "marketing",
      confidence: 0.55,
      explanation:
        "While the street does end in a cul-de-sac, the property backs up to Jeffrey Road, a major 4-lane arterial. Noise levels may be significantly higher than implied.",
      severity: "caution",
      evidence: [
        { type: "supports", source: "map_data", description: "Street layout confirms cul-de-sac", dataPoint: "Cul-de-sac confirmed" },
        { type: "contradicts", source: "map_data", description: "Rear property line is ~80ft from Jeffrey Rd (4 lanes, 45mph)", dataPoint: "80ft from arterial" },
      ],
    },
    {
      category: "record_mismatch",
      statement: 'Listing claims "4 bedrooms, 3 full bathrooms"',
      source: "listing",
      verdict: "verified",
      confidence: 0.91,
      explanation: "Bedroom and bathroom count matches county tax assessor records.",
      severity: "info",
      evidence: [
        { type: "supports", source: "county_records", description: "Tax records show 4BR/3BA", dataPoint: "4 bed / 3 bath" },
      ],
    },
    {
      category: "pricing_anomaly",
      statement: "Tax assessed value is $875,000 — significantly below list price",
      source: "public_record",
      verdict: "verified",
      confidence: 0.85,
      explanation:
        "CA Prop 13 keeps assessed values below market. The assessed value reflects purchase basis plus max 2% annual increases, not current market value.",
      severity: "info",
      evidence: [
        { type: "supports", source: "county_records", description: "Assessed at $875K based on 2021 purchase of $920K with Prop 13 adjustments", dataPoint: "$875,000 assessed" },
      ],
    },
    {
      category: "renovation_permit",
      statement: 'Listing mentions "brand new HVAC system"',
      source: "listing",
      verdict: "unverified",
      confidence: 0.5,
      explanation:
        "HVAC replacement typically requires a mechanical permit. No HVAC permits found in city records. The system may have been replaced without proper permitting.",
      severity: "caution",
      evidence: [
        { type: "contradicts", source: "city_permits", description: "No mechanical permits found for this address", dataPoint: "No HVAC permits" },
      ],
    },
    {
      category: "disclosure_ambiguity",
      statement: "No mention of natural hazard zone status in listing",
      source: "inference",
      verdict: "unverified",
      confidence: 0.6,
      explanation:
        "Parts of Irvine are in liquefaction and fire hazard zones. Sellers must provide a Natural Hazard Disclosure report. The listing omitting this isn't necessarily a problem, but buyers should request the NHD report.",
      severity: "caution",
      evidence: [
        { type: "neutral", source: "hazard_maps", description: "Address may be in a liquefaction zone based on general Irvine geological maps" },
      ],
    },
  ],
  actionItems: [
    {
      category: "document",
      priority: "critical",
      title: "Request preliminary title report",
      description: "Given the quitclaim deed transfer in 2023 and rapid ownership changes, a full title search is essential to uncover liens, easements, or encumbrances.",
      relatedClaimCategories: ["ownership_title"],
    },
    {
      category: "document",
      priority: "critical",
      title: "Demand Transfer Disclosure Statement (TDS)",
      description: "California law requires this even for as-is sales. Ask the seller's agent for the TDS, SPQ, and any inspection reports they have.",
      relatedClaimCategories: ["disclosure_ambiguity"],
    },
    {
      category: "inspection",
      priority: "critical",
      title: "Full home inspection with permit verification",
      description: "Hire an inspector to measure actual square footage and check for unpermitted work, especially the kitchen remodel and HVAC system.",
      relatedClaimCategories: ["record_mismatch", "renovation_permit"],
    },
    {
      category: "question",
      priority: "high",
      title: "Ask seller: Why is the price 18% below comps?",
      description: "Request a written explanation for the below-market pricing. Legitimate reasons include motivated seller timeline, estate sale, or known repair needs.",
      relatedClaimCategories: ["pricing_anomaly"],
    },
    {
      category: "document",
      priority: "high",
      title: "Pull city building permits for last 10 years",
      description: "Visit the City of Irvine building department or online portal to check all permits pulled for this address. Compare against claimed renovations.",
      relatedClaimCategories: ["renovation_permit"],
    },
    {
      category: "inspection",
      priority: "high",
      title: "Noise assessment at different times of day",
      description: "Visit the property during rush hour (7-9am, 4-7pm) to assess traffic noise from the nearby arterial road.",
      relatedClaimCategories: ["neighborhood_fit"],
    },
    {
      category: "question",
      priority: "medium",
      title: "Ask about the 2023 quitclaim deed transfer",
      description: "Quitclaim deeds are common between family members or business entities, but unusual for market transactions. Ask the seller to explain the ownership history.",
      relatedClaimCategories: ["ownership_title"],
    },
    {
      category: "document",
      priority: "medium",
      title: "Request Natural Hazard Disclosure (NHD) report",
      description: "Verify the property's status in flood, fire, earthquake, and liquefaction zones. This is legally required before closing.",
      relatedClaimCategories: ["disclosure_ambiguity"],
    },
  ],
};

// ─── Property 2: Well-documented home in Costa Mesa ────────────────
const costaMesaProperty: ClaudeAnalysisResponse = {
  propertySnapshot: {
    beds: 3,
    baths: 2,
    sqft: 1680,
    lotSqft: 5800,
    yearBuilt: 1965,
    stories: 1,
    garage: "2-car detached",
    hoa: 0,
    zoning: "Residential (R-1)",
    taxAssessedValue: 650000,
    lastSaleDate: "2018-06-20",
    lastSalePrice: 725000,
  },
  marketContext: {
    medianAreaPrice: 1100000,
    pricePerSqft: 625,
    areaMedianPpsf: 595,
    avgDaysOnMarket: 24,
    inventoryLevel: "balanced",
    comparables: [
      { address: "445 Magnolia St, Costa Mesa CA", price: 1075000, sqft: 1600, beds: 3, baths: 2, soldDate: "2024-10-15", ppsf: 672 },
      { address: "812 Baja Ct, Costa Mesa CA", price: 1125000, sqft: 1750, beds: 3, baths: 2, soldDate: "2024-09-28", ppsf: 643 },
      { address: "330 E 18th St, Costa Mesa CA", price: 1050000, sqft: 1580, beds: 3, baths: 2, soldDate: "2024-11-03", ppsf: 665 },
    ],
  },
  trustScore: 84,
  trustLabel: "high",
  overallVerdict:
    "This listing is largely consistent with public records and market norms. The property is fairly priced with well-documented improvements. A few standard verification items remain for buyer due diligence.",
  claims: [
    {
      category: "record_mismatch",
      statement: 'Listing claims "3 bed / 2 bath, 1,680 sq ft"',
      source: "listing",
      verdict: "verified",
      confidence: 0.95,
      explanation: "Property details match county tax assessor records exactly.",
      severity: "info",
      evidence: [
        { type: "supports", source: "county_records", description: "Tax records confirm 3BR/2BA, 1,680 sqft", dataPoint: "3/2, 1680 sqft" },
      ],
    },
    {
      category: "pricing_anomaly",
      statement: "Listed at $1,050,000 — in line with comparable sales",
      source: "inference",
      verdict: "verified",
      confidence: 0.87,
      explanation: "Price per square foot of $625 is within 5% of area median $595/sqft, accounting for the permitted renovations that add value.",
      severity: "info",
      evidence: [
        { type: "supports", source: "comparable_sales", description: "Three recent comps average $1,083,333", dataPoint: "$1,050,000 vs $1,083K avg" },
        { type: "supports", source: "market_analysis", description: "Slight premium over median PPSF justified by renovated condition", dataPoint: "$625 vs $595 median ppsf" },
      ],
    },
    {
      category: "renovation_permit",
      statement: 'Listing describes "permitted kitchen and bathroom remodel completed 2022"',
      source: "listing",
      verdict: "verified",
      confidence: 0.88,
      explanation: "City of Costa Mesa records show building permits pulled in January 2022 for kitchen and bathroom renovation, with final inspection passed in May 2022.",
      severity: "info",
      evidence: [
        { type: "supports", source: "city_permits", description: "Permit #B2022-0142 for kitchen/bath remodel, finaled May 2022", dataPoint: "Permit finaled 05/2022" },
      ],
    },
    {
      category: "ownership_title",
      statement: "Single owner since 2018 with standard grant deed",
      source: "public_record",
      verdict: "verified",
      confidence: 0.92,
      explanation: "Clean ownership chain with a standard grant deed. No quitclaim transfers or unusual activity.",
      severity: "info",
      evidence: [
        { type: "supports", source: "title_records", description: "Grant deed recorded June 2018, no subsequent transfers", dataPoint: "Single owner since 2018" },
      ],
    },
    {
      category: "disclosure_ambiguity",
      statement: "Listing mentions 'roof replaced 2020' but no warranty details",
      source: "listing",
      verdict: "unverified",
      confidence: 0.6,
      explanation: "While the roof age claim seems reasonable given a 1965 home, no permit or contractor warranty documentation was referenced. Buyer should verify.",
      severity: "caution",
      evidence: [
        { type: "neutral", source: "city_permits", description: "Roof permits not always required for like-for-like replacement in Costa Mesa" },
        { type: "neutral", source: "inference", description: "A 1965 home would reasonably need roof replacement; claim is plausible" },
      ],
    },
    {
      category: "neighborhood_fit",
      statement: 'Listed as "walkable Eastside Costa Mesa location"',
      source: "listing",
      verdict: "verified",
      confidence: 0.78,
      explanation: "The Eastside area near 17th Street has a Walk Score of 72 and is near shops, restaurants, and parks. 'Walkable' is a fair characterization.",
      severity: "info",
      evidence: [
        { type: "supports", source: "walk_score", description: "Walk Score of 72 — 'Very Walkable'", dataPoint: "Walk Score 72" },
        { type: "supports", source: "map_data", description: "Within 0.5 miles of 17th Street commercial corridor" },
      ],
    },
    {
      category: "record_mismatch",
      statement: "Year built listed as 1965 in both listing and records",
      source: "listing",
      verdict: "verified",
      confidence: 0.97,
      explanation: "Year built is consistent across all sources.",
      severity: "info",
      evidence: [
        { type: "supports", source: "county_records", description: "Original construction date 1965", dataPoint: "1965" },
      ],
    },
    {
      category: "disclosure_ambiguity",
      statement: "No mention of lead paint disclosure for pre-1978 home",
      source: "inference",
      verdict: "unverified",
      confidence: 0.7,
      explanation: "Federal law requires lead paint disclosure for homes built before 1978. This should be part of the transaction but wasn't mentioned in the listing.",
      severity: "caution",
      evidence: [
        { type: "neutral", source: "legal_context", description: "Required by federal law but typically handled during escrow, not in listings" },
      ],
    },
  ],
  actionItems: [
    {
      category: "document",
      priority: "high",
      title: "Request roof warranty and contractor details",
      description: "Ask for the roofing contractor's name, warranty documentation, and any before/after photos from the 2020 replacement.",
      relatedClaimCategories: ["disclosure_ambiguity"],
    },
    {
      category: "document",
      priority: "medium",
      title: "Verify permit final for kitchen/bath remodel",
      description: "Confirm permit #B2022-0142 was properly finaled with the City of Costa Mesa building department.",
      relatedClaimCategories: ["renovation_permit"],
    },
    {
      category: "inspection",
      priority: "high",
      title: "Standard home inspection for 1965 construction",
      description: "Older homes may have galvanized plumbing, knob-and-tube wiring, or foundation settling. A thorough inspection is standard due diligence.",
      relatedClaimCategories: ["record_mismatch"],
    },
    {
      category: "document",
      priority: "medium",
      title: "Request lead paint disclosure form",
      description: "Ensure the seller provides the federally required lead-based paint disclosure for this pre-1978 home.",
      relatedClaimCategories: ["disclosure_ambiguity"],
    },
    {
      category: "question",
      priority: "low",
      title: "Ask about original vs. replaced systems",
      description: "Clarify which major systems (plumbing, electrical, HVAC) are original 1965 and which have been updated.",
      relatedClaimCategories: ["renovation_permit"],
    },
    {
      category: "inspection",
      priority: "medium",
      title: "Sewer line scope for older home",
      description: "1965 homes often have original clay sewer laterals. A sewer scope can reveal root intrusion, bellying, or cracks.",
      relatedClaimCategories: ["renovation_permit"],
    },
  ],
};

// ─── Lookup helper ─────────────────────────────────────────────────
export function getMockAnalysis(address: string): ClaudeAnalysisResponse {
  const lower = address.toLowerCase();
  if (lower.includes("costa mesa") || lower.includes("eastside")) {
    return costaMesaProperty;
  }
  // Default to the suspicious Irvine property
  return irvineProperty;
}

// Export both for seeding
export const MOCK_PROPERTIES = {
  irvine: {
    address: "42 Shadowridge, Irvine, CA 92618",
    listingText: `Stunning 4BR/3BA home in desirable Irvine neighborhood! 2,650 sq ft of living space on a quiet cul-de-sac. Completely remodeled kitchen with premium finishes, brand new HVAC system, and freshly landscaped yard. Sold as-is — incredible value at $1,100,000. Don't miss this rare opportunity in Irvine's competitive market!`,
    listPrice: 1100000,
    propertyType: "Single Family Residence",
    analysis: irvineProperty,
  },
  costaMesa: {
    address: "518 Jasmine Ave, Costa Mesa, CA 92627",
    listingText: `Charming 3 bed / 2 bath single-story home in walkable Eastside Costa Mesa. 1,680 sq ft with permitted kitchen and bathroom remodel completed 2022. Roof replaced 2020. Original hardwood floors refinished. Detached 2-car garage with laundry hookups. Close to 17th Street shops and dining. Listed at $1,050,000.`,
    listPrice: 1050000,
    propertyType: "Single Family Residence",
    analysis: costaMesaProperty,
  },
};
