# Decibel — Live Music Passport

## What This Is

Decibel is a mobile app (React Native + Expo) that serves as a live music passport for discovering underground artists and logging shows attended. It targets two audiences: Artist Hunters who compete to discover and claim emerging artists (Finds), and Night-Out Loggers who keep a diary of live shows (Stamps). Same app, same data, two lenses.

## Core Value

Every interaction in Decibel revolves around live music — discovering underground artists before they blow up (Finds) and proving you were at the show (Stamps). The Founder badge (one-of-one, first person to add an artist) is the app's most valuable social currency.

## Current Milestone: v3.5 — Polish & Identity

**Goal:** Redesign the login flow and passport screen to set the brand tone and maximize information density — Instagram-style compact layout, 3-column grid, animated login, and badges as a dedicated tab.

**Target features:**
- Login Flow Redesign (animated gradient orbs, branded input/button, light/dark themed, magic link flow)
- Passport Layout & Structure (compact Instagram-style header, sticky tabs, stats reorder, no settings gear, no badge teaser)
- Passport Grid & Cards (3-column square grid, 1px gaps, cell overlays per tab, empty states)
- Badges Section (4th tab in sticky tab bar, earned vs locked styling, removed from header/scroll)

## Requirements

### Validated

- ✓ 3-tab navigation (Home, +, Passport) with floating pill tab bar — v1.0
- ✓ Activity feed with find/stamp cards — v1.0
- ✓ Artist profile with hero, stats, action button, listen links — v1.0
- ✓ User profiles with collections, following/followers — v1.0
- ✓ Passport with collection stamps, badges, share button — v1.0
- ✓ Search screen for existing Decibel artists and users — v1.0
- ✓ Dark/light theme support — v1.0
- ✓ Discover/Found button hierarchy working — v1.0
- ✓ SoundCloud link paste working — v1.0
- ✓ Link-paste-only Add flow (Spotify, Apple Music, SoundCloud) — v1.0
- ✓ Eligibility threshold (1M Spotify / 100K SoundCloud) — v1.0
- ✓ + tab with "Add an Artist" / "I'm at a Show" toggle — v1.0
- ✓ GPS check-in (Scenarios A+B) — v1.0
- ✓ Stamp animation (rubber stamp + ink spread + haptic) — v1.0
- ✓ Passport redesign: Finds grid + Stamps analog section — v1.0
- ✓ Share card system (founder + passport share cards) — v1.0
- ✓ Post-found celebration (confetti, badge reveal, share prompt) — v1.0
- ✓ Artist fans list screen — v1.0
- ✓ Home search bar relocation (top bar) — v1.0

### Active

- [ ] Login: Animated gradient orbs background (both themes)
- [ ] Login: Branded input + gradient button with haptic + loading/success states
- [ ] Login: Stagger fade-in animations + keyboard avoidance
- [ ] Passport: Compact Instagram-style header (~180px) with avatar + inline stats
- [ ] Passport: Stats order — Followers, Following, Stamps, Finds (tappable social counts)
- [ ] Passport: Share Passport (gradient) + Edit Profile (surface) action buttons
- [ ] Passport: No settings gear, no badge teaser row
- [ ] Passport: Sticky tab bar (Stamps / Finds / Discoveries) with swipe gestures
- [ ] Passport: 3-column square grid with 1px uniform gaps
- [ ] Passport: Cell overlays — artist name, context (venue/platform/via), date, founder badge
- [ ] Passport: Empty states per tab with relevant CTA
- [ ] Passport: Haptic + press animation on cell tap
- [ ] Badges: 4th tab in sticky tab bar
- [ ] Badges: Earned (full color, glow) vs locked (grayscale, 0.3 opacity) styling
- [ ] Badges: Tap earned → detail card, tap locked → requirements

### Out of Scope

- Fantasy Music League — Beta 2 feature, requires daily Spotify scraper cron
- Volume Rating System — Beta 2, mixing console fader UI
- "Who's Out Tonight" live friend map — Beta 2
- Weekly recap notifications — Beta 2
- DJ monetization (Pro/Agency tiers) — needs 500+ active users
- Instagram auto-posting — Beta 2
- Website conversion funnel — separate project
- Text search for external artist catalogs — replaced by link paste
- Deezer API — eliminated entirely

## Context

- **Existing app:** Phase 1 complete and deployed. 3-tab nav, activity feed, artist profiles, passport, search all working.
- **Backend:** Next.js API on Vercel at decible.live/api. Supabase DB. Several mobile endpoints already built.
- **Scraping infra:** SoundCloud API, RA GraphQL, DICE API, EDMTrain, 19hz.info scrapers on DigitalOcean VM.
- **Old codebase:** ~/decibel-mobile-v4/ available for reference (auth, API layer, types, location services).
- **Known bugs fixed in Phase 1:** Card spacing, user profile queries, listen links, following screen, discover button hierarchy.

## Constraints

- **Tech stack:** React Native + Expo (SDK 55), TypeScript, Expo Router, Nativewind
- **Backend:** Next.js API routes on Vercel (no server changes to framework)
- **Database:** Supabase (read-only MCP, service role for API endpoints)
- **No external search:** Adding artists is link-paste only — no Deezer, no Spotify search API
- **Location:** "While Using" permission only for check-in
- **Theme:** Every screen must work in both dark and light mode
- **Font:** Poppins throughout (Regular, Medium, SemiBold, Bold)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Link paste over text search | Prevents adding mainstream artists, creates intentional friction that filters for real fans | — Pending |
| 3 tabs (Home, +, Passport) | Simpler than v4's 4 tabs, + button emphasizes primary action | ✓ Good |
| Finds vs Stamps separation | Different visual treatments match different user motivations (discovery vs attendance) | — Pending |
| Coarse phase structure | PRD already defines 6 clear phases with natural boundaries | — Pending |

---
*Last updated: 2026-03-13 after milestone v3.5 initialization*
