/**
 * POST /api/analyze
 *
 * Accepts a property address + optional listing text,
 * runs Claude analysis, persists results to DB, returns the analysis ID.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeProperty } from "@/lib/claude";
import { AnalyzeRequestSchema } from "@/types";
import { fetchPropertyData } from "@/lib/property-data";
import { scrapeZillowListing } from "@/lib/zillow-scraper";

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
    let result;
    try {
      console.log(`[API] Starting analysis for: ${address}`);
      result = await analyzeProperty({
        address,
        listingText: effectiveListingText,
        listPrice: effectiveListPrice ?? undefined,
        propertyType,
        snapshotFromApi: realieData.snapshot,
        comparablesFromApi: realieData.comparables,
        zillowScraped: zillowData,
      });
      console.log(`[API] Analysis complete - Trust Score: ${result.trustScore}, Claims: ${result.claims.length}`);
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

    // 5. Persist all results in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.propertyAnalysis.update({
        where: { id: analysis.id },
        data: {
          trustScore: result.trustScore,
          trustLabel: result.trustLabel,
          overallVerdict: result.overallVerdict,
          propertySnapshot: JSON.stringify(result.propertySnapshot),
          marketContext: JSON.stringify(result.marketContext),
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
