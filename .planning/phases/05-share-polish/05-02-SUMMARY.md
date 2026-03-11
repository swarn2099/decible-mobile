---
phase: 05-share-polish
plan: 02
subsystem: share-celebration
tags: [celebration, share-card, haptics, confetti, ConfirmationModal, founded, add-flow]
dependency_graph:
  requires: [05-01]
  provides: [post-found-celebration, founder-share-card, passport-share-v2]
  affects: [add.tsx, passport.tsx, ConfirmationModal, useShareCard]
tech_stack:
  added: []
  patterns:
    - Fire-and-forget share card pre-generation on add success
    - Animated badge reveal with Reanimated withSpring scale from 0
    - Type-discriminated celebration flow (founded/discover/collect)
key_files:
  created:
    - src/components/collection/__tests__/ConfirmationModal.test.ts
  modified:
    - src/hooks/useShareCard.ts
    - src/components/collection/ConfirmationModal.tsx
    - app/(tabs)/add.tsx
    - app/(tabs)/passport.tsx
decisions:
  - founded type uses gold ★ text character (fontSize 64) instead of WaxSeal — simpler, no SVG dependency
  - discover type uses compass emoji in a purple circle view — matches PRD compass icon intent
  - collect type keeps original WaxSeal + tier badge (unchanged path)
  - share card pre-generated fire-and-forget on add success; nil shareCardUri shows generating state in ShareSheet
  - ConfirmationModal hides itself (visible:false) when Share tapped, then ShareSheet opens — prevents double modal stack
  - TierName default value in celebration state is "network" (not "bronze" — bronze is not a valid tier)
  - passport.tsx uses finds.length/stamps.length from already-computed arrays for v2 params
metrics:
  duration_minutes: 15
  completed_date: "2026-03-11"
  tasks_completed: 3
  files_changed: 5
---

# Phase 05 Plan 02: Post-Found Celebration + Share Flow Summary

**One-liner:** Founded celebration with gold star badge, confetti, heavy haptic, and pre-generated share card wired end-to-end through add.tsx and passport.tsx.

## What Was Built

### Task 0 — Wave 0 test stub
Created `src/components/collection/__tests__/ConfirmationModal.test.ts` with two stub tests: one type-level check that "founded" is accepted as a prop, one placeholder. Both pass immediately and provide a Nyquist sampling point for SHR-01.

### Task 1 — useShareCard hooks
- Fixed `API_BASE` from broken `decibel-three.vercel.app` URL to correct `decible.live`
- Added `FOUNDER_CARD_BASE` and `PASSPORT_CARD_V2_BASE` constants pointing to new Phase 05-01 endpoints
- Exported `useFounderShareCard` hook — generates PNG via `/api/share-card/founder` with artistName, artistPhoto, fanSlug params
- Exported `usePassportShareCardV2` hook — generates PNG via `/api/share-card/passport` with artistsFound, showsAttended, venues, topPhotos params
- All existing hooks (usePassportShareCard, useArtistShareCard, useBadgeShareCard, useSharePassportLink) preserved unchanged

### Task 2 — ConfirmationModal + add.tsx + passport.tsx
**ConfirmationModal.tsx:**
- Extended type prop to `"collect" | "discover" | "founded"`
- Added `shareCardUri?: string | null` optional prop
- Founded path: "Founded!" title in gold (#FFD700), gold star ★ badge (fontSize 64), heavy haptic + success notification, 20-particle confetti (all 5 accent colors), gold Share button ("Share Your Find"), button appears at 1.5s
- Discover path: "Discovered!" title, compass emoji in purple circle badge, medium haptic, 10-particle purple-dominant confetti, purple Share button
- Collect path: unchanged (WaxSeal, tier label, tier-up confetti)
- Ring color adapts to type (gold for founded, purple for discover, tier color for collect)
- Artist photo border glows gold for founded type

**add.tsx:**
- Added `CelebrationState` type with discriminated union for celebration type
- `useFounderShareCard` imported and wired — fire-and-forget generation starts immediately on add success
- `handleAdd` onSuccess: determines founded/collect type from `data.is_founder`, sets celebration state, does NOT navigate to artist profile until modal dismissed
- `handleDiscover` onSuccess: shows discover celebration, navigates on dismiss
- `handleShare`: hides ConfirmationModal, opens ShareSheet with pre-generated URI
- `handleCelebrationDismiss`: navigates to artist profile after modal closes
- ConfirmationModal and ShareSheet rendered at AddArtistView level (outside ScrollView)

**passport.tsx:**
- Swapped `usePassportShareCard` → `usePassportShareCardV2`
- `handleSharePassport` now passes `artistsFound`, `showsAttended`, `venues`, `topPhotos` (top 4 deduped photo URLs from collections)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TierName "bronze" not valid**
- **Found during:** Task 2
- **Issue:** Plan specified `current_tier: "bronze"` as default value in CelebrationState, but TierName is `"network" | "early_access" | "secret" | "inner_circle"` — "bronze" doesn't exist
- **Fix:** Changed all default tier values to `"network"` (lowest valid tier)
- **Files modified:** app/(tabs)/add.tsx
- **Commit:** e6f2b5a

## Self-Check: PASSED

All files verified present on disk. All commits exist in git log:
- `414c716` — test(05-02): Wave 0 stub test
- `62a117f` — feat(05-02): useShareCard hooks
- `e6f2b5a` — feat(05-02): ConfirmationModal + add.tsx + passport.tsx
