# Decibel — Live Music Passport

## What This Is

Decibel is a mobile app (React Native + Expo) that serves as a live music passport for discovering underground artists and logging shows attended. It targets two audiences: Artist Hunters who compete to discover and claim emerging artists (Finds), and Night-Out Loggers who keep a diary of live shows (Stamps). Same app, same data, two lenses.

## Core Value

Every interaction in Decibel revolves around live music — discovering underground artists before they blow up (Finds) and proving you were at the show (Stamps). The Founder badge (one-of-one, first person to add an artist) is the app's most valuable social currency.

## Current Milestone: v3.0 — The Living Passport

**Goal:** Transform Decibel from a static collection app into a living, social music discovery platform with three major features: Glassy Passport redesign, Jukebox social feed, and magic check-in flow.

**Target features:**
- Glassy Passport Redesign (Stamps / Finds / Discoveries tabs, frosted glass cards, View More pages)
- Jukebox (social music discovery feed, embedded players, one-tap Discover collect)
- "I'm at a Show" magic check-in (location-based, scraping waterfall on VM, manual fallback)
- Bug fixes (Discover button, Listen links, share modal, leaderboard API)

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

- [ ] Fix Discover button (non-functional)
- [ ] Fix Listen links (broken)
- [ ] Fix share modal (broken)
- [ ] Fix leaderboard API (non-functional)
- [ ] Glassy Passport: Three-tab layout (Stamps / Finds / Discoveries)
- [ ] Glassy Passport: Frosted glass cards with expo-blur
- [ ] Glassy Passport: View More pages with search + infinite scroll
- [ ] Glassy Passport: Animated gradient orbs background
- [ ] Jukebox: Social music discovery feed from followed users' Finds
- [ ] Jukebox: Embedded players (Spotify, SoundCloud, Apple Music)
- [ ] Jukebox: One-tap Discover collect
- [ ] "I'm at a Show": Magic check-in with scraping waterfall
- [ ] "I'm at a Show": VM scraper service (7 layers, 15s timeout)
- [ ] "I'm at a Show": Manual fallback form
- [ ] "I'm at a Show": Supabase realtime for async scrape results
- [ ] Collection type: Discovery (collected via Jukebox/browse)

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
*Last updated: 2026-03-12 after milestone v3.0 initialization*
