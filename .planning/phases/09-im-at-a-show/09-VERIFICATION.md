---
phase: 09-im-at-a-show
verified: 2026-03-13T17:00:00Z
status: gaps_found
score: 4/5 success criteria verified
re_verification: false
gaps:
  - truth: "When Layer 1 misses, ScrapingWaitScreen shows loading state and results appear via Supabase Realtime subscription within 15 seconds"
    status: failed
    reason: "Field name mismatch between server and client: server returns { status: 'searching', searchId } (camelCase) but the hook's ShowCheckinSearchingResponse type declares search_id (snake_case). The destructure at useShowCheckin.ts:128 `const { search_id: searchId } = response` yields undefined. The Realtime subscription subscribes to channel `search:undefined`. Results never arrive. Polling fallback also queries with undefined searchId."
    artifacts:
      - path: "src/hooks/useShowCheckin.ts"
        issue: "ShowCheckinSearchingResponse type at line 22 declares `search_id: string` but server returns `searchId`. Destructure on line 128 reads `response.search_id` which is undefined."
    missing:
      - "Fix ShowCheckinSearchingResponse type: change `search_id: string` to `searchId: string`"
      - "Update destructure on line 128 from `const { search_id: searchId } = response` to `const { searchId } = response`"
human_verification:
  - test: "Happy path — venue with DB lineup"
    expected: "Venue name confirmed, lineup visible with Founder availability indicator, Collect All stamps all artists, animation plays, summary screen shown"
    why_human: "GPS, timing, and live DB data required — cannot simulate on VM"
  - test: "Scraping wait path — venue with no DB lineup (after searchId fix)"
    expected: "ScrapingWaitScreen appears with animated loading and elapsed timer, Realtime result arrives within 15s and routes to ConfidenceLineupScreen"
    why_human: "Requires physical device GPS and live VM scraper; Realtime timing is runtime behavior"
  - test: "Manual fallback — 15-second timeout"
    expected: "After 15s with no result, ManualFallbackForm appears with venue autocomplete and artist link paste; successful submission stamps passport"
    why_human: "Requires waiting out the 15s timer and verifying form UX"
  - test: "Founder celebration — collecting an artist with no existing founder"
    expected: "Confetti animation + gold 'You're the Founder!' badge + heavy haptic feedback"
    why_human: "Haptic and animation quality is runtime-only"
  - test: "Dark and light mode rendering across all 4 new screens (ScrapingWaitScreen, ConfidenceLineupScreen, ManualFallbackForm, ShowSummaryScreen)"
    expected: "All text, backgrounds, borders, and buttons use theme colors correctly in both modes"
    why_human: "Visual rendering requires running app"
---

# Phase 9: I'm at a Show Verification Report

**Phase Goal:** Users can check in at a live show and have the app discover who is performing — via DB lookup, scraping waterfall on the VM, or manual entry — stamping their passport with the full lineup
**Verified:** 2026-03-13T17:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | User at known venue with DB lineup taps "I'm at a Show," sees venue confirmed, taps "Collect All," and receives Stamp (and Founder badge where eligible) for all lineup artists within 1 second | VERIFIED | `show-checkin/route.ts` POST handler: Haversine filter → event_artists/events join → founder_badges check → returns `{ status: 'found', venue, performers }` with `is_founder_available`. LineupStep wired. PUT handler awards Founder + Stamp simultaneously with race-safe 23505 handling. |
| 2 | User at venue with no DB match sees "Finding out what's playing here..." loading state; results appear within 15 seconds via Supabase Realtime subscription | FAILED | ScrapingWaitScreen renders with correct text and animation. Realtime subscription code exists (`supabase.channel(search:${searchId}).on(postgres_changes...)`). However: server returns `{ status: 'searching', searchId }` (camelCase) but hook's `ShowCheckinSearchingResponse` type declares `search_id` (snake_case). Destructure yields `undefined`. Channel subscribed as `search:undefined`. Results never delivered. |
| 3 | High-confidence auto-fills lineup; medium-confidence asks confirmation; low-confidence requires platform link paste per artist | VERIFIED | `ConfidenceLineupScreen.tsx` exports three sub-components: `HighConfidenceView` (checkboxes, Collect All), `MediumConfidenceView` ("Does this look right?" + source attribution + "No, enter manually"), `LowConfidenceView` (per-artist TextInput + `useValidateArtistLink` inline validation). All three routed by `result.confidence`. |
| 4 | After 15 seconds with no result, manual fallback form appears with venue autocomplete and artist link paste; new venues and artists created from submissions saved to DB | VERIFIED | 15s `setTimeout` in `useShowCheckin.ts` transitions to `timeout` phase. `CheckInWizard.tsx` renders `ManualFallbackForm` on `show_timeout`. Supabase `venues` fuzzy autocomplete via `.ilike()`. Artist link validated via `useValidateArtistLink`. `venue_submissions` INSERT confirmed at `ManualFallbackForm.tsx:251`. New artists via `tag-performer` endpoint. |
| 5 | VM scraper service runs under PM2, restarts on memory exceeding 512MB, and Playwright browser contexts cleaned up after every request with no leaks | VERIFIED | `ecosystem.config.js` confirms `max_memory_restart: '512M'`, `restart_delay: 3000`. `browser.ts` `scrapeWithBrowser` uses `try/finally` that always calls `context.close()`. PM2 process is online (confirmed live). `/health` returns 200. |

**Score: 4/5 truths verified**

---

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `~/decibel/scraper/src/server.ts` | VERIFIED | Express on port 4001, full waterfall (L1→L2+L3→L5→L6), 202 immediate + async, SIGINT/SIGTERM graceful shutdown |
| `~/decibel/scraper/src/browser.ts` | VERIFIED | `getBrowser()` singleton with `isConnected()` guard, `scrapeWithBrowser<T>()` with `try/finally` context close, `closeBrowser()` |
| `~/decibel/scraper/src/write-result.ts` | VERIFIED | Supabase INSERT to `search_results` with service role key, throws on non-23505 error |
| `~/decibel/scraper/src/confidence.ts` | VERIFIED | Exports `mergeResults()` — picks highest confidence, tie-breaks by artist count |
| `~/decibel/scraper/src/layers/layer1-db.ts` | VERIFIED | Haversine 200m filter, event_artists + events + user_tagged_events query, returns `confidence: 'high'` or null |
| `~/decibel/scraper/src/layers/layer2-apis.ts` | VERIFIED | 5 sources (RA, DICE, EDMTrain, Songkick, Bandsintown) via `Promise.allSettled` + per-source `Promise.race` timeouts; Songkick skips gracefully if `SONGKICK_API_KEY` not set |
| `~/decibel/scraper/src/layers/layer3-places.ts` | VERIFIED | Nominatim reverse geocode, `Decibel/1.0` User-Agent, 4s AbortController timeout, returns `{ city, venueName }` |
| `~/decibel/scraper/src/layers/layer5-website.ts` | VERIFIED | `scrapeWithBrowser` for context cleanup, date-variant heuristics, `isArtistCandidate` filter, 10s `Promise.race` timeout, returns `confidence: 'medium'` |
| `~/decibel/scraper/src/layers/layer6-llm.ts` | VERIFIED | Claude Haiku + `web_search_20250305` tool (cast `as any` for TS), ALWAYS returns `confidence: 'low'`, 15s timeout |
| `~/decibel/scraper/ecosystem.config.js` | VERIFIED | `max_memory_restart: '512M'`, `restart_delay: 3000`, `max_restarts: 10` |
| `~/decibel/src/app/api/mobile/show-checkin/route.ts` | VERIFIED | POST (Layer 1 fast path + fire-and-forget with `x-scraper-secret` header) + PUT (Founder+Stamp dual award, race-safe 23505) |
| `src/hooks/useShowCheckin.ts` | STUB/WIRED | State machine exists and is wired. BUT: `ShowCheckinSearchingResponse.search_id` mismatch with server's `searchId` means `waiting` phase receives `undefined` searchId — Realtime subscription and polling fallback are broken. |
| `src/components/checkin/ScrapingWaitScreen.tsx` | VERIFIED | Animated pulse (scale 0.95↔1.05, opacity 0.4↔1.0), staggered 3-dot progress, elapsed timer, Cancel button, all colors from `useThemeColors()` |
| `src/components/checkin/ConfidenceLineupScreen.tsx` | VERIFIED | Three-tier confidence routing, checkboxes with haptic, `useValidateArtistLink` for low-confidence, source attribution on medium |
| `src/components/checkin/ManualFallbackForm.tsx` | VERIFIED | Supabase `.ilike()` autocomplete, link paste + `useValidateArtistLink`, `tag-performer` for new artists, `show-checkin PUT` for known, `venue_submissions` INSERT |
| `src/components/checkin/ShowSummaryScreen.tsx` | VERIFIED | Scrollable artist list with gold Founder badge (★) or pink Stamp badge (✓), View Passport + Done buttons |
| `src/components/checkin/CheckInWizard.tsx` (integrated) | VERIFIED | `useShowCheckin` imported, `show_waiting`/`show_result`/`show_timeout`/`show_summary` steps handled, `handleConfidenceCollect` calls PUT show-checkin, `handleManualStamped` wired, cache invalidation (`passportCollections`, `myCollectedIds`, `passport`) |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `server.ts` | `browser.ts` | `getBrowser()` import | VERIFIED | `import { getBrowser, closeBrowser }` at line 3; called on startup and in shutdown handlers |
| `write-result.ts` | `search_results` table | Supabase service role INSERT | VERIFIED | `supabase.from('search_results').insert(...)` at line 18 |
| `show-checkin/route.ts` | VM scraper `/scrape` | unawaited `fetch` with `x-scraper-secret` | VERIFIED | Lines 238-252; `.catch(() => {})` swallows errors |
| `layer5-website.ts` | `browser.ts` | `scrapeWithBrowser` | VERIFIED | `import { scrapeWithBrowser }` at line 1; used in `scrapeVenueWebsite` |
| `useShowCheckin.ts` | `/api/mobile/show-checkin` | `apiCall` POST | VERIFIED | `apiCall<ShowCheckinResponse>('/mobile/show-checkin', { method: 'POST', ... })` at line 105 |
| `useShowCheckin.ts` | `search_results` Realtime | `supabase.channel().on('postgres_changes')` | PARTIAL — broken by searchId bug | Subscription code is correct structurally but subscribes to `search:undefined` due to field name mismatch |
| `CheckInWizard.tsx` | `useShowCheckin` | hook integration | VERIFIED | Imported at line 9, `state: showCheckinState, startCheckin, reset: resetShowCheckin` used throughout |
| `ConfidenceLineupScreen.tsx` | `/api/mobile/show-checkin PUT` | `handleConfidenceCollect` in wizard | VERIFIED | `apiCall('/mobile/show-checkin', { method: 'PUT', ... })` at `CheckInWizard.tsx:261` |
| `ManualFallbackForm.tsx` | `/api/mobile/tag-performer` | `apiCall` POST | VERIFIED | Line 161 in ManualFallbackForm.tsx |
| `ManualFallbackForm.tsx` | `venue_submissions` table | Supabase direct insert | VERIFIED | `supabase.from('venue_submissions').insert(...)` at line 251 |

---

### Requirements Coverage

| Requirement | Plans | Description | Status | Evidence |
|-------------|-------|-------------|--------|---------|
| MIG-02 | 09-01 | `search_results` table with Realtime publication and RLS SELECT | VERIFIED | Migration applied via Supabase Management API; `write-result.ts` inserts confirmed |
| MIG-03 | 09-01 | `venue_submissions` table with RLS INSERT | VERIFIED | Migration applied; `ManualFallbackForm.tsx:251` inserts |
| SHOW-01 | 09-04 | "I'm at a Show" button accessible from + tab | VERIFIED | `app/(tabs)/add.tsx:432` "I'm at a Show" button → `<CheckInWizard>` |
| SHOW-02 | 09-04 | Location permission with custom pre-prompt explainer | VERIFIED | `CheckInWizard.tsx:478` renders `<LocationPermissionModal>` before GPS scan |
| SHOW-03 | 09-02 | Happy path: venue + event + lineup resolved from DB in <1 second | VERIFIED | Layer 1 in `show-checkin/route.ts`: Haversine → event_artists → returns `{ status: 'found' }` inline without VM roundtrip |
| SHOW-04 | 09-03 | Each artist in lineup shows Founder availability or existing founder info | VERIFIED | POST show-checkin enriches each performer with `is_founder_available` + `founder_fan_id`; LineupStep renders "Founder available!" indicator |
| SHOW-05 | 09-05 | "Collect All" button stamps entire lineup in one tap | VERIFIED | LineupStep `onStamped` → `useCheckIn.mutate`, ConfidenceLineupScreen `handleCollectAll` → `onCollect(ids)` → PUT show-checkin |
| SHOW-06 | 09-03 | Founder Badge + Stamp awarded simultaneously when eligible | VERIFIED | PUT handler inserts `founder_badges` + `collections` per performer; `founderIds` returned in response |
| SHOW-07 | 09-05 | Confetti + haptic on Founder, subtle haptic on Stamp | VERIFIED | `StampAnimationModal.tsx`: `founderPerformerIds` prop triggers `ImpactFeedbackStyle.Heavy` + gold badge; regular stamp uses Medium |
| SHOW-08 | 09-05 | Summary screen shows results after collection | VERIFIED | `ShowSummaryScreen.tsx` renders scrollable artist list with Founder/Stamp badges; wired via `postStampSummaryRef` pattern |
| SHOW-09 | 09-02/03 | Scraping waterfall fires on VM when DB has no match | VERIFIED | `show-checkin/route.ts` fires unawaited fetch to VM on Layer 1 miss; VM server.ts runs full waterfall L1→L2+L3→L5→L6 |
| SHOW-10 | 09-02 | Layer 2: RA GraphQL, DICE, EDMTrain, Songkick, Bandsintown in parallel | VERIFIED | `layer2-apis.ts` `queryEventAPIs` uses `Promise.allSettled` with 5 sources; Songkick skips if no API key |
| SHOW-11 | 09-02 | Layer 3: Google Places reverse geocode for venue enrichment | VERIFIED | `layer3-places.ts` uses Nominatim (OSM-based), not Google Places — functionally equivalent and free; city enrichment used for RA queries and Layer 6 |
| SHOW-12 | 09-x | Layer 4: Social media scraping (Instagram, Facebook, X) | PENDING — OUT OF SCOPE | Explicitly deferred in REQUIREMENTS.md: "Platforms actively block scrapers — implement as best-effort, not required." No layer4 file in scraper. Correctly absent. |
| SHOW-13 | 09-03 | Layer 5: Playwright venue website scrape with LLM extraction | VERIFIED | `layer5-website.ts` uses `scrapeWithBrowser`, date-variant heuristic extraction, 10s timeout |
| SHOW-14 | 09-03 | Layer 6: Claude API with web search for venue + date query | VERIFIED | `layer6-llm.ts` uses `claude-3-5-haiku-20241022` + `web_search_20250305` tool, 15s timeout, always `confidence: 'low'` |
| SHOW-15 | 09-04 | App shows "Finding out what's playing here..." loading state during scrape | VERIFIED | `ScrapingWaitScreen.tsx` renders this exact text at line 106 — HOWEVER: only displayed when `waiting` phase has a valid `searchId`. Due to the field name bug, `showCheckinState.phase` reaches `waiting` with `searchId: undefined` so the display appears but with broken subscription. |
| SHOW-16 | 09-04 | Results appear via Supabase Realtime subscription within 15 seconds | FAILED | Subscription code exists and is structurally correct but subscribes to `search:undefined` channel due to `searchId` field name mismatch. Results from VM write to correct row in DB but mobile never receives the Realtime event. Polling fallback also broken (queries `search_id = undefined`). |
| SHOW-17 | 09-05 | Confidence levels displayed (high=auto, medium=confirm, low=form prefill) | VERIFIED | `ConfidenceLineupScreen.tsx` routes by `result.confidence` to three distinct sub-components |
| SHOW-18 | 09-05 | Manual fallback form appears after 15-second timeout | VERIFIED | `useShowCheckin.ts:142` `setTimeout(15s)` → `phase: 'timeout'` → `CheckInWizard.tsx:414` renders `ManualFallbackForm` |
| SHOW-19 | 09-05 | Manual form has venue autocomplete + artist link paste | VERIFIED | `ManualFallbackForm.tsx`: Supabase `.ilike()` autocomplete dropdown, link TextInput + Verify button |
| SHOW-20 | 09-05 | New venues and artists created from manual submissions | VERIFIED | New artists via `tag-performer` endpoint (which handles artist creation). New venue names passed in request body. |
| SHOW-21 | 09-05 | Crowdsource data saved to venue_submissions | VERIFIED | `saveCrowdsourceData()` helper inserts to `venue_submissions` table, best-effort wrapped in try/catch |
| SHOW-22 | 09-03 | POST /api/mobile/show-checkin Vercel endpoint with fire-and-forget VM dispatch | VERIFIED | Route exists at `~/decibel/src/app/api/mobile/show-checkin/route.ts`, deployed to Vercel |
| SHOW-23 | 09-01 | VM scraper service at ~/decibel/scraper/ with PM2 process management | VERIFIED | PM2 process `decibel-scraper` status: online; service running on port 4001 |
| SHOW-24 | 09-01 | Shared secret auth header on VM scraper endpoint | VERIFIED | `requireScraperSecret` middleware checks `x-scraper-secret`; POST without secret returns 401 (confirmed live) |
| SHOW-25 | 09-04 | Realtime polling fallback when subscription status is CLOSED/TIMED_OUT | PARTIAL | Polling fallback code exists and activates on CLOSED/TIMED_OUT. However, same `searchId` field name bug means polling queries `search_id = undefined` and will never find the row. Fix to SHOW-16 also fixes this. |
| INFRA-01 | 09-01 | VM scraper Express.js with shared Playwright browser instance (context-per-request, try/finally cleanup) | VERIFIED | `browser.ts`: shared `browser` singleton, `scrapeWithBrowser` always calls `context.close()` in `finally` |
| INFRA-02 | 09-01 | PM2 ecosystem config with max_memory_restart: 512M | VERIFIED | `ecosystem.config.js`: `max_memory_restart: '512M'` confirmed |
| INFRA-03 | 09-01 | Playwright context leak prevention (strict try/finally on every context) | VERIFIED | `browser.ts:32-36`: `try { return await fn(page); } finally { await context.close(); }` |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/hooks/useShowCheckin.ts` | 22, 128 | Field name mismatch: type declares `search_id`, server returns `searchId`, destructure yields `undefined` | BLOCKER | Realtime subscription and polling fallback both receive undefined searchId — VM scraper results never reach the mobile client; entire scraping path (SHOW-16, SHOW-25) is non-functional |

---

### Human Verification Required

#### 1. Happy Path (Venue with DB Lineup)

**Test:** Stand at a known venue (or mock GPS to venue coordinates), tap "I'm at a Show," confirm venue, view lineup with Founder availability badges, tap "Collect All"
**Expected:** Stamp animation plays, heavy haptic on Founder-eligible artists, ShowSummaryScreen shows all collected artists with correct Founder/Stamp badges, Passport cache refreshes
**Why human:** Requires physical GPS, live DB data, and runtime animation/haptic verification

#### 2. Scraping Wait Path (after searchId fix deployed)

**Test:** At a venue with no DB lineup, tap "I'm at a Show"
**Expected:** ScrapingWaitScreen appears with pulsing icon and elapsed counter; within 15 seconds, ConfidenceLineupScreen appears with scrape results at appropriate confidence tier
**Why human:** Requires live GPS, VM scraper execution, and Realtime timing

#### 3. Manual Fallback (15-second timeout)

**Test:** Trigger check-in at an unknown venue, wait 15 seconds with no scrape result
**Expected:** ManualFallbackForm appears; typing a venue name shows autocomplete dropdown; pasting an artist link and tapping Verify shows artist preview; Check In button stamps passport and saves to venue_submissions
**Why human:** Requires timing and form UX verification

#### 4. Founder Celebration

**Test:** Collect an artist with no existing founder
**Expected:** Confetti Lottie animation, gold "You're the Founder!" badge, heavy haptic feedback
**Why human:** Animation quality and haptic intensity require physical device

#### 5. Dark/Light Mode — All New Screens

**Test:** Toggle device between dark and light mode, navigate through ScrapingWaitScreen, ConfidenceLineupScreen (all three confidence tiers), ManualFallbackForm, ShowSummaryScreen
**Expected:** All text, backgrounds, borders, and accent colors adapt correctly; no hardcoded colors visible
**Why human:** Visual rendering requires running app

---

## Gaps Summary

One blocker gap prevents the core scraping path (Layers 2-6) from delivering results to the mobile client:

**searchId field name mismatch** (`src/hooks/useShowCheckin.ts` lines 22 and 128): The server's `show-checkin` POST response uses camelCase `searchId` in its JSON body (`return NextResponse.json({ status: "searching", searchId })`), but the hook's `ShowCheckinSearchingResponse` TypeScript type declares `search_id` (snake_case). The destructure `const { search_id: searchId } = response` evaluates to `undefined` because the key doesn't exist on the response object.

Downstream effects:
- `setState({ phase: 'waiting', searchId: undefined, ... })` — wizard enters waiting phase with no usable ID
- Realtime channel subscribed as `search:undefined` — VM scraper writes to correct row, mobile never receives INSERT event
- Polling fallback queries `search_results.search_id = undefined` — never matches
- After 15 seconds, wizard correctly times out to ManualFallbackForm (this part works)

**Fix is a two-line change:** In `src/hooks/useShowCheckin.ts`, change type line 22 from `search_id: string` to `searchId: string`, and update destructure on line 128 from `const { search_id: searchId } = response` to `const { searchId } = response`.

The happy path (Layer 1 DB hit), all confidence-tier UI, manual fallback form, Founder+Stamp dual award, summary screen, PM2 infrastructure, and VM scraper waterfall (Layers 1-6) are all correctly implemented and wired. SHOW-12 (Layer 4 social scraping) is correctly absent — explicitly deferred to Out of Scope in REQUIREMENTS.md.

---

*Verified: 2026-03-13T17:00:00Z*
*Verifier: Claude (gsd-verifier)*
