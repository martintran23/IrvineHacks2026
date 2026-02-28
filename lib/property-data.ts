// lib/property-data.ts
// External property data integration.
// Uses Realie.ai API: Address Lookup, Location Search, and Property Search.

import type { PropertySnapshot, ComparableProperty } from "@/types";

const REALIE_API_KEY = process.env.REALIE_API_KEY;
const REALIE_BASE_URL = (() => {
  const base = process.env.REALIE_BASE_URL || "https://app.realie.ai/api";
  return base.endsWith("/") ? base : `${base}/`;
})();

// Minimal shape for Realie Address Lookup
interface RealieAddressResponse {
  property?: any;
}

// Realie Location Search response (GET /public/property/location/)
interface RealieLocationResponse {
  properties?: any[];
  metadata?: { limit?: number; offset?: number; count?: number };
}

// Realie Property Search response (GET /public/property/search/)
interface RealieSearchResponse {
  properties?: any[];
  metadata?: { limit?: number; offset?: number; count?: number };
}

/** Result shape for search endpoints (used by /api/search) */
export interface PropertySearchResult {
  address: string;
  listPrice?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  distance?: number;
  listingText?: string;
  propertyType?: string;
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

  const url = new URL("public/property/address/", REALIE_BASE_URL);
  url.searchParams.set("state", parsed.state);
  url.searchParams.set("address", parsed.street);
  // Realie requires county when city is provided; omit city to avoid 400

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

    const num = (v: any): number | null => {
      if (v == null || v === "") return null;
      if (typeof v === "number") return Number.isNaN(v) ? null : v;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    };
    const str = (v: any): string | null =>
      v == null || v === "" ? null : String(v);

    // Map Realie fields with alternate names so snapshot populates (beds, baths, sqft, lot, garage, hoa, assessed)
    const snapshot: PropertySnapshot = {
      beds: num(prop.totalBedrooms) ?? num(prop.bedrooms) ?? null,
      baths: num(prop.totalBathrooms) ?? num(prop.bathrooms) ?? null,
      sqft: num(prop.buildingArea) ?? num(prop.livingArea) ?? null,
      lotSqft: num(prop.landArea) ?? num(prop.lotSize) ?? null,
      yearBuilt: num(prop.yearBuilt) ?? null,
      stories: num(prop.stories) ?? null,
      garage: str(prop.garageType) ?? (num(prop.garageCount) != null ? `${num(prop.garageCount)}-car` : null),
      hoa: num(prop.hoaAmount) ?? num(prop.hoa) ?? null,
      zoning: str(prop.zoningCode) ?? str(prop.zoning) ?? null,
      taxAssessedValue: num(prop.totalAssessedValue) ?? num(prop.totalMarketValue) ?? num(prop.assessedValue) ?? null,
      lastSaleDate:
        str(prop.transferDateObject) ??
        str(prop.transferDate) ??
        str(prop.recordingDate) ??
        null,
      lastSalePrice: num(prop.transferPrice) ?? null,
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

/** Build a single-line address from Realie property object (schema: address, addressFull, city, state, zipCode) */
function formatPropertyAddress(p: any): string {
  const line1 = p.addressFull ?? p.address ?? p.addressUnit ?? "";
  const city = p.city ?? "";
  const state = p.state ?? "";
  const zip = p.zipCode ?? "";
  const parts = [line1, city, state, zip].filter(Boolean);
  return parts.join(", ");
}

/** Map a Realie property object to PropertySearchResult (schema field names). listPrice omitted — Realie data is not current listing price. */
function mapRealiePropertyToSearchResult(p: any, distance?: number): PropertySearchResult {
  return {
    address: formatPropertyAddress(p) || "Unknown address",
    beds: p.totalBedrooms ?? undefined,
    baths: p.totalBathrooms ?? undefined,
    sqft: p.buildingArea ?? undefined,
    distance,
    propertyType: p.useCode ?? undefined,
  };
}

/**
 * Search for properties by location (lat/lon + radius).
 * Uses Realie GET /public/property/location/ (radius max 2 miles).
 */
export async function searchByLocation(
  latitude: number,
  longitude: number,
  radiusMiles: number = 1,
  limit: number = 10
): Promise<PropertySearchResult[]> {
  if (!REALIE_API_KEY) {
    console.warn("[Realie] No REALIE_API_KEY set; cannot search by location");
    return [];
  }
  const radius = Math.min(Math.max(radiusMiles, 0.1), 2); // Realie max 2 miles
  const url = new URL("public/property/location/", REALIE_BASE_URL);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("limit", String(Math.min(limit, 100)));
  url.searchParams.set("residential", "true");

  try {
    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Authorization: REALIE_API_KEY,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.error("[Realie] Location search non-200:", res.status, await res.text());
      return [];
    }
    const data = (await res.json()) as RealieLocationResponse;
    const list = data.properties ?? [];
    return list.map((p) => mapRealiePropertyToSearchResult(p));
  } catch (error) {
    console.error("[Realie] Location search error:", error);
    return [];
  }
}

/**
 * Search for properties by state/city/zip/address.
 * Uses Realie GET /public/property/search/ (state is required).
 */
export async function searchByQuery(params: {
  state: string;
  city?: string;
  zipCode?: string;
  address?: string;
  limit?: number;
}): Promise<PropertySearchResult[]> {
  if (!REALIE_API_KEY) {
    console.warn("[Realie] No REALIE_API_KEY set; cannot search");
    return [];
  }
  const { state, city, zipCode, address, limit = 10 } = params;
  const url = new URL("public/property/search/", REALIE_BASE_URL);
  url.searchParams.set("state", state.trim().toUpperCase().slice(0, 2));
  if (city) url.searchParams.set("city", city.trim());
  if (zipCode) url.searchParams.set("zipCode", zipCode.replace(/\D/g, "").slice(0, 5));
  if (address) url.searchParams.set("address", address.trim());
  url.searchParams.set("limit", String(Math.min(limit, 100)));
  url.searchParams.set("residential", "true");

  try {
    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Authorization: REALIE_API_KEY,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.error("[Realie] Property search non-200:", res.status, await res.text());
      return [];
    }
    const data = (await res.json()) as RealieSearchResponse;
    const list = data.properties ?? [];
    return list.map((p) => mapRealiePropertyToSearchResult(p));
  } catch (error) {
    console.error("[Realie] Property search error:", error);
    return [];
  }
}

/** Parse user query into state, city, zip for Realie search (e.g. "Irvine, CA" or "92618") */
export function parseAddressQuery(query: string): { state: string; city?: string; zipCode?: string; address?: string } | null {
  const trimmed = query.trim();
  if (!trimmed.length) return null;
  const US_STATES = new Set([
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  ]);
  const zipOnly = /^\d{5}(-\d{4})?$/.test(trimmed.replace(/\s/g, ""));
  if (zipOnly) {
    const zip = trimmed.replace(/\D/g, "").slice(0, 5);
    return { state: "CA", zipCode: zip };
  }
  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1];
  const tokens = last.split(/\s+/).filter(Boolean);
  const stateToken = tokens.find((t) => US_STATES.has(t.toUpperCase()));
  if (!stateToken) return null;
  const state = stateToken.toUpperCase();
  const street = parts[0];
  const city = parts.length >= 2 ? parts[1] : undefined;
  return { state, city, address: street };
}
