# DECIBEL — Product Requirements Document v5.0

> **Single source of truth.** This document supersedes all previous PRDs (v1–v4), bugfix milestones, and scattered specs. Everything is here.

---

## 1. WHAT IS DECIBEL

Decibel is a live music passport app for discovering underground artists and logging the shows you attend. It serves two audiences through a single product:

**Group A — Artist Hunters (Brendan, Emilia):** Competitive music fans who discover and claim emerging artists before anyone else. They enter through the Add flow. Their value is taste-as-identity — the Founder badge proves they knew an artist first. Their collection is called **Finds**.

**Group B — Night-Out Loggers (Arunima):** Social people who go out 2–4x per month and want a beautiful record of everywhere they've been. They enter through the Check In flow. Their value is a personal diary of live music experiences. Their collection is called **Stamps**.

Both groups share the same app, the same passport, and the same artist data. Group B passively generates verified fan data (Stamps) that makes Group A's online claims (Finds) more valuable.

**Core rule:** Decibel is a live music passport. Every Stamp requires a live performer. No live music = no Stamp. Bars with jukeboxes or TouchTunes playlists do not qualify.

---

## 2. APP STRUCTURE

### 2.1 Navigation — Three Tabs

The app uses a floating pill-style tab bar (Corner app aesthetic) with three tabs:

```
[ Home ]  [ + ]  [ Passport ]
```

- **Home** — Activity feed + search bar + map/events access
- **+ (center, raised pink button)** — Add an artist OR Check in at a show
- **Passport** — Your Finds and Stamps

The + tab is visually elevated — larger icon, pink (#FF4D6A) circle background, raised above the pill. It signals that adding/collecting is THE primary action.

### 2.2 Tab Bar Design

Floating rounded pill shape, not a full-width bar.

- Shape: 28px border radius, fully rounded
- Horizontal margin: 16px from screen edges
- Background: Semi-transparent with backdrop blur (expo-blur)
  - Dark: rgba(11, 11, 15, 0.85) + blur intensity 25
  - Light: rgba(245, 245, 247, 0.85) + blur intensity 25
- Border: 1px — dark: rgba(255,255,255,0.08), light: rgba(0,0,0,0.06)
- Shadow: dark: rgba(0,0,0,0.3), light: rgba(0,0,0,0.1)
- Height: 56px + safe area padding
- Active state: Pink (#FF4D6A) icon + label
- Inactive state: dark: rgba(255,255,255,0.4), light: rgba(0,0,0,0.35)
- Content on all screens must have bottom padding to account for floating tab bar

### 2.3 Theme Support

The app supports dark and light mode based on the device's system preferences. Every screen, component, and animation must be tested in both themes.

**Dark mode tokens:**
- Background: #0B0B0F
- Card surface: #15151C
- Card border: rgba(255,255,255,0.06)
- Text primary: #FFFFFF
- Text secondary: rgba(255,255,255,0.6)

**Light mode tokens:**
- Background: #F5F5F7
- Card surface: #FFFFFF
- Card border: rgba(0,0,0,0.06)
- Text primary: #1A1A1A
- Text secondary: rgba(0,0,0,0.5)

**Shared accent colors:**
- Pink: #FF4D6A (Stamps, collected, active tab)
- Purple: #9B6DFF (Discovered)
- Gold: #FFD700 (Founded / Founder badge)
- Teal: #00D4AA
- Blue: #4D9AFF

**Font:** Poppins throughout.

---

## 3. HOME TAB

### 3.1 Top Bar

The Home screen has a top bar with three elements:

- **Left:** Search icon (magnifying glass) — taps into a full search screen
- **Center:** "DECIBEL" wordmark or logo
- **Right:** Map icon — taps into the venue map + upcoming events screen

### 3.2 Search Screen (accessed from Home)

A full screen that slides in from tapping the search icon. Contains one text search bar that queries two data sources simultaneously:

**Artists on Decibel** — shows results with artist photo, name, fan count, Founded/Discovered/Collected badge. Tapping navigates to the artist profile.

**People on Decibel** — shows results with avatar, display name, find count, stamp count. Tapping navigates to their user profile.

Placeholder text: "Search artists or people..."

This search is for browsing existing content only. Adding NEW artists happens on the + tab.

### 3.3 Map & Events Screen (accessed from Home)

A full screen that slides in from tapping the map icon. Contains:

**Map view** — dark-styled map of Chicago with colored venue dots. Genre filter pills (All, House, Techno, Bass, Disco, etc.) and a "Tonight" toggle. Tapping a venue dot shows venue name and tonight's lineup if available.

**Events view** — toggle to a list view of upcoming events this week, sorted chronologically. Each event card shows date, venue, lineup, genre tags.

### 3.4 Activity Feed

The main body of the Home tab. A chronological feed of actions from people you follow and activity across Decibel.

**Two types of activity cards:**

**Find cards:**
- "[avatar] Brendan **found** Bennett Coast · 2h ago · [artist photo]" — gold accent
- "[avatar] Emilia **discovered** Sun Room · 20h ago · [artist photo]" — purple accent

**Stamp cards:**
- "[avatar] Arunima **was at** Smartbar — DJ Heather, Derrick Carter · Last Friday · [venue/artist photo]" — pink accent
- "[avatar] Cullen **checked in** at Spybar — Gene Farris · Yesterday · [venue/artist photo]" — pink accent

Tapping the artist name/photo navigates to the artist profile. Tapping the user avatar/name navigates to their profile.

The feed should show a mix of Finds and Stamps. Find cards emphasize the artist (who was found). Stamp cards emphasize the venue (where they were) with artists as secondary info.

---

## 4. ADD TAB (+)

The center tab. The primary action screen. Opens with two large buttons or a toggle at the top:

### 4.1 Two Modes

**"Add an Artist"** — for claiming/discovering artists online (Finds)

**"I'm at a Show"** — for checking in at a venue (Stamps)

### 4.2 Add an Artist Flow (Finds)

This is link-paste only. No text search for external artists.

**Step 1:** User sees a paste field with placeholder: "Paste a Spotify, Apple Music, or SoundCloud link..."

**Step 2:** User pastes a link. App detects the platform:
- Spotify URL (open.spotify.com/artist/...) → extract artist ID
- Apple Music URL (music.apple.com/.../artist/...) → extract artist ID
- SoundCloud URL (soundcloud.com/artist-name) → extract artist slug
- Unsupported URL → show error: "Paste a Spotify, Apple Music, or SoundCloud artist link."

**Step 3:** App fetches artist info from the respective platform:
- Spotify: oEmbed for name + thumbnail, background scraper for monthly listeners
- Apple Music: Apple Music API catalog lookup for name + artwork + genres, then cross-reference on Spotify by name for monthly listener count
- SoundCloud: SoundCloud API for name + avatar + follower count

**Step 4:** Eligibility check:
- Spotify: under 1,000,000 monthly listeners → eligible
- SoundCloud: under 100,000 followers → eligible
- Apple Music: cross-reference Spotify monthly listeners. If not found on Spotify, default to eligible.
- If over threshold → show artist card with message: "This artist has over 1M monthly listeners and can't be added to Decibel. Decibel is for discovering underground and emerging artists."

**Step 5:** If eligible, check if artist already exists on Decibel:
- Already on Decibel AND user has no relationship → show "Discover" button
- Already on Decibel AND user already found/discovered → show status (★ Founded / Discovered ✓)
- NOT on Decibel → show "Add + Found" button (user becomes the one-of-one Founder)

**Step 6:** On successful add/discover/found:
- **Founded:** Confetti animation, gold ★ badge appears, haptic feedback, auto-generated share card with prompt: "Share your claim?" → one-tap to Instagram Stories, Messages, or Copy Link
- **Discovered:** Purple compass badge appears, haptic feedback, lighter celebration

### 4.3 Check In Flow (Stamps)

**Scenario A — Known venue with scraped lineup:**

1. App requests location permission ("While Using" only)
2. GPS coordinates matched against venue database (200m Haversine radius)
3. App shows: "You're at [Venue Name]! Tonight: [Artist 1], [Artist 2]"
4. User taps "Check In"
5. All artists on tonight's lineup are auto-collected as Stamps
6. Stamp animation plays: rubber stamp pressing down, ink spreads, haptic thud, venue name + date + artists revealed
7. Stamps appear in passport under Nights Out view

**Scenario B — Known venue, no lineup found:**

1. GPS matches to a venue in the database
2. App queries DB for tonight's events — none found
3. App hits live-lookup scraper (RA, DICE, EDMTrain, 19hz) in real-time for tonight's lineup — none found
4. App shows: "You're at [Venue Name]! Is there live music tonight?"
5. Two options:
   - **"Yes — let me tag who's playing"** → mini search opens (same link paste flow from 4.2) → user tags the artist → Check In → Stamp created → tagged artist is visible to all other users checking in at this venue tonight
   - **"No — just hanging out"** → "Enjoy your night!" — no Stamp created
6. Next time someone checks in at this venue on the same day of week, the app suggests: "Last [Friday], [DJ Mike] was playing here. Are they here tonight?" → one-tap confirm

**Scenario C — Unknown venue (not in DB):**

1. GPS does not match any venue in the database
2. App shows: "We don't recognize this venue. Is there live music here?"
3. If yes → user enters venue name → tags the DJ via link paste → venue is added to Decibel's DB with GPS coordinates → Stamp created
4. If no → "Enjoy your night!" — nothing happens

### 4.4 Data Storage for User-Tagged Lineups

New DB table: `user_tagged_events`
- id, venue_id, performer_id, tagged_by (fan_id), event_date, created_at
- When a second user checks in at the same venue on the same night, they see the already-tagged lineup
- Over time, recurring patterns are detected: "She-nannigans has had a DJ tagged 4 of the last 5 Fridays"

---

## 5. PASSPORT TAB

The passport is the heart of the app. It has two distinct sections with completely different visual treatments.

### 5.1 Profile Header

At the top of the passport:
- Profile photo (left) with find count badge overlay
- Username + "Member since [month] [year]"
- Settings gear icon (top right)
- Stats row: [X] Following | [X] Followers | [X] Finds | [X] Stamps
- Tapping Following/Followers navigates to respective lists

### 5.2 Share Passport Button

Below the stats row, a full-width gradient button (purple → pink): "Share Passport"

Tapping generates a designed share card (NOT a screenshot) in the style of Spotify Wrapped / Strava activity cards:
- Decibel branding
- User's top stats (finds, stamps, badges)
- Top 3–5 artist photos in a grid
- Dark/branded background
- Shareable to Instagram Stories, Messages, Copy Link, Save to Photos

### 5.3 Finds Section

**Visual language:** Clean, modern, digital. Gallery/portfolio feel.

**Layout:** 2x3 grid of artist cards (6 visible), "View All [X] Finds →" link below.

**Card design (reference: uploaded Sophie Bennett card):**
- Large artist photo (hero, takes up ~60% of card height)
- Artist name below photo + badge indicator (★ for Founded, compass for Discovered)
- Fan count + stamp count (small, subtle)
- One action: "Listen" button → opens their SoundCloud/Apple Music/Spotify link

**Card theming:**
- Dark mode: #15151C card surface, subtle border, gold border glow for Founded, purple border for Discovered
- Light mode: white card, subtle shadow, same gold/purple accents

**Full collection screen:** Tapping "View All" opens a scrollable grid of all finds. Search/filter at top. Sorted by most recent by default.

### 5.4 Stamps Section

**Visual language:** Textured, analog, passport-like. Scrapbook/diary feel.

**Layout:** Stamps grouped by date/venue. Each stamp looks like it was physically pressed onto a passport page.

**Stamp design:**
- Paper grain background texture
- Each stamp appears slightly rotated (random -3° to +3°) like a real passport stamp
- Stamp shape: circular or rectangular border with venue name, date (monospace font), and artist name(s) inside
- Ink color: pink/magenta tint
- Faded ink texture — not perfectly crisp
- Date in format: "MAR 8, 2026" (monospace, small)
- Venue name prominent
- Artist name(s) below venue

**Stamp animation (on check-in):**
- A rubber stamp visual slams down onto the page
- Haptic feedback (medium impact) on contact
- Ink spreads slightly on impact (subtle Lottie animation)
- When the stamp lifts, the venue + date + artist is revealed
- Brief confetti or ink splatter particles around the edges

**Dark mode:** Dark leather texture background, stamps have a slight glow. Aged paper feel with slight yellowing.

**Light mode:** Lighter leather/cream background, stamps without glow, cleaner paper texture.

**Full stamps view:** Tapping "View All Stamps" opens a scrollable list of all stamps, sorted chronologically (most recent first). Each entry shows date, venue, and artists collected that night.

### 5.5 Badges Section

Below both Finds and Stamps sections. Shows earned badges.

Badge count display: "[X] / [Total]"

Existing badge types carry over from v2.0. Badges are earned through both Finds and Stamps.

---

## 6. ARTIST PROFILE

When a user taps on an artist anywhere in the app (feed, search, passport, map), they see the artist profile.

### 6.1 Layout

- **Hero image:** Full-bleed artist photo with gradient fade to background at bottom
- **Back arrow:** Top left, overlaid on hero image
- **Artist name:** Large, emerging from the gradient
- **Genre pills:** Horizontal row if genre data exists
- **Location:** Only if the DB has city data — never hardcoded
- **Fan count:** "[X] fans" — tappable → navigates to fans list (see 6.3)

### 6.2 Stats Card

Three columns: FANS | SHOWS | GENRES

### 6.3 Action Button

Single full-width button. One state at a time, determined by the user's relationship:

1. **No relationship** → "Discover" (purple bg, tappable) — tapping creates a Discovered Find
2. **Discovered** → "Discovered ✓" (purple outline, disabled)
3. **Collected** → "Collected ✓" (pink outline, disabled)
4. **Founded** → "★ Founded" (gold bg, disabled)

Button shows the HIGHEST relationship only.

### 6.4 Founder Card

If the artist has a Founder, show a card: "Added to Decibel by [username]" with gold crown icon. Tapping the username navigates to their profile.

### 6.5 Listen Section

Only show listen buttons for platforms where the artist has a URL in the database. Label matches the platform: "Listen on SoundCloud", "Listen on Apple Music", etc. Tapping opens the external URL via Linking.openURL(). If no listen links exist, hide the section entirely.

### 6.6 Fans List

Tapping the fan count on the artist profile navigates to a fans list screen:

- **Founder** at the top with gold accent and "★ Founder" label
- Then **Collected** fans (pink accent, "Collected" label)
- Then **Discovered** fans (purple accent, "Discovered" label)
- Each fan row: avatar, display name, collection type, tappable → their profile

### 6.7 Upcoming Shows

Only show if events exist for this artist in the DB. List of upcoming events with date, venue, time.

---

## 7. USER PROFILE (Other Users)

When viewing another user's profile:

- Same layout as own passport (profile header, stats, Finds grid, Stamps section)
- "Follow" / "Following" button instead of "Share Passport"
- Their Finds and Stamps are visible
- Correct find/stamp counts (not showing 0 for users with actual collections)

### 7.1 Following / Followers Screens

- Back arrow at top left
- List of users: avatar, display name, find count, stamp count
- "Following" / "Follow" button on each row
- Tapping a user navigates to their profile

---

## 8. SEARCH ARCHITECTURE — REPLACING DEEZER

### 8.1 Adding New Artists (+ Tab)

Link-paste only. No text search for external catalogs.

Supported platforms:
- **Spotify:** Parse open.spotify.com/artist/{id} → oEmbed for name + image → background scraper for monthly listeners
- **Apple Music:** Parse music.apple.com/{storefront}/artist/{name}/{id} → Apple Music API catalog lookup (developer token, no user auth) → cross-reference on Spotify for monthly listeners
- **SoundCloud:** Parse soundcloud.com/{slug} → SoundCloud API/scraper for name + image + follower count

### 8.2 Eligibility Thresholds

- Spotify: < 1,000,000 monthly listeners
- SoundCloud: < 100,000 followers
- Apple Music: cross-reference Spotify. If not found on Spotify, default to eligible.

### 8.3 URL Parser

Must recognize:
- https://open.spotify.com/artist/{id}
- https://spotify.link/{short} (resolve redirect)
- https://music.apple.com/{storefront}/artist/{name}/{id}
- https://soundcloud.com/{slug}
- https://www.soundcloud.com/{slug}
- https://m.soundcloud.com/{slug}
- With or without https://, with or without www.

Error message for unsupported links: "Paste a Spotify, Apple Music, or SoundCloud artist link."

### 8.4 Browsing Existing Content (Home Search)

Text search against the Decibel database:
- Artists table: search by name (ILIKE '%query%')
- Fans table: search by display_name and username

### 8.5 Spotify Scraper Infrastructure

For monthly listener counts (eligibility check + future fantasy league scoring):

- Run on the DigitalOcean VM (159.203.108.156)
- Use spotifyscraper Python library (no API auth needed)
- On-demand: triggered when a user pastes a Spotify link → scrape that artist's page
- Cron (future, Beta 2): daily scrape of all artists drafted in fantasy tournament
- Store in performers table: spotify_monthly_listeners, spotify_listeners_updated_at

---

## 9. COLLECTION HIERARCHY

### 9.1 Types

| Type | Name | Icon | Color | How Earned |
|------|------|------|-------|------------|
| Founded | ★ Founded | Gold star | #FFD700 | First person to add artist to Decibel |
| Discovered | Discovered | Purple compass | #9B6DFF | Found artist online via search/link |
| Collected | Collected | Pink checkmark | #FF4D6A | Physically at venue, location-verified |

Founded and Discovered are **Finds** (online). Collected is a **Stamp** (live, in person).

### 9.2 Founder Badge

One-of-one. Only one Founder per artist, forever. Earned by being the first person to add an artist to Decibel through the Add flow. The Founder badge is permanent and transfers to the "Finds" section of the passport.

### 9.3 Tiers (per artist, based on repeat attendance)

- Network: 1 collection
- Early Access: 3+ collections
- Secret: 5+ collections
- Inner Circle: 10+ collections

Tiers only advance through Stamps (verified live attendance), not Finds.

---

## 10. USER FLOWS SUMMARY

| # | Flow | Entry Point | Group | Status |
|---|------|-------------|-------|--------|
| 1 | Claim/Found an artist | + tab → Add an Artist | A | Needs rebuild (link paste replacing Deezer) |
| 2 | Discover from feed | Home → tap activity card | A+B | Needs Discover button fix |
| 3 | Check in (known lineup) | + tab → I'm at a Show | B | Partially built, needs wiring |
| 4 | Check in (tag DJ) | + tab → I'm at a Show → tag | B | Not built |
| 5 | View passport | Passport tab | A+B | Needs Finds/Stamps redesign |
| 6 | Friends activity feed | Home tab | A+B | Mostly works, needs stamp cards |
| 7 | Browse upcoming events | Home → map icon → Events | B | Works |
| 8 | Explore map | Home → map icon → Map | A+B | Works |
| 9 | Share passport to IG | Passport → Share Passport | A+B | Broken, needs share card redesign |
| 10 | See artist's fans | Artist profile → tap fan count | A | Not built |

---

## 11. SHARE CARD SYSTEM

### 11.1 Post-Found Share Card

Auto-generated after founding an artist. Designed card (NOT a screenshot) containing:
- Artist photo (large)
- "★ FOUNDED BY [username]" text
- Decibel branding / logo
- Dark branded background with gradient
- App Store link / QR code (small, bottom)

Prompt appears immediately after the Found celebration: "Share your claim?" with options:
- Share to Instagram Stories (pre-formatted for 9:16 ratio)
- Share to Messages
- Copy Link
- Save to Photos

### 11.2 Passport Share Card

Generated from the "Share Passport" button. Contains:
- Username + profile photo
- Stats: [X] finds, [X] stamps, [X] badges
- Grid of top artist photos (3–6)
- Decibel branding
- "Get your passport → [App Store link]"

### 11.3 Technical Implementation

Share cards are generated server-side via an API endpoint that renders an HTML template to a PNG image. The mobile app requests the image and uses React Native's Share API to present sharing options.

Endpoints:
- `GET /api/share-card/founder?username={}&artist_slug={}&artist_image={}`
- `GET /api/share-card/passport?username={}`

---

## 12. DESIGN TOKENS & AESTHETIC

### 12.1 Font
Poppins throughout — Regular, Medium, SemiBold, Bold weights.

### 12.2 Colors
See Section 2.3 for full token list.

### 12.3 Haptic Feedback
- Found an artist: Heavy impact
- Discovered an artist: Medium impact
- Checked in / Stamp: Medium impact + stamp thud
- Badge earned: Success notification pattern

### 12.4 Animations
- **Found celebration:** Lottie confetti, gold badge reveal, share card slide-up
- **Stamp animation:** Rubber stamp pressing down, ink spread, stamp lift reveal
- **Tier-up:** Lottie confetti burst with tier badge morph

### 12.5 Logo
Volume knob design. Dark and light variants exist as SVG and PNG (1024x1024). Files: decibel-logo-dark.svg, decibel-logo-light.svg, decibel-logo-dark-1024.png, decibel-logo-light-1024.png.

---

## 13. TECHNICAL STACK

- **Mobile:** React Native + Expo (~/decibel-mobile)
- **Backend API:** Next.js API routes on Vercel (~/decibel, deployed at decible.live)
- **Database:** Supabase
- **Scraping:** SoundCloud API, RA GraphQL, DICE API, EDMTrain, 19hz.info, Spotify page scraper
- **VM:** DigitalOcean (159.203.108.156) for scraper cron jobs
- **Build:** EAS Build + OTA updates
- **Location:** "While Using" permission only

### 13.1 Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/mobile/activity-feed | GET | Social feed (finds + stamps) |
| /api/mobile/search-users | GET | Search fans by name |
| /api/mobile/search-artists | GET | Search Decibel artists by name |
| /api/mobile/add-artist | POST | Add new artist from link paste |
| /api/mobile/discover | POST | Discover an existing artist |
| /api/mobile/check-in | POST | Check in at venue, create stamps |
| /api/mobile/tag-performer | POST | User-tag a performer at a venue |
| /api/mobile/live-lookup | POST | Real-time scrape for venue lineup |
| /api/mobile/follow | POST/DELETE | Follow/unfollow user |
| /api/mobile/followers | GET | Get user's followers |
| /api/mobile/following | GET | Get user's following |
| /api/mobile/my-rank | GET | Leaderboard rank |
| /api/share-card/founder | GET | Generate founder share card PNG |
| /api/share-card/passport | GET | Generate passport share card PNG |
| /api/mobile/artist-fans | GET | List of fans for an artist |
| /api/mobile/validate-artist-link | POST | Parse link, fetch info, check eligibility |

### 13.2 New DB Tables

**user_tagged_events**
- id (uuid, PK)
- venue_id (FK → venues)
- performer_id (FK → performers, nullable if new)
- tagged_by (FK → fans)
- event_date (date)
- created_at (timestamp)

**Add to performers table:**
- spotify_id (text, nullable)
- spotify_monthly_listeners (integer, nullable)
- spotify_listeners_updated_at (timestamp, nullable)
- soundcloud_followers (integer, nullable)
- apple_music_id (text, nullable)
- source_platform (text — 'spotify', 'apple_music', 'soundcloud')
- source_url (text — original link pasted by user)

---

## 14. APP STORE

- **Name:** Decibel — Live Music Passport
- **Subtitle:** Track Shows, Collect Artists
- **Bundle ID:** com.decibel.app
- **EAS Project ID:** 44471fff-8ba1-46a0-9901-bdaf6ebef534
- **Category:** Music (primary), Entertainment (secondary)
- **Keywords (100 chars):** dj,concerts,edm,electronic,nightlife,club,events,chicago,venue,badges,festival,techno,house,rave

---

## 15. BETA 2 — FUTURE FEATURES (NOT IN INITIAL LAUNCH)

### 15.1 Fantasy Music League
Monthly tournament. Users draft 5 of their Founded artists. Spotify monthly listener growth tracked daily over the month. Highest combined growth wins. Requires Spotify scraper cron infrastructure. Lives in a future "Leaderboard" tab or section.

### 15.2 Volume Rating System
1–10 slider styled as mixing console fader. Only fans who have Collected (verified live attendance) can rate. Purple→pink→gold gradient fill. Average shown on artist profile (min 3 ratings).

### 15.3 "Who's Out Tonight" Live Friend Map
See which friends are at venues right now on the map.

### 15.4 Weekly Recap Notification
Every Monday: "Last week: 3 new finds, 1 show attended. You're #4 in Chicago."

### 15.5 DJ Monetization (Phase 3)
Performers: Free tier (QR, fan collection, basic stats), Pro $29/mo (messaging, analytics, fan tiers), Agency $79/mo (multi-profile, team login). Shelved until 500+ active users.

### 15.6 Instagram Auto-Posting
@decibellive account. Auto-generate posts for newly founded artists, tag them. Daily content engine run by Claude Code on VM.

### 15.7 Website Conversion Funnel
Three page types: landing page (decible.live), artist pages (/artist/[slug] — 2,164 SEO pages), public passport pages (/[username]).

### 15.8 Residency Pattern Detection
Weekly cron analyzing user_tagged_events to identify recurring DJ residencies at venues.

---

## 16. EXECUTION PRIORITY

### Phase 1: Fix What's Broken
1. Discover/Found button works
2. SoundCloud link paste works
3. Passport card spacing and width consistency
4. Other users' profiles load correctly
5. Listen links show correct platform and actually open
6. Following screen: back button + correct stamp counts
7. Share modal functional

### Phase 2: Rebuild Search → Link Paste
1. Replace Deezer with link-paste-only Add flow
2. Implement URL parser (Spotify, Apple Music, SoundCloud)
3. Implement eligibility check (1M Spotify / 100K SoundCloud)
4. Apple Music API integration (developer token, catalog search)
5. Spotify oEmbed + scraper for monthly listeners
6. Move search bar to Home screen top bar
7. Build the + tab with "Add an Artist" / "I'm at a Show" toggle

### Phase 3: Check In Rebuild
1. Build Scenario A (known venue + lineup → auto-collect)
2. Build Scenario B (known venue, no lineup → user tags DJ)
3. Build Scenario C (unknown venue → user adds venue + tags DJ)
4. Stamp animation (rubber stamp + ink spread + haptic)
5. user_tagged_events table and API

### Phase 4: Passport Redesign
1. Finds section — 2x3 artist card grid (Sophie Bennett card reference)
2. Stamps section — analog passport aesthetic (paper grain, ink stamps, rotation)
3. Finds / Stamps toggle
4. Stamp animation on check-in
5. "View All" screens for both sections

### Phase 5: Share & Virality
1. Post-found celebration (confetti, badge reveal, share prompt)
2. Founder share card generation (server-side PNG)
3. Passport share card generation
4. One-tap sharing to Instagram Stories
5. Activity feed stamp cards (was at Smartbar)

### Phase 6: Polish & Ship
1. Artist profile: fans list screen
2. Tab bar blur treatment
3. Full QA in both dark and light mode
4. App Store screenshots (6 shots)
5. EAS build + App Store submission
