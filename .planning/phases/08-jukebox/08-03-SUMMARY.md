---
phase: 08-jukebox
plan: 03
subsystem: api, mobile-hooks, mobile-notifications
tags: [jukebox, push-notifications, cache-invalidation, collection-type, react-query]

# Dependency graph
requires:
  - phase: 08-01
    provides: useJukebox hook with ['jukebox'] query key

provides:
  - POST /api/mobile/discover sets collection_type='discovery' on insert
  - Finder notification fires after successful discover (fire-and-forget)
  - handleNotificationRoute handles 'artist_collected' type -> /artist/:slug
  - useDiscoverArtist invalidates jukebox query cache on success

affects: [jukebox-feed-freshness, notification-routing, collection-type-integrity]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "void IIFE pattern for fire-and-forget async side effects in Next.js route handlers"
    - "founder_badges-first, fallback-to-collection finder lookup for notification targeting"

key-files:
  modified:
    - ~/decibel/src/app/api/mobile/discover/route.ts
    - ~/decibel-mobile/src/lib/notifications.ts
    - ~/decibel-mobile/src/hooks/useDiscoverArtist.ts

key-decisions:
  - "userId for sendPushNotification uses fan.id (fans table UUID) — follows existing collect/route.ts pattern, not auth UUID"
  - "Fire-and-forget via void IIFE (not void prefix on plain promise) — guarantees any async errors are caught and logged without blocking response"
  - "Finder lookup: founder_badges checked first (canonical finder), falls back to earliest find-type collection"

requirements-completed: [JBX-10, JBX-14]

# Metrics
duration: 4min
completed: 2026-03-13
---

# Phase 08 Plan 03: Discover Endpoint + Finder Notification Summary

**POST /api/mobile/discover now sets collection_type='discovery', fires finder push notification on success, artist_collected notification routes to artist profile, and useDiscoverArtist invalidates jukebox cache**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-13T06:13:12Z
- **Completed:** 2026-03-13T06:17:25Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `collection_type: 'discovery'` added to discover endpoint insert — completes the 3-way split (stamp/find/discovery) for all collection paths (JBX-14)
- Fire-and-forget finder notification: checks `founder_badges` first, falls back to earliest `find`-type collection, skips self-notification (JBX-10)
- `handleNotificationRoute` handles `artist_collected` type — tapping the notification routes to `/artist/:slug`
- `useDiscoverArtist.onSuccess` invalidates `['jukebox']` query key — Jukebox feed refreshes after a user discovers an artist (hides Discover button, shows "In Passport")
- Backend deployed to production (decible.live)

## Task Commits

Each task was committed atomically:

1. **Task 1: Discover endpoint — collection_type + finder notification** - `e9bb099` (feat) — backend repo
2. **Task 2: Mobile notification routing + jukebox cache invalidation** - `55d9b62` (feat) — mobile repo

## Files Modified

- `~/decibel/src/app/api/mobile/discover/route.ts` — import sendPushNotification, add collection_type:'discovery', select fan.name, add fire-and-forget finder notification block
- `~/decibel-mobile/src/lib/notifications.ts` — add 'artist_collected' case to handleNotificationRoute
- `~/decibel-mobile/src/hooks/useDiscoverArtist.ts` — add invalidateQueries(['jukebox']) to onSuccess

## Decisions Made

- `userId` for `sendPushNotification` uses `fan.id` (fans table UUID) — consistent with how `collect/route.ts` already calls this function
- Fire-and-forget uses `void (async () => { ... })()` (IIFE) rather than `void promise` — ensures the async block catches its own errors with try/catch, preventing unhandled rejection
- Finder lookup prioritizes `founder_badges` over `collections` because the founder is always the canonical first finder; `find`-type collections are the fallback for artists added via discover (no founder badge)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All artifacts verified:
- FOUND: ~/decibel/src/app/api/mobile/discover/route.ts (contains collection_type:'discovery' and sendPushNotification call)
- FOUND: ~/decibel-mobile/src/lib/notifications.ts (contains 'artist_collected' case)
- FOUND: ~/decibel-mobile/src/hooks/useDiscoverArtist.ts (contains invalidateQueries(['jukebox']))
- VERIFIED: Backend TypeScript clean (npx tsc --noEmit — no output)
- VERIFIED: Mobile source TypeScript clean (no errors in own source files)
- VERIFIED: Backend deployed to production (decible.live)
- FOUND: Backend commit e9bb099
- FOUND: Mobile commit 55d9b62

---
*Phase: 08-jukebox*
*Completed: 2026-03-13*
