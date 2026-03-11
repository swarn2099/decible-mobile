# Requirements: Decibel Mobile

**Defined:** 2026-03-10
**Core Value:** Discover underground artists before anyone else (Finds) and prove you were at the show (Stamps) — a live music passport.

## v1 Requirements

### Link-Paste Add Flow

- [x] **ADD-01**: User can paste a Spotify artist URL and see the artist's name, image, and monthly listener count
- [x] **ADD-02**: User can paste an Apple Music artist URL and see the artist's name and image
- [x] **ADD-03**: User can paste a SoundCloud artist URL and see the artist's name, image, and follower count
- [x] **ADD-04**: App rejects URLs from unsupported platforms with message: "Paste a Spotify, Apple Music, or SoundCloud artist link"
- [x] **ADD-05**: App handles URL variants (with/without https, www, m. subdomain, short links like spotify.link)
- [x] **ADD-06**: App rejects artists over 1M Spotify monthly listeners with eligibility message and artist card
- [x] **ADD-07**: App rejects SoundCloud artists over 100K followers with eligibility message
- [x] **ADD-08**: Apple Music artists are cross-referenced on Spotify; if not found, default to eligible
- [x] **ADD-09**: If artist already on Decibel, user sees "Discover" button (or existing status if already found/discovered)
- [x] **ADD-10**: If artist NOT on Decibel, user sees "Add + Found" button and becomes the one-of-one Founder
- [x] **ADD-11**: Loading state shown during link validation and artist fetch
- [x] **ADD-12**: Spotify scraper returns null (not 0) on failure; null treated as "unverified" not "eligible"

### Add Tab UI

- [x] **TAB-01**: + tab shows two modes: "Add an Artist" and "I'm at a Show"
- [x] **TAB-02**: "Add an Artist" mode shows a paste field with placeholder text for supported platforms
- [x] **TAB-03**: "I'm at a Show" mode initiates the check-in flow

### Check-In Flow

- [x] **CHK-01**: Scenario A: GPS matches known venue with scraped lineup → user taps "Check In" → all lineup artists auto-collected as Stamps
- [x] **CHK-02**: Scenario B: GPS matches known venue, no lineup → user asked "Is there live music?" → Yes → link-paste to tag performer → Stamp created
- [ ] **CHK-03**: Scenario C: GPS matches no venue → user asked "Is there live music?" → Yes → enter venue name + tag performer → venue added to DB → Stamp created
- [x] **CHK-04**: "No live music" option results in zero stamps (no stamp without live performer)
- [x] **CHK-05**: GPS permission rationale screen shown before requesting location
- [x] **CHK-06**: Venue match confirmation: "You're at [Venue Name]" with address and distance
- [x] **CHK-07**: Check-in uses client local date (not UTC) to match events correctly for late-night shows
- [x] **CHK-08**: GPS accuracy read from coords; graceful handling when accuracy exceeds 200m
- [x] **CHK-09**: user_tagged_events table stores tagged performers; visible to other users checking in same venue/night
- [x] **CHK-10**: Stamp appears in passport immediately after check-in (optimistic UI update)

### Stamp Animation

- [x] **ANIM-01**: Rubber stamp visual slams down on check-in with Lottie animation
- [x] **ANIM-02**: Haptic feedback (medium impact) on stamp contact
- [x] **ANIM-03**: Ink spread effect on impact, stamp lifts to reveal venue + date + artist

### Passport Redesign

- [x] **PASS-01**: Finds section displays 2x3 artist card grid with hero photo, name, badge, fan count, "Listen" button
- [x] **PASS-02**: Founded cards have gold border glow; Discovered cards have purple border
- [x] **PASS-03**: "View All [X] Finds" link below grid opens scrollable full collection
- [x] **PASS-04**: Stamps section has paper grain texture background with analog passport aesthetic
- [x] **PASS-05**: Each stamp rotated slightly (-3° to +3°, deterministic by stamp ID)
- [x] **PASS-06**: Stamp shows venue name (prominent), date (monospace), artist name(s)
- [x] **PASS-07**: Dark mode: dark leather texture, stamps with slight glow. Light mode: cream/lighter, no glow
- [x] **PASS-08**: "View All Stamps" opens chronological list (most recent first)

### Share & Virality

- [ ] **SHR-01**: Post-found celebration: confetti animation, gold badge reveal (Founded) or purple compass (Discovered), haptic
- [ ] **SHR-02**: Share prompt after founding: "Share your claim?" with Instagram Stories, Messages, Copy Link, Save to Photos
- [x] **SHR-03**: Founder share card generated server-side as PNG (artist photo, "FOUNDED BY [username]", Decibel branding)
- [x] **SHR-04**: Passport share card generated server-side as PNG (stats, top artist photos, branding)
- [ ] **SHR-05**: Native OS share sheet used for all sharing
- [ ] **SHR-06**: "Save to Photos" works with proper media library permission handling

### Home & Navigation

- [x] **NAV-01**: Search bar relocated to Home screen top bar (search icon → full search screen)
- [x] **NAV-02**: Home search queries existing Decibel artists and users only
- [x] **NAV-03**: Activity feed shows both Find cards and Stamp cards with appropriate accents

### Artist Profile

- [x] **ART-01**: Artist fans list screen: Founder at top (gold), then Collected (pink), then Discovered (purple)
- [x] **ART-02**: Fan count tappable → navigates to fans list

### Polish

- [x] **POL-01**: Full QA pass in both dark and light mode
- [x] **POL-02**: All scrollable screens have bottom padding for floating tab bar

## v2 Requirements

### Fantasy League
- **FAN-01**: Monthly tournament — draft 5 Founded artists, track Spotify growth
- **FAN-02**: Daily Spotify scraper cron for all drafted artists

### Social
- **SOC-01**: "Who's Out Tonight" live friend map
- **SOC-02**: Weekly recap notification ("Last week: 3 finds, 1 show")

### DJ Platform
- **DJ-01**: Performer profiles with QR, fan collection, basic stats (Free)
- **DJ-02**: Pro tier ($29/mo) with messaging, analytics, fan tiers
- **DJ-03**: Agency tier ($79/mo) with multi-profile, team login

### Content
- **CON-01**: Volume rating system (1-10 fader, verified fans only)
- **CON-02**: Residency pattern detection from user_tagged_events

## Out of Scope

| Feature | Reason |
|---------|--------|
| Text search for external artist catalogs | Replaced by link paste; would undermine eligibility system |
| Deezer API | Eliminated entirely per PRD v5 |
| 4th tab | Reduced to 3 tabs in v5 redesign |
| Real-time chat | High complexity, not core to passport value |
| OAuth login (Google/Apple) | Email/password + magic link sufficient for v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ADD-01 through ADD-12 | Phase 2 — Add Flow | Pending |
| TAB-01 through TAB-03 | Phase 2 — Add Flow | Pending |
| NAV-01 through NAV-03 | Phase 2 — Add Flow | Pending |
| CHK-01 through CHK-10 | Phase 3 — Check-In | Pending |
| ANIM-01 through ANIM-03 | Phase 3 — Check-In | Pending |
| PASS-01 through PASS-08 | Phase 4 — Passport Redesign | Pending |
| SHR-01 through SHR-06 | Phase 5 — Share + Polish | Pending |
| ART-01, ART-02 | Phase 5 — Share + Polish | Pending |
| POL-01, POL-02 | Phase 5 — Share + Polish | Pending |

**Coverage:**
- v1 requirements: 49 total
- Mapped to phases: 49
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 — traceability confirmed against ROADMAP.md phases 2-5*
