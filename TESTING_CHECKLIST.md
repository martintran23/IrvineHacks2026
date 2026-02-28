# Testing Checklist for DealBreakr AI

## Pre-Testing Setup

- [x] Realie API key configured
- [x] Anthropic API key configured
- [x] Claude Sonnet 4 model set
- [x] Database initialized and seeded
- [x] Budget management system active
- [x] Rate limiting enabled
- [x] Caching enabled

## Complete Workflow Test

### 1. Property Search Flow
- [ ] Search for "Irvine, CA" in the search box
- [ ] Verify Nominatim geocoding works (check server logs)
- [ ] Verify Realie API is called (check server logs for "[Realie] 🔍")
- [ ] Verify properties appear in dropdown
- [ ] Verify properties show price, beds, baths, sqft, distance
- [ ] Select a property from dropdown

### 2. Analysis Flow
- [ ] Property auto-fills form when selected
- [ ] Click "Analyze" button
- [ ] Verify loading state appears
- [ ] Check server logs for:
  - [ ] "[Realie] ✅ Found property" (if property found in Realie)
  - [ ] "[DealBreakr] 🤖 Calling Claude API"
  - [ ] "[DealBreakr] ✅ Claude API response received"
  - [ ] Cost tracking logs
- [ ] Verify redirect to results page
- [ ] Verify results page shows:
  - [ ] Trust score ring
  - [ ] Property snapshot
  - [ ] Claims list
  - [ ] Category breakdown charts
  - [ ] Comparables table

### 3. Budget Management Test
- [ ] Check usage widget in bottom-right corner
- [ ] Verify it shows current cost
- [ ] Make multiple analyses
- [ ] Verify cost increases
- [ ] Test `/api/usage` endpoint:
  ```bash
  curl http://localhost:3000/api/usage
  ```
- [ ] Verify caching works (analyze same property twice - second should be instant)

### 4. API Endpoint Tests

#### Test Claude API
```bash
curl http://localhost:3000/api/test-claude
```
Expected: `{"status": "success", ...}`

#### Test Property Search
```bash
curl "http://localhost:3000/api/search?address=Irvine,CA"
```
Expected: Properties array with Realie data

#### Test Analysis
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"address": "123 Main St, Irvine, CA"}'
```
Expected: `{"id": "...", "status": "complete"}`

### 5. Error Handling Tests
- [ ] Test with invalid address (should fallback gracefully)
- [ ] Test with Realie API down (should use mock data)
- [ ] Test with Claude API down (should use mock analysis)
- [ ] Test rate limiting (make 6 rapid calls - 6th should be blocked)
- [ ] Test budget limit (if over $4.50, should use mock)

### 6. UI/UX Tests
- [ ] Landing page loads correctly
- [ ] Property search autocomplete works
- [ ] Keyboard navigation (arrow keys, Enter, Escape)
- [ ] Loading states display properly
- [ ] Error messages show when needed
- [ ] Results page displays all components
- [ ] War room page works
- [ ] Claim cards expand/collapse
- [ ] Action items can be checked off

## Expected Log Output

When everything works, you should see:

```
[Realie] 🔍 Searching properties near 33.6846, -117.8265 (radius: 5mi)
[Realie] ✅ Found 6 properties
[API] Starting analysis for: 123 Main St, Irvine, CA
[DealBreakr] 🤖 Calling Claude API for: 123 Main St, Irvine, CA
[DealBreakr] 📝 Estimated input tokens: ~2000
[DealBreakr] 💰 Current cost: $0.05 / $5.00
[DealBreakr] ✅ Claude API response received in 3500ms
[DealBreakr] 📊 Tokens: 2150 in, 3200 out
[DealBreakr] 💰 Total cost: $0.10 / $5.00
[DealBreakr] ✅ Analysis complete: 12 claims, trust score: 65
[API] Analysis complete - Trust Score: 65, Claims: 12
```

## Troubleshooting

### Realie API not working?
- Check API key in `.env`
- Check server logs for Realie API errors
- Verify API endpoint URL is correct
- Check if API requires different authentication

### Claude API not working?
- Check API key in `.env`
- Verify model name: `claude-sonnet-4-20250514`
- Check budget hasn't been exceeded
- Check rate limits

### Budget exceeded?
- Check `/api/usage` endpoint
- System automatically uses mock data at $4.50
- Reset usage stats if needed (restart server)

## Performance Benchmarks

- Nominatim geocoding: < 1 second
- Realie API search: < 2 seconds
- Claude analysis: 3-5 seconds
- Total workflow: 5-8 seconds

## Success Criteria

✅ All three APIs working (Nominatim, Realie, Claude)
✅ Properties appear in search
✅ Analysis completes successfully
✅ Budget tracking accurate
✅ Caching prevents duplicate calls
✅ UI displays all data correctly
✅ Error handling graceful
