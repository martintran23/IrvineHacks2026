/**
 * Zillow listing scraper — fetches Zillow search for an address and extracts
 * list price and listing snippet for use with Claude.
 *
 * The search uses the address you pass in: it is sent as usersSearchTerm in
 * Zillow's searchQueryState (see buildSearchUrl). So "123 Main St, City, CA 90210"
 * is used as the search query.
 *
 * Why Zillow often blocks:
 * - They detect server/datacenter IPs and non-browser requests.
 * - They serve a captcha or a minimal HTML shell; real listing data loads via
 *   JavaScript in the browser, so a plain fetch() gets no listing content.
 * - 403/429 responses mean they are rejecting the request.
 *
 * For production, use Zillow's official API (zillow.com/webservice or developer
 * portal) if you have access. Alternatively use a headless browser (Puppeteer/Playwright)
 * or a scraping API that runs in a real browser.
 */

export interface ZillowScrapeResult {
  listPrice: number | null;
  listingText: string | null;
  zillowUrl: string | null;
  status: "ok" | "not_found" | "blocked" | "error";
}

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function buildSearchUrl(address: string): string {
  return `https://www.zillow.com/homes/for_sale/?searchQueryState=${encodeURIComponent(
    JSON.stringify({
      pagination: {},
      usersSearchTerm: address.trim(),
      mapBounds: {},
      regionSelection: [],
      isMapVisible: true,
      filterState: {},
      isListVisible: true,
    })
  )}`;
}

/** Extract first plausible list price (e.g. $1,234,567) from text. */
function extractPrice(html: string): number | null {
  const patterns = [
    /\$[\d,]{6,12}(?=\s*<\/)/g,
    /"price":\s*(\d+)/g,
    /"listPrice":\s*(\d+)/g,
    /data-testid="price"[^>]*>[\s\$]*([\d,]+)/g,
    /\$([\d,]+)\s*(?:<\/span>|<\/div>|$)/g,
  ];
  for (const re of patterns) {
    const matches = html.matchAll(re);
    for (const m of matches) {
      const raw = (m[1] ?? m[0]).replace(/[$,]/g, "");
      const num = parseInt(raw, 10);
      if (num >= 10000 && num <= 999_999_999) return num;
    }
  }
  return null;
}

/** Extract a short listing/snippet from the page (description or key details). */
function extractSnippet(html: string, maxLen: number = 1500): string | null {
  const descRe = /"description"\s*:\s*"([^"]+)"/;
  const m = html.match(descRe);
  if (m?.[1]) {
    const decoded = m[1].replace(/\\u0026/g, "&").replace(/\\n/g, " ");
    return decoded.length > maxLen ? decoded.slice(0, maxLen) + "…" : decoded;
  }
  const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/);
  if (ogDesc?.[1]) return ogDesc[1].slice(0, maxLen);
  return null;
}

/**
 * Scrape Zillow for a given address. Returns list price and optional listing
 * text when found. May return null if Zillow blocks the request or the page
 * structure changes.
 */
export async function scrapeZillowListing(address: string): Promise<ZillowScrapeResult> {
  if (!address?.trim()) {
    return { listPrice: null, listingText: null, zillowUrl: null, status: "error" };
  }

  const url = buildSearchUrl(address);

  try {
    console.log("[Zillow scraper] Searching for address:", address.trim(), "| URL:", url.slice(0, 120) + "...");
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      // 403/429 are expected when Zillow blocks server/datacenter requests
      if (res.status === 403 || res.status === 429) {
        console.log("[Zillow scraper] Zillow returned", res.status, "- blocking server requests (expected). Use Realie + manual list price.");
        return { listPrice: null, listingText: null, zillowUrl: url, status: "blocked" };
      }
      console.warn("[Zillow scraper] Unexpected response", res.status, res.statusText);
      return { listPrice: null, listingText: null, zillowUrl: null, status: "error" };
    }

    const html = await res.text();
    // Zillow often returns a challenge/captcha page or minimal shell for server requests (no real listing HTML)
    if (html.includes("captcha") || html.includes("CAPTCHA") || html.includes("blocked")) {
      return { listPrice: null, listingText: null, zillowUrl: url, status: "blocked" };
    }
    if (html.length < 3000) {
      return { listPrice: null, listingText: null, zillowUrl: url, status: "blocked" };
    }

    const listPrice = extractPrice(html);
    const listingText = extractSnippet(html);

    return {
      listPrice,
      listingText,
      zillowUrl: url,
      status: listPrice || listingText ? "ok" : "not_found",
    };
  } catch (err) {
    console.warn("[Zillow scraper] Error:", err);
    return { listPrice: null, listingText: null, zillowUrl: null, status: "error" };
  }
}
