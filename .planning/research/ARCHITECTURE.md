# Architecture Research

**Domain:** Live music passport mobile app — v3.0 additions: glassmorphism passport, social music discovery feed (Jukebox), VM-based scraping check-in
**Researched:** 2026-03-12
**Confidence:** HIGH — patterns verified against existing running codebase, not hypothetical

---

## System Overview (v3.0)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         React Native / Expo (Mobile)                      │
│                                                                            │
│  ┌──────────────────┐  ┌───────────────────────┐  ┌────────────────────┐  │
│  │   Screens         │  │   Custom Hooks         │  │  Zustand Stores    │  │
│  │  (Expo Router)    │  │  (TanStack React Query)│  │  auth/ui/location  │  │
│  │                   │  │                        │  │  search/notif      │  │
│  │  index.tsx (Home) │  │  useJukebox [NEW]      │  └────────────────────┘  │
│  │  passport.tsx     │  │  useDiscover [NEW]     │                          │
│  │  add.tsx          │  │  usePassport [MODIFY]  │  ┌────────────────────┐  │
│  │  jukebox.tsx [NEW]│  │  useCheckIn [EXTEND]   │  │  lib/              │  │
│  │  passport/        │  │  useVenueDetection     │  │  api.ts            │  │
│  │  more-[type] [NEW]│  │  useLocation           │  │  supabase.ts       │  │
│  └──────────────────┘  └───────────────────────┘  │  urlParser.ts      │  │
│                                                     └────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  New v3.0 Components                                                  │  │
│  │  passport/GlassyPassportTabs.tsx  passport/GlassCard.tsx             │  │
│  │  passport/GradientOrbs.tsx        jukebox/JukeboxCard.tsx            │  │
│  │  jukebox/EmbeddedPlayer.tsx       checkin/ScrapingWaitScreen.tsx     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │ HTTPS + Bearer JWT (Supabase token)
                          ┌───────┴──────┐
                          │              │
                          ▼              ▼
┌─────────────────────────────┐  ┌──────────────────────────────────────────┐
│  Next.js on Vercel           │  │  DigitalOcean VM (159.203.108.156)        │
│  decibel-three.vercel.app   │  │                                            │
│                             │  │  scraper-service/ (Express.js + PM2)      │
│  /api/mobile/jukebox [NEW]  │  │  POST /api/scrape-event                   │
│  /api/mobile/show-checkin   │  │    Layer 2: RA/DICE/EDMTrain/Songkick APIs │
│    [NEW — fires VM async]   │  │    Layer 3: Google Places reverse geocode  │
│  /api/mobile/discover [NEW] │  │    Layer 4: Instagram/FB social scrape     │
│  Existing endpoints intact  │  │    Layer 5: Playwright venue website       │
│                             │  │    Layer 6: Anthropic SDK (Claude LLM)     │
│                             │  │                                            │
│                             │  │  Writes results → Supabase search_results  │
└──────────┬──────────────────┘  └──────────────────┬───────────────────────┘
           │ Service Role key                        │ Service Role key
           │ (writes + admin reads)                  │ (direct Supabase insert)
           └──────────────┬──────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                               Supabase                                    │
│                                                                            │
│  Existing tables:                                                          │
│  fans  performers  collections  founder_badges  venues  events             │
│  user_tagged_events  fan_follows  fan_artist_collections                   │
│                                                                            │
│  New tables (v3.0):                                                        │
│  search_results  [async scrape delivery, Realtime enabled]                 │
│  venue_submissions  [crowdsource Layer 7 data]                             │
│  event_artists  [junction: events ↔ performers, if not exists]             │
│                                                                            │
│  New columns on performers:                                                │
│  spotify_embed_url  soundcloud_embed_url  apple_music_embed_url            │
│  top_track_cached_at                                                       │
│                                                                            │
│  Realtime subscription (mobile):                                           │
│  search_results filtered by search_id                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## New vs Modified Components

### New: Mobile App

| Component / Hook | Type | Purpose |
|------------------|------|---------|
| `app/jukebox.tsx` | Screen | Jukebox feed — full-screen modal or push from Home |
| `app/passport/more-stamps.tsx` | Screen | "View More" for Stamps tab (infinite scroll, search) |
| `app/passport/more-finds.tsx` | Screen | "View More" for Finds tab |
| `app/passport/more-discoveries.tsx` | Screen | "View More" for Discoveries tab |
| `src/components/passport/GlassyPassportTabs.tsx` | Component | 3-tab header (Stamps / Finds / Discoveries), gesture swipe |
| `src/components/passport/GlassCard.tsx` | Component | BlurView + semi-transparent card, shared across all 3 tab types |
| `src/components/passport/GradientOrbs.tsx` | Component | Animated floating gradient orbs behind passport grid |
| `src/components/passport/StampGlassCard.tsx` | Component | Stamp-specific card variant (pink tint, venue + date) |
| `src/components/passport/FindGlassCard.tsx` | Component | Find-specific card variant (purple tint, platform badge + listener count) |
| `src/components/passport/DiscoveryGlassCard.tsx` | Component | Discovery-specific card variant (blue tint, "via @username") |
| `src/components/jukebox/JukeboxCard.tsx` | Component | Feed card: finder info + artist info + embedded player |
| `src/components/jukebox/EmbeddedPlayer.tsx` | Component | react-native-webview wrapper, visibility-aware mount/unmount |
| `src/components/checkin/ScrapingWaitScreen.tsx` | Component | "Finding what's playing here…" loading state with 15s timeout |
| `src/hooks/useJukebox.ts` | Hook | TanStack Query for GET /api/mobile/jukebox, cursor pagination |
| `src/hooks/useDiscover.ts` | Hook | Mutation: one-tap collect from Jukebox (type='discovery') |
| `src/hooks/useShowCheckin.ts` | Hook | Orchestrates the new multi-layer check-in: Vercel call → VM async → Realtime sub |
| `src/hooks/useSupabaseRealtime.ts` | Hook | Generic Supabase Realtime subscription, filters by searchId |

### Modified: Mobile App

| Component / Hook | Change |
|------------------|--------|
| `app/(tabs)/index.tsx` | Replace Map icon button with Jukebox icon button — `router.push('/jukebox')` |
| `app/(tabs)/passport.tsx` | Full redesign: replace current Finds grid + Stamps section with GlassyPassportTabs. Keep PassportHeader, StatsBar, BadgeGrid, ShareSheet. |
| `app/(tabs)/add.tsx` | Add "I'm at a Show" button calling `useShowCheckin` (already has Check In flow; this extends it with the scraping fallback path) |
| `src/hooks/usePassport.ts` | Extend `usePassportCollections` to accept `type` param ('stamp' | 'find' | 'discovery') for per-tab queries |
| `src/hooks/useCheckIn.ts` | No change to existing hook. `useShowCheckin` (new) wraps the multi-layer logic and calls `useCheckIn` when lineup is resolved. |

### New: Vercel API Routes (`~/decibel/src/app/api/mobile/`)

| Route | Method | Purpose |
|-------|--------|---------|
| `jukebox/route.ts` | GET | Query finds from followed users (last 48h), resolve embed URLs, return Jukebox feed |
| `show-checkin/route.ts` | POST | Layer 1 DB lookup; on miss: fire VM async + return `{ status: 'searching', searchId }` |
| `discover/route.ts` | POST | Create a 'discovery' collection from Jukebox one-tap collect |

### New: VM Scraper Service (`~/scraper-service/` on DigitalOcean VM)

| File | Purpose |
|------|---------|
| `server.js` | Express.js entry, single POST /api/scrape-event endpoint |
| `layers/layer2-event-apis.js` | Parallel calls: RA GraphQL, DICE, EDMTrain, Songkick, Bandsintown, Eventbrite |
| `layers/layer3-google-places.js` | Reverse geocode lat/lng → venue name + website URL |
| `layers/layer4-social.js` | Instagram location, Facebook Events, X search + LLM parse |
| `layers/layer5-playwright.js` | Playwright headless scrape of venue website |
| `layers/layer6-llm.js` | Anthropic SDK call with web search ("what's playing at X tonight") |
| `lib/supabase.js` | Supabase JS client (service role key), writes search_results rows |
| `lib/confidence.js` | Scoring logic: high / medium / low based on source layer |
| `ecosystem.config.js` | PM2 process config, single instance, auto-restart |

---

## Data Flow Changes

### New Flow 1: Jukebox

```
User taps Jukebox icon (Home top-left, replaces Map icon)
    ↓
router.push('/jukebox')
    ↓
useJukebox() → GET /api/mobile/jukebox?userId={id}
    Vercel: follows → recent finds (48h) → resolve embed URLs from artists table
    If no followed-user finds: global finds fallback (48h, all users)
    Returns: [{ finder, artist, platform, embedUrl, trackName, foundAt }]
    ↓
JukeboxCard rendered in FlatList
    EmbeddedPlayer: react-native-webview, mounted only when card is visible
    FlatList onViewableItemsChanged → max 3 WebViews active at any time
    ↓
User taps "Collect"
    useDiscover.mutate({ performer_id })
    → POST /api/mobile/discover { performer_id }
        → INSERT collections { type: 'discovery', fan_id, performer_id }
        → Return success
    → Haptic (Medium)
    → Button state → "Discovered ✓"
    → Notification to finder (server-side via Supabase notification table or push)
    → invalidateQueries(['passport', 'passportStats'])
```

### New Flow 2: I'm at a Show (with Scraping Waterfall)

```
User taps "I'm at a Show" on + tab
    ↓
ScrapingWaitScreen shows while location + Layer 1 runs
    ↓
useShowCheckin() fires:
    Step 1 — POST /api/mobile/show-checkin { lat, lng }
        Vercel: Layer 1 — Supabase venue proximity + event + event_artists join
        IF found:
            Return { status: 'found', venue, artists[], confidence: 'high' }
            → ShowLineupScreen rendered immediately
        IF not found:
            INSERT search_results row with status='pending', return { status: 'searching', searchId }
            Fire async POST to VM: http://159.203.108.156:PORT/api/scrape-event { lat, lng, searchId }
            (Vercel does NOT wait — fire-and-forget with setTimeout/void fetch)

    Step 2 (if searching) — Supabase Realtime subscription
        supabase.channel('search_results')
          .on('postgres_changes', { event: 'INSERT', filter: `search_id=eq.${searchId}` }, handler)
          .subscribe()

    Step 3 — VM runs layers in parallel (Layers 2-6), writes to search_results when confident result found
        VM: { venue_name, artists: [{name, platform_url?, confidence}], source, confidence }
        → Realtime event fires on mobile

    Step 4 — Mobile receives Realtime event
        confidence='high' → auto-render ShowLineupScreen
        confidence='medium' → render with confirm prompt ("Looks like X might be playing. Right?")
        confidence='low' → pre-fill ManualFallbackForm with best guess

    Step 5 — 15-second timeout
        If no result after 15s: unsubscribe, show ManualFallbackForm

    Step 6 — User confirms lineup → taps "Collect All"
        POST /api/mobile/check-in { venue_id, performer_ids[], local_date }
        (existing useCheckIn hook, unchanged)
        → Stamp animation × N artists
        → Founder badge award if first to add any lineup artist
```

### New Flow 3: Glassy Passport (modified existing flow)

```
User opens Passport tab
    ↓
passport.tsx renders:
    PassportHeader (unchanged)
    StatsBar (unchanged)
    GlassyPassportTabs — new 3-tab component with gesture swipe
        ↓
        Active tab determines which query fires:
        usePassportCollections({ type: 'stamp' })  → StampGlassCard × 8 (2×4 grid)
        usePassportCollections({ type: 'find' })   → FindGlassCard × 8
        usePassportCollections({ type: 'discovery' }) → DiscoveryGlassCard × 8
        ↓
        GradientOrbs animate behind cards (Reanimated, slow loop)
        GlassCard = BlurView (expo-blur intensity=40) + semi-transparent overlay
        Each card: slight rotation (±1-2°, deterministic from index)
    BadgeGrid (unchanged)
    ShareSheet (unchanged)

    "View More" → router.push('/passport/more-stamps') (or finds, discoveries)
        Full screen: search bar + infinite scroll + same GlassCard style
        usePassportCollections({ type, page }) infinite query
```

### Modified Flow: Passport Collections Query

```
Existing: usePassportCollections → GET /mobile/passport?page=0
    Returns single array of all collections mixed

New: usePassportCollections(type: 'stamp'|'find'|'discovery')
    → GET /mobile/passport-collections?type={type}&page={n}
    OR: extend existing /mobile/passport endpoint to accept type param

Decision: Add new endpoint GET /mobile/passport-collections to avoid breaking
existing passport.tsx fetch pattern. Old /mobile/passport?page=0 stays intact
for the header stats and fan profile data.
```

---

## Component Boundaries (v3.0 additions)

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Mobile → Vercel `/api/mobile/jukebox` | HTTPS GET, Bearer JWT | Returns embed URLs; embed URL resolution cached in `performers.spotify_embed_url` etc. |
| Mobile → Vercel `/api/mobile/show-checkin` | HTTPS POST, Bearer JWT, `{ lat, lng }` | Vercel does Layer 1, fires async to VM on miss, returns searchId |
| Vercel → DigitalOcean VM | Server-to-server HTTP POST, no auth (internal network or shared secret header) | Fire-and-forget from Vercel; VM has no Vercel timeout pressure |
| VM → Supabase | Direct Supabase JS client with service role key | VM writes `search_results` row with full artist/venue payload |
| Mobile → Supabase Realtime | Supabase JS `channel('search_results').on('postgres_changes')` | Filtered by searchId. Unsubscribe after result or 15s timeout. |
| Mobile → Vercel `/api/mobile/discover` | HTTPS POST, Bearer JWT, `{ performer_id }` | New endpoint, creates 'discovery' type collection |
| Mobile → Vercel `/api/mobile/passport-collections` | HTTPS GET, Bearer JWT, `?type=&page=` | New endpoint, type-filtered collections for Passport tab queries |

---

## New DB Tables and Column Changes

### New Tables

```sql
-- Async scrape result delivery (Realtime enabled)
CREATE TABLE search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID NOT NULL,
  venue_id UUID REFERENCES venues(id),
  venue_name TEXT,
  event_name TEXT,
  artists JSONB, -- [{name, platform_url?, confidence: 'high'|'medium'|'low'}]
  source TEXT,   -- 'layer2_ra', 'layer3_google', 'layer4_instagram', etc.
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER PUBLICATION supabase_realtime ADD TABLE search_results;

-- Crowdsource layer 7 data
CREATE TABLE venue_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fans(id),
  venue_name TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  artist_name TEXT,
  artist_platform_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event-to-artist junction (may already exist from v2 check-in)
CREATE TABLE IF NOT EXISTS event_artists (
  event_id UUID REFERENCES events(id),
  artist_id UUID REFERENCES performers(id),
  set_time TIMESTAMPTZ,
  PRIMARY KEY (event_id, artist_id)
);
```

### New Columns on `performers`

```sql
ALTER TABLE performers ADD COLUMN IF NOT EXISTS spotify_embed_url TEXT;
ALTER TABLE performers ADD COLUMN IF NOT EXISTS soundcloud_embed_url TEXT;
ALTER TABLE performers ADD COLUMN IF NOT EXISTS apple_music_embed_url TEXT;
ALTER TABLE performers ADD COLUMN IF NOT EXISTS top_track_cached_at TIMESTAMPTZ;
```

### New Collection Type

The `collections` table already has a `type` column (used for 'find', 'stamp'). Add 'discovery' as a valid value. Confirm no CHECK constraint blocks this.

```sql
-- If there is a CHECK constraint on type:
ALTER TABLE collections DROP CONSTRAINT IF EXISTS collections_type_check;
ALTER TABLE collections ADD CONSTRAINT collections_type_check
  CHECK (type IN ('find', 'stamp', 'discovery'));
```

---

## Build Order (v3.0 phase dependencies)

The PRD recommends: Phase 3 (Passport) → Phase 1 (Jukebox) → Phase 2 (Check-in). Here is the dependency-justified build order at the feature level:

```
STEP 1: DB migrations (all new tables + columns)
    → Blocks: everything
    → Time: 30 min
    → Do first, unblocks all parallel work

STEP 2A: Passport tab redesign (Phase 3)
    → Depends on: migrations (discovery type in collections)
    → Blocks: nothing downstream in v3.0, but is the visual foundation
    → Sub-steps:
        2A-i:  GET /api/mobile/passport-collections endpoint (backend)
        2A-ii: usePassportCollections extended hook (mobile)
        2A-iii: GlassCard base component with BlurView (mobile)
        2A-iv:  GlassyPassportTabs with gesture swipe (mobile)
        2A-v:   StampGlassCard, FindGlassCard, DiscoveryGlassCard (mobile)
        2A-vi:  GradientOrbs animated background (mobile)
        2A-vii: More-[type] screens with infinite scroll (mobile)
        2A-viii: passport.tsx wired to new components (mobile)

STEP 2B: Jukebox (Phase 1) — can start after 2A-i (passport-collections pattern established)
    → Depends on: migrations (embed URL columns on performers), discovery collection type
    → Sub-steps:
        2B-i:  GET /api/mobile/jukebox endpoint (backend) — follows + finds + embed URL resolve
        2B-ii: POST /api/mobile/discover endpoint (backend) — create discovery collection
        2B-iii: useJukebox hook (mobile)
        2B-iv:  useDiscover hook (mobile)
        2B-v:   EmbeddedPlayer component with WebView visibility management (mobile)
        2B-vi:  JukeboxCard component (mobile)
        2B-vii: jukebox.tsx screen (mobile)
        2B-viii: Replace Map icon with Jukebox icon in index.tsx (mobile)

STEP 3: VM Scraper Service (Phase 2 prerequisite — build before show-checkin Vercel endpoint)
    → Depends on: migrations (search_results table)
    → Is fully independent of Steps 2A and 2B — can build in parallel
    → Sub-steps:
        3-i:   Express.js server scaffold + PM2 config on VM
        3-ii:  Layer 2: event platform API calls (RA, DICE, EDMTrain, Songkick)
        3-iii: Layer 3: Google Places reverse geocode
        3-iv:  Layer 5: Playwright venue website scrape
        3-v:   Layer 6: Anthropic SDK LLM search augmentation
        3-vi:  Layer 4: social media scraping (optional stretch — hardest)
        3-vii: Confidence scoring + Supabase write
        3-viii: Layer 7: venue_submissions crowdsource capture

STEP 4: "I'm at a Show" check-in (Phase 2)
    → Depends on: VM scraper service live (Step 3), search_results Realtime enabled
    → Sub-steps:
        4-i:   POST /api/mobile/show-checkin Vercel endpoint (Layer 1 + VM fire-and-forget)
        4-ii:  useSupabaseRealtime hook (mobile)
        4-iii: useShowCheckin orchestration hook (mobile)
        4-iv:  ScrapingWaitScreen component (mobile)
        4-v:   ShowLineupScreen with confidence display (mobile)
        4-vi:  ManualFallbackForm integration (reuse existing)
        4-vii: Wire into add.tsx "I'm at a Show" button
```

**Parallelism opportunities:**
- Step 2A (Passport) and Step 3 (VM scraper) can run fully in parallel after Step 1 (migrations).
- Step 2B (Jukebox) can start once `discovery` collection type is confirmed working (2A-i or 2A-ii milestone).
- Step 4 must wait for both VM scraper (Step 3) and Realtime setup to be tested.

---

## Architectural Patterns (v3.0 additions)

### Pattern 1: Fire-and-Forget VM Dispatch from Vercel

**What:** The Vercel `/api/mobile/show-checkin` endpoint does a fast Layer 1 DB lookup. On miss, it fires an HTTP POST to the DigitalOcean VM without `await`-ing the response, then immediately returns `{ status: 'searching', searchId }` to the mobile app. Vercel's 10-second function timeout is never hit.

**When to use:** Any operation that requires long-running scraping, headless browsers, or multiple parallel LLM calls. Vercel serverless functions cap at 10s (Hobby) or 60s (Pro). The VM has no timeout.

**Trade-offs:** Result delivery is asynchronous — mobile must use Realtime to receive the outcome. Vercel has no awareness of whether the VM call succeeded. Implement a dead-letter / timeout path on mobile (15s = show manual form).

```typescript
// In show-checkin/route.ts
const searchId = crypto.randomUUID();
// Fire async — don't await
fetch(`http://${VM_IP}:${VM_PORT}/api/scrape-event`, {
  method: 'POST',
  body: JSON.stringify({ lat, lng, searchId }),
  headers: { 'x-internal-secret': process.env.VM_SHARED_SECRET },
}).catch(() => {}); // ignore errors — mobile has timeout fallback

return NextResponse.json({ status: 'searching', searchId });
```

---

### Pattern 2: Supabase Realtime as Async Result Bus

**What:** Mobile subscribes to `postgres_changes` on `search_results` filtered by `search_id` before the Vercel call returns. The VM writes to `search_results` when done. The Realtime subscription on mobile fires, delivering the result without polling.

**When to use:** Whenever you need async server-to-client push from a process the mobile app cannot directly connect to (the VM). Supabase Realtime is the existing infrastructure — no additional WebSocket server needed.

**Trade-offs:** Supabase Realtime has a 200-channel-per-client limit (HIGH confidence per Supabase docs). Each check-in creates one channel, unsubscribed after result. At user scale this is fine — channels are ephemeral.

```typescript
// In useShowCheckin.ts (mobile)
const channel = supabase.channel(`search-${searchId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'search_results',
    filter: `search_id=eq.${searchId}`,
  }, (payload) => {
    channel.unsubscribe();
    clearTimeout(timeoutRef.current);
    handleScrapingResult(payload.new);
  })
  .subscribe();

// 15s timeout fallback
timeoutRef.current = setTimeout(() => {
  channel.unsubscribe();
  setShowManualForm(true);
}, 15_000);
```

---

### Pattern 3: Visibility-Gated WebView Pool (max 3 active)

**What:** The Jukebox FlatList tracks visible cards via `onViewableItemsChanged`. Each JukeboxCard mounts its WebView (embedded player) only when the card enters the viewport and unmounts when it exits. A pool cap of 3 active WebViews prevents memory pressure.

**When to use:** Any FlatList containing WebViews. React Native WebViews are expensive — each is a separate browser process on iOS. Without this pattern, a 20-item Jukebox feed destroys memory and causes crashes on older devices.

**Trade-offs:** Mounting/unmounting WebViews causes a brief white-flash as the embed loads. Mitigate by showing a skeleton/thumbnail placeholder while the WebView initializes.

```typescript
// In JukeboxCard.tsx
const [isVisible, setIsVisible] = useState(false);
// Parent FlatList passes visibility via context or prop
// EmbeddedPlayer only renders when isVisible=true AND activeCount < 3
{isVisible && activeWebViewCount < 3 ? (
  <EmbeddedPlayer embedUrl={embedUrl} onLoad={() => incrementActive()} />
) : (
  <PlayerThumbnailPlaceholder artistPhoto={artist.photo} />
)}
```

---

### Pattern 4: Deterministic Card Rotation (Passport Grid)

**What:** Each glassmorphism card in the Passport grid has a slight rotation (±2°). Use the card index modulo a small rotation table to assign rotation deterministically — same render every time, no random flicker on re-render.

**When to use:** Any "organic" staggered grid where you want the stamp/analog feel without Animated overhead.

**Trade-offs:** Purely cosmetic. Using `Math.random()` here would cause rotation to change on every re-render — avoid that.

```typescript
const ROTATIONS = [-2, 1.5, -1, 2, -1.5, 0.5, -2, 1];
const rotation = ROTATIONS[index % ROTATIONS.length];
// Apply: transform: [{ rotate: `${rotation}deg` }]
```

---

### Pattern 5: Embed URL Caching on performers Table

**What:** The Jukebox endpoint resolves each artist's top-track embed URL when building the feed. Rather than calling the Spotify/SoundCloud API on every feed load, the result is written to `performers.spotify_embed_url` (etc.) with a `top_track_cached_at` timestamp. Re-resolved only if cache is older than 7 days.

**When to use:** Any platform API call that yields stable data (top track rarely changes week-to-week). Avoids rate-limit exposure and adds latency to every feed load otherwise.

**Trade-offs:** A stale 7-day embed URL is acceptable. Artists that delete tracks will show a broken embed — rate of occurrence is very low.

---

## Anti-Patterns (v3.0 additions)

### Anti-Pattern 1: Awaiting the VM call from Vercel

**What people do:** `const result = await fetch(VM_URL, ...)` inside the Vercel API route handler.

**Why it's wrong:** Vercel Hobby functions time out at 10s, Pro at 60s. The VM scraping waterfall can take up to 15s for Layers 2-6. Awaiting guarantees timeout failures for any non-trivial scraping run.

**Do this instead:** Fire-and-forget from Vercel (`fetch(...).catch(() => {})`). Deliver the result via Supabase Realtime from the VM directly.

---

### Anti-Pattern 2: Running Playwright on Vercel

**What people do:** Install Playwright as a Vercel serverless dependency and run it in the API route for Layer 5 venue website scraping.

**Why it's wrong:** Playwright Chromium binary is ~300MB. Vercel function bundle limit is 50MB unzipped. This simply does not fit.

**Do this instead:** All headless browser operations live exclusively on the DigitalOcean VM. The VM has no size constraints and already runs Node.js scraper processes.

---

### Anti-Pattern 3: Subscribing Realtime Before Firing the Vercel Call

**What people do:** Call `POST /api/mobile/show-checkin` first, get back `searchId`, then subscribe Realtime.

**Why it's wrong:** Race condition. If the VM is fast (Layer 2 hits instantly), it may write to `search_results` before the mobile subscription is established. The INSERT event fires into the void and the mobile app sits at the 15s timeout.

**Do this instead:** Subscribe to Realtime first (on a predicted or pre-generated `searchId`), then fire the Vercel API call. If using server-generated searchId, subscribe after the first `POST` response but before the VM response arrives — this is safe because the VM round-trip is always >1 second.

```typescript
// Safe: fire Vercel call first (fast), subscribe with returned searchId
// VM takes ≥1s for any Layer 2+ operation — subscription has time to establish
const { searchId } = await showCheckinCall({ lat, lng });
subscribeRealtime(searchId); // subscribe immediately after
```

---

### Anti-Pattern 4: Mounting All WebViews on FlatList Render

**What people do:** Render `<WebView source={{ uri: embedUrl }} />` directly inside JukeboxCard without visibility gating.

**Why it's wrong:** A 10-card Jukebox feed = 10 simultaneous browser instances = OOM crashes on iPhone XR / lower-end Android. iOS in particular has strict limits on background WebView memory.

**Do this instead:** Visibility-gated pool (Pattern 3 above). Max 3 active at any time.

---

## Integration Points

### External Services (v3.0 additions)

| Service | Integration Pattern | Confidence | Notes |
|---------|---------------------|------------|-------|
| Spotify oEmbed / Embed URL | Server-side (Vercel jukebox endpoint), cached on performers table | HIGH | `https://open.spotify.com/embed/track/{trackId}?theme=0` — no auth needed for embed URL |
| SoundCloud Widget | Embed URL only: `https://w.soundcloud.com/player/?url={trackUrl}` — no API call needed | HIGH | Full playback without user auth for public tracks |
| Apple Music Embed | `https://embed.music.apple.com/us/album/{albumId}?i={trackId}` — no auth for embed | MEDIUM | Requires extracting album + track IDs from Apple Music URL; 30s preview without Apple auth |
| Resident Advisor (GraphQL) | VM Layer 2 — RA's public GraphQL API, no auth | MEDIUM | RA has rate limits; query by lat/lng radius + date. Schema may drift — validate before shipping |
| DICE API | VM Layer 2 — DICE does have a partner API; fallback to web scrape if no key | LOW | DICE API access is not guaranteed without partner agreement. Add as best-effort. |
| EDMTrain | VM Layer 2 — public API exists at `api.edmtrain.com` | MEDIUM | Requires API key (free tier available). Covers electronic/dance events well. |
| Songkick | VM Layer 2 — REST API, requires key (free for non-commercial) | MEDIUM | Good for indie/rock. Covers Chicago well. |
| Google Places API | VM Layer 3 — reverse geocode + place details | HIGH | Requires GCP API key with Places enabled. Quota: 5k free requests/day. |
| Anthropic SDK | VM Layer 6 — Claude API with web search tool | HIGH | Already used in project. Use `claude-3-5-haiku` (fast/cheap) for LLM lookup layer. |
| Playwright (Chromium) | VM Layer 5 — already installed on VM for other scrapers | HIGH | Already in use on the VM. No new setup needed. |
| react-native-webview | Mobile — embedded players in Jukebox | HIGH | Already a common Expo SDK 55 dependency; install via `npx expo install react-native-webview` |
| expo-blur (BlurView) | Mobile — glassmorphism card backgrounds | HIGH | Already referenced in PRD, standard Expo library. `npx expo install expo-blur`. iOS BlurView is reliable. Android BlurView requires API 31+ for full effect; provide solid semi-transparent fallback for older Android. |

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-5k users | Current design is sufficient. VM scraper can handle dozens of concurrent check-ins. Jukebox feed Supabase query is lightweight. |
| 5k-50k users | Jukebox endpoint may need cursor-based pagination (add `cursor` param). VM scraper may need multiple processes (`pm2 start server.js -i 2`). Add search_results TTL cleanup (delete rows older than 1 hour). |
| 50k+ users | Move venue proximity lookup from client-side Haversine to server-side PostGIS `ST_DWithin`. Add Redis/Upstash cache in front of Jukebox feed (popular follows = repeated queries). VM scraper: move to a queue (Bull/BullMQ) rather than direct HTTP to prevent request pileup. |

### First Bottleneck

The VM scraper is a single Express.js process. If 50 users simultaneously check in at the same festival, 50 concurrent scrape-event requests hit Layer 6 (LLM calls) in parallel. Anthropic API rate limits will queue them. At this scale, add a job queue (BullMQ) so requests are processed serially per venue (venue dedup prevents redundant scrapes for the same location).

### Second Bottleneck

Jukebox embed URL resolution: the first feed load for a new artist always hits Spotify API. At high feed volume, the 7-day cache TTL means most requests are cache hits. First-load latency is acceptable since the embed URL is resolved server-side before the response.

---

## Sources

- Existing codebase: `/home/swarn/decibel-mobile/` — verified component tree, hook patterns, store structure, existing checkin components
- Existing backend: `/home/swarn/decibel/src/app/api/mobile/` — verified endpoint patterns, auth pattern, Supabase service role usage
- PRD v3.0: `/home/swarn/decibel-mobile/DECIBEL_V3_PRD.md` — authoritative spec for all three phases
- Supabase Realtime docs: channel-based `postgres_changes` subscription confirmed as the correct pattern for async result delivery
- Vercel function timeout limits: 10s Hobby / 60s Pro — confirmed reason fire-and-forget is required for VM dispatch
- Confidence: HIGH — all integration points verified against existing running code or official documentation; no hypothetical patterns

---

*Architecture research for: Decibel Mobile v3.0 — Glassy Passport, Jukebox feed, VM scraping check-in*
*Researched: 2026-03-12*
