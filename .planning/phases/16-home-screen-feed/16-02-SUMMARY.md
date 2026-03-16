---
phase: 16-home-screen-feed
plan: 02
subsystem: mobile-ui
tags: [react-native, home-screen, stats-bar, trending-artists, social-feed, collect]

# Dependency graph
requires:
  - "GET /api/mobile/user-stats (from 16-01)"
  - "GET /api/mobile/trending-artists (from 16-01)"
  - "Updated GET /api/mobile/activity-feed with is_fallback (from 16-01)"
provides:
  - "Rebuilt Home screen with stats bar, social feed, collect buttons, trending artists row"
  - "useUserStats hook"
  - "useTrendingArtists hook"
  - "StatsBar component"
  - "TrendingArtistsRow component"
affects: [17-artist-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isFallback derived from first page of infinite query (data?.pages[0]?.is_fallback)"
    - "Collect button on feed cards wires to useDiscoverArtist mutation"
    - "Pull-to-refresh refetches all three queries: activity-feed, user-stats, trending-artists"
    - "TrendingArtistsRow in ListFooterComponent to appear after feed content"

key-files:
  created:
    - /home/swarn/decibel-mobile/src/hooks/useUserStats.ts
    - /home/swarn/decibel-mobile/src/hooks/useTrendingArtists.ts
    - /home/swarn/decibel-mobile/src/components/home/StatsBar.tsx
    - /home/swarn/decibel-mobile/src/components/home/TrendingArtistsRow.tsx
  modified:
    - /home/swarn/decibel-mobile/src/hooks/useActivityFeed.ts
    - /home/swarn/decibel-mobile/src/components/home/ActivityFeedCard.tsx
    - /home/swarn/decibel-mobile/app/(tabs)/index.tsx

key-decisions:
  - "TrendingArtistsRow placed in FlatList ListFooterComponent (below feed, not competing with it)"
  - "Collect button uses useDiscoverArtist mutation (existing endpoint /mobile/discover)"
  - "Leaderboard/Trophy button removed from Home top bar per plan spec (Phase 17)"
  - "isFallback exposed from useActivityFeed hook via data?.pages[0]?.is_fallback"

# Metrics
duration: 5min
completed: 2026-03-16
---

# Phase 16 Plan 02: Home Screen UI Summary

**Rebuilt Home screen with stats bar (Finds/Founders/Influence), social feed with Collect buttons, and trending artists row — transforming Home from simple feed into a social discovery hub.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-16T01:38:18Z
- **Completed:** 2026-03-16T01:43:19Z
- **Tasks:** 2 (+ 1 checkpoint auto-approved)
- **Files modified:** 7

## Accomplishments

- Created `useUserStats` hook querying `/mobile/user-stats` (2-min stale)
- Created `useTrendingArtists` hook querying `/mobile/trending-artists` (5-min stale)
- Created `StatsBar` component: 3-column card with Finds (pink), Founders (gold), Influence (purple) stats; skeleton dashes when loading
- Created `TrendingArtistsRow` component: horizontal scroll of 56px circular artist images, taps navigate to artist profile; null when empty
- Updated `useActivityFeed` to expose `isFallback` boolean from first page response
- Updated `ActivityFeedCard` with `onCollect`/`isCollected` props: pink Collect pill button or "In Passport" label at right edge of card
- Rebuilt `app/(tabs)/index.tsx`: StatsBar above feed, feed header switches "Trending on Decibel" (TrendingUp icon, pink) vs "Discovery Feed" (Compass icon, purple), TrendingArtistsRow in ListFooter, Leaderboard button removed, pull-to-refresh now refetches all three queries
- Deployed to EAS preview channel (iOS update ID: 019cf44f-c526-7cc2-9c84-bdd812dac4d2)

## Task Commits

1. **Task 1: Create hooks and build Stats Bar + Trending Artists components** - `1f1dec7` (feat)
2. **Task 2: Update ActivityFeedCard with Collect button + rebuild Home screen** - `e88f9a1` (feat)

## Files Created/Modified

- `/home/swarn/decibel-mobile/src/hooks/useUserStats.ts` - New hook: finds + founders + influence from /mobile/user-stats
- `/home/swarn/decibel-mobile/src/hooks/useTrendingArtists.ts` - New hook: trending artists array from /mobile/trending-artists
- `/home/swarn/decibel-mobile/src/components/home/StatsBar.tsx` - New component: 3-col stats bar with accent colors
- `/home/swarn/decibel-mobile/src/components/home/TrendingArtistsRow.tsx` - New component: horizontal artist circles with navigation
- `/home/swarn/decibel-mobile/src/hooks/useActivityFeed.ts` - Added is_fallback to type + isFallback return value
- `/home/swarn/decibel-mobile/src/components/home/ActivityFeedCard.tsx` - Added Collect button with onCollect/isCollected props
- `/home/swarn/decibel-mobile/app/(tabs)/index.tsx` - Full rebuild with stats bar, collect wiring, trending row

## Decisions Made

- TrendingArtistsRow placed in ListFooterComponent so it appears after feed content naturally, not competing
- Collect button uses existing `useDiscoverArtist` mutation (POST /mobile/discover endpoint) — no new endpoint needed
- Leaderboard/Trophy button removed from Home header per plan spec — it will move to Phase 17
- isFallback pattern: derived from `data?.pages[0]?.is_fallback ?? false` in hook layer, not in component

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

EAS update default `--platform all` fails due to web config without react-native-web installed. Pre-existing issue. Fixed by adding `--platform ios` flag. Documented for future deploys.

## Self-Check: PASSED

Files verified:
- /home/swarn/decibel-mobile/src/hooks/useUserStats.ts: exists
- /home/swarn/decibel-mobile/src/hooks/useTrendingArtists.ts: exists
- /home/swarn/decibel-mobile/src/components/home/StatsBar.tsx: exists
- /home/swarn/decibel-mobile/src/components/home/TrendingArtistsRow.tsx: exists

Commits verified:
- 1f1dec7: Task 1 commit exists
- e88f9a1: Task 2 commit exists

TypeScript: `npx tsc --noEmit` passed with zero errors after both tasks.
EAS: Deployed to preview channel, update group 6cbb7c7e-8647-43c1-ad52-9872defb5fa7.

---
*Phase: 16-home-screen-feed*
*Completed: 2026-03-16*
