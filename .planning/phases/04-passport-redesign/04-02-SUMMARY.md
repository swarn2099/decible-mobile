---
phase: 04-passport-redesign
plan: 02
subsystem: ui
tags: [react-native, react-native-svg, expo, passport, stamps, texture, animation]

# Dependency graph
requires:
  - phase: 04-passport-redesign-01
    provides: CollectionStamp type with rotation field, passport.tsx with FindsGrid, collection/_layout.tsx

provides:
  - PassportStamp SVG component — circular rubber stamp with dashed border, pink ink, venue/date/artist text
  - StampsSection component — scattered stamps on textured ImageBackground (leather dark / cream paper light)
  - app/collection/stamps.tsx — View All Stamps chronological list with stamp thumbnails
  - passport.tsx Stamps section fully rewired to use StampsSection (old CollectionStamp list removed)
  - Texture assets: paper-grain-light.png and leather-dark.png

affects: [05-share-virality, polish-phase]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "react-native-svg for circular SVG stamps with dashed borders and text elements"
    - "ImageBackground with resizeMode=repeat for edge-to-edge texture tiling"
    - "Theme-conditional require() for dark/light texture assets"
    - "Deterministic scatter offsets by array index for organic stamp layout"

key-files:
  created:
    - assets/textures/paper-grain-light.png
    - assets/textures/leather-dark.png
    - src/components/passport/PassportStamp.tsx
    - src/components/passport/StampsSection.tsx
    - app/collection/stamps.tsx
  modified:
    - app/(tabs)/passport.tsx

key-decisions:
  - "Solid color PNGs used as texture base — visual differentiation comes from stamp glow/ink effects not texture fidelity"
  - "SvgText straight (not on path) for venue name — more reliable cross-platform than SVG textPath arcs"
  - "View All link rendered outside ImageBackground for clean visual separation from textured zone"
  - "StampsSection handles its own navigation to /collection/stamps — passport.tsx no longer needs handleStampPress"

patterns-established:
  - "PassportStamp(size) prop allows reuse at different scales (110px preview, 56px list thumbnail)"
  - "Glow applied as View shadow (not SVG filter) for iOS compatibility with shadowColor/shadowRadius"

requirements-completed: [PASS-04, PASS-05, PASS-06, PASS-07, PASS-08]

# Metrics
duration: 20min
completed: 2026-03-11
---

# Phase 4 Plan 2: Passport Stamps Redesign Summary

**Analog passport section with circular SVG rubber stamps scattered on textured leather/paper backgrounds, dark mode glow, and chronological View All list**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-11T03:05:00Z
- **Completed:** 2026-03-11T03:10:29Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Built PassportStamp: circular react-native-svg component with dashed outer circle, subtle inner ring, venue name (top), monospace date (center), artist name (bottom) — all in #FF4D6A ink
- Built StampsSection: stamps scattered on textured ImageBackground with deterministic scatter offsets; dark mode shows dark leather + pink shadow glow, light mode shows cream paper without glow
- Built app/collection/stamps.tsx: clean FlatList with StampRow (56px stamp thumbnail + venue/date/artist text), back nav, routes to artist profiles
- Rewired passport.tsx: old CollectionStamp list + manual View All button replaced with single `<StampsSection>` call; CollectionStamp import, handleStampPress callback, ChevronRight removed

## Task Commits

1. **Task 1: Texture assets, PassportStamp, StampsSection** - `d42e93f` (feat)
2. **Task 2: View All Stamps screen, passport.tsx rewire** - `ff84466` (feat)

## Files Created/Modified
- `assets/textures/paper-grain-light.png` — Cream solid tile for light mode ImageBackground repeat
- `assets/textures/leather-dark.png` — Dark solid tile for dark mode ImageBackground repeat
- `src/components/passport/PassportStamp.tsx` — SVG circular stamp, reusable at any `size`, pink ink, dark glow
- `src/components/passport/StampsSection.tsx` — Scattered stamps on texture, View All link
- `app/collection/stamps.tsx` — Chronological list screen with StampRow component
- `app/(tabs)/passport.tsx` — Stamps section replaced with `<StampsSection stamps={visibleStamps} totalCount={stamps.length} />`

## Decisions Made
- Solid color PNG textures (cream #F5F0E8 / dark #1A1A24) as minimal base tiles — the stamps, glow, and opacity layering provide the visual richness, not the texture file itself
- SvgText with straight positioning chosen over SVG textPath arc for venue name — more reliable across iOS/Android without font path measurement edge cases
- Shadow glow applied on wrapping View (not SVG filter) — iOS renders `shadow*` props on RN Views natively; SVG filters have limited cross-platform support

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
- `node-canvas` not available on VM for programmatic PNG generation; used Node.js built-in `zlib.deflateSync` + hand-built PNG chunk structure to create minimal valid PNG files programmatically.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Stamps section complete with analog aesthetic, circular SVG stamps, textured backgrounds, rotation transforms
- PassportStamp component available for reuse at any size (already used at 110px preview and 56px list thumbnail)
- Phase 4 plans (01 Finds + 02 Stamps) both complete — Passport tab fully redesigned per PRD v5
- Ready for Phase 5: Share & Virality (founder share cards, passport share cards)

---
*Phase: 04-passport-redesign*
*Completed: 2026-03-11*
