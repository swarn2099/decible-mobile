# Requirements: Decibel Mobile v3.0

**Defined:** 2026-03-12
**Core Value:** Discover underground artists before anyone else (Finds) and prove you were at the show (Stamps) — a live music passport.

## v3.0 Requirements

### Bug Fixes (Phase 0)

- [x] **BUG-01**: User can tap Discover button on an artist profile and it functions correctly (adds Discovery to passport)
- [x] **BUG-02**: Listen links on artist profile open the correct platform URL (only shown when URL exists in DB)
- [x] **BUG-03**: Share modal opens and functions correctly (native OS share sheet with share card)
- [x] **BUG-04**: Leaderboard API returns data and leaderboard screen renders correctly

### DB Migrations

- [x] **MIG-01**: `collection_type` column backfilled from legacy `capture_method` on existing collections
- [ ] **MIG-02**: `search_results` table created with Realtime publication enabled and RLS SELECT policy
- [ ] **MIG-03**: `venue_submissions` table created for crowdsource fallback data
- [x] **MIG-04**: `event_artists` junction table created (if not existing)
- [x] **MIG-05**: Embed URL columns added to `performers` table (spotify_embed_url, soundcloud_embed_url, apple_music_embed_url, top_track_cached_at)
- [x] **MIG-06**: `discovery` type added to collections type constraint
- [x] **MIG-07**: Unique constraint on `performers.spotify_id` to prevent simultaneous Founder race condition

### Glassy Passport

- [x] **GPASS-01**: Passport screen has three horizontal tabs: Stamps | Finds | Discoveries
- [x] **GPASS-02**: Tab switching works via tap and swipe gesture (react-native-pager-view)
- [x] **GPASS-03**: Each tab shows a 2x4 grid of frosted glass cards as preview
- [x] **GPASS-04**: Cards have backdrop blur (expo-blur BlurTargetView pattern for Android), soft shadow, slight rotation, transparent borders
- [x] **GPASS-05**: Stamp cards show artist + venue + date + Founder badge if applicable, pink tint
- [x] **GPASS-06**: Find cards show artist + platform icon + listener count + Founder badge if applicable, purple tint
- [x] **GPASS-07**: Discovery cards show artist + "via @username", blue tint, slightly more transparent
- [x] **GPASS-08**: Haptic feedback (light impact) + press-in animation (scale 0.97, spring back) on card tap
- [x] **GPASS-09**: "View More" button navigates to dedicated full page per tab
- [x] **GPASS-10**: View More page has search bar with relevant filters, newest-to-oldest order, infinite scroll (20 items/page)
- [x] **GPASS-11**: Animated gradient orbs render behind cards on passport background (slow-moving, low-opacity blurred circles)
- [x] **GPASS-12**: BlurView performs acceptably on iOS and Android (fallback to semi-transparent on low-end Android)
- [x] **GPASS-13**: Cards with fewer than 8 entries display correctly without empty placeholders
- [x] **GPASS-14**: Existing BlurView components (StampAnimationModal, SharePrompt, ConfirmationModal) updated to SDK 55 BlurTargetView pattern

### Jukebox

- [x] **JBX-01**: Map button on Home screen replaced with Jukebox icon button
- [x] **JBX-02**: Jukebox screen loads Finds from followed users in last 48 hours
- [x] **JBX-03**: Fallback to all platform Finds when followed-user finds are empty
- [x] **JBX-04**: Each card shows finder avatar + username + time ago, artist name + platform badge
- [x] **JBX-05**: Embedded player via react-native-webview renders and plays (Spotify, SoundCloud, Apple Music)
- [x] **JBX-06**: Max 3 WebViews active at once via onViewableItemsChanged lazy loading
- [x] **JBX-07**: WebView audio does not interrupt iOS background music playback (mediaPlaybackRequiresUserAction)
- [x] **JBX-08**: Unmounted WebViews have audio stopped via injectJavaScript before unmount
- [x] **JBX-09**: One-tap Discover collect button adds Discovery to passport with haptic feedback
- [x] **JBX-10**: Finder receives notification when someone collects from their Find
- [x] **JBX-11**: Empty state displays when no Finds available
- [x] **JBX-12**: Embed URLs cached on performers table for repeat loads
- [x] **JBX-13**: GET /api/mobile/jukebox endpoint returns feed data
- [x] **JBX-14**: POST /api/mobile/discover endpoint creates Discovery collection entry

### "I'm at a Show" Check-in

- [ ] **SHOW-01**: "I'm at a Show" button accessible from + tab
- [ ] **SHOW-02**: Location permission requested with custom pre-prompt explainer screen
- [ ] **SHOW-03**: Happy path: venue + event + lineup resolved from DB in <1 second (Layer 1)
- [ ] **SHOW-04**: Each artist in lineup shows Founder availability or existing founder info
- [ ] **SHOW-05**: "Collect All" button stamps entire lineup in one tap
- [ ] **SHOW-06**: Founder Badge + Stamp awarded simultaneously when eligible
- [ ] **SHOW-07**: Confetti + haptic on Founder, subtle haptic on Stamp
- [ ] **SHOW-08**: Summary screen shows results after collection
- [ ] **SHOW-09**: Scraping waterfall fires on VM when DB has no match (Layers 2-6)
- [ ] **SHOW-10**: Layer 2: Event platform APIs (RA GraphQL, DICE, EDMTrain, Songkick, Bandsintown)
- [ ] **SHOW-11**: Layer 3: Google Places reverse geocode for venue enrichment
- [ ] **SHOW-12**: Layer 4: Social media scraping (Instagram location, Facebook Events, X search)
- [ ] **SHOW-13**: Layer 5: Playwright venue website scrape with LLM extraction
- [ ] **SHOW-14**: Layer 6: Claude API with web search for venue + date query
- [ ] **SHOW-15**: App shows "Finding out what's playing here..." loading state during scrape
- [ ] **SHOW-16**: Results appear via Supabase Realtime subscription within 15 seconds
- [ ] **SHOW-17**: Confidence levels displayed (high = auto, medium = confirm, low = form prefill with link required)
- [ ] **SHOW-18**: Manual fallback form appears after 15-second timeout
- [ ] **SHOW-19**: Manual form has venue autocomplete + artist link paste
- [ ] **SHOW-20**: New venues and artists created from manual submissions
- [ ] **SHOW-21**: Crowdsource data saved to venue_submissions for pattern detection
- [ ] **SHOW-22**: POST /api/mobile/show-checkin Vercel endpoint with fire-and-forget VM dispatch
- [ ] **SHOW-23**: VM scraper service at ~/decibel/scraper/ with PM2 process management
- [ ] **SHOW-24**: Shared secret auth header on VM scraper endpoint
- [ ] **SHOW-25**: Realtime polling fallback when subscription status is CLOSED/TIMED_OUT (iOS background)

### Infrastructure

- [ ] **INFRA-01**: VM scraper Express.js service with shared Playwright browser instance (context-per-request, try/finally cleanup)
- [ ] **INFRA-02**: PM2 ecosystem config with max_memory_restart: 512M
- [ ] **INFRA-03**: Playwright context leak prevention (strict try/finally on every context)

## v4+ Requirements

### Social
- **SOC-01**: "Who's Out Tonight" live friend map
- **SOC-02**: Weekly recap notification

### Content
- **CON-01**: Volume rating system (1-10 fader)
- **CON-02**: Residency pattern detection from crowdsource data
- **CON-03**: Native audio player replacing WebViews (react-native-track-player)

### DJ Platform
- **DJ-01**: Performer profiles with QR, fan collection, stats (Free)
- **DJ-02**: Pro tier ($29/mo)
- **DJ-03**: Agency tier ($79/mo)

### Fantasy League
- **FAN-01**: Monthly tournament — draft 5 Founded artists
- **FAN-02**: Daily Spotify scraper cron

### Advanced Check-in
- **ADV-01**: Crowdsource pattern detection ("recurring residency" prediction)
- **ADV-02**: Liquid Glass (iOS 26+) for passport cards

## Out of Scope

| Feature | Reason |
|---------|--------|
| Text search for external artist catalogs | Replaced by link paste; would undermine eligibility system |
| Deezer API | Eliminated entirely |
| Native audio player (track-player) | Large scope, Spotify SDK complexity — defer to v4+ |
| Layer 4 social scraping (Instagram/Facebook/X) | Platforms actively block scrapers, schemas change frequently — implement as best-effort, not required |
| Liquid Glass (iOS 26+) | Not cross-platform; defer until iOS 26 adoption is meaningful |
| Scenario C (unknown venue GPS miss) | Deferred from v1.0, can be added as stretch in SHOW phase |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 6 | Complete |
| BUG-02 | Phase 6 | Complete |
| BUG-03 | Phase 6 | Complete |
| BUG-04 | Phase 6 | Complete |
| MIG-01 | Phase 7 | Complete |
| MIG-02 | Phase 9 | Pending |
| MIG-03 | Phase 9 | Pending |
| MIG-04 | Phase 8 | Complete |
| MIG-05 | Phase 7 | Complete |
| MIG-06 | Phase 7 | Complete |
| MIG-07 | Phase 7 | Complete |
| GPASS-01 | Phase 7 | Complete |
| GPASS-02 | Phase 7 | Complete |
| GPASS-03 | Phase 7 | Complete |
| GPASS-04 | Phase 7 | Complete |
| GPASS-05 | Phase 7 | Complete |
| GPASS-06 | Phase 7 | Complete |
| GPASS-07 | Phase 7 | Complete |
| GPASS-08 | Phase 7 | Complete |
| GPASS-09 | Phase 7 | Complete |
| GPASS-10 | Phase 7 | Complete |
| GPASS-11 | Phase 7 | Complete |
| GPASS-12 | Phase 7 | Complete |
| GPASS-13 | Phase 7 | Complete |
| GPASS-14 | Phase 7 | Complete |
| JBX-01 | Phase 8 | Complete |
| JBX-02 | Phase 8 | Complete |
| JBX-03 | Phase 8 | Complete |
| JBX-04 | Phase 8 | Complete |
| JBX-05 | Phase 8 | Complete |
| JBX-06 | Phase 8 | Complete |
| JBX-07 | Phase 8 | Complete |
| JBX-08 | Phase 8 | Complete |
| JBX-09 | Phase 8 | Complete |
| JBX-10 | Phase 8 | Complete |
| JBX-11 | Phase 8 | Complete |
| JBX-12 | Phase 8 | Complete |
| JBX-13 | Phase 8 | Complete |
| JBX-14 | Phase 8 | Complete |
| SHOW-01 | Phase 9 | Pending |
| SHOW-02 | Phase 9 | Pending |
| SHOW-03 | Phase 9 | Pending |
| SHOW-04 | Phase 9 | Pending |
| SHOW-05 | Phase 9 | Pending |
| SHOW-06 | Phase 9 | Pending |
| SHOW-07 | Phase 9 | Pending |
| SHOW-08 | Phase 9 | Pending |
| SHOW-09 | Phase 9 | Pending |
| SHOW-10 | Phase 9 | Pending |
| SHOW-11 | Phase 9 | Pending |
| SHOW-12 | Phase 9 | Pending |
| SHOW-13 | Phase 9 | Pending |
| SHOW-14 | Phase 9 | Pending |
| SHOW-15 | Phase 9 | Pending |
| SHOW-16 | Phase 9 | Pending |
| SHOW-17 | Phase 9 | Pending |
| SHOW-18 | Phase 9 | Pending |
| SHOW-19 | Phase 9 | Pending |
| SHOW-20 | Phase 9 | Pending |
| SHOW-21 | Phase 9 | Pending |
| SHOW-22 | Phase 9 | Pending |
| SHOW-23 | Phase 9 | Pending |
| SHOW-24 | Phase 9 | Pending |
| SHOW-25 | Phase 9 | Pending |
| INFRA-01 | Phase 9 | Pending |
| INFRA-02 | Phase 9 | Pending |
| INFRA-03 | Phase 9 | Pending |

**Coverage:**
- v3.0 requirements: 67 total
- Mapped to phases: 67
- Unmapped: 0

---
*Requirements defined: 2026-03-12*
*Last updated: 2026-03-12 — traceability populated after roadmap creation*
