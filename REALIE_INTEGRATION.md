# Realie API Integration Guide

## Workflow Overview

The DealBreakr AI now uses a three-step process:

1. **Nominatim (OpenStreetMap)** - Geocodes addresses to get coordinates
2. **Realie API** - Fetches real property listings near those coordinates
3. **Claude (Anthropic)** - Analyzes properties for trust score, safety, and due diligence

## How It Works

### Property Search Flow (`/api/search`)

```
User enters address
    ↓
Nominatim geocodes address → (lat, lon)
    ↓
Realie API searches for properties near (lat, lon)
    ↓
Returns properties with details (price, beds, baths, sqft, etc.)
    ↓
User selects a property
    ↓
Property sent to Claude for analysis
```

### Analysis Flow (`/api/analyze`)

```
Property address selected
    ↓
Realie API fetches full property details (if available)
    ↓
Claude analyzes property with:
  - Realie property data (beds, baths, sqft, year built)
  - Listing text
  - Price information
    ↓
Claude generates:
  - Trust score (0-100)
  - Claims extraction
  - Evidence cross-checking
  - Buyer war room action items
    ↓
Results stored in database
```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Anthropic API (for Claude analysis)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Realie API (for property listings)
REALIE_API_KEY=your_realie_api_key_here
REALIE_API_BASE_URL=https://api.realie.com/v1

# Database
DATABASE_URL="file:./dev.db"
```

### Realie API Setup

1. Get your Realie API key from the IrvineHacks resources page
2. Add it to `.env` as `REALIE_API_KEY`
3. The API base URL defaults to `https://api.realie.com/v1` but can be customized

## API Endpoints

### `GET /api/search?address=...&radius=5`

Searches for properties near an address.

**Flow:**
1. Geocodes address with Nominatim
2. Calls Realie API with coordinates
3. Returns properties sorted by distance

**Response:**
```json
{
  "properties": [
    {
      "address": "123 Main St, Irvine, CA 92602",
      "listPrice": 1100000,
      "beds": 4,
      "baths": 3,
      "sqft": 2450,
      "distance": 0.5,
      "listingText": "Beautiful home...",
      "propertyType": "Single Family Residence"
    }
  ],
  "center": {
    "address": "Irvine, CA",
    "lat": 33.6846,
    "lon": -117.8265
  },
  "source": "realie" // or "mock" if Realie unavailable
}
```

### `POST /api/analyze`

Analyzes a property using Claude.

**Flow:**
1. Fetches property details from Realie (if available)
2. Sends to Claude with property data
3. Claude generates trust score and analysis
4. Stores results in database

## Fallback Behavior

- **No Realie API key**: Uses mock property data
- **Realie API fails**: Falls back to mock data
- **No Claude API key**: Uses mock analysis data
- **Claude API fails**: Falls back to mock analysis

The app always works, even if APIs are unavailable!

## Files Modified

1. **`lib/realie.ts`** - New Realie API client
2. **`app/api/search/route.ts`** - Integrated Realie API
3. **`app/api/analyze/route.ts`** - Uses Realie data in analysis
4. **`lib/claude.ts`** - Accepts Realie property data
5. **`lib/prompts.ts`** - Includes Realie data in prompts

## Testing

1. **Test search**: `curl "http://localhost:3000/api/search?address=Irvine,CA"`
2. **Test analysis**: Use the UI to search and analyze a property
3. **Check logs**: Server console shows which APIs are being used

## Notes

- Realie API response format may vary - adjust field mapping in `lib/realie.ts` if needed
- Distance calculation uses Haversine formula
- Properties are sorted by distance from search center
- Realie data enhances Claude's analysis accuracy
