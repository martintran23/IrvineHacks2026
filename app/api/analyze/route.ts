/**
 * POST /api/analyze
 *
 * Accepts a property address + optional listing text,
 * runs Claude analysis, persists results to DB, returns the analysis ID.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeProperty } from "@/lib/claude";
import { AnalyzeRequestSchema, type PropertySnapshot } from "@/types";
import { fetchPropertyData } from "@/lib/property-data";
import { scrapeZillowListing } from "@/lib/zillow-scraper";

/**
 * Merge Claude's inferred snapshot with Realie's ground truth.
 * Realie data takes priority for concrete fields (beds, baths, sqft, etc.).
 * Claude fills in fields Realie doesn't have (hoa, zoning inference, etc.).
 */
function mergeSnapshots(
  realie: PropertySnapshot | null | undefined,
  claude: PropertySnapshot | null | undefined
): PropertySnapshot | null {
  if (!realie && !claude) return null;
  const r = realie ?? ({} as Partial<PropertySnapshot>);
  const c = claude ?? ({} as Partial<PropertySnapshot>);

  return {
    beds: r.beds ?? c.beds ?? null,
    baths: r.baths ?? c.baths ?? null,
    sqft: r.sqft ?? c.sqft ?? null,
    lotSqft: r.lotSqft ?? c.lotSqft ?? null,
    yearBuilt: r.yearBuilt ?? c.yearBuilt ?? null,
    stories: r.stories ?? c.stories ?? null,
    garage: r.garage ?? c.garage ?? null,
    hoa: r.hoa ?? c.hoa ?? null,
    zoning: r.zoning ?? c.zoning ?? null,
    taxAssessedValue: r.taxAssessedValue ?? c.taxAssessedValue ?? null,
    lastSaleDate: r.lastSaleDate ?? c.lastSaleDate ?? null,
    lastSalePrice: r.lastSalePrice ?? c.lastSalePrice ?? null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = AnalyzeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { address, listingText, listPrice, propertyType } = parsed.data;
    
    // Extract buyer profile (optional, not in Zod schema)
    const buyerProfile = body.buyerProfile || null;

    // 1. Create a pending analysis record
    const analysis = await prisma.propertyAnalysis.create({
      data: {
        address,
        listingText: listingText ?? null,
        listPrice: listPrice ?? null,
        propertyType: propertyType ?? null,
        status: "analyzing",
      },
    });

    // 2. Fetch external property data (Realie) for ground truth
    const realieData = await fetchPropertyData(address);
    console.log(`[API] Realie data fetched: snapshot=${!!realieData.snapshot}, estimatedValue=${realieData.estimatedValue}, type=${realieData.propertyType}`);

<<<<<<< HEAD
    // 3. Scrape Zillow for listing price and snippet (may be blocked or fail)
    const zillowResult = await scrapeZillowListing(address);
    const zillowData =
      zillowResult.status === "ok" && (zillowResult.listPrice ?? zillowResult.listingText)
        ? {
            listPrice: zillowResult.listPrice ?? undefined,
            listingText: zillowResult.listingText ?? undefined,
            zillowUrl: zillowResult.zillowUrl ?? undefined,
          }
        : null;
    if (zillowResult.status === "blocked") {
      console.log("[API] Zillow unavailable (blocked/rate-limited). Using Realie + user list price.");
    }

    // Effective price: user > Zillow scraped > Realie last sale
    const effectiveListPrice =
      listPrice ?? zillowData?.listPrice ?? realieData.snapshot?.lastSalePrice ?? null;
    const effectiveListingText = listingText ?? zillowData?.listingText ?? undefined;

    // 4. Run Claude analysis (Realie + Zillow scraped data)
=======
    // 2b. Use Realie estimated value as listPrice if user didn't provide one
    const effectiveListPrice = listPrice ?? realieData.estimatedValue ?? null;
    const effectivePropertyType = propertyType ?? realieData.propertyType ?? null;

    // 3. Run Claude analysis
>>>>>>> origin/fix/fit-score-and-snapshot-data
    let result;
    try {
      console.log(`[API] Starting analysis for: ${address} (price: ${effectiveListPrice}, type: ${effectivePropertyType})`);
      result = await analyzeProperty({
        address,
<<<<<<< HEAD
        listingText: effectiveListingText,
        listPrice: effectiveListPrice ?? undefined,
        propertyType,
        snapshotFromApi: realieData.snapshot,
        comparablesFromApi: realieData.comparables,
        zillowScraped: zillowData,
=======
        listingText,
        listPrice: effectiveListPrice ?? undefined,
        propertyType: effectivePropertyType ?? undefined,
        snapshotFromApi: realieData.snapshot,
        comparablesFromApi: realieData.comparables,
        buyerProfile,
>>>>>>> origin/fix/fit-score-and-snapshot-data
      });
      console.log(`[API] Analysis complete — Trust: ${result.trustScore}, Claims: ${result.claims.length}`);
    } catch (err: any) {
      const message =
        err?.message ??
        err?.error?.message ??
        (typeof err?.error === "string" ? err.error : null) ??
        "Unknown error";
      console.error(`[API] Analysis failed for ${address}:`, err);
      await prisma.propertyAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: "error",
          overallVerdict: `Analysis failed: ${message}`,
        },
      });
      return NextResponse.json(
        { error: "Analysis failed", details: message, id: analysis.id },
        { status: 500 }
      );
    }

<<<<<<< HEAD
=======
    // 4. Merge Realie ground truth with Claude's inferred snapshot
    const mergedSnapshot = mergeSnapshots(realieData.snapshot, result.propertySnapshot);
    console.log("[API] Merged snapshot:", JSON.stringify(mergedSnapshot));

>>>>>>> origin/fix/fit-score-and-snapshot-data
    // 5. Persist all results in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.propertyAnalysis.update({
        where: { id: analysis.id },
        data: {
          trustScore: result.trustScore,
          trustLabel: result.trustLabel,
          overallVerdict: result.overallVerdict,
          propertySnapshot: JSON.stringify(mergedSnapshot),
          marketContext: JSON.stringify(result.marketContext),
          listPrice: effectiveListPrice,
          propertyType: effectivePropertyType,
          status: "complete",
          ...(effectiveListPrice != null && { listPrice: effectiveListPrice }),
          ...(effectiveListingText != null && { listingText: effectiveListingText }),
        },
      });

      // Create claims + evidence
      for (const claim of result.claims) {
        await tx.claim.create({
          data: {
            analysisId: analysis.id,
            category: claim.category,
            statement: claim.statement,
            source: claim.source,
            verdict: claim.verdict,
            confidence: claim.confidence,
            explanation: claim.explanation,
            severity: claim.severity,
            evidence: {
              create: claim.evidence.map((ev) => ({
                type: ev.type,
                source: ev.source,
                description: ev.description,
                dataPoint: ev.dataPoint ?? null,
              })),
            },
          },
        });
      }

      // Create action items
      for (const item of result.actionItems) {
        await tx.actionItem.create({
          data: {
            analysisId: analysis.id,
            category: item.category,
            priority: item.priority,
            title: item.title,
            description: item.description,
            relatedClaimIds: item.relatedClaimCategories.join(","),
          },
        });
      }
    });

    return NextResponse.json({ id: analysis.id, status: "complete" });
  } catch (error) {
    console.error("[/api/analyze] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
