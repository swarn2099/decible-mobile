---
phase: 18-artist-profile-link-in-bio
plan: 03
subsystem: ui
tags: [nextjs, ssr, og-meta, supabase, passport, public-profile, isr]

# Dependency graph
requires:
  - phase: 15-passport-redesign
    provides: PassportClient component with isPublic prop support
provides:
  - Public SSR user passport page at decibel.live/@username
  - OG meta tags for social sharing of user profiles
  - ISR caching (1-hour) for performance
affects: [social sharing, user acquisition, link-in-bio]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@ prefix route guard: [username] page rejects non-@ paths via notFound()"
    - "createSupabaseAdmin() for public pages that don't need auth cookies"
    - "generateMetadata with separate DB query for fast OG tag generation"

key-files:
  created:
    - /home/swarn/decibel/src/app/[username]/page.tsx
  modified: []

key-decisions:
  - "Route guard uses decoded @ prefix check — prevents [username] from intercepting named routes added later"
  - "ilike() for case-insensitive fan name lookup (usernames may vary in case)"
  - "Reuses PassportClient with isPublic=true — no new component needed"
  - "ISR revalidate=3600 for public pages — balances freshness vs performance"
  - "Uses createSupabaseAdmin() (service role) since public page has no auth session"

patterns-established:
  - "Public passport lookup: decode URL → strip @ → ilike query fans.name → build timeline exactly like private passport"

requirements-completed: [ARTIST-06]

# Metrics
duration: 8min
completed: 2026-03-16
---

# Phase 18 Plan 03: Artist Profile Link in Bio Summary

**SSR public user passport page at decibel.live/@username with OG meta tags, ISR caching, and read-only PassportClient view**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-16T02:41:00Z
- **Completed:** 2026-03-16T02:49:41Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `src/app/[username]/page.tsx` in the decibel web project — a fully SSR public passport page
- Route guard rejects non-@ paths to prevent routing conflicts with named routes
- OG meta tags include user name, collection count, avatar URL, and Twitter card
- Reuses existing `PassportClient` with `isPublic={true}` — zero new UI components needed
- Build passes with route appearing as `ƒ /[username]` in the Next.js route manifest

## Task Commits

Each task was committed atomically:

1. **Task 1: Create public user passport page at /@username** - `04f2a25` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `/home/swarn/decibel/src/app/[username]/page.tsx` - Public SSR passport page with OG meta, ISR, route guard

## Decisions Made
- Route guard: `if (!decoded.startsWith("@")) { notFound() }` — prevents this catch-all from intercepting future named routes
- Case-insensitive lookup via `.ilike("name", rawName)` — users might share links with different case
- Reused `PassportClient` with `isPublic={true}` — no duplicate UI code, all read-only behavior already implemented
- `createSupabaseAdmin()` over `createSupabaseServer()` — public page has no auth cookies so server client would return null user

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- Turbopack build fails with intermittent `ENOENT` and `PostCSS module not found` errors (pre-existing Turbopack bug on this VM). Resolved by clearing `.next` cache before building. Build succeeded on third attempt. This is a Turbopack instability issue, not a code issue.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `decibel.live/@username` is live and publicly accessible after next Vercel deploy
- Phase 18 plans 01 and 02 (artist claim flow, artist dashboard) can now link to this public passport URL
- Ready for Phase 18-04 if it exists, or Phase 19

---
*Phase: 18-artist-profile-link-in-bio*
*Completed: 2026-03-16*
