# Phase 5: Share + Polish — Research

**Researched:** 2026-03-11
**Domain:** React Native share flows, next/og ImageResponse, celebration animations, QA patterns
**Confidence:** HIGH — built directly on existing codebase audit + verified patterns

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Celebration flow:**
- Enhance existing `ConfirmationModal` (src/components/collection/ConfirmationModal.tsx) — add "founded" type alongside "collect"/"discover"
- Founded celebration: gold ★ badge reveal (replaces wax seal), full confetti particles, heavy haptic (ImpactFeedbackStyle.Heavy)
- Discovered celebration: purple compass badge, lighter confetti (fewer particles), medium haptic
- Share button appears inline inside the celebration modal after animation completes — tapping it opens the existing ShareSheet bottom sheet with the pre-generated card
- Share card image generation starts immediately when the API confirms the action (before celebration animation plays) — card should be ready by the time user taps Share
- Auto-dismiss timer stays (5 seconds) unless user interacts

**Share card content & API:**
- Founder card (9:16 Stories format): large artist photo (top 60%), artist name, "FOUNDED BY [username]" in gold, Decibel logo + branding at bottom. Always dark background (#0B0B0F).
- Passport card: stats + grid layout — user name at top, key stats (artists found, shows attended, venues), 2x2 grid of top artist photos, Decibel branding. Always dark background.
- Both cards always use dark theme regardless of user device theme
- New backend routes: `/api/share-card/founder` and `/api/share-card/passport` in ~/decibel (next/og ImageResponse). Old `/api/passport/share-card` left as-is.
- Existing ShareSheet used for all sharing — already handles Instagram UTI on iOS, MediaLibrary permissions for Save
- Broken passport share button fixed by wiring PassportShareButton to new `/api/share-card/passport` + ShareSheet

**Artist fans list:**
- New screen at `/artist/fans` (route already exists at `app/artist/fans.tsx`)
- Row: user avatar, display name, tier badge icon, date. Tappable → user profile.
- Founder row: subtle gold left border or gold background tint, "Founder" label. Pinned at top.
- Section headers: "Founder" (1) → "Collected" (N) → "Discovered" (N)
- Fan count on artist profile is tappable → fans list (already wired in `app/artist/[slug].tsx`)
- When only Founder exists: CTA below: "Share this artist to grow their fanbase"
- New backend endpoint: GET `/api/mobile/artist-fans?performer_id=X`

**QA pass:**
- Scope: dark/light mode visual audit + bottom padding for floating tab bar on all scrollable screens
- Method: grep-based scan for hardcoded colors, missing useThemeColors() usage, localhost refs, missing bottom padding. Fix all findings programmatically.
- Not in scope: navigation flow audit, loading/error state review, accessibility audit

### Claude's Discretion
- Exact confetti particle count and animation timing for Founded vs Discovered
- Share card typography sizes and spacing within next/og ImageResponse
- Fans list loading skeleton
- Grep patterns for the QA scan
- How to handle edge cases in share card generation (missing artist photo, missing stats)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SHR-01 | Post-found celebration: confetti animation, gold badge reveal (Founded) or purple compass (Discovered), haptic | ConfirmationModal already has confetti/haptic/badge infrastructure — add "founded" type to existing type union |
| SHR-02 | Share prompt after founding: Instagram Stories, Messages, Copy Link, Save to Photos | ShareSheet component already fully implements all four channels |
| SHR-03 | Founder share card generated server-side as PNG (artist photo, "FOUNDED BY", Decibel branding) | New route: `/api/share-card/founder/route.tsx` following next/og ImageResponse pattern already used in codebase |
| SHR-04 | Passport share card generated server-side as PNG (stats, top artist photos, branding) | New route: `/api/share-card/passport/route.tsx` — replaces the broken `useShareCard.ts` which points to wrong URL |
| SHR-05 | Native OS share sheet used for all sharing | ShareSheet component already handles iOS UTI + Android fallback |
| SHR-06 | "Save to Photos" works with proper media library permission handling | ShareSheet already calls `MediaLibrary.requestPermissionsAsync()` before `saveToLibraryAsync()` |
| ART-01 | Artist fans list screen: Founder at top (gold), then Collected (pink), then Discovered (purple) | `app/artist/fans.tsx` already exists and implements tier ordering — needs section headers + date column + Founder-only CTA |
| ART-02 | Fan count tappable → navigates to fans list | Already implemented in `app/artist/[slug].tsx` line 405-428 — fan count Pressable pushes to `/artist/fans` |
| POL-01 | Full QA pass in both dark and light mode | Grep-based audit of all screen files for hardcoded hex/tailwind color classes + missing `useThemeColors()` |
| POL-02 | All scrollable screens have bottom padding for floating tab bar | Grep for `contentContainerStyle` without bottom padding; tab bar height is ~70px |
</phase_requirements>

---

## Summary

Phase 5 is the lightest phase in the build — most infrastructure already exists and needs wiring rather than building from scratch. The celebration modal, share sheet, artist fans screen, and share card hooks all exist. The gaps are: (1) the ConfirmationModal doesn't have a "founded" type, (2) the share card hooks point to old/wrong endpoints, (3) the fans screen is missing section headers and the Founder-only growth CTA, (4) the backend needs two new ImageResponse routes, and (5) a grep-based QA pass is needed across all scrollable screens.

The critical pre-condition flagged in STATE.md — "Confirm Poppins font is hosted as a static asset accessible from Vercel Edge runtime" — is now resolved by inspection: existing share card routes do NOT load Poppins at all (they use system fonts via `fontWeight: 700` only). The new routes should follow the same pattern. If custom font rendering is desired later, it requires fetching a font file as an ArrayBuffer and passing it to `ImageResponse({ fonts: [...] })` — but the current routes ship without it and it's not required for v1.

**Primary recommendation:** Wire existing pieces together. The main new code is two backend routes (`/api/share-card/founder` and `/api/share-card/passport`) and expanding ConfirmationModal to handle `type: "founded"` with the correct badge and share trigger.

---

## Standard Stack

### Core (already installed, no new dependencies needed)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| next/og (ImageResponse) | Next.js 15 | Server-side PNG generation | Already used in 5+ routes in ~/decibel |
| expo-haptics | SDK 55 | Haptic feedback on celebration | Already imported in ConfirmationModal |
| expo-media-library | SDK 55 | Save to Photos permission + save | Already working in ShareSheet |
| expo-sharing | SDK 55 | Instagram Stories UTI share | Already working in ShareSheet |
| expo-clipboard | SDK 55 | Copy link | Already working in ShareSheet |
| react-native-reanimated | ~3.x | Badge scale-in animation | Already used throughout |
| @tanstack/react-query | ~5.x | Data fetching for fans list | Already used throughout |
| expo-file-system (File, Paths) | SDK 55 | Download PNG to cache dir | Already used in useShareCard.ts |

### No New Dependencies

All required packages are already installed. No `npm install` needed for this phase.

---

## Architecture Patterns

### Existing Share Card Pattern (next/og)

The backend at `~/decibel/src/app/api/passport/share-card/route.tsx` is the canonical pattern:

```typescript
// Source: /home/swarn/decibel/src/app/api/passport/share-card/route.tsx
import { ImageResponse } from "next/og";
export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // ... read params ...
  return new ImageResponse(
    (<div style={{ display: "flex", ... }}>...</div>),
    { width: 1080, height: 1920 }  // 9:16 Stories format
  );
}
```

**Key constraint:** `export const runtime = "edge"` is required. All CSS must use inline styles with `display: "flex"` on every flex container (Satori — the engine behind ImageResponse — requires this). No Tailwind, no external CSS.

**Image embedding in share cards:** Use `<img src={photoUrl} />` directly in the JSX. The photo URL must be an absolute HTTPS URL. If artist has no photo, render initials in a gradient circle (see existing artist share card for this fallback pattern).

**Font situation:** Existing routes use no custom fonts — they rely on system default via `fontWeight: 700`. This is fine for v1. Do NOT attempt to load Poppins via Google Fonts CSS URL (will fail on Edge runtime). If custom font is desired: fetch a `.ttf` as `ArrayBuffer` from a public Vercel static path and pass to `ImageResponse({ fonts: [{ name: "Poppins", data: fontData, weight: 700 }] })`.

### New Backend Route Locations

```
~/decibel/src/app/api/share-card/
├── founder/
│   └── route.tsx   ← NEW: GET /api/share-card/founder?performerId=X&fanSlug=Y
└── passport/
    └── route.tsx   ← NEW: GET /api/share-card/passport?name=X&artists=N&...
```

These are App Router routes (`src/app/api/`), not Pages Router. The existing share-card routes are already in `src/app/api/passport/share-card/` — same pattern.

### Existing useShareCard Hook Pattern

```typescript
// Source: /home/swarn/decibel-mobile/src/hooks/useShareCard.ts
async function downloadShareCard(url: string, filename: string): Promise<string> {
  const destination = new File(Paths.cache, `${filename}.png`);
  const downloaded = await File.downloadFileAsync(url, destination);
  return downloaded.uri;
}
```

New hooks `useFounderShareCard` and a fixed `usePassportShareCard` follow this exact pattern — just change the API_BASE URL.

**Current bug:** `usePassportShareCard` in `src/hooks/useShareCard.ts` line 5 points to `https://decibel-three.vercel.app/api/passport/share-card` which is the old/broken URL. Must be updated to `https://decible.live/api/share-card/passport`.

### ConfirmationModal Extension Pattern

Current type union: `"collect" | "discover"`. Adding `"founded"` requires:

1. Extend the `type` prop: `"collect" | "discover" | "founded"`
2. For `founded`: render gold ★ badge (Text component or SVG star) instead of `WaxSeal`
3. For `discovered` from Add flow: render purple compass icon
4. Confession text: `"Founded!"` instead of `"Collected!"` / `"Discovered!"`
5. Share button for `founded` uses gold background (`colors.gold`) instead of purple

**Confetti particle counts (Claude's discretion):**
- Founded: 20 particles, spread widely (padding 20px), mix of all 5 accent colors
- Discovered (from ConfirmationModal): 10 particles, narrower spread (padding 40px), purple-dominant
- Tier-up existing: 12 particles (already implemented)

**Integration point in `app/(tabs)/add.tsx`:** The `handleAdd()` function currently navigates to `/artist/[slug]` on success. It needs to instead:
1. Start share card fetch immediately (fire-and-forget)
2. Show ConfirmationModal with `type: "founded"` (if `result.is_founder`)
3. Wire Share button → ShareSheet with pre-fetched card URI

### Artist Fans Screen Enhancement

`app/artist/fans.tsx` already exists with: FlatList, tier-color helper, tier-label helper, avatar, back nav. Missing:
- Section headers (FlatList `renderSectionHeader` via `SectionList` or manual inline headers)
- Date column (needs `created_at` from data — currently `ArtistFan` type has no date field)
- Gold left border on Founder row
- Founder-only CTA: "Share this artist to grow their fanbase" when `fans.length === 1 && fans[0].type === "founded"`

**Data layer:** `useArtistFans` in `src/hooks/useArtistProfile.ts` uses direct Supabase queries — no backend API needed for the fans list. However, the `ArtistFan` type needs `date` field added, and the query needs `created_at` from both `founder_badges` and `collections` tables.

The CONTEXT.md mentions a backend endpoint `GET /api/mobile/artist-fans?performer_id=X` but the existing direct Supabase query approach in `useArtistFans` already works and is simpler. The backend endpoint approach would be needed only if RLS prevents direct queries. Research shows the existing direct query pattern works for all other data in this app — keep it Supabase-direct unless a backend endpoint is explicitly needed.

### QA Pass Grep Patterns

```bash
# Hardcoded hex colors (excluding design tokens)
grep -rn "#[0-9a-fA-F]\{3,6\}" app/ src/ --include="*.tsx" --include="*.ts" \
  | grep -v "colors\." | grep -v "// " | grep -v "node_modules"

# Tailwind-style hardcoded text colors (not applicable — uses StyleSheet, not Tailwind)
# (Nativewind is installed but screens use StyleSheet/inline styles)

# Missing useThemeColors (screens with hardcoded rgba/hex but no useThemeColors import)
grep -rL "useThemeColors" app/ src/components/ --include="*.tsx" 2>/dev/null

# Missing bottom padding on ScrollView/FlatList content containers
# Look for contentContainerStyle without paddingBottom >= 70
grep -rn "contentContainerStyle" app/ src/components/ --include="*.tsx" \
  | grep -v "paddingBottom"

# Localhost refs in production paths
grep -rn "localhost\|127\.0\.0\.1" app/ src/ --include="*.tsx" --include="*.ts" \
  --include="*.env*"
```

**Tab bar height constant:** The floating tab bar is ~70px tall (from `app/(tabs)/_layout.tsx`). All `contentContainerStyle.paddingBottom` on scrollable screens should be at least 100px (70px tab bar + 30px breathing room).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Save image to device | Custom FS write | `MediaLibrary.saveToLibraryAsync()` | Handles iOS Photos permission model + Android scoped storage |
| Instagram Stories share | Deep link URI scheme | `expo-sharing` with UTI `com.instagram.exclusivegram` | UTI approach is the reliable iOS path; ShareSheet already implements fallback |
| PNG generation server-side | Custom canvas/sharp | `next/og ImageResponse` | Already used in 5 routes, edge-compatible, outputs PNG directly |
| Download PNG to cache | Manual `fetch` + `FileSystem.writeAsStringAsync` | `File.downloadFileAsync(url, destination)` from `expo-file-system` | Already abstracted in `downloadShareCard` helper |
| Tier-sorted fan list | Custom sort + UI | Extend existing `useArtistFans` | Already sorts founded → collected → discovered |

---

## Common Pitfalls

### Pitfall 1: ImageResponse `display: "flex"` requirement
**What goes wrong:** Satori (ImageResponse engine) requires every flex container to explicitly have `display: "flex"` in inline styles. Missing it causes layout collapse silently.
**How to avoid:** Every `<div>` that uses flexbox direction/alignment must have `display: "flex"` as first style property. Reference existing routes — they all do this.

### Pitfall 2: Photo URLs in ImageResponse
**What goes wrong:** Relative URLs, blob URIs, or non-HTTPS URLs in `<img src>` fail silently in edge runtime.
**How to avoid:** Only pass absolute HTTPS URLs (Supabase CDN URLs for artist photos are fine — they're `https://*.supabase.co`). Always provide initials fallback for null photo.

### Pitfall 3: Share card pre-generation timing
**What goes wrong:** If card generation is triggered after ConfirmationModal opens, the user taps Share before the card is ready, sees "Generating..." spinner, and UX feels slow.
**How to avoid:** Start card generation in `onSuccess` of `addMutation` BEFORE opening ConfirmationModal. Pass the Promise or URI down. ShareSheet handles `isGenerating` state with spinner.

### Pitfall 4: `usePassportShareCard` pointing to old URL
**What goes wrong:** `src/hooks/useShareCard.ts` line 5 points to `https://decibel-three.vercel.app/api/passport/share-card` (old broken endpoint). This silently fails — share sheet shows "Failed to generate card."
**How to avoid:** Update `API_BASE` to `https://decible.live/api` and build new hooks `useFounderShareCard` and `usePassportShareCard` pointing to the new routes.

### Pitfall 5: ART-02 already wired but ART-01 needs enhancement
**What goes wrong:** Assuming ART-02 (fan count tappable) needs building — it's already implemented in `app/artist/[slug].tsx` lines 405-428. Wasted effort.
**How to avoid:** ART-01 is the real work — section headers, date field, Founder CTA. The fans screen (`app/artist/fans.tsx`) exists but needs these enhancements.

### Pitfall 6: Bottom padding on tabs with floating pill
**What goes wrong:** Content at the bottom of scrollable screens is hidden behind the floating tab bar. 70px is not enough — safe area bottom inset adds ~34px more on modern iPhones.
**How to avoid:** Use `paddingBottom: 100` as minimum for all `contentContainerStyle`. Screens with a bottom fixed CTA button need more (140px+).

### Pitfall 7: `File.downloadFileAsync` is expo-file-system v2 API
**What goes wrong:** The `import { File, Paths } from "expo-file-system"` pattern is expo-file-system v2 (available in SDK 55). Don't mix with `FileSystem.downloadAsync()` from v1 style.
**How to avoid:** Keep using the existing `downloadShareCard` helper in `useShareCard.ts` — it already uses the correct SDK 55 pattern.

---

## Code Examples

### New Founder Share Card Route (backend)
```typescript
// ~/decibel/src/app/api/share-card/founder/route.tsx
// Source: pattern from /home/swarn/decibel/src/app/api/passport/share-card/artist/route.tsx
import { ImageResponse } from "next/og";
export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artistName = searchParams.get("artistName") || "Artist";
  const artistPhoto = searchParams.get("artistPhoto") || "";
  const fanSlug = searchParams.get("fanSlug") || "fan";

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%",
        backgroundColor: "#0B0B0F", alignItems: "center" }}>
        {/* top gradient accent bar */}
        {/* artist photo (top 60%) or initials fallback */}
        {/* artist name */}
        {/* "FOUNDED BY [username]" in gold */}
        {/* DECIBEL branding at bottom */}
      </div>
    ),
    { width: 1080, height: 1920 }
  );
}
```

### New useFounderShareCard Hook (mobile)
```typescript
// src/hooks/useShareCard.ts — add alongside existing hooks
const FOUNDER_CARD_BASE = "https://decible.live/api/share-card/founder";
const PASSPORT_CARD_BASE = "https://decible.live/api/share-card/passport";

export function useFounderShareCard() {
  const [state, setState] = useState<ShareCardState>({ isLoading: false, error: null });

  const generate = useCallback(async (params: {
    artistName: string;
    artistPhoto: string | null;
    fanSlug: string;
  }): Promise<string> => {
    setState({ isLoading: true, error: null });
    const qs = new URLSearchParams({ artistName: params.artistName, fanSlug: params.fanSlug });
    if (params.artistPhoto) qs.set("artistPhoto", params.artistPhoto);
    const uri = await downloadShareCard(
      `${FOUNDER_CARD_BASE}?${qs}`,
      `founder-${params.fanSlug}-${Date.now()}`
    );
    setState({ isLoading: false, error: null });
    return uri;
  }, []);

  return { generate, ...state };
}
```

### ConfirmationModal "founded" type extension
```typescript
// src/components/collection/ConfirmationModal.tsx
type ConfirmationModalProps = {
  visible: boolean;
  type: "collect" | "discover" | "founded";  // add "founded"
  // ...
};

// In render: for founded type, render gold ★ badge instead of WaxSeal
// Text: type === "founded" ? "Founded!" : type === "collect" ? "Collected!" : "Discovered!"
// Share button bg: type === "founded" ? colors.gold : colors.purple
// Haptic: type === "founded" → Heavy (already fires from triggerHaptic)
// Confetti: always show for founded (not just tier-up)
```

### QA audit command sequence
```bash
# Run from /home/swarn/decibel-mobile
# 1. Hardcoded hex colors
grep -rn "#[0-9a-fA-F]\{6\}\|#[0-9a-fA-F]\{3\}" app/ src/components/ \
  --include="*.tsx" | grep -v "//.*#" | grep -v "colors\."

# 2. Missing bottom padding on scrollable screens
grep -rn "contentContainerStyle" app/ src/components/ --include="*.tsx"

# 3. Tab bar padding check (should have paddingBottom >= 100)
grep -rn "paddingBottom" app/ src/components/ --include="*.tsx" | grep -E "paddingBottom.*[0-9]+"
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `File.downloadAsync` (expo-file-system v1) | `File.downloadFileAsync` (expo-file-system v2, SDK 55) | Already using correct v2 API |
| Pages Router API (`pages/api/`) | App Router API (`src/app/api/`) | Backend uses App Router — new routes go in `src/app/api/share-card/` |
| `SharePrompt` component (auto-triggers share on mount) | Inline Share button in ConfirmationModal → ShareSheet | SharePrompt is superseded for the founded flow |

---

## Open Questions

1. **Backend API endpoint for artist-fans**
   - What we know: `useArtistFans` in `src/hooks/useArtistProfile.ts` already fetches fans via direct Supabase queries (founder_badges + collections joins). The data is correct and sorted.
   - What's unclear: CONTEXT.md mentions a new backend endpoint `GET /api/mobile/artist-fans` but the direct Supabase approach already works.
   - Recommendation: Skip the backend endpoint. Keep direct Supabase queries — add `created_at` to the select and extend the `ArtistFan` type with an optional `date` field. Simpler and already works.

2. **Passport share card data source**
   - What we know: `handleSharePassport` in `passport.tsx` already collects stats (totalArtists, totalShows, uniqueVenues, etc.) from `usePassportStats()`. The new `/api/share-card/passport` route needs the same params.
   - What's unclear: The CONTEXT.md spec adds a "2x2 grid of top artist photos" to the passport card. The existing passport route uses artist names (text pills), not images. Fetching 4 photo URLs requires passing them as query params.
   - Recommendation: Add `topArtistPhotos` comma-separated query param. Collect top 4 verified-collection artist photo_urls in `handleSharePassport`. If artist has no photo, skip that grid cell.

3. **Poppins font in share cards**
   - What we know: Existing share card routes use no custom font — system default only. The pre-phase blocker "Confirm Poppins is hosted as static asset" was flagged.
   - What's unclear: Whether the design requires Poppins in the share cards or system font is acceptable.
   - Recommendation: Ship with system fonts for v1 (matches all existing routes). Poppins loading on Edge runtime requires fetching a `.ttf` as ArrayBuffer — adds complexity and a dependency on a hosted font file.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30 + ts-jest |
| Config file | `/home/swarn/decibel-mobile/jest.config.js` |
| Quick run command | `npx jest --testPathPattern="src/" --passWithNoTests` |
| Full suite command | `npx jest --passWithNoTests` |

Note: No `test` script in `package.json` — use `npx jest` directly. One existing test file: `src/lib/urlParser.test.ts`.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHR-01 | ConfirmationModal renders "Founded!" for type=founded | unit | `npx jest --testPathPattern="ConfirmationModal"` | ❌ Wave 0 |
| SHR-03 | Founder share card API returns 200 with image/png | manual-only | curl test at deploy time | N/A |
| SHR-04 | Passport share card API returns 200 with image/png | manual-only | curl test at deploy time | N/A |
| SHR-06 | Save to Photos requests permission before saving | manual-only | Requires device/simulator | N/A |
| ART-01 | useArtistFans sorts founded before collected before discovered | unit | `npx jest --testPathPattern="useArtistFans"` | ❌ Wave 0 |
| POL-02 | All scrollable screens have paddingBottom >= 100 | automated-grep | `grep -rn "contentContainerStyle" app/ src/ --include="*.tsx"` | N/A (grep-based) |

**Manual-only justification:** Share card generation (SHR-03, SHR-04) requires a running Next.js Edge runtime — not testable in Jest. Media library (SHR-06) requires a real device or simulator.

### Sampling Rate
- **Per task commit:** `npx jest --passWithNoTests` (fast, < 5s, only 1 test file currently)
- **Per wave merge:** `npx jest --passWithNoTests` + EAS build check
- **Phase gate:** Full suite green + EAS preview update deployed before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/collection/__tests__/ConfirmationModal.test.ts` — covers SHR-01 (founded type rendering)
- [ ] `src/hooks/__tests__/useArtistFans.test.ts` — covers ART-01 (tier sort order)

*(Both are lightweight unit tests; ConfirmationModal test requires React Native Testing Library or just logic extraction)*

---

## Sources

### Primary (HIGH confidence)
- `/home/swarn/decibel-mobile/src/components/collection/ConfirmationModal.tsx` — full existing animation/haptic/confetti implementation
- `/home/swarn/decibel-mobile/src/components/passport/ShareSheet.tsx` — full share implementation including MediaLibrary + Instagram UTI
- `/home/swarn/decibel-mobile/src/hooks/useShareCard.ts` — existing download pattern + broken URL identified
- `/home/swarn/decibel-mobile/app/artist/fans.tsx` — existing fans screen
- `/home/swarn/decibel-mobile/src/hooks/useArtistProfile.ts` — useArtistFans direct Supabase query
- `/home/swarn/decibel-mobile/app/artist/[slug].tsx` — ART-02 already wired (line 405-428)
- `/home/swarn/decibel/src/app/api/passport/share-card/route.tsx` — canonical 9:16 ImageResponse pattern
- `/home/swarn/decibel/src/app/api/passport/share-card/artist/route.tsx` — artist-focused 9:16 card pattern
- `/home/swarn/decibel-mobile/src/hooks/useAddArtist.ts` — `is_founder` field available in API response

### Secondary (MEDIUM confidence)
- next/og ImageResponse pattern: verified against existing codebase (5+ routes already shipping)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use
- Architecture patterns: HIGH — all patterns exist in live code, verified line-by-line
- Pitfalls: HIGH — identified from direct code inspection (wrong URL in useShareCard, existing ART-02 wiring)
- Backend route structure: HIGH — verified App Router at `src/app/api/`

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable stack, no fast-moving dependencies)
