---
phase: 14-bug-fixes-cleanup
plan: "03"
subsystem: ui
tags: [react-native, supabase, expo-blur, share-api, search]

requires:
  - phase: 14-bug-fixes-cleanup
    provides: artist profile screen and search infrastructure

provides:
  - Search result cards showing accurate Decibel fan count (from collections table, not stale performers.follower_count)
  - Working share modal that opens native iOS share sheet reliably
  - Listen links that filter invalid and Deezer URLs

affects: [14-bug-fixes-cleanup, search, artist-profile, share]

tech-stack:
  added: []
  patterns:
    - "Supabase join count pattern: .select('..., related_table(count)') → map countArr[0].count"
    - "Share.share() must be called AFTER all overlapping modals are dismissed on iOS (300ms delay)"

key-files:
  created: []
  modified:
    - src/hooks/useSearch.ts
    - src/components/search/SearchResultCard.tsx
    - app/artist/[slug].tsx
    - src/components/collection/SharePrompt.tsx

key-decisions:
  - "fan_count sourced from collections(count) join instead of performers.follower_count (which stores platform follower counts)"
  - "Share.share() triggered via setTimeout(300ms) after loading modal dismisses — prevents iOS modal conflict"
  - "BlurTargetView removed (non-standard expo-blur export that would crash at runtime), replaced with standard BlurView"
  - "Deezer URLs skipped silently in musicLinks memo per CLAUDE.md prohibition"

patterns-established:
  - "URL validation: always call isValidUrl() before rendering listen link buttons"
  - "Modal dismiss before share sheet: dismiss + onDone() first, then Share.share() in setTimeout"

requirements-completed: [BUG-02, BUG-03, BUG-04]

duration: 5min
completed: 2026-03-16
---

# Phase 14 Plan 03: Bug Fixes — Stats, Share, Listen Links Summary

**Search cards now show live Decibel fan count via collections join; share modal opens native sheet reliably; listen links filter invalid/Deezer URLs with error handling**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-16T05:32:09Z
- **Completed:** 2026-03-16T05:37:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Search result cards now show the same fan count as the artist profile page (both from collections table)
- Share modal no longer conflicts with iOS modal stack — share sheet opens reliably
- Removed `BlurTargetView` crash (non-standard expo-blur export)
- Listen links validate URLs before rendering, skip Deezer per project rules

## Task Commits

1. **Task 1: Fix stat count mismatch** - `9318f77` (fix)
2. **Task 2: Fix share modal and listen links** - `5e6b8f7` (fix)

## Files Created/Modified
- `src/hooks/useSearch.ts` - Changed `follower_count` to `fan_count`; query joins `collections(count)` and maps result
- `src/components/search/SearchResultCard.tsx` - Renders `fan_count` instead of `follower_count`
- `app/artist/[slug].tsx` - Added `isValidUrl()` guard, removed Deezer case, filters Deezer URLs from musicLinks
- `src/components/collection/SharePrompt.tsx` - Fixed modal conflict, removed non-standard BlurTargetView, triggers share after modal dismiss

## Decisions Made
- `fan_count` from `collections(count)` join is the correct source for Decibel fan counts; `performers.follower_count` stores platform follower counts (Spotify listeners etc.) — completely different numbers
- `Share.share()` cannot be called while another Modal is open on iOS — fixed by calling `onDone()` first, then share in 300ms setTimeout
- `BlurTargetView` is not a standard expo-blur export — replaced with standard `BlurView` wrapping a Modal

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] BlurTargetView non-standard import crash**
- **Found during:** Task 2 (Share modal fix)
- **Issue:** `SharePrompt.tsx` imported `BlurTargetView` from `expo-blur`, which is not a real export — this would crash at runtime
- **Fix:** Replaced with standard `BlurView` wrapping, removed `bgRef` ref
- **Files modified:** `src/components/collection/SharePrompt.tsx`
- **Verification:** TypeScript compiles clean, no import errors
- **Committed in:** `5e6b8f7` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential crash fix, no scope creep.

## Issues Encountered
- `https://decibel-three.vercel.app/api/social/collection-card` returns 404 — endpoint doesn't exist yet in the backend. Share modal now gracefully falls back to text-only share. Backend endpoint creation is out of scope for this plan.

## Next Phase Readiness
- BUG-02, BUG-03, BUG-04 all resolved
- Search counts are now accurate
- Share flow works end-to-end (text fallback when no card API)
- Artist profile listen links are safe and Deezer-free

---
*Phase: 14-bug-fixes-cleanup*
*Completed: 2026-03-16*
