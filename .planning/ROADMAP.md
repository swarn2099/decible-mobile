# Roadmap: Decibel Mobile

## Milestones

- ✅ **v1.0 Foundation** - Phases 1-5 (shipped 2026-03-11)
- ✅ **v3.0 The Living Passport** - Phases 6-9 (shipped 2026-03-13)
- 🚧 **v3.5 Polish & Identity** - Phases 10-13 (in progress)

## Phases

<details>
<summary>✅ v1.0 Foundation (Phases 1-5) - SHIPPED 2026-03-11</summary>

### Phase 1: Scaffold
**Goal**: Working app skeleton with all navigation, feeds, and profiles deployed
**Depends on**: Nothing
**Requirements**: (completed — see PROJECT.md Validated section)
**Success Criteria** (what must be TRUE):
  1. User can navigate between Home, +, and Passport tabs
  2. Activity feed shows find and stamp cards
  3. Artist and user profiles open and display correctly
  4. App works in both dark and light mode
**Plans**: Complete

Plans:
- [x] 01-01: Navigation scaffold, tab bar, theme system

### Phase 2: Add Flow
**Goal**: Users can discover and claim underground artists by pasting a streaming link
**Depends on**: Phase 1
**Requirements**: ADD-01, ADD-02, ADD-03, ADD-04, ADD-05, ADD-06, ADD-07, ADD-08, ADD-09, ADD-10, ADD-11, ADD-12, TAB-01, TAB-02, NAV-01, NAV-02, NAV-03
**Success Criteria** (what must be TRUE):
  1. User can paste a Spotify, Apple Music, or SoundCloud artist URL and see the artist's name, image, and listener/follower count before confirming
  2. App rejects artists over the eligibility threshold (1M Spotify listeners / 100K SoundCloud followers) with a clear rejection message
  3. App detects when an artist is already on Decibel and shows the appropriate action (Discover vs existing status)
  4. User who is first to add an artist sees "Add + Found" and becomes the one-of-one Founder with gold badge
  5. Home screen search bar lives in the top bar and searches only existing Decibel artists and users
**Plans**: 3 plans

Plans:
- [x] 02-01: Backend — validate-artist-link endpoint (Spotify + SoundCloud + Apple Music eligibility gate)
- [x] 02-02: Client — urlParser.ts port + tests, + tab mode toggle, paste screen, artist preview card
- [x] 02-03: Client — multi-platform add support, found/discover confirmation, navigation wiring, NAV search bar

### Phase 3: Check-In
**Goal**: Users can check in at a live show and create Stamps proving they were there
**Depends on**: Phase 2
**Requirements**: TAB-03, CHK-01, CHK-02, CHK-03, CHK-04, CHK-05, CHK-06, CHK-07, CHK-08, CHK-09, CHK-10, ANIM-01, ANIM-02, ANIM-03
**Success Criteria** (what must be TRUE):
  1. User at a known venue with a lineup sees that venue confirmed, taps Check In, and all lineup artists appear as Stamps in their Passport immediately
  2. User at a known venue with no lineup can tag a performer via link paste and receive a Stamp for that performer
  3. GPS permission rationale screen appears before location is requested
  4. Rubber stamp animation slams down with haptic feedback on check-in completion
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Backend: check-in route, tag-performer route, user_tagged_events table, UTC date fix
- [x] 03-02-PLAN.md — Client: fix useVenueDetection column bug, GPS accuracy guard, CheckInWizard, VenueScanStep, LineupStep
- [x] 03-03-PLAN.md — Client: TagPerformerStep (Scenario B), StampAnimationModal (Lottie + haptics), wire complete flow

### Phase 4: Passport Redesign
**Goal**: The Passport tab becomes a visual identity artifact with distinct Finds and Stamps aesthetics
**Depends on**: Phase 3
**Requirements**: PASS-01, PASS-02, PASS-03, PASS-04, PASS-05, PASS-06, PASS-07, PASS-08
**Success Criteria** (what must be TRUE):
  1. Finds section shows a 2x3 artist card grid with hero photo, badge (gold/purple border glow), fan count, and a working Listen button
  2. Founded cards have a gold border glow, Discovered cards have a purple border — visually distinct at a glance
  3. Stamps section has a paper grain texture background with each stamp slightly rotated, showing venue name, date, and artist name
  4. "View All Finds" and "View All Stamps" links open scrollable full collection screens
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — Finds grid: API update, FindCard + FindsGrid components, View All Finds screen
- [x] 04-02-PLAN.md — Stamps section: texture assets, PassportStamp SVG, StampsSection, View All Stamps screen

### Phase 5: Share + Polish
**Goal**: Users can share their finds and the app passes full QA for public launch
**Depends on**: Phase 4
**Requirements**: SHR-01, SHR-02, SHR-03, SHR-04, SHR-05, SHR-06, ART-01, ART-02, POL-01, POL-02
**Success Criteria** (what must be TRUE):
  1. After founding an artist, user sees confetti + badge celebration with a share prompt that opens a generated Founder card in the native share sheet
  2. Passport share card generates and downloads correctly
  3. Artist profile fan count navigates to fans list with Founder at top (gold), then Collected (pink), then Discovered (purple)
  4. All scrollable screens have bottom padding for the floating tab bar; full dark and light mode QA passes
**Plans**: 3 plans

Plans:
- [x] 05-01: Backend — /api/share-card/founder and /api/share-card/passport routes
- [x] 05-02: Client — post-found celebration (confetti Lottie, badge reveal, share prompt), share hooks
- [x] 05-03: Client — artist fans list screen, ART-01/ART-02, POL-01/POL-02 QA pass

</details>

<details>
<summary>✅ v3.0 The Living Passport (Phases 6-9) - SHIPPED 2026-03-13</summary>

### Phase 6: Bug Fixes
**Goal**: All critical user-facing bugs resolved so v3.0 features build on a stable foundation
**Depends on**: Phase 5
**Requirements**: BUG-01, BUG-02, BUG-03, BUG-04
**Success Criteria** (what must be TRUE):
  1. User can tap Discover on any artist profile and the Discovery is added to their Passport without error
  2. Listen links on artist profiles open the correct platform URL and only appear when a URL exists in the DB
  3. Share modal opens and the native OS share sheet appears with a generated share card
  4. Leaderboard screen loads and displays ranked data without error
**Plans**: 1 plan

Plans:
- [x] 06-01-PLAN.md — Fix Discover button, Listen links, Share modal, and Leaderboard screen

### Phase 7: Glassy Passport Redesign
**Goal**: The Passport tab becomes a glassmorphic identity artifact with three tabs (Stamps / Finds / Discoveries), frosted glass cards, animated orbs, and View More pages
**Depends on**: Phase 6
**Requirements**: MIG-01, MIG-05, MIG-06, MIG-07, GPASS-01, GPASS-02, GPASS-03, GPASS-04, GPASS-05, GPASS-06, GPASS-07, GPASS-08, GPASS-09, GPASS-10, GPASS-11, GPASS-12, GPASS-13, GPASS-14
**Success Criteria** (what must be TRUE):
  1. Passport screen has three tabs — Stamps, Finds, Discoveries — navigable by tap or swipe; each shows the correct collection type
  2. Cards have visible backdrop blur, soft shadow, slight rotation, and type-appropriate tint (pink/purple/blue) on both iOS and Android
  3. Animated gradient orbs move slowly behind the cards — blur is visually meaningful against a non-flat background
  4. Tapping "View More" opens a full-page list for that tab with search bar and infinite scroll (20 items/page)
  5. Existing BlurView components (StampAnimationModal, SharePrompt, ConfirmationModal) render correctly on Android with the SDK 55 BlurTargetView pattern
**Plans**: 4 plans

Plans:
- [x] 07-01: DB migrations + pager-view install + passport API extension + client types/hooks + BlurView SDK 55 fixes
- [x] 07-02: OrbBackground + 3 GlassCard variants (Stamp/Find/Discovery) + GlassGrid + press-in haptics
- [x] 07-03: PassportPager with frosted glass tab bar + passport.tsx rewrite (orbs + header + pager + badges)
- [x] 07-04: View More pages (search + infinite scroll) + GET /api/mobile/passport-collections endpoint

### Phase 8: Jukebox
**Goal**: Users can browse followed users' Finds in a social music feed, listen via embedded players, and one-tap collect Discoveries
**Depends on**: Phase 7
**Requirements**: MIG-04, JBX-01, JBX-02, JBX-03, JBX-04, JBX-05, JBX-06, JBX-07, JBX-08, JBX-09, JBX-10, JBX-11, JBX-12, JBX-13, JBX-14
**Success Criteria** (what must be TRUE):
  1. Jukebox icon button in the Home tab bar opens the Jukebox screen; map icon is replaced
  2. Jukebox feed shows Finds from followed users in the last 48 hours; when empty, falls back to all platform Finds
  3. Embedded players (Spotify, SoundCloud, Apple Music) render and play audio; opening Jukebox does not interrupt background music already playing on the device
  4. User can one-tap "Discover" on any Jukebox card and the Discovery appears in their Discoveries tab on the Passport screen with haptic feedback
  5. Finder receives a notification when someone collects from their Find
**Plans**: 3 plans

Plans:
- [x] 08-01-PLAN.md — DB migration (MIG-04) + react-native-webview + jukebox API endpoint + useJukebox hook
- [x] 08-02-PLAN.md — JukeboxCard + EmbeddedPlayer + Jukebox screen + Home icon swap + WebView pool
- [x] 08-03-PLAN.md — Discover endpoint fix (collection_type) + finder notification + notification routing

### Phase 9: I'm at a Show
**Goal**: Users can check in at a live show and have the app discover who is performing — via DB lookup, scraping waterfall on the VM, or manual entry — stamping their passport with the full lineup
**Depends on**: Phase 8
**Requirements**: MIG-02, MIG-03, SHOW-01, SHOW-02, SHOW-03, SHOW-04, SHOW-05, SHOW-06, SHOW-07, SHOW-08, SHOW-09, SHOW-10, SHOW-11, SHOW-12, SHOW-13, SHOW-14, SHOW-15, SHOW-16, SHOW-17, SHOW-18, SHOW-19, SHOW-20, SHOW-21, SHOW-22, SHOW-23, SHOW-24, SHOW-25, INFRA-01, INFRA-02, INFRA-03
**Success Criteria** (what must be TRUE):
  1. User at a known venue with DB lineup taps "I'm at a Show," sees venue name confirmed, taps "Collect All," and receives a Stamp (and Founder badge where eligible) for all lineup artists within 1 second
  2. User at a venue with no DB match sees a "Finding out what's playing here..." loading state; results appear within 15 seconds via Supabase Realtime subscription
  3. High-confidence scrape results auto-fill the lineup; medium-confidence results ask for confirmation; low-confidence results require the user to paste a platform link before any artist is created
  4. After 15 seconds with no result, a manual fallback form appears with venue autocomplete and artist link paste; new venues and artists created from submissions are saved to the DB
  5. VM scraper service runs under PM2, restarts on memory exceeding 512MB, and Playwright browser contexts are cleaned up after every request with no leaks
**Plans**: 5 plans

Plans:
- [x] 09-01: DB migrations (MIG-02, MIG-03) + VM scraper service scaffold (Express.js, PM2, shared Playwright browser, INFRA-01/02/03) + shared secret auth
- [x] 09-02: Layer 1 (DB lookup) + Layer 2 (RA/DICE/EDMTrain/Songkick/Bandsintown) + Layer 3 (Google Places) on VM
- [x] 09-03: Layer 5 (Playwright venue website) + Layer 6 (Anthropic SDK, confidence-gated) on VM + POST /api/mobile/show-checkin Vercel fire-and-forget dispatch
- [x] 09-04: Mobile: useShowCheckin hook + ScrapingWaitScreen + Supabase Realtime subscription (with polling fallback for iOS background)
- [x] 09-05: Mobile: confidence-tiered lineup confirmation UI + manual fallback form + Founder+Stamp simultaneous award + summary screen

</details>

---

### 🚧 v3.5 Polish & Identity (In Progress)

**Milestone Goal:** Redesign the login flow and passport screen to establish brand tone and maximize information density — animated login, Instagram-style compact layout, 3-column grid, and badges as a dedicated tab.

#### Phase 10: Login Flow Redesign
**Goal**: The login screen makes a strong first impression with branded animations and a frictionless magic-link flow
**Depends on**: Phase 9
**Requirements**: LOGIN-01, LOGIN-02, LOGIN-03, LOGIN-04, LOGIN-05, LOGIN-06, LOGIN-07, LOGIN-08
**Success Criteria** (what must be TRUE):
  1. Login screen adapts to device dark/light mode — dark background (#0B0B0F) with subtler orbs in dark, white background with low-opacity orbs in light
  2. User sees the "D E C I B E L" wordmark and tagline fade in from top, then input and button stagger in below — before any interaction
  3. User taps the email field and the keyboard slides up without obscuring the input or button
  4. User enters an email, taps the gradient button with haptic feedback, sees a spinner, then sees a checkmark and "Check your email" confirmation
**Plans**: 1 plan

Plans:
- [ ] 10-01-PLAN.md — Theme-aware login with Reanimated orbs, stagger animations, keyboard avoidance

#### Phase 11: Passport Layout & Structure
**Goal**: The Passport header and tab bar are rebuilt in an Instagram-style compact layout that pins to the top and supports swipe navigation
**Depends on**: Phase 10
**Requirements**: PLAYOUT-01, PLAYOUT-02, PLAYOUT-03, PLAYOUT-04, PLAYOUT-05, PLAYOUT-06, PLAYOUT-07, PLAYOUT-08
**Success Criteria** (what must be TRUE):
  1. Passport header is ~180px tall: avatar, four inline stat counts (Followers / Following / Stamps / Finds), username, and "Member since" — no settings gear anywhere on screen
  2. Tapping the Followers or Following count opens the respective list screen
  3. Two action buttons appear below the stats: "Share Passport" (gradient fill) and "Edit Profile" (surface fill)
  4. Scrolling past the header causes the tab bar to stick to the top of the screen
  5. Swiping left or right switches between tabs with a smooth animated transition; the active tab has a pink underline
**Plans**: TBD

#### Phase 12: Passport Grid & Cards
**Goal**: Each passport tab renders a dense, uniform 3-column image grid where every cell tells the story of a collection entry at a glance
**Depends on**: Phase 11
**Requirements**: GRID-01, GRID-02, GRID-03, GRID-04, GRID-05, GRID-06, GRID-07, GRID-08
**Success Criteria** (what must be TRUE):
  1. Grid displays three equal-width square cells per row with ~1px gaps; artist image fills each cell completely with no letterboxing
  2. Each cell has a bottom gradient overlay showing: Stamp cells — artist name + venue + date; Find cells — artist name + platform icon + date; Discovery cells — artist name + "via @user" + date
  3. Cells that belong to the user's Founded artists show a gold star in the top-right corner
  4. Tapping a cell triggers haptic feedback and a press-down scale animation
  5. Each tab shows an empty state with an icon, message, and relevant CTA when there are no entries; the grid loads newest-to-oldest with infinite scroll past 50 items
**Plans**: TBD

#### Phase 13: Badges Section
**Goal**: Badges are surfaced as a dedicated 4th tab in the passport with clear earned vs locked visual states — removed entirely from the header and scroll
**Depends on**: Phase 12
**Requirements**: BADGE-01, BADGE-02, BADGE-03, BADGE-04, BADGE-05
**Success Criteria** (what must be TRUE):
  1. The sticky tab bar shows four tabs: Stamps, Finds, Discoveries, Badges — the Badges tab is reachable by tap or swipe
  2. No badge elements appear in the passport header or anywhere in the main scroll outside the Badges tab
  3. Earned badges render full color with a glow/shadow effect; locked badges render grayscale at 0.3 opacity — visually distinct at a glance
  4. Tapping an earned badge opens a detail card showing how it was earned and the date; tapping a locked badge shows the requirements to unlock it
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 10 → 11 → 12 → 13

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Scaffold | v1.0 | 1/1 | Complete | 2026-03-10 |
| 2. Add Flow | v1.0 | 3/3 | Complete | 2026-03-11 |
| 3. Check-In | v1.0 | 3/3 | Complete | 2026-03-11 |
| 4. Passport Redesign | v1.0 | 2/2 | Complete | 2026-03-11 |
| 5. Share + Polish | v1.0 | 3/3 | Complete | 2026-03-11 |
| 6. Bug Fixes | v3.0 | 1/1 | Complete | 2026-03-12 |
| 7. Glassy Passport Redesign | v3.0 | 4/4 | Complete | 2026-03-12 |
| 8. Jukebox | v3.0 | 3/3 | Complete | 2026-03-13 |
| 9. I'm at a Show | v3.0 | 5/5 | Complete | 2026-03-13 |
| 10. Login Flow Redesign | 1/1 | Complete   | 2026-03-13 | - |
| 11. Passport Layout & Structure | v3.5 | 0/? | Not started | - |
| 12. Passport Grid & Cards | v3.5 | 0/? | Not started | - |
| 13. Badges Section | v3.5 | 0/? | Not started | - |
