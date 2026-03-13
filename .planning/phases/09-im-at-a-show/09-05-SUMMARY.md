---
phase: 09-im-at-a-show
plan: "05"
subsystem: mobile-client
tags: [checkin, confidence-ui, manual-fallback, stamp-animation, founder-badge, react-native]
dependency_graph:
  requires: [09-04]
  provides: [confidence-lineup-screen, manual-fallback-form, show-summary-screen, founder-aware-stamp-animation, complete-show-checkin-flow]
  affects: [CheckInWizard, StampAnimationModal, LineupStep]
tech-stack:
  added: []
  patterns: [confidence-tiered-ui, crowdsource-data-save, founder-aware-celebration, postStampSummary-ref-pattern]
key-files:
  created:
    - src/components/checkin/ConfidenceLineupScreen.tsx
    - src/components/checkin/ManualFallbackForm.tsx
    - src/components/checkin/ShowSummaryScreen.tsx
  modified:
    - src/components/checkin/LineupStep.tsx
    - src/components/checkin/StampAnimationModal.tsx
    - src/components/checkin/CheckInWizard.tsx
    - src/types/index.ts
key-decisions:
  - "postStampSummaryRef ref pattern: stamp animation onViewPassport/onDismiss checks a ref for summary data — avoids adding summary state to the stamp modal itself"
  - "ManualFallbackForm routes new artists through tag-performer endpoint and known artists through show-checkin PUT — keeps collection logic server-side"
  - "TS2367 false-positives on showBackButton comparison fixed with stepType cast to string — early returns narrow the union, making comparisons appear unreachable"
  - "LowConfidence validation requires existing_performer match — prevents collecting artists not yet in DB without going through the proper add-artist flow"
patterns-established:
  - "Confidence tier rendering: three distinct view sub-components inside one export (HighConfidenceView, MediumConfidenceView, LowConfidenceView)"
  - "Crowdsource save is best-effort: wrapped in try/catch, never blocks user flow, uses supabase direct insert"
requirements-completed: [SHOW-05, SHOW-07, SHOW-08, SHOW-17, SHOW-18, SHOW-19, SHOW-20, SHOW-21]
duration: 7min
completed: "2026-03-13"
---

# Phase 09 Plan 05: Confidence-Tiered UI + Manual Fallback + Show Summary

**Three-tier confidence lineup confirmation (high/medium/low), manual venue+artist form with Supabase venue autocomplete, founder-aware stamp animation (gold ink + heavy haptic), and ShowSummaryScreen completing the full I'm at a Show flow end-to-end.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-03-13T16:15:30Z
- **Completed:** 2026-03-13T16:22:05Z
- **Tasks:** 2 (+ 1 auto-approved checkpoint)
- **Files modified:** 7

## Accomplishments
- ConfidenceLineupScreen: high=auto-collect with checkboxes, medium=confirm prompt with source attribution, low=per-artist link paste with `useValidateArtistLink` inline validation
- ManualFallbackForm: Supabase `venues` fuzzy autocomplete, link paste for artist, check-in via show-checkin PUT or tag-performer, crowdsource data saved to `venue_submissions` table
- ShowSummaryScreen: scrollable list of collected artists with gold Founder badge or pink Stamped badge per artist
- LineupStep: enrichedPerformers prop adds gold star + "Founder available!" indicator per row; founders[] passed to onStamped callback
- StampAnimationModal: founderPerformerIds prop triggers heavy haptic, gold ink burst, and "You're the Founder!" gold badge display
- CheckInWizard: all three new screens wired in; confidence UI → PUT show-checkin → stamp animation → summary; manual fallback → stamp animation → summary; cache invalidation on every collection path

## Task Commits

1. **Task 1: ConfidenceLineupScreen + ManualFallbackForm + ShowSummaryScreen** - `1d666e1` (feat)
2. **Task 2: Wire confidence UI + manual fallback + summary into CheckInWizard** - `da6a150` (feat)

## Files Created/Modified
- `src/components/checkin/ConfidenceLineupScreen.tsx` — Three-tier confidence UI with inline link validation for low-confidence path
- `src/components/checkin/ManualFallbackForm.tsx` — Venue autocomplete + artist link paste + crowdsource save to venue_submissions
- `src/components/checkin/ShowSummaryScreen.tsx` — Post-collection summary with Founder/Stamp badges per artist
- `src/components/checkin/LineupStep.tsx` — Added enrichedPerformers prop, Founder available badge, founders[] in onStamped callback
- `src/components/checkin/StampAnimationModal.tsx` — founderPerformerIds prop, gold ink + heavy haptic + gold "You're the Founder!" badge
- `src/components/checkin/CheckInWizard.tsx` — Full flow wiring: imports new screens, handleConfidenceCollect, handleManualStamped, postStampSummaryRef pattern, show_summary step
- `src/types/index.ts` — WizardStep extended with show_summary variant

## Decisions Made
1. **postStampSummaryRef pattern**: when the stamp animation dismisses after a show_result or show_timeout flow, a ref holds the summary data. The onViewPassport/onDismiss callbacks read the ref and transition to show_summary. This avoids polluting the StampAnimationModal with wizard-level state.

2. **Low-confidence validation requires existing_performer**: if the link validates but the artist isn't in DB yet, the current path routes to tag-performer. This ensures we never create phantom collections against artist IDs that don't exist.

3. **TS2367 false-positive fix**: after early returns for show_result/show_timeout/show_summary, TypeScript narrows those variants out of the union. The showBackButton comparison against those narrowed-out types triggers TS2367. Fixed with `const stepType = step.type as string`.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
- TypeScript TS2367 false-positive on showBackButton comparison — fixed with string cast. Pre-existing node_modules type conflicts (react-native-svg, @types/node) continue to exist in the project but do not affect app files.

## Next Phase Readiness
- Complete "I'm at a Show" flow is end-to-end: DB lineup → LineupStep → animation → done; scrape result → confidence UI → animation → summary; timeout → manual form → animation → summary.
- All cache keys invalidated on collection (passport, passportCollections, myCollectedIds).
- Phase 09 complete.

---
*Phase: 09-im-at-a-show*
*Completed: 2026-03-13*
