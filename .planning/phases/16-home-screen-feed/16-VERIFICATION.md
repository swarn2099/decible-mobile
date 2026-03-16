---
phase: 16-home-screen-feed
verified: 2026-03-16T03:00:00Z
status: passed
score: 5/5 success criteria verified
re_verification: false
human_verification:
  - test: "Stats bar shows correct numbers on device"
    expected: "Finds, Founders, and Influence Score all display real data for the logged-in user; skeleton dashes shown while loading"
    why_human: "Cannot query Supabase auth token or compare displayed numbers against DB values programmatically"
  - test: "Collect button on feed card creates Discovery with haptic feedback"
    expected: "Tapping Collect on a feed card adds the artist to passport, shows 'In Passport' label, triggers medium haptic, and sends push notification to the original finder"
    why_human: "Requires a real device with active session and a test artist not already in passport; notification delivery cannot be verified programmatically"
  - test: "Trending Artists row tap navigates to artist profile"
    expected: "Tapping a circular artist image on the Trending row opens the correct artist profile screen"
    why_human: "Routing behavior requires device-level execution"
  - test: "Jukebox screen WebView pool capping"
    expected: "Scrolling past 3 cards in Jukebox unmounts the oldest WebView (player goes inactive); only 3 embedded players are active at any time"
    why_human: "WebView lifecycle behavior cannot be verified statically; requires scrolling interaction on device"
---

# Phase 16: Home Screen Feed Verification Report

**Phase Goal:** The Home screen surfaces the user's social music discovery feed, personal stats, trending artists, and a Jukebox — replacing the map-centric layout
**Verified:** 2026-03-16T03:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Home screen stats bar shows Finds, Founders, and Influence Score for the logged-in user | VERIFIED | `StatsBar.tsx` renders 3-column card with pink/gold/purple accent stats; `useUserStats` hook fetches from `/mobile/user-stats`; endpoint performs real Supabase COUNT queries on `collections` and `founder_badges` |
| 2 | Activity feed shows Find, Founder, and Collect cards from followed users; empty feed falls back to "Trending on Decibel" | VERIFIED | `activity-feed/route.ts` queries `fan_follows` first; `is_fallback=true` when no followed-user results; `index.tsx` switches header label to "Trending on Decibel" with TrendingUp icon when `isFallback` is true |
| 3 | Trending Artists row displays and is tappable, navigating to the artist profile | VERIFIED | `TrendingArtistsRow.tsx` renders horizontal `ScrollView` of 56px circles; `ArtistCircle` has `Pressable` calling `router.push('/artist/${artist.slug}')` |
| 4 | Jukebox button opens the Jukebox screen with embedded players; max 3 WebViews active at once | VERIFIED | Home top bar has `Pressable` calling `router.push('/jukebox')`; `jukebox.tsx` declares `MAX_ACTIVE_WEBVIEWS = 3` and enforces it via `onViewableItemsChanged` capping pool to last 3 visible IDs |
| 5 | One-tap Collect from a feed card or Jukebox card creates a Discovery and notifies the original finder | VERIFIED | `ActivityFeedCard` renders pink Collect button calling `onCollect(performer_id)`; `index.tsx` wires `onCollect` to `discoverMutate({ performerId })`; Jukebox wires `onDiscover` to `discoverArtistMutate`; `discover/route.ts` calls `sendPushNotification` to the founder's fan_id |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `/home/swarn/decibel/src/app/api/mobile/user-stats/route.ts` | VERIFIED | 99 lines; exports `GET`; real Supabase COUNT queries for finds, founders, influence; auth via Bearer token |
| `/home/swarn/decibel/src/app/api/mobile/trending-artists/route.ts` | VERIFIED | 89 lines; exports `GET`; queries collections last 7 days, groups in JS, returns top 10 with `collector_count` |
| `/home/swarn/decibel/src/app/api/mobile/activity-feed/route.ts` | VERIFIED | 207 lines; `fan_follows` filter added; `is_fallback` boolean in response; existing dedup and garbled-name filter preserved |
| `/home/swarn/decibel-mobile/src/hooks/useUserStats.ts` | VERIFIED | 24 lines; `useQuery` wrapping `apiCall('/mobile/user-stats')`; 2-min staleTime; returns `{ finds, founders, influence, isLoading }` |
| `/home/swarn/decibel-mobile/src/hooks/useTrendingArtists.ts` | VERIFIED | 28 lines; `useQuery` wrapping `apiCall('/mobile/trending-artists')`; 5-min staleTime; returns `{ artists, isLoading }` |
| `/home/swarn/decibel-mobile/src/components/home/StatsBar.tsx` | VERIFIED | 98 lines; 3-column flex layout; pink/gold/purple accent colors from `useThemeColors()`; skeleton dashes on load |
| `/home/swarn/decibel-mobile/src/components/home/TrendingArtistsRow.tsx` | VERIFIED | 156 lines; horizontal ScrollView; 56px circular images with initials fallback; placeholder circles when loading; returns null when empty |
| `/home/swarn/decibel-mobile/src/components/home/ActivityFeedCard.tsx` | VERIFIED | 231 lines; `onCollect` and `isCollected` props added; pink Collect pill or "In Passport" text at right edge |
| `/home/swarn/decibel-mobile/src/hooks/useActivityFeed.ts` | VERIFIED | 33 lines; `is_fallback` added to `ActivityFeedResponse` type; `isFallback` derived from `data?.pages[0]?.is_fallback ?? false` |
| `/home/swarn/decibel-mobile/app/(tabs)/index.tsx` | VERIFIED | 262 lines; imports and wires all new components; pull-to-refresh refetches all 3 queries; 100px bottom padding; Leaderboard button removed |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `useUserStats.ts` | `/api/mobile/user-stats` | `apiCall GET` | WIRED | Line 13: `apiCall<UserStatsResponse>('/mobile/user-stats')` |
| `useTrendingArtists.ts` | `/api/mobile/trending-artists` | `apiCall GET` | WIRED | Line 19: `apiCall<TrendingArtistsResponse>('/mobile/trending-artists')` |
| `useActivityFeed.ts` | `is_fallback` field | type + derived value | WIRED | `ActivityFeedResponse` includes `is_fallback: boolean`; exposed as `isFallback` from hook |
| `ActivityFeedCard.tsx` | `onCollect` handler | Pressable onPress | WIRED | Line 178: `onPress={() => onCollect(item.performer_id)}`; prop declared on type |
| `index.tsx` | `useDiscoverArtist` | `handleCollect` callback | WIRED | `handleCollect` calls `discoverMutate({ performerId })`; passed as `onCollect` to each `ActivityFeedCard` |
| `TrendingArtistsRow` | `router.push('/artist/')` | Pressable onPress | WIRED | `router.push('/artist/${artist.slug}')` in `ArtistCircle` |
| `jukebox.tsx` | `discoverArtistMutate` | `handleDiscover` callback | WIRED | Line 133: `discoverArtistMutate({ performerId })`; passed as `onDiscover` to `JukeboxCard` |
| `discover/route.ts` | `sendPushNotification` | finder lookup | WIRED | Calls `sendPushNotification({ userId: finderFanId, ... })` after successful collection |
| `user-stats/route.ts` | `collections` + `founder_badges` | Supabase COUNT queries | WIRED | Three real COUNT queries with `.eq("fan_id", fanId)` and influence two-query pattern |
| `trending-artists/route.ts` | `collections` + `performers` | Supabase join + JS grouping | WIRED | `.select('performer_id, performers!inner(...)').gte("created_at", cutoff)` |
| `activity-feed/route.ts` | `fan_follows` table | `.eq("follower_id", fanId)` | WIRED | Lines 45-48 query `fan_follows`; lines 59-82 branch on `followingIds.length > 0` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| HOME-01 | 16-01, 16-02 | Stats bar shows Finds, Founders, Influence Score | SATISFIED | `user-stats` endpoint + `StatsBar` component + `useUserStats` hook all verified |
| HOME-02 | 16-01, 16-02 | Activity feed loads from followed users | SATISFIED | `fan_follows` filter in `activity-feed/route.ts`; `useActivityFeed` consumes updated endpoint |
| HOME-03 | 16-01, 16-02 | Fallback "Trending on Decibel" when feed is empty | SATISFIED | `is_fallback` returned from API and surfaced in UI as "Trending on Decibel" header |
| HOME-04 | 16-01, 16-02 | Trending Artists row displays and is tappable | SATISFIED | `TrendingArtistsRow` component and `useTrendingArtists` hook verified; tap navigates to profile |
| HOME-05 | 16-02 | Jukebox button replaces map button | SATISFIED | `index.tsx` top bar: `ListMusic` icon button calls `router.push('/jukebox')`; no map button present |
| HOME-06 | 16-02 | Max 3 WebViews active in Jukebox | SATISFIED | `jukebox.tsx`: `MAX_ACTIVE_WEBVIEWS = 3` constant; `onViewableItemsChanged` enforces pool cap |
| HOME-07 | 16-02 | One-tap Collect from feed/Jukebox creates Discovery | SATISFIED | Feed: `onCollect` → `discoverMutate`; Jukebox: `onDiscover` → `discoverArtistMutate`; both hit `POST /mobile/discover` |
| HOME-08 | 16-01 | Notification sent to finder on collect | SATISFIED | `discover/route.ts` calls `sendPushNotification({ userId: finderFanId })` after successful Discovery creation |

All 8 requirements satisfied. No orphaned requirements detected.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `TrendingArtistsRow.tsx` | 113 | `return null` | Info | Intentional — correct behavior when artists array is empty and not loading |

No blockers or warnings found. The `return null` in `TrendingArtistsRow` is the specified design behavior (hide row when no data), not a stub.

---

### Human Verification Required

#### 1. Stats Bar Data Accuracy

**Test:** Open the app, check the Home screen stats bar
**Expected:** Finds, Founders, and Influence Score match the user's actual DB counts
**Why human:** Cannot run an authenticated API call or compare displayed values against DB state programmatically

#### 2. Collect Button End-to-End Flow

**Test:** Tap "Collect" on a feed card for an artist not yet in your passport
**Expected:** Artist added as Discovery, button changes to "In Passport", medium haptic fires, push notification delivered to the original finder
**Why human:** Requires a live session, a specific test artist, and notification delivery verification

#### 3. Trending Artists Navigation

**Test:** Scroll to the bottom of the Home feed, tap a circular artist image in the Trending row
**Expected:** App navigates to the correct artist profile screen
**Why human:** Requires device-level routing execution and a non-empty trending dataset

#### 4. Jukebox WebView Pool Capping

**Test:** Open Jukebox, scroll slowly past 4+ cards
**Expected:** Only 3 embedded players remain active; the oldest WebView deactivates as new ones enter the viewport
**Why human:** WebView lifecycle and visible item tracking requires physical scrolling interaction on device

---

### Gaps Summary

No gaps. All 5 success criteria from the ROADMAP are achieved, all 8 requirement IDs are satisfied, all artifacts exist and are substantive, all key links are wired end-to-end. The phase goal is achieved.

Backend commits `8ccf858` and `b13148f` exist in `/home/swarn/decibel`. Mobile commits `1f1dec7` and `e88f9a1` exist in `/home/swarn/decibel-mobile`. EAS update deployed to preview channel (update group `6cbb7c7e-8647-43c1-ad52-9872defb5fa7`).

---

_Verified: 2026-03-16T03:00:00Z_
_Verifier: Claude (gsd-verifier)_
