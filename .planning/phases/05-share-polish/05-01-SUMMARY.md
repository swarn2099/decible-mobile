---
phase: 05-share-polish
plan: "01"
subsystem: api
tags: [next-og, edge-runtime, image-response, share-card, vercel]

# Dependency graph
requires: []
provides:
  - "GET /api/share-card/founder — 1080x1920 PNG: artist photo, gold FOUNDED BY label, Decibel branding"
  - "GET /api/share-card/passport — 1080x1920 PNG: user name, stats row, 2x2 artist photo grid"
affects: [05-02-share-virality, mobile-share-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "next/og ImageResponse on Edge runtime for server-side PNG generation"
    - "Satori constraint: every flex container needs display:flex inline style"
    - "Graceful photo fallback: initials-in-gradient-circle when no artist photo URL provided"

key-files:
  created:
    - ~/decibel/src/app/api/share-card/founder/route.tsx
    - ~/decibel/src/app/api/share-card/passport/route.tsx
  modified: []

key-decisions:
  - "Both routes are unauthenticated (public GET) — share cards are shareable by design, no auth required"
  - "topPhotos param is comma-separated URLs (up to 4); empty cells render as pink/purple gradient placeholder divs"
  - "Dark background #0B0B0F always — share card ignores user theme preference per spec"

patterns-established:
  - "Share card pattern: edge runtime + ImageResponse + query params only, no DB calls"
  - "Photo fallback pattern: check URL truthiness, render gradient circle with initials if missing"

requirements-completed: [SHR-03, SHR-04]

# Metrics
duration: 5min
completed: 2026-03-11
---

# Phase 5 Plan 01: Share Card Routes Summary

**Two Vercel Edge routes generating 1080x1920 dark-background PNGs — founder card with artist photo and gold badge, passport card with stats and 2x2 photo grid — both deployed to production.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-11T06:51:00Z
- **Completed:** 2026-03-11T06:56:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `/api/share-card/founder` renders artist photo (or initials fallback), artist name at 56px bold, "FOUNDED BY [USERNAME]" in gold, Decibel branding — 1080x1920 PNG on edge
- `/api/share-card/passport` renders user name, "PASSPORT" subtitle, three stat blocks (Artists/Shows/Venues), 2x2 photo grid with gradient placeholders — 1080x1920 PNG on edge
- Both deployed and verified returning `200 image/png` on Vercel production deployment URL

## Task Commits

Each task was committed atomically:

1. **Task 1+2: founder and passport share card routes** - `350f90f` (feat) — both routes deployed in single Vercel push per plan spec

**Plan metadata:** (created after this summary)

## Files Created/Modified
- `~/decibel/src/app/api/share-card/founder/route.tsx` — Founder card: artist photo area (top ~60%), gradient overlay, gold FOUNDED BY + username, Decibel branding footer
- `~/decibel/src/app/api/share-card/passport/route.tsx` — Passport card: user name header, 3-column stat row, 2x2 artist photo grid (gradient placeholder for empty cells)

## Decisions Made
- Both routes are public GET endpoints — no auth token required. Share cards are meant to be sharable via any surface.
- Used `decible-live` direct deployment URL for verification since `decible.live → www.decible.live` 307 redirect causes DNS resolution failure from the VM (not a production issue — browsers follow the redirect fine).
- Tasks 1 and 2 share a single commit because the plan specified batching the Vercel deploy for both routes.

## Deviations from Plan

None — plan executed exactly as written. TypeScript compiled clean (full project `tsc --noEmit` with zero share-card errors). Both routes appeared in the Vercel build output and returned 200 image/png.

## Issues Encountered
- `tsc --noEmit src/app/api/share-card/founder/route.tsx` (single-file mode) reported JSX errors due to missing `--jsx` flag — this is expected behavior. Full project check (`npx tsc --noEmit`) produced zero errors, confirming the project tsconfig covers the files correctly.
- VM DNS cannot resolve `www.decible.live` directly, so curl verification used the Vercel deployment URL instead. The `decible.live → www.decible.live` 307 is site-wide (all existing routes exhibit it).

## User Setup Required
None — no external service configuration required.

## Self-Check: PASSED

All files verified present. Commit `350f90f` confirmed in `~/decibel` git log. SUMMARY.md created.

## Next Phase Readiness
- Both share card endpoints live and serving PNG at expected URLs
- Plan 05-02 (mobile share flow) can now call `/api/share-card/founder?artistName=...&fanSlug=...` and `/api/share-card/passport?name=...&artistsFound=...&showsAttended=...&venues=...&topPhotos=...` to get shareable images

---
*Phase: 05-share-polish*
*Completed: 2026-03-11*
