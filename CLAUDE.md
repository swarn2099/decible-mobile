# CLAUDE.md — Decibel Mobile

> You are building Decibel, a live music passport app. This file is your bible. Read it fully before every session.

---

## WHAT IS DECIBEL

Decibel is a live music passport with two audiences:

- **Group A (Artist Hunters):** Compete to discover and claim underground artists. Enter via the Add flow. Their collection = **Finds**.
- **Group B (Night-Out Loggers):** Want a diary of live shows attended. Enter via Check In. Their collection = **Stamps**.

Same app, same data, two lenses. Every Stamp requires a live performer — no live music, no stamp.

---

## PROJECT STRUCTURE

```
~/decibel-mobile/          — This React Native + Expo project (FRESH BUILD)
~/decibel-mobile-v4/       — Old codebase (reference only, do NOT modify)
~/decibel/                 — Next.js backend API (Vercel, decible.live)
```

**Mobile app:** React Native + Expo
**Backend API:** Next.js on Vercel at decible.live/api
**Database:** Supabase
**VM:** DigitalOcean 159.203.108.156 (scrapers, cron jobs)

---

## KEY FILES

| File | Purpose |
|------|---------|
| DECIBEL_PRD_v5.md | Full product spec — the single source of truth |
| DESIGN_SYSTEM.md | Colors, fonts, spacing, gradients, component styles |
| CLAUDE.md | This file — project context and rules |

---

## NAVIGATION — THREE TABS

```
[ Home ]  [ + ]  [ Passport ]
```

- Home: Activity feed + search bar (top left icon) + map/events (top right icon)
- + (center, raised pink button): "Add an Artist" OR "I'm at a Show"
- Passport: Finds (2x3 artist card grid) + Stamps (analog passport section)

Tab bar is a floating pill with blur background (Corner app style). The + button is elevated with a pink circle.

---

## CRITICAL RULES

### Search & Adding Artists
- There is NO text search for external artists. No Deezer. No Spotify search. No Apple Music search.
- Adding new artists is LINK PASTE ONLY — user pastes a Spotify, Apple Music, or SoundCloud URL
- The Home screen search bar searches ONLY existing Decibel artists and Decibel users
- The "Add Artist" flow lives on the + tab, not on any search screen

### Eligibility Threshold
- Spotify artists: must be under 1,000,000 monthly listeners
- SoundCloud artists: must be under 100,000 followers
- Apple Music artists: cross-reference on Spotify by name. If not found on Spotify, default to eligible.
- Over threshold = rejected with message: "This artist has over 1M monthly listeners and can't be added to Decibel."

### Finds vs Stamps
- **Finds** = online discovery (Founded or Discovered). No venue, no location. Portfolio/gallery visual style.
- **Stamps** = live attendance (Collected at a venue). Has venue + date. Analog passport visual style.
- These are NOT the same. They have completely different visual treatments on the Passport tab.
- The activity feed shows BOTH: find cards ("Brendan found Bennett Coast") and stamp cards ("Arunima was at Smartbar")

### Collection Hierarchy
1. Founded (gold ★) — one-of-one, first person to add artist to Decibel
2. Collected (pink ✓) — location-verified at a live show
3. Discovered (purple compass) — found online

### Check In Rules
- GPS match → venue database (200m Haversine)
- Known lineup → auto-collect all artists as Stamps
- No lineup → prompt user: "Is there live music?" → Yes = tag DJ via link paste → Stamp / No = no stamp
- Unknown venue → user adds venue name + tags DJ → venue added to DB → Stamp
- No live music = NO STAMP. Ever. Bars with jukeboxes/TouchTunes do not count.

---

## THEME SYSTEM

The app supports dark and light mode based on device system preferences. EVERY screen and component must work in both themes. Test both after every change.

### Dark Mode
- Background: #0B0B0F
- Card: #15151C
- Card border: rgba(255,255,255,0.06)
- Text primary: #FFFFFF
- Text secondary: rgba(255,255,255,0.6)

### Light Mode
- Background: #F5F5F7
- Card: #FFFFFF
- Card border: rgba(0,0,0,0.06)
- Text primary: #1A1A1A
- Text secondary: rgba(0,0,0,0.5)

### Accent Colors (both themes)
- Pink: #FF4D6A (stamps, collected, active tab, check-in)
- Purple: #9B6DFF (discovered)
- Gold: #FFD700 (founded, founder badge)
- Teal: #00D4AA
- Blue: #4D9AFF

### Font
Poppins — Regular (400), Medium (500), SemiBold (600), Bold (700)

---

## BACKEND API

Base URL: `https://decible.live/api`

All mobile endpoints are prefixed with `/mobile/`. Auth via Supabase JWT token in Authorization header.

### Existing Endpoints (already built)
- GET /mobile/activity-feed
- GET /mobile/my-rank
- GET /mobile/search-users
- POST /mobile/follow
- DELETE /mobile/follow
- GET /mobile/followers
- GET /mobile/following
- POST /mobile/live-lookup

### New Endpoints (to be built on backend)
- POST /mobile/add-artist — add new artist from validated link
- POST /mobile/discover — discover existing artist
- POST /mobile/check-in — check in at venue, create stamps
- POST /mobile/tag-performer — user tags a performer at venue
- POST /mobile/validate-artist-link — parse link, fetch info, check eligibility
- GET /mobile/artist-fans — fans list for an artist
- GET /mobile/search-artists — search Decibel artists by name
- GET /share-card/founder — generate founder share card PNG
- GET /share-card/passport — generate passport share card PNG

### Database
Supabase. Key tables: fans, performers, collections, founder_badges, venues, events, user_tagged_events.

New columns on performers: spotify_id, spotify_monthly_listeners, spotify_listeners_updated_at, soundcloud_followers, apple_music_id, source_platform, source_url.

---

## COPYING FROM OLD CODEBASE

The old project is at ~/decibel-mobile-v4/. You may copy:

- **Auth flow** — login, signup, token management, Supabase client config
- **API service layer** — fetch wrappers, auth headers, base URL config
- **Type definitions** — TypeScript interfaces for performers, fans, collections, venues, events
- **Location services** — GPS permission handling, Haversine distance calculation
- **Theme provider** — dark/light mode detection and context (adapt tokens to match DESIGN_SYSTEM.md)
- **Reusable components** — avatar, badge icons, loading spinners (if they match the design system)

Do NOT copy:
- Navigation structure (was 4 tabs, now 3)
- Screen components (all rebuilt from scratch per PRD v5)
- Search screen (eliminated)
- Old passport layout (completely redesigned)

---

## VISUAL DESIGN GUIDELINES

### Finds (Passport → Finds section)
- Clean, modern, digital aesthetic
- 2x3 grid of artist cards
- Card: large artist photo (60% height), name + badge, fan count, "Listen" button
- Dark mode: dark card surface, gold border glow for Founded, purple for Discovered
- Light mode: white card, shadow, same accent borders
- "View All [X] Finds →" link below grid

### Stamps (Passport → Stamps section)
- Textured, analog, passport-like aesthetic
- Paper grain background texture
- Each stamp slightly rotated (-3° to +3°)
- Circular or rectangular stamp border
- Venue name prominent, date in monospace, artist name(s) below
- Faded ink texture, pink/magenta tint
- Dark mode: dark leather texture, stamps with slight glow
- Light mode: cream/lighter leather, stamps without glow

### Stamp Animation (on check-in)
- Rubber stamp visual slams down
- Haptic feedback (medium impact) on contact
- Ink spreads on impact (Lottie animation)
- Stamp lifts to reveal venue + date + artist
- Subtle ink splatter particles

### Post-Found Celebration
- Lottie confetti animation
- Gold ★ badge reveal (for Founded) or purple compass (for Discovered)
- Haptic feedback (heavy for Founded, medium for Discovered)
- Share card auto-generated and prompted

### Tab Bar
- Floating pill, 28px border radius
- 16px horizontal margin from screen edges
- Blur background (expo-blur, intensity 25)
- + button: elevated, pink circle, larger than other icons
- Active: pink icon+label. Inactive: muted.

---

## GSD FRAMEWORK

When executing phases:
1. Read the relevant PRD section fully before writing any code
2. Plan the phase (files to create/modify, components, API calls)
3. Build incrementally — one screen or feature at a time
4. Test both dark and light mode after every screen
5. Commit after each completed feature: `feat(mobile): [description]`
6. Run /compact after each phase to manage context
7. If context exceeds 50%, restart the tmux session and continue from the last commit

### Phase Order (from PRD v5 Section 16)
1. Fix What's Broken → 2. Rebuild Search/Add → 3. Check In → 4. Passport Redesign → 5. Share & Virality → 6. Polish & Ship

---

## COMMON PITFALLS FROM V4

These bugs appeared in the old build. Avoid them:

- **Card spacing:** Always use explicit marginBottom (8px between cards). Never rely on implicit spacing.
- **Full-width cards:** Every card/element on a screen should have consistent horizontal padding (16px). Don't let some elements bleed to edges while others are inset.
- **Discover button:** Must check founder_badges table, collections table, AND the current user's relationship. Button state hierarchy: Founded > Collected > Discovered > No relationship.
- **Listen links:** Only show for platforms where URL actually exists in DB. Label must match platform. Linking.openURL() must receive a valid URL.
- **User profiles:** When viewing another user's profile, query THEIR fan_id, not the current user's. This was a recurring bug.
- **Following screen:** Must have back navigation. Stamp/find counts must be accurate per user.
- **Theme consistency:** Every new component must use theme colors from context, never hardcoded values.
- **Bottom padding:** All scrollable screens need extra bottom padding to account for floating tab bar height.
- **SoundCloud URLs:** Support with/without https, with/without www, with m. subdomain.

---

## DEPLOYMENT

- **EAS Project ID:** 44471fff-8ba1-46a0-9901-bdaf6ebef534
- **Bundle ID:** com.decibel.app
- **Update command:** `eas update --channel preview --message "[description]"`
- **Build command:** `eas build --platform ios --profile preview`

---

## DO NOT

- Do not use Deezer API for anything
- Do not add text search for external artist catalogs
- Do not create stamps without a live performer
- Do not show "Listen on Spotify" unless the artist has an actual Spotify URL
- Do not hardcode "Chicago" as artist location
- Do not use 4 tabs — it's 3 tabs now
- Do not skip dark/light mode testing
- Do not ask Swarn to do manual steps — use available tools (Supabase CLI, Vercel CLI, GitHub SSH)
