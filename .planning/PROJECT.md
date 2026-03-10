# Decibel — Live Music Passport

## What This Is

Decibel is a mobile app (React Native + Expo) that serves as a live music passport for discovering underground artists and logging shows attended. It targets two audiences: Artist Hunters who compete to discover and claim emerging artists (Finds), and Night-Out Loggers who keep a diary of live shows (Stamps). Same app, same data, two lenses.

## Core Value

Every interaction in Decibel revolves around live music — discovering underground artists before they blow up (Finds) and proving you were at the show (Stamps). The Founder badge (one-of-one, first person to add an artist) is the app's most valuable social currency.

## Requirements

### Validated

- ✓ 3-tab navigation (Home, +, Passport) with floating pill tab bar — Phase 1
- ✓ Activity feed with find/stamp cards — Phase 1
- ✓ Artist profile with hero, stats, action button, listen links — Phase 1
- ✓ User profiles with collections, following/followers — Phase 1
- ✓ Passport with collection stamps, badges, share button — Phase 1
- ✓ Search screen for existing Decibel artists and users — Phase 1
- ✓ Dark/light theme support — Phase 1
- ✓ Discover/Found button hierarchy working — Phase 1
- ✓ SoundCloud link paste working — Phase 1

### Active

- [ ] Link-paste-only Add flow (Spotify, Apple Music, SoundCloud URL parsing)
- [ ] Eligibility threshold (1M Spotify / 100K SoundCloud)
- [ ] Apple Music API integration
- [ ] Spotify oEmbed + scraper for monthly listeners
- [ ] + tab with "Add an Artist" / "I'm at a Show" toggle
- [ ] Check-in flow: Scenario A (known venue + lineup), B (tag DJ), C (unknown venue)
- [ ] Stamp animation (rubber stamp + ink spread + haptic)
- [ ] user_tagged_events table and API
- [ ] Passport redesign: Finds (2x3 artist card grid) + Stamps (analog passport aesthetic)
- [ ] Share card system (founder share card, passport share card)
- [ ] Post-found celebration (confetti, badge reveal, share prompt)
- [ ] Artist fans list screen
- [ ] Home search bar relocation (top bar)

### Out of Scope

- Fantasy Music League — Beta 2 feature, requires daily Spotify scraper cron
- Volume Rating System — Beta 2, mixing console fader UI
- "Who's Out Tonight" live friend map — Beta 2
- Weekly recap notifications — Beta 2
- DJ monetization (Pro/Agency tiers) — Phase 3, needs 500+ active users
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
*Last updated: 2026-03-10 after initialization*
