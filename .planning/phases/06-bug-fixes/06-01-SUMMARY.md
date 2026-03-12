---
phase: 06-bug-fixes
plan: 01
subsystem: ui
tags: [react-native, expo, tanstack-query, supabase, eas-update]

# Dependency graph
requires: []
provides:
  - Fixed useDiscover mutation using apiCall with Bearer token auth to /mobile/discover
  - apple_music_url field on ArtistProfile type and musicLinks array
  - SharePrompt finally block ensures setLoading(false) + onDone() always run
  - Leaderboard screen at /leaderboard with fan/performer tabs and period filters
  - Trophy button on passport screen navigating to leaderboard
affects: [07-glassmorphic-passport, 08-jukebox, 09-show-check-in]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "apiCall wrapper for authenticated mobile API calls — use instead of raw fetch"
    - "finally block pattern for share flows — loading state always cleared regardless of success/failure"

key-files:
  created:
    - app/leaderboard.tsx
  modified:
    - src/hooks/useCollection.ts
    - src/hooks/useArtistProfile.ts
    - app/artist/[slug].tsx
    - src/components/collection/SharePrompt.tsx
    - app/(tabs)/passport.tsx

key-decisions:
  - "useDiscover uses apiCall (Bearer token) not raw fetch to /api/discover — consistent with all other mobile API calls"
  - "SharePrompt finally block pattern: try { fetch card + share } catch { fallback share } finally { cleanup } — prevents modal hang"
  - "Leaderboard Trophy icon positioned absolutely at top-right of passport screen (zIndex 10) to avoid modifying PassportHeader component"

patterns-established:
  - "Pattern 1: All mobile API mutations use apiCall from @/lib/api — never raw fetch with manual auth"
  - "Pattern 2: Async UI flows (share, generate card) use finally block to guarantee loading state cleanup"

requirements-completed: [BUG-01, BUG-02, BUG-03, BUG-04]

# Metrics
duration: 25min
completed: 2026-03-12
---

# Phase 6 Plan 01: Bug Fixes — Core Flows Summary

**Four core flow fixes: Discover now uses apiCall with Bearer auth, Apple Music added to listen links, SharePrompt always clears loading via finally block, and a full Leaderboard screen with fan/performer tabs deployed.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-12T17:10:00Z
- **Completed:** 2026-03-12T17:36:14Z
- **Tasks:** 2
- **Files modified:** 6 (5 modified, 1 created)

## Accomplishments
- BUG-01: `useDiscover` now calls `/mobile/discover` via `apiCall` with Bearer token; 409 (already discovered) handled gracefully without error toast
- BUG-02: `apple_music_url` added to `ArtistProfile` type and included in `musicLinks` array with Music2/pink icon
- BUG-03: `SharePrompt` restructured with `finally` block — `setLoading(false)` and `onDone()` always run, modal never hangs; Bearer token added to collection-card fetch
- BUG-04: Full `app/leaderboard.tsx` created with Fans/Performers tabs, Weekly/Monthly/All Time period filters, current user row highlighting, error/empty states, and skeleton loading; Trophy button added to passport screen
- Deployed to EAS preview channel (update group ac62426d)

## Task Commits

1. **Task 1: Fix Discover, Listen links, Share modal** - `aa313c5` (fix)
2. **Task 2: Create Leaderboard screen + passport nav entry** - `facd0c2` (feat)

## Files Created/Modified
- `src/hooks/useCollection.ts` — `useDiscover` replaced with `apiCall('/mobile/discover')`, 409 handled as soft success
- `src/hooks/useArtistProfile.ts` — Added `apple_music_url: string | null` to `ArtistProfile` type
- `app/artist/[slug].tsx` — Added `apple_music_url` to `allUrls` array in `musicLinks` useMemo; added Apple Music icon case
- `src/components/collection/SharePrompt.tsx` — Restructured with `finally` block; added `supabase` import + Bearer auth header
- `app/leaderboard.tsx` — New screen: Fans/Performers tabs, Weekly/Monthly/All Time filters, FlatList with current-user highlight, error/empty/loading states
- `app/(tabs)/passport.tsx` — Added `Pressable` + `Trophy` icon imports; Trophy button positioned absolutely at top-right, navigates to `/leaderboard`

## Decisions Made
- `useDiscover` uses `apiCall` (Bearer token) not raw fetch — consistent with all other mobile API calls across the codebase
- `SharePrompt` `finally` block pattern chosen over duplicating cleanup in each branch — prevents future regressions if new branches added
- Trophy leaderboard button positioned as absolute overlay on passport screen rather than modifying `PassportHeader` component — lower surface area change

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- EAS update `--platform all` fails due to missing `react-native-web` dependency — switched to `--platform ios` only, consistent with prior deploys.

## Next Phase Readiness
- All four blocking bugs resolved — core Discover, Listen, Share, and Leaderboard flows are stable
- Ready for Phase 7: Glassmorphic Passport redesign
- No blockers

---
*Phase: 06-bug-fixes*
*Completed: 2026-03-12*
