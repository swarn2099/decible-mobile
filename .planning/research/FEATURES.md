# Feature Research

**Domain:** Live music passport — v3.0 new features (Glassy Passport, Jukebox, "I'm at a Show" scraping waterfall)
**Researched:** 2026-03-12
**Confidence:** HIGH (PRD v3.0 as spec, WebSearch-verified on all three technical domains)

---

## Scope

This document supersedes the previous FEATURES.md and focuses specifically on the **three new features** introduced in v3.0. Existing features (link-paste add flow, activity feed, artist/user profiles, following/followers) are treated as stable dependencies.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in music/social apps. Missing these = product feels broken or unfinished.

#### Glassy Passport (Feature 1)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Tab switching (swipe + tap) | Every multi-tab UI in 2026 is swipeable. Tap-only tabs feel broken on mobile. | LOW | `react-native-pager-view` or `@react-navigation/material-top-tabs`. Already in expo SDK. |
| Scroll position preserved per tab | Switching from Stamps → Finds → back to Stamps should not reset scroll to top. | LOW | FlashList + `maintainVisibleContentPosition`. Tabs must use separate scroll state. |
| Empty state per tab | Users with 0 Stamps but 5 Finds must see the Finds grid, not an error. Empty tab shows encouraging copy, not blank space. | LOW | Conditional render: if count === 0 → empty state component, not empty grid. |
| Cards tappable to artist/stamp detail | Tapping a passport card must navigate somewhere. Silent Pressable with no action is confusing. | LOW | Stamps → stamp detail modal or artist profile. Finds → artist profile. Discoveries → artist profile. |
| Grid loads fast (no jank on mount) | Passport tab is the identity screen — users open it to show friends. Perceived performance matters here more than anywhere. | MEDIUM | FlashList over FlatList. Pre-fetch top 8 per tab in the background while app is idle. |
| Correct item count in tab headers | "Stamps (12)" badge on the tab label tells users how many they have at a glance. | LOW | Count comes from the same API query, no extra fetch needed. |

#### Jukebox (Feature 2)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Play/pause embedded tracks | Social music feed without playable audio is just a list of artist names. Users expect to hear a preview. | HIGH | WebView-based Spotify/SoundCloud/Apple Music embeds via react-native-webview. Must actually play. |
| 30-second previews for Spotify (no login) | Spotify's embed behavior for non-authenticated users: 30-second preview then login prompt. This is Spotify's design, not a bug. Users familiar with Spotify embeds expect it. | LOW | It's the default behavior. Do not try to work around it — it would require user Spotify OAuth which is out of scope. |
| Full playback for SoundCloud | SoundCloud widget plays full tracks without auth. This is table stakes for any SoundCloud embed. | LOW | SoundCloud widget URL: `https://w.soundcloud.com/player/?url={trackUrl}`. No auth needed. |
| Loading skeleton while WebView mounts | WebView mounts asynchronously. Empty card flash before player appears = perceived broken state. | LOW | Show a skeleton/shimmer in the card while `onLoadEnd` hasn't fired yet. |
| Scroll stops current player when out of view | Playing audio from a card that's scrolled off-screen is disorienting and annoying. Every modern social audio feed (TikTok, Instagram Reels) pauses off-screen content. | HIGH | `onViewableItemsChanged` on FlatList to track which cards are in viewport. Unmount WebView when card leaves viewport. Max 3 active WebViews at once per PRD spec. |
| One-tap collect with immediate feedback | The Discover button on each card must respond instantly with a state change. Network latency cannot delay the visual confirmation. | LOW | Optimistic update: flip button to "Discovered ✓" immediately, fire API call in background, revert on failure. |
| Empty state for no followed-user Finds | User with no follows, or follows but no activity in 48h, must see an encouraging state — not a broken-looking blank screen. | LOW | Two-tier: (1) no follows → "Follow people to see their Finds here" (2) no recent activity → fall back to global Finds per PRD spec. |

#### "I'm at a Show" Check-In (Feature 3)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Location permission rationale screen | Every app that requests GPS shows a custom explainer before the system dialog. Skipping this causes 40-60% denial rates. | LOW | One screen, shown once, stored in AsyncStorage. "Why does Decibel need location?" with an honest answer. |
| Loading state during venue lookup | GPS call + DB query takes 1-3 seconds on cellular. Blank screen during this = users think it crashed. | LOW | "Finding what's near you..." spinner. Use optimistic venue name display: show venue name as soon as DB match found, before lineup resolves. |
| Venue confirmation step | In dense urban areas (River North, Wicker Park), multiple venues exist within 100m. GPS is ±50m accurate. Silent auto-match will be wrong often enough to damage trust. | LOW | Show: venue name + street + distance ("Smartbar · 3654 N Halsted · 47m away") with a "Not this venue?" fallback. |
| Lineup displayed before collecting | Users must see what they're collecting before tapping "Collect All". No surprise stamps. | LOW | Artist card list showing each performer name + Founder availability status. |
| Individual collect buttons alongside "Collect All" | If user attended but didn't stay for the opener, they shouldn't be forced to stamp artists they didn't see. | LOW | Per-artist toggle state. "Collect All" pre-selects all; user can deselect. |
| Manual fallback always accessible | Scraping fails. APIs go down. The manual form is not just a timeout fallback — some users will skip straight to it. It must be a first-class path. | LOW | "Enter manually" link visible from the very first loading screen, not just after timeout. |
| Stamp appears in passport immediately | After check-in, user navigates to Passport tab. If the new stamp isn't there, they'll tap check-in again and create duplicates. | MEDIUM | Invalidate React Query cache key for passport/stamps after successful check-in. Optimistic insert. |

---

### Differentiators (Competitive Advantage)

Features that set v3.0 apart from anything in the current market.

#### Glassy Passport (Feature 1)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Animated gradient orbs behind frosted glass cards | The glassmorphism effect only works visually when there's something colorful behind the glass to blur. Static dark background makes BlurView invisible. The orbs ARE the design. | HIGH | React Native Skia + Reanimated 3 for GPU-accelerated orbs. Skia runs on the UI thread at 60fps — no JS thread jank. Orbs are slow-moving (8-15 second animation cycle), low-opacity (10-15%), large radii (150-200px). |
| Three-tab passport with distinct visual languages per tab | No music/attendance app differentiates the type of collection at display time. Stamps look analog, Finds look digital, Discoveries look translucent/lighter. One passport, three feelings. | HIGH | Three separate card components. Stamps: pink tint + paper grain overlay + slight rotation. Finds: purple tint + platform badge. Discoveries: blue tint + "via @user" attribution + more transparency. |
| View More full-screen search page | Collections grow over time. A grid of 8 with a searchable full-screen list behind it scales to 500+ collections without overwhelming the passport tab. | MEDIUM | Infinite scroll (FlashList, 20/page), search by artist name / venue / platform / source user. Uses existing Supabase pagination patterns. |
| Gold wax seal badge as Founder indicator on card | The wax seal metaphor connects to the analog passport aesthetic while making Founder status visually prominent. At a glance, users can see which of their finds/stamps are Founder-level. | LOW | SVG or PNG badge overlay in card corner. The gold color (#FFD700) is already in the design system. |
| Press-in animation on card tap (scale 0.97 + spring) | Cards that respond to touch feel premium. This is the difference between a screenshot and an app. | LOW | `useSharedValue` + `withSpring` in Reanimated 3. One-liner per card. |
| Founder badge on Stamp cards (simultaneous Stamp + Find) | v3.0 introduces the ability to earn a Founder badge at a show (if artist is new to the platform). Displaying the gold badge on the Stamp card — not just the Find card — rewards both behaviors from a single check-in action. | MEDIUM | Stamp card must query `founder_badges` table. If user is founder for this artist, show gold ★ on the stamp. This is new in v3.0. |

#### Jukebox (Feature 2)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Social discovery feed tied to your network's taste | Every music streaming app shows you algorithmic recommendations. Jukebox shows you what real humans in your network are finding right now. Trust in human curation over algorithm. | MEDIUM | No recommendation algorithm. Pure follow graph + recency (48h window). The "48 hours" window is intentional — creates urgency ("check in while it's fresh"). |
| One-tap Discover → passport collection | No other music app lets you add to your collection from a social feed. Hearing a preview and tapping one button to claim it is instant gratification. | LOW | `POST /api/jukebox/discover` creates collections row (type: 'discovery') with `source_user_id` field. |
| "via @username" attribution chain | Every Discovery remembers who led you to it. This makes the social graph visible. "You found 12 artists through @brendan's taste" is a stat that drives following behavior. | MEDIUM | `source_user_id` on discovery collection. Displayed on Discovery cards in passport. Becomes a "Tastemaker" metric later. |
| Global fallback when network is quiet | Empty state due to no recent network activity would kill engagement. Global Finds fallback turns the 48h dead zone into a discovery moment instead of a failure state. | LOW | Two-query waterfall in the Jukebox API: followed-users first, if count < 5 → append global Finds to fill. |
| Embed URL caching on artists table | Resolving a top track from Spotify/SoundCloud requires an API call per artist. Cached embed URLs mean the Jukebox API response is one Supabase join, not N+1 external API calls. | MEDIUM | `spotify_embed_url`, `soundcloud_embed_url`, `apple_music_embed_url` columns on performers. Populated by VM cron job. |

#### "I'm at a Show" Check-In (Feature 3)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 7-layer scraping waterfall on VM | No check-in app goes beyond a single event database lookup. Decibel's waterfall — RA, DICE, EDMTrain, Google Places, Instagram, venue website, LLM — means it finds lineups that no other app knows about. | HIGH | Architecture: Vercel handles DB lookup (Layer 1). VM handles layers 2-7 via Express service. VM writes to `search_results` table. Mobile subscribes via Supabase Realtime. |
| Supabase Realtime for async scraping results | Most apps show you "searching..." and then fail or succeed synchronously. Realtime subscription means the result appears in the app the moment the VM finds it, without polling. The UX is "magic" — the lineup just appears. | HIGH | `supabase.channel('search_results').on('postgres_changes', ...)`. Filter by `searchId` to avoid listening to other users' searches. Unsubscribe after result arrives or 15s timeout. |
| Confidence-tiered result display | High-confidence results (Layer 1-2) auto-show. Medium-confidence (3-5) prompt confirmation. Low-confidence (Layer 6) pre-fills the manual form. This nuance prevents false stamps while maximizing successful auto-detections. | MEDIUM | Confidence field on `search_results` row. Mobile renders different UI per confidence tier. |
| Founder + Stamp awarded simultaneously at shows | The highest-value v3.0 innovation: if an artist at tonight's show has never been added to Decibel, the first user to check in becomes their Founder. You don't need to separately "Add" the artist. | HIGH | `POST /api/show-checkin` must check `performers` table for each lineup artist. If not found, create performer + Find collection + founder_badge + Stamp collection in a single transaction. Confetti for Founder, haptic for Stamp. |
| "Collect All" for full lineup in one tap | No check-in app lets you collect an entire lineup simultaneously. Bandsintown lets you RSVP to an event, not collect all artists on it. This creates multi-stamp moments, not just single artist interactions. | LOW | Single API call with array of artist IDs. Backend creates one collections row per artist per user. |
| Summary screen after collect | "You stamped 3 artists tonight. You're the Founder of 2!" — this summary turns a transactional action into a celebration moment. It's the v3.0 version of a post-workout summary on Strava. | LOW | Summary modal showing collected artist names, Founder badges earned, brief stats. Share button available. |
| Crowdsource DB via manual submissions | Every manual "venue + artist" submission improves future auto-detection for the same venue. Over time, recurring patterns (Thursday night residencies, weekly jazz sessions) get detected automatically. | MEDIUM | `venue_submissions` table already in PRD schema. The detection/prediction logic is Beta 2 — but writing to the table at manual form submission is the groundwork. |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem obvious but create real problems for v3.0.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Autoplay on Jukebox card scroll into view | "TikTok does it, we should too" | TikTok works because video is the content. Audio autoplay on a scroll feed means three overlapping songs playing simultaneously when a user scrolls quickly. WebView-based embeds are not controllable like a native audio player — there's no JS API to call pause() on a Spotify iframe. | Tap-to-play only. Show a clear play button overlay on the card. Industry pattern: Twitter/X cards don't autoplay audio. SoundCloud on web does but with a prominent mute button. For WebViews, tap-to-play is the only reliable UX. |
| Keeping all WebViews mounted (no lazy unmounting) | Simpler code — just render all Jukebox cards | Each mounted WebView consumes ~50-80MB of RAM. 10 cards = ~700MB. iOS will kill the app. Android low-memory devices will crash. The PRD's 3-active-WebView limit is not optional — it's a crash prevention requirement. | `onViewableItemsChanged` pattern. Mount WebView only when card enters viewport. Unmount after card scrolls 2 screen-heights away. Confirmed working pattern in React Native production apps. |
| Always-on background location for auto check-in | "Detect I'm at a show automatically" | Background location requires `always` permission on iOS/Android. App Store review scrutiny for always-on location is severe. Users see the orange/blue location indicator 24/7 and disable permissions within days. Battery drain is real. | Explicit "I'm at a Show" intent tap. Foreground `whenInUse` only. The explicit action creates intentionality — users are in the right mindset to collect when they tap it. |
| Polling for scraping results instead of Supabase Realtime | Polling is simpler to implement | Polling every 2 seconds for 15 seconds = 7-8 network requests from the mobile client. On cellular, each request adds perceived latency. Polling-based "still searching" UX is visually noisy. Realtime delivers the result the instant the VM writes it — zero polling overhead. | Supabase Realtime `postgres_changes` subscription on `search_results`. One connection, result arrives via push. Unsubscribe on result or 15s timeout. |
| Storing GPS coordinates in user history | "We could show users a map of where they've been" | Privacy anti-pattern. Users share venue check-in data voluntarily. Storing precise GPS coordinates long-term crosses into surveillance territory. App Store reviewers are sensitive to this. Future feature scope creep. | Store `venue_id` on the stamp collection row. Venue has a location. You know where the show was without needing to store the user's GPS coordinate at the time of check-in. |
| React Native Skia for all card animations | "Skia is the best animation tool in RN" | True for orbs/gradients, but using Skia for card press animations, tab switching, and UI transitions adds compile-time weight and Skia learning curve where Reanimated 3 is already sufficient. Mixing two animation systems creates debugging confusion. | Use Skia specifically for the gradient orbs (GPU-accelerated custom drawing). Use Reanimated 3 for card press, scale, and spring animations. Clear separation of concerns. |
| Android parity for BlurView without fallback | "Both platforms must look identical" | Android BlurView on API level < 31 (Android 11) uses RenderScript fallback which has measurable performance regression. Some mid-range Android devices (common in Decibel's demographic) ship with Android 10. Forcing blur there causes jank on the identity screen. | `blurMethod="dimezisBlurViewSdk31Plus"` — blur on Android 12+, fall back to semi-transparent dark surface on older Android. The glass aesthetic still communicates "premium" even without blur. The card content (artist names, badges, tints) is the real differentiator. |
| Embedding full Spotify Web Playback SDK | "30 second previews aren't enough — give them full plays" | Spotify Web Playback SDK requires Spotify Premium + user OAuth token. Building a Spotify login flow into the Jukebox feature is a separate auth system, scope explosion, and Spotify TOS complexity. 30 second previews are the intended behavior for public embeds. | Use the standard embed iframe. 30-second preview is enough to validate taste and trigger a Discover collect. For users who want full playback, they have Spotify. |
| LLM-powered artist name parsing in the mobile app | "Run the venue text through Claude on device" | Claude API calls from mobile require either a proxy (adds latency) or an API key in the bundle (security violation). LLM calls belong on the VM. On-device models (TensorFlow Lite, Core ML) don't have music domain knowledge. | Layer 6 of the scraping waterfall already runs Claude on the VM. Mobile receives clean structured JSON from the VM — artist names are already extracted. |

---

## Feature Dependencies

```
[NEW v3.0] Glassy Passport
    └──requires──> collections table (types: stamp, find, discovery)
    └──requires──> performers table (artist name, platform)
    └──requires──> venues table (venue name for Stamps)
    └──requires──> founder_badges table (★ overlay on cards)
    └──requires──> expo-blur (BlurView for frosted glass)
    └──requires──> React Native Skia + Reanimated 3 (gradient orbs)
    └──enhances──> Passport share card (visual source for card design)

[NEW v3.0] Jukebox
    └──requires──> follows table (follower_id, following_id — EXISTING)
    └──requires──> collections table, type='find' (48h window — EXISTING schema)
    └──requires──> performers table (embed URLs — needs new columns)
    └──requires──> react-native-webview (embedded players)
    └──requires──> GET /api/jukebox endpoint (NEW Vercel)
    └──requires──> POST /api/jukebox/discover endpoint (NEW Vercel)
    └──enhances──> Activity feed (Jukebox is a separate screen, not the same feed)
    └──depends on──> Jukebox entry point (replace map icon on Home — LOW effort)

[NEW v3.0] "I'm at a Show"
    └──requires──> expo-location (foreground permission — already in package.json)
    └──requires──> venues table with PostGIS/haversine proximity — EXISTING
    └──requires──> events + event_artists tables — EXISTING
    └──requires──> search_results table (NEW — async scraping results)
    └──requires──> venue_submissions table (NEW — crowdsource fallback)
    └──requires──> Supabase Realtime on search_results (NEW — enable publication)
    └──requires──> VM scraper service (NEW — Express.js on DigitalOcean)
    └──requires──> POST /api/show-checkin endpoint (NEW Vercel)
    └──depends on──> Link-Paste Add flow (reused for tag-a-performer in manual fallback — EXISTING)
    └──depends on──> founder_badges logic (Founder + Stamp simultaneous award — EXISTING logic)
    └──produces──> collections rows (type: 'stamp') — feeds Glassy Passport Stamps tab
    └──produces──> collections rows (type: 'find' for new Founders) — feeds Glassy Passport Finds tab
    └──produces──> founder_badges rows — feeds ★ badge on Glassy Passport cards

[EXISTING] Activity Feed
    └──still works as-is. Jukebox does NOT replace it. Home screen has both.

[EXISTING] Link-Paste Add flow
    └──reused by "I'm at a Show" manual fallback for tagging unknown performers
    └──reused by "I'm at a Show" for adding new artists found in lineup
```

### Dependency Notes

- **Build Glassy Passport before Jukebox and Check-In:** Jukebox's one-tap Discover creates `discovery` collection rows. Check-In creates `stamp` and `find` rows. If Glassy Passport is built first, all new collections immediately appear in the correct tab with the correct visual treatment.
- **"I'm at a Show" depends on VM scraper service:** The mobile check-in flow shows a loading state until the VM responds. The VM service must be deployed and reachable before testing the async scraping path. Layer 1 (DB lookup) can be tested first without the VM.
- **Supabase Realtime must be enabled on search_results BEFORE mobile is wired up:** `ALTER PUBLICATION supabase_realtime ADD TABLE search_results` is a one-time DB migration. Do it during schema phase, not during mobile wiring phase.
- **Jukebox embed URL caching is optional at launch:** The Jukebox API can resolve embed URLs on-the-fly for MVP. The caching columns (`spotify_embed_url` etc. on performers) optimize for performance at scale. Launch without cache, add caching in v3.x.
- **BlurView requires expo-blur to be installed:** Already in the project per PRD spec. No new dependency. Verify it's in package.json before assuming it works.

---

## MVP Definition

### Launch With (v3.0 milestone)

- [ ] **Glassy Passport: 3-tab layout (Stamps/Finds/Discoveries)** — the identity of the redesign. Without it, v3.0 has no visual centerpiece.
- [ ] **Glassy Passport: frosted glass cards with blur, tints, rotation** — the aesthetic that makes this a "Living Passport" not a list.
- [ ] **Glassy Passport: View More pages per tab** — collections grow. Users need pagination from day one.
- [ ] **Glassy Passport: animated gradient orbs on passport background** — required for blur to be visible. Without them, BlurView blurs a black background into a slightly lighter black.
- [ ] **Jukebox: social find feed with embedded players (Spotify/SoundCloud/Apple Music)** — the feed is the product. Non-functional players = dead screen.
- [ ] **Jukebox: one-tap Discover collect** — the conversion action. Without it, Jukebox is read-only.
- [ ] **Jukebox: max 3 WebViews active, lazy unmount** — not optional. Crash prevention.
- [ ] **"I'm at a Show": Layer 1 + 2 (DB lookup + event platform APIs)** — covers the majority of Chicago venue check-ins. Smartbar, Spybar, Schubas all have lineups on RA and DICE.
- [ ] **"I'm at a Show": Supabase Realtime subscription for async results** — required for the async architecture. Polling is not an acceptable fallback.
- [ ] **"I'm at a Show": Manual fallback form** — must always be accessible. Scraping will fail.
- [ ] **"I'm at a Show": Founder + Stamp simultaneous award** — the v3.0 star feature. Users at a show who find a new artist become its Founder in one tap.
- [ ] **"I'm at a Show": Collect All + per-artist individual collect** — core UX of the lineup screen.

### Add After Validation (v3.x)

- [ ] **Jukebox embed URL caching** — performance optimization. Launch with on-the-fly resolution, cache once usage grows.
- [ ] **VM scraping Layers 4-6 (social/website/LLM)** — Layers 1-3 cover structured data. Layers 4-6 are fuzzy/expensive. Add incrementally once Layer 1-3 coverage is measured.
- [ ] **Crowdsource pattern detection** — "Last Friday pattern" for recurring residencies. Needs weeks of real data accumulation.
- [ ] **Jukebox "Tastemaker" stats** — "You found 12 artists through @brendan" — requires `source_user_id` field to be collecting data first.

### Future Consideration (v4+)

- [ ] **Progressive blur (ProgressiveBlurView)** — blur that varies in intensity across the card. Aesthetically interesting, adds complexity with limited user-facing value.
- [ ] **Liquid Glass effects (iOS 26+)** — Apple's new design language. Available via `expo-liquid-glass-view` for iOS 26+ only. Not cross-platform. Defer until iOS adoption of v26 is meaningful.
- [ ] **Jukebox native audio player** — Replace WebView embeds with a native audio layer using react-native-track-player. Enables background playback, lock screen controls, gapless playback. Requires Spotify SDK or proxy. Large scope increase.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Glassy Passport 3-tab layout | HIGH | LOW | P1 |
| Frosted glass cards (BlurView + tints) | HIGH | MEDIUM | P1 |
| Animated gradient orbs (Skia) | HIGH | MEDIUM | P1 |
| View More pages | MEDIUM | MEDIUM | P1 |
| Jukebox social feed | HIGH | MEDIUM | P1 |
| Jukebox embedded players (WebView) | HIGH | HIGH | P1 |
| Jukebox one-tap Discover | HIGH | LOW | P1 |
| Jukebox max-3 WebView lazy unmount | MEDIUM | MEDIUM | P1 |
| "I'm at a Show" Layer 1-2 (DB + APIs) | HIGH | HIGH | P1 |
| "I'm at a Show" Realtime subscription | HIGH | MEDIUM | P1 |
| Founder + Stamp simultaneous award | HIGH | MEDIUM | P1 |
| Manual fallback form | HIGH | LOW | P1 |
| Confidence-tiered result display | MEDIUM | LOW | P2 |
| Embed URL caching | MEDIUM | MEDIUM | P2 |
| VM Layers 4-6 (social/web/LLM) | MEDIUM | HIGH | P2 |
| Crowdsource pattern detection | LOW | HIGH | P3 |
| Liquid Glass (iOS 26+) | LOW | MEDIUM | P3 |
| Native audio player (replace WebView) | HIGH | HIGH | P3 |

**Priority key:**
- P1: Required for v3.0 launch
- P2: Add after core flows are working
- P3: Future milestone

---

## Competitor Feature Analysis

| Feature | Bandsintown | Songkick | Last.fm | Spotify (social) | Decibel v3.0 Approach |
|---------|-------------|----------|---------|-----------------|----------------------|
| Social music discovery feed | "Upcoming shows from artists you follow" (no audio) | Artist event listings (no social) | Friends' scrobble feed (no audio preview) | Friends' listening activity (no collection) | Jukebox: friends' Finds with embedded audio previews + one-tap collect. Human-curated, 48h recency window. |
| Embedded audio players in social feed | None | None | None | 30s previews on Spotify app itself | WebView-based Spotify/SoundCloud/Apple Music embeds. 30s Spotify preview, full SoundCloud. |
| Check-in to live show | Manual RSVP + "I was here" | RSVP only | Scrobble from streaming | None | GPS-detected venue + 7-layer lineup waterfall + Stamps with artist attribution. |
| Check-in auto-detection of lineup | None (you tell it what show you attended) | None | N/A | N/A | VM scraper waterfall: RA, DICE, EDMTrain, Google Places, Instagram, venue website, LLM. |
| Collection display | Chronological list | List of concert attendance | Scrobble count per artist | None | Glassy Passport: 3 distinct visual languages per collection type (Stamps analog, Finds digital, Discoveries translucent). |
| Discover → collect from feed | None | None | "Love" track (not collect artist) | Heart song | Jukebox Discover button: one tap adds artist as Discovery to your passport. |

---

## Technical Complexity Notes (for Roadmap Phase Sizing)

### Glassy Passport
- **BlurView on Android:** Use `blurMethod="dimezisBlurViewSdk31Plus"` to get blur on Android 12+ with graceful semi-transparent fallback on Android 11 and below. Do not ship without this fallback — jank on the identity screen is worse than no blur.
- **Gradient orbs:** React Native Skia is the right tool. `@shopify/react-native-skia` + Reanimated 3 `useSharedValue`. Orb animation: `withRepeat(withTiming(1, {duration: 12000}), -1, true)`. Keep orbs at <15% opacity — they must be felt, not seen.
- **Tab navigation:** `react-native-pager-view` handles swipe gestures. Combine with custom tab header for the frosted glass tab indicator. Do NOT use `@react-navigation/material-top-tabs` — it adds heavy navigation stack overhead to a screen that's already in a navigator.
- **Card rotation:** Seed `Math.random()` with artist ID (e.g., `id.charCodeAt(0) / 255 * 6 - 3`) for deterministic rotation. Random rotation on every render = cards shimmy on state updates.

### Jukebox
- **WebView lazy loading pattern:** `onViewableItemsChanged` with `viewabilityConfig: { itemVisiblePercentThreshold: 50 }`. Track visible item keys in a Set. Only mount WebView for keys in the Set. Use `windowSize={3}` on FlatList to keep only 1.5 screens of items rendered.
- **Spotify embed URL:** `https://open.spotify.com/embed/track/{trackId}?utm_source=generator&theme=0` (dark theme). Track ID must be resolved from artist before the Jukebox API call — this is the caching problem.
- **SoundCloud widget:** Full track playback without auth. Use `https://w.soundcloud.com/player/?url={trackUrl}&color=%23FF4D6A&auto_play=false&show_artwork=true&show_user=true`.
- **Apple Music embed:** 30s preview for non-subscribers. URL: `https://embed.music.apple.com/us/album/{albumId}?i={trackId}`.

### "I'm at a Show"
- **VM service:** Express.js on DigitalOcean, PM2 for process management. Single endpoint `POST /api/scrape-event`. Playwright already installed on VM. Anthropic SDK already available.
- **Realtime subscription cleanup:** Always unsubscribe when the check-in screen unmounts OR when the result arrives. Leaked subscriptions cause duplicate result handlers on re-entry.
- **Race condition on Founder award:** Two users check in simultaneously at the same venue for an artist not yet in DB. Both trigger `INSERT INTO performers` simultaneously. Solution: unique constraint on `performers.spotify_id` + `INSERT ... ON CONFLICT DO NOTHING`. First insert wins the Founder badge. Second gets a Stamp (artist now exists).
- **Layer 2 APIs:** Resident Advisor GraphQL is the most reliable for Chicago electronic music (most shows on their radar). DICE covers emerging artists. EDMTrain covers electronic specifically. Bandsintown API is now only available with partnership key. Songkick acquired by Suno in November 2025 — API status uncertain, treat as low-confidence source.

---

## Sources

- DECIBEL_V3_PRD.md — primary specification for all three features (HIGH confidence)
- WebSearch: React Native WebView + Spotify/SoundCloud embeds (MEDIUM confidence — multiple sources confirm 30s preview behavior and WebView mount/unmount pattern)
- WebSearch: expo-blur BlurView Android behavior — `dimezisBlurViewSdk31Plus` blurMethod confirmed in expo/expo GitHub discussions (HIGH confidence — official repo)
- WebSearch: React Native Skia for animated gradient orbs — confirmed as the standard approach for GPU-accelerated animations in RN 2025-2026 (MEDIUM confidence)
- WebSearch: Supabase Realtime + React Native — confirmed `postgres_changes` subscription pattern works in Expo (HIGH confidence — official Supabase docs)
- WebSearch: Songkick acquired by Suno in November 2025 — impacts reliability of Songkick as a Layer 2 scraping target (MEDIUM confidence — single source)
- Expo official docs: BlurView blurMethod options confirmed (HIGH confidence)
- Training knowledge: Bandsintown/Songkick/Last.fm feature comparison (MEDIUM confidence, verified directionally against 2025 search results)

---
*Feature research for: Decibel v3.0 — Glassy Passport, Jukebox, "I'm at a Show"*
*Researched: 2026-03-12*
