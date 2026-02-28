# Prompt for Claude: Integrate Real Estate API

If you need to integrate a specific real estate API from the IrvineHacks resources page, use this prompt with Claude:

---

**Prompt:**

I'm building a Next.js real estate property search feature for DealBreakr AI. I need to integrate a real estate API to search for properties near a given address.

**Current Implementation:**
- I have a `/api/search` route at `app/api/search/route.ts` that currently uses:
  - Nominatim (OpenStreetMap) for geocoding addresses
  - Mock property data as fallback
- I have a `PropertySearch` component that displays search results
- The API returns properties in this format:
  ```typescript
  {
    address: string;
    listPrice?: number;
    beds?: number;
    baths?: number;
    sqft?: number;
    distance?: number;
    listingText?: string;
    propertyType?: string;
  }
  ```

**What I Need:**
1. Replace the mock property generation in `/api/search/route.ts` with real API calls
2. The API should accept:
   - Latitude/longitude coordinates (from geocoding)
   - Search radius (default 5 miles)
   - Optional filters (price range, beds, baths, etc.)
3. Map the API response to match the PropertySearchResult interface
4. Add proper error handling and fallback to mock data if API fails
5. Add rate limiting if the API has usage limits
6. Cache results if possible to reduce API calls

**API Details:**
[Paste the API documentation, endpoint URL, authentication method, request/response format from the IrvineHacks resources page here]

**Requirements:**
- Use TypeScript strictly
- Keep existing fallback behavior (mock data if API unavailable)
- Add environment variable for API key if needed
- Handle rate limits gracefully
- Return results sorted by distance from center point

Please provide:
1. Updated `/api/search/route.ts` with the API integration
2. Updated `.env.example` with any new environment variables needed
3. Instructions for getting and configuring the API key

---

## Alternative: If No Specific API Available

If you don't have a specific API from the resources page, here are common real estate APIs you could use:

1. **Rentals.com API** - Free tier available
2. **PropertyRadar API** - Requires signup
3. **Zillow API** - Limited/restricted access
4. **Realtor.com API** - Requires partnership
5. **Google Places API** - For address autocomplete (already partially implemented)

You can also use web scraping (with proper rate limiting) or build a database of properties from public records.
