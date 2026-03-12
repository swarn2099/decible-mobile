# Phase 7: Glassy Passport Redesign - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the current vertical Finds/Stamps passport layout with a glassmorphic three-tab Passport (Stamps / Finds / Discoveries). Frosted glass cards with full-bleed artist photos, animated gradient orbs background, and View More pages with search + infinite scroll. Also fix existing BlurView components to SDK 55 BlurTargetView pattern and run DB migrations (MIG-01, MIG-05, MIG-06, MIG-07). Does NOT include Jukebox, check-in, or new API endpoints beyond passport-collections.

</domain>

<decisions>
## Implementation Decisions

### Page layout & header
- PassportHeader (avatar, name, stats, followers) stays **pinned above** the 3-tab pager
- Share Passport button lives **inside the header area**, below stats row, above the tab bar — always visible
- Badges section sits **below the tab pager** as a separate scrollable area
- Tab indicator: **frosted glass pill** behind active tab label (blur + semi-transparent), matching the glassmorphic theme
- Tab switching via tap AND swipe gesture (react-native-pager-view)
- Leaderboard trophy button remains as absolute overlay (top-right, zIndex 10)

### Glass card content
- **Full bleed photo** fills entire card. All text overlays on a **frosted glass strip** at the bottom of the card
- Type-specific glass strip content:
  - **Stamp cards (pink tint):** Artist name + Venue name + Date + Founder badge if applicable
  - **Find cards (purple tint):** Artist name + Platform icon + Listener count + Founder ★ badge
  - **Discovery cards (blue tint):** Artist name + "via @finder" (tappable → finder profile) + compass badge
- Tint applied to the **glass strip only** — photo stays clean, no border glow or photo overlay
- Each card has **slight rotation** (-2° to +2°, deterministic from collection ID hash)
- **Press-in animation** (scale 0.97, spring back) + light haptic on card tap (GPASS-08)
- Card tap → artist profile. On Discovery cards, "@finder" text is a separate tappable link → finder profile
- 2x4 grid preview per tab. Cards with fewer than 8 entries display without empty placeholders (GPASS-13)

### Discovery type mapping
- **Finds tab = Founded artists ONLY** (gold ★). This is the prestige collection.
- **Discoveries tab = Discovered artists** (purple compass, online but not first). Includes existing "discovered" collections.
- **Stamps tab = Collected/Verified** (live attendance at venues)
- **MIG-06 backfill required:** Run migration to set collection_type='discovery' on all existing collections where capture_method='online' AND is_founder=false. Discoveries tab populates immediately on launch.
- **Empty Finds state:** CTA with illustration + "Be the first to find an underground artist" + button routing to + tab
- Empty Stamps/Discoveries: similar CTAs (check in at a show / discover artists on Decibel)

### Orb & background style
- **3 animated gradient orbs** — one pink (#FF4D6A), one purple (#9B6DFF), one blue (#4D9AFF)
- Orbs render behind the **entire passport screen** including header — full immersive glassmorphic feel
- **Orb colors shift** based on active tab: Stamps → pink emphasis, Finds → purple/gold emphasis, Discoveries → blue emphasis. Smooth transition on tab swipe.
- Movement: slow drift, low-opacity blurred circles (~30% opacity dark mode)
- **Light mode:** Same orbs at ~15-20% opacity. Glass cards get lighter blur tint.
- Dark mode: orbs at ~30% opacity with subtle glow

### Claude's Discretion
- Exact orb animation implementation (Reanimated shared values vs CSS animation)
- Glass strip blur intensity values
- Card dimensions and spacing within the 2x4 grid
- Loading skeleton design for each tab
- View More page search bar styling
- Paper grain / texture treatment (removed in favor of glassmorphic — use glass everywhere)
- Exact press-in spring config values
- How to handle missing artist photos (gradient fallback exists via getGradientForName)
- BlurView Android fallback threshold (GPASS-12)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PassportHeader` (src/components/passport/PassportHeader.tsx): Keep and adapt — already has avatar, name, stats, social counts. Add Share button below it.
- `FindCard` (src/components/passport/FindCard.tsx): Current card component — will be **replaced** with new GlassCard variants, but reference its artist profile navigation pattern.
- `FindsGrid` (src/components/passport/FindsGrid.tsx): Current 2-column grid — replace with new GlassGrid, but reference its layout logic.
- `StampsSection` (src/components/passport/StampsSection.tsx): Current stamps — replace entirely with GlassCard stamp variant.
- `BadgeGrid` / `BadgeDetailModal`: Keep as-is, render below the pager.
- `ShareSheet` (src/components/passport/ShareSheet.tsx): Reuse for Share Passport flow.
- `usePassportCollections` hook: Currently splits by `verified` flag — needs extension to split into 3 categories (stamps/finds/discoveries).
- `useThemeColors()`: All new components must use this.
- `getGradientForName()`: Deterministic gradient fallback for missing artist photos — reuse in GlassCards.
- `CollectionStamp` type (src/types/passport.ts): Has `rotation`, `venue`, `event_date`, `is_founder`, `verified` — base type for all three card variants.
- `expo-blur` (v55.0.8): Already installed. Needs BlurTargetView pattern for Android (SDK 55).
- `react-native-reanimated` (v4.2.1): Already installed. Use for orb animations, press-in scale, tab transitions.

### Established Patterns
- TanStack React Query (useQuery/useInfiniteQuery) for data fetching
- Zustand + MMKV for persistent client state
- expo-image for optimized image loading
- expo-linear-gradient for gradient effects
- Poppins font family (Regular 400, Medium 500, SemiBold 600, Bold 700)
- apiCall pattern from @/lib/api for all API calls

### Integration Points
- `app/(tabs)/passport.tsx`: Main screen to rewrite — replace current vertical scroll with header + pager + badges
- `app/collection/finds.tsx` and `app/collection/stamps.tsx`: Existing View All screens — adapt for new glass card style + add Discoveries route
- `react-native-pager-view`: NOT installed — needs to be added (npm install react-native-pager-view)
- Passport API endpoint (`/mobile/passport`): Currently returns all collections — may need new endpoint or query param to filter by type for View More infinite scroll
- `StampAnimationModal`, `SharePrompt`, `ConfirmationModal`: Existing BlurView components that need SDK 55 BlurTargetView fix (GPASS-14)

</code_context>

<specifics>
## Specific Ideas

- Full bleed artist photo with frosted glass strip at bottom — the card IS the photo, text floats on glass
- Orbs shift color based on active tab — creates a living, breathing background that responds to navigation
- Finds tab is the prestige collection (Founded only) — makes the gold ★ Founder badge even more valuable
- Discovery cards show "via @finder" as social proof — tappable to drive profile visits and social connections
- The entire passport screen is immersive glassmorphic — orbs behind everything, header has subtle glass treatment too

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-glassy-passport-redesign*
*Context gathered: 2026-03-12*
