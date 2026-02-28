/**
 * GET /api/search?address=... OR ?latitude=...&longitude=...
 *
 * Searches for properties using the Realie.ai API.
 * - If latitude & longitude are provided: search by location (e.g. "Use my location").
 * - Otherwise: geocode address, then Realie Location Search or Property Search.
 * Requires REALIE_API_KEY; returns no mock data.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  searchByLocation,
  searchByQuery,
  parseAddressQuery,
  type PropertySearchResult,
} from "@/lib/property-data";

/**
 * Geocode an address using Nominatim (OpenStreetMap) — free, no API key needed
 */
async function geocodeAddress(
  address: string
): Promise<{ lat: number; lon: number } | null> {
  try {
    const encoded = encodeURIComponent(address);
    console.log(`[Search] Geocoding: ${address}`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
      { headers: { "User-Agent": "DealBreakr-AI/1.0" } }
    );

    if (!response.ok) {
      console.error("[Search] Nominatim error:", response.status);
      return null;
    }

    const data = await response.json();
    if (data.length === 0) {
      console.warn("[Search] Nominatim found nothing for:", address);
      return null;
    }

    const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    console.log(`[Search] Geocoded "${address}" → ${coords.lat}, ${coords.lon}`);
    return coords;
  } catch (error) {
    console.error("[Search] Geocode error:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");
    const latParam = searchParams.get("latitude");
    const lonParam = searchParams.get("longitude");
    const radius = parseFloat(searchParams.get("radius") || "1.5");

    if (!process.env.REALIE_API_KEY) {
      console.error("[Search] REALIE_API_KEY not configured");
      return NextResponse.json(
        {
          error: "Property search not configured. REALIE_API_KEY required.",
          properties: [],
        },
        { status: 503 }
      );
    }

    // If user provided lat/lon (e.g. from "Use my location"), search by location directly
    if (latParam != null && lonParam != null) {
      const latitude = parseFloat(latParam);
      const longitude = parseFloat(lonParam);
      if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
        const properties = await searchByLocation(
          latitude,
          longitude,
          Math.min(Math.max(radius, 0.1), 2),
          20
        );
        console.log(`[Search] Location search (lat/lon): ${properties.length} results`);
        return NextResponse.json({
          properties: properties.slice(0, 15),
          center: { lat: latitude, lon: longitude },
          source: "realie",
          total: properties.length,
        });
      }
    }

    // Address-based search
    if (!address || address.length < 3) {
      return NextResponse.json(
        { error: "Please provide an address or use your current location.", properties: [] },
        { status: 400 }
      );
    }

    let properties: PropertySearchResult[] = [];
    let coords: { lat: number; lon: number } | null = null;

    // Strategy 1: Geocode → Realie location search
    coords = await geocodeAddress(address);
    if (coords) {
      properties = await searchByLocation(
        coords.lat,
        coords.lon,
        Math.min(radius, 2),
        20
      );
      console.log(`[Search] Location search: ${properties.length} results`);
    }

    // Strategy 2: If location search got nothing, try query-based search
    if (properties.length === 0) {
      const parsed = parseAddressQuery(address);
      if (parsed) {
        console.log(`[Search] Trying query search:`, parsed);
        properties = await searchByQuery({
          state: parsed.state,
          city: parsed.city,
          zipCode: parsed.zipCode,
          address: parsed.address,
          limit: 20,
        });
        console.log(`[Search] Query search: ${properties.length} results`);
      }
    }

    // Return results
    if (properties.length > 0) {
      return NextResponse.json({
        properties: properties.slice(0, 15),
        center: coords
          ? { address, lat: coords.lat, lon: coords.lon }
          : { address },
        source: "realie",
        total: properties.length,
      });
    }

    // Nothing found
    return NextResponse.json({
      properties: [],
      center: coords
        ? { address, lat: coords.lat, lon: coords.lon }
        : { address },
      source: "realie",
      message: coords
        ? `No properties found near ${address}. Try a different location.`
        : `Could not geocode "${address}". Try "City, State" or a ZIP code.`,
    });
  } catch (error) {
    console.error("[/api/search] Error:", error);
    return NextResponse.json(
      { error: "Search failed", properties: [] },
      { status: 500 }
    );
  }
}
