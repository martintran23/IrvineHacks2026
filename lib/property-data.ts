// lib/property-data.ts
// External property data integration.
// Uses Realie.ai API: Address Lookup, Location Search, and Property Search.

import type { PropertySnapshot, ComparableProperty } from "@/types";

const REALIE_API_KEY = process.env.REALIE_API_KEY;
const REALIE_BASE_URL =
  process.env.REALIE_BASE_URL || "https://app.realie.ai/api";

// Log API key status (first 10 chars only for security)
if (REALIE_API_KEY) {
  console.log(`[Realie] API key loaded: ${REALIE_API_KEY.substring(0, 10)}...`);
} else {
  console.warn(`[Realie] No API key found in environment variables`);
}

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


function toPositiveNumber(value: any): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

function formatGarageLabel(prop: any): string | null {
  const count = toPositiveNumber(prop.garageCount);
  const type = (prop.garageType || "").toString().toUpperCase();

  if (count) {
    if (type === "A") return `${count}-car attached garage`;
    if (type === "D") return `${count}-car detached garage`;
    return `${count}-car garage`;
  }

  if (prop.garage === true) return "Garage";
  return null;
}

/** Map Realie useCode to a human-readable property type */
function mapUseCodeToType(useCode: string | number | undefined, isCondo?: boolean): string | null {
  if (!useCode) return isCondo ? "Condo" : null;
  const code = String(useCode);
  const map: Record<string, string> = {
    "1001": "Single Family Home",
    "1002": "Duplex",
    "1003": "Triplex",
    "1004": isCondo ? "Condo" : "Townhouse/PUD",
    "1005": "Mobile Home",
    "1006": "Multi-Family (5+)",
    "1009": "Residential (Other)",
  };
  return map[code] || (isCondo ? "Condo" : "Residential");
}
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
  estimatedValue: number | null;
  propertyType: string | null;
  raw: any;
}> {
  if (!REALIE_API_KEY) {
    console.warn("[Realie] No REALIE_API_KEY set; skipping real lookup");
    return { snapshot: null, comparables: [], estimatedValue: null, propertyType: null, raw: null };
  }

  const parsed = parseAddressForRealie(fullAddress);
  if (!parsed) {
    console.warn("[Realie] Address parsing failed for:", fullAddress);
    return { snapshot: null, comparables: [], estimatedValue: null, propertyType: null, raw: null };
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
      return { snapshot: null, comparables: [], estimatedValue: null, propertyType: null, raw: null };
    }

    const data = (await res.json()) as RealieAddressResponse;
    const prop: any = data.property;
    if (!prop) {
      console.warn("[Realie] No property object in response for:", fullAddress);
      return { snapshot: null, comparables: [], estimatedValue: null, propertyType: null, raw: data };
    }

    // Field names from Realie Property Data Schema
    const snapshot: PropertySnapshot = {
      beds: toPositiveNumber(prop.totalBedrooms),
      baths: toPositiveNumber(prop.totalBathrooms),
      sqft: toPositiveNumber(prop.buildingArea),
      lotSqft: toPositiveNumber(prop.landArea),
      yearBuilt: toPositiveNumber(prop.yearBuilt),
      stories: toPositiveNumber(prop.stories),
      garage: formatGarageLabel(prop),
      hoa: toPositiveNumber(prop.hoaFee ?? prop.hoa ?? prop.monthlyHoa),
      zoning: prop.zoningCode ?? null,
      taxAssessedValue:
        toPositiveNumber(prop.totalAssessedValue) ??
        toPositiveNumber(prop.totalMarketValue),
      lastSaleDate:
        prop.transferDateObject ??
        prop.transferDate ??
        prop.recordingDate ??
        null,
      lastSalePrice: toPositiveNumber(prop.transferPrice),
    };

    // Estimated current value (modelValue is Realie's AVM estimate)
    const estimatedValue = toPositiveNumber(prop.modelValue) ??
      toPositiveNumber(prop.totalAssessedValue) ??
      toPositiveNumber(prop.transferPrice);
    
    // Map useCode to a readable property type
    const propertyType = mapUseCodeToType(prop.useCode, prop.condo);

    console.log("[Realie] Snapshot extracted:", JSON.stringify(snapshot, null, 2));
    console.log("[Realie] Estimated value:", estimatedValue, "| Property type:", propertyType);

    return {
      snapshot,
      comparables: [],
      estimatedValue,
      propertyType,
      raw: data,
    };
  } catch (error) {
    console.error("[Realie] Error fetching property data:", error);
    return { snapshot: null, comparables: [], estimatedValue: null, propertyType: null, raw: null };
  }
}

/** Build a single-line address from Realie property object */
function formatPropertyAddress(p: any): string {
  // Realie API returns addressFullUSPS which is the best formatted address
  if (p.addressFullUSPS) {
    return p.addressFullUSPS;
  }
  // Fallback to building address from parts
  const line1 = p.addressFull ?? p.address ?? p.addressFormal ?? "";
  const city = p.city ?? p.cityUSPS ?? "";
  const state = p.state ?? "";
  const zip = p.zipCode ?? "";
  const parts = [line1, city, state, zip].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Unknown address";
}

/** Calculate distance between two lat/lon points in miles */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Map a Realie property object to PropertySearchResult (schema field names) */
function mapRealiePropertyToSearchResult(p: any, searchLat?: number, searchLon?: number): PropertySearchResult {
  // Calculate distance if we have search coordinates and property coordinates
  let distance: number | undefined = undefined;
  if (searchLat && searchLon && p.latitude && p.longitude) {
    distance = calculateDistance(searchLat, searchLon, p.latitude, p.longitude);
  }
  
  // Use modelValue for list price (estimated current value) - better than transferPrice (sale price)
  const listPrice = toPositiveNumber(p.modelValue) ?? toPositiveNumber(p.totalAssessedValue) ?? toPositiveNumber(p.totalMarketValue) ?? toPositiveNumber(p.transferPrice) ?? undefined;
  
  return {
    address: formatPropertyAddress(p),
    listPrice: listPrice ? Math.round(listPrice) : undefined,
    beds: p.totalBedrooms ?? undefined,
    baths: p.totalBathrooms ?? undefined,
    sqft: p.buildingArea ?? undefined,
    distance,
    propertyType: p.useCode ? String(p.useCode) : undefined,
    listingText: p.legalDesc ? p.legalDesc.substring(0, 200) : undefined, // Use legal description as listing text
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
  const url = new URL("/public/property/location/", REALIE_BASE_URL);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("limit", String(Math.min(limit, 100)));
  url.searchParams.set("residential", "true");

  try {
    console.log(`[Realie] Calling location search: ${url.toString()}`);
    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Authorization: REALIE_API_KEY,
        Accept: "application/json",
      },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Realie] Location search failed: ${res.status} ${res.statusText}`, errorText);
      return [];
    }
    
    const data = (await res.json()) as RealieLocationResponse;
    const list = data.properties ?? [];
    console.log(`[Realie] Location search returned ${list.length} properties`);
    // Pass search coordinates to calculate distance
    return list.map((p) => mapRealiePropertyToSearchResult(p, latitude, longitude));
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
  const url = new URL("/public/property/search/", REALIE_BASE_URL);
  url.searchParams.set("state", state.trim().toUpperCase().slice(0, 2));
  if (city) url.searchParams.set("city", city.trim());
  if (zipCode) url.searchParams.set("zipCode", zipCode.replace(/\D/g, "").slice(0, 5));
  if (address) url.searchParams.set("address", address.trim());
  url.searchParams.set("limit", String(Math.min(limit, 100)));
  url.searchParams.set("residential", "true");

  try {
    console.log(`[Realie] Calling property search: ${url.toString()}`);
    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Authorization: REALIE_API_KEY,
        Accept: "application/json",
      },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Realie] Property search failed: ${res.status} ${res.statusText}`, errorText);
      return [];
    }
    
    const data = (await res.json()) as RealieSearchResponse;
    const list = data.properties ?? [];
    console.log(`[Realie] Property search returned ${list.length} properties`);
    // For search by query, we don't have search coordinates, so distance will be undefined
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
  
  // Handle "City, State" format (e.g., "Irvine, CA")
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const tokens = last.split(/\s+/).filter(Boolean);
    const stateToken = tokens.find((t) => US_STATES.has(t.toUpperCase()));
    
    if (stateToken) {
      const state = stateToken.toUpperCase();
      // If we have "City, State" format (2 parts), city is the first part
      // If we have "Street, City, State" format (3+ parts), city is the middle part
      const city = parts.length === 2 ? parts[0] : (parts.length >= 3 ? parts[parts.length - 2] : undefined);
      // If there's a street address (3+ parts), use the first part as address
      const address = parts.length >= 3 ? parts[0] : undefined;
      
      console.log(`[parseAddressQuery] Parsed "${trimmed}" as:`, { state, city, address });
      return { state, city, address };
    }
  }
  
  // Try to find state in the entire query (e.g., "Irvine CA" without comma)
  const allTokens = trimmed.split(/\s+/).filter(Boolean);
  const stateToken = allTokens.find((t) => US_STATES.has(t.toUpperCase()));
  
  if (stateToken) {
    const state = stateToken.toUpperCase();
    const stateIndex = allTokens.indexOf(stateToken);
    const city = stateIndex > 0 ? allTokens.slice(0, stateIndex).join(" ") : undefined;
    const address = stateIndex > 1 ? allTokens.slice(0, stateIndex - 1).join(" ") : undefined;
    
    console.log(`[parseAddressQuery] Parsed "${trimmed}" as:`, { state, city, address });
    return { state, city, address };
  }
  
  console.log(`[parseAddressQuery] Could not parse: ${trimmed}`);
  return null;
}
