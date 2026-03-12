# Project Research Summary

**Project:** Decibel Mobile v3.0 — Glassy Passport, Jukebox, I'm at a Show
**Domain:** React Native / Expo — live music passport social app
**Researched:** 2026-03-12
**Confidence:** HIGH

## Executive Summary

Decibel v3.0 is a three-feature expansion of an existing, shipping Expo SDK 55 app. The stack is already mature — all core libraries are installed (Reanimated, expo-blur, expo-location, Supabase JS, TanStack Query, Zustand) — and only two new mobile libraries are required: `react-native-pager-view` (Passport tab swipe) and `react-native-webview` (Jukebox embedded players). The most architecturally complex feature is "I'm at a Show," which introduces a new infrastructure tier: an Express.js scraper service on the DigitalOcean VM (deployed via PM2) that communicates asynchronously to the mobile app via Supabase Realtime. This fire-and-forget pattern is the right call given Vercel's 60-second function timeout and Playwright's 300MB binary — it simply cannot run on Vercel.

The recommended build order is: DB migrations first (unblocks everything), then Glassy Passport and VM Scraper in parallel, then Jukebox once the `discovery` collection type is confirmed, and finally the full "I'm at a Show" mobile flow once the VM service is live and tested. This ordering reflects real hard dependencies — the Passport tab is the visual foundation that makes every new collection type immediately visible, and the VM scraper must be deployed before any end-to-end check-in testing can proceed.

The critical risk area is the Jukebox's WebView lifecycle: each mounted WebView spawns a native browser process, audio session conflicts with iOS background playback are confirmed bugs in react-native-webview, and unmounting a WebView does not stop its audio without explicit `injectJavaScript`. These are non-negotiable to solve upfront — not as a retrofit. The second risk is data integrity: LLM-generated artist names from Layer 6 of the scraper waterfall can produce hallucinated Founders that are expensive to clean up. The fix is requiring a platform link for all `confidence: "low"` results, with no auto-collect permitted.

---

## Key Findings

### Recommended Stack

The existing codebase already includes everything needed for the Glassy Passport (expo-blur, Reanimated, LinearGradient) and the Check-In flow (expo-location, Supabase JS with Realtime built in). Only two new installs are needed: `react-native-pager-view` v8 (New Architecture-only, correct for SDK 55's mandatory New Architecture) and `react-native-webview` ~13.16.x for Jukebox embeds.

The VM scraper service should live at `~/decibel/scraper/`, not as a standalone project. It reuses the Playwright binary already installed there (`^1.58.2` confirmed in `~/decibel/package.json`), shares the Supabase JS client config, and avoids introducing a second Node.js project with separate CI/CD overhead. PM2 is required for the scraper process — tmux does not survive VM reboots.

**Core technologies:**
- `react-native-pager-view` v8: Passport gesture tab swipe — New Architecture-only from v7+, handles gesture conflict with nested scrollables natively; raw pager-view over `react-native-tab-view` because we need a custom frosted glass tab indicator
- `react-native-webview` ~13.16.x: Jukebox embedded music players — only viable approach for Spotify/SoundCloud/Apple Music embeds; must be lazy-mounted with a hard cap of 3 active instances
- `expo-blur` (already installed, SDK 55 breaking change): glassmorphism cards — requires the new `BlurTargetView` + `blurTarget` ref pattern on Android; old single-component wrap is silently transparent on Android in SDK 55
- Express.js + PM2 on DigitalOcean VM: scraper waterfall service — Playwright cannot run on Vercel (300MB binary vs. 50MB bundle limit); VM has no timeout constraints
- `@anthropic-ai/sdk` ^0.39.x on VM: Layer 6 LLM search augmentation — Claude with web search for venues with no structured event data; Node.js 20.20.0 on VM confirmed compatible
- Supabase Realtime (already in `@supabase/supabase-js`): async result delivery from VM to mobile — replaces polling entirely; filtered by `search_id` to prevent cross-user event leakage

### Expected Features

See FEATURES.md for the full prioritization matrix. Summary below.

**Must have (table stakes — v3.0 launch):**
- Glassy Passport: 3-tab layout (Stamps / Finds / Discoveries) with swipe + tap navigation — users expect swipeable tabs in 2026
- Frosted glass cards with BlurView tints and slight rotation — the visual centerpiece; without it v3.0 has no identity
- Animated gradient orbs on Passport background — required for blur to be visible; BlurView on a flat dark background blurs into near-identical flat dark
- View More pages per Passport tab — collections grow; infinite scroll pagination must exist at launch
- Jukebox social feed with embedded players — non-functional players equal a dead screen; feed without audio is just a list of names
- Jukebox one-tap Discover collect — the conversion action; Jukebox is read-only without it
- Jukebox max-3 WebView lazy mount/unmount — crash prevention, not optional
- "I'm at a Show": Layer 1 (DB lookup) + Layer 2 (RA, DICE, EDMTrain) — covers majority of Chicago venue check-ins
- Supabase Realtime subscription for async scrape results — polling is not an acceptable fallback
- Manual fallback form always accessible — scraping will fail; this is a first-class path, not just a timeout recovery
- Founder + Stamp simultaneous award — the star feature of v3.0; attending a show and discovering a new artist earns Founder in one tap

**Should have (differentiators, add after core flows validated):**
- Confidence-tiered result display (green/yellow/grey per scrape source layer)
- Jukebox embed URL caching on `performers` table (launch with on-the-fly resolution, cache at scale)
- VM scraper Layers 4-6 (social media, Playwright venue website, LLM) — Layers 1-3 cover structured data; 4-6 are fuzzy and expensive

**Defer (v3.x or v4+):**
- Native audio player replacing WebViews (react-native-track-player) — large scope, Spotify SDK complexity
- Crowdsource pattern detection ("recurring residency" prediction) — needs weeks of real submission data
- Liquid Glass (iOS 26+) — not cross-platform; defer until iOS 26 adoption is meaningful

### Architecture Approach

The v3.0 system adds a third infrastructure tier to the existing mobile + Vercel architecture: a long-running Express.js service on the DigitalOcean VM. The key pattern is fire-and-forget async dispatch: the Vercel route handles the fast Layer 1 DB lookup, fires an unawaited HTTP POST to the VM on miss, returns a `searchId` immediately, and the mobile app subscribes to a Supabase Realtime channel filtered by that `searchId`. The VM writes its result directly to `search_results` using the service role key, triggering the Realtime event on mobile. This decouples the mobile UX from the scraper's 5-15 second runtime without polling.

For the Glassy Passport, the correct BlurView architecture is a single page-level BlurView behind all cards — not one BlurView per FlatList item. Multiple BlurViews in a FlatList capture a static snapshot at render time and produce visual artifacts on scroll. Cards use `rgba(255,255,255,0.08)` semi-transparent backgrounds to let the single blur layer show through.

**Major components:**
1. `GlassyPassportTabs` + card variants (`StampGlassCard`, `FindGlassCard`, `DiscoveryGlassCard`) — 3-tab pager with per-type visual languages; `GradientOrbs` provides the animated color layer that blur works against
2. `JukeboxCard` + `EmbeddedPlayer` — FlatList with visibility-gated WebView pool; `onViewableItemsChanged` tracks visible cards, `injectJavaScript` pauses audio before unmount, `mediaPlaybackRequiresUserAction={true}` prevents iOS audio session hijacking
3. `useShowCheckin` + `ScrapingWaitScreen` — orchestrates Vercel call → Realtime subscription → confidence-tiered result rendering → lineup confirmation → existing `useCheckIn` mutation
4. VM scraper service (`~/decibel/scraper/`) — Express.js with shared Playwright browser instance (launch once, context-per-request), `try/finally` cleanup on every context, PM2 with `max_memory_restart: "512M"`
5. DB schema additions — `search_results` (Realtime-enabled, RLS SELECT policy required, `user_id` column for per-user filtering), `venue_submissions`, embed URL columns on `performers`, `collection_type` backfill from legacy `capture_method`

### Critical Pitfalls

1. **BlurView Android API change (SDK 55)** — The old `<BlurView intensity={40}>` wrap is silently transparent on Android. SDK 55 requires the new `BlurTargetView` + `blurTarget` ref pattern. Three existing components (`StampAnimationModal`, `SharePrompt`, `ConfirmationModal`) use the broken old API. Address on day 1 of Passport phase before writing any new glass component.

2. **WebView audio ducking on iOS** — Any mounted WebView with a music embed can claim the iOS AVAudioSession, ducking or pausing background Spotify/Apple Music before the user ever taps play. Fix: `mediaPlaybackRequiresUserAction={true}` + `allowsInlineMediaPlayback={true}` on all WebViews. Verify by: play music on device, open Jukebox, confirm music continues.

3. **Unmounted WebView continues playing audio** — Removing a WebView from the React tree does NOT stop its audio on iOS. Must call `injectJavaScript` to pause all `<audio>/<video>` elements and post `{"method":"pause"}` to Spotify iframes BEFORE unmounting. Required for the visibility-gated pool to function correctly.

4. **Supabase Realtime RLS silently drops events** — New tables have RLS enabled by default. Without a SELECT policy on `search_results`, the scraper's INSERT fires but the mobile client never receives it — no error, subscription stays `SUBSCRIBED`, events disappear. Required: `ALTER PUBLICATION supabase_realtime ADD TABLE search_results` + CREATE SELECT policy scoped to `user_id = auth.uid()`.

5. **Layer 6 LLM hallucinated Founder badges** — Claude will return confident-sounding artist names for any venue query, including when no real data exists. Hard rule: `confidence: "low"` results NEVER auto-collect; require a platform link paste from the user before any artist creation from Layer 6 output.

6. **`collection_type` vs legacy `capture_method` split** — Existing passport queries filter on `capture_method` ("location" / "online"). New Passport tabs filter on `collection_type` ("stamp" / "find" / "discovery"). Without a migration that backfills `collection_type` from `capture_method`, old and new screens show divergent collections with no obvious error. The migration runs before any UI code is built.

7. **Playwright browser context leaks on VM** — Any unhandled error that skips `finally { await context.close() }` leaves a Chromium process open. After ~50 requests on a 1GB droplet, memory exhaustion triggers a PM2 restart. Use shared browser instance (launch once on service start), context-per-request with strict `try/finally`.

---

## Implications for Roadmap

The dependency graph is clear from combined research and suggests a 4-phase structure with one parallel track.

### Phase 1: DB Migrations + Schema Foundation
**Rationale:** Everything blocks on this. `collection_type` backfill must exist before new Passport UI. `search_results` table must exist (with Realtime publication + RLS SELECT policy + `user_id` column) before the scraper can deliver results. Embed URL columns on `performers` must exist before Jukebox can cache them. Do this first and all other phases can proceed without schema blockers mid-build.
**Delivers:** `search_results` table (Realtime-enabled, RLS SELECT policy), `venue_submissions` table, `event_artists` table, embed URL columns on `performers`, `collection_type` backfill from `capture_method`, `discovery` type added to collections constraint
**Avoids:** Pitfall 4 (RLS blocks Realtime), Pitfall 6 (collection_type migration), mid-build schema breakage

### Phase 2: Glassy Passport Redesign
**Rationale:** The Passport tab is the identity screen and the visual foundation for every new collection type. Jukebox creates `discovery` collections; Check-In creates `stamp` and `find` collections — both are immediately visible in the correct tabs if Passport is built first. Also validates the new BlurView Android pattern before it proliferates into additional components.
**Delivers:** 3-tab Passport (`GlassyPassportTabs`), frosted glass card variants per type, animated gradient orbs (`GradientOrbs`), View More infinite-scroll pages, new `GET /api/mobile/passport-collections` backend endpoint
**Uses:** `react-native-pager-view`, `expo-blur` SDK 55 `BlurTargetView` pattern, Reanimated + LinearGradient for orbs
**Avoids:** Pitfall 1 (BlurView Android), Pitfall 2 (BlurView in FlatList static snapshot), Pitfall 6 (collection_type)
**Research flag:** Standard patterns — BlurView, Reanimated, and pager-view are all documented. No additional research phase needed.

### Phase 3: Jukebox Feed (parallel-eligible with VM scraper build)
**Rationale:** Depends on Phase 1 (embed URL columns, discovery type) and Phase 2 (Discoveries tab exists to display collected items). All WebView pitfalls are fully documented in PITFALLS.md — build them correctly from day one. The audio session and memory issues are known confirmed bugs, not speculative.
**Delivers:** `jukebox.tsx` screen, `JukeboxCard`, `EmbeddedPlayer` (visibility-gated, max-3 pool), `useJukebox` hook, `useDiscover` mutation, `GET /api/mobile/jukebox` endpoint, `POST /api/mobile/discover` endpoint, Jukebox icon replaces Map icon in Home tab
**Uses:** `react-native-webview` with `mediaPlaybackRequiresUserAction={true}`, `onViewableItemsChanged` pattern, `injectJavaScript` audio-stop before unmount
**Avoids:** Pitfall 3 (iOS audio ducking), Pitfall 4 (BatchedBridge memory leak), Pitfall 5 (unmounted WebView audio continues)
**Research flag:** WebView audio session behavior is documented via confirmed GitHub issues. No additional research needed — patterns are fully specified in PITFALLS.md.

### Phase 4: VM Scraper Service (runs in parallel with Phase 3)
**Rationale:** Fully independent of Phases 2 and 3 after migrations. No mobile UI dependencies — pure backend. Building it in parallel with Jukebox means the "I'm at a Show" mobile flow can wire up immediately in Phase 5 without waiting.
**Delivers:** Express.js scraper at `~/decibel/scraper/`, Layer 2 (RA/DICE/EDMTrain/Songkick), Layer 3 (Google Places), Layer 5 (Playwright venue website), Layer 6 (Anthropic SDK, `confidence: "low"` only), confidence scoring, PM2 ecosystem config, shared secret authentication on scraper endpoint
**Uses:** Playwright (already installed in `~/decibel`), `@anthropic-ai/sdk`, Express.js, PM2 globally on VM
**Avoids:** Pitfall 7 (Playwright context leaks — shared browser + try/finally), Pitfall 9 (LLM hallucination — confidence: "low" output only, platform link required to collect)
**Research flag:** Layer 2 API integrations need endpoint validation before implementation: Resident Advisor GraphQL schema, EDMTrain free-tier rate limits, Songkick API status post-Suno acquisition (November 2025, MEDIUM confidence). Validate before writing layer2 module.

### Phase 5: "I'm at a Show" Mobile Flow
**Rationale:** Last phase because it has the most dependencies: VM scraper live (Phase 4), Passport Stamps tab built (Phase 2), Realtime infrastructure tested. The mobile side is actually modest once the backend infrastructure exists — a new orchestration hook, a loading screen, lineup confirmation, and wiring into the existing `useCheckIn` mutation.
**Delivers:** `useShowCheckin` orchestration hook, `useSupabaseRealtime` hook, `ScrapingWaitScreen` with layer-by-layer progress, lineup confirmation UI with confidence tiers, manual fallback integration, Founder + Stamp simultaneous award flow, `POST /api/mobile/show-checkin` Vercel endpoint
**Uses:** Supabase Realtime `postgres_changes` subscription (filter by `search_id`), fire-and-forget VM dispatch from Vercel, AppState listener for iOS background/foreground reconnect, polling fallback when Realtime status is `CLOSED`/`TIMED_OUT`
**Avoids:** Pitfall 6 (Realtime iOS background disconnect — polling fallback required), Pitfall 7 (RLS blocks events), Pitfall 9 (hallucinated Founders)
**Research flag:** Realtime reconnection stuck in `CLOSED` loop on iOS is a confirmed bug (supabase/realtime #1088). The polling fallback is required — do not ship Phase 5 without it. Test explicitly by backgrounding the app during a 15s scrape window on a physical iOS device.

### Phase Ordering Rationale

- **Migrations first** is non-negotiable: two separate features would hit schema blockers mid-build without them.
- **Passport before Jukebox and Check-In** means every new collection is immediately displayable the moment it's created. Without it, users have collections in the DB with no way to see them.
- **VM Scraper parallel with Jukebox** makes efficient use of the independent dependency graph after migrations. Neither blocks the other.
- **Check-In mobile flow last** because it has the most dependencies (VM live, Passport built, Realtime tested) but the least unique mobile code — the majority of the complexity is in the backend layers already built in Phase 4.

### Research Flags

Phases needing validation during implementation:
- **Phase 4 (VM Scraper):** Validate Layer 2 API endpoints before writing the integration layer. Specifically: RA GraphQL schema, EDMTrain API key availability, Songkick status post-Suno acquisition. DICE API may require partner agreement — implement as best-effort scrape fallback.
- **Phase 5 (Check-In mobile):** Realtime reconnection must be tested on a physical iOS device with app backgrounding during the 15s window. Simulator does not reproduce the iOS background network kill behavior.

Phases with well-documented, standard patterns (no additional research needed):
- **Phase 1 (Migrations):** Standard Supabase DDL + backfill SQL.
- **Phase 2 (Passport):** BlurView + Reanimated + pager-view fully documented in STACK.md and PITFALLS.md.
- **Phase 3 (Jukebox):** WebView patterns fully specified in PITFALLS.md.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against actual `package.json` files in both `~/decibel-mobile` and `~/decibel`. Two new libraries needed; all else confirmed installed. Version compatibility confirmed against SDK 55 / New Architecture requirements. |
| Features | HIGH | PRD v3.0 is the authoritative spec. Feature table stakes and differentiators verified against live competitors (Bandsintown, Songkick, Last.fm). Competitor analysis is MEDIUM confidence but directionally clear. |
| Architecture | HIGH | All patterns verified against existing running codebase. Fire-and-forget + Realtime pattern confirmed against Supabase docs and Vercel timeout constraints. Component boundary diagram reflects actual file structure. |
| Pitfalls | HIGH | Drawn from confirmed GitHub issues (react-native-webview #3205, #3168; supabase/realtime #1088; expo/expo #37905) and direct codebase inspection of three existing BlurView usages on old API. |

**Overall confidence:** HIGH

### Gaps to Address

- **Songkick API post-Suno acquisition:** MEDIUM confidence. Treat as best-effort in Layer 2. Validate the endpoint before writing the integration; implement graceful skip-and-continue if unavailable.
- **DICE API access:** LOW confidence. DICE does not offer a guaranteed public API without a partner agreement. Implement as best-effort fallback if no API key is available.
- **Layer 4 social media scraping (Instagram, Facebook, X):** Intentionally deferred to v3.x. These platforms actively block scrapers and their schemas change frequently. Not worth the fragility for v3.0 launch.
- **Apple Music embed URL parsing:** MEDIUM confidence. The embed URL format requires extracting `albumId` and `trackId` from an Apple Music URL, which has a different structure than Spotify. Validate parsing logic against real Apple Music artist URLs before shipping Jukebox embed support for that platform.
- **Existing BlurView usage in 3 components:** `StampAnimationModal`, `SharePrompt`, and `ConfirmationModal` use the pre-SDK-55 BlurView API. These need to be updated to the `BlurTargetView` pattern in Phase 2 — not just new components, but existing ones that will break with the Passport context visible behind them.

---

## Sources

### Primary (HIGH confidence)
- `/home/swarn/decibel-mobile/package.json` — confirmed installed packages for mobile app
- `/home/swarn/decibel/package.json` — confirmed Playwright ^1.58.2 installed, Node.js 20.20.0
- `/home/swarn/decibel-mobile/DECIBEL_V3_PRD.md` — authoritative product spec for all three features
- Expo BlurView SDK 55 docs — `BlurTargetView` requirement, `blurMethod` options, `blurReductionFactor`
- expo/expo GitHub Discussion #37905 — Android BlurView V3 upgrade requirements for SDK 55
- Supabase Realtime docs — `postgres_changes` filter syntax, RLS SELECT requirement for event forwarding

### Secondary (MEDIUM confidence)
- react-native-webview Issue #3205 — iOS audio session ducking confirmed bug
- react-native-webview Issues #3168 + #3152 — `onMessage` BatchedBridge memory leak
- supabase/realtime Issue #1088 — Realtime reconnection stuck in CLOSED loop on iOS
- Playwright Issue #15400 — memory leak from unclosed browser contexts in long-running Node.js services
- npm: `react-native-pager-view` v8, `react-native-webview` ~13.16.x — version compatibility with SDK 55 New Architecture
- WebSearch: Songkick acquired by Suno November 2025 — API reliability uncertain

### Tertiary (LOW confidence)
- DICE API partnership access — not verified; may require direct outreach
- Apple Music embed URL parsing for arbitrary artist URLs — directionally confirmed, needs validation against real URLs before shipping

---
*Research completed: 2026-03-12*
*Ready for roadmap: yes*
