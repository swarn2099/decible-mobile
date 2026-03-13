# Phase 11: Passport Layout & Structure - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Rebuild the passport header and tab bar into an Instagram-style compact layout (~180px header) with sticky tab navigation and swipe gesture support. 4 tabs: Stamps, Finds, Discoveries, Badges. Remove OrbBackground from passport. Keep GlassCard components for grid content. Does NOT include grid content changes (Phase 12) or badge grid implementation (Phase 13).

</domain>

<decisions>
## Implementation Decisions

### Header layout
- Instagram-style: avatar (60x60, plain circle, no ring) on the left, 4 stat columns (Followers / Following / Stamps / Finds) in a row to the right
- Username + "Member since" below the full avatar+stats row
- ~180px total height target
- Stat numbers in SemiBold 600, stat labels in Regular 400
- Leaderboard trophy button removed entirely from passport (deferred: relocate to Home screen)
- No settings gear icon anywhere on passport

### Action buttons
- Side-by-side, equal width, below stats row, above tab bar
- Compact pill style: 36px height, full border radius
- "Share Passport": pink-to-purple gradient fill — triggers existing ShareSheet
- "Edit Profile": surface fill (card color + border) — navigates to settings page
- Both buttons have press-down scale animation + haptic feedback

### Tab bar behavior
- 4 tabs: Stamps | Finds | Discoveries | Badges
- Frosted glass pill indicator behind active tab (keep Phase 7's PassportPager style)
- Active tab text: white/primary color (not pink) — glass pill is the differentiator
- Inactive tab text: muted/secondary color
- Pill slides smoothly with swipe gesture (existing tabOffset SharedValue pattern)
- Subtle 1px bottom border when tab bar is pinned (card border color)
- Tab bar pins to top of screen when scrolled past header
- Swipe left/right to switch tabs (react-native-pager-view, already installed)
- Followers and Following stat counts are tappable — open respective list screens

### Background & visual style
- NO OrbBackground on passport screen — flat themed background (#0B0B0F dark / #F5F5F7 light)
- Remove OrbBackground component import and rendering from passport.tsx
- No orb color shift (no orbs = no shift)
- GlassCard components with frosted glass strips remain for grid content (unchanged)
- Clean Instagram-style layout with premium GlassCard content in the grid

### Claude's Discretion
- Exact scroll animation implementation for sticky header (Animated.event vs Reanimated)
- Tab underline animation spring config values
- Spacing/padding distribution within the ~180px header budget
- Badge tab placeholder content (skeleton or empty state until Phase 13 builds the grid)
- How to handle the scroll-to-stick transition (snap vs smooth)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PassportHeader` (src/components/passport/PassportHeader.tsx): Currently has avatar, name, stats, social counts, leaderboard trophy — needs significant rewrite to Instagram-style compact layout
- `PassportPager` (src/components/passport/PassportPager.tsx): Already has glass pill indicator + swipe gesture with tabOffset SharedValue — extend from 3 to 4 tabs, keep glass pill
- `OrbBackground` (src/components/passport/OrbBackground.tsx): Currently renders behind entire passport — will be REMOVED from passport.tsx
- `ShareSheet` (src/components/passport/ShareSheet.tsx): Reuse for Share Passport button
- `GlassCard/` directory (StampGlassCard, FindGlassCard, DiscoveryGlassCard): Keep as-is for grid content
- `usePassportCollections`, `usePassportCollectionsSplit` hooks: Already split collections by type
- `useSocialCounts` hook: Already provides followers/following counts
- `useFanProfile` hook (inline in passport.tsx): Provides fan name, avatar, created_at
- `useThemeColors()`: All new/modified components must use this

### Established Patterns
- `passport.tsx` uses no-parent-ScrollView pattern: OrbBackground sibling behind SafeAreaView (will change since orbs are being removed)
- PassportPager tab pill: tabOffset SharedValue drives smooth mid-swipe animation
- TanStack React Query for data fetching
- expo-image for optimized image loading
- Poppins font family (Regular 400, Medium 500, SemiBold 600, Bold 700)
- apiCall pattern from @/lib/api for all API calls

### Integration Points
- `app/(tabs)/passport.tsx`: Main screen to rewrite — remove OrbBackground, rebuild header, extend pager to 4 tabs
- `PassportPager`: Extend from 3 tabs to 4 (add Badges), keep glass pill indicator
- `PassportHeader`: Major rewrite — Instagram-style compact layout with action buttons
- Settings route: Edit Profile button needs to navigate to settings (verify route exists)
- Followers/Following list screens: Stat counts need to be tappable links

</code_context>

<specifics>
## Specific Ideas

- Instagram profile page is the reference for header density and stat layout
- Glass pill tab indicator is a Decibel signature — keep it even as the rest simplifies
- Removing orbs from passport makes the GlassCards stand out more against the clean background
- Edit Profile → settings page (not a placeholder or coming soon toast)
- Leaderboard trophy should move to Home screen in a future phase (don't just delete it)

</specifics>

<deferred>
## Deferred Ideas

- Leaderboard trophy button relocation to Home screen — future phase
- Edit Profile full screen implementation — future milestone
- Badge grid content — Phase 13
- Grid content changes (3-column, square cells) — Phase 12

</deferred>

---

*Phase: 11-passport-layout-structure*
*Context gathered: 2026-03-13*
