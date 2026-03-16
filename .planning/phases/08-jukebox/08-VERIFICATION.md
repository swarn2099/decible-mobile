---
phase: 08-jukebox
verified: 2026-03-13T08:00:00Z
status: gaps_found
score: 4/5 success criteria verified
re_verification: false
gaps:
  - truth: "event_artists junction table exists in DB"
    status: failed
    reason: "Migration SQL was written and committed but never applied to the Supabase DB — no DB password available during execution. The table does not exist in production."
    artifacts:
      - path: "~/decibel/supabase/migrations/20260313_event_artists.sql"
        issue: "Migration file exists and is correct, but was never run against DB"
      - path: "~/decibel/src/app/api/admin/run-migration/route.ts"
        issue: "Migration endpoint wired up but requires SUPABASE_DB_PASSWORD on Vercel to execute"
    missing:
      - "Apply the event_artists migration to Supabase DB via Dashboard SQL Editor, psql with DB password, or run-migration endpoint once SUPABASE_DB_PASSWORD is set on Vercel"
human_verification:
  - test: "Open Jukebox screen and scroll past 3 cards"
    expected: "Fourth card's WebView becomes a placeholder (music icon), audio from earlier card stops"
    why_human: "WebView pool eviction and audio pause via injectJavaScript cannot be verified programmatically"
  - test: "Tap Jukebox icon on Home screen with background music playing"
    expected: "Background music continues uninterrupted when Jukebox screen opens"
    why_human: "mediaPlaybackRequiresUserAction iOS behavior requires device testing"
  - test: "Tap Discover on a Jukebox card, then navigate to Passport > Discoveries tab"
    expected: "The artist appears in the Discoveries tab with haptic feedback on button tap"
    why_human: "End-to-end collect flow involves real API call and UI state update"
  - test: "Have another user discover an artist you originally found"
    expected: "You receive a push notification: 'Someone discovered your find!' — tapping it opens the artist profile"
    why_human: "Push notification delivery requires two real devices and live push infrastructure"
---

# Phase 8: Jukebox Verification Report

**Phase Goal:** Users can browse followed users' Finds in a social music feed, listen via embedded players, and one-tap collect Discoveries
**Verified:** 2026-03-13
**Status:** gaps_found (1 gap — MIG-04 DB table not applied; all code artifacts verified)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Jukebox icon replaces map icon on Home; navigates to /jukebox | VERIFIED | `ListMusic` imported in `app/(tabs)/index.tsx` line 10; `router.push("/jukebox")` at line 84 |
| 2 | Feed shows Finds from followed users in last 48h; falls back to all platform Finds when empty | VERIFIED | `jukebox/route.ts`: following-based query with 48h cutoff, fallback branch when `followingIds.length === 0` or results empty; `isFallback` flag returned |
| 3 | Embedded players render via WebView; opening Jukebox does not interrupt background music | VERIFIED (code) | `EmbeddedPlayer.tsx`: `mediaPlaybackRequiresUserAction={true}` at line 49; `allowsInlineMediaPlayback={true}`; audio pause via `injectJavaScript` on `isActive -> false`; max-3 pool enforced in `jukebox.tsx` |
| 4 | One-tap Discover adds Discovery to Passport with haptic feedback | VERIFIED | `discover/route.ts` line 102: `collection_type: "discovery"` in insert; `jukebox.tsx`: `handleDiscover` calls `Haptics.impactAsync(Medium)` then `discoverArtistMutate`; `useDiscoverArtist.onSuccess` invalidates `["jukebox"]` cache |
| 5 | Finder receives notification when someone collects from their Find | VERIFIED (code) | `discover/route.ts` lines 114-157: fire-and-forget IIFE checks `founder_badges` then `find`-type collections, skips self-notification, calls `sendPushNotification` with `type: "artist_collected"`; `notifications.ts` routes `artist_collected` to `/artist/:slug` |

**Score:** 4/5 success criteria verified (SC-3 has human-only aspects; MIG-04 sub-requirement not applied to DB)

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `~/decibel/src/app/api/mobile/jukebox/route.ts` | GET jukebox feed endpoint | VERIFIED | 244 lines; exports `GET`; auth, following query, fallback, embed derivation, fire-and-forget backfill all present |
| `~/decibel-mobile/src/hooks/useJukebox.ts` | useInfiniteQuery hook | VERIFIED | 33 lines; `useInfiniteQuery` with `["jukebox"]` key, `isFallback` from first page, flattened `items` accessor |
| `~/decibel-mobile/src/types/jukebox.ts` | JukeboxItem + JukeboxResponse types | VERIFIED | Exports both types exactly as specified in plan |
| `~/decibel/supabase/migrations/20260313_event_artists.sql` | event_artists DDL | PARTIAL | SQL file exists and is correct; table NOT applied to DB |

### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `~/decibel-mobile/src/components/jukebox/EmbeddedPlayer.tsx` | WebView wrapper with pool management | VERIFIED | 55 lines (> 40 min); `mediaPlaybackRequiresUserAction`, `injectJavaScript` pause, placeholder View |
| `~/decibel-mobile/src/components/jukebox/JukeboxCard.tsx` | Card with finder info, artist, player, Discover button | VERIFIED | 281 lines (> 60 min); all required sections present; theme-aware |
| `~/decibel-mobile/app/jukebox.tsx` | Jukebox screen with FlatList + pool | VERIFIED | 247 lines (> 80 min); max-3 pool, empty state, infinite scroll, pull-to-refresh, Discover wiring |

### Plan 03 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `~/decibel/src/app/api/mobile/discover/route.ts` | Updated discover with collection_type + notification | VERIFIED | `collection_type: "discovery"` at line 102; fire-and-forget IIFE at lines 114-157 |
| `~/decibel-mobile/src/lib/notifications.ts` | handleNotificationRoute with artist_collected | VERIFIED | `case "artist_collected"` at line 70, returns `/artist/${data.slug}` |
| `~/decibel-mobile/src/hooks/useDiscoverArtist.ts` | Cache invalidation on success | VERIFIED | `invalidateQueries({ queryKey: ["jukebox"] })` at line 29 |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `app/(tabs)/index.tsx` | `/jukebox` | `router.push` on ListMusic press | WIRED | Line 84: `router.push("/jukebox")` |
| `app/jukebox.tsx` | `useJukebox` | hook call | WIRED | Line 16-17: imported and called |
| `app/jukebox.tsx` | `useDiscoverArtist` | hook call for discover mutation | WIRED | Line 18, 81: imported and called |
| `src/components/jukebox/EmbeddedPlayer.tsx` | `react-native-webview` | WebView with mediaPlaybackRequiresUserAction | WIRED | Line 3: `import WebView from "react-native-webview"`, line 49: prop present |
| `src/hooks/useJukebox.ts` | `/api/mobile/jukebox` | `apiCall GET` | WIRED | Line 12: `apiCall<JukeboxResponse>('/mobile/jukebox?page=${pageParam}')` |
| `~/decibel/src/app/api/mobile/discover/route.ts` | `sendPushNotification` | fire-and-forget after insert | WIRED | Line 3: imported; line 147: called in IIFE |
| `~/decibel-mobile/src/lib/notifications.ts` | `/artist/:slug` | case artist_collected | WIRED | Line 70: case present, returns correct path |
| `~/decibel-mobile/src/hooks/useDiscoverArtist.ts` | jukebox query cache | `invalidateQueries` in onSuccess | WIRED | Line 29: `invalidateQueries({ queryKey: ["jukebox"] })` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| MIG-04 | 08-01 | event_artists junction table created | PARTIAL | SQL file committed and correct; table not applied to DB |
| JBX-01 | 08-02 | Map button replaced with Jukebox icon | SATISFIED | `ListMusic` + `router.push("/jukebox")` in index.tsx |
| JBX-02 | 08-01 | Jukebox loads Finds from followed users in last 48h | SATISFIED | jukebox/route.ts: `gte("created_at", cutoff)` + `in("fan_id", followingIds)` |
| JBX-03 | 08-01 | Fallback to all platform Finds when followed-user Finds empty | SATISFIED | Fallback branch in route.ts lines 129-148; `isFallback=true` set |
| JBX-04 | 08-02 | Each card shows finder avatar + username + time ago, artist name + platform badge | SATISFIED | JukeboxCard.tsx: AvatarCircle, fan_name, formatRelativeTime, performer_name, platform badge |
| JBX-05 | 08-02 | Embedded player via WebView renders for Spotify, SoundCloud, Apple Music | SATISFIED (code) | EmbeddedPlayer.tsx: WebView with source.uri; JukeboxCard passes embed_url |
| JBX-06 | 08-02 | Max 3 WebViews active via onViewableItemsChanged | SATISFIED | jukebox.tsx: MAX_ACTIVE_WEBVIEWS=3, activeKeysRef/activeKeys pool logic |
| JBX-07 | 08-02 | WebView audio does not interrupt background music | SATISFIED (code) | EmbeddedPlayer.tsx line 49: `mediaPlaybackRequiresUserAction={true}` |
| JBX-08 | 08-02 | Audio stopped via injectJavaScript before WebView unmount | SATISFIED | EmbeddedPlayer.tsx lines 18-24: useEffect on isActive change |
| JBX-09 | 08-02 | One-tap Discover with haptic feedback | SATISFIED | jukebox.tsx handleDiscover: Haptics.Medium + discoverArtistMutate |
| JBX-10 | 08-03 | Finder receives notification on collect | SATISFIED (code) | discover/route.ts: fire-and-forget IIFE with sendPushNotification |
| JBX-11 | 08-02 | Empty state when no Finds | SATISFIED | jukebox.tsx: JukeboxEmpty component in ListEmptyComponent |
| JBX-12 | 08-01 | Embed URLs cached on performers table | SATISFIED | jukebox/route.ts: needsBackfill fire-and-forget Promise.allSettled |
| JBX-13 | 08-01 | GET /api/mobile/jukebox endpoint returns feed data | SATISFIED | Endpoint live at decibel-three.vercel.app, returns 401 for invalid auth |
| JBX-14 | 08-03 | POST /api/mobile/discover creates Discovery collection_type | SATISFIED | discover/route.ts line 102: `collection_type: "discovery"` |

**Coverage:** 14/15 requirements satisfied. MIG-04 is PARTIAL — SQL exists, DB table not applied.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `jukebox/route.ts` | 196 | `spotify_embed_url: derived.embedUrl // reuse field placeholder` | Info | Comment misleading but logic is correct — the update block at line 225 correctly branches on `soundcloud_embed_url` presence. Not a functional bug. |

No blockers or warnings found. The "placeholder" token on line 196 is a developer comment, not a code stub.

---

## Commits Verified

| Commit | Repo | Description |
|--------|------|-------------|
| `7d0d6f8` | decibel (backend) | feat(08-01): GET /api/mobile/jukebox + event_artists migration |
| `1edee43` | decibel-mobile | feat(08-01): useJukebox hook + jukebox types + react-native-webview |
| `f01d8d0` | decibel-mobile | feat(08-02): EmbeddedPlayer + JukeboxCard components |
| `8674210` | decibel-mobile | feat(08-02): Jukebox screen + Home icon swap + Discover wiring |
| `e9bb099` | decibel (backend) | feat(08-03): discover endpoint collection_type + finder notification |
| `55d9b62` | decibel-mobile | feat(08-03): artist_collected notification route + jukebox cache invalidation |

All 6 commits confirmed present in their respective repos.

---

## Human Verification Required

### 1. WebView pool eviction

**Test:** Open Jukebox screen, scroll down past 3 cards slowly
**Expected:** When a 4th card becomes visible, the oldest active WebView shows a placeholder (music note icon) and any playing audio stops
**Why human:** `injectJavaScript` audio pause and pool eviction behavior requires device testing

### 2. Background music non-interruption

**Test:** Start playing music in Spotify or Apple Music on device, then open the Jukebox screen
**Expected:** Background music continues playing uninterrupted; embedded players do not autoplay
**Why human:** `mediaPlaybackRequiresUserAction` behavior is iOS-only and cannot be verified without a real device

### 3. Discover flow end-to-end

**Test:** Tap "Discover" on a Jukebox card
**Expected:** Haptic fires immediately on tap, a second haptic fires on success; card shows "In Passport"; artist appears in Passport > Discoveries tab
**Why human:** Full collect flow requires live API call and UI state verification on device

### 4. Finder push notification

**Test:** Have User A add an artist (becoming the finder). Have User B discover that artist from the Jukebox feed.
**Expected:** User A receives a push notification: "Someone discovered your find! [User B name] discovered [artist name] from your find". Tapping the notification opens the artist profile screen.
**Why human:** Push notification delivery requires two real devices, live Expo push service, and a real DB state

---

## Gaps Summary

One gap blocks full requirement satisfaction:

**MIG-04 — event_artists table not applied to DB.** The migration SQL file is correctly authored at `~/decibel/supabase/migrations/20260313_event_artists.sql` and committed to the backend repo. A run-migration admin endpoint exists at `GET /api/admin/run-migration`. However, the table has not been applied to the Supabase database because no DB password was available during phase execution.

**Impact assessment:** The `event_artists` table is NOT queried by any phase 08 code path. The Jukebox endpoint queries the `collections` table only. This gap does not break the Jukebox feature — it is a forward-compatibility concern for the check-in lineup association feature in Phase 9. All 5 Jukebox success criteria work without this table.

**To close this gap:** Apply the migration via Supabase Dashboard SQL Editor — paste the contents of `~/decibel/supabase/migrations/20260313_event_artists.sql` and run it.

---

_Verified: 2026-03-13_
_Verifier: Claude (gsd-verifier)_
