/**
 * Free Property Data Sources
 * 
 * Alternative to web scraping - uses free APIs and public data sources.
 * These can supplement or replace Realie API data.
 */

import type { PropertySnapshot } from "@/types";

/**
 * Walk Score API - Free tier: 5,000 calls/month
 * Sign up: https://www.walkscore.com/professional/api.php
 */
export async function getWalkScore(
  lat: number,
  lon: number,
  address: string
): Promise<{
  walkscore: number | null;
  transit: { score: number | null; description: string | null } | null;
  bike: { score: number | null; description: string | null } | null;
} | null> {
  const apiKey = process.env.WALKSCORE_API_KEY;
  if (!apiKey) {
    console.log("[WalkScore] No API key - skipping");
    return null;
  }

  try {
    const url = `https://api.walkscore.com/score?format=json&lat=${lat}&lon=${lon}&address=${encodeURIComponent(address)}&wsapikey=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });
    
    if (!res.ok) {
      console.error(`[WalkScore] API error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return {
      walkscore: data.walkscore ?? null,
      transit: data.transit ? {
        score: data.transit.score ?? null,
        description: data.transit.description ?? null,
      } : null,
      bike: data.bike ? {
        score: data.bike.score ?? null,
        description: data.bike.description ?? null,
      } : null,
    };
  } catch (error) {
    console.error("[WalkScore] Error:", error);
    return null;
  }
}

/**
 * FEMA Flood Zone Data - Free, no API key required
 * Documentation: https://hazards.fema.gov/gis/nfhl/rest/services
 */
export async function getFloodZone(
  lat: number,
  lon: number
): Promise<{
  zone: string | null;
  riskLevel: string | null;
} | null> {
  try {
    // FEMA National Flood Hazard Layer API
    const url = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?geometry=${lon},${lat}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=*&f=json`;
    const res = await fetch(url, { cache: "no-store" });
    
    if (!res.ok) {
      console.error(`[FEMA] API error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const feature = data.features[0].attributes;
      return {
        zone: feature.FLD_ZONE || feature.ZONE_SUBTY || null,
        riskLevel: feature.SFHA_TF || null,
      };
    }
    return { zone: null, riskLevel: null };
  } catch (error) {
    console.error("[FEMA] Error:", error);
    return null;
  }
}

/**
 * GreatSchools API - Free tier available
 * Sign up: https://www.greatschools.org/api
 */
export async function getSchoolRatings(
  lat: number,
  lon: number
): Promise<{
  schools: Array<{
    name: string;
    rating: number | null;
    distance: number | null;
    type: string | null;
  }>;
} | null> {
  const apiKey = process.env.GREATSCHOOLS_API_KEY;
  if (!apiKey) {
    console.log("[GreatSchools] No API key - skipping");
    return null;
  }

  try {
    // GreatSchools Nearby Schools API
    const url = `https://api.greatschools.org/schools/nearby?key=${apiKey}&lat=${lat}&lon=${lon}&limit=10&radius=5`;
    const res = await fetch(url, { cache: "no-store" });
    
    if (!res.ok) {
      console.error(`[GreatSchools] API error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const schools = (data.schools || []).map((school: any) => ({
      name: school.name || null,
      rating: school.gsRating ? parseInt(school.gsRating) : null,
      distance: school.distance ? parseFloat(school.distance) : null,
      type: school.type || null,
    }));

    return { schools };
  } catch (error) {
    console.error("[GreatSchools] Error:", error);
    return null;
  }
}

/**
 * Census Bureau Demographics - Free, no API key required
 * Documentation: https://www.census.gov/data/developers/data-sets.html
 */
export async function getCensusDemographics(
  lat: number,
  lon: number
): Promise<{
  medianIncome: number | null;
  population: number | null;
  medianAge: number | null;
} | null> {
  try {
    // First, geocode to get census tract
    // Then fetch ACS (American Community Survey) data
    // This is a simplified version - full implementation requires tract lookup
    
    // For now, return null - requires more complex geocoding
    console.log("[Census] Demographics lookup requires tract geocoding - not implemented yet");
    return null;
  } catch (error) {
    console.error("[Census] Error:", error);
    return null;
  }
}

/**
 * County Assessor Data - Free (varies by county)
 * This is a template - each county has different endpoints
 */
export async function getCountyAssessorData(
  address: string,
  county?: string
): Promise<{
  assessedValue: number | null;
  taxAmount: number | null;
  yearBuilt: number | null;
} | null> {
  // Implementation depends on specific county API
  // Example: Orange County, CA has public property search
  // This would need to be customized per jurisdiction
  
  console.log(`[CountyAssessor] County-specific API not implemented for: ${county || "unknown"}`);
  return null;
}

/**
 * Building Permit History - Free (varies by city/county)
 * This is a template - each jurisdiction has different endpoints
 */
export async function getPermitHistory(
  address: string,
  city?: string
): Promise<{
  permits: Array<{
    type: string;
    date: string;
    description: string;
  }>;
} | null> {
  // Implementation depends on specific city/county API
  // Example: City of Irvine has public permit search
  // This would need to be customized per jurisdiction
  
  console.log(`[Permits] City-specific API not implemented for: ${city || "unknown"}`);
  return null;
}

/**
 * Aggregate all free data sources
 */
export async function fetchFreePropertyData(
  address: string,
  lat: number,
  lon: number
): Promise<{
  walkScore: number | null;
  transitScore: number | null;
  bikeScore: number | null;
  floodZone: string | null;
  schoolRatings: Array<{
    name: string;
    rating: number | null;
    distance: number | null;
    type: string | null;
  }> | null;
  demographics: {
    medianIncome: number | null;
    population: number | null;
    medianAge: number | null;
  } | null;
}> {
  const [walkScoreData, floodData, schoolsData, censusData] = await Promise.all([
    getWalkScore(lat, lon, address),
    getFloodZone(lat, lon),
    getSchoolRatings(lat, lon),
    getCensusDemographics(lat, lon),
  ]);

  return {
    walkScore: walkScoreData?.walkscore ?? null,
    transitScore: walkScoreData?.transit?.score ?? null,
    bikeScore: walkScoreData?.bike?.score ?? null,
    floodZone: floodData?.zone ?? null,
    schoolRatings: schoolsData?.schools ?? null,
    demographics: censusData,
  };
}
