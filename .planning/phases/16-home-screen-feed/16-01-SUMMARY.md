---
phase: 16-home-screen-feed
plan: 01
subsystem: api
tags: [supabase, next-js, activity-feed, social, trending]

# Dependency graph
requires: []
provides:
  - "GET /api/mobile/user-stats — finds, founders, influence score for authenticated fan"
  - "GET /api/mobile/trending-artists — top 10 most collected artists this week"
  - "Updated GET /api/mobile/activity-feed — followed-user filtering with platform-wide fallback and is_fallback flag"
affects: [16-home-screen-ui, 17-artist-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fan lookup from email via admin Supabase client (fans.email = auth email)"
    - "Influence score: two-query pattern (get founder performer IDs, then count others' collections)"
    - "Trending aggregation: fetch recent collections then group/count in JS (no RPC)"
    - "Feed filter: check fan_follows first, fall back to platform-wide if empty"

key-files:
  created:
    - /home/swarn/decibel/src/app/api/mobile/user-stats/route.ts
    - /home/swarn/decibel/src/app/api/mobile/trending-artists/route.ts
  modified:
    - /home/swarn/decibel/src/app/api/mobile/activity-feed/route.ts

key-decisions:
  - "Trending aggregation done in JS (not SQL GROUP BY) to avoid RPC/stored proc complexity"
  - "Influence score uses two separate queries: get founded performer IDs, then count others' collections on those performers"
  - "Activity feed fallback triggers on both 'user follows nobody' AND 'followed users have no activity'"

patterns-established:
  - "All new mobile endpoints look up fan by email from auth token before querying"
  - "is_fallback boolean pattern for social feeds to signal UI which label to show"

requirements-completed: [HOME-01, HOME-02, HOME-03, HOME-04, HOME-08]

# Metrics
duration: 8min
completed: 2026-03-16
---

# Phase 16 Plan 01: Home Screen Feed APIs Summary

**Three backend endpoints for the Home screen: user stats bar (finds/founders/influence), trending artists this week, and activity feed filtered by followed users with platform-wide fallback.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-16T01:35:08Z
- **Completed:** 2026-03-16T01:43:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created `GET /api/mobile/user-stats` returning finds count, founders count, and influence score
- Created `GET /api/mobile/trending-artists` returning top 10 artists by collection count in last 7 days
- Updated `GET /api/mobile/activity-feed` to filter by followed users, fall back to platform-wide, and include `is_fallback` boolean
- All three endpoints pass TypeScript checks with zero errors
- Pushed to GitHub (auto-deploys to Vercel)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create user-stats and trending-artists API endpoints** - `8ccf858` (feat)
2. **Task 2: Update activity-feed endpoint to filter by followed users with fallback** - `b13148f` (feat)

## Files Created/Modified
- `/home/swarn/decibel/src/app/api/mobile/user-stats/route.ts` - New endpoint: finds + founders + influence score
- `/home/swarn/decibel/src/app/api/mobile/trending-artists/route.ts` - New endpoint: top 10 artists this week by collection count
- `/home/swarn/decibel/src/app/api/mobile/activity-feed/route.ts` - Updated with followed-user filter, fallback logic, is_fallback field

## Decisions Made
- Trending aggregation done in JS grouping rather than SQL GROUP BY/RPC to avoid stored proc complexity and keep it readable
- Influence score uses two sequential queries (get founded performer IDs → count others' collections on those) rather than a subquery, per plan spec
- Activity feed fallback triggers on two conditions: user follows nobody, OR user follows people but they have no collections in the queried page

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three Home screen data endpoints are live on Vercel (auto-deployed via git push)
- Mobile app can now consume `/api/mobile/user-stats`, `/api/mobile/trending-artists`, and updated `/api/mobile/activity-feed` with `is_fallback` flag
- Ready for 16-02: Home screen UI implementation in decibel-mobile

---
*Phase: 16-home-screen-feed*
*Completed: 2026-03-16*
