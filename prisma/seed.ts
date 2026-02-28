/**
 * Seed script — populates the database with 2 example properties.
 * Run: npx tsx prisma/seed.ts
 */

import { PrismaClient } from "@prisma/client";
import { MOCK_PROPERTIES } from "../lib/mock-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding DealBreakr AI database...\n");

  for (const [key, prop] of Object.entries(MOCK_PROPERTIES)) {
    const { address, listingText, listPrice, propertyType, analysis } = prop;

    console.log(`  → ${address}`);

    const pa = await prisma.propertyAnalysis.create({
      data: {
        address,
        listingText,
        listPrice,
        propertyType,
        trustScore: analysis.trustScore,
        trustLabel: analysis.trustLabel,
        overallVerdict: analysis.overallVerdict,
        propertySnapshot: JSON.stringify(analysis.propertySnapshot),
        marketContext: JSON.stringify(analysis.marketContext),
        status: "complete",
        claims: {
          create: analysis.claims.map((claim) => ({
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
          })),
        },
        actionItems: {
          create: analysis.actionItems.map((item) => ({
            category: item.category,
            priority: item.priority,
            title: item.title,
            description: item.description,
            relatedClaimIds: item.relatedClaimCategories.join(","),
          })),
        },
      },
    });

    console.log(`    ✓ Created analysis ${pa.id} (trust: ${pa.trustScore})\n`);
  }

  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
