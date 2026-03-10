# Decibel Mobile — Design System

> Comprehensive reference of every color, font, spacing, radius, shadow, gradient, animation, and component style used in the app.

---

## Table of Contents

1. [Color Tokens](#1-color-tokens)
2. [Accent Colors](#2-accent-colors)
3. [Tier Colors](#3-tier-colors)
4. [Badge Rarity Colors](#4-badge-rarity-colors)
5. [Gradients](#5-gradients)
6. [Typography](#6-typography)
7. [Spacing](#7-spacing)
8. [Border Radius](#8-border-radius)
9. [Shadows & Elevation](#9-shadows--elevation)
10. [Tab Bar](#10-tab-bar)
11. [Component Styles](#11-component-styles)
12. [Animations](#12-animations)
13. [Haptics](#13-haptics)
14. [Tailwind / Nativewind Config](#14-tailwind--nativewind-config)
15. [File Inventory](#15-file-inventory)

---

## 1. Color Tokens

**Source:** `src/constants/colors.ts`
**Access:** `const colors = useThemeColors();`
**Detection:** `useColorScheme()` from React Native — falls back to dark

### Dark Theme

| Token | Value | Usage |
|---|---|---|
| `bg` | `#0B0B0F` | App background |
| `card` | `#15151C` | Card / surface backgrounds |
| `cardHover` | `#1C1C28` | Card hover / pressed state |
| `cardBorder` | `rgba(255,255,255,0.06)` | Card borders |
| `cardElevated` | `#1C1C26` | Elevated card surfaces |
| `text` | `#FFFFFF` | Primary text |
| `textPrimary` | `#FFFFFF` | Alias for `text` |
| `textSecondary` | `rgba(255,255,255,0.6)` | Secondary text, captions |
| `textTertiary` | `rgba(255,255,255,0.35)` | Tertiary / muted text |
| `textDim` | `#55556A` | Very dim labels, timestamps |
| `border` | `rgba(255,255,255,0.06)` | General borders |
| `divider` | `rgba(255,255,255,0.06)` | Divider lines |
| `tabBarBg` | `#0B0B0F` | Tab bar background |
| `tabBarBorder` | `rgba(255,255,255,0.06)` | Tab bar border |
| `inputBg` | `#1C1C26` | Input field backgrounds |
| `inputBorder` | `rgba(255,255,255,0.1)` | Input field borders |
| `gray` | `#8E8E9A` | Medium gray (icons, labels) |
| `lightGray` | `#55556A` | Light gray (secondary icons) |
| `white` | `#FFFFFF` | Pure white |
| `decibel` | `#0B0B0F` | Legacy alias for `bg` |
| `isDark` | `true` | Theme flag |

### Light Theme

| Token | Value | Usage |
|---|---|---|
| `bg` | `#F5F5F7` | App background |
| `card` | `#FFFFFF` | Card / surface backgrounds |
| `cardHover` | `#F0F0F2` | Card hover / pressed state |
| `cardBorder` | `rgba(0,0,0,0.06)` | Card borders |
| `cardElevated` | `#FFFFFF` | Elevated card surfaces |
| `text` | `#0B0B0F` | Primary text |
| `textPrimary` | `#0B0B0F` | Alias for `text` |
| `textSecondary` | `rgba(0,0,0,0.5)` | Secondary text, captions |
| `textTertiary` | `rgba(0,0,0,0.3)` | Tertiary / muted text |
| `textDim` | `#A0A0B0` | Very dim labels, timestamps |
| `border` | `rgba(0,0,0,0.06)` | General borders |
| `divider` | `rgba(0,0,0,0.06)` | Divider lines |
| `tabBarBg` | `#FFFFFF` | Tab bar background |
| `tabBarBorder` | `rgba(0,0,0,0.08)` | Tab bar border |
| `inputBg` | `#EDEDF0` | Input field backgrounds |
| `inputBorder` | `rgba(0,0,0,0.08)` | Input field borders |
| `gray` | `#6E6E7A` | Medium gray |
| `lightGray` | `#A0A0B0` | Light gray |
| `white` | `#0B0B0F` | Inverted "white" (maps to dark text) |
| `decibel` | `#F5F5F7` | Legacy alias for `bg` |
| `gold` | `#DAA520` | Gold accent (darker in light mode) |
| `isDark` | `false` | Theme flag |

---

## 2. Accent Colors

Identical in both themes.

| Token | Hex | Swatch |
|---|---|---|
| `pink` | `#FF4D6A` | Primary CTA, active tab, collect |
| `purple` | `#9B6DFF` | Discovered, share, early_access tier |
| `blue` | `#4D9AFF` | Secret tier, rare badges |
| `teal` | `#00D4AA` | Inner circle tier |
| `yellow` / `gold` | `#FFD700` (dark) / `#DAA520` (light) | Legendary, gold accents |

---

## 3. Tier Colors

**Source:** `src/hooks/useCollection.ts`

| Tier | Color | Scan Threshold | Label |
|---|---|---|---|
| `network` | `#FF4D6A` (pink) | 0–2 scans | Network |
| `early_access` | `#9B6DFF` (purple) | 3–4 scans | Early Access |
| `secret` | `#4D9AFF` (blue) | 5–9 scans | Secret |
| `inner_circle` | `#00D4AA` (teal) | 10+ scans | Inner Circle |

### Collection Type Colors (CollectionStamp)
| Type | Color Token | Label |
|---|---|---|
| Founded | `colors.gold` | FOUNDED |
| Collected (verified) | `colors.pink` | COLLECTED |
| Discovered (online) | `colors.purple` | DISCOVERED |

---

## 4. Badge Rarity Colors

**Source:** `src/constants/badges.ts`

| Rarity | Color | Usage |
|---|---|---|
| `common` | `#8E8E9A` | Gray badges |
| `rare` | `#4D9AFF` | Blue badges |
| `epic` | `#9B6DFF` | Purple badges |
| `legendary` | `#FFD700` | Gold badges |

### Badge Visual Treatment

**Earned badge circle (64px):**
- 2px border in rarity color
- Background: linear gradient `${rarityColor}33` to `${rarityColor}15`
- Metallic sheen overlay opacity by rarity:
  - `legendary`: 0.25
  - `epic`: 0.20
  - `rare`: 0.15
  - `common`: 0.10
- Light mode shadow: `shadowColor: rarityColor, offset: 0x2, opacity: 0.25, radius: 4, elevation: 4`

**Locked badge circle (64px):**
- Background: `colors.card` (dark) / `#F5F0EB` (light)
- Icon opacity: 0.3
- Text: `colors.lightGray`

---

## 5. Gradients

All gradients use `expo-linear-gradient` (`LinearGradient`).

### Deterministic Avatar Gradient Pairs

Used across `ArtistHero`, `PassportHeader`, `CollectionStamp`, `TierProgressModal`, `EventCard` when no photo exists. Gradient selected by hashing the artist/fan name.

| Index | Start | End |
|---|---|---|
| 0 | `#FF4D6A` (pink) | `#9B6DFF` (purple) |
| 1 | `#9B6DFF` (purple) | `#4D9AFF` (blue) |
| 2 | `#4D9AFF` (blue) | `#00D4AA` (teal) |
| 3 | `#00D4AA` (teal) | `#FF4D6A` (pink) |
| 4 | `#FFD700` (yellow) | `#FF4D6A` (pink) |
| 5 | `#9B6DFF` (purple) | `#00D4AA` (teal) |

**Direction:** `start={0,0} end={1,1}` (diagonal) for avatars, `start={0,0} end={1,0}` (horizontal) for buttons

### Share Passport Button Gradient

**Source:** `src/components/passport/PassportShareButton.tsx`

```
colors={[colors.purple, colors.pink]}
start={{ x: 0, y: 0 }}  end={{ x: 1, y: 0 }}  // horizontal
```
- Height: 56px (paddingVertical: 16)
- Border radius: 16
- Text: Poppins_700Bold 16px #FFFFFF

### Artist Hero Scrim Gradient

**Source:** `src/components/artist/ArtistHero.tsx`

```
colors={["transparent", `${colors.decibel}99`, colors.decibel]}
locations={[0, 0.6, 1]}
```
- Height: 60% of hero (320px * 0.6 = 192px)
- Positioned at bottom of hero image

### Passport Cover Gradient

**Source:** `src/components/passport/PassportCoverAnimation.tsx`

```
colors={["#1A1A24", "#0D0D14", "#111118", "#0D0D14"]}
start={{ x: 0, y: 0 }}  end={{ x: 1, y: 1 }}
opacity: 0.6
```
- Dark leather texture effect
- Gold accents: `#D4A845`
- Gold border: `rgba(212,168,69,0.3)` (2px right border)
- Embossed lines: `rgba(212,168,69,0.2)`

### Genre Pill Background

```
backgroundColor: `${colors.gray}33`  // gray at 20% opacity
```

### Tier Pill Background (TierPill component)

```
backgroundColor: `${tierColor}26`  // tier color at ~15% opacity
```

### Share Button Background (TierProgressModal)

```
backgroundColor: `${colors.purple}26`  // purple at ~15% opacity
```

---

## 6. Typography

### Font Family: Poppins

**Source:** `@expo-google-fonts/poppins`

| Weight | Import | Tailwind Class | Usage |
|---|---|---|---|
| 400 Regular | `Poppins_400Regular` | `font-poppins` | Body text, descriptions |
| 500 Medium | `Poppins_500Medium` | `font-poppins-medium` | Labels, secondary emphasis |
| 600 SemiBold | `Poppins_600SemiBold` | `font-poppins-semibold` | Section headers, tier labels |
| 700 Bold | `Poppins_700Bold` | `font-poppins-bold` | Headings, CTAs, names |

### Monospace

- Used for collection type labels (FOUNDED/COLLECTED/DISCOVERED)
- iOS: `Courier`, Android: `monospace`

### Font Size Scale

| Size | Usage |
|---|---|
| 10px | Tab bar labels, badge names, collection type labels, tier pill text |
| 11px | Badge titles, venue names, scan counts |
| 12px | Member since labels, section subtitles, scan thresholds |
| 13px | Small body text, tier progress text, city labels, genre pills |
| 14px | Body text, form labels, tier labels, input labels |
| 15px | Collection stamp artist names, button text |
| 16px | Share button text, event card names, section headers |
| 18px | Section headers, empty state titles |
| 20px | Modal titles, artist name (TierProgressModal) |
| 22px | Passport header display name |
| 28px | Badge detail modal icons, tier progress initial letter |
| 30px | Artist hero name |
| 32px | Passport cover "DECIBEL" text |
| 48px | Badge celebration modal icon |
| 72px | Artist hero fallback initial letter |

---

## 7. Spacing

### Horizontal Screen Padding

| Value | Usage |
|---|---|
| 16px | Card content, stamp margins, tab bar container inset |
| 20px | Passport header, share button margin, tab bar close button |
| 24px | Modal padding, section padding |
| 32px | Sometimes used for wider sections |

### Vertical Spacing

| Value | Usage |
|---|---|
| 2px | Small margin between text lines, tab icon-to-label gap |
| 4px | Gap between meta items (type + date), margin-top for rows |
| 6px | Genre pill gaps, wax seal component gap |
| 8px | Standard small gap, share button icon-to-text gap |
| 10px | Margin below genre pills |
| 12px | Standard gap (tier roadmap, stamp info margin-left) |
| 14px | Stamp content padding |
| 16px | Section gaps, header padding-bottom, hero margin-bottom |
| 20px | Modal padding-top, tier badge margin-bottom |
| 24px | Large section gaps, modal inner spacing |
| 32px | Hero offset overlap |
| 40px | Modal padding-bottom |
| 48px | Hero overlap (marginTop: -48) |
| 60px | Passport header padding-top, cover embossed lines |

---

## 8. Border Radius

| Value | Usage |
|---|---|
| 1px | Badge starburst rays |
| 3px | Progress bars |
| 4px | Skeleton lines |
| 8px | Tier pills |
| 12px | Cards, buttons, inputs, badges, stamp cards, share button |
| 14px | Tier roadmap status icons (28px circle) |
| 16px | Large buttons (share passport, empty state CTA) |
| 20px | Large modals |
| 24px | Bottom sheet top corners |
| 28px | Tab bar pill |
| 32px | Badge circles (64px diameter) |
| 36px | Badge circles in modals (72px) |
| 40px | Avatar circles (80px) |
| 100px | Genre pills (fully rounded) |

---

## 9. Shadows & Elevation

### Tab Bar Pill

```
shadowColor: dark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 1
shadowRadius: 12
elevation: 8
```

### Passport Cover

```
shadowColor: "#000"
shadowOffset: { width: 8, height: 0 }
shadowOpacity: 0.5
shadowRadius: 12
elevation: 8
```

### Badge Circle (Light Mode Only)

```
shadowColor: <rarity color>
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.25
shadowRadius: 4
elevation: 4
```

### Modal Cards (Light Mode)

```
shadowColor: "#000"
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.15
shadowRadius: 12
elevation: 8
```

**Note:** Dark mode generally uses no shadows — depth is conveyed through background color layering (`bg` < `card` < `cardHover` < `cardElevated`).

---

## 10. Tab Bar

**Source:** `app/(tabs)/_layout.tsx`

### Structure

- Floating pill design, pinned to bottom
- `BlurView` with `expo-blur`, intensity: 25
- 56px height, borderRadius: 28
- 16px horizontal inset from screen edges
- Bottom offset: `safeAreaInsets.bottom + 8`
- 1px border

### Colors

| Property | Dark | Light |
|---|---|---|
| Background | `rgba(11, 11, 15, 0.72)` | `rgba(245, 245, 247, 0.72)` |
| Border | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.06)` |
| Shadow | `rgba(0,0,0,0.3)` | `rgba(0,0,0,0.1)` |
| Active color | `#FF4D6A` (pink) | `#FF4D6A` (pink) |
| Inactive color | `rgba(255,255,255,0.55)` | `rgba(0,0,0,0.45)` |

### Icons

- Lucide icons, size: 22
- Active stroke width: 2.5, Inactive stroke width: 2
- Labels: Poppins_500Medium, 10px
- Gap between icon and label: 2px

### Live Dot

- 8px circle, borderRadius: 4
- Color: `colors.pink`
- Border: 1.5px, `rgba(bg, 0.85)`
- Position: absolute, top: -2, right: -4

---

## 11. Component Styles

### Button (`src/components/ui/Button.tsx`)

| Variant | Background | Text Color | Border |
|---|---|---|---|
| `primary` | `colors.pink` | `#FFFFFF` | none |
| `secondary` | `colors.card` | `colors.gray` | 1px `colors.border` |
| `ghost` | transparent | `colors.pink` | none |

- Height: 56px
- Padding: 24px horizontal
- Border radius: 12px
- Active opacity: 0.8, Disabled opacity: 0.5

### Input (`src/components/ui/Input.tsx`)

- Background: `colors.inputBg`
- Height: 56px
- Padding: 16px horizontal
- Border: 1px, default `colors.lightGray`, focused `colors.pink`, error `colors.pink`
- Border radius: 12px
- Label: Poppins_500Medium 14px `colors.gray`
- Error text: Poppins 14px `colors.pink`

### TierPill (`src/components/ui/TierPill.tsx`)

- Background: `${tierColor}26` (~15% opacity)
- Padding: 8px horizontal, 2px vertical
- Border radius: 8px
- Text: Poppins_500Medium 10px uppercase, color: tier color

### EmptyState (`src/components/ui/EmptyState.tsx`)

- Icon circle: 80px, borderRadius: 40
- Icon bg: `rgba(255,255,255,0.04)` (dark) / `rgba(0,0,0,0.04)` (light)
- Title: Poppins_600SemiBold 18px
- Subtitle: Poppins_400Regular 14px, lineHeight: 20
- CTA: `colors.purple` bg, Poppins_700Bold 15px white, padding: 12x28, radius: 16

### SkeletonLoader (`src/components/ui/SkeletonLoader.tsx`)

- Pulse animation: opacity 0.3 to 0.7, 900ms, repeating
- Background: `colors.card`
- Default line height: 14px, radius: 4px

### CollectionStamp (`src/components/passport/CollectionStamp.tsx`)

- Card: radius 12, `colors.card` bg, minHeight: 100
- Content padding: 14px
- Artist photo: 56px circle, 2px border in type color
- Discovered stamps: 0.7 opacity, grayscale overlay (0.5 opacity `colors.bg`)
- Type label: monospace 10px, letterSpacing: 0.5
- Date label: monospace 10px, `colors.textDim`
- Verified/Founded show WaxSeal (28px), Discovered do not

### WaxSeal (`src/components/collection/WaxSeal.tsx`)

- SVG-based scalloped circle
- Default size: 80px (28px when `hideLabel`)
- 16 scalloped notches
- RadialGradient sheen: white 25% opacity at center
- Embossed inner ring: 1px white at 35% opacity
- Short labels: N / EA / S / IC
- Below seal: tier label (Poppins_600SemiBold 13px) + scan count (Poppins_400Regular 11px)

### EventCard (`src/components/home/EventCard.tsx`)

- `colors.card` bg, `colors.border` 1px border
- Tailwind: `rounded-xl border px-5 py-4 flex-row items-center`
- Artist photo: 48px circle, or gradient initial fallback (pink-to-purple)
- Artist name: `font-poppins-semibold text-base`
- Venue: `font-poppins text-xs`, with MapPin icon (12px)

### ArtistHero (`src/components/artist/ArtistHero.tsx`)

- Hero height: 320px, full screen width
- Fallback: deterministic gradient with 72px initial letter at 30% opacity
- Scrim: gradient overlay from transparent to `${colors.decibel}99` to `colors.decibel`
- Name: Poppins_700Bold 30px, overlapping hero by -48px
- Genre pills: `${colors.gray}33` bg, borderRadius: 100, px: 10, py: 3
  - Text: Poppins_500Medium 11px `colors.textSecondary`
- City + Fans row: 13px Poppins_400Regular `colors.textSecondary`, 14px icons

### PassportHeader (`src/components/passport/PassportHeader.tsx`)

- Avatar: 80px circle, deterministic gradient fallback
- Stamp count badge: 24px circle on bottom-right, `colors.pink` bg, 2px `colors.bg` border
- Name: Poppins_700Bold 22px
- City: Poppins_400Regular 14px `colors.textSecondary`
- Member since: Poppins_400Regular 12px `colors.textDim`
- Settings icon: 24px `colors.gray`
- Parallax: translateY up to 40% of HEADER_HEIGHT (160px), scale 0.95, opacity fade

---

## 12. Animations

### Passport Cover (`PassportCoverAnimation`)

- 500ms hold, then 1000ms rotateY from 0 to -90 degrees
- Easing: `Easing.inOut(Easing.cubic)`
- Perspective: 1200
- Book-opening effect (left-edge spine rotation)
- Plays once per session (module-level flag)

### Badge Celebration Sequence (`BadgeDetailModal`, `justEarned={true}`)

1. **Badge pop-in** (delay: 100ms): Scale 0.5 to 1, spring damping: 10, stiffness: 200
2. **Starburst rays** (delay: 200ms): 8 rays at 45-degree angles, scale 0 to 1.5 over 600ms, opacity 1 to 0
   - Ray dimensions: 2px wide, 30px tall, borderRadius: 1
3. **Glow ring** (delay: 200ms): Scale 0 to 2 over 600ms, opacity 0.5 to 0, 2px border in rarity color
4. **Grayscale-to-color** (delay: 150ms): Overlay opacity 0.85 to 0 over 800ms, reveals full-color emoji
5. **Haptic** (at 250ms): Heavy impact + success notification

### Skeleton Pulse

- React Native Reanimated `withRepeat(withTiming(...))`
- Opacity: 0.3 to 0.7, duration: 900ms

### Passport Header Parallax

- On scroll: translateY up to `-HEADER_HEIGHT * 0.4` (64px)
- Scale: 1 to 0.95
- Opacity: 1 to 0.8 to 0 (over HEADER_HEIGHT of 160px)
- Extrapolation: CLAMP

---

## 13. Haptics

**Source:** `expo-haptics`

| Event | Haptic Type |
|---|---|
| Tier up | `ImpactFeedbackStyle.Heavy` |
| Collect | `ImpactFeedbackStyle.Medium` |
| Discover | `ImpactFeedbackStyle.Medium` |
| Badge earned | `ImpactFeedbackStyle.Heavy` + `NotificationFeedbackType.Success` |

---

## 14. Tailwind / Nativewind Config

**Source:** `tailwind.config.js`

```js
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        surface: "#F5F5F7",
        "surface-card": "#FFFFFF",
        "on-surface": "#1A1A2E",
        "on-surface-secondary": "#6E6E7A",
        "on-surface-dim": "#A0A0B0",
        decibel: "#0B0B0F",
        card: "#15151C",
        "card-hover": "#1C1C28",
        pink: "#FF4D6A",
        purple: "#9B6DFF",
        blue: "#4D9AFF",
        teal: "#00D4AA",
        yellow: "#FFD700",
        gray: "#8E8E9A",
        "light-gray": "#55556A",
      },
      fontFamily: {
        poppins: ["Poppins_400Regular"],
        "poppins-medium": ["Poppins_500Medium"],
        "poppins-semibold": ["Poppins_600SemiBold"],
        "poppins-bold": ["Poppins_700Bold"],
      },
    },
  },
};
```

---

## 15. File Inventory

### Core Design System

| File | Purpose |
|---|---|
| `src/constants/colors.ts` | All color tokens, theme hook |
| `src/constants/badges.ts` | Badge definitions, rarity colors |
| `src/hooks/useCollection.ts` | Tier colors, labels, tier calculation |
| `tailwind.config.js` | Nativewind theme extension |
| `global.css` | Tailwind directives only |
| `app.json` / `app.config.ts` | Expo app theme config (splash: `#0B0B0F`) |

### UI Components

| File | Component |
|---|---|
| `src/components/ui/Button.tsx` | Button (primary/secondary/ghost) |
| `src/components/ui/Input.tsx` | Text input with label + error |
| `src/components/ui/TierPill.tsx` | Tier badge pill |
| `src/components/ui/EmptyState.tsx` | Empty state with icon + CTA |
| `src/components/ui/SkeletonLoader.tsx` | Pulse skeleton loading |
| `src/components/ui/OfflineBanner.tsx` | Offline status banner |
| `src/components/ui/ErrorState.tsx` | Error state with retry |
| `src/components/ui/PullToRefresh.tsx` | Pull-to-refresh wrapper |

### Passport & Collection

| File | Component |
|---|---|
| `src/components/passport/PassportHeader.tsx` | User header with avatar + parallax |
| `src/components/passport/PassportShareButton.tsx` | Purple-to-pink gradient share CTA |
| `src/components/passport/PassportCoverAnimation.tsx` | Leather book cover animation |
| `src/components/passport/CollectionStamp.tsx` | Collection card with type treatment |
| `src/components/passport/BadgeGrid.tsx` | Badge grid with earned/locked states |
| `src/components/passport/BadgeDetailModal.tsx` | Badge detail + celebration animation |
| `src/components/passport/TierProgressModal.tsx` | Tier roadmap + progress bar |
| `src/components/passport/ShareSheet.tsx` | Share sheet for passport |
| `src/components/collection/WaxSeal.tsx` | SVG scalloped wax seal |
| `src/components/collection/SharePrompt.tsx` | Share prompt with blur |
| `src/components/collection/ConfirmationModal.tsx` | Confirmation modal with blur |

### Home & Artist

| File | Component |
|---|---|
| `src/components/home/EventCard.tsx` | Event card with artist photo |
| `src/components/home/ArtistRow.tsx` | Horizontal artist row |
| `src/components/home/VenueGroupCard.tsx` | Venue group card |
| `src/components/artist/ArtistHero.tsx` | Full-width hero with scrim |
| `src/components/artist/SimilarArtists.tsx` | Similar artists carousel |
| `src/components/search/SearchResultCard.tsx` | Search result card |
| `src/components/search/SpotifyResultCard.tsx` | Spotify search result |

### Layout

| File | Component |
|---|---|
| `app/(tabs)/_layout.tsx` | Floating tab bar with blur pill |

### Style Dependencies

```json
{
  "nativewind": "~4.2.0",
  "tailwindcss": "^3.4.17",
  "expo-linear-gradient": "~55.0.8",
  "expo-blur": "~55.0.4",
  "react-native-reanimated": "4.2.1",
  "react-native-svg": "~16.0.0",
  "expo-haptics": "~55.0.8",
  "lottie-react-native": "^7.3.6",
  "@expo-google-fonts/poppins": "^0.4.1",
  "lucide-react-native": "^0.475.0"
}
```

---

## Color Opacity Hex Appendix

Common patterns used throughout the codebase:

| Hex Suffix | Opacity | Example |
|---|---|---|
| `15` | ~8% | Badge gradient end |
| `26` | ~15% | Tier pill bg, share button bg |
| `33` | ~20% | Badge gradient start, genre pill bg |
| `42` | ~26% | Occasional overlays |
| `99` | ~60% | Hero scrim mid-point |
