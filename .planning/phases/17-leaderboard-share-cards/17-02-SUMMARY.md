---
phase: 17-leaderboard-share-cards
plan: 02
subsystem: api, mobile
tags: [react-native, share-cards, expo, next.js, typescript, og-image]

# Dependency graph
requires:
  - phase: 17-01
    provides: "Leaderboard redesign and trophy icon"
provides:
  - "Founder share card with listener count, found date, full-bleed photo (1080x1920)"
  - "Passport share card with v6.0 stats: Finds/Founders/Influence, avatar, top founded artist photos"
  - "Mobile hooks updated with v6.0 param types"
  - "add.tsx passes listener count + found date on founding"
  - "passport.tsx passes v6.0 stats on share press"
affects: [share-virality, instagram-stories]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "formatListenerCount helper: <1000=exact, >=1000=XK, >=1M=X.XM"
    - "Founder card: full-bleed artist photo + bottom gradient overlay pattern (Spotify Wrapped style)"
    - "Passport card: circular avatar + 3-stat row (Finds white / Founders gold / Influence purple) + circular artist photo row"

key-files:
  created: []
  modified:
    - /home/swarn/decibel/src/app/api/share-card/founder/route.tsx
    - /home/swarn/decibel/src/app/api/share-card/passport/route.tsx
    - /home/swarn/decibel-mobile/src/hooks/useShareCard.ts
    - /home/swarn/decibel-mobile/app/(tabs)/add.tsx
    - /home/swarn/decibel-mobile/app/(tabs)/passport.tsx

key-decisions:
  - "Founder card uses full-bleed photo + bottom gradient overlay (not top 60% split) — more premium, Spotify Wrapped-tier"
  - "Passport card influence score passed as 0 from passport.tsx until leaderboard API integration in future phase"
  - "Top photos for passport card sourced from founders array (not allCollections) — 3 circular gold-bordered images"
  - "ShareSheet Instagram Stories already implemented correctly with UTI approach — no changes needed"

requirements-completed: [SHARE-01, SHARE-02, SHARE-03]

# Metrics
duration: 8min
completed: 2026-03-16
---

# Phase 17 Plan 02: Share Card Updates Summary

**Premium founder and passport share cards updated for v6.0 stats — listener count on founding, Finds/Founders/Influence on passport, full-bleed photo design**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-16
- **Completed:** 2026-03-16
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Redesigned founder share card: full-bleed artist photo background with dark gradient overlay, DECIBEL wordmark at top, `@username` in gold, artist name in bold white, pink "Found at XK listeners" line, found date in muted gray, `decibel.live` at bottom
- Updated passport share card: circular user avatar (200px), v6.0 stats row (Finds white / Founders gold / Influence purple), "TOP FOUNDED ARTISTS" row with 3 circular gold-bordered photos, username and `decibel.live/@username` branding
- Updated `FounderShareParams` type with optional `listenerCount` and `foundDate`
- Updated `PassportShareV2Params` type replacing old `artistsFound/showsAttended/venues` with `finds/founders/influence/avatarUrl`
- `add.tsx`: `formatListenerCount` helper formats Spotify/SoundCloud counts at founding time; passes `foundDate` as formatted locale string
- `passport.tsx`: `handleSharePassport` now passes `finds.length`, `founders.length`, top 3 founder photos (circular), and `avatarUrl`
- Deployed API to decible.live (production), mobile to EAS preview (update group `911a998b`)

## Task Commits

1. **Task 1: Update share card APIs for v6.0 stats and premium design** - `24884cd` (feat)
2. **Task 2: Wire mobile hooks + share sheet for v6.0 params and Instagram Stories** - `d12e1b8` (feat)

## Files Created/Modified

- `/home/swarn/decibel/src/app/api/share-card/founder/route.tsx` — Full redesign: full-bleed photo bg, gradient overlay, listenerCount + foundDate params
- `/home/swarn/decibel/src/app/api/share-card/passport/route.tsx` — Rewritten for v6.0: finds/founders/influence stats, circular avatar, top 3 artist photos
- `/home/swarn/decibel-mobile/src/hooks/useShareCard.ts` — FounderShareParams + PassportShareV2Params updated with v6.0 fields
- `/home/swarn/decibel-mobile/app/(tabs)/add.tsx` — formatListenerCount helper, passes listenerCount + foundDate to founder card
- `/home/swarn/decibel-mobile/app/(tabs)/passport.tsx` — handleSharePassport passes finds/founders/influence/avatarUrl/topPhotos

## Decisions Made

- Full-bleed photo + gradient overlay chosen over split-section layout — more cinematic, Spotify Wrapped-level premium feel
- Influence score hard-coded as 0 in passport share for now (no leaderboard hook in passport.tsx yet) — clean fallback
- Top photos sourced from `founders` array specifically, not all finds — makes more sense to showcase the artists you're the founder of
- ShareSheet was already correctly implemented for Instagram Stories (UTI approach on iOS, system share sheet on Android) — no changes needed

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx tsc --noEmit` in `/home/swarn/decibel` — 0 errors
- `npx tsc --noEmit` in `/home/swarn/decibel-mobile` — 0 errors
- Founder card URL `https://decibel-three.vercel.app/api/share-card/founder?artistName=TestArtist&fanSlug=swarn&listenerCount=42K&foundDate=Mar+16+2026` — 200 OK, 56953 bytes PNG
- Passport card URL `https://decibel-three.vercel.app/api/share-card/passport?name=Swarn&finds=12&founders=5&influence=89` — 200 OK, 64969 bytes PNG
- API deployed to decible.live (Vercel production)
- Mobile deployed: EAS preview update group `911a998b-9a5d-4ead-a712-fea72ea35174`

---
*Phase: 17-leaderboard-share-cards*
*Completed: 2026-03-16*

## Self-Check: PASSED
- `/home/swarn/decibel/src/app/api/share-card/founder/route.tsx` — FOUND
- `/home/swarn/decibel/src/app/api/share-card/passport/route.tsx` — FOUND
- `/home/swarn/decibel-mobile/src/hooks/useShareCard.ts` — FOUND
- `/home/swarn/decibel-mobile/app/(tabs)/add.tsx` — FOUND
- `/home/swarn/decibel-mobile/app/(tabs)/passport.tsx` — FOUND
- Commit 24884cd (API updates) — FOUND
- Commit d12e1b8 (mobile wiring) — FOUND
- Both card URLs return 200 PNG verified via curl
