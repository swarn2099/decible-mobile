---
phase: 19-artist-dashboard-monetization
plan: "04"
subsystem: api, mobile
tags: [push-notifications, activity-feed, artist-messaging, react-native, nextjs]

requires:
  - phase: 19-02
    provides: [artist_claims, verified artists]
provides:
  - POST /api/dashboard/send-message: rate-limited push notification broadcast to all collectors
  - GET /api/dashboard/messages: message history with can_send + next_available_at
  - Updated GET /api/mobile/activity-feed: includes artist_message items from collected artists
  - ArtistMessageCard: mobile feed card with pink left border + megaphone icon
affects: [19-05, 19-06]

tech-stack:
  added: []
  patterns: [sendBulkPushNotifications, artist-to-fan-broadcast, mixed-type-feed]

key-files:
  created:
    - /home/swarn/decibel/src/app/api/dashboard/send-message/route.ts
    - /home/swarn/decibel/src/app/api/dashboard/messages/route.ts
    - /home/swarn/decibel-mobile/src/components/feed/ArtistMessageCard.tsx
  modified:
    - /home/swarn/decibel/src/app/api/mobile/activity-feed/route.ts
    - /home/swarn/decibel-mobile/src/types/index.ts
    - /home/swarn/decibel-mobile/app/(tabs)/index.tsx

key-decisions:
  - "Activity feed artist_message items merged in JS (not SQL) sorted by timestamp — keeps feed endpoint stateless and avoids complex cross-table JOIN pagination"
  - "ActivityFeedItem type extended with optional fields (type/artist_message/artist_slug) rather than creating a union type — avoids breaking all existing feed renders"
  - "send-message inserts DB record before pushing notifications so message_id is available in push data payload"
  - "TURBOPACK=0 needed for clean builds — Turbopack 16.1.6 has a tmp file race condition on this VM (tsc --noEmit passes clean)"

requirements-completed: [DASH-04, DASH-05, DASH-06]

duration: 6m
completed: 2026-03-16
---

# Phase 19 Plan 04: Artist Push Notifications & Feed Messages Summary

**Artist-to-fan push notification system: rate-limited broadcast API, message history, and ArtistMessageCard in the mobile feed with distinct pink left-border treatment.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-16T03:38:00Z
- **Completed:** 2026-03-16T03:44:15Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Verified artists can send a 280-char message to all collectors via POST /api/dashboard/send-message — enforces 1/week rate limit (returns 429 + next_available_at on second send)
- GET /api/dashboard/messages returns full history with can_send boolean so the dashboard UI can disable the compose form automatically
- Activity feed now fetches artist_messages from collected performers (last 7 days) and merges them into the feed sorted by recency
- ArtistMessageCard renders with pink left border (4px), megaphone icon, artist avatar (pink ring), message text, and relative timestamp

## Task Commits

| Repo | Task | Commit | Description |
|------|------|--------|-------------|
| decibel | Task 1 | `809d709` | send-message and messages history dashboard APIs |
| decibel | Task 2 | `8da1c55` | add artist message items to activity feed |
| decibel-mobile | Task 2 | `1d361d2` | ArtistMessageCard component and Home feed integration |

## Files Created/Modified

- `src/app/api/dashboard/send-message/route.ts` — POST endpoint: auth guard, 280-char validation, 1/week rate limit, bulk push via sendBulkPushNotifications, DB insert with recipient_count
- `src/app/api/dashboard/messages/route.ts` — GET endpoint: message history (50 max), can_send boolean, next_available_at timestamp
- `src/app/api/mobile/activity-feed/route.ts` — Updated to query artist_messages for collected performer_ids, merge into feed sorted by timestamp
- `src/components/feed/ArtistMessageCard.tsx` — Mobile card: pink left border, megaphone icon, artist avatar with pink ring, message text (3 lines max), relative time
- `src/types/index.ts` — ActivityFeedItem extended with optional type/artist_message/artist_slug fields
- `app/(tabs)/index.tsx` — Home screen renders ArtistMessageCard branch for type='artist_message' items

## Decisions Made

- Feed merges artist messages in JavaScript (post-query sort) rather than SQL to avoid complex cross-table pagination
- ActivityFeedItem uses optional fields rather than a discriminated union to avoid cascading type changes in all feed consumers
- Message record inserted before push send so message_id is available in push notification data payload
- TURBOPACK=0 env flag needed for builds on this VM — Turbopack 16.1.6 has tmp file race condition; tsc --noEmit confirms clean TypeScript

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pre-existing Turbopack build error unblocked with TURBOPACK=0**
- **Found during:** Task 1 verification
- **Issue:** Next.js 16.1.6 Turbopack writes tmp files to hashed static dirs that don't exist yet, causing ENOENT on concurrent writes
- **Fix:** Used `TURBOPACK=0 npx next build` — webpack build completes clean. TypeScript confirmed zero errors via `tsc --noEmit`
- **Files modified:** None (build config, not source)

## Issues Encountered

None.

## Next Phase Readiness

- Artist messaging system is complete end-to-end
- Plan 03 (dashboard UI) can wire up SendMessageModal using the send-message API and messages API
- Push notifications flow through existing Expo infrastructure — preferences and daily caps respected
- Plan 05/06 (Stripe) can gate send-message behind subscription check by adding subscription status query to the endpoint

---
## Self-Check: PASSED

- FOUND: /home/swarn/decibel/src/app/api/dashboard/send-message/route.ts
- FOUND: /home/swarn/decibel/src/app/api/dashboard/messages/route.ts
- FOUND: /home/swarn/decibel-mobile/src/components/feed/ArtistMessageCard.tsx
- FOUND commit: 809d709 (send-message + messages APIs)
- FOUND commit: 8da1c55 (activity feed update)
- FOUND commit: 1d361d2 (mobile component + home screen)

---
*Phase: 19-artist-dashboard-monetization*
*Completed: 2026-03-16*
