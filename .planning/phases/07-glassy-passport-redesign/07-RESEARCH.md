# Phase 7: Glassy Passport Redesign - Research

**Researched:** 2026-03-12
**Domain:** React Native glassmorphism, react-native-pager-view, Reanimated v4 animations, Supabase DB migrations
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Page layout & header**
- PassportHeader (avatar, name, stats, followers) stays pinned above the 3-tab pager
- Share Passport button lives inside the header area, below stats row, above the tab bar — always visible
- Badges section sits below the tab pager as a separate scrollable area
- Tab indicator: frosted glass pill behind active tab label (blur + semi-transparent), matching the glassmorphic theme
- Tab switching via tap AND swipe gesture (react-native-pager-view)
- Leaderboard trophy button remains as absolute overlay (top-right, zIndex 10)

**Glass card content**
- Full bleed photo fills entire card. All text overlays on a frosted glass strip at the bottom of the card
- Stamp cards (pink tint): Artist name + Venue name + Date + Founder badge if applicable
- Find cards (purple tint): Artist name + Platform icon + Listener count + Founder ★ badge
- Discovery cards (blue tint): Artist name + "via @finder" (tappable → finder profile) + compass badge
- Tint applied to the glass strip only — photo stays clean, no border glow or photo overlay
- Each card has slight rotation (-2° to +2°, deterministic from collection ID hash)
- Press-in animation (scale 0.97, spring back) + light haptic on card tap (GPASS-08)
- Card tap → artist profile. On Discovery cards, "@finder" text is a separate tappable link → finder profile
- 2x4 grid preview per tab. Cards with fewer than 8 entries display without empty placeholders (GPASS-13)

**Discovery type mapping**
- Finds tab = Founded artists ONLY (gold ★). Prestige collection.
- Discoveries tab = Discovered artists (purple compass, online but not first). Includes existing "discovered" collections.
- Stamps tab = Collected/Verified (live attendance at venues)
- MIG-06 backfill required: Run migration to set collection_type='discovery' on all existing collections where capture_method='online' AND is_founder=false. Discoveries tab populates immediately on launch.
- Empty Finds state: CTA with illustration + "Be the first to find an underground artist" + button routing to + tab
- Empty Stamps/Discoveries: similar CTAs

**Orb & background style**
- 3 animated gradient orbs — one pink (#FF4D6A), one purple (#9B6DFF), one blue (#4D9AFF)
- Orbs render behind the entire passport screen including header — full immersive glassmorphic feel
- Orb colors shift based on active tab: Stamps → pink emphasis, Finds → purple/gold emphasis, Discoveries → blue emphasis. Smooth transition on tab swipe.
- Movement: slow drift, low-opacity blurred circles (~30% opacity dark mode)
- Light mode: Same orbs at ~15-20% opacity. Glass cards get lighter blur tint.
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MIG-01 | `collection_type` column backfilled from legacy `capture_method` on existing collections | SQL migration: ADD COLUMN collection_type + UPDATE from capture_method; passport API must read collection_type |
| MIG-05 | Embed URL columns added to `performers` table (spotify_embed_url, soundcloud_embed_url, apple_music_embed_url, top_track_cached_at) | SQL migration: ALTER TABLE performers ADD COLUMN; not queried in Phase 7 but required for Phase 8 Jukebox |
| MIG-06 | `discovery` type added to collections type constraint | SQL: UPDATE collections SET collection_type='discovery' WHERE capture_method='online' AND is_founder=false (via founder_badges join) |
| MIG-07 | Unique constraint on `performers.spotify_id` to prevent simultaneous Founder race condition | SQL: ALTER TABLE performers ADD CONSTRAINT performers_spotify_id_key UNIQUE (spotify_id); validate-artist-link already writes spotify_id |
| GPASS-01 | Passport screen has three horizontal tabs: Stamps / Finds / Discoveries | react-native-pager-view PagerView + custom tab bar above |
| GPASS-02 | Tab switching via tap and swipe gesture | PagerView handles swipe natively; tab bar tap sets page via ref.setPage() |
| GPASS-03 | Each tab shows 2x4 grid of frosted glass cards as preview | GlassGrid component — 8 cards max, no empty placeholders |
| GPASS-04 | Cards have backdrop blur, soft shadow, slight rotation, transparent borders | expo-blur BlurView with blurMethod='dimezisBlurViewSdk31Plus' on Android; shadow via Platform.select |
| GPASS-05 | Stamp cards show artist + venue + date + Founder badge, pink tint | StampGlassCard component with pink rgba glass strip |
| GPASS-06 | Find cards show artist + platform icon + listener count + Founder badge, purple tint | FindGlassCard with purple rgba glass strip |
| GPASS-07 | Discovery cards show artist + "via @username", blue tint, slightly more transparent | DiscoveryGlassCard; needs finder_username in API response |
| GPASS-08 | Haptic (Light) + press-in scale 0.97 spring back on card tap | Reanimated useAnimatedStyle + Pressable onPressIn/Out + Haptics.impactAsync(Light) |
| GPASS-09 | "View More" button navigates to dedicated full page per tab | 3 routes: /collection/stamps, /collection/finds, /collection/discoveries |
| GPASS-10 | View More page: search bar, newest-to-oldest, infinite scroll (20 items/page) | useInfiniteQuery + FlatList + TextInput search filter; passport API already paginates |
| GPASS-11 | Animated gradient orbs behind cards on passport background | Reanimated withRepeat + withTiming for drift; orb opacity shifts via interpolate on activeTab shared value |
| GPASS-12 | BlurView acceptable on iOS and Android (fallback on low-end Android) | Use blurMethod='dimezisBlurViewSdk31Plus' — native blur SDK31+, falls back to 'none' (semi-transparent) automatically |
| GPASS-13 | Cards with fewer than 8 entries display correctly without empty placeholders | Slice to min(8, items.length); flexWrap grid naturally handles fewer items |
| GPASS-14 | Existing BlurView components updated to SDK 55 BlurTargetView pattern | Import BlurTargetView from expo-blur; wrap background View ref; pass blurTarget prop to BlurView |
</phase_requirements>

---

## Summary

Phase 7 replaces the current vertical Finds/Stamps scroll with an immersive glassmorphic Passport: three-tab pager (Stamps / Finds / Discoveries), frosted glass cards with full-bleed photos, animated orb background, and View More full-page screens.

The codebase is in good shape for this: Reanimated 4.2.1 and expo-blur 55.0.9 are already installed. The current `FindCard` already has full-bleed photo + bottom glass strip — the new GlassCard variants are an evolution of that pattern, not a rewrite from scratch. The main new install is `react-native-pager-view`.

Four DB migrations are needed before any mobile work. Three are additive (new columns on performers + collection_type column) and one is a data backfill (set collection_type='discovery' on existing online-discovered collections). The passport API needs to return `collection_type` and `finder_username` for the new card variants.

**Primary recommendation:** Do DB migrations first (Wave 0), then wire the API, then build the UI in layers — orb background → pager/tabs → glass cards → View More pages → BlurView fixes.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-pager-view | latest | Swipeable tab pages | Native ViewPager2 on Android, UIPageViewController on iOS — smooth, gesture-native, Expo-compatible |
| expo-blur | 55.0.9 | BlurView + BlurTargetView | Already installed; BlurTargetView pattern is SDK 55's cross-platform blur solution |
| react-native-reanimated | 4.2.1 | Orb animations, press-in scale, tab color transitions | Already installed; withRepeat + withTiming is the established pattern in this codebase |
| expo-haptics | 55.0.8 | Light impact on card tap | Already installed; ImpactFeedbackStyle.Light for card press |
| expo-linear-gradient | 55.0.8 | Orb gradient circles + glass strip gradient | Already installed; used throughout app |
| expo-image | 55.0.6 | Artist photo in cards | Already installed; handles caching and contentFit="cover" |
| @tanstack/react-query | 5.90.21 | Data fetching + infinite scroll | Already established; useInfiniteQuery for View More pages |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react-native | installed | Platform icons (Spotify/SoundCloud), badges | Star, Compass, Music icons for card badges |
| react-native-svg | installed | Already used in StampsSection for SVG stamp marks | Avoid for new glass cards — use View/LinearGradient |

### New Install Required
```bash
npm install react-native-pager-view
```

No additional Expo config changes needed — pager-view works with Expo managed workflow (SDK 55) without a custom native module step.

---

## Architecture Patterns

### Recommended File Structure
```
app/(tabs)/passport.tsx                    — REWRITE: header + orb bg + pager + badges
app/collection/finds.tsx                   — REWRITE: glass card grid + search + infinite scroll
app/collection/stamps.tsx                  — REWRITE: glass card grid + search + infinite scroll
app/collection/discoveries.tsx             — CREATE: new third route
app/collection/_layout.tsx                 — keep as-is

src/components/passport/
  PassportHeader.tsx                       — ADAPT: add Share button below stats
  GlassCard/
    StampGlassCard.tsx                     — CREATE
    FindGlassCard.tsx                      — CREATE
    DiscoveryGlassCard.tsx                 — CREATE
  GlassGrid.tsx                            — CREATE: 2x4 grid wrapper
  OrbBackground.tsx                        — CREATE: animated orb layer
  PassportPager.tsx                        — CREATE: PagerView + frosted glass tab bar
  BadgeGrid.tsx                            — KEEP as-is
  BadgeDetailModal.tsx                     — KEEP as-is
  ShareSheet.tsx                           — KEEP as-is

src/hooks/usePassport.ts                   — EXTEND: split into 3 categories (stamps/finds/discoveries)

src/types/passport.ts                      — EXTEND: add collection_type + finder_username fields

supabase/migrations/
  20260312_collection_type.sql             — MIG-01 + MIG-06
  20260312_performers_embed_urls.sql       — MIG-05
  20260312_performers_spotify_unique.sql   — MIG-07

~/decibel/src/app/api/mobile/passport/route.ts  — EXTEND: return collection_type + finder_username
```

### Pattern 1: BlurTargetView (SDK 55 Android fix — GPASS-14)

The SDK 55 BlurView Android pattern requires a ref on the View that should be blurred, then pass that ref as `blurTarget` to BlurView. BlurView must be **positioned on top of** BlurTargetView (absolute), not wrapping it.

**Old pattern (breaks on Android SDK 55):**
```tsx
// WRONG — BlurView as container
<BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
  <ModalContent />
</BlurView>
```

**New pattern (SDK 55 BlurTargetView):**
```tsx
// Source: expo-blur 55.0.9 BlurTargetView.types.d.ts
import { BlurView, BlurTargetView } from 'expo-blur';
import { useRef } from 'react';
import { View } from 'react-native';

const bgRef = useRef<View>(null);

// BlurTargetView wraps the background content
<BlurTargetView ref={bgRef} style={StyleSheet.absoluteFill}>
  <OrbBackground />  {/* the blurred background */}
</BlurTargetView>

// BlurView sits on top, references the target
<BlurView
  blurTarget={bgRef}
  intensity={60}
  tint="dark"
  blurMethod="dimezisBlurViewSdk31Plus"
  style={StyleSheet.absoluteFill}
/>

{/* Modal/card content on top */}
<ModalContent />
```

For the 3 existing components (StampAnimationModal, SharePrompt, ConfirmationModal), they currently use `<BlurView tint="dark">` as a container for all modal content. The fix is to:
1. Wrap the underlying screen content in a `BlurTargetView` with a ref
2. Replace the `<BlurView>` container with a `<View>` for content layout
3. Add a separate `<BlurView blurTarget={ref} ...>` as an absolute underlay

For glass cards, BlurView wraps just the glass strip at the bottom (small target, low performance risk):
```tsx
// Glass strip on card bottom — inline blur approach
<BlurView
  intensity={40}
  tint={isDark ? "dark" : "light"}
  blurMethod="dimezisBlurViewSdk31Plus"
  style={{
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  }}
>
  {/* colored tint overlay on top of blur */}
  <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: tintColor, opacity: 0.3 }} />
  {/* text content */}
</BlurView>
```

**Note:** For glass cards, the strip IS the BlurView (not needing BlurTargetView) because the artist photo behind it is rendered in the same view hierarchy. BlurTargetView is only required when blurring content OUTSIDE the component's own stacking context (e.g., a modal blurring the screen behind it).

### Pattern 2: Orb Background (GPASS-11)

Three blurred gradient circles that drift slowly. Use Reanimated `withRepeat` + `withTiming` for autonomous drift. Tab color shift: interpolate orb opacity based on `activeTabIndex` shared value.

```tsx
// Source: established pattern using Reanimated 4.2.1 (matches SkeletonLoader withRepeat pattern)
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence,
  interpolate, Easing,
} from 'react-native-reanimated';

// Each orb gets independent drift offsets
const orbX = useSharedValue(0);
const orbY = useSharedValue(0);

useEffect(() => {
  orbX.value = withRepeat(
    withSequence(
      withTiming(20, { duration: 4000, easing: Easing.inOut(Easing.sine) }),
      withTiming(-20, { duration: 4000, easing: Easing.inOut(Easing.sine) }),
    ),
    -1, true
  );
  orbY.value = withRepeat(
    withSequence(
      withTiming(15, { duration: 5000, easing: Easing.inOut(Easing.sine) }),
      withTiming(-15, { duration: 5000, easing: Easing.inOut(Easing.sine) }),
    ),
    -1, true
  );
}, []);

// Tab-based opacity shift
const orbOpacity = useAnimatedStyle(() => ({
  opacity: interpolate(activeTabIndex.value, [0, 1, 2], [0.12, 0.20, 0.28]),
}));
```

Orb rendering: each orb is an `Animated.View` containing a `LinearGradient` with `borderRadius: 9999` and `filter`-like blur via wrapping in a `View` with `overflow: 'hidden'`. Since RN doesn't have CSS filter blur, use large `blurRadius` on an `Image` or use `expo-blur BlurView` wrapping the gradient circle.

**Recommended approach for orb blur:** Render orbs as `LinearGradient` circles with low opacity. The perceived blur comes from low opacity + large size, not actual pixel blur. This avoids stacking BlurView instances (performance). Add `expo-blur BlurView` only for the card glass strips.

### Pattern 3: react-native-pager-view PagerView

PagerView provides native-level swipe with `onPageSelected` callback. Tab bar is a custom component above the pager that tracks `activeIndex`.

```tsx
// Source: react-native-pager-view docs (stable API, verified pattern)
import PagerView from 'react-native-pager-view';
import { useRef } from 'react';

const pagerRef = useRef<PagerView>(null);
const [activeTab, setActiveTab] = useState(0);

// Tap on tab label
const handleTabPress = (index: number) => {
  pagerRef.current?.setPage(index);
};

// Swipe callback
const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
  setActiveTab(e.nativeEvent.position);
};

<PagerView
  ref={pagerRef}
  style={{ flex: 1 }}
  initialPage={0}
  onPageSelected={handlePageSelected}
>
  <View key="0"><StampsTab /></View>
  <View key="1"><FindsTab /></View>
  <View key="2"><DiscoveriesTab /></View>
</PagerView>
```

**Critical:** Each page child needs a `key` prop matching its index string. PagerView is zero-indexed; page 0 = Stamps, 1 = Finds, 2 = Discoveries.

For Reanimated-based tab indicator (frosted glass pill), use a shared value that tracks page index and interpolate the pill's translateX. Connect it via `onPageScroll` for smooth in-progress animation:

```tsx
const tabOffset = useSharedValue(0); // 0..2

// onPageScroll for smooth animation during swipe
const handlePageScroll = (e: { nativeEvent: { position: number; offset: number } }) => {
  tabOffset.value = e.nativeEvent.position + e.nativeEvent.offset;
};
```

### Pattern 4: Press-in Scale Animation (GPASS-08)

```tsx
// Use Pressable onPressIn/onPressOut with Reanimated
const scale = useSharedValue(1);

const pressInStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

const handlePressIn = () => {
  scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
};

const handlePressOut = () => {
  scale.value = withSpring(1.0, { damping: 12, stiffness: 200 });
};

const handlePress = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push(`/artist/${stamp.performer.slug}`);
};

<Animated.View style={pressInStyle}>
  <Pressable
    onPress={handlePress}
    onPressIn={handlePressIn}
    onPressOut={handlePressOut}
  >
    {/* card content */}
  </Pressable>
</Animated.View>
```

### Pattern 5: Collection Categorization (3-way split)

Current `usePassportCollections` splits into 2 categories (finds/stamps). New logic needs 3:

```tsx
// collection_type takes precedence; fall back to legacy logic
const stamps = collections.filter(c => c.verified === true || c.collection_type === 'stamp');
const finds = collections.filter(c => c.is_founder === true);
const discoveries = collections.filter(c =>
  c.collection_type === 'discovery' ||
  (!c.verified && !c.is_founder && c.capture_method === 'online')
);
```

After MIG-01/MIG-06 backfill, `collection_type` will be 'stamp' | 'find' | 'discovery' and the fallback logic becomes unnecessary.

### Pattern 6: DB Migration Strategy

All migrations run via Supabase CLI against the production DB:
```bash
cd ~/decibel && npx supabase db push --db-url "$DATABASE_URL"
# or push migration files to supabase/migrations/ and let CI run them
```

Alternatively, use the admin run-migration endpoint at `/api/admin/run-migration`.

The migrations directory is at `~/decibel/supabase/migrations/`. Naming convention: `YYYYMMDD_description.sql`.

**MIG-01 + MIG-06 combined SQL:**
```sql
-- MIG-01: Add collection_type column
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS collection_type text;

-- Backfill: stamps (verified)
UPDATE collections
  SET collection_type = 'stamp'
  WHERE verified = true AND collection_type IS NULL;

-- MIG-06: Backfill discoveries (online, not founder)
UPDATE collections c
  SET collection_type = 'discovery'
  WHERE c.capture_method = 'online'
    AND c.collection_type IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM founder_badges fb
      WHERE fb.fan_id = c.fan_id AND fb.performer_id = c.performer_id
    );

-- Remaining online = finds (has founder badge)
UPDATE collections c
  SET collection_type = 'find'
  WHERE c.capture_method = 'online'
    AND c.collection_type IS NULL;

-- Default for new entries
ALTER TABLE collections
  ALTER COLUMN collection_type SET DEFAULT 'stamp';
```

**MIG-05 SQL:**
```sql
ALTER TABLE performers
  ADD COLUMN IF NOT EXISTS spotify_embed_url text,
  ADD COLUMN IF NOT EXISTS soundcloud_embed_url text,
  ADD COLUMN IF NOT EXISTS apple_music_embed_url text,
  ADD COLUMN IF NOT EXISTS top_track_cached_at timestamptz;
```

**MIG-07 SQL:**
```sql
-- spotify_id column already used in validate-artist-link API; add unique constraint
ALTER TABLE performers
  ADD CONSTRAINT performers_spotify_id_key UNIQUE (spotify_id);
```

Note: `spotify_id` column already exists (validate-artist-link API uses it). Only the UNIQUE constraint is new.

### Anti-Patterns to Avoid

- **BlurView as a content container on Android:** Use the BlurTargetView ref pattern for modal overlays; direct BlurView is fine for small in-card strips.
- **Stacking 8 BlurView instances in a grid:** Each BlurView is expensive. For the 2x4 card grid (8 cards), the glass strip blur IS worth having but test performance on mid-range Android. Fallback: replace with semi-transparent `LinearGradient` + `rgba` overlay if frame drops detected.
- **withRepeat in a render:** Always start `withRepeat` animations inside `useEffect` — see SkeletonLoader pattern.
- **State for tab active index only:** Use both a React `useState` (for re-renders) AND a Reanimated `useSharedValue` (for smooth pill animation without re-renders) — sync them in `onPageSelected`.
- **PagerView children without key props:** Always add `key="0"`, `key="1"`, etc. — PagerView requires string keys matching index.
- **Empty placeholders in the 2x4 grid:** Never render placeholder Views for missing cards — just slice the array. flexWrap handles sparse grids naturally.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Swipeable tab pages | Custom ScrollView with manual gesture handling | react-native-pager-view | Native ViewPager2/UIPageViewController; gesture conflict resolution handled |
| Backdrop blur on Android | Custom shadow/opacity hack | expo-blur BlurView + blurMethod='dimezisBlurViewSdk31Plus' | Native RenderEffect API on Android SDK31+; degrades gracefully to semi-transparent on older devices |
| Infinite scroll pagination | Custom offset tracking | useInfiniteQuery + FlatList onEndReached | Built into existing passport API (page param), hooks already exist |
| Collection type discrimination | Custom boolean flag combinations | collection_type DB column (post-MIG-01) | Eliminates brittle `!c.verified && !c.is_founder` chains |

---

## Common Pitfalls

### Pitfall 1: BlurView in a Scrolling Grid (Performance)

**What goes wrong:** 8 BlurView instances in a scrolling FlatList causes dropped frames on mid-range Android.
**Why it happens:** Each BlurView triggers a separate RenderEffect pass on Android.
**How to avoid:** Keep the glass grid as a static preview (not inside FlatList). The 2x4 preview IS static — only the View More page uses FlatList, and glass cards in View More can use a simpler semi-transparent style.
**Warning signs:** Jank on scroll in the View More page on Android.

### Pitfall 2: PagerView + Animated.ScrollView Gesture Conflict

**What goes wrong:** When PagerView is nested inside a ScrollView (for the full passport screen scroll), horizontal swipes on PagerView compete with the parent ScrollView.
**Why it happens:** React Native gesture system prioritizes the outermost responder.
**How to avoid:** Structure the passport screen as a fixed layout (not a ScrollView). Pin the header at top, PagerView takes `flex: 1`, badges go below the pager in a separate ScrollView or FlatList within each tab. The passport screen itself should NOT be a ScrollView — each tab page manages its own scroll.
**Warning signs:** Swipe on pager triggers parent vertical scroll instead.

### Pitfall 3: collection_type NULL After Migration

**What goes wrong:** Discovery cards don't appear because the backfill WHERE clause misses some rows.
**Why it happens:** The is_founder check uses founder_badges table — if a fan has a collection entry AND a founder_badge for the same performer, the find takes precedence. Order of UPDATE statements matters.
**How to avoid:** Run the 4-step UPDATE sequence in order: stamp → discovery → find → default. Add `collection_type IS NULL` guard on each UPDATE to prevent double-processing.
**Warning signs:** Discoveries tab empty after migration; check via: `SELECT collection_type, count(*) FROM collections GROUP BY collection_type`.

### Pitfall 4: finder_username for Discovery Cards

**What goes wrong:** Discovery cards show "via @username" but the passport API doesn't return who added the artist.
**Why it happens:** The original `add-artist` flow records who added the artist, but it's stored in the `performers.added_by_fan_id` column (or similar) — not in `collections`.
**How to avoid:** Before implementing DiscoveryGlassCard, verify the passport API can return `finder_username`. The `performers` table has no `added_by` column in the initial schema — this may need a new join or the feature may gracefully degrade to "via Decibel".
**Warning signs:** Build error or null finder_username on all discovery cards.

### Pitfall 5: Card Rotation with overflow: 'hidden'

**What goes wrong:** Applied `rotation` + `borderRadius` + `overflow: 'hidden'` causes card corners to render incorrectly on Android.
**Why it happens:** Android clips rotated views differently than iOS.
**How to avoid:** Apply rotation to an outer wrapper View; keep `overflow: 'hidden'` on an inner View at natural (non-rotated) size.

```tsx
// Outer: rotation only (no overflow)
<Animated.View style={{ transform: [{ rotate: `${stamp.rotation}deg` }] }}>
  {/* Inner: overflow hidden for photo clipping + border radius */}
  <View style={{ width, height, borderRadius: 16, overflow: 'hidden' }}>
    <Image ... />
    <BlurView ... /> {/* glass strip */}
  </View>
</Animated.View>
```

### Pitfall 6: Orb Background Z-Order with SafeAreaView

**What goes wrong:** OrbBackground renders on top of content or clips at safe area boundaries.
**Why it happens:** Absolute positioning inside SafeAreaView still respects safe area insets.
**How to avoid:** Render OrbBackground as a sibling BEHIND SafeAreaView, not inside it. Use `StyleSheet.absoluteFillObject` on a `View` that is a sibling to `SafeAreaView` at the top of the render tree.

```tsx
// passport.tsx top-level structure
<View style={{ flex: 1 }}>
  <OrbBackground activeTab={activeTab} />  {/* behind everything */}
  <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
    <PassportHeader ... />
    <PassportPager ... />
  </SafeAreaView>
  <BadgesSection ... />  {/* or inside SafeAreaView — either works */}
</View>
```

---

## Code Examples

### Glass Strip with Tint Overlay
```tsx
// Pattern for all 3 card variants — tintColor is 'rgba(255,77,106,0.3)' for stamps, etc.
import { BlurView } from 'expo-blur';

<BlurView
  intensity={40}
  tint={isDark ? 'dark' : 'light'}
  blurMethod="dimezisBlurViewSdk31Plus"
  style={{
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  }}
>
  {/* Color tint layer */}
  <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: tintColor }} />
  {/* Content */}
  <View style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
    {/* artist name, venue, date, badge */}
  </View>
</BlurView>
```

### Frosted Glass Tab Indicator Pill
```tsx
// Tab bar with animated glass pill
const tabOffset = useSharedValue(0);
const TAB_WIDTH = screenWidth / 3;

const pillStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: tabOffset.value * TAB_WIDTH }],
}));

// Pill renders absolutely positioned behind tab labels
<View style={{ flexDirection: 'row', position: 'relative' }}>
  <Animated.View style={[{ position: 'absolute', width: TAB_WIDTH, height: '100%' }, pillStyle]}>
    <BlurView
      intensity={30}
      tint={isDark ? 'dark' : 'light'}
      blurMethod="dimezisBlurViewSdk31Plus"
      style={{ flex: 1, borderRadius: 20, overflow: 'hidden' }}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
    </BlurView>
  </Animated.View>
  {['Stamps', 'Finds', 'Discoveries'].map((label, i) => (
    <Pressable key={i} style={{ width: TAB_WIDTH, alignItems: 'center', paddingVertical: 10 }}
      onPress={() => pagerRef.current?.setPage(i)}>
      <Text style={{ color: activeTab === i ? colors.text : colors.textSecondary, fontFamily: 'Poppins_600SemiBold', fontSize: 14 }}>
        {label}
      </Text>
    </Pressable>
  ))}
</View>
```

### usePassportCollections Extension
```tsx
// Extend return to split into 3 — add to usePassport.ts
export function usePassportCollectionsSplit() {
  const query = usePassportCollections();
  const collections = query.data?.pages.flat() ?? [];

  const stamps = collections.filter(c =>
    c.collection_type === 'stamp' || c.verified === true
  );
  const finds = collections.filter(c =>
    c.is_founder === true || c.collection_type === 'find'
  );
  const discoveries = collections.filter(c =>
    c.collection_type === 'discovery' ||
    (!c.verified && !c.is_founder && c.capture_method === 'online')
  );

  return { ...query, stamps, finds, discoveries };
}
```

### View More Page with Search + Infinite Scroll (Template)
```tsx
// app/collection/discoveries.tsx — mirrors finds.tsx pattern
const [search, setSearch] = useState('');
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery...;

const allItems = data?.pages.flat() ?? [];
const filtered = search
  ? allItems.filter(c => c.performer.name.toLowerCase().includes(search.toLowerCase()))
  : allItems;

const handleEndReached = () => {
  if (hasNextPage && !isFetchingNextPage) fetchNextPage();
};

<FlatList
  data={filtered}
  numColumns={2}
  onEndReached={handleEndReached}
  onEndReachedThreshold={0.3}
  ListFooterComponent={isFetchingNextPage ? <ActivityIndicator /> : null}
  ...
/>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| BlurView as content wrapper (Android) | BlurTargetView ref + BlurView with blurTarget prop | expo-blur SDK 55 | Required for correct Android blur |
| experimentalBlurMethod prop | blurMethod prop (experimentalBlurMethod deprecated) | expo-blur ~54+ | Use blurMethod='dimezisBlurViewSdk31Plus' |
| 2 collection categories (finds/stamps) | 3 categories (stamps/finds/discoveries) | Phase 7 | Requires MIG-01/06 + API extension |

---

## Open Questions

1. **finder_username for Discovery cards**
   - What we know: Discovery cards must show "via @username" but performers table has no `added_by_fan_id` column in the current schema
   - What's unclear: Was `added_by` stored anywhere, or does it need to be added? Check `collections.fan_id` — the fan who created the discovery collection entry IS the "finder"
   - Recommendation: Use `collections.fan_id` → join fans table to get username in the passport API. This is already available — the passport query has `fan_id` context. The collection's own `fan_id` is the finder for discovery entries.

2. **Passport API: does it need a `type` query param for View More infinite scroll?**
   - What we know: Current API paginates all collections together (page param). View More for Discoveries needs 20 discoveries/page, not 20 mixed.
   - What's unclear: Whether client-side filtering after fetching all 20 is acceptable, or whether a server-side `?type=discovery` filter is needed.
   - Recommendation: Add `?collection_type=stamp|find|discovery` filter param to passport API for View More pages. Client-side filtering within a mixed 20-item page will produce fewer than 8 visible items per tab in many cases.

3. **MIG-07: UNIQUE constraint on spotify_id — safe to add?**
   - What we know: `validate-artist-link` already writes `spotify_id`. The intent is to prevent duplicate performers.
   - What's unclear: Are there existing duplicate `spotify_id` values in production that would cause the ALTER TABLE to fail?
   - Recommendation: Before adding the constraint, run: `SELECT spotify_id, count(*) FROM performers WHERE spotify_id IS NOT NULL GROUP BY spotify_id HAVING count(*) > 1`. If duplicates exist, deduplicate first.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Native Testing Library (if configured) |
| Config file | none detected in /home/swarn/decibel-mobile |
| Quick run command | `npx expo export --platform ios 2>&1 | tail -5` (build check) |
| Full suite command | `CI=1 npx eas update --channel preview --environment preview --message "phase 7 verification"` |

No Jest config or `__tests__` directory detected in the project. Tests are validated via EAS build + manual device testing.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIG-01 | collection_type column exists and backfilled | manual-only | Supabase SQL: `SELECT collection_type, count(*) FROM collections GROUP BY collection_type` | N/A |
| MIG-05 | embed URL columns on performers | manual-only | Supabase SQL: `SELECT column_name FROM information_schema.columns WHERE table_name='performers'` | N/A |
| MIG-06 | discovery type backfilled | manual-only | Supabase SQL: `SELECT count(*) FROM collections WHERE collection_type='discovery'` | N/A |
| MIG-07 | unique constraint on spotify_id | manual-only | Supabase SQL: `SELECT indexname FROM pg_indexes WHERE tablename='performers' AND indexname LIKE '%spotify%'` | N/A |
| GPASS-01 | 3-tab passport renders | smoke | `npx expo export --platform ios` (no errors) | N/A — Wave 0 |
| GPASS-02 | Swipe gesture switches tab | manual-only | Physical device test | N/A |
| GPASS-03 | 2x4 glass grid renders per tab | smoke | build check | N/A |
| GPASS-04 | Blur renders acceptably on Android | manual-only | Physical Android device | N/A |
| GPASS-08 | Haptic + press-in on card tap | manual-only | Physical device (haptic not testable headlessly) | N/A |
| GPASS-11 | Orbs animate on passport screen | smoke | build check (no TS errors) | N/A |
| GPASS-12 | Android fallback to semi-transparent | manual-only | Android emulator API 30 | N/A |
| GPASS-14 | BlurView SDK 55 pattern in 3 modals | smoke | `npx expo export --platform android` (no errors) | N/A |

### Sampling Rate
- **Per task commit:** `npx expo export --platform ios 2>&1 | grep -E "error|Error" | head -5`
- **Per wave merge:** `npx expo export --platform ios && npx expo export --platform android`
- **Phase gate:** EAS preview deploy + manual passport screen walkthrough on iOS + Android

### Wave 0 Gaps
- [ ] No test infrastructure detected — functional validation is EAS build + device testing
- [ ] Supabase migration SQL files need creation before any mobile code

*(No Jest setup exists in this project; the EAS preview deploy IS the integration test gate.)*

---

## Sources

### Primary (HIGH confidence)
- `expo-blur` 55.0.9 local node_modules — BlurTargetView API, BlurMethod types, Android behavior
- `react-native-reanimated` 4.2.1 local node_modules — confirmed installed, withRepeat pattern
- Project codebase direct inspection — passport.tsx, FindCard.tsx, PassportHeader.tsx, StampsSection.tsx, usePassport.ts, passport/route.ts

### Secondary (MEDIUM confidence)
- expo-blur BlurTargetView.android.js source — confirmed NativeBlurTargetView on Android vs plain View on iOS
- react-native-pager-view npm (not yet installed) — standard API, widely used with Expo managed workflow

### Tertiary (LOW confidence)
- finder_username availability — inferred from collections.fan_id join; needs verification against actual DB schema
- Duplicate spotify_id risk (MIG-07) — assumed possible; needs pre-flight check before migration

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in local node_modules
- Architecture: HIGH — based on direct code inspection of existing patterns
- DB migrations: HIGH — initial schema read; column existence for spotify_id confirmed via API code
- BlurView patterns: HIGH — source code of expo-blur 55.0.9 read directly
- Pitfalls: HIGH (rotation/overflow, gesture conflict, orb z-order) / MEDIUM (finder_username)

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable libraries; expo-blur SDK 55 API unlikely to change)
