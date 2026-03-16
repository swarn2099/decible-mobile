# DECIBEL MOBILE v5 — BUGFIX MILESTONE 1

> **Purpose:** Fix critical bugs and UX issues from the initial v5 build. Every item here blocks the next round of testing.
>
> **Method:** Execute sequentially. Commit after each item. Deploy when complete.

---

## 1. FINDS CARD REDESIGN — Match Reference Design

The current Finds cards on the Passport tab are plain — dark card with small text below the image. They need to match the reference design (Sophie Bennett card style).

**Target design (reference image provided):**
- Full-bleed artist photo taking up the entire card
- Text overlaid on the BOTTOM of the image, not below it
- Frosted glass / blur overlay at the bottom of the image (semi-transparent dark gradient or BlurView) so text is readable over any photo
- Artist name: white, Poppins SemiBold, 15px
- Fan count below name: white, Poppins Regular, 12px, slightly transparent
- Genre pills: small horizontal chips overlaid on the image (above the name area), semi-transparent background
- Founded badge: gold ★ icon next to artist name for Founded artists
- Discovered badge: purple compass icon next to name for Discovered artists
- "Listen" button: small pink pill at bottom-left of the card, overlaid on the blur area
- Card border: 2px — gold (#FFD700) for Founded, purple (#9B6DFF) for Discovered
- Card border radius: 16px
- Card aspect ratio: roughly 3:4 (taller than wide)
- 2-column grid layout, 8px gap between cards
- Show 6 cards max on passport preview, "View All [X] Finds →" link below

**Dark mode:** Cards have subtle shadow, borders glow slightly
**Light mode:** Cards have drop shadow instead of glow, same layout

### Acceptance Criteria
- [ ] Artist photo fills entire card
- [ ] Name + fan count overlaid on bottom with blur/gradient background
- [ ] Genre pills visible on card
- [ ] Founded/Discovered badge indicator on each card
- [ ] Gold border for Founded, purple border for Discovered
- [ ] Listen button on each card
- [ ] 2x3 grid with 8px gaps
- [ ] Works in both themes

---

## 2. PROFILE HEADER — Instagram-Style Layout

The profile header (avatar, username, stats) needs better spacing and organization to match Instagram's profile layout.

**Target layout:**
- **Row 1:** Avatar (left, 80px circle) | Stats columns (right, evenly spaced)
  - Stats: Following | Followers | Finds | Stamps
  - Each stat: large bold number on top, label below in secondary text
  - NO badges count in the stats row — remove it
- **Row 2:** Username (bold, 18px) directly below the avatar row, left-aligned
- **Row 3:** "Member since March 2026" in secondary text, left-aligned below username
- Settings gear icon: top-right corner of the header area
- Share Passport button: full-width gradient button below the header

**Stats corrections:**
- Currently showing "15 Stamps" but it should be "5 Stamps" (live attendance only) and "10 Finds" (online discoveries)
- Stamps = Collected entries only (verified, at a venue)
- Finds = Founded + Discovered entries
- Remove the Badges stat from this row entirely

### Acceptance Criteria
- [ ] Instagram-style layout: avatar left, stats right
- [ ] Stats show: Following, Followers, Finds, Stamps (NOT Badges)
- [ ] Finds count = Founded + Discovered count
- [ ] Stamps count = Collected (verified) count only
- [ ] Username and member date below the avatar/stats row
- [ ] Settings gear top-right
- [ ] Works in both themes

---

## 3. SPOTIFY LINK PASTE — Returns 404 Despite Valid URL

Pasting a valid Spotify artist URL like `https://open.spotify.com/artist/2CimT0aCxKVuJsKPVLG0j5?si=2Y48tWQEQ8SKP4z9-PxMVQ` returns `404 {"error": "Artist not found on Spotify"}`. Apple Music and SoundCloud links work fine.

**Root cause investigation — check ALL of these:**

A. **URL Parser (`src/lib/urlParser.ts`):**
   - The `?si=...` tracking param must be stripped before extracting the artist ID
   - The ID in this URL is `2CimT0aCxKVuJsKPVLG0j5` — verify the regex extracts this correctly
   - Test these formats all work:
     - `https://open.spotify.com/artist/2CimT0aCxKVuJsKPVLG0j5?si=2Y48tWQEQ8SKP4z9-PxMVQ`
     - `https://open.spotify.com/artist/2CimT0aCxKVuJsKPVLG0j5`
     - `spotify:artist:2CimT0aCxKVuJsKPVLG0j5`
     - `https://spotify.link/{short}` (short links — need HTTP redirect resolution to get the real URL)

B. **API Endpoint (check `~/decibel/pages/api/` for the validate-artist-link handler):**
   - The endpoint receives the parsed artist ID but returns 404
   - It should call Spotify oEmbed: `GET https://open.spotify.com/oembed?url=https://open.spotify.com/artist/{id}`
   - oEmbed requires NO API key — it's a public endpoint that returns JSON with `title` (artist name) and `thumbnail_url` (artist photo)
   - Test the oEmbed call directly: `curl "https://open.spotify.com/oembed?url=https://open.spotify.com/artist/2CimT0aCxKVuJsKPVLG0j5"` — this should return JSON with the artist name
   - If the endpoint is using the Spotify Web API instead of oEmbed, it will fail because of the dev mode restriction (5 users max). Switch to oEmbed.

C. **Monthly listener count for Spotify artists:**
   - oEmbed does NOT return monthly listeners
   - For now, use the `spotifyscraper` Python library on the VM to scrape the monthly listener count from the public artist page, OR skip the listener check for Spotify and log a TODO
   - Do NOT block adding the artist if the scraper fails — fallback to eligible

### Acceptance Criteria
- [ ] `https://open.spotify.com/artist/2CimT0aCxKVuJsKPVLG0j5?si=2Y48tWQEQ8SKP4z9-PxMVQ` successfully resolves to an artist card
- [ ] Artist name and photo are fetched via oEmbed (NOT Spotify Web API)
- [ ] Tracking params (?si=...) are stripped cleanly
- [ ] Spotify short links (spotify.link) are resolved via HTTP redirect
- [ ] If monthly listener scrape fails, artist is still added (default eligible)
- [ ] Error messages are clear if the link is genuinely invalid

---

## 4. APPLE MUSIC — No Listener Count Validation

Artists added via Apple Music bypass the 1M listener threshold because Apple Music doesn't expose listener data. John Summit and Drake were successfully added despite being well above 1M.

**Fix:**
- After fetching artist info from Apple Music, cross-reference on Spotify by searching the artist name via oEmbed or scraper
- If found on Spotify → check monthly listeners against 1M threshold
- If NOT found on Spotify → default to eligible (they're probably small enough)
- If over 1M → reject with message: "This artist has over 1M monthly listeners and can't be added to Decibel. Decibel is for discovering underground and emerging artists."
- For SoundCloud: enforce the 100K follower threshold (check if this is already working)

### Acceptance Criteria
- [ ] Apple Music artists are cross-referenced on Spotify for listener count
- [ ] Artists over 1M monthly listeners are rejected regardless of source platform
- [ ] SoundCloud artists over 100K followers are rejected
- [ ] Clear error message shown to user when an artist is rejected

---

## 5. TAB BAR — Switch to Standard Bottom Tab Bar (Instagram Style)

The floating pill tab bar looks janky. Replace it with a standard bottom tab bar like Instagram.

**Design:**
- Full-width bar anchored to the bottom (NOT floating)
- Background: solid with subtle top border
  - Dark: #15151C background, rgba(255,255,255,0.06) top border
  - Light: #FFFFFF background, rgba(0,0,0,0.06) top border
- Height: standard tab bar height (~50px + safe area)
- Three tabs: Home | + | Passport
- + button: slightly larger (28px icon vs 22px for others), pink (#FF4D6A) icon — NOT a raised circle, just a pink + icon that's a bit bigger
- Active state: pink icon + label
- Inactive state: dark: rgba(255,255,255,0.4), light: rgba(0,0,0,0.35)
- Labels: 10px Poppins Medium below each icon
- NO blur, NO floating, NO pill shape — simple and clean like Instagram

### Acceptance Criteria
- [ ] Tab bar is full-width, anchored to bottom
- [ ] Clean top border, solid background
- [ ] + button is pink and slightly larger but not raised/floating
- [ ] Works in both themes
- [ ] All screens have proper bottom padding for tab bar height
- [ ] No content hidden behind tab bar

---

## 6. OTHER USER PROFILE — Match Passport Design

When viewing another user's profile, it currently shows a basic scrollview of their collection. It should look exactly like the Passport tab design.

**Fix:**
- Reuse the same Passport screen layout/components when viewing another user
- Show their profile header (avatar, username, stats — Following, Followers, Finds, Stamps)
- Show their Finds section (2-column grid of artist cards)
- Show their Stamps section (when implemented)
- Show "Follow" / "Following" button instead of "Share Passport"
- Make sure the data query uses THEIR fan_id, not the current user's

### Acceptance Criteria
- [ ] Other user's profile matches the Passport tab layout
- [ ] Their Finds grid shows their actual artists
- [ ] Their stats are accurate
- [ ] Follow/Following button works
- [ ] Tapping an artist in their collection goes to the artist profile

---

## 7. ICON POSITIONS — Swap Search and Map on Home Header

Currently: Search (left) | DECIBEL | Map (right)
The map icon doesn't work, and search should be more accessible.

**Fix:**
- Swap positions: Map (left) | DECIBEL | Search (right)
- Wire up the map icon to navigate to the map/events screen
- Ensure search icon still navigates to the search screen

### Acceptance Criteria
- [ ] Map icon on the left, search icon on the right
- [ ] Both icons navigate to their respective screens
- [ ] Map screen loads with venue dots and events

---

## Execution Notes

- **Item 1 (Find cards) is the biggest visual change** — take time to get it right
- **Item 5 (tab bar) affects all screens** — update bottom padding everywhere after changing
- **Commit after each item:** `fix(mobile): v5-bugfix-1 — [description]`
- **Test both dark and light mode after every change**
- **Push to origin after all fixes**
- **After all fixes:** `eas update --channel preview --message "v5 bugfix milestone 1"`
