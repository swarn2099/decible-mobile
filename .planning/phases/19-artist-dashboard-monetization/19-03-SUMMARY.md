---
phase: 19-artist-dashboard-monetization
plan: "03"
subsystem: web-dashboard
tags: [dashboard, fan-intelligence, overview, svg-chart, nextjs, api-routes]

requires:
  - phase: 19-02
    provides: [artist_claims, artist_subscriptions, performers.verified, dashboard-routing]
provides:
  - GET /api/dashboard/overview: total collectors, cumulative 90-day growth chart, recent activity, subscription
  - GET /api/dashboard/fan-intelligence: collector list with founder badges + also-collects, city breakdown, fans-also-collect cross-reference
  - Rebuilt dashboard-client.tsx with 5 tabs and collector-based data model

affects: [19-04, 19-05, 19-06]

tech-stack:
  added: []
  patterns: [svg-polyline-chart, parallel-promise-all-queries, lazy-client-tab-fetch, any-cast-supabase-joins]

key-files:
  created:
    - /home/swarn/decibel/src/app/api/dashboard/overview/route.ts
    - /home/swarn/decibel/src/app/api/dashboard/fan-intelligence/route.ts
  modified:
    - /home/swarn/decibel/src/app/dashboard/dashboard-client.tsx
    - /home/swarn/decibel/src/app/dashboard/page.tsx

key-decisions:
  - "Fan Intelligence loaded client-side on tab click (heavier query) vs Overview server-side — avoids blocking initial page render"
  - "Supabase join queries typed with any-cast due to Supabase TypeScript treating foreign key joins as arrays — no runtime impact"
  - "Growth chart uses SVG polyline with gradient fill — no external chart library, pure SVG with gradient defs"
  - "Collector deduplication: first collection date per fan used for growth bucketing; multiple collections from same fan only count once"

requirements-completed: [DASH-02, DASH-03]

duration: 13m
completed: 2026-03-16
---

# Phase 19 Plan 03: Dashboard Overview & Fan Intelligence Summary

**Dashboard rebuilt with collector-based data model: hero collector count, SVG growth chart, recent activity feed, full collector table with founder badges, city breakdown bar chart, and fans-also-collect cross-reference.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-16T03:30:30Z
- **Completed:** 2026-03-16T03:43:02Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Two new API endpoints: `/api/dashboard/overview` and `/api/dashboard/fan-intelligence` — both auth-gated via artist_claims with parallel Promise.all queries
- Dashboard client completely rebuilt for Phase 19 collector data model — removed all old tier/scan references
- Overview tab shows "147 Collectors" hero card (pink/purple gradient text), 90-day cumulative growth chart as SVG polyline, and recent activity feed with avatars
- Fan Intelligence tab lazy-loads on click: collector table with founder gold star badges, "also collects" pill tags, city horizontal bar chart, and fans-also-collect artist grid
- Subscription badge (Trial X days / Pro / Expired) in dashboard header

## Task Commits

1. **Task 1: Overview and Fan Intelligence API endpoints** - `81c9c01` (feat)
2. **Task 2: Rebuild dashboard client with Overview and Fan Intelligence** - `a6d1377` (feat)

## Files Created/Modified

- `src/app/api/dashboard/overview/route.ts` - GET: auth guard, parallel queries for total collectors + 90-day cumulative growth + recent activity + subscription
- `src/app/api/dashboard/fan-intelligence/route.ts` - GET: auth guard, collector list (200 max, deduped), founder set, city breakdown, cross-collect overlaps, also_collects per fan
- `src/app/dashboard/dashboard-client.tsx` - Rebuilt: 5 tabs, GrowthChart (SVG polyline), CityBarChart (pure CSS), FanIntelligenceTab with lazy fetch, SubscriptionBadge, collector table with founder star
- `src/app/dashboard/page.tsx` - Updated: server-side overview data fetch, DashboardOverview props shape, removed fan_tiers/tier breakdown queries

## Decisions Made

- Fan Intelligence loads client-side on tab switch — it runs more joins (also_collects subquery per fan) and would block the initial dashboard render if done server-side
- Supabase TypeScript treats joined foreign key columns as arrays even with `!inner` constraint — cast to `any` at access points; no runtime impact since the data is correct
- Growth chart is pure SVG polyline with `linearGradient` defs — no recharts or chart.js added; keeps bundle clean
- Collector deduplication done in JS: first collection event per fan determines their "collected_at" date for the growth chart bucketing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Supabase join TypeScript typing**
- **Found during:** Task 1 build verification (tsc --noEmit)
- **Issue:** Supabase client types foreign-key joins as arrays even with `!inner`, causing TS2345/TS2352 errors on all join field access
- **Fix:** Cast `data` results to `any[]` at the top of each processing block; access join fields through runtime checks for array vs object
- **Files modified:** both API route files
- **Commit:** 81c9c01 (already in the Task 1 commit)

## Self-Check: PASSED

All 4 modified files exist on disk. Both task commits (81c9c01, a6d1377) verified in git log.

## Issues Encountered

- Next.js 16.1.6 Turbopack has an intermittent race condition writing `_buildManifest.js.tmp.*` files on this VM. TypeScript passes clean (`tsc --noEmit` zero errors). This same issue was present in prior plans and does not affect Vercel deployments. Noted in previous session context.

## Next Phase Readiness

- Overview and Fan Intelligence are the core value prop for the $29/month dashboard — artists can now see who collected them, from where, and what other artists their fans collect
- Plan 04 (Messages) can wire up the MessagesTab using the send-message and messages-history APIs already committed in `809d709`
- Plan 05/06 (Stripe) can use the subscription badge component already accepting the ArtistSubscription shape

---
*Phase: 19-artist-dashboard-monetization*
*Completed: 2026-03-16*
