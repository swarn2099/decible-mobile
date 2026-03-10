# Stack Research

**Domain:** React Native + Expo — live music passport app (Phase 2+ feature additions)
**Researched:** 2026-03-10
**Confidence:** HIGH — all recommendations verified against actual codebase state and existing implementations in both the mobile app and the decibel backend.

---

## Context: What Already Exists

Phase 1 shipped with this confirmed stack. Do not change these:

| Already In Use | Version | Notes |
|----------------|---------|-------|
| Expo SDK | ~55.0.5 | Lock this — do not upgrade mid-milestone |
| React Native | 0.83.2 | |
| Expo Router | ~55.0.4 | File-based routing, working |
| Nativewind | ~4.2.0 | Tailwind for RN, working |
| react-native-reanimated | 4.2.1 | Already installed |
| lottie-react-native | ~7.3.4 | Already installed |
| expo-haptics | ~55.0.8 | Already installed |
| expo-location | ~55.1.2 | Already installed |
| expo-sharing | ~55.0.11 | Already installed |
| expo-file-system | ~55.0.10 | Already installed (File + Paths API) |
| expo-blur | ~55.0.8 | Already installed |
| expo-auth-session | ~55.0.7 | Already installed (Spotify OAuth PKCE) |
| react-native-gesture-handler | ~2.30.0 | Already installed |
| @tanstack/react-query | ^5.90.21 | Already installed |
| zustand | ^5.0.11 | Already installed |
| react-native-mmkv | ^4.2.0 | Already installed |

**Nothing in this table needs installing.** Every feature below builds on what's already there.

---

## Recommended Stack by Feature Area

### 1. URL Parsing and Validation (Link-Paste Add Flow)

**Approach: Pure TypeScript in-app, no library needed.**

The old codebase already has a production-quality `urlParser.ts` that handles:
- Spotify URI format (`spotify:artist:{id}`)
- `open.spotify.com/artist/{id}` with tracking param stripping
- `soundcloud.com/{username}` with system path exclusion list
- `mixcloud.com/{username}`
- URL normalization (adds `https://` if missing, strips `m.` and `www.`)
- Android share intent text extraction (finds URL embedded in share text)

**Copy this file from `~/decibel-mobile-v4/src/lib/urlParser.ts` with one addition:**
Add Apple Music URL pattern: `music.apple.com/{country}/artist/{name}/{id}` — extract the numeric ID from the last path segment.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Native `URL` API | built-in | URL parsing | Zero-dep, works in RN, already proven in v4 |
| Custom `parseArtistUrl()` | copy from v4 | Platform detection | Already handles all edge cases, production-tested |
| `Clipboard` (expo-clipboard) | ~55.0.8 | Read pasted URL | Already installed |

**Do NOT use:** `url-parse`, `whatwg-url`, or any URL parsing library. The native `URL` API is sufficient and already works.

---

### 2. Platform API Integrations (Artist Eligibility Validation)

These all run on the **backend** (Next.js Vercel). The mobile app sends the parsed URL to `/api/mobile/validate-artist-link` and gets back name, photo, follower count, eligibility verdict. The mobile app never calls Spotify/SoundCloud directly.

#### Spotify

**Approach: Spotify oEmbed API (no auth) + scraping for monthly listeners.**

| Endpoint | Auth | Returns |
|----------|------|---------|
| `https://open.spotify.com/oembed?url=https://open.spotify.com/artist/{id}` | None | `{ title, thumbnail_url }` — name + photo only |
| `https://api.spotify.com/v1/artists/{id}` | Bearer token (Client Credentials) | Full data including `followers.total` |

**Monthly listeners are NOT in the Spotify API.** They only appear on the Spotify web page. The backend already uses Playwright for SoundCloud scraping (confirmed in `soundcloud.ts`). For listener count validation, use the same pattern: fetch `https://open.spotify.com/artist/{id}`, parse the `__NEXT_DATA__` JSON from the HTML response — this contains `monthlyListeners`. This runs server-side only.

| Technology | Purpose | Confidence |
|------------|---------|------------|
| Spotify oEmbed (unauthenticated GET) | Artist name + thumbnail | HIGH |
| Spotify Web API v1 + Client Credentials OAuth | `followers.total` as proxy | HIGH |
| `__NEXT_DATA__` parse from spotify.com page | Monthly listeners (exact count for threshold) | MEDIUM — page structure can change, but has been stable for 2+ years |

**For the eligibility check, use `followers.total` from the Web API as primary signal.** Monthly listener scraping is fragile — use it only as a secondary enrichment, not gating. Under 1M followers is a reasonable proxy for under 1M monthly listeners for underground artists.

#### SoundCloud

**Approach: SoundCloud Widget API (no auth key needed).**

Already proven in the backend's `enrich-via-api.ts`:

```
GET https://api-widget.soundcloud.com/resolve?url={soundcloud_url}&format=json&client_id=nIjtjiYnjkOhMyh5xrbqEW12DxeJVnic
```

Returns `followers_count`, `avatar_url`, `description`, `username`. The client ID in the codebase (`nIjtjiYnjkOhMyh5xrbqEW12DxeJVnic`) is a public widget client ID — it works without user auth. Check `followers_count` against 100K threshold.

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| SC Widget API (`api-widget.soundcloud.com`) | N/A | Follower count + avatar | HIGH — already in production use |

#### Apple Music

**Approach: MusicKit JS catalog search on the backend (requires Apple Developer token), fall back to Spotify cross-reference by name.**

Apple Music catalog lookups require a signed JWT developer token. This is a server-only operation.

Endpoint: `GET https://api.music.apple.com/v1/catalog/{storefront}/search?term={artist_name}&types=artists&limit=1`

Header: `Authorization: Bearer {developer_token}` (signed with your Apple Developer key + Team ID + Key ID).

**The key implementation detail:** Apple Music link format is `music.apple.com/{country}/artist/{artist-name}/{numeric-id}`. Use the numeric ID directly:
`GET https://api.music.apple.com/v1/catalog/us/artists/{id}`

For eligibility: Apple Music does not expose listener/follower counts via API. Per PRD: cross-reference by name on Spotify. If not found on Spotify, default to eligible. This is the right call — it's simple and errs toward inclusion.

| Technology | Purpose | Confidence |
|------------|---------|------------|
| Apple Music API v1 (catalog) | Artist name + image via numeric ID | MEDIUM — requires Apple Developer enrollment and signed JWT |
| Spotify cross-reference by name | Eligibility proxy for Apple Music artists | HIGH — explicitly specified in PRD |

**Recommendation:** Build Apple Music URL parsing first (mobile), defer Apple Music API integration until after Spotify and SoundCloud are working. The PRD fallback ("default to eligible") lets you ship without the Apple token.

---

### 3. GPS-Based Venue Check-In

**All packages already installed.** This is a pure implementation task.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| expo-location | ~55.1.2 | GPS coordinates | Already installed, already used in v4's `useVenueDetection` |
| Haversine (pure TS) | N/A | Distance to venues | Already implemented in v4's `useVenueDetection.ts` — copy verbatim |
| Supabase (direct query) | ^2.99.0 | Fetch venues within radius | Already pattern in v4 — query venues table, filter client-side at 200m |
| expo-haptics | ~55.0.8 | Haptic on stamp | Already installed, already used |

**Permission model:** Request `foreground` (while using) only. The v4 pattern uses `Location.requestForegroundPermissionsAsync()` then `Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })`. Use `Balanced` not `Highest` — faster response, sufficient for 200m geofence.

**Key pattern from v4 `useVenueDetection.ts`:**
- Query venues table from Supabase directly (small dataset — Chicago only)
- Haversine filter client-side at 200m radius
- Join with events table for today's date to get lineups
- Wrap in TanStack Query with AppState listener to refetch when app comes to foreground

Do NOT use `expo-location`'s `watchPositionAsync` for check-in — it's a one-shot action, not continuous tracking. `getCurrentPositionAsync` once is correct.

---

### 4. Server-Side Image Generation (Share Cards)

**Approach: `next/og` (Vercel ImageResponse) — already in production use.**

The backend's `passport/share-card/route.tsx` already uses:
```typescript
import { ImageResponse } from "next/og";
export const runtime = "edge";
```

This is Satori under the hood, running on Vercel Edge Runtime. It renders JSX to PNG. The mobile app downloads the PNG to cache (`expo-file-system` `File.downloadFileAsync`) then shares via `expo-sharing`.

**For new share cards (founder card, per-stamp card):** Create new route files under `~/decibel/src/app/api/` following the exact same pattern. The mobile client uses `useShareCard.ts` hooks that call the endpoint, download to cache, share.

| Technology | Version | Where | Purpose | Confidence |
|------------|---------|-------|---------|------------|
| `next/og` (ImageResponse) | built into Next.js 14 | Backend | Render JSX to PNG at Vercel Edge | HIGH — already in production |
| `expo-file-system` (File.downloadFileAsync) | ~55.0.10 | Mobile | Download card PNG to cache | HIGH — already in production |
| `expo-sharing` | ~55.0.11 | Mobile | iOS/Android share sheet | HIGH — already in production |
| `expo-clipboard` | ~55.0.8 | Mobile | Copy link fallback | HIGH — already installed |

**Do NOT use on mobile:** `react-native-view-shot`, `@shopify/react-native-skia`, or any client-side image capture. Server-side generation is already working, consistent, and fast.

**Do NOT use:** `sharp` for share cards (it's in the backend package.json but for other image processing, not share cards). `next/og` handles all card rendering.

---

### 5. Animation and Haptics (Stamp + Celebration UX)

**All packages already installed.** This is pure implementation.

#### Stamp Animation (Rubber Stamp Effect)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-native-reanimated | 4.2.1 | Spring physics for stamp slam | Already installed. Use `withSpring` + `withSequence` for the stamp-down/lift motion |
| lottie-react-native | ~7.3.4 | Ink spread + confetti | Already installed. Source Lottie JSON files from LottieFiles |
| expo-haptics | ~55.0.8 | Impact feedback on stamp contact | Already installed. `ImpactFeedbackStyle.Heavy` on stamp contact |

**Stamp animation sequence using Reanimated:**
```
1. Stamp enters from top-right, rotated 15deg
2. withSpring() slams down — stiffness: 300, damping: 15
3. At contact: Haptics.impactAsync(Heavy)
4. Lottie ink spread plays (0.5s)
5. withDelay(300, withSpring()) lifts slightly
6. Stamp reveals content (venue, date, artist)
```

**Lottie JSON sources:** LottieFiles.com — search "stamp ink", "rubber stamp", "confetti burst". Download JSON, commit to `assets/animations/`. These are free for commercial use (check license per file).

**Do NOT use:** `react-native-animatable` (outdated), CSS animations (not RN), or Animated API from core RN (Reanimated 4 is strictly better for this use case).

#### Post-Found Celebration (Confetti + Badge Reveal)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| lottie-react-native | ~7.3.4 | Confetti burst | Already installed |
| react-native-reanimated | 4.2.1 | Badge scale-in + glow pulse | `withSpring` + `withRepeat` for glow |
| expo-haptics | ~55.0.8 | `Heavy` for Founded, `Medium` for Discovered | Already installed |

#### Bottom Sheet (Check-In Flow)

The v4 codebase used `@gorhom/bottom-sheet` ^5.2.8 and it's NOT in the current `decibel-mobile` package.json. The v4 used it for `NearbyVenueSheet`. The current build uses `Modal` + `Animated.View` with `SlideInDown` instead.

**Recommendation: Keep using the Modal + Reanimated pattern.** It's already working in Phase 1 and doesn't require an additional native module. Only add `@gorhom/bottom-sheet` if the check-in flow needs true snap-point behavior (pull-to-close, multiple snap heights). The stamp/check-in flow is a wizard — a full-screen modal flow is fine.

---

## Installation

Everything needed is already installed. No new packages required for these features.

```bash
# Nothing to install for URL parsing, GPS, haptics, animations, share cards
# These all use existing packages

# Only needed if you opt for true bottom sheet (optional, not recommended):
# npx expo install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler
# (but Reanimated and Gesture Handler are already installed)
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| SC Widget API (`api-widget.soundcloud.com`) | Official SoundCloud API (OAuth) | Only if you need user-level data (playlists, uploads). For follower count, widget API is sufficient and auth-free. |
| `next/og` (Satori on Edge) | `sharp` on Node.js | If you need complex image compositing or photo manipulation. For text+color share cards, `next/og` is far simpler. |
| Modal + Reanimated for check-in | `@gorhom/bottom-sheet` | If you need multi-snap-point persistent bottom sheet (e.g., map with overlay). Not needed for wizard-style check-in. |
| `Haversine` (pure TS, no library) | `geolib` npm package | For large venue sets (1000+ points). Current Chicago-only dataset is small enough to filter in JS. |
| Monthly listener proxy via `followers.total` | Scraping `__NEXT_DATA__` for exact count | If exact monthly listener count is gating requirement. Currently the 1M threshold is loose enough that followers work as proxy. |
| Apple Music: Spotify cross-reference for eligibility | Apple Music API listener count | Apple doesn't expose listener counts via API. Cross-reference is the only viable approach. |
| `URL` built-in + custom parser | `url-parse` or `whatwg-url` | Never — native `URL` is sufficient and zero-dep. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Deezer API | Explicitly banned by PRD | Nothing — not needed |
| Spotify search API | PRD prohibits external artist search | Link paste + Spotify oEmbed for validation |
| `react-native-view-shot` | Client-side image capture is inconsistent across OS versions and produces lower quality than server-side rendering | `next/og` on backend |
| `@shopify/react-native-skia` | Heavy native module, only useful for real-time canvas rendering. Share cards are static, generated once. | `next/og` on backend |
| `expo-location` watchPositionAsync | Continuous tracking drains battery; check-in is one-shot | `getCurrentPositionAsync` once |
| `Location.Accuracy.Highest` | 3-5 second wait for GPS lock, unnecessary for 200m geofence | `Location.Accuracy.Balanced` (faster, sufficient) |
| `react-native-animatable` | Old animation library, incompatible with Reanimated 4 | `react-native-reanimated` 4.2.1 (already installed) |
| Animated API (core RN) | Runs on JS thread, can drop frames on complex animations | `react-native-reanimated` (runs on UI thread) |
| Apple Music MusicKit JS on mobile | Browser-only SDK, doesn't work in RN | Apple Music REST API v1 on backend |
| Any Spotify client-side SDK in the mobile app | All API calls should go through the Decibel backend to hide credentials | Backend `/api/mobile/validate-artist-link` endpoint |

---

## Stack Patterns by Variant

**If implementing Apple Music link validation before getting Apple Developer keys:**
- Parse the numeric ID from the URL client-side
- Send name + ID to backend
- Backend cross-references by name on Spotify
- Default to eligible if not found on Spotify
- Ship this first, add Apple Music API later

**If the stamp animation needs to feel more physical:**
- Keep the Reanimated `withSpring` for the slam motion
- Add `rotation` randomization (-3 to +3 degrees) per stamp using `Math.random()` seeded on `performer_id`
- This makes each stamp unique without additional libraries

**If the check-in needs to handle multiple artists (known lineup):**
- Auto-collect all artists in one API call to `/api/mobile/check-in`
- Show stamp animation once per artist in sequence with 500ms delay between each
- Do NOT show a separate confirmation modal per artist — chain the stamp visuals

**If GPS check-in fails (no venues within 200m):**
- Fall through to Scenario B: "Is there live music?" prompt
- If yes: link paste flow for DJ → creates `user_tagged_events` record + Stamp
- If no: no stamp, graceful exit
- Do NOT show an error state — this is expected behavior for many check-ins

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| react-native-reanimated 4.2.1 | React Native 0.83.2 | Confirmed compatible — already in production |
| lottie-react-native ~7.3.4 | Expo SDK 55 | Confirmed — in current package.json |
| expo-location ~55.1.2 | Expo SDK 55 | Confirmed — note `~55.1.2` is a point release above the standard `~55.0.x`, already there |
| next/og (ImageResponse) | Next.js 14+ on Vercel | Already in backend production use |
| SC Widget API client_id | No expiry concern | Widget client IDs are stable. If it breaks, fetch a new one from any SoundCloud embed |

---

## Sources

- `/home/swarn/decibel-mobile-v4/src/lib/urlParser.ts` — URL parsing implementation verified (HIGH confidence)
- `/home/swarn/decibel-mobile-v4/src/hooks/useVenueDetection.ts` — GPS + Haversine pattern verified (HIGH confidence)
- `/home/swarn/decibel-mobile-v4/src/hooks/useAddArtist.ts` — Spotify/SoundCloud add flow pattern (HIGH confidence)
- `/home/swarn/decibel/scripts/scrapers/enrich-via-api.ts` — SC Widget API in production use (HIGH confidence)
- `/home/swarn/decibel/src/app/api/passport/share-card/route.tsx` — `next/og` ImageResponse in production (HIGH confidence)
- `/home/swarn/decibel-mobile-v4/src/hooks/useShareCard.ts` — `File.downloadFileAsync` + sharing pattern (HIGH confidence)
- `/home/swarn/decibel-mobile/package.json` — current installed packages verified (HIGH confidence)
- Apple Music API docs — WebFetch blocked; Apple Music catalog endpoint and JWT auth requirement based on training data (MEDIUM confidence — verify developer.apple.com before implementing)
- Spotify `__NEXT_DATA__` monthly listener scraping — training data + existing SoundCloud Playwright pattern in codebase (MEDIUM confidence — fragile, use only as enrichment not eligibility gate)

---

*Stack research for: Decibel Mobile — Phase 2+ feature additions (link-paste add, check-in, share cards, animations)*
*Researched: 2026-03-10*
