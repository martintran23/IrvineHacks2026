/**
 * Seed script — optionally populates the database.
 * Run: npx tsx prisma/seed.ts
 *
 * With Realie + Claude API integration, we no longer seed mock analyses.
 * Use the app to analyze real properties.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 DealBreakr AI database ready.\n");
  console.log("   No mock data seeded. Use the app to analyze real properties with the Realie API.\n");
  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
