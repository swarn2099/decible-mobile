# Phase 13: Badges Section - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Finalize the Badges tab as a dedicated 4th tab in the passport. Ensure earned badges render full color with rarity-scaled glow, locked badges render grayscale at 0.3 opacity with no border, and tapping any badge opens a detail card (earned = how earned + date + share; locked = requirements + progress). Remove any badge elements from outside the Badges tab. Does NOT include new badge types, badge earning logic changes, or share card generation for badges.

</domain>

<decisions>
## Implementation Decisions

### Locked badge visual treatment
- Same badge icon/emoji as earned, but grayscale filter + 0.3 opacity
- No border, no circle outline, no glow — just the faded icon on the surface
- No rarity color visible when locked — everything is neutral gray
- Maximum visual contrast with earned badges (which have colored borders + glow)

### Earned badge visual treatment
- Full color with rarity-colored border (already built)
- Glow/shadow intensity scales by rarity: common = subtle, rare = medium, epic = strong, legendary = max glow + extra shadow radius
- Existing metallic sheen gradient stays (already built in BadgeGrid)

### Badge detail card — earned
- Show: badge name, "Earned [date]", description of how it was earned (requirement text)
- Share button present on earned badges only — triggers share flow
- Starburst ray animation on open (already built in BadgeDetailModal)

### Badge detail card — locked
- Show: badge name, requirement description text, current progress toward requirement (e.g., "3/5 artists discovered")
- No share button
- No starburst animation — simple fade-in

### Badge grid layout
- 3 columns of 64px badge circles with name labels below each
- Earned badges first (sorted by earn date, newest first), then locked badges below (sorted by rarity, legendary first)
- "Badges (3/12)" counter header at top of the Badges tab
- Keep existing BadgeGrid layout style — badges are their own visual language, distinct from the photo grid in other tabs

### Cleanup
- Remove ALL badge elements from passport header and main scroll area outside the Badges tab
- Remove the badges full-screen modal from passport.tsx (badges live in the 4th tab only now)
- Verify no badge references in PassportHeader

### Claude's Discretion
- Exact grayscale filter implementation (RN doesn't have native CSS grayscale — may need image tinting or color matrix)
- Progress bar or text format for locked badge progress
- Empty state if zero badges exist (unlikely but handle gracefully)
- Badge circle size adjustments if 64px feels too small/large in the tab context

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BadgeGrid` (src/components/passport/BadgeGrid.tsx): 3-column circle layout, earned/locked sorting, rarity colors, sheen gradient — needs grayscale treatment for locked badges and removal of beige circle fallback
- `BadgeDetailModal` (src/components/passport/BadgeDetailModal.tsx): Starburst animation, date formatting, rarity colors — needs locked badge requirements view + progress indicator + share button for earned
- `useFanBadges` hook: Returns BadgeWithStatus[] with earned boolean, rarity, description
- `RARITY_COLORS` constant: Maps rarity → color string
- `BadgeWithStatus` type: Has id, name, description, rarity, earned, earned_at fields
- `useThemeColors()`: All components must use this

### Established Patterns
- Modal presentation for detail views (BadgeDetailModal already uses Modal)
- Reanimated for entrance animations
- expo-haptics for tactile feedback
- Poppins font family

### Integration Points
- `PassportPager.tsx`: Already renders BadgeGrid in the 4th tab (Phase 11 added this)
- `passport.tsx`: Has a BadgesModal that needs to be removed (badges live in tab now)
- `useFanBadges` hook: May need extension to return progress data for locked badges (depends on API)
- Badge share cards: May need a new API endpoint or reuse existing share card pattern

</code_context>

<specifics>
## Specific Ideas

- Locked badges should feel like "ghosts" of what they could be — same icon but faded and gray
- Earned badges with legendary rarity should GLOW — make them feel special
- Progress on locked badges is motivating — "2 more artists and you unlock this" drives engagement
- Share button on earned badges only — earning is the achievement, sharing is the reward

</specifics>

<deferred>
## Deferred Ideas

- Badge share card image generation (API endpoint) — could be a future polish pass
- New badge types or earning criteria changes — separate milestone
- Badge notification when earned — separate feature

</deferred>

---

*Phase: 13-badges-section*
*Context gathered: 2026-03-14*
