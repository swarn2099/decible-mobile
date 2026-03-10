# Project Research Summary

**Project:** Decibel Mobile — Phase 2+ Feature Build
**Domain:** Live music passport app (React Native + Expo, GPS check-in, artist discovery, share cards)
**Researched:** 2026-03-10
**Confidence:** HIGH

## Executive Summary

Decibel is a live music passport app built on a confirmed, already-installed Expo SDK 55 stack. Phase 1 delivered the 3-tab navigation scaffold. The remaining work (Phases 2-5) adds the four core mechanics that make the app functional: link-paste artist discovery with eligibility gating, GPS-based venue check-in with stamp animation, a visual passport redesign (Finds grid + analog Stamps), and server-side share card generation. Crucially, every library required is already installed — this is a pure implementation milestone, not a greenfield build. The v4 codebase contains production-tested implementations of URL parsing, GPS/Haversine venue detection, and share card download patterns that should be copied verbatim and extended, not rewritten.

The recommended approach is to build in strict dependency order: validate-artist-link backend endpoint first (blocks the entire Add flow), then the client-side Add UI, then the check-in backend + UI, then the passport visual redesign, and finally the share card endpoints and celebration UX. The most important architectural discipline is to keep API keys and all Spotify/SoundCloud/Apple Music calls server-side via Next.js API routes — the mobile client parses URLs locally (instant feedback) but delegates all validation to the backend. Similarly, GPS-to-venue matching stays on the client (Haversine is a pure calculation), while stamp creation always happens server-side where dedup and auth can be enforced.

Three risks demand attention before any code is written. First, the existing Spotify monthly listener scraper returns `0` on failure, which silently approves mainstream artists — fix this to return `null` and treat it as "unknown" not "eligible". Second, the current venue detection uses UTC date for event matching, which breaks check-ins after midnight in Chicago — pass the client's local date from the mobile app instead. Third, the SoundCloud URL parser in v4 accepts track and set pages as artist pages — add specific error messages and ideally extract the username from track URLs rather than rejecting them. These three are not speculative edge cases; they are verified bugs in the existing code.

---

## Key Findings

### Recommended Stack

The stack is already frozen. Phase 1 ships with Expo SDK 55, React Native 0.83.2, Expo Router, Nativewind, react-native-reanimated 4.2.1, lottie-react-native, expo-location, expo-haptics, expo-blur, expo-sharing, expo-file-system, @tanstack/react-query, and Zustand. No new packages are required for any feature in Phases 2-5. The only optional addition is `@gorhom/bottom-sheet` if the check-in flow needs multi-snap sheet behavior, but the current Modal + Reanimated pattern is sufficient for a wizard-style flow.

**Core technologies and their roles:**
- `urlParser.ts` (copy from v4): Client-side URL parsing — platform detection from pasted links, zero network cost, immediate feedback before API call
- SoundCloud Widget API (`api-widget.soundcloud.com`): Follower count + avatar, no auth, already in production use in the backend scraper
- Spotify Web API (Client Credentials): Artist name, photo, follower count via `/v1/artists/{id}` — `followers.total` as proxy for monthly listeners
- Spotify HTML scrape (`__NEXT_DATA__`): Exact monthly listener count — fragile but already in `spotify.ts`, use as enrichment not as eligibility gate
- Apple Music API v1 catalog: Artist lookup by numeric ID from URL; cross-reference by name to Spotify for eligibility (Apple exposes no listener count)
- `expo-location` + Haversine (pure TS): GPS acquisition + client-side venue matching at 200m radius, one-shot `getCurrentPositionAsync`, Balanced accuracy
- `next/og` ImageResponse (Vercel Edge): Server-side PNG share card generation — already in production, same pattern for all new card types
- `react-native-reanimated` + `lottie-react-native`: Stamp slam animation (spring physics) + ink spread (Lottie JSON) + haptics (expo-haptics at contact frame)

**See STACK.md for full version matrix and alternatives considered.**

### Expected Features

Decibel has two user personas with different entry points but shared data: Group A (Artist Hunters who use the Add flow to build their Finds collection) and Group B (Night-Out Loggers who use Check In to build their Stamps passport). Both are blocked by Phase 1's scaffold-only + tab.

**Must have (table stakes — users will assume these work):**
- Artist link validation with specific error messages per failure mode (wrong URL type, over threshold, already on Decibel)
- Loading state during link fetch (network calls take 500ms-3s; no spinner = duplicate taps)
- Eligibility rejection showing the artist card + listener count (proves the check ran, not a bug)
- Already-on-Decibel detection before invoking the add flow (cross-reference by spotify_id / soundcloud_slug)
- GPS permission rationale screen shown before `requestForegroundPermissionsAsync()` (higher accept rate)
- Venue match confirmation ("You're at Smartbar — is this right?") after GPS match
- Stamp appears in Passport immediately after check-in (optimistic React Query cache update)
- Finds grid cards tappable through to artist profile (non-tappable cards feel decorative)
- Stamps ordered most recent first (random order feels broken)
- Native OS share sheet (not custom buttons)

**Should have (Decibel differentiators):**
- Founder badge (one-of-one, permanent, race-condition-safe via DB unique constraint)
- Link-paste-only adding — the friction is the feature, not a limitation
- Eligibility threshold (1M Spotify / 100K SoundCloud) enforced server-side on every add
- Check-in creates Stamps per artist, not just a venue visit log
- Analog passport aesthetic: paper grain texture, per-stamp rotation, ink tint
- Rubber stamp animation on check-in (no music app has this; it's the emotional hook)
- Post-found celebration (confetti + badge reveal) with immediate share prompt
- Dual visual language: clean digital gallery (Finds) vs textured analog diary (Stamps)
- Founder share card (9:16 Stories format, time-stamped cultural credibility)

**Defer to v2+:**
- Check-in Scenario C (unknown venue — needs live data accumulation first)
- Recurring lineup suggestions ("last Friday pattern" — needs weeks of user_tagged_events data)
- Volume Rating System (gated to Collected fans — needs check-in user base first)
- Fantasy Music League, "Who's Out Tonight" map, push notifications, Instagram auto-posting

**Anti-features to explicitly avoid:** text search for external artist catalogs, Deezer API, background location tracking, open venue creation, QR scanning, rating artists you haven't seen live.

**See FEATURES.md for full prioritization matrix and competitor analysis.**

### Architecture Approach

The architecture is a clean three-tier system: React Native mobile (Expo Router file-based, custom hooks, Zustand stores) calling Next.js API routes on Vercel, which in turn call Supabase with the service role key. The mobile client is allowed direct Supabase reads (venues, artists, activity feed) via the anon key + JS client, but all writes go through Next.js API routes. Share cards are generated at Vercel Edge using `next/og` ImageResponse, downloaded to local cache via `expo-file-system`, and shared via `expo-sharing`. GPS and Haversine venue matching run entirely on the client; the resolved `venue_id` is what gets sent to the server for stamp creation.

**Major components and responsibilities:**
1. `app/(tabs)/add.tsx` — mode toggle orchestrator (Add Artist vs Check In), owns the flow state machine
2. `lib/urlParser.ts` (copy + extend from v4) — sync client-side platform detection, zero network cost
3. `/api/mobile/validate-artist-link` (NEW backend) — the eligibility gate; calls Spotify/SoundCloud/Apple Music server-side
4. `hooks/useVenueDetection.ts` (copy from v4) — GPS + Haversine client-side, Supabase venue/event query
5. `/api/mobile/check-in` (NEW backend) — auth-gated stamp creation with dedup via DB unique constraint
6. `components/stamps/StampAnimation.tsx` — Reanimated spring + Lottie ink spread + expo-haptics, rendered in Modal above scroll context
7. `app/(tabs)/passport.tsx` — Finds grid (2-column, digital) + Stamps section (analog, rotated, textured), separate components with zero shared layout logic
8. `/api/share-card/founder` and `/api/share-card/passport` (NEW backend) — `next/og` ImageResponse following exact existing pattern from `passport/share-card/route.tsx`

**See ARCHITECTURE.md for full data flow diagrams and anti-patterns.**

### Critical Pitfalls

1. **Spotify scrape returns `0` = silently eligible** — the existing `scrapeMonthlyListeners()` in `spotify.ts` returns `0` on any exception. Since `0 < 1_000_000`, mainstream artists pass eligibility when the scrape fails. Fix: return `null` on failure; treat `null` as "unverified", not "under threshold". Requires `listener_count_unverified` flag on performers if using as fallback-allow.

2. **UTC date mismatch at midnight** — `todayDate()` in `useVenueDetection.ts` produces UTC date. Chicago at 1am is UTC tomorrow. Late-night shows (primary Decibel use case) become invisible. Fix: pass client's local date to the check-in API; query events on both yesterday and today client-side.

3. **SoundCloud track/set URLs silently rejected** — users sharing a track URL get a generic error with no guidance. Fix: detect 2+ segment SoundCloud paths, extract the username, and either treat it as the artist profile or show contextual instructions ("paste the artist profile link, not a track link").

4. **GPS accuracy variance blows 200m match** — indoors accuracy degrades to 50-500m. Fix: read `position.coords.accuracy`; when accuracy > 300m show "Low GPS signal — try moving near a window" instead of "No venues detected". Add per-venue `geofence_radius` to DB.

5. **Stamp animation jank from wrong render context** — rendering Reanimated transforms inside a `ScrollView` causes scroll-offset interference and JS-thread haptic timing issues. Fix: render `StampAnimation` in a `Modal` (Portal) above the scroll view; fire haptics via `runOnJS` callback at the exact contact frame.

**Also watch for:** ImageResponse CSS subset silently ignoring `background-clip: text` (gradient text goes invisible), SoundCloud unofficial widget client ID rotation risk, Apple Music developer JWT needing 6-month rotation, and duplicate collection rows on rapid taps (add DB unique constraint on `collections(fan_id, performer_id, capture_method)`).

**See PITFALLS.md for full recovery strategies, security mistakes, and the "Looks Done But Isn't" checklist.**

---

## Implications for Roadmap

The PRD v5 already defines 6 phases. Research confirms and refines that structure. The key constraint is the dependency chain: Add flow must precede Check-In (Scenario B reuses the link-paste validator), and both must precede Share Cards (cards need real data). The Passport redesign is parallel to Check-In and should overlap.

### Phase 2: Link-Paste Add Flow + Eligibility
**Rationale:** All other features are blocked until artists can be added. The + tab is a placeholder today. This is the critical path.
**Delivers:** Working "Add an Artist" flow — URL paste, platform detection, server-side eligibility check, ArtistPreviewCard, founder badge assignment, post-found celebration stub
**Key features:** Link-paste-only (no search), eligibility threshold, already-on-Decibel detection, Founder badge (one-of-one)
**Backend work:** `validate-artist-link` route (Spotify + SoundCloud + Apple Music), extend existing `add-artist` route
**Client work:** `urlParser.ts` port + Apple Music extension, `add-artist/paste.tsx`, `preview.tsx`, `celebration.tsx`
**Critical pitfalls to avoid:** Spotify scrape-returns-zero bug (fix before shipping), SoundCloud track URL rejection UX, Apple Music name-match fallback
**Research flag:** Standard pattern — well-documented in existing v4 code and backend. No additional research phase needed. Verify Apple Music API developer JWT setup before starting.

### Phase 3: GPS Check-In + Stamp Creation
**Rationale:** Check-In Scenario B (tag-a-DJ) reuses the Add flow from Phase 2. Can't build Scenario B first.
**Delivers:** Working "I'm at a Show" flow — GPS match, venue confirmation, lineup display, stamp creation (Scenarios A and B), `user_tagged_events` table populated
**Key features:** GPS permission rationale screen, venue match confirmation ("Is this right?"), Collect All for known lineups, tag-DJ fallback for unknown lineups
**Backend work:** `check-in` route, `tag-performer` route (with DB unique constraint for dedup)
**Client work:** `useVenueDetection.ts` port, `useCheckIn.ts`, `useTagPerformer.ts`, scenario screens A and B
**Critical pitfalls to avoid:** UTC midnight bug (pass local date from client), GPS accuracy variance (check `coords.accuracy`, show contextual message), duplicate collect on rapid tap (idempotent API + DB constraint)
**Research flag:** Standard pattern — `useVenueDetection.ts` in v4 is the implementation. No research needed. Run the "date boundary check-in" test case at the end of the phase.

### Phase 4: Passport Redesign + Stamp Animation
**Rationale:** The passport visual redesign can start in parallel with Phase 3 but depends on stamp creation being complete to wire up the animation post-check-in. Separation of rendering into Finds (digital) and Stamps (analog) is a major layout refactor.
**Delivers:** 2x3 Finds grid (tap-through artist profile), analog Stamps section (paper grain, rotated stamps, Poppins monospace dates), rubber stamp animation with haptics post-check-in, `StampAnimation` component isolated in Modal
**Key features:** Dual visual language (zero shared layout logic), per-stamp rotation seeded deterministically by stamp ID, stamp animation in Modal above scroll context, haptic at contact frame via `runOnJS`
**Lottie assets:** Source stamp-press + ink-spread + confetti JSON from LottieFiles.com before starting. Commit to `assets/animations/`.
**Critical pitfalls to avoid:** Stamp animation in ScrollView (use Modal), Lottie file > 100KB (will lag on Android), haptic timing (test on device, not simulator)
**Research flag:** Standard pattern for Reanimated + Lottie. No research phase needed. Physical device testing is mandatory — do not report done from simulator alone.

### Phase 5: Share Cards + Virality
**Rationale:** Share cards require real Finds and Stamps data to look designed. Build after passport redesign confirms visual language.
**Delivers:** Founder share card (post-found celebration prompt, 9:16 Stories + 1:1 square), Passport share card (replaces broken existing button), `expo-media-library` save-to-photos, share count metrics stub
**Backend work:** `/api/share-card/founder` and `/api/share-card/passport` routes following exact `next/og` ImageResponse pattern from existing `passport/share-card/route.tsx`; Poppins font loaded as ArrayBuffer from self-hosted URL
**Client work:** `useFounderShareCard.ts` hook, share prompt in `celebration.tsx`, fix existing "Share Passport" button
**Critical pitfalls to avoid:** ImageResponse CSS subset (gradient text invisible — use colored block instead; test every card with `curl` before mobile wiring), Poppins font must be ArrayBuffer not Google Fonts CSS URL
**Research flag:** Established pattern — existing share card route is the template. No research needed. Run `curl` test on every card endpoint before connecting to mobile app.

### Phase Ordering Rationale

- **Phase 2 before Phase 3:** Check-in Scenario B (tag-DJ with no lineup) reuses the validate-artist-link + add-artist pipeline. Building Add flow first means Scenario B is nearly free.
- **Phase 3 parallel with Phase 4 (partial):** Passport layout refactor (Finds grid, Stamps section) can begin during Phase 3 development. `StampAnimation` component wiring requires a Phase 3 stamp to animate — finish Scenario A first, then integrate.
- **Phase 4 before Phase 5:** Founder share card must reflect the visual language established by the Finds grid (dark card, gold glow, large artist photo). Build the visual first, then screenshot it in a server-side card.
- **Scenario C (unknown venue) deferred to v2:** Adds significant complexity (freetext venue creation, fuzzy matching) for coverage of edge-case check-ins. Chicago market has sufficient known venues for beta launch without it.

### Research Flags

**No phase requires an additional `/gsd:research-phase` run.** Every pattern is verified against the existing v4 codebase or production backend. The only pre-implementation verification steps are:

- **Before Phase 2:** Confirm Apple Music developer JWT is provisioned (or explicitly scope Phase 2 to Spotify + SoundCloud only, with Apple Music as a fast follow). The name-cross-reference fallback ships first; Apple Music API wiring can follow.
- **Before Phase 5:** Confirm Poppins font is hosted as a static asset accessible from the Vercel Edge runtime (not relying on Google Fonts CSS URL).
- **All phases:** Run `eas update --channel preview` builds early — Lottie behavior on physical devices vs Expo Go vs standalone differs. Test on hardware before any phase is marked done.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified against `package.json`. All patterns verified against running code in v4 and the decibel backend. No hypothetical recommendations. |
| Features | HIGH | Grounded in PRD v5 (authoritative), competitor analysis from training knowledge (Bandsintown, Songkick, Foursquare, Last.fm). Feature hierarchy is clear and non-speculative. |
| Architecture | HIGH | Every pattern (urlParser, useVenueDetection, ImageResponse, share card download) verified against actual source files in the codebase. Anti-patterns identified from confirmed bugs in v4. |
| Pitfalls | HIGH | Critical bugs identified directly from source code (spotify.ts scrape-returns-zero, useVenueDetection UTC date). Not inferred — read from files. |

**Overall confidence: HIGH**

### Gaps to Address

- **Apple Music developer JWT:** Research confirmed the approach (catalog API with server-signed JWT, not MusicKit JS) but enrollment and key provisioning status is unknown. If no Apple Developer account key exists, Phase 2 ships Spotify + SoundCloud only with Apple Music as a fast follow. The PRD-specified fallback ("default to eligible") handles the gap gracefully.

- **SoundCloud unofficial client ID stability:** The `nIjtjiYnjkOhMyh5xrbqEW12DxeJVnic` client ID from the v4 codebase is an unofficial widget key. It will rotate without notice. Applying for official SoundCloud API access before Phase 2 is the right call; until then, the existing approach works but has no SLA.

- **Lottie animation files:** The stamp-press, ink-spread, and confetti Lottie JSON files are not yet in the repository. They must be sourced from LottieFiles.com before Phase 4 can start. License verification per file is required (free for commercial use, but varies). This is a sourcing task, not a technical unknown.

- **Venue data coverage:** The check-in flow depends on venues table having GPS coordinates for Chicago venues. The coverage of this table is not verified in research. If Smartbar, Spybar, Schubas, Subterranean (the target venues) are not in the DB, Scenario A check-ins will silently fall through to Scenario B. Verify venue coverage before Phase 3.

---

## Sources

### Primary (HIGH confidence)
- `/home/swarn/decibel-mobile-v4/src/lib/urlParser.ts` — URL parsing implementation, edge cases
- `/home/swarn/decibel-mobile-v4/src/hooks/useVenueDetection.ts` — GPS + Haversine pattern, UTC date bug
- `/home/swarn/decibel-mobile-v4/src/hooks/useAddArtist.ts` — Add artist flow pattern
- `/home/swarn/decibel/scripts/scrapers/enrich-via-api.ts` — SoundCloud Widget API in production
- `/home/swarn/decibel/src/app/api/passport/share-card/route.tsx` — `next/og` ImageResponse in production
- `/home/swarn/decibel/src/lib/spotify.ts` — Spotify token management, scrape-returns-zero bug identified here
- `/home/swarn/decibel/src/app/api/mobile/add-artist/route.ts` — duplicate handling via `23505` pattern
- `/home/swarn/decibel-mobile/package.json` — confirmed installed packages
- `DECIBEL_PRD_v5.md` — product specification, feature requirements, phase order

### Secondary (MEDIUM confidence)
- Apple Music API v1 catalog endpoint — training knowledge; verify at developer.apple.com before implementation
- Spotify `__NEXT_DATA__` monthly listener scraping — confirmed pattern in existing codebase (MEDIUM: page structure can change)
- LottieFiles.com for stamp + confetti animations — training knowledge; license verification required per file

### Tertiary (LOW confidence)
- SoundCloud unofficial widget client ID stability — works today, no official SLA
- Competitor feature analysis (Bandsintown, Songkick, Foursquare, Last.fm) — training data through August 2025, not verified against current live products

---
*Research completed: 2026-03-10*
*Ready for roadmap: yes*
