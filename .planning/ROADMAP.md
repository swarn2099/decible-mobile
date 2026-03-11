# Roadmap: Decibel Mobile

## Overview

Phase 1 delivered the scaffold — 3-tab nav, feeds, profiles, passport shell. Phases 2-5 build the four mechanics that make the app actually work: link-paste artist discovery (the core interaction), GPS check-in with stamp animation (the emotional hook), a full passport visual redesign (the identity artifact), and share cards with post-found celebration (the growth loop). Everything builds in dependency order — the add flow unblocks check-in, check-in unblocks the passport, the passport visual language unblocks share card design.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Scaffold** - 3-tab navigation, activity feed, artist/user profiles, passport shell, dark/light theme (COMPLETE)
- [x] **Phase 2: Add Flow** - Link-paste artist discovery with eligibility gating, + tab modes, search bar relocation (completed 2026-03-11)
- [ ] **Phase 3: Check-In** - GPS venue detection, stamp creation (Scenarios A+B), rubber stamp animation
- [ ] **Phase 4: Passport Redesign** - Finds grid (digital aesthetic) + Stamps section (analog passport aesthetic)
- [ ] **Phase 5: Share + Polish** - Founder/passport share cards, post-found celebration, artist fans list, QA pass

## Phase Details

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
  2. App rejects artists over the eligibility threshold (1M Spotify listeners / 100K SoundCloud followers) with the artist card visible and a clear rejection message
  3. App detects when an artist is already on Decibel and shows the appropriate action (Discover vs existing status) instead of re-adding
  4. User who is first to add an artist sees "Add + Found" and becomes the one-of-one Founder with gold badge
  5. Home screen search bar lives in the top bar and searches only existing Decibel artists and users
**Plans**: 3 plans

Plans:
- [ ] 02-01: Backend — validate-artist-link endpoint (Spotify + SoundCloud + Apple Music eligibility gate)
- [ ] 02-02: Client — urlParser.ts port + tests, + tab mode toggle, paste screen, artist preview card
- [ ] 02-03: Client — multi-platform add support, found/discover confirmation, navigation wiring, NAV search bar

**Note:** TAB-03 ("I'm at a Show" initiates check-in flow) is deferred to Phase 3 where the full check-in flow is built. Phase 2 implements TAB-01/TAB-02 (mode toggle + placeholder state).

### Phase 3: Check-In
**Goal**: Users can check in at a live show and create Stamps proving they were there
**Depends on**: Phase 2
**Requirements**: TAB-03, CHK-01, CHK-02, CHK-03, CHK-04, CHK-05, CHK-06, CHK-07, CHK-08, CHK-09, CHK-10, ANIM-01, ANIM-02, ANIM-03
**Success Criteria** (what must be TRUE):
  1. User at a known venue with a lineup sees that venue confirmed, taps Check In, and all lineup artists appear as Stamps in their Passport immediately
  2. User at a known venue with no lineup can tag a performer via link paste and receive a Stamp for that performer
  3. GPS permission rationale screen appears before location is requested, and low-accuracy GPS shows a contextual error instead of silently failing
  4. Check-in after midnight correctly matches the same-night event (not the next UTC day)
  5. Rubber stamp animation slams down with haptic feedback on check-in completion, revealing venue, date, and artist
  6. "I'm at a Show" mode on the + tab initiates the check-in flow (TAB-03)
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — Backend: check-in route, tag-performer route, user_tagged_events table, UTC date fix
- [ ] 03-02-PLAN.md — Client: fix useVenueDetection column bug, GPS accuracy guard, CheckInWizard, VenueScanStep, LineupStep
- [ ] 03-03-PLAN.md — Client: TagPerformerStep (Scenario B), StampAnimationModal (Lottie + haptics), wire complete flow

### Phase 4: Passport Redesign
**Goal**: The Passport tab becomes a visual identity artifact with distinct Finds and Stamps aesthetics
**Depends on**: Phase 3
**Requirements**: PASS-01, PASS-02, PASS-03, PASS-04, PASS-05, PASS-06, PASS-07, PASS-08
**Success Criteria** (what must be TRUE):
  1. Finds section shows a 2x3 artist card grid with hero photo, badge (gold/purple border glow), fan count, and a working Listen button; tapping a card navigates to the artist profile
  2. Founded cards have a gold border glow, Discovered cards have a purple border — visually distinct at a glance
  3. Stamps section has a paper grain texture background with each stamp rotated slightly (deterministic per stamp ID), showing venue name prominently, date in monospace, and artist name(s)
  4. "View All Finds" and "View All Stamps" links open scrollable full collection screens
  5. Dark mode shows leather texture with stamp glow; light mode shows cream texture without glow
**Plans**: TBD

Plans:
- [ ] 04-01: Finds grid — 2x3 artist cards, badge borders, tap navigation, "View All" screen
- [ ] 04-02: Stamps section — paper grain texture, per-stamp rotation, analog typography, dark/light variants

### Phase 5: Share + Polish
**Goal**: Users can share their finds and the app passes full QA for public launch
**Depends on**: Phase 4
**Requirements**: SHR-01, SHR-02, SHR-03, SHR-04, SHR-05, SHR-06, ART-01, ART-02, POL-01, POL-02
**Success Criteria** (what must be TRUE):
  1. After founding an artist, user sees a confetti + badge celebration with a share prompt; tapping Share opens the native OS share sheet with a generated Founder card (9:16 Stories format)
  2. Passport share card generates and downloads correctly, replacing the existing broken share button
  3. "Save to Photos" works with proper media library permission handling on both iOS and Android
  4. Artist profile fan count is tappable and navigates to a fans list with Founder at top (gold), then Collected (pink), then Discovered (purple)
  5. All scrollable screens have bottom padding for the floating tab bar; full dark and light mode QA passes with no hardcoded colors
**Plans**: TBD

Plans:
- [ ] 05-01: Backend — /api/share-card/founder and /api/share-card/passport routes (next/og ImageResponse)
- [ ] 05-02: Client — post-found celebration (confetti Lottie, badge reveal, share prompt), share hooks
- [ ] 05-03: Client — artist fans list screen, ART-01/ART-02, POL-01/POL-02 QA pass

## Progress

**Execution Order:**
Phases execute in numeric order: 1 (complete) → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold | 1/1 | Complete | 2026-03-10 |
| 2. Add Flow | 3/3 | Complete   | 2026-03-11 |
| 3. Check-In | 0/3 | Not started | - |
| 4. Passport Redesign | 0/2 | Not started | - |
| 5. Share + Polish | 0/3 | Not started | - |
