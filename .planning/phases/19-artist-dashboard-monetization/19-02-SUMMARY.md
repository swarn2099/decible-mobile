---
phase: 19-artist-dashboard-monetization
plan: "02"
subsystem: api
tags: [claiming, artist-dashboard, supabase, nextjs, api-routes]

requires:
  - phase: 19-01
    provides: [artist_claims, artist_subscriptions, performers.verified]
provides:
  - GET /api/dashboard/search-artists: name + streaming URL search for artist claiming
  - POST /api/dashboard/claim-artist: inserts artist_claims, creates trial subscription, updates performers.claimed_by
  - /dashboard/claim page with 3-step claim flow (search → confirm → success)
  - /dashboard routing: unclaimed→/dashboard/claim, pending→banner, verified→full dashboard
  - performers.verified BadgeCheck icon on /artist/[slug] page
affects: [19-03, 19-04, 19-05, 19-06]

tech-stack:
  added: []
  patterns: [server-component-auth-guard, admin-client-db-writes, claim-state-routing]

key-files:
  created:
    - /home/swarn/decibel/src/app/api/dashboard/search-artists/route.ts
    - /home/swarn/decibel/src/app/api/dashboard/claim-artist/route.ts
    - /home/swarn/decibel/src/app/dashboard/claim/page.tsx
    - /home/swarn/decibel/src/app/dashboard/claim/claim-client.tsx
  modified:
    - /home/swarn/decibel/src/app/dashboard/page.tsx
    - /home/swarn/decibel/src/app/artist/[slug]/page.tsx

key-decisions:
  - "Dashboard page queries artist_claims first, falls back to performers.claimed_by for legacy compat — no data migration needed"
  - "Trial subscription created at claim time (14 days), not at verification — artists get trial counter from day 1"
  - "search-artists endpoint has no auth requirement — artists may search before signing up"
  - "Verified badge uses lucide BadgeCheck in pink, placed inline in the <h1> to scale with artist name"

requirements-completed: [DASH-01, DASH-12]

duration: 4m
completed: 2026-03-16
---

# Phase 19 Plan 02: Artist Claiming Flow Summary

**Full artist claiming flow: debounced search, 3-step claim UI, claim API with trial subscription, dashboard claim-state routing, and pink verified badge on public artist pages.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-16T03:24:10Z
- **Completed:** 2026-03-16T03:28:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Artist can search for themselves by name or paste a streaming URL, select their profile, and submit a claim in under 30 seconds
- Dashboard correctly routes unclaimed users to /dashboard/claim, pending users to a verification banner, and verified users to the full dashboard
- Verified badge (pink BadgeCheck icon) appears inline next to artist name on their public /artist/[slug] page

## Task Commits

1. **Task 1: Claim flow pages and search API** - `e50845a` (feat)
2. **Task 2: Claim API, dashboard routing, verified badge** - `8ca05dd` (feat)

## Files Created/Modified

- `src/app/api/dashboard/search-artists/route.ts` - GET endpoint: ilike name search + streaming URL match, returns top 20 with claimed status
- `src/app/api/dashboard/claim-artist/route.ts` - POST endpoint: validates, inserts artist_claims, updates performers.claimed_by, creates trial subscription
- `src/app/dashboard/claim/page.tsx` - Server component: auth guard + existing-claim redirect + ClaimClient render
- `src/app/dashboard/claim/claim-client.tsx` - Client component: debounced search input, results list, confirm card, success state
- `src/app/dashboard/page.tsx` - Updated: artist_claims query with legacy fallback, three routing states (no claim / pending / verified)
- `src/app/artist/[slug]/page.tsx` - Added: `verified` field to Performer interface, BadgeCheck icon in h1

## Decisions Made

- Dashboard queries `artist_claims` first then falls back to `performers.claimed_by` — zero migration needed for existing claimed artists
- Trial subscription inserted at claim time so the 14-day clock starts when the artist claims, not when admin verifies
- Search endpoint intentionally unauthenticated so artists can search before creating an account
- Verified badge is an inline `BadgeCheck` (pink, 28px) in the `<h1>` tag — scales with responsive font size naturally

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Claiming flow is complete end-to-end; admin sets `verified=true` in Supabase to unlock dashboard
- Plan 03 can rebuild the DashboardClient with Phase 19 data shapes (fan intelligence, show scheduling, messaging)
- Trial subscription record is in place — Plan 05/06 (Stripe) will update it when artist subscribes

---
*Phase: 19-artist-dashboard-monetization*
*Completed: 2026-03-16*
