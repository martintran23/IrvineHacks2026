/**
 * Realie API client for DealBreakr AI
 *
 * Fetches real estate property listings from Realie API.
 * Works with Nominatim geocoding to find properties near a location.
 */

interface RealieProperty {
  address: string;
  listPrice?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  lotSqft?: number;
  yearBuilt?: number;
  listingText?: string;
  propertyType?: string;
  mlsNumber?: string;
  photos?: string[];
  latitude?: number;
  longitude?: number;
}

interface RealieSearchParams {
  lat: number;
  lon: number;
  radius?: number; // in miles
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  limit?: number;
}

/**
 * Search for properties using Realie API
 * 
 * @param params Search parameters including coordinates
 * @returns Array of properties or null if API unavailable
 */
export async function searchRealieProperties(
  params: RealieSearchParams
): Promise<RealieProperty[] | null> {
  const apiKey = process.env.REALIE_API_KEY;
  const apiBaseUrl = process.env.REALIE_API_BASE_URL || "https://api.realie.com/v1";

  if (!apiKey) {
    console.log("[Realie] ⚠️  No REALIE_API_KEY found - skipping Realie API");
    return null;
  }

  try {
    const { lat, lon, radius = 5, limit = 20 } = params;

    // Build search query - adjust endpoint based on Realie API documentation
    const searchUrl = new URL(`${apiBaseUrl}/properties/search`);
    searchUrl.searchParams.set("latitude", lat.toString());
    searchUrl.searchParams.set("longitude", lon.toString());
    searchUrl.searchParams.set("radius", radius.toString());
    searchUrl.searchParams.set("limit", limit.toString());

    if (params.minPrice) searchUrl.searchParams.set("min_price", params.minPrice.toString());
    if (params.maxPrice) searchUrl.searchParams.set("max_price", params.maxPrice.toString());
    if (params.beds) searchUrl.searchParams.set("beds", params.beds.toString());
    if (params.baths) searchUrl.searchParams.set("baths", params.baths.toString());

    console.log(`[Realie] 🔍 Searching properties near ${lat}, ${lon} (radius: ${radius}mi)`);

    const response = await fetch(searchUrl.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "DealBreakr-AI/1.0",
      },
    });

    if (!response.ok) {
      console.error(`[Realie] ❌ API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    // Map Realie API response to our format
    // Adjust field mapping based on actual Realie API response structure
    const properties: RealieProperty[] = (data.properties || data.results || data.data || []).map((prop: any) => ({
      address: prop.address || prop.full_address || `${prop.street || ""}, ${prop.city || ""}, ${prop.state || ""} ${prop.zip || ""}`.trim(),
      listPrice: prop.price || prop.list_price || prop.asking_price,
      beds: prop.beds || prop.bedrooms || prop.bed,
      baths: prop.baths || prop.bathrooms || prop.bath,
      sqft: prop.sqft || prop.square_feet || prop.living_area,
      lotSqft: prop.lot_sqft || prop.lot_size || prop.lot_square_feet,
      yearBuilt: prop.year_built || prop.year_constructed,
      listingText: prop.description || prop.remarks || prop.listing_description,
      propertyType: prop.property_type || prop.type || prop.property_subtype,
      mlsNumber: prop.mls_number || prop.mls_id || prop.listing_id,
      photos: prop.photos || prop.images || [],
      latitude: prop.latitude || prop.lat,
      longitude: prop.longitude || prop.lon || prop.lng,
    }));

    console.log(`[Realie] ✅ Found ${properties.length} properties`);
    return properties;
  } catch (error: any) {
    console.error("[Realie] ❌ Error fetching properties:", error);
    return null;
  }
}

/**
 * Get property details by address or MLS number
 */
export async function getRealiePropertyDetails(
  identifier: string
): Promise<RealieProperty | null> {
  const apiKey = process.env.REALIE_API_KEY;
  const apiBaseUrl = process.env.REALIE_API_BASE_URL || "https://api.realie.com/v1";

  if (!apiKey) {
    return null;
  }

  try {
    // Try by address first, then by MLS number
    const searchUrl = new URL(`${apiBaseUrl}/properties/lookup`);
    searchUrl.searchParams.set("q", identifier);

    const response = await fetch(searchUrl.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const prop = data.property || data;

    return {
      address: prop.address || identifier,
      listPrice: prop.price || prop.list_price,
      beds: prop.beds || prop.bedrooms,
      baths: prop.baths || prop.bathrooms,
      sqft: prop.sqft || prop.square_feet,
      lotSqft: prop.lot_sqft || prop.lot_size,
      yearBuilt: prop.year_built,
      listingText: prop.description || prop.remarks,
      propertyType: prop.property_type,
      mlsNumber: prop.mls_number || prop.mls_id,
      photos: prop.photos || prop.images || [],
      latitude: prop.latitude || prop.lat,
      longitude: prop.longitude || prop.lon,
    };
  } catch (error) {
    console.error("[Realie] Error fetching property details:", error);
    return null;
  }
}
