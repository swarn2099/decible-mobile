---
phase: 18-artist-profile-link-in-bio
plan: 02
subsystem: ui
tags: [next.js, ssr, og-meta, seo, link-in-bio, deep-link]

# Dependency graph
requires:
  - phase: 18-artist-profile-link-in-bio
    provides: "Plan 01 — artist page foundation at decibel.live/[slug]"
provides:
  - "Spotify and Apple Music listen links on artist web page (primary platforms first)"
  - "'Collect on Decibel' pink-to-purple gradient pill CTA in both founder and unclaimed artist states"
  - "OG meta tags with artist photo for both og:image and twitter:image (social previews)"
  - "openGraph.type='profile' for richer LinkedIn/social previews"
  - "Improved OG description: 'X fans have discovered Y on Decibel. Listen, collect, and earn your badge.'"
affects:
  - "19-artist-dashboard"
  - "20-monetization"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Listen links array ordered by platform priority: Spotify, Apple Music, SoundCloud, Mixcloud, RA, Instagram"
    - "App Store deep link as MVP CTA (universal links require AASA infra — deferred)"

key-files:
  created: []
  modified:
    - /home/swarn/decibel/src/app/artist/[slug]/page.tsx

key-decisions:
  - "App Store URL used for 'Collect on Decibel' CTA — universal links require Apple AASA file (separate infra task)"
  - "Unclaimed artist state shows both 'Collect on Decibel' and 'Claim Founder Badge' buttons in a flex row"
  - "OG description changed from venue-centric to action-centric copy"

patterns-established:
  - "Listen links filter by platform URL presence — only show button if URL exists in DB"

requirements-completed: [ARTIST-03, ARTIST-04, ARTIST-05]

# Metrics
duration: 8min
completed: 2026-03-16
---

# Phase 18 Plan 02: Artist Link-in-Bio Enhancement Summary

**SSR artist page at decibel.live/[slug] now shows Spotify + Apple Music listen links first, pink-to-purple 'Collect on Decibel' gradient CTA, and artist photo in both og:image and twitter:image social previews**

## Performance

- **Duration:** 8min
- **Started:** 2026-03-16T02:42:09Z
- **Completed:** 2026-03-16T02:50:48Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added `apple_music_url` to Performer interface so it's pulled from `select("*")` DB query
- Spotify and Apple Music links now appear first in the listen links array (primary platforms before SoundCloud/Mixcloud)
- "Collect on Decibel" gradient pill button (from-pink to-purple) added to both the founded artist card and the unclaimed artist FOMO section
- Unclaimed state now has two CTAs: prominent "Collect on Decibel" + secondary "Claim Founder Badge"
- OG description upgraded to action-oriented copy: "{N} fans have discovered {name} on Decibel. Listen, collect, and earn your badge."
- Added `openGraph.type: "profile"` for richer social previews
- Added `twitter.images` so Twitter cards show artist photo (previously only og:image was set)
- Bottom AppStoreCTA copy updated from "Track" to "Collect" framing with passport-focused subtitle

## Task Commits

1. **Task 1: Add Spotify + Apple Music links, Collect CTA, and fix OG tags** - `dc19914` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `/home/swarn/decibel/src/app/artist/[slug]/page.tsx` - Enhanced with all platform links, Collect CTA, improved OG meta

## Decisions Made
- App Store URL used for "Collect on Decibel" CTA — universal links require Apple AASA file setup (separate infra task, deferred to polish phase)
- Unclaimed artist state shows both primary "Collect on Decibel" and secondary "Claim Founder Badge" so neither action is lost
- OG description changed from Chicago-centric venue framing to discovery-focused copy matching v6.0 product positioning

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Next.js 16 Turbopack on this VM has a transient ENOENT on `_buildManifest.js.tmp.*` files (known race condition). Build succeeds on retry — not a code issue. `npx tsc --noEmit` returns zero errors confirming TypeScript is clean.

## User Setup Required

None — no external service configuration required. Changes deploy automatically when pushed to GitHub (Vercel auto-deploy).

## Next Phase Readiness
- Artist link-in-bio is feature-complete for MVP: all platform listen links, Collect CTA, proper social previews
- Phase 19 (Artist Dashboard) can proceed — the public artist page links to App Store which onboards new fans
- Universal links (deep-link directly into app) deferred to polish phase — requires Apple AASA file and Vercel config

---
*Phase: 18-artist-profile-link-in-bio*
*Completed: 2026-03-16*
