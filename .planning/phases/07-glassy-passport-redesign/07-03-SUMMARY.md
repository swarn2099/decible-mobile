---
phase: 07-glassy-passport-redesign
plan: 03
subsystem: ui
tags: [react-native, pager-view, reanimated, expo-blur, passport, glassmorphism, tabs]

requires:
  - phase: 07-01
    provides: "usePassportCollectionsSplit hook, collection_type 3-way split, pager-view installed"
  - phase: 07-02
    provides: "OrbBackground, GlassGrid, StampGlassCard, FindGlassCard, DiscoveryGlassCard"

provides:
  - "PassportPager component: PagerView with 3 pages (Stamps/Finds/Discoveries) + frosted glass tab pill"
  - "passport.tsx rewritten: OrbBackground behind SafeAreaView, pinned PassportHeader, PassportPager with flex:1, BadgeGrid below"
  - "PassportHeader: onSharePress + isSharing props + Share Passport pill button with Share2 icon"
  - "No parent ScrollView — gesture conflict with PagerView eliminated (Pitfall 2 avoided)"
  - "activeTabIndex SharedValue wired through passport.tsx → PassportPager → OrbBackground for tab-reactive orbs"

affects: [passport-screen, collection-views, orb-background]

tech-stack:
  added: []
  patterns:
    - "PassportPager: tabOffset SharedValue updated via onPageScroll for smooth mid-swipe pill animation"
    - "Dual sync: onPageSelected updates both React state (re-renders) AND SharedValues (animation) per anti-pattern rule"
    - "Orb z-order: OrbBackground as sibling behind SafeAreaView (not inside) — full-screen orb coverage"
    - "Leaderboard trophy: useSafeAreaInsets().top + 12 for correct absolute position with new layout"

key-files:
  created:
    - "src/components/passport/PassportPager.tsx"
  modified:
    - "app/(tabs)/passport.tsx"
    - "src/components/passport/PassportHeader.tsx"

key-decisions:
  - "BadgeGrid rendered below pager with maxHeight:160 — keeps badges visible without consuming pager flex space"
  - "Share Passport button moved into PassportHeader (below stats, above tabs) — always visible regardless of active tab"
  - "OrbBackground sibling pattern: renders before SafeAreaView so orbs cover entire screen including header area"
  - "Tab pill width: TAB_WIDTH - 32/3 accounts for marginHorizontal:16 on the tab bar container"

patterns-established:
  - "PagerView tab screen pattern: View > OrbBackground + SafeAreaView (transparent) > pinned header + PassportPager(flex:1)"

requirements-completed: [GPASS-01, GPASS-02]

duration: 4min
completed: 2026-03-12
---

# Phase 7 Plan 03: Passport Screen Wiring — Pager + OrbBackground + Header Summary

**Glassmorphic passport screen assembled: OrbBackground behind SafeAreaView, pinned PassportHeader with Share button, PagerView 3-tab pager (Stamps/Finds/Discoveries) with frosted glass pill indicator, BadgeGrid below**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-12T18:45:33Z
- **Completed:** 2026-03-12T18:49:23Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- PassportPager: PagerView with 3 pages, BlurView frosted glass pill tab indicator, smooth mid-swipe animation via tabOffset SharedValue + onPageScroll, tab press via pagerRef.current?.setPage(), each page is a ScrollView containing GlassGrid
- passport.tsx: full rewrite — no parent ScrollView (avoids Pitfall 2 gesture conflict), OrbBackground rendered as sibling behind SafeAreaView for full-screen immersion, PassportPager wired with stamps/finds/discoveries from usePassportCollectionsSplit, activeTabIndex SharedValue flows through both OrbBackground and PassportPager
- PassportHeader: added onSharePress + isSharing props, Share Passport pill button with LinearGradient and Share2 icon rendered below stats row
- Leaderboard trophy uses useSafeAreaInsets for correct absolute positioning in new layout

## Task Commits

1. **Task 1: PassportPager with frosted glass tab indicator** - `bdfa058` (feat)
2. **Task 2: Rewrite passport.tsx + PassportHeader share button** - `02ab28e` (feat)

## Files Created/Modified

- `src/components/passport/PassportPager.tsx` — PagerView wrapper with frosted glass tab bar, smooth pill animation
- `app/(tabs)/passport.tsx` — Rewritten: OrbBackground + pinned header + PassportPager + BadgeGrid + trophy overlay
- `src/components/passport/PassportHeader.tsx` — Added Share Passport button with onSharePress/isSharing props

## Decisions Made

- BadgeGrid rendered with `maxHeight: 160` constraint below the pager — visible without eating into pager flex space
- OrbBackground as sibling before SafeAreaView so it fills the entire screen including header area (follows Pitfall 6 recommendation from research)
- Tab pill translateX calculation: `tabOffset.value * TAB_WIDTH` — direct multiplication gives smooth 0→1→2 tracking

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 7 Plan 03 is the final wiring plan for the glassmorphic passport
- The 3 View More routes (/collection/stamps, /collection/finds, /collection/discoveries) are referenced by handleViewMore — Phase 7 Plan 04 or later will create those screens
- Both iOS and Android exports verified clean

## Self-Check: PASSED

- src/components/passport/PassportPager.tsx — FOUND
- app/(tabs)/passport.tsx — FOUND
- src/components/passport/PassportHeader.tsx — FOUND
- .planning/phases/07-glassy-passport-redesign/07-03-SUMMARY.md — FOUND
- Commit bdfa058 — FOUND
- Commit 02ab28e — FOUND
