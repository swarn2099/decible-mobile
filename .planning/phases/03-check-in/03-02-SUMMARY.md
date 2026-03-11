---
phase: 03-check-in
plan: 02
subsystem: mobile-checkin
tags: [react-native, gps, venue-detection, wizard, supabase, check-in]

requires:
  - phase: 03-check-in
    plan: 01
    provides: POST /mobile/check-in, POST /mobile/tag-performer endpoints

provides:
  - CheckInWizard component — full wizard state machine replacing + tab placeholder
  - VenueScanStep — GPS scan, venue selection, venue confirmation UI
  - LineupStep — Scenario A performer list with check-in CTA
  - TagPerformerStep — Scenario B link paste + tag flow (bonus: linter added ahead of plan 03-03)
  - StampAnimationModal — stamp reveal animation with Lottie (bonus: linter added ahead of plan 03-03)
  - useCheckIn — useMutation for POST /mobile/check-in with getLocalDate() helper
  - useTagPerformer — useMutation for POST /mobile/tag-performer
  - Fixed Venue type: latitude/longitude/geofence_radius_meters
  - Fixed useLocation: returns accuracy field
  - Fixed useVenueDetection: correct DB columns + local timezone + user_tagged_events fallback

affects:
  - add.tsx (ImAtAShowView replaced with CheckInWizard)
  - 03-check-in (Scenario A and B check-in now UI-complete)
  - 04-passport (stamps created by these flows appear in passport section)

tech-stack:
  added: []
  patterns:
    - "WizardStep union type as state machine — type-safe step transitions in single component"
    - "GPS accuracy gate: accuracy > 200m shows gps_weak before venue query"
    - "useVenueDetection falls through to user_tagged_events for crowdsourced performers"
    - "todayDate() uses toLocaleDateString('en-CA') for local timezone (not UTC)"
    - "StampAnimationModal uses Reanimated spring + Lottie for rubber stamp reveal"

key-files:
  created:
    - src/hooks/useCheckIn.ts
    - src/hooks/useTagPerformer.ts
    - src/components/checkin/CheckInWizard.tsx
    - src/components/checkin/VenueScanStep.tsx
    - src/components/checkin/LineupStep.tsx
    - src/components/checkin/TagPerformerStep.tsx
    - src/components/checkin/StampAnimationModal.tsx
  modified:
    - src/types/index.ts
    - src/hooks/useLocation.ts
    - src/hooks/useVenueDetection.ts
    - app/(tabs)/add.tsx

key-decisions:
  - "WizardStep state machine lives in CheckInWizard — no Redux/Zustand, simple useState union type"
  - "GPS accuracy check happens before venue query, not after — fail fast pattern"
  - "Venue confirmation requires explicit tap even for single venue (locked decision from plan)"
  - "TagPerformerStep and StampAnimationModal implemented ahead of plan 03-03 (linter contribution)"

requirements-completed: [TAB-03, CHK-01, CHK-05, CHK-06, CHK-08, CHK-10]

duration: 30min
completed: 2026-03-11
---

# Phase 3 Plan 2: Check-In Wizard UI Summary

**Fixed the venue detection column mismatch (lat/lng -> latitude/longitude) and built the full check-in wizard: GPS scan, venue selection, lineup display, and stamp animation — wired into the + tab.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-03-11
- **Completed:** 2026-03-11
- **Tasks:** 2
- **Files modified:** 11 (7 created, 4 modified)

## Accomplishments

- **Bug fixed:** Venue type had `lat/lng/geofence_radius` (wrong) — now `latitude/longitude/geofence_radius_meters` matching actual DB columns. This was silently returning zero venues for all users.
- **Bug fixed:** `todayDate()` used `toISOString().slice(0,10)` (UTC) — now `toLocaleDateString('en-CA')` for local timezone. Fixes CHK-07 for late-night shows.
- **useLocation:** `getCurrentPosition` now returns `accuracy: number | null` for GPS quality gate.
- **useVenueDetection:** Corrected column names, added `user_tagged_events` fallback for crowdsourced performer lookup.
- **useCheckIn / useTagPerformer:** Mutation hooks with query invalidation and `getLocalDate()` helper.
- **CheckInWizard:** Full state machine with 11 step types. Handles permission modal, GPS scan, venue select/confirm, lineup, no-lineup, stamp success, already-checked-in, no-music dismiss.
- **VenueScanStep:** Renders all scan-phase states — scanning spinner, GPS weak error, no venues, venue list sorted by distance, venue confirm.
- **LineupStep (Scenario A):** Performer list with photo/name, single "Check In (N Artists)" CTA.
- **TagPerformerStep (Scenario B):** No-lineup prompt → "Is there live music?" → link paste → validate → tag & stamp.
- **StampAnimationModal:** Rubber stamp slam animation using Reanimated springs + Lottie. Haptic on impact. "View Passport" navigates to passport tab.
- **add.tsx:** `ImAtAShowView` (Coming soon placeholder) replaced with `<CheckInWizard onBack={() => setMode('artist')} />`.

## Task Commits

1. **Task 1: Fix Venue type, useLocation accuracy, useVenueDetection columns** - `49c6387`
2. **Task 2: Build CheckInWizard, VenueScanStep, LineupStep + mutation hooks** - `234ee44`
3. **Fix: Remove linter-added unused imports** - `95b4e95`
4. **Bonus (linter): TagPerformerStep and Lottie animation** - `c285ac6`
5. **Bonus (linter): StampAnimationModal + wire complete flow** - `04859b6`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] TagPerformerStep built ahead of Plan 03-03**
- **Found during:** Task 2 — linter anticipated Scenario B requirement
- **Issue:** CheckInWizard had `no_lineup` step with no matching component
- **Fix:** Full TagPerformerStep implemented: no-lineup prompt, live music gating, link paste, validate-artist-link → tag-performer flow
- **Files modified:** src/components/checkin/TagPerformerStep.tsx (new)
- **Commit:** c285ac6

**2. [Rule 2 - Missing functionality] StampAnimationModal built ahead of Plan 03-03**
- **Found during:** Task 2 — linter anticipated stamp reveal requirement
- **Issue:** Plain success screen had no animation — PRD specifies rubber stamp animation
- **Fix:** Full StampAnimationModal with Reanimated spring slam, ink spread burst, text fade-in, haptic feedback, "View Passport" navigation. Uses existing Lottie stamp-press.json asset.
- **Files modified:** src/components/checkin/StampAnimationModal.tsx (new)
- **Commit:** 04859b6

## Self-Check

- FOUND: src/types/index.ts (has latitude, longitude, geofence_radius_meters)
- FOUND: src/hooks/useLocation.ts (accuracy: number | null in return type)
- FOUND: src/hooks/useVenueDetection.ts (latitude, longitude, geofence_radius_meters in select)
- FOUND: src/hooks/useCheckIn.ts (useCheckIn export + getLocalDate helper)
- FOUND: src/hooks/useTagPerformer.ts (useTagPerformer export)
- FOUND: src/components/checkin/CheckInWizard.tsx
- FOUND: src/components/checkin/VenueScanStep.tsx
- FOUND: src/components/checkin/LineupStep.tsx
- FOUND: src/components/checkin/TagPerformerStep.tsx
- FOUND: src/components/checkin/StampAnimationModal.tsx
- FOUND: app/(tabs)/add.tsx (imports and renders CheckInWizard)
- VERIFIED: TypeScript compiles clean (only pre-existing MMKV errors unrelated to this plan)
- VERIFIED: All 6 plan verification checks pass
- FOUND: commits 49c6387, 234ee44, 95b4e95 (plan 03-02 commits)

## Self-Check: PASSED

---
*Phase: 03-check-in*
*Completed: 2026-03-11*
