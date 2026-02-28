/**
 * GET /api/properties/[id]
 *
 * Returns the full analysis for a property, including all claims,
 * evidence, and action items.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analysis = await prisma.propertyAnalysis.findUnique({
      where: { id: params.id },
      include: {
        claims: {
          include: { evidence: true },
          orderBy: [
            { severity: "asc" }, // critical first
            { confidence: "desc" },
          ],
        },
        actionItems: {
          orderBy: { priority: "asc" }, // critical first
        },
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    // Parse JSON fields
    const response = {
      ...analysis,
      propertySnapshot: analysis.propertySnapshot
        ? JSON.parse(analysis.propertySnapshot)
        : null,
      marketContext: analysis.marketContext
        ? JSON.parse(analysis.marketContext)
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[/api/properties/[id]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
