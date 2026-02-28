# Claude API Budget Management

## Overview

The system includes comprehensive rate limiting and cost tracking to stay within your $5 budget.

## Cost Protection Features

### 1. **Rate Limiting**
- **5 calls per minute** - Prevents burst usage
- **30 calls per hour** - Prevents rapid consecutive calls
- Automatically blocks calls when limits are reached

### 2. **Budget Tracking**
- **Hard limit**: $4.50 (stops all API calls)
- **Warning threshold**: $4.00 (logs warnings)
- **Budget**: $5.00 total
- Tracks actual token usage from API responses

### 3. **Caching System**
- Caches analysis results for 24 hours
- Avoids duplicate API calls for the same property
- Saves significant costs on repeated searches

### 4. **Cost Estimation**
- Uses Claude 3.5 Sonnet pricing:
  - Input: $3 per 1M tokens
  - Output: $15 per 1M tokens
- Estimates cost before each call
- Tracks actual costs from API responses

## Usage Monitoring

### Check Current Usage

**API Endpoint:**
```bash
curl http://localhost:3000/api/usage
```

**Response:**
```json
{
  "usage": {
    "estimatedCost": 0.45,
    "budgetLimit": 5.0,
    "remaining": 4.55,
    "percentageUsed": 9.0,
    "totalCalls": 3
  },
  "status": "ok",
  "canMakeCalls": true
}
```

### UI Display

A usage widget appears in the bottom-right corner showing:
- Current cost vs budget
- Percentage used
- Status indicator (green/yellow/red)
- Number of API calls made

## How It Works

1. **Before API Call:**
   - Checks cache (avoids duplicate calls)
   - Checks rate limits (prevents burst usage)
   - Checks budget (stops at $4.50)

2. **During API Call:**
   - Records actual token usage
   - Calculates cost
   - Updates usage statistics

3. **After API Call:**
   - Caches result for 24 hours
   - Logs cost and remaining budget
   - Shows warnings if approaching limit

## Cost Estimates

**Per Analysis:**
- Average input: ~2,000 tokens = $0.006
- Average output: ~3,000 tokens = $0.045
- **Total per analysis: ~$0.05**

**With $5 Budget:**
- **~100 analyses** possible
- With caching: Even more (cached analyses are free)

## Best Practices

1. **Use caching** - Same property analyzed twice uses cache (free)
2. **Monitor usage** - Check `/api/usage` regularly
3. **Watch for warnings** - System warns at $4.00
4. **Rate limits help** - Prevents accidental overuse

## Configuration

All settings are in `lib/claude-rate-limit.ts`:

```typescript
const BUDGET_LIMIT = 5.0;        // Total budget
const WARNING_THRESHOLD = 4.0;   // Warn at this amount
const SAFE_LIMIT = 4.5;          // Hard stop here
const MAX_CALLS_PER_MINUTE = 5;   // Rate limit
const MAX_CALLS_PER_HOUR = 30;    // Rate limit
```

## Status Indicators

- 🟢 **Green** - Under $4.00 (safe)
- 🟡 **Yellow** - $4.00-$4.50 (warning)
- 🔴 **Red** - $4.50+ (blocked)

## Reset Usage (if needed)

To reset usage stats (for testing or new billing period):

```typescript
import { resetUsageStats } from "@/lib/claude-rate-limit";
resetUsageStats();
```

Or restart the server (in-memory stats reset on restart).
