---
phase: 07-glassy-passport-redesign
plan: 02
subsystem: ui
tags: [react-native, reanimated, expo-blur, expo-linear-gradient, expo-haptics, expo-image, lucide, passport, glass-cards]

requires:
  - phase: 07-01
    provides: "collection_type 3-way split, CollectionStamp type, usePassportCollectionsSplit hook, pager-view installed"

provides:
  - "OrbBackground component: 3 animated gradient orbs (pink/purple/blue) with tab-reactive opacity via Reanimated interpolate"
  - "StampGlassCard: full-bleed photo + pink-tinted BlurView glass strip (venue, date, founder star)"
  - "FindGlassCard: full-bleed photo + purple-tinted BlurView glass strip (platform dot, fan count, gold star always)"
  - "DiscoveryGlassCard: full-bleed photo + blue-tinted BlurView glass strip (compass icon, tappable @finder)"
  - "GlassGrid: 2-column flexWrap layout, max 8 items, no empty placeholders, View More button, empty state CTAs"

affects: [07-03, passport-screen, collection-views]

tech-stack:
  added: []
  patterns:
    - "Glass card pattern: Animated.View outer (rotation + scale) + Pressable inner (overflow:hidden) — outer rotation prevents Android clipping bug"
    - "Press-in animation: withSpring(0.97, {damping:15, stiffness:300}) on pressIn, withSpring(1.0, {damping:12, stiffness:200}) on pressOut"
    - "Deterministic rotation: (hashCode(id) % 5) - 2 degrees — reproducible per collection entry"
    - "OrbBackground: sibling rendering (not inside SafeAreaView), pointerEvents none, linear gradient radial falloff for perceived blur"

key-files:
  created:
    - "src/components/passport/OrbBackground.tsx"
    - "src/components/passport/GlassCard/StampGlassCard.tsx"
    - "src/components/passport/GlassCard/FindGlassCard.tsx"
    - "src/components/passport/GlassCard/DiscoveryGlassCard.tsx"
    - "src/components/passport/GlassGrid.tsx"

key-decisions:
  - "Rotation applied on outer Animated.View, overflow:hidden on inner Pressable — Android can't clip rotated views with overflow:hidden on the same element"
  - "LinearGradient radial falloff (color to transparent) instead of BlurView on orbs — no BlurView overhead on background orbs, perceived blur from low opacity + large size"
  - "GlassGrid max 8 items (2x4) with no empty placeholder slots — clean layout at any item count"
  - "DiscoveryGlassCard glass strip uses 0.25 tint opacity vs 0.3 for Stamp/Find — subtly more transparent to match discovery aesthetic"

patterns-established:
  - "GlassCard Android pattern: always split rotation onto outer Animated.View, keep overflow:hidden only on inner Pressable"
  - "Empty state CTAs: each collection type routes to appropriate tab (stamp/find → add tab, discovery → home tab)"

requirements-completed: [GPASS-03, GPASS-04, GPASS-05, GPASS-06, GPASS-07, GPASS-08, GPASS-11, GPASS-12, GPASS-13]

duration: 3min
completed: 2026-03-12
---

# Phase 7 Plan 02: Visual Building Blocks — Glass Cards + Orb Background Summary

**5 new passport components: animated gradient OrbBackground with tab-reactive opacity + 3 GlassCard variants (Stamp/Find/Discovery) with BlurView frosted glass strips + GlassGrid with 2-column layout and empty state CTAs**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-12T18:39:50Z
- **Completed:** 2026-03-12T18:43:00Z
- **Tasks:** 2
- **Files modified:** 5 (all new)

## Accomplishments

- OrbBackground: pink/purple/blue gradient orbs drift autonomously (independent X/Y timing), opacity interpolated from activeTabIndex SharedValue — Stamps tab emphasizes pink, Finds emphasizes purple, Discoveries emphasizes blue
- 3 GlassCard variants with full-bleed expo-image photos + BlurView frosted glass strips: StampGlassCard (pink tint, venue+date+founder star), FindGlassCard (purple tint, platform color dot+label+fan count, gold star always shown), DiscoveryGlassCard (blue tint 0.25 opacity, compass icon, tappable @finder → user profile)
- All cards: deterministic rotation from ID hash, press-in spring animation (0.97 scale), light haptic on tap, gradient fallback for missing photos
- GlassGrid: 2-column flexWrap, max 8 items, no empty placeholders, type-colored View More button, per-type empty state CTAs routing to correct tabs

## Task Commits

1. **Task 1: OrbBackground with tab-reactive animated gradient orbs** - `461d45a` (feat)
2. **Task 2: 3 GlassCard variants + GlassGrid layout** - `7a3a3e3` (feat)

## Files Created/Modified

- `src/components/passport/OrbBackground.tsx` — 3 drifting gradient orbs, tab-reactive opacity via Reanimated interpolate
- `src/components/passport/GlassCard/StampGlassCard.tsx` — Pink glass strip: artist name, venue, date, founder star
- `src/components/passport/GlassCard/FindGlassCard.tsx` — Purple glass strip: platform dot+label, fan count, gold star
- `src/components/passport/GlassCard/DiscoveryGlassCard.tsx` — Blue glass strip: compass icon, tappable @finder attribution
- `src/components/passport/GlassGrid.tsx` — 2-column grid, 8-item max, empty states, View More button

## Decisions Made

- Outer Animated.View holds rotation transform; inner Pressable holds overflow:hidden — fixes Android clipping bug where rotating a view with overflow:hidden clips the content incorrectly
- LinearGradient (color → transparent) for orbs instead of BlurView — no rendering overhead, perceived blur achieved through large size + low opacity + radial gradient falloff
- DiscoveryGlassCard strip at 0.25 opacity (vs 0.3 for Stamp/Find) — discovery is a lighter relationship, subtler tint matches that aesthetic

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 5 visual building blocks are ready for composition in Plan 03
- GlassGrid accepts CollectionStamp[] + type prop — ready to wire into passport screen pager tabs
- OrbBackground accepts activeTabIndex SharedValue — ready to mount behind passport screen content
- Both iOS and Android exports verified clean

## Self-Check: PASSED

All 5 component files confirmed present. Commits 461d45a and 7a3a3e3 verified in git log.

---
*Phase: 07-glassy-passport-redesign*
*Completed: 2026-03-12*
