---
phase: 04-passport-redesign
plan: 01
subsystem: ui
tags: [react-native, expo, passport, finds, gallery, card-grid]

# Dependency graph
requires:
  - phase: 03-check-in
    provides: collection data shape with verified/unverified split, CollectionStamp type
provides:
  - FindCard component with hero photo, badge glow, fan count, Listen button
  - FindsGrid 2x3 preview grid with View All link
  - View All Finds screen at /collection/finds with full 2-column FlatList
  - Passport API extended with platform_url and fan_count on each collection entry
  - /collection route migrated from single file to directory (supports future /collection/stamps)
affects: [04-02-stamps-redesign, 05-share-virality]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "FindCard uses flexWrap grid (not FlatList) inside ScrollView to avoid nested VirtualizedList"
    - "platform_url coalesced server-side from spotify_url / soundcloud_url / apple_music_url"
    - "fanCountMap built per-page on backend for efficient O(N) fan count lookup"

key-files:
  created:
    - src/components/passport/FindCard.tsx
    - src/components/passport/FindsGrid.tsx
    - app/collection/_layout.tsx
    - app/collection/finds.tsx
  modified:
    - app/(tabs)/passport.tsx
    - src/types/passport.ts
    - ~/decibel/src/app/api/mobile/passport/route.ts

key-decisions:
  - "FindsGrid uses flexWrap View (not FlatList) inside Animated.ScrollView to prevent nested VirtualizedList console warnings"
  - "platform_url coalesced server-side — mobile receives single field, not three separate URL fields"
  - "fan_count uses total collection entries (not distinct fans) per plan spec — sufficient for v1 display"

patterns-established:
  - "Card grid in scrollable screen: flexDirection row + flexWrap wrap at 2-col width from useWindowDimensions"
  - "Border glow: borderColor + shadowColor same value, shadowOpacity 0.5-0.6, shadowRadius 6-8"

requirements-completed: [PASS-01, PASS-02, PASS-03]

# Metrics
duration: 25min
completed: 2026-03-11
---

# Phase 4 Plan 01: Finds Grid Redesign Summary

**Gallery-style 2x3 Finds grid with hero photos, gold/purple badge border glows, fan counts, and Listen buttons — replacing old CollectionStamp list rows**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-11T03:00:00Z
- **Completed:** 2026-03-11T03:25:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Passport API now returns `platform_url` (coalesced from spotify/soundcloud/apple_music) and `fan_count` on each collection entry — backend deployed to Vercel
- FindCard component renders hero photo (60% height), artist name, fan count, and Listen button with gold (Founded) or purple (Discovered) border glow
- FindsGrid renders 2x3 preview grid inside passport.tsx Finds section using flexWrap to avoid nested VirtualizedList warning
- /collection route migrated from single file to directory structure; View All Finds screen at /collection/finds shows full 2-column FlatList
- Build passes clean: `npx expo export --platform ios` zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Update passport API + types for platform_url and fan_count** - `b72e066` (backend) / `c847724` (mobile types) (feat)
2. **Task 2: Build FindCard, FindsGrid, route migration, View All Finds, rewire passport.tsx** - `7d01550` (feat)

## Files Created/Modified
- `~/decibel/src/app/api/mobile/passport/route.ts` - Added platform URL fields to performers query, fanCountMap, platform_url + fan_count on each stamp
- `src/types/passport.ts` - Added platform_url to performer object, fan_count to PassportTimelineEntry
- `src/components/passport/FindCard.tsx` - NEW: individual find card with hero photo, badge glow, Listen button
- `src/components/passport/FindsGrid.tsx` - NEW: 2x3 preview grid with View All link
- `app/collection/_layout.tsx` - NEW: Stack layout for collection directory
- `app/collection/finds.tsx` - NEW: View All Finds screen with 2-column FlatList (migrated + extended from old collection.tsx)
- `app/(tabs)/passport.tsx` - Replaced list-row finds rendering with FindsGrid component

## Decisions Made
- FindsGrid uses `flexDirection: 'row', flexWrap: 'wrap'` View instead of FlatList — avoids nested VirtualizedList warning inside passport.tsx Animated.ScrollView
- platform_url coalesced server-side (spotify_url ?? soundcloud_url ?? apple_music_url) — cleaner mobile interface, consistent with "don't show Listen unless URL exists" rule
- fan_count counts total collection entries per performer (not distinct fans) — simple, correct for v1 display

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors in MMKV-related files (storage.ts, queryClient.ts, locationStore.ts etc.) — these are out-of-scope, not caused by this plan's changes. Build (expo export) passes clean.

## Self-Check: PASSED

All created files exist. All commits verified in git log.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Finds section fully redesigned. Stamps section (analog passport aesthetic) is Plan 02.
- /collection directory structure in place — /collection/stamps route ready to be added in Plan 02.
- platform_url and fan_count now available on all CollectionStamp objects throughout the app.

---
*Phase: 04-passport-redesign*
*Completed: 2026-03-11*
