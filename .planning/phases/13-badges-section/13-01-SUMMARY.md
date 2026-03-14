---
phase: 13-badges-section
plan: 01
subsystem: passport
tags: [badges, passport, animation, visual-polish]
dependency_graph:
  requires: [PassportPager inline BadgeGrid, BadgeDetailModal, useFanBadges hook, RARITY_COLORS]
  provides: [polished Badges tab with rarity-scaled glow, locked ghost badges, animated detail modals]
  affects: [passport.tsx Badges tab UX]
tech_stack:
  added: []
  patterns: [rarity-scaled shadow glow, Reanimated withTiming fade-in, transparent locked badge ghost]
key_files:
  created: []
  modified:
    - src/components/passport/PassportPager.tsx
    - src/components/passport/BadgeDetailModal.tsx
    - src/components/passport/BadgeGrid.tsx
decisions:
  - Rarity-scaled glow uses shadowOpacity/shadowRadius/elevation triple — common=subtle (0.2/4/2), legendary=max (0.7/18/8)
  - Locked badges: zero-border, transparent background, 0.3 opacity icon — maximum contrast vs earned
  - Locked sort order: legendary first (rarity weight 0,1,2,3) so most desirable unlockables appear first
  - Locked detail fade-in: 300ms withTiming opacity 0->1, keyed off badge.earned=false in useEffect
  - Motivational progress text: "Keep collecting to unlock" (API has no live progress counts)
metrics:
  duration_minutes: 8
  completed_date: "2026-03-14"
  tasks_completed: 2
  files_modified: 3
---

# Phase 13 Plan 01: Badges Section Summary

**One-liner:** Rarity-scaled glow on earned badges + ghost locked badges + fade-in locked detail cards in the 4-tab passport.

## What Was Built

Finalized the Badges tab as a polished 4th passport section. Two files modified, all TypeScript clean.

### Task 1 — BadgeGrid visual treatments (PassportPager.tsx)

- Added `getGlowConfig(rarity)` helper returning rarity-specific `shadowOpacity`, `shadowRadius`, `elevation`
- Added `getRarityWeight(rarity)` helper for locked sorting (legendary=0, epic=1, rare=2, common=3)
- Earned badges now get rarity-colored border + rarity-scaled shadow glow (common subtle → legendary strong)
- Locked badges stripped to pure ghost: `borderWidth: 0`, `backgroundColor: "transparent"`, icon at `opacity: 0.3`
- Sorting updated: earned by `earned_at` descending, locked by rarity weight ascending (legendary first)
- Counter header changed from "3 of 12 earned" to "Badges (3/12)" format

### Task 2 — BadgeDetailModal locked state + cleanup

- Added `lockedFadeIn` SharedValue + `lockedFadeStyle` animated style
- Locked badge detail content wrapped in `Animated.View` with `withTiming(1, { duration: 300 })` fade-in triggered on modal open
- Locked detail shows: description text → criteria text (pink, medium weight) → "Keep collecting to unlock" (italic, tertiary)
- Earned badge detail unchanged (date + share button already correct)
- Standalone `src/components/passport/BadgeGrid.tsx` marked `@deprecated` (PassportPager has its own inline version)
- `passport.tsx` confirmed clean — no BadgesModal, no badge refs in PassportHeader

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files exist
- [x] `src/components/passport/PassportPager.tsx` — modified
- [x] `src/components/passport/BadgeDetailModal.tsx` — modified
- [x] `src/components/passport/BadgeGrid.tsx` — deprecated comment added

### Commits exist
- [x] `c2213eb` — feat(13-01): upgrade BadgeGrid visual treatments in PassportPager
- [x] `e6336c2` — feat(13-01): update BadgeDetailModal locked state + deprecate BadgeGrid.tsx

### TypeScript
- [x] `npx tsc --noEmit` passes with zero errors

### Artifact checks from plan frontmatter
- [x] `PassportPager.tsx` contains `opacity: 0.3` — confirmed (locked badge icon)
- [x] `BadgeDetailModal.tsx` contains `Share` — confirmed (share button for earned badges)
- [x] `passport.tsx` has no stale badge modal or header badge references — confirmed

## Self-Check: PASSED
