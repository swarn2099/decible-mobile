# Phase 12: Passport Grid & Cards - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the current GlassGrid and GlassCard components with a dense 3-column image grid. Each cell is a square with artist photo (cover crop), a frosted glass bottom section with 3 lines of text, and a gold founder star when applicable. Add empty states per tab and infinite scroll past 50 items. Does NOT include badge grid content (Phase 13) or any header/tab bar changes (Phase 11 — done).

</domain>

<decisions>
## Implementation Decisions

### Cell visual style
- Square cells (1:1 aspect ratio), 3-column grid, ~1px gaps between cells
- Artist photo fills entire cell with cover/crop — no letterboxing
- Frosted glass section covers bottom ~35% of cell (BlurView, neutral — no color tinting per type)
- All cell types use the same neutral frost treatment — collection type communicated through text content and badge, not glass color
- Small corner radius on cells: 6-8px (Instagram grid feel, not card feel)
- Reference: card-example.jpg right variant (frosted glass bottom section)

### Cell text layout (3 lines in frost area)
- Line 1: Artist name — 11px Poppins SemiBold, white, truncate with ellipsis
- Line 2: Context (varies by type) — 9px Poppins Regular, white/slightly muted, truncate
  - Stamps: venue name
  - Finds: platform icon + "Spotify" / "SoundCloud" / "Apple Music"
  - Discoveries: "via @username"
- Line 3: Date — 9px Poppins Regular, muted (rgba white 0.6), format "Jan 15, 2025"
- All lines truncate with ellipsis if content exceeds cell width

### Founder badge
- Small filled gold star (#FFD700), 16px, positioned top-right corner of cell
- Slight dark shadow for contrast against any photo background
- Only shown for collections where user is the founder (is_founder = true)

### Tap interaction
- Tap → artist profile screen (same as current GlassCards)
- Press animation: scale(0.97) with spring + light haptic (ImpactFeedbackStyle.Light)
- Same behavior for all cell types (Stamps, Finds, Discoveries)

### Empty states
- Style: encouraging + actionable — lucide icon (48px, muted color) + short message + CTA button
- Stamps empty: Ticket icon + "No shows yet" + "Check in at a show" → navigates to + tab
- Finds empty: Music icon + "No finds yet" + "Add an artist" → navigates to + tab
- Discoveries empty: Compass icon + "No discoveries yet" + "Discover artists" → navigates to Home search
- Badges empty: Award icon + "Earn badges by collecting artists" → no CTA button (informational only)
- CTA buttons use the pink accent color, pill style

### Infinite scroll
- Grid sorted newest-to-oldest (by created_at)
- First page: 50 items
- Infinite scroll past 50 using useInfiniteQuery (TanStack React Query)
- Loading indicator at bottom during fetch

### Claude's Discretion
- Exact BlurView intensity value for the frost section
- Loading skeleton design for cells while fetching
- Exact padding inside the frost area for the 3 text lines
- How to handle cells with no artist photo (gradient fallback already exists via getGradientForName)
- FlatList vs FlashList for the grid (performance choice)
- Android BlurView fallback behavior

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GlassGrid` (src/components/passport/GlassGrid.tsx): Current 3-column grid — needs rewrite for FlatList/infinite scroll but has useful layout math (CELL_GAP, COLUMNS, cellSize calculation)
- `GlassCard/StampGlassCard.tsx`, `FindGlassCard.tsx`, `DiscoveryGlassCard.tsx`: Current card components with haptics, press animations, gradient fallbacks — will be replaced with new unified GridCell component
- `getGradientForName()`: Deterministic gradient fallback for missing photos — reuse
- `usePassportCollectionsSplit` hook: Already splits collections by type (stamps/finds/discoveries)
- `useThemeColors()`: All components must use this
- `expo-blur` (v55.0.8): Already installed for BlurView
- `react-native-reanimated`: Already installed for press animations
- `expo-haptics`: Already installed
- `CollectionStamp` type: Base type with all needed fields (artist name, venue, date, is_founder, etc.)

### Established Patterns
- TanStack React Query useInfiniteQuery for paginated data
- expo-image for optimized image loading (cover crop via contentFit="cover")
- Poppins font family for all text
- apiCall pattern from @/lib/api for API calls
- Press animation: useSharedValue + useAnimatedStyle + withSpring(0.97)

### Integration Points
- `PassportPager.tsx`: Currently renders GlassGrid per tab — will render new grid component instead
- Passport API `/mobile/passport`: Currently returns all collections — may need pagination support for infinite scroll
- `app/artist/[id].tsx`: Artist profile screen — tap destination from grid cells
- Router: `router.push` for navigation from cells and CTA buttons

</code_context>

<specifics>
## Specific Ideas

- Reference image: bug-images/card-example.jpg — right variant with frosted glass bottom section is the visual target
- Square cells + frosted glass = Instagram grid density with premium card quality
- Neutral frost (no color tinting) keeps the grid visually calm — let the photos be the focus
- 3 lines of text gives enough context to tell the story of each collection entry at a glance

</specifics>

<deferred>
## Deferred Ideas

- Badge grid content — Phase 13
- Collection detail modal (expanded view of a single entry) — future milestone
- Custom SVG illustrations for empty states — polish pass

</deferred>

---

*Phase: 12-passport-grid-cards*
*Context gathered: 2026-03-14*
