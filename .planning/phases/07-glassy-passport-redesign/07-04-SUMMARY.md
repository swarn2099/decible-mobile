---
phase: 07-glassy-passport-redesign
plan: "04"
subsystem: ui, api
tags: [react-native, expo, supabase, infinite-scroll, flatlist, glasscard, passport]

requires:
  - phase: 07-01
    provides: passport API extended with collection_type 3-way split and paginated queries
  - phase: 07-02
    provides: StampGlassCard, FindGlassCard, DiscoveryGlassCard components

provides:
  - GET /api/mobile/passport-collections?type=stamp|find|discovery — dedicated paginated endpoint
  - app/collection/stamps.tsx — rewritten with FlatList of StampGlassCards + search + infinite scroll
  - app/collection/finds.tsx — rewritten with FlatList of FindGlassCards + search + infinite scroll
  - app/collection/discoveries.tsx — new route for Discoveries View More page
  - GlassCard simplified prop — LinearGradient fallback for FlatList performance (no BlurView in scrolling lists)

affects: [passport-screen, user-profile, glassy-passport-redesign-final]

tech-stack:
  added: []
  patterns:
    - "useInfiniteQuery pattern for paginated collection View More pages (initialPageParam: 0, getNextPageParam via hasMore flag)"
    - "GlassCard simplified prop: production cards use BlurView, FlatList cards use LinearGradient fallback"
    - "passport-collections endpoint: type-filtered paginated API, separate from main passport route"

key-files:
  created:
    - app/collection/discoveries.tsx
    - ~/decibel/src/app/api/mobile/passport-collections/route.ts
  modified:
    - app/collection/stamps.tsx
    - app/collection/finds.tsx
    - src/components/passport/GlassCard/StampGlassCard.tsx
    - src/components/passport/GlassCard/FindGlassCard.tsx
    - src/components/passport/GlassCard/DiscoveryGlassCard.tsx

key-decisions:
  - "GlassCard simplified prop: keeps BlurView for the passport grid (few cards) but LinearGradient for View More FlatLists (20+ cards) — same component, different render path"
  - "Disable infinite scroll during search: search is client-side filter on already-loaded pages, onEndReached skipped when search.trim() is non-empty"
  - "Discovery cards via field: shows the founder of the artist (from founder_badges join) not the user themselves — who originally brought this artist to Decibel"
  - "passport-collections endpoint is separate from /passport route: avoids adding type-filter complexity to the already-heavy passport route which computes stats/badges"

requirements-completed: [GPASS-09, GPASS-10]

duration: 15min
completed: 2026-03-12
---

# Phase 07 Plan 04: View More Pages Summary

**Dedicated paginated View More screens for Stamps, Finds, and Discoveries with glass card grids, client-side search, infinite scroll, and a new `/api/mobile/passport-collections` endpoint that filters by collection_type.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-12T19:00:00Z
- **Completed:** 2026-03-12T19:15:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- New `GET /api/mobile/passport-collections?type=stamp|find|discovery&page=0` endpoint — paginated 20 items/page, newest-to-oldest, supports `fan_id` param for other user views
- Rewrote `stamps.tsx` and `finds.tsx` — now use `useInfiniteQuery` hitting the new endpoint, render GlassCard variants in 2-column FlatList with search + infinite scroll
- Created `discoveries.tsx` as a new collection route with the same pattern
- Added `simplified` prop to all 3 GlassCard variants — swaps BlurView for LinearGradient in FlatList contexts to prevent Android perf issues with 20+ BlurViews
- Both iOS and Android bundles export clean; EAS deployed to preview channel

## Task Commits

1. **Task 1: GET /api/mobile/passport-collections endpoint** - `2f18b96` (feat — decibel backend repo)
2. **Task 2: Rewrite View More pages + GlassCard simplified prop** - `084be58` (feat)

## Files Created/Modified

- `~/decibel/src/app/api/mobile/passport-collections/route.ts` — New endpoint, type-filtered paginated collections with founder join for discovery cards
- `app/collection/stamps.tsx` — Rewritten: useInfiniteQuery + StampGlassCard simplified + search bar
- `app/collection/finds.tsx` — Rewritten: useInfiniteQuery + FindGlassCard simplified + search bar
- `app/collection/discoveries.tsx` — New route: useInfiniteQuery + DiscoveryGlassCard simplified + search bar
- `src/components/passport/GlassCard/StampGlassCard.tsx` — Added simplified prop (LinearGradient fallback)
- `src/components/passport/GlassCard/FindGlassCard.tsx` — Added simplified prop
- `src/components/passport/GlassCard/DiscoveryGlassCard.tsx` — Added simplified prop

## Decisions Made

- `simplified` prop pattern: keeps the same GlassCard component for both contexts (passport grid = full BlurView, View More FlatList = LinearGradient). No separate component needed.
- Infinite scroll disabled during active search: when user has typed in the search box, `onEndReached` is skipped. Search filters already-loaded pages client-side. This prevents unnecessary API calls while typing.
- `passport-collections` is a separate endpoint from `/passport` — avoids making the already-complex passport route even heavier with type-filter-only use cases.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. Endpoint auto-deployed via GitHub push to Vercel.

## Next Phase Readiness

- All 3 View More routes functional with glass cards, search, and infinite scroll
- GlassCard simplified prop available for any future FlatList usage
- Ready for Phase 07-05 (passport pager tabs, GlassGrid integration) or Phase 07 final assembly

---
*Phase: 07-glassy-passport-redesign*
*Completed: 2026-03-12*

## Self-Check: PASSED

- app/collection/stamps.tsx — FOUND
- app/collection/finds.tsx — FOUND
- app/collection/discoveries.tsx — FOUND
- ~/decibel/src/app/api/mobile/passport-collections/route.ts — FOUND
- .planning/phases/07-glassy-passport-redesign/07-04-SUMMARY.md — FOUND
- Mobile commit 084be58 — FOUND
- Backend commit 2f18b96 — deployed to Vercel via git push
