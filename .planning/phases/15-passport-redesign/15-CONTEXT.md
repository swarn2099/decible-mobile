# Phase 15: Passport Redesign - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning
**Source:** PRD Express Path (DECIBEL_V6_PRD.md Phase 2 + DECIBEL_V3.5_PRD.md)

<domain>
## Phase Boundary

This phase redesigns the login screen and passport screen to match the v3.5 spec. The passport tabs were already restructured in Phase 14 (Finds/Founders/Discoveries/Badges). This phase focuses on visual polish:
- Login screen with animated gradient orbs, branded input/button, animations
- Passport Instagram-style compact header with inline stats
- 3-column grid with correct overlays per tab type
- Sticky tab bar with swipe gestures
- Light/dark mode correctness on both screens

Repo: /home/swarn/decibel-mobile only

IMPORTANT: Much of this work was already done in v3.5 (phases 10-13). Before building anything new, check what already exists:
- Phase 10 built the login flow (LoginOrbBackground, animated orbs, branded input/button)
- Phase 11 built the passport layout (collapsible header, PassportPager with sticky tabs)
- Phase 12 built the grid (CollectionGrid, 3-column, overlays)
- Phase 13 built the badges tab (BadgeGrid, rarity-scaled glow)

This phase should VERIFY and POLISH what exists, not rebuild from scratch. Only fix what doesn't match the spec.

</domain>

<decisions>
## Implementation Decisions

### Login Screen
- Respects device light/dark mode
- Animated gradient orbs background (lower opacity in light mode)
- Tracked-out "D E C I B E L" wordmark in upper third
- Dark-themed email input with pink border glow on focus
- Brand gradient (pink → purple) "Send Magic Link" button with press animation + haptic
- Loading spinner in button, success state with checkmark + "Check your email"
- Stagger fade-in animations on mount

### Passport Layout — Instagram Profile Pattern
- Compact header: avatar (no colored ring), stats inline (Followers, Following, Finds, Founders)
- Username, member since
- No settings gear icon — Edit Profile handles settings
- Share Passport + Edit Profile buttons side by side
- No badge teaser icon in header
- Sticky tab bar (Finds | Founders | Discoveries | Badges) that pins to top on scroll
- Swipe gesture between tabs
- Respects device light/dark mode

### Grid — 3-Column Instagram Style
- Square cells (1:1 aspect ratio), uniform 1px gap on all sides
- Artist image fills each cell (cover/crop)
- Bottom gradient overlay with ~8px left padding: artist name + metadata
- Finds cells: artist name + platform icon + date
- Founders cells: artist name + gold ★ badge + date
- Discoveries cells: artist name + "via @username" + date
- Badges tab: 3-column grid, earned = vibrant color, locked = dark silhouette
- Haptic feedback + press-down scale animation on cell tap
- No ghost/broken cells for empty positions
- Newest to oldest ordering

### NO gradient orbs on the passport screen
- Orbs are login screen only
- Passport background is clean themed background

### Claude's Discretion
- Whether to rebuild or polish existing v3.5 components
- Specific animation timing adjustments
- Exact header height and spacing values

</decisions>

<specifics>
## Specific Ideas

- v3.5 already built LoginOrbBackground, PassportPager, CollectionGrid, BadgeGrid
- Phase 14 already changed tabs to Finds/Founders/Discoveries/Badges and header stats to Followers/Following/Finds/Founders
- Check STATE.md accumulated decisions from v3.5 for implementation patterns (OrbBackground uses LinearGradient, PassportPager uses tabOffset SharedValue, etc.)
- The passport should NOT have orb backgrounds — only the login screen

</specifics>

<deferred>
## Deferred Ideas

None — PRD covers phase scope.

</deferred>

---

*Phase: 15-passport-redesign*
*Context gathered: 2026-03-16 via PRD Express Path*
