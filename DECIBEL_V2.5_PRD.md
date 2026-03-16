# DECIBEL v2.5 PRD — "Polish & Identity"

**Milestone:** v2.5  
**GSD Milestone Name:** `v2.5 — Polish & Identity`  
**Author:** Swarn  
**Date:** March 13, 2026  
**Repo:** swarn2099/decible-mobile  
**Estimated Build:** 3-4 days  
**Prereq:** Current mobile app deployed with existing passport screen and login flow

---

## Overview

Two focused redesigns that define how Decibel looks and feels at first contact and on the most important screen in the app:

1. **Login Flow Redesign** — The current login screen is a plain white/dark screen with a centered wordmark and a single email input. It looks like a template. It needs to set the tone for the entire app: underground, dark, alive.
2. **Passport Screen Redesign** — Rebuild the passport to follow Instagram's profile layout pattern. The current passport has oversized cards, a light pink aesthetic that conflicts with the brand, and poor information density. The new layout should be dark-first, compact, and make the collection feel substantial even with a small number of entries.

---

## Phase 1: Login Flow Redesign

**Estimated build:** 1 day  
**Priority:** High — first screen every user sees, sets the entire tone

### 1.1 Current Problems

- Plain centered wordmark with no visual energy
- Single email input + "Send Magic Link" button looks like a developer placeholder
- Light version is fully white — completely off-brand
- Dark version is better but still barren — just text on a dark background
- No sense of what the app is, what it feels like, or why you should be excited to sign in
- "Send Magic Link" button has almost no visual weight (barely visible in the dark version)
- No onboarding context — new users have zero idea what they're signing into

### 1.2 New Login Screen Design

**Background:** Dark (#0B0B0F) with a subtle animated element — either:
- Slow-moving gradient orbs (brand colors: pink #FF4D6A, purple #9B6DFF, blue #4D9AFF) floating behind the content at low opacity (0.15-0.2). Creates life and movement without distraction.
- OR a looping ambient video/animation of a crowd silhouette or waveform at very low opacity as background texture.
- Recommendation: Go with the gradient orbs. Lighter to build, performs better, and ties into the glassmorphism language for the passport later.

**Layout (top to bottom):**

```
┌──────────────────────────────────────────┐
│                                          │
│        [animated gradient orbs bg]       │
│                                          │
│              D E C I B E L               │  ← Wordmark, Poppins Bold, tracked-out
│          Your Live Music Passport        │  ← Tagline, muted gray
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  📧  Email address                │  │  ← Dark input field, rounded, icon
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │        Send Magic Link             │  │  ← Brand gradient button (pink→purple)
│  └────────────────────────────────────┘  │
│                                          │
│     We'll send a sign-in link to your    │  ← Helper text, muted
│                  email                   │
│                                          │
│  ─── ─── ─── ─── ─── OR ─── ─── ───    │  ← Divider
│                                          │
│     [G]  Continue with Google            │  ← Social login option (if supported)
│     [🍎] Continue with Apple             │  ← Social login option (if supported)
│                                          │
│                                          │
│        By continuing, you agree to       │  ← Footer, tiny muted text
│       Terms of Service & Privacy         │
└──────────────────────────────────────────┘
```

### 1.3 Design Specifications

**Wordmark:**
- "D E C I B E L" — Poppins Bold, letter-spacing 6-8px, white, 28px
- Positioned in the upper third of the screen (not dead center — give it breathing room above but don't waste the top half of the screen)

**Tagline:**
- "Your Live Music Passport" — Poppins Regular, 14px, #8E8E93

**Email input:**
- Dark fill: #1A1A1F
- Border: 1px solid rgba(255,255,255,0.12)
- Border radius: 12px
- Height: 52px
- Text: white, 16px
- Placeholder text: #8E8E93
- Left icon: mail icon, muted gray
- On focus: border color transitions to brand pink (#FF4D6A) with subtle glow

**Send Magic Link button:**
- Full width (matching input width)
- Height: 52px
- Background: linear gradient from #FF4D6A to #9B6DFF (left to right)
- Text: white, Poppins SemiBold, 16px
- Border radius: 12px
- On press: scale down to 0.97, spring back
- Haptic feedback on tap (medium impact)
- Loading state: button text replaced with a small white spinner, gradient stays

**Social login buttons (if applicable):**
- Dark fill matching input style (#1A1A1F)
- Icon on the left, text centered
- Same dimensions as email input
- Only include if the auth system supports Google/Apple Sign-In. If magic link only, skip this section entirely and remove the OR divider.

**Helper text:**
- "We'll send a sign-in link to your email" — Poppins Regular, 12px, #8E8E93
- Centered below the button

**Footer:**
- "By continuing, you agree to Terms of Service & Privacy Policy" — 11px, #6E6E73
- Terms and Privacy are tappable links (underlined or brand pink)

### 1.4 Animation & Polish

- Gradient orbs animate slowly (15-20 second loop, ease-in-out, floating drift)
- Wordmark fades in on screen mount (300ms, ease-out)
- Input and button stagger-fade in after wordmark (150ms delay between each)
- Keyboard avoidance: when keyboard opens, content shifts up smoothly (use `KeyboardAvoidingView` with behavior="padding" on iOS)
- If magic link is sent successfully, button transitions to a checkmark icon with text "Check your email" and a subtle green tint, before navigating away

### 1.5 Acceptance Criteria

- [ ] Login screen uses dark background (#0B0B0F), no light/white version
- [ ] Animated gradient orbs render behind content
- [ ] Wordmark is tracked-out Poppins Bold, positioned in upper third
- [ ] Email input has dark fill, rounded corners, focus state with pink border glow
- [ ] Send Magic Link button has brand gradient (pink → purple)
- [ ] Button has press animation + haptic feedback
- [ ] Loading state shows spinner in button
- [ ] Success state shows checkmark + "Check your email"
- [ ] Keyboard avoidance works smoothly on iOS and Android
- [ ] Helper text and footer display correctly
- [ ] Content fades in on mount with stagger animation
- [ ] Social login buttons render if auth supports them, hidden if not
- [ ] Screen sets the tone: dark, alive, underground — not a template

---

## Reference: Instagram Profile Layout Pattern

The target layout follows Instagram's profile structure exactly:

1. **Compact header row** — Profile photo (left), stats row (right) on the same horizontal line
2. **Bio/info area** — Username, member since, any bio text
3. **Action buttons** — Share Passport, Edit Profile as horizontal buttons
4. **Sticky tab bar** — Stamps | Finds | Discoveries tabs that stick to the top of the screen when scrolled past
5. **3-column grid** — Dense square thumbnails, 3 per row, minimal gap between them
6. **No story circles** — Remove any animated circles or highlight-style elements

---

## Phase 2: Passport Layout & Structure

### 2.1 Profile Header (Compact, Single Row)

**Current problem:** Profile photo, stats, username, and member date are spread across too much vertical space. The pink circle around the avatar doesn't match the dark brand.

**New layout:**

```
┌──────────────────────────────────────────┐
│ [Avatar]   10        4         0         │
│  60x60    Finds    Stamps   Followers    │
│                                          │
│ swarn2099                          ⚙️    │
│ Member since March 2026                  │
│                                          │
│ [  Share Passport  ] [ Edit Profile ]    │
└──────────────────────────────────────────┘
```

- **Avatar:** 60x60, circular, no pink/colored border ring. Thin 1px border in `rgba(255,255,255,0.15)` or no border at all. Dark background behind it.
- **Stats row:** Inline with avatar, right-aligned. Three stats: Finds count, Stamps count, Followers count. Bold number on top, label below in muted text. Same layout as Instagram (number + label stacked vertically, spaced evenly).
- **Username:** Bold, white, Poppins, left-aligned below avatar row. Settings gear icon right-aligned on the same line.
- **Member since:** Muted gray text below username. Single line.
- **Action buttons:** Two buttons side by side, equal width. "Share Passport" (primary, gradient fill matching brand pink-to-purple) and "Edit Profile" (secondary, outlined or dark fill with subtle border). Both use rounded corners (8px), compact height (~36px).
- **No trophy icon** in the header — badges live in their own section below the grid or as a separate tab if needed later.
- **Total header height target:** ~180px max. Instagram's header is roughly this compact. The current header is easily 300px+.

### 2.2 Sticky Tab Bar

**Current:** Tabs exist but don't stick. They scroll away with the content.

**New behavior:**

- Three tabs: **Stamps** | **Finds** | **Discoveries**
- Tab bar sits directly below the action buttons
- When user scrolls down past the tab bar, it **sticks to the top of the screen** (below the status bar / nav bar)
- Active tab has an underline indicator (2px, white or brand pink)
- Inactive tabs are muted gray text
- Swiping left/right on the grid switches tabs (gesture navigation between tabs)
- Tab bar background matches the dark page background (#0B0B0F) with no separation line, or a very subtle 1px border-bottom in `rgba(255,255,255,0.08)`

**Implementation:** Use a `SectionList` or `Animated.ScrollView` with `stickyHeaderIndices` for the tab bar, or use `react-native-tab-view` / `@react-navigation/material-top-tabs` with a custom tab bar that sticks. The scroll offset should be tracked so the header collapses naturally and the tab bar pins.

### 2.3 Dark Theme Enforcement

**Current problem:** Light pink/white background, pastel card colors, pink gradient elements make it feel like a completely different app from the intended brand.

**New theme:**

- Page background: `#0B0B0F` (existing brand dark)
- Card/thumbnail backgrounds: `#1A1A1F` or transparent (the artist image fills the square)
- Text: White (`#FFFFFF`) for primary, `#8E8E93` for secondary/muted
- Tab bar: Dark background, white active text, gray inactive text
- Stats numbers: White, bold
- Stats labels: Muted gray, regular weight
- Share Passport button: Gradient from `#FF4D6A` to `#9B6DFF` (brand pink to purple)
- Edit Profile button: `#1A1A1F` fill with `rgba(255,255,255,0.15)` border
- No pink circles, no light backgrounds, no pastel tints anywhere on this screen

---

## Phase 3: Grid & Cards

### 3.1 Three-Column Grid

**Current problem:** 2-column layout with massive cards. Low density. Takes forever to scroll through a small collection. Doesn't feel like a real collection.

**New layout:**

- **3 columns**, square aspect ratio (1:1) per cell
- **Minimal gap:** 1-2px between cells (Instagram uses ~1px)
- Each cell is roughly `(screenWidth - 4px) / 3` wide and the same height
- Artist's image fills the entire square (cover/fill, not contain)
- Grid uses `FlatList` with `numColumns={3}` for performance

### 3.2 Cell Overlay

Each grid cell shows the artist image as the full background with a **subtle bottom gradient overlay** (transparent to `rgba(0,0,0,0.7)`) containing:

- **Artist name** — White, bold, small font (12-13px), bottom-left of the cell
- **Date** — Muted text, even smaller (10-11px), directly below artist name

**Per-tab cell variations:**

**Stamps tab cells:**
- Artist image fills cell
- Bottom overlay: Artist name + venue name (truncated if long) + date
- Small icon badge in top-right corner: Founder star (gold ★) if user is the founder of this artist, otherwise no icon

**Finds tab cells:**
- Artist image fills cell
- Bottom overlay: Artist name + platform icon (Spotify green dot / SoundCloud orange dot / Apple pink dot) + date
- Founder star badge in top-right if applicable

**Discoveries tab cells:**
- Artist image fills cell
- Bottom overlay: Artist name + "via @username" + date
- Slightly lower opacity than Stamps/Finds cells (0.85 vs 1.0) to visually communicate lower conviction tier

### 3.3 Cell Tap Behavior

- Tapping a cell opens the artist detail page (existing behavior)
- **Haptic feedback** on tap (light impact)
- Subtle press-down scale animation on touch (scale 0.97, spring back on release)

### 3.4 Empty State

When a tab has zero entries:

- Center-aligned in the grid area
- Icon relevant to the tab (stamp icon / compass icon / binoculars icon), muted gray, 48px
- Text below: "No stamps yet" / "No finds yet" / "No discoveries yet"
- Subtle CTA below: "Go to a show to earn stamps" / "Add an artist to start finding" / "Follow people to discover artists"
- Dark background, muted styling — don't make emptiness loud

### 3.5 View More / Pagination

- The grid shows **all entries** in a scrollable grid (not limited to 8). The 3-column layout is naturally dense enough that 8 entries is only ~3 rows, which feels like nothing. Let it scroll infinitely.
- If the collection is large (50+), paginate with infinite scroll loading 30 at a time
- No "View More" button needed — the grid IS the full view
- Ordered newest to oldest (most recent at top-left)

---

## Phase 4: Badges Section

### 4.1 Relocation

**Current problem:** Badges are shown on the passport page below the grid, taking up massive space with a flat, generic look.

**New approach:**

- **Remove badges from the main passport scroll entirely**
- Add a **fourth tab** to the sticky tab bar: Stamps | Finds | Discoveries | **Badges**
- OR: Add a small "Badges (3/19)" row between the action buttons and the tab bar that taps to open a dedicated badges sheet/page
- Recommendation: Go with the small row approach. A fourth tab dilutes the three collection types. A compact row like `🏅 3 of 19 badges earned  →` gives a teaser without cluttering the main view.

### 4.2 Badges Detail Page

When tapped, opens a full-screen modal or pushed page:

- Dark background (#0B0B0F)
- 3-column grid of badge icons
- **Earned badges:** Full color, slight glow/shadow, vibrant
- **Locked badges:** Grayscale or dark silhouette with low opacity (0.3). NOT the current beige circles — they should look like they're waiting to be unlocked, not like placeholder UI
- Badge name below each icon
- Tapping an earned badge shows a detail card (how you earned it, date)
- Tapping a locked badge shows requirements to unlock

---

## Design System Updates

### Colors (passport-specific)
```
Background:           #0B0B0F
Card/Cell BG:         Artist image (full bleed)
Cell overlay gradient: transparent → rgba(0,0,0,0.7)
Primary text:         #FFFFFF
Secondary text:       #8E8E93
Tab active:           #FFFFFF (with underline)
Tab inactive:         #8E8E93
Share button gradient: #FF4D6A → #9B6DFF
Edit button fill:     #1A1A1F
Edit button border:   rgba(255,255,255,0.15)
Founder badge:        #FFD700 (gold)
Spotify dot:          #1DB954
SoundCloud dot:       #FF5500
Apple Music dot:      #FC3C44
```

### Typography (passport-specific)
```
Username:             Poppins SemiBold, 18px, #FFFFFF
Member since:         Poppins Regular, 13px, #8E8E93
Stat number:          Poppins Bold, 17px, #FFFFFF
Stat label:           Poppins Regular, 12px, #8E8E93
Tab label:            Poppins Medium, 14px
Cell artist name:     Poppins SemiBold, 12px, #FFFFFF
Cell secondary text:  Poppins Regular, 10px, rgba(255,255,255,0.7)
Badge label:          Poppins Regular, 11px, #8E8E93
```

---

## Technical Notes

### Sticky Tab Implementation

Two approaches, pick whichever performs better:

**Option A: `react-native-tab-view` with collapsible header**
- Use `react-native-collapsible-tab-view` package
- Profile header is the collapsible section
- Tab bar pins automatically when header scrolls away
- Each tab renders its own FlatList with `numColumns={3}`

**Option B: Manual `Animated.ScrollView` with `stickyHeaderIndices`**
- Wrap entire page in Animated.ScrollView
- Header is index 0, tab bar is index 1 with `stickyHeaderIndices={[1]}`
- Grid content follows
- Track scroll offset to manage tab switching

Option A is cleaner and handles gesture-based tab switching out of the box. Recommended.

### Image Handling

- Artist images should be cached aggressively (use `expo-image` or `react-native-fast-image`)
- Grid cells render square thumbnails — if the source image isn't square, crop to center/cover
- Use lower-resolution thumbnails for the grid (200x200 max) to keep scrolling smooth
- Full-res images load on tap into detail view

---

## Acceptance Criteria

- [ ] Profile header is compact: avatar, stats, username, member since, action buttons all fit in ~180px height
- [ ] No pink circles, no light theme elements, no pastel backgrounds — fully dark
- [ ] Avatar has no colored ring (thin subtle border or none)
- [ ] Stats (Finds, Stamps, Followers) display inline with avatar, Instagram-style
- [ ] Share Passport button has brand gradient (pink → purple)
- [ ] Edit Profile button has dark fill with subtle border
- [ ] Three tabs (Stamps / Finds / Discoveries) sit below action buttons
- [ ] Tab bar sticks to top of screen when scrolled past header
- [ ] Swiping left/right switches between tabs
- [ ] Active tab has white text + underline indicator
- [ ] Grid is 3 columns with ~1px gap, square cells
- [ ] Artist image fills each cell completely (cover/crop)
- [ ] Bottom gradient overlay shows artist name + relevant metadata per tab
- [ ] Stamp cells show artist + venue + date
- [ ] Find cells show artist + platform icon + date
- [ ] Discovery cells show artist + "via @user" + date
- [ ] Founder badge (gold ★) shows in top-right corner of cell when applicable
- [ ] Haptic feedback + press-down animation on cell tap
- [ ] Grid scrolls smoothly with 30+ entries
- [ ] Empty states display correctly per tab with relevant messaging
- [ ] Badges removed from main passport scroll
- [ ] Badges accessible via compact teaser row or separate interaction
- [ ] Badges detail page: earned = vibrant color, locked = dark silhouette
- [ ] Grid ordered newest to oldest
- [ ] Overall page feels like Instagram's profile — compact, dense, scrollable

---

## GSD Kickoff Prompt

```
Read CLAUDE.md and DECIBEL_V2.5_PRD.md.

Initialize a new GSD milestone: "v2.5 — Polish & Identity"

This is a focused visual redesign of two critical screens. Four phases:
1. Login Flow Redesign — dark theme, animated gradient orbs bg, branded input + button, magic link flow polish
2. Passport Layout & Structure — compact Instagram-style header, sticky tabs, dark theme enforcement
3. Passport Grid & Cards — 3-column Instagram-style grid, cell overlays with artist info, tap behavior
4. Badges Section — relocate badges off main scroll, earned vs locked styling

Phase 1 is the login screen — first impression matters. Phases 2-4 are the passport — the identity of the app.

Everything dark. No pink backgrounds. No pastels. No light theme anywhere. Brand colors (pink #FF4D6A, purple #9B6DFF, blue #4D9AFF) are accent only, never background fills.

Start with Phase 1. Run /compact after each phase completes.
```
