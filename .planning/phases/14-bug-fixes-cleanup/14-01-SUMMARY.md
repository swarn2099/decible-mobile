---
phase: 14-bug-fixes-cleanup
plan: "01"
subsystem: fan-app-ui
tags: [cleanup, passport, add-tab, v6.0]
dependency_graph:
  requires: []
  provides: [clean-add-tab, passport-v6-tabs, passport-v6-header]
  affects: [app/(tabs)/add.tsx, src/components/passport/PassportPager.tsx, src/components/passport/PassportHeader.tsx, app/(tabs)/passport.tsx, app/profile/[id].tsx]
tech_stack:
  added: []
  patterns: [flat-collection-derivation]
key_files:
  created: []
  modified:
    - app/(tabs)/add.tsx
    - src/components/passport/PassportPager.tsx
    - src/components/passport/PassportHeader.tsx
    - app/(tabs)/passport.tsx
    - app/profile/[id].tsx
decisions:
  - Finds tab includes ALL found artists (including founders) using flat collection filter
  - Founders tab is a strict subset of Finds (is_founder === true)
  - Stamp data preserved in DB, UI hidden only
metrics:
  duration: ~15 minutes
  completed: "2026-03-16"
  tasks_completed: 2
  files_modified: 5
---

# Phase 14 Plan 01: Remove Stamps UI, Restructure Passport Tabs Summary

**One-liner:** Stamp UI removed from + tab and passport; passport restructured to Finds|Founders|Discoveries|Badges with Founders/Finds header stats.

---

## What Was Built

### Task 1 — Remove show mode from + tab (bbb7751)

Cleaned up `app/(tabs)/add.tsx` for v6.0:
- Removed `AddMode` type, `mode` state variable, and the two-button toggle component
- Removed `CheckInWizard` import and conditional rendering (`mode === "show" ? <CheckInWizard />`)
- Removed `MapPin` import from lucide-react-native
- Header now always shows "Add an Artist" (no conditional text)
- Removed unused styles: `toggle`, `toggleButton`, `toggleText`
- `AddArtistView` renders directly inside SafeAreaView
- CLEAN-06 (map button): Home screen had no map button — Jukebox and Leaderboard buttons only. No-op.
- CLEAN-07 (stamp data): No DB changes made. Stamp data preserved.

### Task 2 — Restructure passport tabs and header stats (f290bcc)

**PassportPager.tsx:**
- `TAB_LABELS` changed from `["Stamps", "Finds", "Discoveries", "Badges"]` to `["Finds", "Founders", "Discoveries", "Badges"]`
- `stamps` prop removed, `founders: CollectionStamp[]` prop added
- Page 0: Finds (all found artists, including founders), `type="find"`
- Page 1: Founders (is_founder subset), `type="find"` (same visual, different data)
- Page 2: Discoveries (unchanged)
- Page 3: Badges (unchanged)

**PassportHeader.tsx:**
- `stampsCount` prop renamed to `foundersCount`
- Stat order: Followers | Following | Finds | Founders
- Followers and Following remain tappable (navigate to list screens)

**passport.tsx:**
- Uses flat `usePassportCollections` hook for derives
- `finds = flatCollections.filter(c => c.collection_type === 'find' || c.is_founder === true)` — founders included
- `founders = flatCollections.filter(c => c.is_founder === true)` — strict subset
- `discoveries` still from `usePassportCollectionsSplit` (no overlap with founders)
- `stampsCount` → `foundersCount` in PassportHeader call
- `stamps` → `founders` in PassportPager call
- `handleViewMore` type narrowed from `"stamp" | "find" | "discovery"` to `"find" | "discovery"`

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] profile/[id].tsx used old PassportPager props**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** `app/profile/[id].tsx` still passed `stamps` prop to `PassportPager` after the interface change, causing a TS2322 type error
- **Fix:** Updated profile screen to use `finds`/`founders`/`discoveries` derivation pattern, updated `handleViewMore` signature, updated `PassportPager` call to use new props, changed stat cell from Stamps to Founders
- **Files modified:** `app/profile/[id].tsx`
- **Commit:** f290bcc (included in Task 2 commit)

---

## Verification

- `npx tsc --noEmit` passes (no errors in modified files; pre-existing urlParser.test.ts errors are unrelated)
- No references to "I'm at a Show", `CheckInWizard`, `AddMode`, or `MapPin` in add.tsx
- `PassportPager TAB_LABELS` = `["Finds", "Founders", "Discoveries", "Badges"]`
- `PassportHeader` shows Founders stat, not Stamps
- Finds tab filter includes `is_founder === true` items
- Founders tab is strict subset (`is_founder === true` only)
- Home screen has no map button (Jukebox + Leaderboard + Search only)
- Stamp data untouched in database (CLEAN-07 no-op)

---

## Self-Check: PASSED

- `app/(tabs)/add.tsx` — exists, modified
- `src/components/passport/PassportPager.tsx` — exists, modified
- `src/components/passport/PassportHeader.tsx` — exists, modified
- `app/(tabs)/passport.tsx` — exists, modified
- `app/profile/[id].tsx` — exists, modified (auto-fix)
- Commits: bbb7751 (Task 1), f290bcc (Task 2) — both verified in git log
