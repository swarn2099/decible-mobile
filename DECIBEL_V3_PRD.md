# DECIBEL v3.0 PRD — "The Living Passport"

**Milestone:** v3.0  
**GSD Milestone Name:** `v3.0 — The Living Passport`  
**Author:** Swarn  
**Date:** March 12, 2026  
**Repo:** swarn2099/decible-mobile  
**Stack:** React Native (Expo), TypeScript, Supabase, Vercel (light API), DigitalOcean VM (heavy scraping)  
**Prereqs:** v2.0 mobile app deployed, existing Supabase schema, scraper pipeline operational

---

## Overview

v3.0 transforms Decibel from a static collection app into a living, social music discovery platform. Three major features:

1. **Jukebox** — A social music discovery feed powered by your network's Finds
2. **"I'm at a Show"** — A magic check-in flow that auto-detects venue + lineup and awards Stamps/Founders
3. **Glassy Passport Redesign** — Three-tab passport (Stamps / Finds / Discoveries) with frosted glass UI

### Collection Type Definitions (canonical)

- **Stamp** — Earned by attending a live event. Requires physical presence at a venue. Proves "I was there."
- **Find** — Earned by adding an artist to the platform via link paste (Spotify/Apple Music/SoundCloud URL). Proves "I have taste." If the artist has never been added before, the user also receives the one-of-one **Founder Badge**.
- **Discovery** — Earned by collecting an artist you encountered through another user's Find on the platform (via Jukebox feed or browse). Proves "the network works."

---

## Phase 1: Jukebox — Social Music Discovery Feed

**Estimated build:** 3-4 days  
**Priority:** High — this is the retention engine

### 1.1 Entry Point

- Replace the current non-functional map button on the Home screen with a **Jukebox icon button** (music note or jukebox glyph)
- Tapping opens the Jukebox screen as a modal or push navigation

### 1.2 Data Flow

1. On screen load, hit API: `GET /api/jukebox?userId={id}`
2. Backend logic:
   - Get all users the current user follows
   - Query Finds from those users in the **last 48 hours**
   - For each Find, resolve the artist's **top track** from the platform they were added from:
     - **Spotify**: Use oEmbed endpoint (`https://open.spotify.com/oembed?url={trackUrl}`) or cached top track from scraper. Embed URL: `https://open.spotify.com/embed/track/{trackId}?theme=0`
     - **SoundCloud**: Widget embed URL: `https://w.soundcloud.com/player/?url={trackUrl}&color=%23FF4D6A&auto_play=false&show_artwork=true`
     - **Apple Music**: Embed URL: `https://embed.music.apple.com/us/album/{albumId}?i={trackId}&app=music`
   - Return array of `{ finder: User, artist: Artist, platform: string, embedUrl: string, trackName: string, foundAt: timestamp }`
3. If no finds in 48 hours from followed users, fall back to **all Finds from the last 48 hours across the platform** (global discovery)
4. If still empty (early days), show an empty state: "No new finds yet. Follow more people or add artists yourself."

### 1.3 Screen Layout

- Vertical scroll of **cards**
- Each card contains:
  - **Top section:** Finder's avatar + username + "found X hours ago"
  - **Middle section:** Artist name + platform icon badge (Spotify green / SoundCloud orange / Apple pink)
  - **Bottom section:** Embedded player via `react-native-webview`, lazy-loaded (mount WebView only when card scrolls into viewport, unmount when it leaves)
- **One-tap Collect button** on each card — tapping adds the artist as a **Discovery** to the current user's passport
  - On collect: haptic feedback, button state changes to "Discovered ✓"
  - Send notification to the finder: "{username} discovered an artist from your find"

### 1.4 Performance Considerations

- **Lazy-load WebViews** — Only mount embedded players for cards currently in or near the viewport. Use `onViewableItemsChanged` from FlatList to track visibility. Max 3 active WebViews at any time.
- **Cache embed URLs** — Store resolved top track URLs in Supabase so repeat loads don't re-fetch from platform APIs
- Spotify/Apple Music: 30-second preview for non-logged-in users. This is acceptable — 30 seconds is enough to decide to collect.
- SoundCloud: Full playback without auth

### 1.5 API Endpoint

**Location:** Vercel (`/api/jukebox`)  
This is a lightweight query — Supabase joins on follows + finds + artists. No heavy computation. Vercel is fine.

### 1.6 Supabase Schema Additions

```sql
-- No new tables needed. Uses existing:
-- follows (follower_id, following_id)
-- collections (user_id, artist_id, type: 'find'|'stamp'|'discovery', created_at)
-- artists (id, name, platform, platform_url, spotify_top_track_url, soundcloud_top_track_url, apple_music_top_track_url)

-- Add columns to artists table if not present:
ALTER TABLE artists ADD COLUMN IF NOT EXISTS spotify_embed_url TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS soundcloud_embed_url TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS apple_music_embed_url TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS top_track_cached_at TIMESTAMPTZ;
```

### 1.7 Acceptance Criteria

- [ ] Map button replaced with Jukebox icon on Home screen
- [ ] Jukebox screen loads Finds from followed users in last 48 hours
- [ ] Each card shows finder info, artist info, and embedded player
- [ ] Spotify, SoundCloud, and Apple Music embeds all render and play
- [ ] Max 3 WebViews active at once (lazy loading works)
- [ ] One-tap collect adds Discovery to passport
- [ ] Finder receives notification on collect
- [ ] Empty state displays when no finds available
- [ ] Fallback to global finds when followed-user finds are empty

---

## Phase 2: "I'm at a Show" — Magic Check-in Flow

**Estimated build:** 5-7 days  
**Priority:** Critical — this is the core emotional moment of the app

### 2.1 Entry Point

- User taps **+** tab in the bottom nav bar
- On the add screen, there is an **"I'm at a Show"** button/tab
- Tapping requests location permission (if not already granted) with pre-prompt: "Decibel uses your location to find what's playing near you right now"

### 2.2 Happy Path Flow

1. **Get location** — `expo-location` foreground permission, get current lat/lng
2. **Resolve venue** — Query Supabase `venues` table by lat/lng proximity (within ~100m radius using PostGIS `ST_DWithin` or simple haversine)
3. **Find tonight's event** — Query `events` table for this venue + today's date
4. **Resolve lineup** — Get artists associated with this event from `event_artists` junction table
5. **Display to user:**
   - Show venue name + event name at top
   - List each artist on the lineup as a card
   - For each artist, show:
     - If **no one has ever added this artist** → "🌟 Founder available! You'll be the first to add [Artist] + earn a Stamp"
     - If **artist already exists on platform** → "Stamp available. Founded by @{username}"
   - **"Collect All" button** at the bottom — one tap stamps every artist on the lineup
   - Individual collect buttons per artist if user only wants specific ones
6. **On collect:**
   - Create Stamp entry in collections
   - If Founder eligible: also create Find entry + award Founder Badge
   - Confetti + haptic for each Founder, subtle haptic for each Stamp
   - Show summary: "You stamped 3 artists tonight. You're the Founder of 2!"

### 2.3 Scraping Waterfall (when DB has no match)

**This is the critical fallback. Run on the DigitalOcean VM, not Vercel.**

**Architecture:**
- Mobile app calls Vercel API: `POST /api/show-checkin` with `{ lat, lng }`
- Vercel checks Supabase (Layer 1). If match found, return immediately.
- If no match, Vercel fires async request to **DigitalOcean scraper service** and returns `{ status: "searching", searchId: uuid }` to the app
- App subscribes to Supabase realtime on `search_results` table filtered by `searchId`
- VM writes result to `search_results` when complete
- App picks up result and renders
- **Timeout: 15 seconds max.** After 15 seconds, fall back to manual form.

**Scraping layers (run in parallel on VM):**

**Layer 1 — Supabase DB (instant, runs on Vercel)**
- Venue match by proximity + event match by date
- If found, return immediately. Cancel all other layers.

**Layer 2 — Event Platform APIs (1-3 seconds)**
- Hit simultaneously: Resident Advisor (GraphQL), DICE API, EDMTrain, 19hz.info, Songkick, Bandsintown, Eventbrite
- Search by venue name AND/OR lat/lng radius
- Parse results for tonight's date, extract artist names

**Layer 3 — Google Places Enrichment (2-4 seconds)**
- Reverse geocode lat/lng → venue name, category, Google Place ID, website URL
- Feed venue name back into Layer 2 if initial lat/lng search missed
- Use venue category (bar, nightclub, music_venue, restaurant) as signal for Layer 6

**Layer 4 — Social Media Scraping (3-6 seconds)**
- Instagram location page for the venue: recent posts from today, extract artist names from captions/flyer text
- Facebook Events: search by venue name + tonight's date
- Twitter/X: search `"{venue name}" tonight OR "live" OR "playing"`
- Run extracted text through LLM to parse artist names from noisy social content

**Layer 5 — Venue Website Scrape (3-8 seconds)**
- If Layer 3 returned a website URL, fetch it via headless browser (Playwright on VM)
- Run HTML through LLM prompt: "Extract performer names and set times for {today's date} from this page"
- Also try: Google search `"{venue name}" events tonight site:{venue_domain}`

**Layer 6 — LLM Search Augmentation (5-10 seconds)**
- Claude API call with web search enabled
- Prompt: "What live music or DJ performances are happening at {venue name} in {neighborhood}, {city} tonight, {date}?"
- Catches: dive bar blues jams, restaurant jazz trios, brewery folk nights, community calendar listings
- Use venue category from Layer 3 to guide search (jazz club → search for jazz, nightclub → search for DJs)

**Layer 7 — Crowdsource (passive, ongoing)**
- Every manual form submission writes to `venue_submissions` table
- Over time, detect recurring patterns: "this venue has live music every Thursday"
- Feed patterns back into Layer 1 predictions

**Confidence scoring:**
- **High** (Layer 1-2 match with full lineup): Show immediately, no confirmation needed
- **Medium** (Layer 3-5 partial match): Show with confirmation prompt — "Looks like {Artist} might be playing. Is that right?"
- **Low** (Layer 6 inference only): Pre-fill manual form with best guess, let user confirm/edit

### 2.4 Manual Fallback Form

Only shown after 15-second timeout OR when no scraping layers return results.

**Two fields max:**
1. **Venue name** — text input with autocomplete from existing venues DB
2. **Who's playing?** — text input with option to paste a Spotify/SoundCloud/Apple Music link (reuses existing Find flow)

If venue is new, capture name + use location pin for address (don't ask for address).  
If artist is new, treat as a Find (paste link → create artist → award Founder if eligible).

### 2.5 VM Scraper Service

**Location:** DigitalOcean VM at 159.203.108.156  
**Runtime:** Node.js Express or Python FastAPI service  
**Dependencies:** Playwright (headless browser), axios (API calls), Anthropic SDK (LLM layer)  
**Process manager:** PM2 or run in tmux session like other services  
**Endpoint:** `POST /api/scrape-event` with `{ lat, lng, venueHint?, searchId }`

### 2.6 Supabase Schema Additions

```sql
-- Search results table for async scraping
CREATE TABLE IF NOT EXISTS search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID NOT NULL,
  venue_id UUID REFERENCES venues(id),
  venue_name TEXT,
  event_name TEXT,
  artists JSONB, -- [{name, platform_url?, confidence: 'high'|'medium'|'low'}]
  source TEXT, -- which layer found it
  confidence TEXT, -- 'high', 'medium', 'low'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime on search_results
ALTER PUBLICATION supabase_realtime ADD TABLE search_results;

-- Venue submissions for crowdsource fallback
CREATE TABLE IF NOT EXISTS venue_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  venue_name TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  artist_name TEXT,
  artist_platform_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event-to-artist junction if not exists
CREATE TABLE IF NOT EXISTS event_artists (
  event_id UUID REFERENCES events(id),
  artist_id UUID REFERENCES artists(id),
  set_time TIMESTAMPTZ,
  PRIMARY KEY (event_id, artist_id)
);
```

### 2.7 Location Permission UX

- Before triggering iOS/Android system prompt, show a custom explainer screen:
  - Illustration of the magic moment (venue detected, artists shown)
  - Text: "Decibel uses your location to instantly find who's playing near you"
  - "Enable Location" CTA button → triggers system prompt
  - "Not now" link → skips to manual search
- Only request `whenInUse` permission, never `always`

### 2.8 Acceptance Criteria

- [ ] "I'm at a Show" button accessible from + tab
- [ ] Location permission requested with custom pre-prompt screen
- [ ] Happy path: venue + event + lineup resolved from DB in <1 second
- [ ] Each artist shows Founder availability or existing founder info
- [ ] "Collect All" button stamps entire lineup in one tap
- [ ] Founder Badge + Stamp awarded simultaneously when eligible
- [ ] Confetti + haptic on Founder, subtle haptic on Stamp
- [ ] Summary screen shows results after collection
- [ ] Scraping waterfall fires on VM when DB has no match
- [ ] App shows "Finding out what's playing here..." loading state during scrape
- [ ] Results appear via Supabase realtime subscription within 15 seconds
- [ ] Confidence levels displayed appropriately (high = auto, medium = confirm, low = form prefill)
- [ ] Manual fallback form appears after 15-second timeout
- [ ] Manual form has venue autocomplete + artist link paste
- [ ] New venues and artists created from manual submissions
- [ ] Crowdsource data saved for future pattern detection

---

## Phase 3: Glassy Passport Redesign

**Estimated build:** 3-4 days  
**Priority:** High — this is the identity of the app

### 3.1 Tab Structure

- Three horizontal tabs at top of Passport screen: **Stamps** | **Finds** | **Discoveries**
- Tab indicator uses frosted glass style with blur
- Active tab has a subtle glow or brighter glass effect
- Swipe between tabs enabled (gesture navigation)

### 3.2 Grid Layout

- Each tab shows a **2×4 grid** (8 entries) as preview
- Below the grid: **"View More"** button
- If fewer than 8 entries, show what exists — no empty placeholder cards
- Grid cards have slight stagger/rotation from existing stamp metaphor

### 3.3 Card Design — Frosted Glass Aesthetic

**All cards share:**
- `backdrop-filter: blur(20px)` (or React Native equivalent via `expo-blur` BlurView)
- Semi-transparent background: `rgba(255, 255, 255, 0.08)` on dark
- Subtle border: `1px solid rgba(255, 255, 255, 0.12)`
- Soft shadow: `0 8px 32px rgba(0, 0, 0, 0.4)` — makes cards feel like they float
- Border radius: 16px
- Slight rotation (±1-2°) per card for organic stamp feel
- **Haptic feedback** on tap (light impact)
- Press-in animation on touch (scale to 0.97, spring back)

**Stamp cards show:**
- Artist name (bold, Poppins)
- Venue name (smaller, muted)
- Date (monospaced, bottom of card)
- If Founder: gold ★ wax seal badge in corner
- Background tint: slight pink hue from #FF4D6A

**Find cards show:**
- Artist name (bold, Poppins)
- Platform icon (Spotify/SoundCloud/Apple Music) as small badge
- Monthly listener count at time of Find (formatted: "23K listeners when found")
- If Founder: gold ★ wax seal badge in corner
- Background tint: slight purple hue from #9B6DFF

**Discovery cards show:**
- Artist name (bold, Poppins)
- "via @{username}" — who led you to this artist
- Background tint: slight blue hue from #4D9AFF
- Slightly more transparent than Stamps/Finds (lighter presence, reflects lower conviction)

### 3.4 "View More" Dedicated Page

- Full-screen page with search bar at top
- Search filters by artist name, venue name (Stamps), platform (Finds), or source user (Discoveries)
- List view (not grid) for density — each row shows the same info as the card but in a compact horizontal layout
- Ordered **newest to oldest**
- Infinite scroll with pagination (20 items per page)
- Same frosted glass card style but horizontal/compact
- Pull-to-refresh

### 3.5 Glassmorphism Implementation Notes

**React Native approach:**
```
expo install expo-blur
```
- Use `BlurView` from `expo-blur` with `intensity={40}` and `tint="dark"`
- Wrap card content in BlurView
- Layer: dark background → subtle gradient → BlurView → card content
- Test on both iOS and Android — Android BlurView performance varies, may need fallback to semi-transparent background without blur on older Android devices

**The passport page background:**
- Keep existing dark bg (#0B0B0F)
- Add subtle animated gradient orbs floating behind the cards (slow-moving, low-opacity blurred circles of pink/purple/blue)
- These give the glassmorphism something to blur against, making the frosted effect visible

### 3.6 Supabase Query Structure

```sql
-- Passport tab queries
-- Stamps: collections where type = 'stamp', join with events + venues
SELECT c.*, a.name as artist_name, v.name as venue_name, e.date as event_date,
       EXISTS(SELECT 1 FROM founder_badges fb WHERE fb.artist_id = c.artist_id AND fb.user_id = c.user_id) as is_founder
FROM collections c
JOIN artists a ON c.artist_id = a.id
LEFT JOIN event_artists ea ON c.artist_id = ea.artist_id
LEFT JOIN events e ON ea.event_id = e.id
LEFT JOIN venues v ON e.venue_id = v.id
WHERE c.user_id = $1 AND c.type = 'stamp'
ORDER BY c.created_at DESC
LIMIT 8;

-- Finds: collections where type = 'find'
SELECT c.*, a.name as artist_name, a.platform, a.monthly_listeners_at_find,
       EXISTS(SELECT 1 FROM founder_badges fb WHERE fb.artist_id = c.artist_id AND fb.user_id = c.user_id) as is_founder
FROM collections c
JOIN artists a ON c.artist_id = a.id
WHERE c.user_id = $1 AND c.type = 'find'
ORDER BY c.created_at DESC
LIMIT 8;

-- Discoveries: collections where type = 'discovery'
SELECT c.*, a.name as artist_name, u.username as discovered_via
FROM collections c
JOIN artists a ON c.artist_id = a.id
LEFT JOIN collections source_find ON source_find.artist_id = c.artist_id AND source_find.type = 'find'
LEFT JOIN users u ON source_find.user_id = u.id
WHERE c.user_id = $1 AND c.type = 'discovery'
ORDER BY c.created_at DESC
LIMIT 8;
```

### 3.7 Acceptance Criteria

- [ ] Three tabs (Stamps / Finds / Discoveries) render on Passport screen
- [ ] Tab switching works via tap and swipe gesture
- [ ] Each tab shows 2×4 grid of frosted glass cards
- [ ] Cards have backdrop blur, soft shadow, slight rotation, transparent borders
- [ ] Stamp cards show artist + venue + date + Founder badge if applicable
- [ ] Find cards show artist + platform icon + listener count + Founder badge if applicable
- [ ] Discovery cards show artist + "via @username"
- [ ] Each card type has correct color tint (pink/purple/blue)
- [ ] Haptic feedback + press-in animation on card tap
- [ ] "View More" button navigates to dedicated full page
- [ ] Full page has search bar with relevant filters per tab
- [ ] Full page is ordered newest to oldest with infinite scroll
- [ ] Animated gradient orbs render behind cards on passport bg
- [ ] BlurView performs acceptably on iOS and Android (fallback on low-end Android)
- [ ] Cards with fewer than 8 entries display correctly without empty placeholders

---

## Phase Execution Order

**Recommended sequence for GSD:**

1. **Phase 3 first** (Glassy Passport Redesign) — 3-4 days
   - This is the visual foundation. Stamps/Finds/Discoveries need to display correctly before building the flows that create them.
   - Requires schema clarity on collection types which informs Phase 1 and 2.

2. **Phase 1 second** (Jukebox) — 3-4 days
   - Builds on Phase 3's Discovery collection type.
   - Entirely Vercel + Supabase, no VM work needed.
   - Tests the follow system + collection creation flow.

3. **Phase 2 last** (I'm at a Show) — 5-7 days
   - Most complex. Requires VM scraper service, location permissions, realtime subscriptions.
   - Builds on Phase 3's Stamp display and Phase 1's collection creation patterns.
   - Scraper waterfall can be built incrementally: Layer 1 first (DB lookup), then Layer 2-3 (APIs), then Layer 4-6 (social/web/LLM) as stretch.

**Total estimated build: 11-15 days**

---

## Infrastructure Notes

### Vercel vs DigitalOcean Split

| Component | Where | Why |
|-----------|-------|-----|
| Jukebox API | Vercel | Lightweight Supabase query, <1s response |
| Show check-in (DB lookup) | Vercel | Simple Supabase query, instant response |
| Scraping waterfall | DigitalOcean VM | Long-running, parallel async, headless browser, LLM calls, no timeout constraints |
| Embed URL caching | Vercel cron or VM cron | Periodic top-track resolution for known artists |
| Realtime subscriptions | Supabase | Native realtime on search_results table |

### VM Scraper Service Setup

The scraper service on the VM should be:
- **Express.js** (consistent with existing Node.js tooling on the VM)
- **PM2** process manager (more reliable than tmux for a service that needs to stay up)
- **Playwright** for headless browser scraping (already used in the project for content generation)
- **Anthropic SDK** for Layer 6 LLM calls
- Single endpoint: `POST /api/scrape-event`
- Writes results directly to Supabase via `@supabase/supabase-js`

### Open Bugs to Fix Before v3.0

These should be resolved before starting this milestone:
- [ ] Discover button (non-functional)
- [ ] Listen links (broken)
- [ ] Share modal (broken — critical for future share flows)
- [ ] Leaderboard API (non-functional)

---

## GSD Kickoff Prompt

```
Read CLAUDE.md and DECIBEL_MOBILE_PRD.md and DECIBEL_V3_PRD.md.

Initialize a new GSD milestone: "v3.0 — The Living Passport"

3 phases from DECIBEL_V3_PRD.md:
1. Glassy Passport Redesign (Stamps / Finds / Discoveries tabs, frosted glass cards, View More pages)
2. Jukebox (social music discovery feed, embedded players, one-tap Discover collect)
3. "I'm at a Show" (location-based check-in, scraping waterfall on VM, manual fallback)

Phase execution order: 3 → 1 → 2 (as numbered in the PRD, passport first).

Fix open bugs (Discover button, Listen links, share modal, leaderboard API) as Phase 0 before starting.

Run /compact after each phase completes.
```
