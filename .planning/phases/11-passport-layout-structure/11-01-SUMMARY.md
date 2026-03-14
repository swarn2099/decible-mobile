---
phase: 11-passport-layout-structure
plan: "01"
subsystem: passport-ui
tags: [passport, header, tabs, pager, reanimated, theme]
dependency_graph:
  requires: []
  provides: [passport-header-v2, passport-pager-v4, passport-screen-v2]
  affects: [app/(tabs)/passport.tsx, app/profile/[id].tsx]
tech_stack:
  added: []
  patterns: [collapsible-header, useSharedValue-scrollY, interpolate-height-opacity]
key_files:
  created: []
  modified:
    - src/components/passport/PassportHeader.tsx
    - src/components/passport/PassportPager.tsx
    - app/(tabs)/passport.tsx
    - app/profile/[id].tsx
decisions:
  - Collapsible header via Animated.View interpolating height+opacity from scrollY SharedValue — simplest correct pattern, avoids PagerView-inside-ScrollView issues
  - Badge tab inline (BadgeGrid component) replaces BadgesModal — fewer taps to access badges
  - profile/[id].tsx gets empty badges array and headerHeight=0 — other users' badges not shown (correct behavior)
  - underlineX uses continuous position from onPageScroll for smooth mid-swipe animation
metrics:
  duration: "4 minutes"
  completed_date: "2026-03-14"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
---

# Phase 11 Plan 01: Passport Layout & Structure Summary

Instagram-style compact passport header (~180px) with 4 inline stats (Followers/Following tappable), gradient Share + surface Edit buttons with haptics, themed background (no orbs), 4-tab pager (Stamps/Finds/Discoveries/Badges) with pink underline and collapsible header behavior.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Rewrite PassportHeader with Instagram-style compact layout | d2a5c72 | src/components/passport/PassportHeader.tsx |
| 2 | Rewrite PassportPager (4 tabs) and passport.tsx (themed bg, no orbs) | 1077b5e | src/components/passport/PassportPager.tsx, app/(tabs)/passport.tsx, app/profile/[id].tsx |

## What Was Built

### PassportHeader.tsx (full rewrite)
- 4 inline stat columns: Followers (tappable) / Following (tappable) / Stamps / Finds
- 60x60 avatar with `colors.cardBorder`, gradient initial fallback
- Username + "Member since" row — no settings gear
- Gradient "Share Passport" button (pink→purple) with Reanimated `withSpring` press animation + haptics
- Surface "Edit Profile" button (`colors.card` fill) with same animation + haptics
- All colors via `useThemeColors()` — zero hardcoded hex values
- Removed props: `onSettingsPress`, `badgesEarned`, `badgesTotal`, `onBadgesPress`
- Added prop: `followingCount`

### PassportPager.tsx (extended)
- 4 tabs: Stamps / Finds / Discoveries / Badges
- Tab width = `screenWidth / 4` (was /3)
- Pink underline (`colors.pink`) instead of white — continuous mid-swipe animation preserved
- Tab bar background: `colors.card`, text uses `colors.text` / `colors.textSecondary`
- Tab bar bottom border fades in via `interpolate` when header is fully collapsed (pinned state visual cue)
- Badges page: `BadgeGrid` component inline — earned badges show full color + glow, locked at 0.3 opacity
- Each ScrollView page reports `scrollY` via `onScroll` callback to parent SharedValue
- New props: `badges`, `onBadgeTap`, `scrollY`, `headerHeight`

### passport.tsx (full rewrite)
- Flat themed background: `colors.bg` — no `OrbBackground`
- Collapsible header: `Animated.View` with `interpolate` on `scrollY` — height 180→0, opacity 1→0
- Tab bar naturally pins as header collapses (sits below header, above PagerView)
- Removed: `BadgesModal` component, `badgesModalVisible` state, `setBadgesModalVisible`
- Kept: `BadgeDetailModal` (tapping a badge still opens detail), `ShareSheet`
- `scrollY` SharedValue created here, passed to both header animation and pager

### profile/[id].tsx (updated)
- Added `profileScrollY = useSharedValue(0)` at component level
- Updated `PassportPager` call with new required props (`badges=[]`, `onBadgeTap`, `scrollY`, `headerHeight=0`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] profile/[id].tsx also uses PassportPager — new required props broke it**
- **Found during:** Task 2 TypeScript verification
- **Issue:** `app/profile/[id].tsx` calls `PassportPager` without the new required props (`badges`, `onBadgeTap`, `scrollY`, `headerHeight`) — TypeScript error
- **Fix:** Added `profileScrollY = useSharedValue(0)` at component top, updated PassportPager call with `badges=[]`, `onBadgeTap={() => {}}`, `scrollY={profileScrollY}`, `headerHeight={0}`
- **Files modified:** `app/profile/[id].tsx`
- **Commit:** 1077b5e (included in Task 2 commit)

## Self-Check: PASSED

Files confirmed to exist:
- src/components/passport/PassportHeader.tsx — FOUND
- src/components/passport/PassportPager.tsx — FOUND
- app/(tabs)/passport.tsx — FOUND

Commits confirmed:
- d2a5c72 — FOUND (Task 1: PassportHeader rewrite)
- 1077b5e — FOUND (Task 2: PassportPager + passport.tsx rewrite)

TypeScript: `npx tsc --noEmit` — 0 project-level errors
