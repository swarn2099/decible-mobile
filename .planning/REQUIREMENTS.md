# Requirements: Decibel Mobile

**Defined:** 2026-03-13
**Core Value:** Discover underground artists before anyone else (Finds) and prove you were at the show (Stamps) — a live music passport.

## v3.5 Requirements

Requirements for milestone v3.5 — Polish & Identity.

### Login

- [x] **LOGIN-01**: Login screen respects device light/dark mode (#0B0B0F dark, #FFFFFF light)
- [x] **LOGIN-02**: Animated gradient orbs float behind content (pink/purple/blue, lower opacity in light mode)
- [x] **LOGIN-03**: Tracked-out "D E C I B E L" wordmark + "Your Live Music Passport" tagline in upper third
- [x] **LOGIN-04**: Themed email input with mail icon, focus state with pink border glow
- [x] **LOGIN-05**: Brand gradient (pink→purple) "Send Magic Link" button with press animation + haptic
- [x] **LOGIN-06**: Loading state (spinner in button) and success state (checkmark + "Check your email")
- [x] **LOGIN-07**: Content stagger-fades in on mount (wordmark → input → button)
- [x] **LOGIN-08**: Keyboard avoidance works smoothly on iOS and Android

### Passport Layout

- [x] **PLAYOUT-01**: Compact header (~180px): avatar (60x60, no ring) + inline stats (Followers/Following/Stamps/Finds)
- [x] **PLAYOUT-02**: Followers and Following counts are tappable (open list screens)
- [x] **PLAYOUT-03**: Username + "Member since" below avatar row, no settings gear icon
- [x] **PLAYOUT-04**: Share Passport (gradient) + Edit Profile (surface fill) action buttons
- [x] **PLAYOUT-05**: Sticky tab bar pins to top when scrolled past header
- [x] **PLAYOUT-06**: Swipe left/right switches between tabs (gesture navigation)
- [x] **PLAYOUT-07**: Active tab has pink underline indicator, inactive tabs muted
- [x] **PLAYOUT-08**: Passport respects device light/dark mode (themed backgrounds, surfaces, text)

### Grid & Cards

- [x] **GRID-01**: 3-column grid with square cells (1:1 aspect ratio), ~1px uniform gaps
- [x] **GRID-02**: Artist image fills each cell completely (cover/crop)
- [x] **GRID-03**: Bottom gradient overlay with artist name + context text + date per cell
- [x] **GRID-04**: Stamp cells show artist + venue + date; Find cells show artist + platform icon + date; Discovery cells show artist + "via @user" + date
- [x] **GRID-05**: Founder badge (gold star) in top-right corner of cell when applicable
- [x] **GRID-06**: Haptic feedback + press-down scale animation on cell tap
- [x] **GRID-07**: Empty states per tab with icon, message, and CTA
- [x] **GRID-08**: Grid scrolls all entries newest-to-oldest, paginated at 50+ with infinite scroll

### Badges

- [x] **BADGE-01**: Badges accessible via 4th tab in sticky tab bar (Stamps | Finds | Discoveries | Badges)
- [x] **BADGE-02**: All badge elements removed from passport header and main scroll
- [x] **BADGE-03**: Earned badges display full color with glow/shadow
- [x] **BADGE-04**: Locked badges display grayscale at 0.3 opacity (not beige circles)
- [x] **BADGE-05**: Tap earned badge shows detail card (how earned, date); tap locked shows requirements

## v3.0 Requirements (Completed)

### Bug Fixes (Phase 6)

- [x] **BUG-01**: Discover button functions correctly
- [x] **BUG-02**: Listen links open correct platform URL
- [x] **BUG-03**: Share modal opens and functions correctly
- [x] **BUG-04**: Leaderboard API returns data

### Glassy Passport (Phase 7)

- [x] **GPASS-01** through **GPASS-14**: All complete

### Jukebox (Phase 8)

- [x] **JBX-01** through **JBX-14**: All complete

### "I'm at a Show" (Phase 9)

- [x] **SHOW-01** through **SHOW-25**: All complete (except SHOW-12 Layer 4 social scraping — deferred)

## Future Requirements

### Social
- **SOC-01**: "Who's Out Tonight" live friend map
- **SOC-02**: Weekly recap notification

### Content
- **CON-01**: Volume rating system (1-10 fader)
- **CON-02**: Residency pattern detection from crowdsource data
- **CON-03**: Native audio player replacing WebViews

### DJ Platform
- **DJ-01**: Performer profiles with QR, fan collection, stats (Free)
- **DJ-02**: Pro tier ($29/mo)
- **DJ-03**: Agency tier ($79/mo)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Social login (Google/Apple) | Auth system is magic-link only currently |
| Gradient orbs on passport screen | PRD explicitly excludes — passport is clean themed bg |
| Settings gear icon on passport | Replaced by Edit Profile button |
| Badge teaser row in passport header | Badges live in 4th tab only |
| Edit Profile screen implementation | Just the button — full edit flow is a future milestone |
| Text search for external artist catalogs | Replaced by link paste |
| Deezer API | Eliminated entirely |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LOGIN-01 | Phase 10 | Complete |
| LOGIN-02 | Phase 10 | Complete |
| LOGIN-03 | Phase 10 | Complete |
| LOGIN-04 | Phase 10 | Complete |
| LOGIN-05 | Phase 10 | Complete |
| LOGIN-06 | Phase 10 | Complete |
| LOGIN-07 | Phase 10 | Complete |
| LOGIN-08 | Phase 10 | Complete |
| PLAYOUT-01 | Phase 11 | Complete |
| PLAYOUT-02 | Phase 11 | Complete |
| PLAYOUT-03 | Phase 11 | Complete |
| PLAYOUT-04 | Phase 11 | Complete |
| PLAYOUT-05 | Phase 11 | Complete |
| PLAYOUT-06 | Phase 11 | Complete |
| PLAYOUT-07 | Phase 11 | Complete |
| PLAYOUT-08 | Phase 11 | Complete |
| GRID-01 | Phase 12 | Complete |
| GRID-02 | Phase 12 | Complete |
| GRID-03 | Phase 12 | Complete |
| GRID-04 | Phase 12 | Complete |
| GRID-05 | Phase 12 | Complete |
| GRID-06 | Phase 12 | Complete |
| GRID-07 | Phase 12 | Complete |
| GRID-08 | Phase 12 | Complete |
| BADGE-01 | Phase 13 | Complete |
| BADGE-02 | Phase 13 | Complete |
| BADGE-03 | Phase 13 | Complete |
| BADGE-04 | Phase 13 | Complete |
| BADGE-05 | Phase 13 | Complete |

**Coverage:**
- v3.5 requirements: 29 total (LOGIN: 8, PLAYOUT: 8, GRID: 8, BADGE: 5)
- Mapped to phases: 29
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after roadmap creation*
