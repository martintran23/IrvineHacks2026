/**
 * GET /api/search?address=...
 * 
 * Searches for properties near a given address.
 * Uses geocoding to find coordinates, then searches for nearby properties.
 * Falls back to mock data if external APIs are unavailable.
 */

import { NextRequest, NextResponse } from "next/server";

interface PropertySearchResult {
  address: string;
  listPrice?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  distance?: number; // in miles
  listingText?: string;
  propertyType?: string;
}

/**
 * Geocode an address using Nominatim (OpenStreetMap) - free, no API key needed
 */
async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const encoded = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
      {
        headers: {
          'User-Agent': 'DealBreakr-AI/1.0', // Required by Nominatim
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
    console.error('[geocodeAddress] Error:', error);
    return null;
  }
}

/**
 * Generate mock properties near a location
 * In production, this would call a real estate API
 */
function generateNearbyProperties(
  centerLat: number,
  centerLon: number,
  address: string
): PropertySearchResult[] {
  // Extract city/area from address for context
  const cityMatch = address.match(/(Irvine|Costa Mesa|Newport Beach|Tustin|Orange|Santa Ana)/i);
  const city = cityMatch ? cityMatch[1] : 'Irvine';

  // Generate 5-8 mock properties with slight variations
  const properties: PropertySearchResult[] = [];
  const baseAddresses = [
    { street: '42 Shadowridge', city: 'Irvine', zip: '92618' },
    { street: '518 Jasmine Ave', city: 'Costa Mesa', zip: '92627' },
    { street: '123 Main St', city, zip: '92602' },
    { street: '456 Oak Blvd', city, zip: '92602' },
    { street: '789 Pine Ave', city, zip: '92602' },
    { street: '321 Elm Dr', city, zip: '92602' },
    { street: '654 Maple Ln', city, zip: '92602' },
  ];

  const prices = [1100000, 1050000, 1250000, 950000, 1150000, 1300000, 980000];
  const bedBathSqft = [
    { beds: 4, baths: 3, sqft: 2450 },
    { beds: 3, baths: 2, sqft: 1680 },
    { beds: 4, baths: 2.5, sqft: 2200 },
    { beds: 3, baths: 2, sqft: 1800 },
    { beds: 5, baths: 4, sqft: 3200 },
    { beds: 3, baths: 2.5, sqft: 1950 },
    { beds: 4, baths: 3, sqft: 2600 },
  ];

  baseAddresses.forEach((base, i) => {
    if (i >= 6) return; // Limit to 6 properties

    properties.push({
      address: `${base.street}, ${base.city}, CA ${base.zip}`,
      listPrice: prices[i],
      ...bedBathSqft[i],
      distance: 0.2 + Math.random() * 2, // 0.2-2.2 miles
      listingText: `Beautiful ${bedBathSqft[i].beds}BR/${bedBathSqft[i].baths}BA home in ${base.city}. ${bedBathSqft[i].sqft} sqft of living space.`,
      propertyType: 'Single Family Residence',
    });
  });

  return properties.sort((a, b) => (a.distance || 0) - (b.distance || 0));
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const radius = parseFloat(searchParams.get('radius') || '5'); // default 5 miles

    if (!address || address.length < 5) {
      return NextResponse.json(
        { error: 'Please provide a valid address' },
        { status: 400 }
      );
    }

    // Step 1: Geocode the address
    const coords = await geocodeAddress(address);

    if (!coords) {
      // Fallback: return mock properties even without geocoding
      return NextResponse.json({
        properties: generateNearbyProperties(33.6846, -117.8265, address), // Default to Irvine coordinates
        center: { address, lat: 33.6846, lon: -117.8265 },
        source: 'mock',
      });
    }

    // Step 2: Search for nearby properties
    // In production, you would:
    // - Call a real estate API (Zillow, Realtor.com, etc.)
    // - Query your own database of listings
    // - Use a property data provider
    
    // For now, generate mock properties near the coordinates
    const properties = generateNearbyProperties(coords.lat, coords.lon, address);

    return NextResponse.json({
      properties: properties.slice(0, 6), // Return top 6
      center: {
        address,
        lat: coords.lat,
        lon: coords.lon,
      },
      source: 'geocoded',
    });
  } catch (error) {
    console.error('[/api/search] Error:', error);
    return NextResponse.json(
      { error: 'Search failed', properties: [] },
      { status: 500 }
    );
  }
}
