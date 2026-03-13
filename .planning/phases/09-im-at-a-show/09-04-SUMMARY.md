---
phase: 09-im-at-a-show
plan: "04"
subsystem: mobile-client
tags: [checkin, realtime, supabase, state-machine, ios-background]
dependency_graph:
  requires: [09-02, 09-03]
  provides: [mobile-scraper-integration, show-checkin-hook, scraping-wait-screen]
  affects: [CheckInWizard, types/index.ts]
tech_stack:
  added: []
  patterns: [supabase-realtime-subscription, polling-fallback, animated-loading, state-machine-hook]
key_files:
  created:
    - src/hooks/useShowCheckin.ts
    - src/components/checkin/ScrapingWaitScreen.tsx
  modified:
    - src/types/index.ts
    - src/components/checkin/CheckInWizard.tsx
decisions:
  - "lastPositionRef stores lat/lng from handleStartScan so it's available for startCheckin() call in handleConfirmVenue without re-requesting GPS"
  - "show_result renders a placeholder until Plan 09-05 adds confidence-aware collection UI"
  - "show_timeout routes to no_venues (existing fallback) rather than a dedicated timeout screen — clean UX with Tag Manually CTA"
  - "Elapsed sync useEffect deliberately excludes step from deps to avoid infinite loop — only syncs on showCheckinState changes"
metrics:
  duration_seconds: 202
  completed_date: "2026-03-13"
  tasks_completed: 2
  files_changed: 4
---

# Phase 09 Plan 04: Mobile Client Integration — Show Check-In Hook + Wait Screen

State machine hook (idle→scanning→layer1_hit|waiting→result|timeout|error) with Supabase Realtime subscription, iOS polling fallback, 15-second timeout, ScrapingWaitScreen component, and CheckInWizard integration routing venues with no DB lineup through the VM scraper path.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | useShowCheckin hook + ShowCheckin types | a57340d | src/hooks/useShowCheckin.ts, src/types/index.ts |
| 2 | ScrapingWaitScreen + CheckInWizard integration | 921430e | src/components/checkin/ScrapingWaitScreen.tsx, src/components/checkin/CheckInWizard.tsx |

## What Was Built

### useShowCheckin (src/hooks/useShowCheckin.ts)
Full state machine hook managing the VM scraper integration:
- `startCheckin(lat, lng)` — POSTs to `/mobile/show-checkin`, transitions to `layer1_hit` on DB hit or `waiting` on VM dispatch
- `waiting` phase: starts elapsed counter (setInterval/1s), subscribes to Supabase Realtime `search_results` INSERT filtered by `search_id`
- Polling fallback (`startPolling`) fires on Realtime CLOSED/TIMED_OUT status — queries `search_results` every 3 seconds for iOS background disconnect resilience
- Hard 15-second timeout via `setTimeout` → transitions to `timeout` phase
- All refs (elapsedTimerRef, timeoutRef, pollRef, channelRef) cleaned up in `cleanup()` and `useEffect` unmount return

### New Types (src/types/index.ts)
- `ShowCheckinState` — 7-phase union type
- `EnrichedPerformer` — Performer pick + `is_founder_available` + `founder_fan_id`
- `ShowSearchResult` — VM scraper result shape (search_id, confidence, venue_name, venue_id, artists[], source)
- `WizardStep` extended with `show_waiting`, `show_result`, `show_timeout`

### ScrapingWaitScreen (src/components/checkin/ScrapingWaitScreen.tsx)
- Animated pulsing icon (scale 0.95↔1.05, opacity 0.4↔1.0 via Animated.loop)
- Staggered 3-dot progress animation (200ms delay offset per dot)
- Elapsed time display in seconds (monospace-feel, textSecondary color)
- "Finding out what's playing here..." heading (Poppins_600SemiBold, 18px)
- Cancel button with onCancel callback
- All colors from `useThemeColors()` — works in both dark and light mode

### CheckInWizard Integration (src/components/checkin/CheckInWizard.tsx)
- Added `useShowCheckin` hook and `lastPositionRef` to store lat/lng from GPS scan
- `handleConfirmVenue`: venue with no performers triggers `startCheckin(lat, lng)` instead of `no_lineup`
- `useEffect` watches `showCheckinState.phase` to drive WizardStep transitions
- Separate elapsed sync `useEffect` keeps `show_waiting.elapsed` updated without infinite loop
- `resetShowCheckin()` called in `resetWizard()` and back navigation from show_* states
- show_result renders placeholder until Plan 09-05 confidence UI
- show_timeout renders "Couldn't find tonight's lineup" with Tag Manually CTA

## Decision Log

1. **lastPositionRef for lat/lng**: GPS coords captured in `handleStartScan` and stored in a ref — avoids a second GPS request when `handleConfirmVenue` calls `startCheckin`. Clean single-request pattern.

2. **show_result placeholder**: Plan 05 owns the confidence-based UI (high → auto-collect, medium → confirm, low → link paste). Placeholder prevents dead state in wizard.

3. **show_timeout → no_venues CTA**: Rather than a custom timeout screen, we route to a "Tag Manually" CTA that clears to `no_venues`. Keeps code surface minimal and user has a clear action.

4. **Elapsed sync dep exclusion**: The elapsed sync `useEffect` watches `showCheckinState` only (not `step`) to avoid re-triggering when setStep is called — prevents infinite loop in React's dependency tracking.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- TypeScript: `npx tsc --noEmit` passes with zero errors across all modified files
- All intervals/subscriptions use refs and are cleaned up on unmount and in cleanup()
- Dark/light mode: ScrapingWaitScreen uses only `useThemeColors()` — no hardcoded colors
- Decision tree verified: `handleConfirmVenue` correctly routes performers.length > 0 → LineupStep, performers.length === 0 → startCheckin()

## Self-Check: PASSED

Files verified:
- src/hooks/useShowCheckin.ts — exists
- src/components/checkin/ScrapingWaitScreen.tsx — exists
- src/types/index.ts — modified (ShowCheckinState, EnrichedPerformer, ShowSearchResult, WizardStep extended)
- src/components/checkin/CheckInWizard.tsx — modified

Commits verified:
- a57340d — feat(09-04): useShowCheckin hook + ShowCheckin types
- 921430e — feat(09-04): ScrapingWaitScreen + CheckInWizard show-checkin integration
