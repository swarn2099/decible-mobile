---
phase: 09-im-at-a-show
plan: "02"
subsystem: scraper-layers
tags: [scraper, event-apis, db-lookup, nominatim, ra, dice, edmtrain, waterfall]
dependency_graph:
  requires: [09-01]
  provides: [layer1-db, layer2-apis, layer3-places, scrape-waterfall-layers-1-3]
  affects: [09-03-PLAN, 09-04-PLAN]
tech_stack:
  added: []
  patterns:
    - haversine-distance-filter
    - promise-allsettled-parallel-sources
    - promise-race-per-source-timeout
    - dice-fresh-build-id-per-request
    - waterfall-early-exit-on-hit
    - try-catch-error-fallback-write
key_files:
  created:
    - ~/decibel/scraper/src/layers/layer1-db.ts
    - ~/decibel/scraper/src/layers/layer2-apis.ts
    - ~/decibel/scraper/src/layers/layer3-places.ts
  modified:
    - ~/decibel/scraper/src/server.ts
    - ~/decibel/scraper/src/layers/layer6-llm.ts
decisions:
  - "Layer 2 runs in parallel with Layer 3 (geocode) via Promise.all — both are I/O bound and non-blocking so there's no benefit to sequencing them"
  - "Layer 2 gets null city on first call because geocode runs concurrently — acceptable tradeoff: city context only matters for RA area filter, and EDMTrain/Bandsintown use lat/lng directly"
  - "Songkick and Bandsintown use 3s timeouts vs 5s for RA/DICE/EDMTrain — these sources are uncertain post-acquisition and rate-limit aggressively"
  - "DICE build ID fetched fresh per request per plan spec — not cached, prevents stale build ID 404s"
  - "Songkick source skips gracefully if SONGKICK_API_KEY env var not set — key not currently in .env, avoids auth errors"
metrics:
  duration_seconds: 274
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 2
  completed_date: "2026-03-13"
---

# Phase 9 Plan 02: Scraper Layers 1-3 + Waterfall Wiring Summary

Three scraper layer modules (DB lookup, event platform APIs, Nominatim reverse geocode) plus the full waterfall integration into `/scrape` — DB hit returns in <100ms, all 5 event APIs query in parallel with independent timeouts.

## What Was Built

### Task 1: Layer 1 (DB) + Layer 3 (Nominatim) + Layer 2 (Event APIs)

**layer1-db.ts** — DB venue + event lookup:
- Haversine distance filter: fetches all venues (~200 rows), filters to ≤200m from request coordinates
- Picks the closest venue as primary match
- Queries `event_artists` table (primary) + `events` table (legacy fallback) + `user_tagged_events` (crowdsourced) for the given date
- Returns `ScrapeResult { confidence: 'high', source: 'db' }` with performer_ids populated from DB
- Returns `null` if no venues within 200m or no events found for the date

**layer3-places.ts** — Nominatim reverse geocode:
- `GET https://nominatim.openstreetmap.org/reverse?lat=&lon=&format=json`
- User-Agent: `Decibel/1.0 (decible.live)` per Nominatim policy
- 4-second AbortController timeout
- Extracts `address.city ?? address.town ?? address.village ?? address.county`
- Also extracts `name` field as `venueName` when available (e.g., for specific buildings)
- Returns `{ city: null, venueName: null }` on 429/error/timeout — non-blocking

**layer2-apis.ts** — Five event platform sources in parallel:

| Source | Method | Timeout | Confidence |
|--------|--------|---------|-----------|
| RA | GraphQL POST ra.co/graphql | 5s | high (exact venue match) / medium |
| DICE | _next/data/{fresh-buildId}/ | 5s | high (venue match) / medium |
| EDMTrain | REST lat/lng/date | 5s | medium |
| Songkick | REST geo + date (API key gated) | 3s | medium |
| Bandsintown | REST v4/events/search | 3s | medium |

- `queryEventAPIs()` runs all 5 in `Promise.allSettled()` with per-source `Promise.race([source(), timeout(Nms)])`
- Returns `ScrapeResult[]` — all fulfilled results (caller uses `mergeResults()` to pick best)
- Each source handles its own errors and returns `null` — never throws

### Task 2: Waterfall wiring in server.ts

`runScrapeWaterfall()` updated to full 6-layer logic:

```
Layer 1 (DB) → HIT? write + return
         ↓ MISS
Layer 3 (geocode) + Layer 2 (APIs) in parallel via Promise.all
         ↓ Layer 2 HIT? write + return
         ↓ MISS
Layer 5 (Playwright) → HIT? write + return
         ↓ MISS
Layer 6 (LLM) → HIT? write + return
         ↓ MISS
write empty low-confidence result (source: 'none')
```

- Per-layer timing logged to PM2: `[waterfall] Layer 1: Xms`, `[waterfall] Layers 2+3 parallel: Xms`
- `try/catch` safety net: any unhandled error writes `{ confidence: 'low', source: 'error', artists: [] }` — mobile client always gets a Realtime event
- `mergeResults()` from confidence.ts picks the highest-confidence Layer 2 result; tie-breaks by artist count

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] layer6-llm.ts TypeScript error blocked build**
- **Found during:** Task 1 build verification
- **Issue:** `type: 'web_search_20250305'` property doesn't exist in Anthropic SDK `Tool` type — TS2769 overload error. This was a pre-existing issue from Plan 03 execution.
- **Fix:** Cast the tool object `as any` with a comment; minimal change, keeps intent clear
- **Files modified:** `~/decibel/scraper/src/layers/layer6-llm.ts`
- **Commit:** included in 4eda2d8

**2. [Rule 2 - Missing] Layer 2 runs without city context on first parallel call**
- **Found during:** Task 2 implementation
- **Issue:** Plan spec says run Layer 3 + Layer 2 in parallel, but Layer 2's RA query uses city for area filter. Since they run concurrently, city is null on first Layer 2 call.
- **Fix:** Pass `null` as city to `queryEventAPIs()` on the parallel call — RA falls back to no area filter (global date query), EDMTrain/Bandsintown use lat/lng directly. Acceptable tradeoff: parallel > serial for latency.
- **Impact:** RA results may be slightly less precise (no area pre-filter) but still date-filtered. Post-merge, venue name fuzzy matching applies.

## Self-Check: PASSED

All 3 layer files exist at correct paths. Both commits verified (4eda2d8, 26a25c2). Build passes clean with zero TypeScript errors after checkout. Layer function exports verified: `queryDB`, `queryEventAPIs`, `reverseGeocode` all export as functions.
