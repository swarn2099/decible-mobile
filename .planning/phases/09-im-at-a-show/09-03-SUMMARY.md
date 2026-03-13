---
phase: 09-im-at-a-show
plan: "03"
subsystem: scraper-layers-vercel
tags: [playwright, llm, anthropic, show-checkin, vercel, founder-badge, stamp]
dependency_graph:
  requires: [09-01, 09-02]
  provides: [layer5-playwright, layer6-llm, show-checkin-endpoint, founder-stamp-dual-award]
  affects: [09-04-PLAN, 09-05-PLAN]
tech_stack:
  added:
    - "@anthropic-ai/sdk (scraper, already present from Plan 01)"
    - "web_search_20250305 tool (Claude Haiku)"
  patterns:
    - playwright-page-text-extraction
    - date-variant-heuristic
    - llm-web-search-last-resort
    - fire-and-forget-vm-dispatch
    - founder-stamp-dual-award
    - haversine-layer1-fast-path
key_files:
  created:
    - ~/decibel/scraper/src/layers/layer5-website.ts
    - ~/decibel/scraper/src/layers/layer6-llm.ts
    - ~/decibel/src/app/api/mobile/show-checkin/route.ts
  modified:
    - ~/decibel/scraper/src/server.ts
    - ~/decibel/tsconfig.json
decisions:
  - "Layer 5 uses date-variant heuristics (Jun 14 / June 14 / 6/14 patterns) to find artist names near date text on venue websites"
  - "Layer 6 always returns confidence low — LLM web search results require user confirmation via link paste"
  - "tsconfig.json excludes scraper/ directory to prevent Vercel build from picking up @anthropic-ai/sdk (not installed in Vercel project)"
  - "show-checkin POST returns is_founder_available+founder_fan_id per performer for instant UI state without extra roundtrip"
  - "PUT handler does race-safe founder INSERT: catch 23505 conflict, re-check to confirm ownership"
metrics:
  duration_seconds: 420
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 2
  completed_date: "2026-03-13"
---

# Phase 9 Plan 03: Layer 5 (Playwright) + Layer 6 (LLM) + Vercel show-checkin Summary

Playwright venue website scrape (medium confidence), Claude Haiku web search fallback (low confidence), and the Vercel show-checkin endpoint that ties the entire scrape system together with Layer 1 fast path and fire-and-forget VM dispatch.

## What Was Built

### Task 1: Layer 5 + Layer 6 + Server Waterfall

**layer5-website.ts** — Playwright venue website scrape:
- `scrapeVenueWebsite(venueUrl, venueName, date)` — opens venue URL in Playwright
- Extracts full `document.body.innerText`, looks for date variants (`Jun 14`, `June 14`, `6/14`, etc.)
- Scans ±10 lines around each date line for artist/DJ name candidates
- Heuristic filter: rejects URLs, venue name itself, nav chrome (`home|about|tickets|...`), long strings, pure numbers
- Returns `confidence: 'medium'`, `source: 'playwright'`
- 10-second total timeout via `Promise.race`, `scrapeWithBrowser` for context cleanup
- Returns `null` on any error or no lineup found

**layer6-llm.ts** — Claude Haiku web search:
- `queryLLMForLineup(venueName, city, date)` — sends formatted prompt to `claude-3-5-haiku-20241022`
- Uses `web_search_20250305` tool for real-time lineup lookup
- Parses response: finds text block, extracts JSON array via regex, handles markdown code fences
- ALWAYS returns `confidence: 'low'` — LLM results require user link paste confirmation
- 15-second timeout, returns `null` on any error

**server.ts** — Full waterfall now active:
- Layer 1 (DB) → Layer 3 (geocode) + Layer 2 (event APIs in parallel) → Layer 5 (Playwright) → Layer 6 (LLM) → empty fallback
- Every path writes to `search_results` — mobile client gets Realtime notification regardless of outcome
- 202 response is immediate; waterfall runs async after response is sent
- Try/catch safety net writes error fallback result so mobile never hangs

### Task 2: POST/PUT /api/mobile/show-checkin

**POST handler** — Layer 1 fast path + fire-and-forget:
- Auth: `getAuthEmail` via Bearer token (same pattern as check-in)
- Body: `{ lat, lng, local_date, venue_hint? }`
- Layer 1: fetch all venues, Haversine filter to 200m, query `event_artists` + `events` tables for tonight
- Enrich each performer with `is_founder_available` + `founder_fan_id` (parallel founder_badges check)
- Also merges `user_tagged_events` crowdsourced performers
- Returns `{ status: 'found', venue, performers }` immediately on hit
- On miss: `crypto.randomUUID()` searchId, unawaited fetch to `VM_SCRAPER_URL/scrape` with `x-scraper-secret`
- Returns `{ status: 'searching', searchId }` — mobile subscribes Realtime on searchId

**PUT handler** — Founder + Stamp dual award:
- Body: `{ venue_id, performer_ids, local_date }`
- Per performer: check founder_badges, INSERT if no founder (race-safe: 23505 = conflict, ignore)
- Re-check after INSERT to confirm ownership vs losing race
- INSERT `collections` with `collection_type: 'stamp'`, `capture_method: 'location'`, `verified: true`
- Returns `{ stamps: [...], founders: [performer_ids_where_founded] }`

**Deployment:**
- Vercel production: https://www.decible.live
- tsconfig.json updated to exclude scraper/ from Vercel build (Rule 3 fix — scraper imports @anthropic-ai/sdk not present in Vercel project)
- VM scraper rebuilt and restarted via PM2

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vercel build failed: scraper/ picked up by tsconfig**
- **Found during:** Task 2 deployment
- **Issue:** `tsconfig.json` uses `include: ["**/*.ts"]` which captured `scraper/src/layers/layer6-llm.ts` during Vercel build; `@anthropic-ai/sdk` not installed in Vercel project
- **Fix:** Added `"scraper"` to `tsconfig.json` exclude array
- **Files modified:** `~/decibel/tsconfig.json`
- **Commit:** `c8da1b5`

**2. [Deviation] Layer 2 (event APIs) already existed from Plan 02**
- **Found during:** Task 1 implementation
- **Issue:** `layer2-apis.ts` was already present (Plan 02 was executed but SUMMARY.md was missing); linter kept restoring it to server.ts imports
- **Resolution:** Accepted the full waterfall (L1→L2+L3→L5→L6) as a better outcome — all layers integrated correctly
- **Impact:** Server.ts now includes Layer 2 integration (RA, DICE, EDMTrain, Songkick, Bandsintown), ahead of plan

## Self-Check: PASSED

All created files found on disk:
- FOUND: `~/decibel/scraper/src/layers/layer5-website.ts`
- FOUND: `~/decibel/scraper/src/layers/layer6-llm.ts`
- FOUND: `~/decibel/src/app/api/mobile/show-checkin/route.ts`

All commits found in git log:
- FOUND: `08df9ca` — feat(09-03): Layer 5 + Layer 6 + waterfall
- FOUND: `31d588d` — feat(09-03): show-checkin endpoint
- FOUND: `c8da1b5` — fix(09-03): tsconfig scraper exclusion
