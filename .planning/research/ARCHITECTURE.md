# Architecture Research

**Domain:** Live music passport mobile app — link-paste artist ingestion, GPS check-in, server-side share cards, rich animations
**Researched:** 2026-03-10
**Confidence:** HIGH (all major findings verified against actual codebase — no hypothetical patterns)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        React Native / Expo (Mobile)                      │
│                                                                          │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │   Screens       │  │  Custom Hooks   │  │  Zustand Stores          │  │
│  │  (Expo Router)  │  │  (TanStack RQ)  │  │  auth / ui / search      │  │
│  │                 │  │                 │  │  location / notification  │  │
│  │  (tabs)/add.tsx │  │ useAddArtist    │  │                          │  │
│  │  (tabs)/        │  │ useVenueDetect  │  └──────────────────────────┘  │
│  │  passport.tsx   │  │ useShareCard    │                                 │
│  │  artist/[slug]  │  │ useLocation     │  ┌──────────────────────────┐  │
│  └────────────────┘  └─────────────────┘  │  lib/                    │  │
│                                            │  api.ts  (apiCall)       │  │
│                                            │  urlParser.ts            │  │
│                                            │  supabase.ts             │  │
│                                            └──────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTPS + Bearer JWT
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Next.js App Router (Vercel Edge / Node)               │
│                  https://decibel-three.vercel.app/api                    │
│                                                                          │
│  ┌──────────────────────────────────┐  ┌───────────────────────────┐    │
│  │  /api/mobile/                    │  │  /api/passport/share-card  │    │
│  │  add-artist   (POST)             │  │  /api/leaderboard/share-card│   │
│  │  activity-feed (GET)             │  │  /api/share-card/founder   │    │
│  │  passport      (GET)             │  │  /api/share-card/passport  │    │
│  │  validate-artist-link (POST) NEW │  │  (ImageResponse, edge)     │    │
│  │  check-in      (POST)       NEW  │  └───────────────────────────┘    │
│  │  tag-performer (POST)       NEW  │                                    │
│  │  search-artists (GET)       NEW  │  ┌───────────────────────────┐    │
│  │  artist-fans   (GET)        NEW  │  │  src/lib/                 │    │
│  └──────────────────────────────────┘  │  spotify.ts               │    │
│                                        │  supabase-admin.ts        │    │
│  ┌──────────────────────────────────┐  └───────────────────────────┘    │
│  │  External API calls (server-side)│                                    │
│  │  Spotify Web API + HTML scraper  │                                    │
│  │  SoundCloud API / scraper        │                                    │
│  │  Apple Music API (to be wired)   │                                    │
│  └──────────────────────────────────┘                                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ Service Role key (never to client)
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              Supabase                                    │
│  fans  performers  collections  founder_badges  venues  events           │
│  user_tagged_events (NEW)  spotify_tokens  fan_tiers                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `app/(tabs)/add.tsx` | Mode toggle (Add Artist / Check In), orchestrates full flows | useAddArtist, useVenueDetection, useLocation |
| `app/(tabs)/passport.tsx` | Finds grid + Stamps section, share button | usePassport, usePassportShareCard |
| `app/(tabs)/index.tsx` | Activity feed, search bar (relocated to top bar) | useHomeFeed, useSearch |
| `app/artist/[slug].tsx` | Artist profile, founder badge, discover button | useArtistProfile, useMyCollectedIds |
| `lib/urlParser.ts` | Client-side URL parsing — platform detection from paste | Called by add.tsx before API call |
| `lib/api.ts` | Authenticated fetch wrapper with 401 recovery | All hooks that call Next.js API |
| `lib/supabase.ts` | Direct Supabase JS client (read-only queries on client) | useVenueDetection, useArtistProfile |
| `hooks/useVenueDetection.ts` | GPS + Haversine, queries venues + events from Supabase directly | useLocation, Supabase JS client |
| `hooks/useLocation.ts` | expo-location wrapper, foreground-only permission | useVenueDetection |
| `hooks/useAddArtist.ts` | POST /mobile/add-artist, haptics, cache invalidation | apiCall, TanStack Query |
| `hooks/useShareCard.ts` | Generate + download share card PNGs, clipboard | expo-file-system, Clipboard |
| `stores/authStore.ts` | Session state, sessionExpired modal trigger | lib/api.ts |
| `stores/locationStore.ts` | Persisted permission state | useLocation |
| `src/app/api/mobile/validate-artist-link/route.ts` (NEW) | Parse platform from link, fetch artist metadata, check eligibility | spotify.ts, SoundCloud API |
| `src/app/api/mobile/check-in/route.ts` (NEW) | GPS-verified stamp creation for all lineup artists | Supabase admin, collections table |
| `src/app/api/mobile/tag-performer/route.ts` (NEW) | Tag DJ at a venue with no lineup, create user_tagged_events row | Supabase admin |
| `src/app/api/passport/share-card/route.tsx` (existing) | next/og ImageResponse — renders passport card as PNG | Vercel Edge runtime |
| `src/lib/spotify.ts` (existing) | Spotify token management, artist lookup, monthly listener scrape | Used by validate-artist-link |

---

## Recommended Project Structure

```
decibel-mobile/
├── app/
│   ├── (tabs)/
│   │   ├── add.tsx              # + tab — Add Artist / Check In toggle
│   │   ├── index.tsx            # Home — feed + top search bar
│   │   └── passport.tsx         # Passport — Finds grid + Stamps
│   ├── artist/
│   │   ├── [slug].tsx
│   │   └── fans.tsx
│   ├── check-in/
│   │   ├── scenario-a.tsx       # Known venue + lineup → auto stamp
│   │   ├── scenario-b.tsx       # No lineup → tag DJ
│   │   └── scenario-c.tsx       # Unknown venue → add + tag
│   └── add-artist/
│       ├── paste.tsx            # Link paste input
│       ├── preview.tsx          # Artist preview + eligibility result
│       └── celebration.tsx      # Post-found confetti + badge reveal
├── src/
│   ├── components/
│   │   ├── stamps/
│   │   │   ├── StampCard.tsx         # Analog passport stamp visual
│   │   │   └── StampAnimation.tsx    # Rubber stamp Lottie + haptics
│   │   ├── finds/
│   │   │   ├── FindCard.tsx          # Digital artist card (2x3 grid)
│   │   │   └── FindCelebration.tsx   # Post-found confetti
│   │   ├── add/
│   │   │   ├── LinkPasteInput.tsx    # Clipboard + share extension receiver
│   │   │   └── ArtistPreviewCard.tsx # Metadata preview before confirm
│   │   └── checkin/
│   │       ├── VenueCard.tsx
│   │       └── LineupList.tsx
│   ├── hooks/
│   │   ├── useVenueDetection.ts  # GPS + Haversine (already built)
│   │   ├── useLocation.ts        # expo-location wrapper (already built)
│   │   ├── useAddArtist.ts       # POST /mobile/add-artist (already built)
│   │   ├── useCheckIn.ts         # POST /mobile/check-in (NEW)
│   │   ├── useTagPerformer.ts    # POST /mobile/tag-performer (NEW)
│   │   ├── useValidateLink.ts    # POST /mobile/validate-artist-link (NEW)
│   │   └── useShareCard.ts       # PNG download + share (already built)
│   ├── lib/
│   │   ├── urlParser.ts          # Client-side platform detection (already built)
│   │   ├── api.ts                # Auth fetch wrapper (already built)
│   │   ├── supabase.ts           # Supabase JS client (already built)
│   │   └── animations.ts         # Lottie config, shared animation constants
│   ├── stores/
│   │   └── ...                   # Zustand stores (already built)
│   └── types/
│       └── index.ts              # Shared types (already built)
decibel/ (backend)
└── src/app/api/
    ├── mobile/
    │   ├── validate-artist-link/ # NEW
    │   ├── check-in/             # NEW
    │   ├── tag-performer/        # NEW
    │   ├── search-artists/       # NEW
    │   └── artist-fans/          # NEW
    ├── passport/share-card/      # Existing — expand for founder card
    └── share-card/
        ├── founder/              # NEW
        └── passport/             # NEW (or consolidate with existing)
```

---

## Architectural Patterns

### Pattern 1: Two-Phase Link Validation (Client Parses, Server Validates)

**What:** `urlParser.ts` runs entirely on the client to extract platform + artistId from a pasted URL. Then `POST /mobile/validate-artist-link` hits Spotify/SoundCloud APIs server-side to fetch artist metadata and check the eligibility threshold. The client never calls Spotify directly.

**When to use:** Any time secrets (API keys) or expensive operations (monthly listener scraping) are involved. The client parse is instant and gives user feedback before the network roundtrip.

**Trade-offs:** Adds one network hop vs calling Spotify from the client; but keeps API keys off the device, avoids CORS issues, and centralizes eligibility logic so it can't be bypassed.

**Data flow:**
```
User pastes URL
    → urlParser.ts (sync, client) → { platform, artistId } or null
        → if valid: POST /mobile/validate-artist-link { platform, artistId }
            → spotify.ts getSpotifyArtist() + scrapeMonthlyListeners()
            → Eligibility check: monthly_listeners < 1_000_000
            → Return: { eligible, artist: { name, photo, genres, followers } }
        → if ineligible: show rejection message
        → if eligible: show ArtistPreviewCard → user confirms
            → useAddArtist.mutate() → POST /mobile/add-artist
```

**Example:**
```typescript
// In add.tsx or useValidateLink.ts
const parsed = parseArtistUrl(pastedText);       // instant, no network
if (!parsed) return showError("Unrecognized link");

const result = await apiCall("/mobile/validate-artist-link", {
  method: "POST",
  body: JSON.stringify(parsed),
});

if (!result.eligible) return showRejection(result.reason);
showPreview(result.artist);
```

---

### Pattern 2: Client-Side GPS with Server-Side Stamp Creation

**What:** GPS acquisition and Haversine venue matching run entirely on the client (in `useVenueDetection`). The server never receives raw coordinates — only the resolved `venue_id`. Stamp creation (writing to `collections`) happens server-side where auth and dedup can be enforced.

**When to use:** GPS data should never leave the device unnecessarily. Venue matching is a pure calculation (no secrets), so doing it client-side avoids sending PII to the backend.

**Trade-offs:** Client-side venue DB fetch is fine because Chicago-scale venue sets are small (< 200 rows). At city-scale growth, this query moves to a PostGIS bounding-box filter on the server.

**Data flow:**
```
User taps "I'm at a Show"
    → requestPermission() (one-time, foreground only)
    → getCurrentPosition() → { lat, lng }
    → Supabase direct query: SELECT * FROM venues
    → haversineDistance() filter → nearbyVenues[]
    → Supabase query: events WHERE venue_id IN [...] AND event_date = today
    → Resolved: { venue, performers[] } → render lineup

User confirms lineup
    → POST /mobile/check-in { venue_id, event_ids[], performer_ids[] }
        → Server: auth check, dedup check, INSERT collections (capture_method=live, verified=true)
        → Return: { stamps_created: N }
    → StampAnimation plays
```

---

### Pattern 3: Server-Side PNG Share Cards via next/og ImageResponse

**What:** Share cards are generated as PNG images on the Next.js backend using `next/og` + `ImageResponse` (Vercel Edge runtime). The mobile app downloads the PNG to the cache directory and shares via `expo-sharing` / system sheet.

**When to use:** This pattern already works in the codebase (passport share card, artist share card). Follow exactly the same approach for new card types (founder, check-in stamp).

**Trade-offs:** Edge runtime renders JSX to PNG in ~100-200ms. Cannot use custom fonts without explicit font loading in the edge function. Cannot use `server-only` imports — edge runtime is distinct from Node.js runtime.

**Data flow:**
```
User taps "Share"
    → usePassportShareCard.generate(params)
        → Build query string with card data (name, stats, slug)
        → fetch() GET /api/passport/share-card?name=...
            → next/og ImageResponse renders JSX → PNG binary
        → File.downloadFileAsync() → local cache path (expo-file-system)
    → expo-sharing shareAsync(localUri)
    OR
    → expo-clipboard setStringAsync(publicUrl)
```

**New cards follow identical pattern:**
```typescript
// decibel/src/app/api/share-card/founder/route.tsx
export const runtime = "edge";
export async function GET(req: Request) {
  // ... parse params, return new ImageResponse(<FounderCard />, { width: 1200, height: 630 })
}
```

---

### Pattern 4: Lottie + Haptics for Rich Animations

**What:** Complex animations (stamp slam, confetti, badge reveal) use Lottie via `lottie-react-native`. Haptic feedback fires at the exact visual frame where impact occurs using `expo-haptics`. Simple transitions (card reveals, fade-ins) use `react-native-reanimated` `withSpring` / `withTiming`.

**When to use:** Lottie for frame-accurate, designer-controlled animations. Reanimated for programmatic transitions. Never use `Animated` (legacy) API.

**Trade-offs:** Lottie requires bundling JSON animation files (typically 10-50KB each). Reanimated runs on the UI thread — safe from JS bridge jank.

**Stamp animation sequence:**
```
1. User confirms check-in
2. StampAnimation renders above viewport (y: -300)
3. withSpring: y → 0 (stamp falls)
4. At y=0: Haptics.impactAsync(Heavy) — impact
5. Lottie ink-spread plays (150ms)
6. StampCard fades in below stamp
7. Stamp lifts: withSpring y → -400, opacity → 0
8. Celebration: confetti Lottie, badge reveal if founder
```

---

### Pattern 5: Apple Music — Name-Cross-Reference Strategy

**What:** Apple Music URLs don't expose a public API for listener counts or eligibility. For Apple Music links, extract the artist name from the URL or Apple Music API, then cross-reference on Spotify by name. If found on Spotify, use Spotify listener count. If not found, default to eligible.

**When to use:** Only for Apple Music URLs. Not needed for Spotify (direct ID lookup) or SoundCloud (direct followers API).

**Why this approach:** Apple Music API (MusicKit) requires server-side Apple developer token generation (JWT with ES256 signing). That infrastructure exists on the backend but is less battle-tested. Cross-referencing by name is simpler and the fallback-to-eligible behavior correctly favors discovery.

**Implementation note:** `apple_music_id` column already exists on performers table (per CLAUDE.md). Add `apple_music_url` to the insert in `/mobile/add-artist`.

---

## Data Flow

### Add Artist Flow (Full)

```
User pastes URL (or receives via Share Extension)
    ↓
urlParser.ts (client, sync)
    ↓ { platform, artistId }
POST /mobile/validate-artist-link
    ↓ spotify.ts / SoundCloud API
    ↓ Eligibility check
    ↓ { eligible: true/false, artist: { name, photo, genres, monthly_listeners } }
ArtistPreviewCard shown
    ↓ User taps "Add"
POST /mobile/add-artist
    ↓ performers INSERT (if new) or EXISTS check
    ↓ collections INSERT { capture_method: 'online' }
    ↓ founder_badges INSERT (if new performer)
    ↓ fan_tiers UPSERT
    ↓ { already_exists, is_founder, performer }
useAddArtist.onSuccess
    ↓ Haptics (Heavy if founder, Medium otherwise)
    ↓ invalidateQueries(['passport', 'fanBadges'])
    ↓ Navigate to celebration screen
FindCelebration
    ↓ Lottie confetti
    ↓ Badge reveal (Gold ★ or Purple compass)
    ↓ Share prompt → useShareCard.generate()
```

### Check-In Flow (Full)

```
User taps "I'm at a Show"
    ↓
useLocation.requestPermission() (if not granted)
    ↓ granted
useVenueDetection query fires
    ↓ Supabase: SELECT * FROM venues (all, client-side filter)
    ↓ haversineDistance() ≤ 200m
    ↓ Supabase: SELECT events WHERE venue_id IN [...] AND event_date = today
    ↓ Result: { venue, performers[] }

Scenario A: venue match + lineup found
    ↓ Show venue card + performer list
    ↓ User taps "Collect All"
    POST /mobile/check-in { venue_id, event_ids, performer_ids }
        ↓ Auth check
        ↓ Dedup: check existing collections for (fan_id, performer_id, method=live)
        ↓ INSERT collections (verified: true, capture_method: 'live')
    StampAnimation × N stamps

Scenario B: venue match, no lineup
    ↓ "Is there live music?" prompt
    ↓ Yes → "Tag a performer" → LinkPasteInput (same Add flow)
    POST /mobile/tag-performer { venue_id, performer_id, event_date }
        ↓ INSERT user_tagged_events
        ↓ INSERT collections (verified: false initially)
    StampAnimation

Scenario C: no venue match
    ↓ "Where are you?" → user types venue name
    ↓ POST /mobile/check-in { venue_name_freetext, lat, lng, performer_id }
        ↓ INSERT venues (or fuzzy match existing)
        ↓ INSERT user_tagged_events
        ↓ INSERT collections
    StampAnimation
```

### Share Card Flow

```
User taps Share
    ↓
usePassportShareCard.generate(params)  OR  useFounderShareCard.generate(params)
    ↓
GET /api/share-card/[type]?[querystring]  (Vercel Edge)
    ↓ ImageResponse renders JSX → PNG bytes
    ↓
File.downloadFileAsync(url, cacheFile)  (expo-file-system)
    ↓ local file URI
expo-sharing.shareAsync(uri)  OR  expo-sharing.shareAsync(uri, { mimeType: 'image/png' })
```

---

## Component Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Mobile ↔ Next.js API | HTTPS REST, Bearer JWT (Supabase token) | apiCall() wrapper handles 401 recovery |
| Mobile ↔ Supabase | Supabase JS client, anon key | Only for read-only queries (venues, artists, feed) |
| Next.js API ↔ Supabase | Service Role key via supabase-admin.ts | All writes go through here, never the client |
| Next.js API ↔ Spotify | Server-side fetch, cached access token in module scope | Client Credentials fallback if OAuth refresh fails |
| Next.js API ↔ SoundCloud | Server-side fetch (SoundCloud API or scrape) | Existing scraper infra on DigitalOcean VM |
| Mobile ↔ Share Cards | GET request → PNG binary → local file → Share sheet | No auth needed on share card endpoints (params are not secret) |
| useVenueDetection ↔ Supabase | Direct Supabase JS client (not via Next.js API) | Acceptable: venue table is read-only, no PII |

---

## Build Order (Phase Dependencies)

The four features in this milestone have strict dependencies. Build order:

```
1. validate-artist-link endpoint (backend)
   → Depends on: existing spotify.ts (already built)
   → Blocks: Add Artist UI flow

2. urlParser.ts extensions (client)
   → Add Apple Music URL support
   → Depends on: nothing
   → Blocks: Add Artist UI flow

3. Add Artist UI flow — paste.tsx + preview.tsx (client)
   → Depends on: validate-artist-link endpoint, urlParser extensions
   → Blocks: celebration.tsx, share cards

4. Check-in backend endpoints (backend)
   → check-in, tag-performer routes
   → Depends on: user_tagged_events table migration (if not exists)
   → Blocks: Check-In UI flow

5. Check-in UI flow — scenario screens (client)
   → Depends on: check-in backend, useVenueDetection (already built)
   → Blocks: StampAnimation

6. StampAnimation component (client)
   → Depends on: lottie-react-native install, Lottie JSON file
   → Blocks: Check-in completion UX

7. Passport Redesign — Finds grid + Stamps section (client)
   → Depends on: collections data shape (already exists)
   → Blocks: nothing (parallel with check-in)

8. Share Card — founder card + stamp card endpoints (backend)
   → Depends on: existing share-card pattern (already built)
   → Blocks: post-found celebration prompt

9. FindCelebration component + share prompt (client)
   → Depends on: share card endpoints, lottie-react-native
   → Depends on: Add Artist flow working end-to-end
```

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Spotify Web API | Server-side only via `spotify.ts`. Client Credentials + OAuth refresh token fallback. Token cached in module scope. | Monthly listener scrape (`open.spotify.com/artist/{id}` HTML) is fragile — Spotify can change the markup. Parse with regex, return 0 on failure (treated as underground). |
| SoundCloud | Existing scraper infra on DigitalOcean VM. For validate-artist-link, call SoundCloud API from Next.js API route directly (simpler than round-tripping to VM). | SoundCloud's public API returns follower_count without auth for public profiles. |
| Apple Music | MusicKit API on Next.js — requires Apple developer JWT (ES256). Cross-reference by name to Spotify for eligibility. | If Apple Music API is not yet wired, use name-based Spotify cross-reference. Default to eligible if name not found. |
| expo-location | Foreground permission only. `Location.Accuracy.Balanced` for check-in (fast enough, battery-safe). | Re-request permission flow: check `canAskAgain`. If false, open Settings. |
| lottie-react-native | Bundled JSON animation files. Stamps slam animation, confetti animation, badge reveal. | Must test on physical device — Lottie may behave differently on Expo Go vs standalone. Use `eas update` for preview testing. |
| next/og ImageResponse | Vercel Edge runtime for share cards. Cannot use Node.js APIs. Custom Poppins font must be fetched via `fetch()` in the edge function at runtime. | Font binary must be hosted as a static asset or fetched from Google Fonts. Avoid large images as base64 — pass photo_url as URL parameter. |
| expo-file-system (`File` API) | Used for downloading share card PNGs to cache. The `File` + `Paths` API is SDK 55+ (already in use). | Cache files accumulate — consider cleaning up old share card files periodically. |
| expo-sharing | Triggers system share sheet with local file URI. Works for photos/PNG natively. | On Android, URI must be exposed via FileProvider — Expo handles this automatically. |
| expo-haptics | `ImpactFeedbackStyle.Heavy` for stamp impact frame, `Medium` for discovered, `Heavy` for founded. | Haptics are no-ops on simulator. Always test on device. |

---

## Anti-Patterns

### Anti-Pattern 1: Calling Spotify / SoundCloud from the Mobile Client

**What people do:** Add Spotify Client ID + Secret to mobile app env, call Spotify API directly from the React Native app.

**Why it's wrong:** Client Credentials embedded in a mobile bundle are extractable. App Store scraping tools can extract them. Monthly listener HTML scraping would also be blocked by CORS from a browser/mobile context.

**Do this instead:** All platform API calls go through `/api/mobile/validate-artist-link` on the Next.js backend. The mobile client sends the parsed `{ platform, artistId }` and receives clean artist metadata back.

---

### Anti-Pattern 2: Sending Raw GPS Coordinates to the Backend

**What people do:** POST `{ lat, lng }` to the server and have the server do venue matching.

**Why it's wrong:** Unnecessary PII in server logs. The venue dataset is small and public (no secrets). Haversine is a pure calculation — no reason to move it to the server.

**Do this instead:** Match venue client-side in `useVenueDetection`. Only send the resolved `venue_id` to the server for stamp creation. The server validates that the venue_id exists but doesn't need coordinates.

---

### Anti-Pattern 3: Direct Supabase Writes from the Mobile Client

**What people do:** Use the Supabase JS client's anon key to INSERT into collections, performers, or founder_badges directly from the app.

**Why it's wrong:** Anon key + Row Level Security is harder to reason about than a server-side auth check. Business logic (eligibility, dedup, founder-badge assignment) belongs on the server. RLS bugs can allow duplicate founders or invalid stamps.

**Do this instead:** All writes (add artist, check-in, follow) go through Next.js API routes using the service role key. Client uses Supabase JS only for reads: activity feed, venue lookup, artist profiles.

---

### Anti-Pattern 4: Generating Share Card Images on the Client

**What people do:** Use `react-native-view-shot` to screenshot a component and share the screenshot.

**Why it's wrong:** Font rendering inconsistencies across devices. No consistent dark background. Image quality tied to device pixel density. Hard to include off-screen or dynamic content.

**Do this instead:** Generate cards server-side with `next/og` `ImageResponse` (Vercel Edge). The pattern is already established in the codebase — follow it for all new card types.

---

### Anti-Pattern 5: Running Venue Detection Continuously in Background

**What people do:** Set up a background location task that periodically checks proximity and auto-prompts check-in.

**Why it's wrong:** Background location is a significant privacy implication that adds App Store review friction. "Always On" permission is much harder to justify. The PRD specifies "While Using" only.

**Do this instead:** Run `useVenueDetection` only when the + tab is active or when the app returns to foreground (already implemented via `AppState.addEventListener` in the existing hook). User explicitly initiates check-in.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-5k users | Current architecture is fine. Venue table fetched client-side is fast. Edge share card generation handles burst easily. |
| 5k-50k users | Move venue lookup to server-side with PostGIS bounding-box query (`ST_DWithin`) — send `{ lat, lng, radius }` to a `/mobile/nearby-venues` endpoint. Avoids fetching full venue table to client. |
| 50k+ users | Cache popular artists' eligibility results in Supabase (spotify_listeners_updated_at column exists). Add rate limiting on validate-artist-link (Spotify API has rate limits). Consider Redis or Upstash for share card metadata caching. |

### Scaling Priorities

1. **First bottleneck:** Spotify monthly listener scraping is synchronous and takes 1-3 seconds per artist. At scale, cache the result in `performers.spotify_monthly_listeners` + `spotify_listeners_updated_at`. Re-check only if stale (> 7 days).
2. **Second bottleneck:** Venue table client fetch. At > 500 venues, switch to server-side PostGIS query.

---

## Sources

- Existing codebase: `/home/swarn/decibel-mobile/src/` — verified patterns (urlParser, useVenueDetection, useLocation, useAddArtist, useShareCard, api.ts)
- Existing backend: `/home/swarn/decibel/src/` — verified patterns (spotify.ts, add-artist route, share-card ImageResponse routes)
- Next.js App Router + `next/og` ImageResponse: Edge runtime, confirmed in `/home/swarn/decibel/src/app/api/passport/share-card/route.tsx`
- Haversine client-side matching: implemented and verified in `useVenueDetection.ts` with 200m default radius
- Auth pattern: Bearer JWT → `admin.auth.getUser()` → email lookup → fan_id, confirmed in all existing mobile API routes
- Confidence: HIGH — all patterns verified against running code, not hypothetical

---

*Architecture research for: Decibel Mobile — link-paste add flow, GPS check-in, server-side share cards, rich animations*
*Researched: 2026-03-10*
