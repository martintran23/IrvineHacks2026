// lib/property-data.ts
// External property data integration.
// Uses Realie.ai Address Lookup as the sole provider.

import type { PropertySnapshot, ComparableProperty } from "@/types";

const REALIE_API_KEY = process.env.REALIE_API_KEY;
const REALIE_BASE_URL =
  process.env.REALIE_BASE_URL || "https://app.realie.ai/api";

// Minimal shape for Realie Address Lookup
interface RealieAddressResponse {
  property?: any;
}

// Simple US state abbreviation set for parsing
const US_STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
]);

function parseAddressForRealie(fullAddress: string): {
  state: string;
  street: string;
  city?: string;
} | null {
  if (!fullAddress) return null;

  const parts = fullAddress.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  const last = parts[parts.length - 1];
  const tokens = last.split(/\s+/).filter(Boolean);
  const stateToken = tokens.find((t) => US_STATES.has(t.toUpperCase()));
  if (!stateToken) {
    console.warn("[Realie] Could not parse state from address:", fullAddress);
    return null;
  }

  const state = stateToken.toUpperCase();
  const street = parts[0];
  const city = parts.length >= 2 ? parts[1] : undefined;

  return { state, street, city };
}

export async function fetchPropertyData(
  fullAddress: string
): Promise<{
  snapshot: PropertySnapshot | null;
  comparables: ComparableProperty[];
  raw: any;
}> {
  if (!REALIE_API_KEY) {
    console.warn("[Realie] No REALIE_API_KEY set; skipping real lookup");
    return { snapshot: null, comparables: [], raw: null };
  }

  const parsed = parseAddressForRealie(fullAddress);
  if (!parsed) {
    console.warn("[Realie] Address parsing failed for:", fullAddress);
    return { snapshot: null, comparables: [], raw: null };
  }

  const url = new URL("/public/property/address/", REALIE_BASE_URL);
  url.searchParams.set("state", parsed.state);
  url.searchParams.set("address", parsed.street);
  if (parsed.city) {
    url.searchParams.set("city", parsed.city);
  }

  try {
    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Authorization: REALIE_API_KEY,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error(
        "[Realie] Non-200 response:",
        res.status,
        await res.text()
      );
      return { snapshot: null, comparables: [], raw: null };
    }

    const data = (await res.json()) as RealieAddressResponse;
    const prop: any = data.property;
    if (!prop) {
      console.warn("[Realie] No property object in response for:", fullAddress);
      return { snapshot: null, comparables: [], raw: data };
    }

    // Field names based on Realie Property Data Schema docs
    const snapshot: PropertySnapshot = {
      beds: prop.totalBedrooms ?? null,
      baths: prop.totalBathrooms ?? null,
      sqft: prop.buildingArea ?? null,
      lotSqft: prop.landArea ?? null,
      yearBuilt: prop.yearBuilt ?? null,
      stories: prop.stories ?? null,
      garage: prop.garageType ?? null,
      hoa: null,
      zoning: prop.zoningCode ?? null,
      taxAssessedValue: prop.mostRecentAssessedMarketValue ?? null,
      lastSaleDate:
        prop.transferDateObject ||
        prop.transferDate ||
        prop.recordingDate ||
        null,
      lastSalePrice: prop.transferPrice ?? null,
    };

    return {
      snapshot,
      comparables: [],
      raw: data,
    };
  } catch (error) {
    console.error("[Realie] Error fetching property data:", error);
    return { snapshot: null, comparables: [], raw: null };
  }
}
