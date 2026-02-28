/**
 * GET /api/search?address=... OR ?latitude=...&longitude=...
 *
 * Searches for properties using the Realie.ai API.
 * - If latitude & longitude are provided: search by location (user geolocation).
 * - Otherwise: geocode address then Realie Location Search, or Realie Property Search.
 * Requires REALIE_API_KEY; returns no mock data.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  searchByLocation,
  searchByQuery,
  parseAddressQuery,
} from "@/lib/property-data";

/**
 * Geocode an address using Nominatim (OpenStreetMap) - free, no API key needed
 */
async function geocodeAddress(
  address: string
): Promise<{ lat: number; lon: number } | null> {
  try {
    const encoded = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
      {
        headers: {
          "User-Agent": "DealBreakr-AI/1.0",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error("[geocodeAddress] Error:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");
    const latParam = searchParams.get("latitude");
    const lonParam = searchParams.get("longitude");
    const radius = parseFloat(searchParams.get("radius") || "1.5"); // default 1.5 miles (Realie max 2)

    if (!process.env.REALIE_API_KEY) {
      return NextResponse.json(
        {
          error: "Property search is not configured. REALIE_API_KEY is required.",
          properties: [],
        },
        { status: 503 }
      );
    }

    // 1) If user provided lat/lon (e.g. from geolocation), search by location directly
    if (latParam != null && lonParam != null) {
      const latitude = parseFloat(latParam);
      const longitude = parseFloat(lonParam);
      if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
        const properties = await searchByLocation(
          latitude,
          longitude,
          Math.min(Math.max(radius, 0.1), 2),
          10
        );
        return NextResponse.json({
          properties: properties.slice(0, 10),
          center: { lat: latitude, lon: longitude },
          source: "realie_location",
        });
      }
    }

    // 2) Address-based search: require address
    if (!address || address.length < 3) {
      return NextResponse.json(
        { error: "Please provide an address or use your current location." },
        { status: 400 }
      );
    }

    // 3) Try geocode + Realie location search
    const coords = await geocodeAddress(address);
    if (coords) {
      const properties = await searchByLocation(
        coords.lat,
        coords.lon,
        Math.min(radius, 2),
        10
      );
      return NextResponse.json({
        properties: properties.slice(0, 10),
        center: {
          address,
          lat: coords.lat,
          lon: coords.lon,
        },
        source: "realie_location",
      });
    }

    // 4) Fallback: parse query and use Realie property search (state required)
    const parsed = parseAddressQuery(address);
    if (parsed) {
      const properties = await searchByQuery({
        state: parsed.state,
        city: parsed.city,
        zipCode: parsed.zipCode,
        address: parsed.address,
        limit: 10,
      });
      return NextResponse.json({
        properties: properties.slice(0, 10),
        center: { address },
        source: "realie_search",
      });
    }

    return NextResponse.json({
      properties: [],
      center: { address },
      source: "none",
      message: "Could not geocode address or parse as city/state/ZIP. Try e.g. 'Irvine, CA' or '92618'.",
    });
  } catch (error) {
    console.error("[/api/search] Error:", error);
    return NextResponse.json(
      { error: "Search failed", properties: [] },
      { status: 500 }
    );
  }
}
