---
phase: 08-jukebox
plan: 02
subsystem: ui
tags: [jukebox, react-native-webview, webview-pool, embedded-player, flatlist, discover]

# Dependency graph
requires:
  - phase: 08-jukebox
    plan: 01
    provides: useJukebox hook, JukeboxItem types, react-native-webview installed

provides:
  - EmbeddedPlayer component with WebView pool isActive prop and audio pause on eviction
  - JukeboxCard component with finder info, artist row, embedded player, Discover button
  - Jukebox screen (app/jukebox.tsx) with FlatList, max-3 WebView pool, empty state, Discover wiring
  - Home screen ListMusic icon replacing Map icon — navigates to /jukebox

affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - WebView pool: onViewableItemsChanged evicts oldest when >3 active, useRef for ordered tracking
    - EmbeddedPlayer isActive placeholder pattern: same dimensions, no DOM cost when pooled out
    - injectJavaScript audio pause on isActive->false (JBX-08 cleanup)

key-files:
  created:
    - ~/decibel-mobile/src/components/jukebox/EmbeddedPlayer.tsx
    - ~/decibel-mobile/src/components/jukebox/JukeboxCard.tsx
    - ~/decibel-mobile/app/jukebox.tsx
  modified:
    - ~/decibel-mobile/app/(tabs)/index.tsx

key-decisions:
  - "WebView pool uses ref (activeKeysRef) for ordered eviction, state (activeKeys Set) for render — avoids stale closure in onViewableItemsChanged callback"
  - "EmbeddedPlayer placeholder is same-height View (not null/0-height) to prevent FlatList layout jumps on pool eviction"
  - "Haptics called in Jukebox screen handler, not inside useDiscoverArtist — useDiscoverArtist already calls haptics onSuccess; double haptic is intentional (tap + success)"

requirements-completed: [JBX-01, JBX-04, JBX-05, JBX-06, JBX-07, JBX-08, JBX-09, JBX-11]

# Metrics
duration: 15min
completed: 2026-03-13
---

# Phase 08 Plan 02: Jukebox UI Summary

**Jukebox screen with FlatList, max-3 WebView pool (evicts oldest via onViewableItemsChanged), JukeboxCard (finder row + artist row + EmbeddedPlayer + Discover button), and Home icon swap from Map to ListMusic**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-03-13
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `EmbeddedPlayer`: WebView with `mediaPlaybackRequiresUserAction={true}` (JBX-07), `injectJavaScript` pause on eviction (JBX-08), placeholder View when `isActive=false`
- `JukeboxCard`: finder avatar/name/timeago, artist photo/name/platform badge (Spotify green, SoundCloud orange, Apple Music pink), EmbeddedPlayer slot, Discover button with isCollected state
- `app/jukebox.tsx`: FlatList of JukeboxCards, max-3 WebView pool, Discover mutation + haptic, empty state, infinite scroll, pull-to-refresh, isFallback subtitle
- Home screen: Map icon replaced with ListMusic, navigates to /jukebox (JBX-01)

## Task Commits

1. **Task 1: EmbeddedPlayer + JukeboxCard components** — `f01d8d0`
2. **Task 2: Jukebox screen + Home icon swap + Discover wiring** — `8674210`

## Files Created/Modified

- `~/decibel-mobile/src/components/jukebox/EmbeddedPlayer.tsx` — WebView wrapper with pool management (58 lines)
- `~/decibel-mobile/src/components/jukebox/JukeboxCard.tsx` — full card component (223 lines)
- `~/decibel-mobile/app/jukebox.tsx` — Jukebox screen (247 lines)
- `~/decibel-mobile/app/(tabs)/index.tsx` — Map→ListMusic swap, Alert removed

## Decisions Made

- WebView pool uses `useRef` for ordered active list and `useState` for render trigger — necessary because `onViewableItemsChanged` is a stable ref callback that can't read fresh state
- EmbeddedPlayer placeholder preserves exact height to prevent FlatList layout shifts on eviction
- Double haptic on Discover is intentional: tap feedback (Medium, immediate) + success feedback (from useDiscoverArtist onSuccess)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: ~/decibel-mobile/src/components/jukebox/EmbeddedPlayer.tsx (58 lines, >40 min)
- FOUND: ~/decibel-mobile/src/components/jukebox/JukeboxCard.tsx (223 lines, >60 min)
- FOUND: ~/decibel-mobile/app/jukebox.tsx (247 lines, >80 min)
- FOUND: ~/decibel-mobile/app/(tabs)/index.tsx — ListMusic import, router.push("/jukebox")
- FOUND: commit f01d8d0 (feat(08-02): EmbeddedPlayer + JukeboxCard components)
- FOUND: commit 8674210 (feat(08-02): Jukebox screen + Home icon swap + Discover wiring)
- VERIFIED: TypeScript clean (npx tsc --noEmit — zero source errors)
- VERIFIED: mediaPlaybackRequiresUserAction present in EmbeddedPlayer
- VERIFIED: router.push("/jukebox") present in index.tsx
- VERIFIED: useJukebox + useDiscoverArtist both imported and called in jukebox.tsx

---
*Phase: 08-jukebox*
*Completed: 2026-03-13*
