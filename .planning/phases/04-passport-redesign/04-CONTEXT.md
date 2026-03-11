# Phase 4: Passport Redesign - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the Passport tab from a uniform list into two visually distinct sections: Finds (digital gallery with 2x3 artist card grid) and Stamps (analog passport aesthetic with circular rubber stamps on textured paper). Includes "View All" screens for both. Does NOT include share cards, celebrations, or artist fans list (those are Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Finds card design
- Hero photo fills top ~60% of card, artist name + badge + fan count + Listen button below
- 2x3 grid layout (2 columns, 3 rows visible in preview section)
- Founded cards: gold border glow. Discovered cards: purple border glow. Visually distinct at a glance.
- "Listen" button opens the source platform URL (stored as `source_url` on performers table). Single button, opens whichever platform the artist was added from.
- Tapping the card (outside Listen) navigates to artist profile screen (existing behavior)

### Stamps analog aesthetic
- Circular rubber stamp shape with dashed/dotted circle border
- Venue name arcs around/inside the circle, date in center (monospace), artist name(s) below
- Each stamp rotated slightly (-3° to +3°, deterministic by stamp ID — field already exists in CollectionStamp type)
- Ink color: Decibel pink (#FF4D6A) for all stamps
- Subtle texture treatment: light paper grain background, stamps at 85-95% opacity, dashed borders with slight fade. Modern with analog hints, not full skeuomorphic.
- Dark mode: dark leather-like texture background, stamps have subtle pink glow/shadow
- Light mode: cream/off-white paper background, stamps have no glow (just ink on paper)

### Section layout on Passport tab
- Vertical stack: Header + Stats → Finds section → Stamps section → Badges
- Finds section: 2x3 grid preview + "View All [X] Finds →" link
- Stamps section: 4-5 most recent stamps scattered with rotation on textured background + "View All [X] Stamps →" link
- Stamps background texture extends edge-to-edge (full width) — clear visual break from the clean Finds section above
- Single vertical scroll for entire Passport tab

### View All Finds screen
- Same 2-column grid card style as preview, scrollable with all Finds
- Sorted by most recent first
- No filtering or sorting controls — keep it simple for v1
- Back navigation to Passport tab

### View All Stamps screen
- Chronological list (most recent first), NOT scattered stamps
- Each entry shows circular stamp icon + venue name + date + artist name(s)
- Clean list format — easier to browse history than scattered layout
- Back navigation to Passport tab

### Claude's Discretion
- Exact card dimensions, spacing, and font sizes for Finds grid
- Paper grain texture implementation approach (image asset vs generated)
- Leather texture implementation for dark mode
- Stamp glow shadow values in dark mode
- Loading skeleton design for both sections
- Empty state illustrations
- Scroll performance optimization approach (FlatList vs ScrollView)
- Venue name arc typography treatment inside circular stamps

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CollectionStamp` component (src/components/passport/CollectionStamp.tsx): current list-row component for both Finds and Stamps — will be REPLACED, not reused. But its type detection logic (is_founder/verified → founded/collected/discovered) should be preserved.
- `CollectionStamp` type (src/types/passport.ts): already has `rotation` field, `venue`, `event_date`, `is_founder`, `verified` — all needed for both new components.
- `usePassportCollections` hook: already splits collections by `verified` flag (finds = !verified, stamps = verified). Uses infinite query with pagination.
- `PassportHeader`, `StatsBar`, `BadgeGrid`: existing components that stay as-is above/below the redesigned sections.
- `WaxSeal` component (src/components/collection/WaxSeal.tsx): tier-based seal — may reference for badge styling patterns.
- `useThemeColors()`: all components must use this for dark/light mode colors.
- `getGradientForName()`: deterministic gradient fallback for missing artist photos — reuse in Finds cards.

### Established Patterns
- TanStack React Query (useQuery/useInfiniteQuery) for all data fetching
- Zustand + MMKV for persistent client state
- expo-image for optimized image loading with transitions
- expo-linear-gradient for gradient effects
- react-native-reanimated for animations
- Poppins font family throughout (Regular 400, Medium 500, SemiBold 600, Bold 700)
- Monospace font: `Platform.OS === "ios" ? "Courier" : "monospace"`

### Integration Points
- Passport tab (app/(tabs)/passport.tsx): main screen to redesign — replace CollectionStamp list with new Finds grid + Stamps section
- `/collection` route: currently a single screen for both — needs to become two separate screens (View All Finds, View All Stamps) or a parameterized route
- `performers` table: needs `source_url` column for Listen button (may already exist from Phase 2 add-artist-link flow)
- Artist profile navigation: `router.push(\`/artist/\${slug}\`)` — same pattern for Finds card tap

</code_context>

<specifics>
## Specific Ideas

- The stamp preview section should feel like opening a passport page — edge-to-edge texture creating a clear visual break from the clean digital Finds section above
- Circular stamps with venue name + date + artist — like immigration stamps from different venues
- The overall vibe: Finds = modern digital portfolio (clean, gallery-like). Stamps = analog travel document (textured, organic, slightly imperfect rotations)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-passport-redesign*
*Context gathered: 2026-03-11*
