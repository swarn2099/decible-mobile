# Phase 4: Passport Redesign - Research

**Researched:** 2026-03-11
**Domain:** React Native UI — card grids, SVG stamp rendering, texture backgrounds, navigation routing
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Finds card design:** Hero photo fills top ~60% of card, artist name + badge + fan count + Listen button below. 2x3 grid (2 columns, 3 rows visible in preview). Founded = gold border glow, Discovered = purple border glow.
- **Listen button:** Opens `source_url` on performers table. Single button, whichever platform the artist was added from. (Implementation note: performers table uses `spotify_url`, `soundcloud_url`, `apple_music_url` separate fields — see API Gap below.)
- **Stamps analog aesthetic:** Circular rubber stamp shape, dashed/dotted circle border. Venue name arcs around/inside circle, date in center (monospace), artist name(s) below. Rotation -3° to +3° deterministic by stamp ID (field already populated by API). Ink color: #FF4D6A. Modern with analog hints, NOT full skeuomorphic.
- **Dark mode stamps:** dark leather-like texture background, subtle pink glow/shadow on stamps.
- **Light mode stamps:** cream/off-white paper background, no glow (ink on paper).
- **Section layout:** Vertical stack — Header + Stats → Finds section → Stamps section → Badges. Finds: 2x3 preview + View All link. Stamps: 4-5 most recent scattered with rotation on textured bg + View All link.
- **Stamps bg texture:** Edge-to-edge, full width — clear visual break from Finds section above.
- **View All Finds:** Same 2-column grid card style, scrollable, sorted most recent first. No filtering.
- **View All Stamps:** Chronological list (most recent first), NOT scattered. Each entry: circular stamp icon + venue name + date + artist name(s). Clean list format.
- **Single vertical scroll** for entire Passport tab.

### Claude's Discretion

- Exact card dimensions, spacing, and font sizes for Finds grid
- Paper grain texture implementation approach (image asset vs generated)
- Leather texture implementation for dark mode
- Stamp glow shadow values in dark mode
- Loading skeleton design for both sections
- Empty state illustrations
- Scroll performance optimization approach (FlatList vs ScrollView)
- Venue name arc typography treatment inside circular stamps

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PASS-01 | Finds section displays 2x3 artist card grid with hero photo, name, badge, fan count, "Listen" button | FindsGrid component using FlatList numColumns=2; expo-image for hero photo; border glow via shadowColor/elevation; Listen via Linking.openURL |
| PASS-02 | Founded cards have gold border glow; Discovered cards have purple border | borderColor from colors.gold/colors.purple + shadowColor prop + shadowOpacity/Radius/Offset for iOS glow effect |
| PASS-03 | "View All [X] Finds" link below grid opens scrollable full collection | New route app/collection/finds.tsx with FlatList numColumns=2; router.push('/collection/finds') |
| PASS-04 | Stamps section has paper grain texture background with analog passport aesthetic | Image background with semi-transparent paper grain PNG asset; stamps rendered as SVG circles with rotate transform |
| PASS-05 | Each stamp rotated slightly (-3° to +3°, deterministic by stamp ID) | rotation field already returned by passport API (getSeededRotation in route); apply as transform: [{rotate: `${stamp.rotation}deg`}] |
| PASS-06 | Stamp shows venue name (prominent), date (monospace), artist name(s) | SVG-based circular stamp with SvgText for arc effect OR View-based circular stamp using border radius |
| PASS-07 | Dark mode: dark leather texture, stamps with slight glow. Light mode: cream/lighter, no glow | Two texture image assets (dark/light) selected by colors.isDark; glow via shadowColor only in dark mode |
| PASS-08 | "View All Stamps" opens chronological list (most recent first) | New route app/collection/stamps.tsx; FlatList with stamp list rows; router.push('/collection/stamps') |
</phase_requirements>

---

## Summary

Phase 4 transforms the Passport tab from a uniform list of `CollectionStamp` rows into two visually distinct sections. Finds become a gallery-style 2x3 card grid. Stamps become an analog passport page with rotated circular stamps on a textured background.

The existing codebase is well-prepared: `CollectionStamp` type already has `rotation`, `venue`, `event_date`, `is_founder`, and `verified` fields. The passport API (`/mobile/passport`) already computes `rotation` server-side using `getSeededRotation(id)`. The main screen already splits collections into `finds` and `stamps` arrays. The work is primarily new component authoring and replacing the current `CollectionStamp` list rows.

Two gaps require resolution: (1) the passport API does not return platform URL fields (`spotify_url`/`soundcloud_url`/`apple_music_url`) needed for the Listen button — the API and types must be updated; (2) the passport API does not return a Decibel fan count per artist (distinct from the user's own `scan_count`) — either derive it from available data or omit from preview (showing only the user's own relationship indicator). The `collection.tsx` route must be split or parameterized into separate Finds and Stamps screens.

**Primary recommendation:** Build three new components (`FindCard`, `FindsGrid`, `PassportStamp`), update the passport API to return `platform_url`, split `collection.tsx` into `collection/finds.tsx` and `collection/stamps.tsx`, then rewire `passport.tsx` to use the new sections.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-svg | 15.15.3 | Circular stamp SVG paths, arc text, decorative borders | Already installed; needed for stamp circle shape |
| expo-image | ~55.0.6 | Hero photo in Finds cards with transitions | Already installed; better caching than RN Image |
| expo-linear-gradient | ~55.0.8 | Gradient fallback when artist has no photo | Already installed and in use |
| react-native-reanimated | 4.2.1 | Scroll animations, skeleton pulse | Already installed |
| expo-haptics | ~55.0.8 | Haptic on Listen button press (optional) | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Linking (react-native) | built-in | Open platform URLs for Listen button | openURL for spotify_url/soundcloud_url/apple_music_url |
| expo-blur | ~55.0.8 | Not needed for stamps | Already used for tab bar only |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SVG circular stamp | View with borderRadius + dashed border | View approach is simpler but dashed borderStyle not supported on iOS for Views in all cases — use SVG dashed stroke for reliable dashed circle border |
| Image-based paper texture | Generated noise (no library) | Image asset is simpler and more controllable; generated noise requires additional library |
| FlatList numColumns=2 | Manual row-pair mapping | FlatList is standard RN pattern; manual rows introduce more layout bugs |

**Installation:** No new packages required. All needed libraries already installed.

---

## Architecture Patterns

### Recommended Project Structure

New files to create:
```
src/components/passport/
├── FindCard.tsx           # Single 2-column card for Finds grid
├── FindsGrid.tsx          # 2x3 preview grid + View All link
├── PassportStamp.tsx      # Individual circular stamp (SVG-based)
├── StampsSection.tsx      # Textured bg container with scattered stamps preview

app/collection/
├── finds.tsx              # View All Finds screen (full grid)
└── stamps.tsx             # View All Stamps screen (list)
```

Modified files:
```
app/(tabs)/passport.tsx         # Replace CollectionStamp lists with FindsGrid + StampsSection
app/collection.tsx              # Keep or redirect; both new routes take over functionality
src/types/passport.ts           # Add platform_url field to PassportTimelineEntry
~/decibel/src/app/api/mobile/passport/route.ts  # Add platform_url to response
```

### Pattern 1: Finds Card — 2-Column FlatList
**What:** FlatList with numColumns=2 renders a gallery grid. Each card: expo-image hero photo, name, badge indicator, Listen button.
**When to use:** Preview (6 items) on Passport tab and full list on View All screen.
**Example:**
```typescript
// FlatList grid pattern (standard RN)
<FlatList
  data={finds.slice(0, 6)}
  numColumns={2}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <FindCard stamp={item} />}
  columnWrapperStyle={{ gap: 8, paddingHorizontal: 16 }}
  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
  scrollEnabled={false}  // Parent ScrollView handles scroll
/>
```

### Pattern 2: FindCard Border Glow
**What:** iOS shadow props create a glow effect. Android elevation adds drop shadow.
**When to use:** Founded = gold glow (#FFD700), Discovered = purple glow (#9B6DFF).
```typescript
// Source: React Native shadow props
const glowColor = stamp.is_founder ? colors.gold : colors.purple;
const cardStyle = {
  borderRadius: 12,
  borderWidth: 1.5,
  borderColor: glowColor,
  // iOS glow
  shadowColor: glowColor,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.6,
  shadowRadius: 8,
  // Android
  elevation: 4,
  backgroundColor: colors.card,
};
```

### Pattern 3: Circular SVG Stamp
**What:** react-native-svg renders the rubber stamp circle shape. View-based transform applies rotation.
**When to use:** Each stamp in the Stamps section preview.
```typescript
// Circular stamp using SVG dashed circle
import Svg, { Circle, Text as SvgText } from "react-native-svg";

// Outer dashed border circle
<Circle
  cx={cx} cy={cy} r={radius - strokeWidth / 2}
  stroke="#FF4D6A"
  strokeWidth={2}
  strokeDasharray="4 3"
  fill="none"
  opacity={0.9}
/>

// Rotation via transform on wrapping View
<View style={{ transform: [{ rotate: `${stamp.rotation}deg` }] }}>
  <PassportStamp stamp={stamp} />
</View>
```

### Pattern 4: Arc Text for Venue Name
**What:** SVG `textPath` along a circular arc path renders venue name curving around the top of the stamp circle.
**When to use:** Venue name arc inside the circular stamp.
**Caution:** `react-native-svg` supports `textPath` but it requires `Defs` + `Path` + `TextPath`. Test on both platforms early — font rendering on arc can differ between iOS and Android. Fallback: render venue name as straight text above the date inside the circle if arc proves unreliable.
```typescript
import Svg, { Defs, Path as SvgPath, Text as SvgText, TextPath } from "react-native-svg";

// Arc path for top half of circle
const arcPath = `M ${cx - r * 0.8},${cy} A ${r * 0.8},${r * 0.8} 0 0,1 ${cx + r * 0.8},${cy}`;
<Defs>
  <SvgPath id="venueArc" d={arcPath} />
</Defs>
<SvgText fill="#FF4D6A" fontSize={9} fontFamily="Poppins-SemiBold">
  <TextPath href="#venueArc" startOffset="50%" textAnchor="middle">
    {stamp.venue?.name?.toUpperCase() ?? "LIVE MUSIC"}
  </TextPath>
</SvgText>
```

### Pattern 5: Texture Background for Stamps Section
**What:** `ImageBackground` from react-native renders a repeating or full-bleed texture behind stamps.
**When to use:** Full-width stamps section container.
```typescript
import { ImageBackground } from "react-native";

// Two assets: assets/textures/paper-grain-light.png and paper-grain-dark.png
const textureSource = colors.isDark
  ? require("../../assets/textures/leather-dark.png")
  : require("../../assets/textures/paper-grain-light.png");

<ImageBackground
  source={textureSource}
  style={{ width: "100%", paddingVertical: 24 }}
  imageStyle={{ opacity: colors.isDark ? 0.15 : 0.25 }}
  resizeMode="repeat"
>
  {/* Scattered stamps */}
</ImageBackground>
```

### Pattern 6: Route Splitting for View All Screens
**What:** Expo Router file-based routing. Current `app/collection.tsx` becomes two separate screens.
**When to use:** "View All Finds" and "View All Stamps" links.
```typescript
// New files:
// app/collection/finds.tsx  — View All Finds (grid)
// app/collection/stamps.tsx — View All Stamps (list)

// Navigation from passport.tsx:
router.push("/collection/finds");
router.push("/collection/stamps");

// Each screen needs a layout if not already set — add app/collection/_layout.tsx
// OR use a simple Stack navigator pattern via the existing _layout.tsx structure
```

### Anti-Patterns to Avoid

- **Nested FlatList inside ScrollView:** The main passport scroll is `Animated.ScrollView`. The Finds grid preview uses `scrollEnabled={false}` on FlatList to avoid nested scroll conflict. View All screens use their own full FlatList with scrolling enabled.
- **Hardcoded dimensions:** Card width must derive from `(screenWidth - 16 * 2 - gap) / 2` using `Dimensions.get('window').width`. Never hardcode px for card sizes.
- **Arc text with long venue names:** Cap venue name display at ~20 characters in arc form. Long names break the arc layout. Truncate with `...` or fall back to straight text.
- **Rotation applied to stamps background:** Only the stamp component itself rotates, NOT the surrounding texture background. Texture stays flat.
- **Using `text-white` or hardcoded colors:** All text and backgrounds via `useThemeColors()` tokens. Stamp ink color (#FF4D6A) is a design constant, not a theme token — use it directly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hero image loading + placeholder | Custom image loader | `expo-image` with `transition` + `contentFit="cover"` | Handles caching, transitions, blurhash placeholders |
| Dashed circle border | Pure View with borderStyle | SVG Circle with strokeDasharray | React Native borderStyle dashed is unreliable on iOS for circles |
| Seeded rotation | Custom hash function | Already in API response (`rotation` field from `getSeededRotation`) | Don't duplicate the calculation on the client |
| Open platform URL | Custom in-app browser | `Linking.openURL(url)` | Standard RN pattern, opens native app if installed |
| Fan count per artist | Separate API call per card | Include in passport API response OR use collections count from existing data | N+1 query problem if called per card |

**Key insight:** The `rotation` field is already computed server-side and returned in the `CollectionStamp` type. Do not re-derive it on the client.

---

## Critical API Gap: Listen Button

**Problem:** The CONTEXT.md specifies a "Listen" button that opens `source_url`. However:
- The performers table has SEPARATE fields: `spotify_url`, `soundcloud_url`, `apple_music_url` — not a single `source_url` column.
- The passport API currently selects: `performers!inner (id, name, slug, photo_url, genres, city)` — none of the platform URL fields are fetched or returned.

**Resolution required:**
1. Update passport API Supabase query to also select `spotify_url, soundcloud_url, apple_music_url` from performers.
2. In the stamps mapping, derive a single `platform_url` from whichever field is non-null (prefer Spotify > SoundCloud > Apple Music).
3. Add `platform_url: string | null` to `PassportTimelineEntry` type in `src/types/passport.ts`.
4. `FindCard` renders "Listen" button only when `platform_url` is non-null.

**Effort:** Small — one API file change, one type addition, one conditional render. Must happen in Wave 1 before FindCard is built.

---

## Critical Gap: Decibel Fan Count

**Problem:** PASS-01 spec requires "fan count" on each Finds card. The passport API returns `scan_count` (this user's scans of the artist) and `current_tier`, but NOT a global Decibel fan count (how many fans total have added this artist).

**Options:**
1. **Show the user's own scan_count** (already in data) — misleading label, not "fans".
2. **Omit fan count entirely from Finds cards** — simpler, no API change.
3. **Add fan_count to passport API** — requires `SELECT COUNT(*) FROM collections WHERE performer_id = x` for each collection. Expensive for large collections (N queries or a subselect).
4. **Show a computed Decibel fan count badge using collections subquery** — add to passport API as a subselect on collections grouped by performer_id.

**Recommendation:** Use option 3 — add `fan_count` as a subselect in the passport API. This is the cleanest approach. The query is:
```sql
SELECT performer_id, COUNT(DISTINCT fan_id) as fan_count
FROM collections
WHERE performer_id = ANY(array_of_performer_ids)
GROUP BY performer_id
```
This runs ONCE for all performers, not per-performer. Add `fan_count: number` to the performer object in the API response and type.

---

## Common Pitfalls

### Pitfall 1: FlatList `scrollEnabled={false}` Inside ScrollView
**What goes wrong:** React Native warns about nested VirtualizedLists inside ScrollViews and scroll events get confused.
**Why it happens:** Passport tab uses `Animated.ScrollView` as the outer scroll. FlatList is a VirtualizedList internally.
**How to avoid:** Set `scrollEnabled={false}` on the inner FlatList. This disables FlatList's own scroll handling while preserving layout virtualization benefits. For preview (6 items max), this is fine — no virtualization benefit anyway, could even use a plain `View` with mapped items.
**Warning signs:** Yellow console warning "VirtualizedLists should never be nested inside plain ScrollViews".

### Pitfall 2: Card Width Calculation
**What goes wrong:** Cards overflow or have inconsistent gaps.
**Why it happens:** Hardcoded widths don't account for padding and gap.
**How to avoid:**
```typescript
import { Dimensions } from "react-native";
const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_GAP = 8;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;
```

### Pitfall 3: SVG textPath Rendering
**What goes wrong:** Arc text renders incorrectly on Android or overflows the circle.
**Why it happens:** Font metrics differ between iOS/Android. Long venue names push text outside the arc.
**How to avoid:** Truncate venue names to 18-20 characters before rendering as arc text. Always test on both platforms. Have a straight-text fallback ready.
**Warning signs:** Text appearing clipped or outside the SVG viewBox.

### Pitfall 4: Route Collision with Existing collection.tsx
**What goes wrong:** `app/collection.tsx` and `app/collection/` directory both exist — Expo Router may not resolve correctly.
**Why it happens:** File-based routing doesn't support a file and directory with the same name.
**How to avoid:** Either (a) delete `app/collection.tsx` and create `app/collection/finds.tsx` + `app/collection/stamps.tsx` + `app/collection/_layout.tsx`, or (b) rename existing collection.tsx and redirect old links. Option (a) is cleaner.

### Pitfall 5: Texture Image Assets
**What goes wrong:** Bundler can't find texture assets if paths use dynamic variables.
**Why it happens:** Metro bundler requires static `require()` calls — cannot use `require(dynamicPath)`.
**How to avoid:** Use conditional static requires:
```typescript
const textureSource = colors.isDark
  ? require("../../assets/textures/leather-dark.png")
  : require("../../assets/textures/paper-grain-light.png");
```
Never build the path as a string variable.

### Pitfall 6: Bottom Padding for Floating Tab Bar
**What goes wrong:** Last content (Badges section) hidden behind floating tab bar.
**Why it happens:** Tab bar floats over content without consuming layout space.
**How to avoid:** The existing `contentContainerStyle={{ paddingBottom: 100 }}` on the passport ScrollView handles this. Ensure View All screens also have `paddingBottom: 100` in their FlatList `contentContainerStyle`.

---

## Code Examples

### FindCard Component Shape
```typescript
// Source: project conventions + CONTEXT.md spec
type FindCardProps = {
  stamp: CollectionStamp;  // existing type
  cardWidth: number;
};

// Card height: ~cardWidth * 1.4 gives good vertical proportion
// Hero photo: top 60% of card height
// Info row: bottom 40%
```

### Stamp Section Preview Layout
```typescript
// Source: CONTEXT.md decisions
// 4-5 stamps scattered — use absolute positioning within a fixed-height container
// OR use a flex-wrap row with overlapping margins for "scattered" feel
// Recommendation: flex-wrap with negative margins and random-ish offsets driven by index

const SCATTER_OFFSETS = [
  { marginTop: 0, marginLeft: 0 },
  { marginTop: -12, marginLeft: 8 },
  { marginTop: 4, marginLeft: -4 },
  { marginTop: -8, marginLeft: 16 },
  { marginTop: 8, marginLeft: -8 },
];
// Apply offsets[index % 5] to each stamp View
```

### Deriving platform_url in Passport API
```typescript
// Source: add-artist route pattern
// In passport/route.ts stamp mapping:
const p = performer as Record<string, unknown>;
const platformUrl =
  (p.spotify_url as string | null) ??
  (p.soundcloud_url as string | null) ??
  (p.apple_music_url as string | null) ??
  null;
// Add to performer object in response: platform_url: platformUrl
```

### View All Finds — FlatList with numColumns=2
```typescript
// Source: React Native FlatList docs
<FlatList
  data={finds}
  numColumns={2}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <FindCard stamp={item} cardWidth={CARD_WIDTH} />}
  columnWrapperStyle={{ gap: 8, paddingHorizontal: 16 }}
  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
  contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
/>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CollectionStamp list rows for both Finds+Stamps | Finds = card grid, Stamps = circular analog stamps | Phase 4 | Full visual redesign of Passport tab |
| Single `/collection` route | Split `/collection/finds` and `/collection/stamps` | Phase 4 | Route must be refactored |
| No platform URL in passport API | Add `platform_url` field | Phase 4 | Required for Listen button |

**Deprecated/outdated:**
- `CollectionStamp` component (the list-row version): replaced by `FindCard` (for Finds) and `PassportStamp` (for Stamps). The component file will be replaced entirely. Preserve the type-detection logic (`is_founder/verified → founded/collected/discovered`).

---

## Open Questions

1. **Texture image assets — do they exist?**
   - What we know: `assets/` has `animations/`, `icon.png`, `splash-icon.png` — no texture files
   - What's unclear: Do we source them from a stock site, generate procedurally, or use a subtle CSS-like tiled PNG?
   - Recommendation: Wave 0 task — create two minimal PNG texture tiles (paper grain light, leather dark). Options: (a) download a free CC0 texture from Unsplash/Pexels, (b) use a very subtle repeated 100x100 noise pattern generated offline. The asset must exist before `StampsSection` is built.

2. **Fan count display — confirm "Decibel fan count" vs "scan count"**
   - What we know: `scan_count` is per-user. Global fan count requires an extra query in the passport API.
   - What's unclear: Is showing scan_count (user's own check-ins at the artist) acceptable instead of global fan count?
   - Recommendation: Add global `fan_count` to passport API via a single grouped query (Option 3 from API Gap section). It's the right data for the design intent and the query cost is low.

3. **Expo Router: file vs directory conflict for `/collection`**
   - What we know: `app/collection.tsx` currently exists as a single screen.
   - What's unclear: Does Expo Router SDK 55 allow `app/collection.tsx` to coexist with `app/collection/` directory?
   - Recommendation: Expo Router does NOT support this. Delete `app/collection.tsx` and replace with directory. Handle this in Wave 0 as a pre-existing route migration. The old route linked from passport.tsx with `router.push("/collection")` — update those to the new routes during refactor.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | No test framework detected (no jest.config, no vitest.config, no __tests__ dir) |
| Config file | None — Wave 0 gap |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PASS-01 | Finds grid renders 2 columns, shows hero photo + badge + Listen button | manual-only | Visual verification on device | N/A |
| PASS-02 | Founded = gold glow, Discovered = purple glow, visually distinct | manual-only | Both themes on device | N/A |
| PASS-03 | View All Finds link navigates to finds screen with full grid | manual-only | Tap test on device | N/A |
| PASS-04 | Stamps section has textured background, analog aesthetic | manual-only | Visual verification both themes | N/A |
| PASS-05 | Stamps rotate deterministically by ID | manual-only | Verify same stamps rotate same amount across sessions | N/A |
| PASS-06 | Stamp content: venue name, date (monospace), artist name | manual-only | Verify stamp data fields render | N/A |
| PASS-07 | Dark = leather+glow, Light = cream+no glow | manual-only | Toggle device theme | N/A |
| PASS-08 | View All Stamps opens chronological list | manual-only | Tap test + verify sort order | N/A |

**Justification for manual-only:** No test framework exists in the project. All PASS requirements are pure visual/interaction requirements with no logic to unit test. The `rotation` computation is server-side (already in API, not mobile). The critical testable unit — platform_url derivation logic — is server-side in passport/route.ts.

### Sampling Rate
- **Per task commit:** Build check (`npx expo export --platform ios 2>&1 | tail -5`)
- **Per wave merge:** EAS preview update + visual verification on device
- **Phase gate:** TypeScript zero-error build + visual QA both themes before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `assets/textures/paper-grain-light.png` — needed by PASS-04, PASS-07
- [ ] `assets/textures/leather-dark.png` — needed by PASS-04, PASS-07
- [ ] `app/collection/_layout.tsx` — needed for PASS-03, PASS-08 (route directory)
- [ ] Delete `app/collection.tsx` — conflicts with new directory structure
- [ ] Update passport API `performers` select to include `spotify_url, soundcloud_url, apple_music_url` — needed for PASS-01 Listen button

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `src/types/passport.ts`, `src/hooks/usePassport.ts`, `app/(tabs)/passport.tsx`, `src/components/passport/CollectionStamp.tsx`, `src/components/collection/WaxSeal.tsx`, `app/collection.tsx`
- Backend API inspection — `~/decibel/src/app/api/mobile/passport/route.ts`, `add-artist/route.ts`
- Package.json — confirmed all required libraries installed (react-native-svg 15.15.3, expo-image 55.0.6, lottie-react-native 7.3.4, react-native-reanimated 4.2.1)
- `src/constants/colors.ts` — full theme token map confirmed

### Secondary (MEDIUM confidence)
- React Native FlatList `numColumns` pattern — standard documented behavior
- Expo Router file-based routing directory/file collision — based on Expo Router documented behavior (file + same-name directory not supported)
- react-native-svg `textPath` support — documented in react-native-svg README

### Tertiary (LOW confidence)
- Texture asset strategy (paper grain PNG) — recommendation based on common RN patterns, not verified against a specific library

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed in package.json, versions verified
- Architecture: HIGH — based on direct codebase inspection, existing patterns, confirmed API shape
- Pitfalls: HIGH — FlatList/ScrollView conflict and route collision are well-known Expo Router constraints; texture require() is documented Metro behavior
- API gaps: HIGH — directly inspected passport/route.ts and confirmed missing fields

**Research date:** 2026-03-11
**Valid until:** 2026-04-10 (stable dependencies, 30-day window)
