import { z } from "zod";

// ─── Scoring Categories ────────────────────────────────────────────
export const SCORING_CATEGORIES = [
  "record_mismatch",
  "pricing_anomaly",
  "ownership_title",
  "disclosure_ambiguity",
  "neighborhood_fit",
  "renovation_permit",
] as const;

export type ScoringCategory = (typeof SCORING_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ScoringCategory, string> = {
  record_mismatch: "Record Mismatch",
  pricing_anomaly: "Pricing Anomaly",
  ownership_title: "Ownership / Title",
  disclosure_ambiguity: "Disclosure Ambiguity",
  neighborhood_fit: "Neighborhood Fit",
  renovation_permit: "Renovation / Permits",
};

export const CATEGORY_ICONS: Record<ScoringCategory, string> = {
  record_mismatch: "FileWarning",
  pricing_anomaly: "DollarSign",
  ownership_title: "Shield",
  disclosure_ambiguity: "Eye",
  neighborhood_fit: "MapPin",
  renovation_permit: "Hammer",
};

// ─── Verdict types ─────────────────────────────────────────────────
export type Verdict = "verified" | "unverified" | "contradiction" | "marketing";
export type Severity = "info" | "caution" | "warning" | "critical";
export type TrustLabel = "high" | "medium" | "low" | "pending";
export type AnalysisStatus = "pending" | "analyzing" | "complete" | "error";

// ─── Zod schemas for API validation ───────────────────────────────
export const AnalyzeRequestSchema = z.object({
  address: z.string().min(5, "Enter a valid property address"),
  listingText: z.string().optional(),
  listPrice: z.number().positive().optional(),
  propertyType: z.string().optional(),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

// ─── Property Snapshot ─────────────────────────────────────────────
export interface PropertySnapshot {
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lotSqft: number | null;
  yearBuilt: number | null;
  stories: number | null;
  garage: string | null;
  hoa: number | null;
  zoning: string | null;
  taxAssessedValue: number | null;
  lastSaleDate: string | null;
  lastSalePrice: number | null;
}

// ─── Market Context ────────────────────────────────────────────────
export interface MarketContext {
  medianAreaPrice: number | null;
  pricePerSqft: number | null;
  areaMedianPpsf: number | null;
  avgDaysOnMarket: number | null;
  inventoryLevel: string | null; // "low" | "balanced" | "high"
  comparables: ComparableProperty[];
}

export interface ComparableProperty {
  address: string;
  price: number;
  sqft: number;
  beds: number;
  baths: number;
  soldDate: string;
  ppsf: number;
}

// ─── Claude API Response Shapes ────────────────────────────────────
export interface ClaudeAnalysisResponse {
  propertySnapshot: PropertySnapshot;
  marketContext: MarketContext;
  trustScore: number;
  trustLabel: TrustLabel;
  overallVerdict: string;
  claims: ClaudeClaim[];
  actionItems: ClaudeActionItem[];
}

export interface ClaudeClaim {
  category: ScoringCategory;
  statement: string;
  source: "listing" | "public_record" | "inference";
  verdict: Verdict;
  confidence: number;
  explanation: string;
  severity: Severity;
  evidence: ClaudeEvidence[];
}

export interface ClaudeEvidence {
  type: "supports" | "contradicts" | "neutral";
  source: string;
  description: string;
  dataPoint?: string;
}

export interface ClaudeActionItem {
  category: "question" | "document" | "inspection";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  relatedClaimCategories: string[];
}

// ─── Frontend display types ────────────────────────────────────────
export interface AnalysisSummary {
  id: string;
  address: string;
  trustScore: number;
  trustLabel: TrustLabel;
  status: AnalysisStatus;
  claimCount: number;
  contradictionCount: number;
  createdAt: string;
}

export interface CategoryBreakdown {
  category: ScoringCategory;
  label: string;
  claimCount: number;
  contradictionCount: number;
  avgConfidence: number;
  riskLevel: Severity;
}
