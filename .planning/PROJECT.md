# Decibel — The Artist Growth Platform

## What This Is

Decibel is a two-sided music platform. The fan-facing mobile app (React Native + Expo) lets users discover and collect underground artists, building a passport of Finds and Founders. The artist-facing web dashboard (Next.js) gives independent artists fan intelligence, push notifications, smart flyers, and a link-in-bio page. The fan app generates the data; the artist dashboard monetizes it.

## Core Value

Fans compete to discover underground artists before they blow up (Founder badge = one-of-one social currency). Artists get direct access to their most engaged fans and actionable growth intelligence — worth $29/month.

## Current Milestone: v6.0 — The Artist Growth Platform

**Goal:** Transform Decibel from a fan-only collection app to a two-sided artist growth platform with monetization. Ship fan app improvements (Phases 1-4), then build artist dashboard with $29/month subscriptions (Phases 5-7). Target: $5-10K MRR by September 2026.

**Target features:**
- Bug fixes & cleanup: Apple Music URLs, stat mismatch, remove stamps from UI, song/album link support, share modal, listen links
- Passport redesign: v3.5 spec (login, Instagram-style layout, 3-column grid, sticky tabs)
- Home screen & feed: activity feed from followed users, stats bar, trending artists, Jukebox
- Leaderboard & share cards: 3 ranking views, time filters, auto-generated share cards
- Artist profile & link-in-bio: in-app artist pages, public SSR web pages at decibel.live
- Artist dashboard & monetization: claiming flow, fan intelligence, push notifications, Stripe billing
- Outreach & growth engine: automated artist outreach, milestone notifications

**Two repos:**
- `/home/swarn/decibel-mobile` — React Native fan app (Phases 1-4 primarily)
- `/home/swarn/decibel` — Next.js web app, API routes, artist dashboard (Phases 5-7 primarily)

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
- ✓ Login flow redesign (animated orbs, branded input/button) — v3.5
- ✓ Passport Instagram-style layout (compact header, sticky tabs, 3-col grid) — v3.5
- ✓ Badges as 4th tab in sticky tab bar — v3.5

### Active

See `.planning/REQUIREMENTS.md` for v6.0 requirements with REQ-IDs.

### Out of Scope

- Fantasy Music League — requires daily Spotify scraper cron, defer to future
- Volume Rating System — mixing console fader UI, future
- "Who's Out Tonight" live friend map — future
- Weekly recap notifications — future
- Instagram auto-posting — future
- Text search for external artist catalogs — replaced by link paste
- Deezer API — eliminated entirely
- Fan premium subscription ($2.99/month) — nice-to-have, not the business (defer)

## Context

- **Two repos:** Mobile (decibel-mobile) and Web (decibel) are separate projects. Phases 1-4 are mobile-first, Phases 5-7 are web-first.
- **Backend API:** Next.js API routes at decible.live/api (being migrated to decibel-three.vercel.app). Supabase DB.
- **Revenue model:** Artists pay $29/month for Decibel Pro (fan intelligence, push notifications, smart flyer, link-in-bio). Target 175-345 paying artists = $5-10K MRR.
- **Core loop:** Fans find artists → artists accumulate collectors → Decibel outreach at 10+ collectors → artists claim + start trial → artists push notify collectors → fans re-engage → cycle repeats.
- **Stamps deprecated from UI:** v6.0 removes stamps/events/venue detection from UI. Data preserved in DB. Passport tabs become: Finds | Founders | Discoveries | Badges.
- **2,164+ artists** already in database — each becomes an indexable link-in-bio page for SEO.

## Constraints

- **Tech stack (mobile):** React Native + Expo (SDK 55), TypeScript, Expo Router, Nativewind
- **Tech stack (web):** Next.js, TypeScript, Tailwind CSS, Vercel
- **Database:** Supabase (auth, Postgres, Realtime, Storage)
- **Payments:** Stripe Checkout for artist subscriptions
- **Push notifications:** Expo Push API
- **No external search:** Adding artists is link-paste only
- **Theme:** Every mobile screen must work in both dark and light mode
- **Font:** Poppins throughout

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Link paste over text search | Prevents adding mainstream artists, intentional friction | ✓ Good |
| 3 tabs (Home, +, Passport) | Simpler, + button emphasizes primary action | ✓ Good |
| Remove stamps from UI | Simplify app, focus on discovery. Data preserved in DB. | — Pending |
| Two-sided platform pivot | Fan app generates data, artist dashboard monetizes | — Pending |
| $29/month artist pricing | 175-345 artists = $5-10K MRR target | — Pending |
| Stripe for billing | Handles everything — billing, receipts, cancellations | — Pending |
| Manual artist verification (MVP) | Automated verification deferred to month 2-3 | — Pending |
| Song/album link support | People share songs, not profiles — reduces friction | — Pending |

---
*Last updated: 2026-03-16 after milestone v6.0 initialization*
