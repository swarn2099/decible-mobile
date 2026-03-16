# Requirements: Decibel v6.0

**Defined:** 2026-03-16
**Core Value:** Fans compete to discover underground artists (Founder badge = social currency). Artists get fan intelligence and direct reach worth $29/month.

## v6.0 Requirements

### Bug Fixes

- [x] **BUG-01**: Apple Music URLs parse correctly for artists, songs, and albums across regional variants
- [x] **BUG-02**: Stat counts match between search results and profile pages
- [x] **BUG-03**: Share modal works correctly for passport and individual artist cards
- [x] **BUG-04**: Listen links open correct platform (Spotify/Apple Music/SoundCloud)

### UI Cleanup

- [x] **CLEAN-01**: "I'm at a Show" flow removed from + tab UI
- [x] **CLEAN-02**: Stamps tab removed from passport
- [x] **CLEAN-03**: Passport tabs are: Finds | Founders | Discoveries | Badges
- [x] **CLEAN-04**: Founders tab shows only artists where user holds Founder Badge
- [x] **CLEAN-05**: Header stats show: Followers | Following | Finds | Founders
- [x] **CLEAN-06**: Map button removed from Home screen
- [x] **CLEAN-07**: All stamp data preserved in database (hidden from UI only)

### Song Link Support

- [x] **SONG-01**: Song/album URLs accepted from Spotify, Apple Music, and SoundCloud
- [x] **SONG-02**: Artist extracted correctly from song/album metadata
- [x] **SONG-03**: "Found via [Track Name]" displays on confirmation card for song links

### Passport Redesign

- [x] **PASS-01**: Login screen redesigned with animated orbs, branded input/button, animations
- [x] **PASS-02**: Passport matches Instagram profile layout pattern (compact header, inline stats)
- [x] **PASS-03**: 3-column grid with correct overlays per tab type (Finds/Founders/Discoveries)
- [x] **PASS-04**: Sticky tab bar with 4 tabs and swipe gestures
- [x] **PASS-05**: Light/dark mode correct on both login and passport
- [x] **PASS-06**: No settings gear, no badge teaser, no colored avatar ring

### Home & Feed

- [x] **HOME-01**: Stats bar shows Finds, Founders, Influence Score
- [x] **HOME-02**: Activity feed loads Find, Founder, and Collect cards from followed users
- [x] **HOME-03**: Fallback "Trending on Decibel" when feed is empty
- [x] **HOME-04**: Trending Artists horizontal row displays and is tappable
- [x] **HOME-05**: Jukebox button replaces map button, loads embedded players for recent finds
- [x] **HOME-06**: Max 3 WebViews active at once in Jukebox
- [x] **HOME-07**: One-tap Collect from feed cards and Jukebox cards creates Discovery
- [x] **HOME-08**: Notification sent to finder when someone collects from their find

### Leaderboard

- [x] **LEAD-01**: Three ranking views: Most Founders, Highest Influence, Trending
- [x] **LEAD-02**: Time filters (All Time, This Month, This Week)
- [x] **LEAD-03**: User position shown at bottom if not in visible rankings
- [x] **LEAD-04**: Top 3 have distinct visual styling
- [x] **LEAD-05**: Tapping a leaderboard row navigates to that user's passport

### Share Cards

- [x] **SHARE-01**: Founder Share Card generates on founding with correct data (1080x1920)
- [x] **SHARE-02**: Passport Summary Card generates on demand (1080x1920)
- [x] **SHARE-03**: Share sheet opens with card image, Instagram Stories as target

### Artist Profile & Link-in-Bio

- [x] **ARTIST-01**: In-app artist profile with founder attribution, collector count, embedded player
- [x] **ARTIST-02**: Collector list with founder highlighted
- [x] **ARTIST-03**: Link-in-bio web page renders at decibel.live/[artistslug] with SSR
- [x] **ARTIST-04**: OG meta tags generate correct social previews
- [x] **ARTIST-05**: "Collect on Decibel" button deep-links to app or App Store
- [x] **ARTIST-06**: User passport web page renders at decibel.live/@username

### Artist Dashboard & Monetization

- [x] **DASH-01**: Artist claiming flow works end-to-end (signup → search → verify → dashboard)
- [x] **DASH-02**: Dashboard Overview with collector count, growth chart, recent activity
- [x] **DASH-03**: Fan Intelligence with full collector list, city breakdown, "fans also collect"
- [x] **DASH-04**: Push notification compose and send with 1/week rate limit
- [x] **DASH-05**: Notifications arrive on fan devices via Expo Push
- [x] **DASH-06**: Artist messages appear in fan Home feed
- [x] **DASH-07**: Smart Flyer: create show listings, push to collectors within radius
- [x] **DASH-08**: Link-in-bio settings (add/remove/reorder platform links)
- [x] **DASH-09**: Stripe Checkout for $29/month subscription
- [x] **DASH-10**: 14-day free trial, no credit card required
- [x] **DASH-11**: Locked features gated after trial expires
- [x] **DASH-12**: Verified badge on artist profiles after claiming

### Outreach & Growth

- [x] **OUT-01**: Daily cron identifies artists with 10+ collectors not yet contacted
- [x] **OUT-02**: Outreach messages generated with correct personalization
- [x] **OUT-03**: Email sending works via VM
- [x] **OUT-04**: Instagram DM queue created for manual sending
- [x] **OUT-05**: Milestone notifications at 25, 50, 100 collector thresholds
- [x] **OUT-06**: Artist milestone share cards generated as images
- [x] **OUT-07**: No duplicate outreach (one contact per threshold)

## Future Requirements

None — v6.0 is comprehensive.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Fantasy Music League | Requires daily Spotify scraper cron, defer to future |
| Volume Rating System | Mixing console fader UI, future |
| "Who's Out Tonight" live map | Future |
| Weekly recap notifications | Future |
| Fan premium subscription ($2.99/month) | Nice-to-have, not the business |
| Instagram auto-posting | Future |
| Text search for external artists | Replaced by link paste |
| Deezer API | Eliminated entirely |
| Automated artist verification | Manual for MVP, automate month 2-3 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 14 | Complete |
| BUG-02 | Phase 14 | Complete |
| BUG-03 | Phase 14 | Complete |
| BUG-04 | Phase 14 | Complete |
| CLEAN-01 | Phase 14 | Complete |
| CLEAN-02 | Phase 14 | Complete |
| CLEAN-03 | Phase 14 | Complete |
| CLEAN-04 | Phase 14 | Complete |
| CLEAN-05 | Phase 14 | Complete |
| CLEAN-06 | Phase 14 | Complete |
| CLEAN-07 | Phase 14 | Complete |
| SONG-01 | Phase 14 | Complete |
| SONG-02 | Phase 14 | Complete |
| SONG-03 | Phase 14 | Complete |
| PASS-01 | Phase 15 | Complete |
| PASS-02 | Phase 15 | Complete |
| PASS-03 | Phase 15 | Complete |
| PASS-04 | Phase 15 | Complete |
| PASS-05 | Phase 15 | Complete |
| PASS-06 | Phase 15 | Complete |
| HOME-01 | Phase 16 | Complete |
| HOME-02 | Phase 16 | Complete |
| HOME-03 | Phase 16 | Complete |
| HOME-04 | Phase 16 | Complete |
| HOME-05 | Phase 16 | Complete |
| HOME-06 | Phase 16 | Complete |
| HOME-07 | Phase 16 | Complete |
| HOME-08 | Phase 16 | Complete |
| LEAD-01 | Phase 17 | Complete |
| LEAD-02 | Phase 17 | Complete |
| LEAD-03 | Phase 17 | Complete |
| LEAD-04 | Phase 17 | Complete |
| LEAD-05 | Phase 17 | Complete |
| SHARE-01 | Phase 17 | Complete |
| SHARE-02 | Phase 17 | Complete |
| SHARE-03 | Phase 17 | Complete |
| ARTIST-01 | Phase 18 | Complete |
| ARTIST-02 | Phase 18 | Complete |
| ARTIST-03 | Phase 18 | Complete |
| ARTIST-04 | Phase 18 | Complete |
| ARTIST-05 | Phase 18 | Complete |
| ARTIST-06 | Phase 18 | Complete |
| DASH-01 | Phase 19 | Complete |
| DASH-02 | Phase 19 | Complete |
| DASH-03 | Phase 19 | Complete |
| DASH-04 | Phase 19 | Complete |
| DASH-05 | Phase 19 | Complete |
| DASH-06 | Phase 19 | Complete |
| DASH-07 | Phase 19 | Complete |
| DASH-08 | Phase 19 | Complete |
| DASH-09 | Phase 19 | Complete |
| DASH-10 | Phase 19 | Complete |
| DASH-11 | Phase 19 | Complete |
| DASH-12 | Phase 19 | Complete |
| OUT-01 | Phase 20 | Complete |
| OUT-02 | Phase 20 | Complete |
| OUT-03 | Phase 20 | Complete |
| OUT-04 | Phase 20 | Complete |
| OUT-05 | Phase 20 | Complete |
| OUT-06 | Phase 20 | Complete |
| OUT-07 | Phase 20 | Complete |

**Coverage:**
- v6.0 requirements: 51 total
- Mapped to phases: 51
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after initial definition*
