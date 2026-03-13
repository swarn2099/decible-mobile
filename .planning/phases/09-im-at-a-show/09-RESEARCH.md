# Phase 9: I'm at a Show — Research

**Researched:** 2026-03-13
**Domain:** GPS geofencing, scraping waterfall, Supabase Realtime, PM2/Express VM service, Playwright, confidence-gated lineup UI, Founder+Stamp simultaneous award
**Confidence:** HIGH (all core findings verified against existing codebase)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MIG-02 | `search_results` table with Realtime publication + RLS SELECT policy | Supabase migration pattern established in prior migrations; table does NOT yet exist |
| MIG-03 | `venue_submissions` table for crowdsource fallback | Same migration pattern; does NOT yet exist |
| SHOW-01 | "I'm at a Show" button accessible from + tab | `add.tsx` already has mode toggle; `CheckInWizard` already wired |
| SHOW-02 | Location permission with custom pre-prompt | `LocationPermissionModal` + `useLocation` already exist |
| SHOW-03 | Happy path: venue + lineup from DB in <1 second | `useVenueDetection` + `useCheckIn` already exist; need `is_founder` augmentation |
| SHOW-04 | Each lineup artist shows Founder availability | Need to extend lineup response to include `is_founder_available` + current founder info |
| SHOW-05 | "Collect All" stamps entire lineup in one tap | `LineupStep` already does multi-stamp; need Founder badge award in same call |
| SHOW-06 | Founder Badge + Stamp awarded simultaneously | `check-in` route only does stamps; needs founder_badge insert path |
| SHOW-07 | Confetti + haptic on Founder, subtle on Stamp | `StampAnimationModal` exists; needs founder-aware branching |
| SHOW-08 | Summary screen shows results after collection | New `ShowSummaryScreen` component needed |
| SHOW-09 | Scraping waterfall on VM on DB miss | New `~/decibel/scraper/` Express service |
| SHOW-10 | Layer 2: RA GraphQL, DICE, EDMTrain, Songkick, Bandsintown | RA + DICE scrapers exist in `scripts/scrapers/`; adapt to Express request handler |
| SHOW-11 | Layer 3: Google Places reverse geocode | Google Places API key needed (not currently in env); alternative: nominatim (no key) |
| SHOW-12 | Layer 4: Social media (best-effort, out of scope per REQUIREMENTS.md) | Listed as out-of-scope in REQUIREMENTS.md — skip |
| SHOW-13 | Layer 5: Playwright venue website scrape + LLM extraction | Playwright 1.58.2 installed in backend devDeps; Anthropic SDK NOT installed |
| SHOW-14 | Layer 6: Claude API with web search | Anthropic SDK not in package.json — must install in scraper service |
| SHOW-15 | "Finding out what's playing here..." loading state | New `ScrapingWaitScreen` component |
| SHOW-16 | Results via Supabase Realtime within 15 seconds | `@supabase/supabase-js` 2.99.1 supports `postgres_changes` channel |
| SHOW-17 | Confidence tiers: high=auto, medium=confirm, low=form+link | New `ConfidenceLineupScreen` component |
| SHOW-18 | Manual fallback form after 15s timeout | New `ManualFallbackForm` component |
| SHOW-19 | Manual form: venue autocomplete + artist link paste | Venue search via Supabase; artist link paste reuses `useValidateArtistLink` |
| SHOW-20 | New venues and artists created from manual submissions | Extend `tag-performer` route or new `show-checkin` route handles creation |
| SHOW-21 | Crowdsource data saved to `venue_submissions` | Needs MIG-03 table + insert in manual form submit |
| SHOW-22 | POST /api/mobile/show-checkin Vercel endpoint | New route in `~/decibel/src/app/api/mobile/show-checkin/` |
| SHOW-23 | VM scraper service at `~/decibel/scraper/` under PM2 | New Express service; PM2 6.0.14 installed globally |
| SHOW-24 | Shared secret auth header on VM scraper | `SCRAPER_SHARED_SECRET` env var; `x-scraper-secret` header |
| SHOW-25 | Realtime polling fallback for iOS background | Known bug supabase/realtime#1088; polling interval when subscription CLOSED/TIMED_OUT |
| INFRA-01 | Express.js + shared Playwright browser, context-per-request | Playwright chromium launch once; `newContext()` per request; `try/finally` context.close() |
| INFRA-02 | PM2 with `max_memory_restart: 512M` | PM2 ecosystem.config.js with `max_memory_restart` option |
| INFRA-03 | Playwright context leak prevention | `try { ... } finally { await context.close() }` on every handler |

</phase_requirements>

---

## Summary

Phase 9 is the most architecturally complex phase in the v3.0 milestone. It spans three distinct systems: the DigitalOcean VM (new Express scraper service), the Vercel backend (new `show-checkin` API endpoint + DB migrations), and the React Native mobile app (new check-in flow screens + Realtime subscription).

The biggest technical risk is the Supabase Realtime subscription on iOS. A confirmed bug (supabase/realtime#1088) causes WebSocket connections to close when the app is backgrounded for more than ~2 seconds. The plan already accounts for this with a polling fallback, but the fallback must be implemented as a state machine — not a simple `setInterval` — to avoid memory leaks when the component unmounts.

The second major risk is the VM scraper service. Playwright's shared browser pattern (one `chromium.launch()` on server start, one `newContext()` per request) is well-established and critical to avoid startup latency per-request. The `try/finally` pattern for context cleanup is mandatory — Playwright contexts do not self-close on error. PM2 `max_memory_restart: 512M` provides the safety net but is not a substitute for proper cleanup.

For Layer 2, the RA GraphQL and DICE scrapers already exist in `~/decibel/scripts/scrapers/` and can be adapted directly. EDMTrain requires Playwright (the existing `scrape-events.ts` already uses it). Songkick's API status is uncertain post-Suno acquisition. Bandsintown requires an API key. The scraper should treat each Layer 2 source as independently failable — one source failing must not block others.

**Primary recommendation:** Build the scraper service in `~/decibel/scraper/` as a standalone Node.js Express app (not inside the Next.js project), with its own `package.json`. This isolates Playwright from the Vercel build environment and gives PM2 a clean process boundary.

---

## Standard Stack

### Core (VM Scraper Service)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| express | ^4.21 | HTTP server for scraper endpoint | Minimal overhead, familiar pattern |
| playwright | ^1.58.2 | Headless browser for Layer 5 scrape | Already in `~/decibel` devDeps; confirmed working |
| @anthropic-ai/sdk | ^0.39 | Claude API for Layer 6 LLM extraction | Required for web search; not yet installed anywhere |
| @supabase/supabase-js | ^2.99 | Write results to search_results table | Consistent with rest of project |
| dotenv | ^17 | Load env vars in standalone service | Same version as backend |

### Core (Vercel Backend)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.99 | DB queries + service role writes | Already installed |
| next | 16.1.6 | Route handler | Existing pattern in `~/decibel/src/app/api/` |

### Core (Mobile App)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.99.1 | Realtime channel subscription | Already installed |
| expo-location | ~55.1.2 | GPS for geofencing | Already installed |
| expo-haptics | ~55.0.8 | Haptic feedback on stamp/founder | Already installed |
| lottie-react-native | ~7.3.4 | Confetti animation on Founder | Already installed |
| @tanstack/react-query | ^5.90 | Cache invalidation post-stamp | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| uuid | Node built-in `crypto.randomUUID()` | Generate searchId | No external dep needed |
| node-fetch | Built into Node 20 | HTTP calls in scraper | Node 20.20.0 has native fetch |

**Installation (scraper service only):**
```bash
cd ~/decibel/scraper && npm init -y
npm install express @supabase/supabase-js @anthropic-ai/sdk dotenv
npm install --save-dev playwright typescript ts-node @types/express @types/node
npx playwright install chromium --with-deps
```

---

## Architecture Patterns

### Recommended Project Structure (VM Scraper)
```
~/decibel/scraper/
├── server.ts          # Express app, shared browser lifecycle
├── ecosystem.config.js # PM2 config with max_memory_restart
├── layers/
│   ├── layer1-db.ts   # DB lookup via Supabase (pre-check)
│   ├── layer2-apis.ts # RA, DICE, EDMTrain, Songkick, Bandsintown
│   ├── layer3-places.ts # Google Places / Nominatim reverse geocode
│   ├── layer5-website.ts # Playwright venue website scrape
│   └── layer6-llm.ts  # Claude API with web search
├── confidence.ts      # Confidence scoring enum + thresholds
├── write-result.ts    # Write to search_results table
└── package.json       # Standalone, NOT in ~/decibel/
```

### Pattern 1: Shared Playwright Browser with Context-Per-Request
**What:** `chromium.launch()` once at server startup; each scrape request gets its own `newContext()` + `newPage()` with `try/finally` cleanup.
**When to use:** Any Playwright usage in a long-running server. Prevents cold-start latency (~2s per launch).
**Example:**
```typescript
// Source: Playwright docs + existing ~/decibel/scripts/scrapers/scrape-events.ts pattern
import { chromium, type Browser } from 'playwright';

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

export async function scrapeWithBrowser<T>(
  fn: (page: import('playwright').Page) => Promise<T>
): Promise<T> {
  const b = await getBrowser();
  const context = await b.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();
  try {
    return await fn(page);
  } finally {
    await context.close(); // ALWAYS runs — prevents leak
  }
}
```

### Pattern 2: Fire-and-Forget VM Dispatch from Vercel
**What:** Vercel `show-checkin` handler checks DB (Layer 1), returns `{ searchId, status: 'searching' }` immediately, then fires unawaited POST to VM scraper.
**When to use:** Any operation that may exceed Vercel's 10-second function timeout.
**Example:**
```typescript
// ~/decibel/src/app/api/mobile/show-checkin/route.ts
export async function POST(req: NextRequest) {
  // ... auth + layer 1 check ...

  if (!dbResult) {
    const searchId = crypto.randomUUID();
    // Fire and forget — do NOT await
    fetch(`${process.env.VM_SCRAPER_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-scraper-secret': process.env.SCRAPER_SHARED_SECRET!,
      },
      body: JSON.stringify({ searchId, lat, lng, localDate }),
    }).catch(() => {}); // swallow — VM is best-effort

    return NextResponse.json({ status: 'searching', searchId });
  }
  // ... return immediate result ...
}
```

### Pattern 3: Supabase Realtime with Polling Fallback
**What:** Mobile subscribes to `postgres_changes` on `search_results` filtered by `searchId`. On `CLOSED` or `TIMED_OUT` status, falls back to polling every 3 seconds.
**When to use:** Any Realtime subscription in a React Native app (iOS background issue is real).
**Example:**
```typescript
// Source: @supabase/supabase-js 2.99.1 POSTGRES_CHANGES pattern
useEffect(() => {
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const channel = supabase
    .channel(`search:${searchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'search_results',
        filter: `search_id=eq.${searchId}`,
      },
      (payload) => {
        onResult(payload.new as SearchResult);
        channel.unsubscribe();
        if (pollInterval) clearInterval(pollInterval);
      }
    )
    .subscribe((status) => {
      if (status === 'CLOSED' || status === 'TIMED_OUT') {
        // iOS background fallback — poll every 3 seconds
        pollInterval = setInterval(async () => {
          const { data } = await supabase
            .from('search_results')
            .select('*')
            .eq('search_id', searchId)
            .maybeSingle();
          if (data) {
            onResult(data);
            if (pollInterval) clearInterval(pollInterval);
          }
        }, 3000);
      }
    });

  return () => {
    channel.unsubscribe();
    if (pollInterval) clearInterval(pollInterval);
  };
}, [searchId]);
```

### Pattern 4: Confidence-Tiered Result Handling
**What:** VM scraper writes confidence level to `search_results`; mobile renders different UI per tier.
**When to use:** Any AI-assisted or scraped result where accuracy cannot be guaranteed.

```typescript
// confidence.ts
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface SearchResult {
  search_id: string;
  user_id: string;
  confidence: ConfidenceLevel;
  venue_name: string | null;
  venue_id: string | null;        // null if not in DB yet
  artists: ScrapedArtist[];
  source: string;                 // 'ra' | 'dice' | 'edmtrain' | 'playwright' | 'llm'
  created_at: string;
}

export interface ScrapedArtist {
  name: string;
  performer_id: string | null;    // null if not yet in DB
  platform_url: string | null;    // for low-confidence: link paste required
}
```

| Confidence | Source | Mobile Behavior |
|------------|--------|-----------------|
| `high` | Layer 1 (DB) or Layer 2 API exact match | Auto-fill lineup, show "Collect All" |
| `medium` | Layer 3-5 partial match | "Does this look right?" confirmation step |
| `low` | Layer 6 LLM inference only | Pre-fill manual form fields, require link paste per artist |

### Pattern 5: PM2 Ecosystem Config
**What:** PM2 `ecosystem.config.js` for the scraper service with memory limit and auto-restart.
**Example:**
```javascript
// ~/decibel/scraper/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'decibel-scraper',
    script: 'dist/server.js',
    max_memory_restart: '512M',
    restart_delay: 3000,
    max_restarts: 10,
    env: {
      NODE_ENV: 'production',
      PORT: 4001,
    },
  }],
};
```

### Pattern 6: Founder+Stamp Simultaneous Award
**What:** The `show-checkin` API route (or extended `check-in` route) checks `founder_badges` table for each performer and inserts if eligible — same transaction as stamps.
**Critical:** Check `founder_badges` BEFORE inserting `collections`. Race condition protection: the `performers.spotify_id` UNIQUE constraint (MIG-07) prevents duplicate performers; the `founder_badges` table needs its own unique constraint on `(fan_id, performer_id)` — verify this exists.

```typescript
// Per performer in lineup:
const { data: existingFounder } = await admin
  .from('founder_badges')
  .select('fan_id')
  .eq('performer_id', performer.id)
  .maybeSingle();

const isFounderEligible = !existingFounder; // no one has founded this artist yet
let isFounder = false;

if (isFounderEligible) {
  const { error: founderErr } = await admin
    .from('founder_badges')
    .insert({ fan_id: fan.id, performer_id: performer.id });
  isFounder = !founderErr; // race: another insert may win
}

// Insert collection with correct type
await admin.from('collections').insert({
  fan_id: fan.id,
  performer_id: performer.id,
  venue_id,
  event_date: local_date,
  capture_method: 'location',
  collection_type: isFounder ? 'find' : 'stamp', // founders get 'find' + stamp
  verified: true,
});

// If founder: ALSO insert a 'stamp' entry? Or single 'find' entry?
// Per PRD: Founder Badge + Stamp = two things. Check existing check-in route:
// Current: inserts one row with capture_method='location', collection_type='stamp'
// For Phase 9 founder path: insert BOTH a 'find' row AND a 'stamp' row?
// DECISION NEEDED: see Open Questions #1
```

### Anti-Patterns to Avoid
- **Awaiting the VM fetch in Vercel:** Vercel functions timeout at 10s (60s max with Pro). The VM scrape can take 15s. Never await `fetch(VM_SCRAPER_URL)` in the Vercel handler.
- **Launching Playwright per request:** ~2 second overhead per request. Use shared browser singleton.
- **Not closing Playwright contexts:** Memory leak within a session. Always `finally { await context.close() }`.
- **Polling without cleanup:** `setInterval` inside `useEffect` without `clearInterval` in the cleanup causes stale poll after component unmounts. Always return cleanup function.
- **Hardcoding Chicago:** Scraper must work for any lat/lng. Do not hardcode city.
- **Missing RLS on search_results:** Without `SELECT WHERE user_id = auth.uid()`, users can see each other's search results. The Realtime subscription must only surface the requesting user's row.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Headless browser | Custom puppeteer wrapper | Playwright `scrapeWithBrowser` pattern | Playwright has auto-retry, stealth, mobile emulation built in |
| Process management | Custom daemon with `setInterval` | PM2 with `ecosystem.config.js` | PM2 handles crash recovery, log rotation, memory limits |
| Venue reverse geocode | Manual Google API wrapper | `nominatim.openstreetmap.org` (free) or Google Places SDK | Nominatim: no key, rate-limited to 1 req/s; Google: key required but more reliable |
| Realtime subscription | WebSocket from scratch | `supabase.channel().on('postgres_changes')` | Handles reconnection, heartbeat, RLS enforcement |
| Unique ID generation | `Math.random()` or `uuid` package | `crypto.randomUUID()` (Node 20 built-in) | No dep needed, cryptographically secure |
| Scraper auth | JWT or OAuth | Shared secret in `x-scraper-secret` header | Internal VM-to-VM call; secret rotatable via env var |

**Key insight:** The scraper layers should be independently failable. A network error fetching the DICE API must not block the RA request. Run Layer 2 sources as `Promise.allSettled()` with per-source timeouts via `Promise.race([fetch(...), timeout(5000)])`.

---

## Common Pitfalls

### Pitfall 1: Supabase Realtime RLS Silent Drop
**What goes wrong:** `search_results` INSERT fires on the VM but the mobile client never receives it.
**Why it happens:** RLS policy on `search_results` blocks the SELECT. Realtime uses the anon key on the client, so the `SELECT WHERE user_id = auth.uid()` policy must match the JWT in the Realtime subscription. If the policy is missing or wrong, the INSERT is blocked at the Realtime publication level — no error, just silence.
**How to avoid:** Migration SQL must include `ALTER TABLE search_results ENABLE ROW LEVEL SECURITY` AND a `CREATE POLICY` for SELECT using `auth.uid() = user_id`. Also verify the table is added to the `supabase_realtime` publication.
**Warning signs:** VM logs show INSERT success, but mobile never receives event. Test by querying table directly.

### Pitfall 2: Playwright Browser Crashing Under PM2
**What goes wrong:** PM2 restarts the process but `browser` singleton is stale — `browser.isConnected()` returns false but no error is thrown until a page action.
**Why it happens:** The `browser` variable holds a reference to a closed browser instance from the previous process lifecycle.
**How to avoid:** `getBrowser()` must check `!browser || !browser.isConnected()` before returning. On `isConnected() === false`, re-launch. PM2 restart clears in-memory state but that check guards the re-launch path.

### Pitfall 3: DICE `_next/data` Build ID Staleness
**What goes wrong:** Layer 2 DICE scraper fails with 404 errors on all event requests.
**Why it happens:** DICE uses Next.js and their `_next/data/{buildId}/` endpoint changes on each deploy. The existing `getDiceBuildId()` function fetches a known DICE page to extract the current build ID — this must run BEFORE every batch of requests, not once at startup.
**How to avoid:** Call `getBuildId()` at the start of each scrape request, not at server startup. Cache with a short TTL (~5 minutes max).

### Pitfall 4: Vercel Function Timeout on Slow DB Queries
**What goes wrong:** `show-checkin` times out waiting for the Layer 1 DB query when venue + events tables have no index on lat/lng.
**Why it happens:** `useVenueDetection` already fetches ALL venues client-side and does Haversine in JS. The new `show-checkin` endpoint should follow the same pattern — fetch all venues (small set, ~50-200 rows), filter server-side.
**How to avoid:** Venues table is small enough for full-table fetch + server-side filtering. No PostGIS needed. Keep consistent with `useVenueDetection` client pattern.

### Pitfall 5: iOS Background Kills Realtime WebSocket
**What goes wrong:** User taps "I'm at a Show," scrape starts (15s), user switches apps briefly, WebSocket closes — user never sees results even though they returned.
**Why it happens:** iOS aggressively closes WebSocket connections in backgrounded apps. Confirmed in supabase/realtime issue #1088.
**How to avoid:** Implement the polling fallback in `useShowCheckin` hook. On `CLOSED` or `TIMED_OUT` subscription status, start polling `search_results` every 3 seconds. When result arrives (via either channel), cancel the other.

### Pitfall 6: Missing `collection_type` on New Stamps from show-checkin
**What goes wrong:** Stamps appear in wrong tab on Passport (or not at all).
**Why it happens:** The existing `check-in` route inserts with `capture_method: 'location'` but does NOT set `collection_type`. The passport hook falls back to `verified: true` heuristic, but MIG-01 backfill pattern means new rows without `collection_type` may be miscategorized.
**How to avoid:** The new `show-checkin` route (and updated `check-in` route) MUST explicitly set `collection_type: 'stamp'` on all collection inserts. For Founder awards, set `collection_type: 'find'`.

### Pitfall 7: Anthropic SDK Web Search Tool
**What goes wrong:** Layer 6 LLM call fails because `web_search_20250305` tool is not enabled.
**Why it happens:** Claude's web search requires explicit tool declaration in the API call. It is not available by default.
**How to avoid:** Layer 6 must pass `tools: [{ type: 'web_search_20250305', name: 'web_search' }]` in the `messages.create` call. Use `claude-3-5-haiku-20241022` (fast, cheap) not Opus for Layer 6.

---

## Code Examples

### DB Migration: `search_results` (MIG-02)
```sql
-- MIG-02: search_results table with Realtime + RLS
CREATE TABLE IF NOT EXISTS search_results (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id    uuid NOT NULL,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confidence   text NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  venue_name   text,
  venue_id     uuid REFERENCES venues(id),
  artists      jsonb NOT NULL DEFAULT '[]',
  source       text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_results_search_id_idx ON search_results(search_id);
CREATE INDEX IF NOT EXISTS search_results_user_id_idx ON search_results(user_id);

ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own search results"
  ON search_results FOR SELECT
  USING (auth.uid() = user_id);

-- Add to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE search_results;
```

### DB Migration: `venue_submissions` (MIG-03)
```sql
-- MIG-03: venue_submissions for crowdsource fallback pattern detection
CREATE TABLE IF NOT EXISTS venue_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id          uuid NOT NULL REFERENCES fans(id) ON DELETE CASCADE,
  venue_name      text NOT NULL,
  venue_id        uuid REFERENCES venues(id),
  lat             double precision,
  lng             double precision,
  performer_name  text,
  platform_url    text,
  event_date      date NOT NULL,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS venue_submissions_venue_date_idx
  ON venue_submissions(venue_id, event_date);

ALTER TABLE venue_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fans can insert own submissions"
  ON venue_submissions FOR INSERT
  WITH CHECK (
    fan_id IN (SELECT id FROM fans WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );
```

### Layer 2: RA GraphQL Adapter (venue + date query)
```typescript
// Source: ~/decibel/scripts/scrapers/ra.ts — adapted for per-request use
const RA_GRAPHQL = "https://ra.co/graphql";

export async function queryRAByVenueAndDate(
  venueName: string,
  date: string // YYYY-MM-DD
): Promise<{ artists: string[]; confidence: 'high' | 'medium' }> {
  const query = `
    query SearchEvents($filters: FilterInputDtoInput, $pageSize: Int) {
      eventListings(filters: $filters, pageSize: $pageSize, page: 1) {
        data { event { title date venue { name } artists { name } } }
      }
    }`;

  const res = await fetch(RA_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://ra.co/events',
    },
    body: JSON.stringify({
      query,
      variables: {
        filters: { listingDate: { gte: date, lte: date } },
        pageSize: 50,
      },
    }),
  });

  // Filter client-side by venueName fuzzy match
  // Return { artists: string[], confidence: 'high' | 'medium' }
}
```

### Layer 6: Claude API with Web Search
```typescript
// Source: @anthropic-ai/sdk docs — web_search_20250305 tool
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function queryLLMForLineup(
  venueName: string,
  city: string,
  date: string
): Promise<{ artists: string[]; confidence: 'low' }> {
  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{
      role: 'user',
      content: `What artists or DJs are performing at "${venueName}" in ${city} on ${date}? Return only a JSON array of artist name strings. If none found, return [].`,
    }],
  });

  // Parse response for artist names from tool result
  // Always returns confidence: 'low'
}
```

### useShowCheckin Hook Skeleton
```typescript
// ~/decibel-mobile/src/hooks/useShowCheckin.ts
type ShowCheckinState =
  | { phase: 'idle' }
  | { phase: 'scanning' }
  | { phase: 'layer1_hit'; result: SearchResult }
  | { phase: 'waiting'; searchId: string; elapsed: number }
  | { phase: 'result'; result: SearchResult }
  | { phase: 'timeout' }
  | { phase: 'error'; message: string };
```

---

## Existing Code to Reuse

This is critical — several Phase 9 components already exist from v1.0:

| Existing | Location | Reuse in Phase 9 |
|----------|----------|------------------|
| `useVenueDetection` | `src/hooks/useVenueDetection.ts` | Layer 1 client-side geofence (keep as-is for happy path) |
| `useCheckIn` | `src/hooks/useCheckIn.ts` | Extend to accept `is_founder[]` array in response |
| `CheckInWizard` | `src/components/checkin/CheckInWizard.tsx` | Add new states for `waiting`, `scrape_result`, `manual_fallback` |
| `LineupStep` | `src/components/checkin/LineupStep.tsx` | Extend to show Founder availability per artist |
| `StampAnimationModal` | `src/components/checkin/StampAnimationModal.tsx` | Extend for Founder confetti branch |
| `useValidateArtistLink` | `src/hooks/useValidateArtistLink.ts` | Reuse directly in manual fallback form |
| `RA scraper` | `~/decibel/scripts/scrapers/ra.ts` | Adapt function to Express request handler |
| `DICE scraper` | `~/decibel/scripts/scrapers/dice.ts` | Adapt function to Express request handler |
| `EDMTrain scraper` | `~/decibel/scripts/scrapers/scrape-events.ts` | Extract `scrapeEdmTrain` function, adapt |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Supabase Realtime raw WebSocket | `supabase.channel().on('postgres_changes')` | supabase-js v2 | Cleaner API, handles heartbeat |
| Playwright per-request launch | Shared browser + context-per-request | Playwright v1.x best practice | ~2s startup cost eliminated |
| PM2 v4 `instances: 'max'` | PM2 v6 with `max_memory_restart` | PM2 v5+ | Memory safety for scraper |
| Anthropic SDK `tool_use` | `type: 'web_search_20250305'` | 2025-03 tool spec | Built-in web search, no custom tool definition |

**Deprecated/outdated:**
- `capture_method: 'location'` without `collection_type`: All new routes must set `collection_type` explicitly.
- DICE `_next/data/{buildId}` pattern: Must fetch fresh build ID per scrape request (not once at startup).

---

## Open Questions

1. **Founder+Stamp dual-row vs single-row**
   - What we know: Current `check-in` route inserts one `collections` row with `collection_type: 'stamp'`. Passport hook reads `collection_type === 'find'` for Finds tab. A Founder via check-in should appear in BOTH Stamps AND Finds tabs.
   - What's unclear: Should we insert two separate `collections` rows (one `stamp`, one `find`), or use a single row with `collection_type: 'find'` and `verified: true`? The passport hook uses `collection_type` to split, so a single row can only appear in one tab.
   - Recommendation: Insert TWO rows — one `collection_type: 'stamp'` (with `venue_id` + `event_date`) for the Stamps tab, plus a `founder_badge` entry. The Finds tab derives `is_founder` from `founder_badges` join, not `collection_type`. Verify with `usePassport.ts` logic before implementing.

2. **Google Places API vs Nominatim for Layer 3**
   - What we know: No Google API key in current env vars. Nominatim is free but rate-limited to 1 req/s and requires a `User-Agent` identifying the app.
   - What's unclear: Whether Google Places is worth the cost/key complexity for reverse geocoding.
   - Recommendation: Use Nominatim for Layer 3 geocode (no key needed), fall back to coordinates-only if rate limited. Google Places is optional enrichment, not required.

3. **Songkick API status post-Suno acquisition**
   - What we know: Songkick was acquired by Suno in late 2024. API access status is MEDIUM confidence at best.
   - What's unclear: Whether their event API still works for non-partners.
   - Recommendation: Implement Songkick as a failable Layer 2 source with a 3-second timeout. Do not block on it. Skip if 429 or 403.

4. **`venue_submissions` INSERT policy**
   - What we know: `fans` table is keyed by email, not directly by `auth.uid()`. RLS policies in this project use a subquery pattern: `fan_id IN (SELECT id FROM fans WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))`.
   - Recommendation: Use the same pattern as other fan-scoped RLS policies in the project. Verify against `20260306081146_rls_policies.sql`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30 + ts-jest 29 |
| Config file | `jest.config.js` (exists) |
| Quick run command | `npx jest --testPathPattern="useShowCheckin\|confidence\|layer" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIG-02 | search_results table exists + Realtime publication | manual-only (Supabase console) | — | N/A |
| MIG-03 | venue_submissions table exists + RLS | manual-only | — | N/A |
| SHOW-03 | Layer 1 DB lookup returns venue + lineup in <1s | unit (mock Supabase) | `npx jest useShowCheckin -t "layer1"` | Wave 0 gap |
| SHOW-06 | Founder badge + stamp awarded simultaneously | unit | `npx jest useShowCheckin -t "founder"` | Wave 0 gap |
| SHOW-16 | Realtime subscription fires on INSERT | unit (mock channel) | `npx jest useShowCheckin -t "realtime"` | Wave 0 gap |
| SHOW-17 | Confidence tiers route to correct UI branch | unit | `npx jest confidence -t "tier"` | Wave 0 gap |
| SHOW-25 | Polling fallback activates on CLOSED status | unit | `npx jest useShowCheckin -t "polling"` | Wave 0 gap |
| INFRA-01 | Playwright context closed in finally block | unit (spy on context.close) | `npx jest scrapeWithBrowser` | Wave 0 gap |
| INFRA-03 | No context leak when scrape throws | unit | `npx jest scrapeWithBrowser -t "error"` | Wave 0 gap |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="useShowCheckin\|confidence" --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/__tests__/useShowCheckin.test.ts` — covers SHOW-03, SHOW-06, SHOW-16, SHOW-25
- [ ] `src/lib/__tests__/confidence.test.ts` — covers SHOW-17 confidence tier logic
- [ ] `~/decibel/scraper/__tests__/scrapeWithBrowser.test.ts` — covers INFRA-01, INFRA-03

---

## Sources

### Primary (HIGH confidence)
- Existing codebase `~/decibel/scripts/scrapers/ra.ts` — RA GraphQL query structure, venue name matching
- Existing codebase `~/decibel/scripts/scrapers/dice.ts` — DICE `_next/data/{buildId}` pattern, build ID freshness requirement
- Existing codebase `~/decibel/scripts/scrapers/scrape-events.ts` — EDMTrain Playwright pattern, shared browser usage
- Existing codebase `~/decibel-mobile/src/hooks/useVenueDetection.ts` — Haversine geofence, venue query pattern
- Existing codebase `~/decibel-mobile/src/hooks/useCheckIn.ts` — apiCall mutation, onSuccess cache invalidation
- Existing codebase `~/decibel/src/app/api/mobile/check-in/route.ts` — stamp insert pattern, duplicate check
- Existing codebase `~/decibel/src/app/api/mobile/add-artist/route.ts` — founder badge insert, race condition handling
- PM2 v6.0.14 globally installed on VM — confirmed working
- Node.js v20.20.0 on VM — native `fetch` + `crypto.randomUUID()` available
- Playwright 1.58.2 in `~/decibel` devDeps — confirmed installed, browsers installable

### Secondary (MEDIUM confidence)
- Supabase Realtime issue #1088 (iOS background disconnect) — referenced in STATE.md `Blockers/Concerns`
- `@supabase/supabase-js` 2.99.1 `POSTGRES_CHANGES` API — confirmed in `RealtimeChannel.js` source
- Anthropic `web_search_20250305` tool type — from Anthropic SDK docs (tool not yet installed in project)

### Tertiary (LOW confidence)
- Songkick API post-Suno acquisition: status unclear — treat as best-effort, failable source
- Bandsintown public API: requires API key — may need partner application or may be open via user-agent spoofing
- Google Places Geocoding API: key not in current env; Nominatim recommended as free alternative

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies verified in existing codebase or confirmed installed on VM
- Architecture: HIGH — all patterns derived from existing working code in the repo
- Pitfalls: HIGH — 3 pitfalls verified against existing code (Realtime RLS silent drop, collection_type omission, DICE build ID staleness)
- Layer 2 API specifics: MEDIUM — RA and DICE verified; Songkick/Bandsintown LOW

**Research date:** 2026-03-13
**Valid until:** 2026-04-12 (DICE build ID pattern may break sooner; Anthropic SDK version may update)
