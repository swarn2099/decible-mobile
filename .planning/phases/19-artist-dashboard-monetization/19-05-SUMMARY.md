---
phase: 19-artist-dashboard-monetization
plan: "05"
subsystem: api
tags: [next.js, supabase, push-notifications, expo-push, dashboard]

requires:
  - phase: 19-artist-dashboard-monetization
    provides: artist_claims, artist_messages, sendBulkPushNotifications, dashboard-client scaffold

provides:
  - GET/POST /api/dashboard/shows — artist show CRUD
  - POST /api/dashboard/shows/notify — radius-filtered push to collectors + artist_message record
  - ShowsTab in dashboard-client.tsx — full Smart Flyer UI

affects:
  - activity feed (artist_messages records from show announcements appear in feed)
  - fan app notification handling (show_announcement push type)

tech-stack:
  added: []
  patterns:
    - "City-level radius filtering: ILIKE venue_city against fans.city, fallback to all collectors when no match"
    - "Double-send prevention: notification_sent=true enforced at API level with 409 response"
    - "Show announcement creates artist_message record so it appears in Messages feed"

key-files:
  created:
    - src/app/api/dashboard/shows/route.ts
    - src/app/api/dashboard/shows/notify/route.ts
  modified:
    - src/app/dashboard/dashboard-client.tsx

key-decisions:
  - "MVP radius filtering uses fans.city ILIKE venue_city — city-level proxy, not GPS haversine; fallback to all collectors when city yields 0 matches"
  - "notification_sent flag prevents double-send; returns 409 Conflict if attempted"
  - "Notify endpoint inserts artist_messages record (type=show_announcement) so show promotions appear in message feed"

patterns-established:
  - "Shows tab: create form + list with status badges + one-tap notify button pattern"
  - "Notify endpoint: auth -> show ownership check -> 409 guard -> city filter -> push -> mark notified -> insert message"

requirements-completed: [DASH-07]

duration: 10min
completed: 2026-03-16
---

# Phase 19 Plan 05: Artist Dashboard — Smart Flyer Summary

**Shows CRUD API + one-tap push notification to collectors with city-level radius filtering and automatic message feed entry**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-16T03:47:00Z
- **Completed:** 2026-03-16T03:57:15Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- GET/POST `/api/dashboard/shows` — authenticated CRUD for artist show listings with future-date validation
- POST `/api/dashboard/shows/notify` — sends push to collectors filtered by venue city (ILIKE), falls back to all collectors, marks `notification_sent=true`, inserts into `artist_messages`
- `ShowsTab` in `dashboard-client.tsx` replaces placeholder: create form (venue/city/datetime/ticket URL/description/radius), shows list with Upcoming/Past badges, Notify Fans button, Fans Notified badge post-send

## Task Commits

1. **Task 1: Create shows CRUD and notification APIs** — `efdfc58` (feat)
2. **Task 2: Add Shows tab to dashboard client** — `afdecbb` (feat, bundled with linter-generated Settings tab)

## Files Created/Modified

- `/home/swarn/decibel/src/app/api/dashboard/shows/route.ts` — GET list + POST create shows
- `/home/swarn/decibel/src/app/api/dashboard/shows/notify/route.ts` — push notify collectors about a show
- `/home/swarn/decibel/src/app/dashboard/dashboard-client.tsx` — ShowsTab component wired to shows tab

## Decisions Made

- City-level MVP radius: `fans.city ILIKE venue_city` — no GPS lat/lng on fans yet; `notification_radius_miles` column exists for future precision upgrade
- When city filter yields 0 matches, fall back to ALL collectors (over-send > miss for MVP)
- Notification inserted into `artist_messages` as `message_type=show_announcement` — ensures it surfaces in Messages tab history

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Variable naming collision: `body` (local var) vs `body` (BulkSendParams field) in notify route — linter auto-renamed to `notifBody`
- Pre-existing build infrastructure error (missing pages-manifest.json from hybrid app/pages router) — unrelated to plan work; TypeScript `tsc --noEmit` and `✓ Compiled successfully` confirm code is clean

## Next Phase Readiness

- Smart Flyer feature fully functional: artists can create shows and push notify collectors in one tap
- City-based radius works for MVP; GPS precision deferred to post-launch
- Messages tab still shows ComingSoonTab — Messages feature (19-04 send-message API) needs MessagesTab UI (separate plan)

---
*Phase: 19-artist-dashboard-monetization*
*Completed: 2026-03-16*

## Self-Check: PASSED

- FOUND: src/app/api/dashboard/shows/route.ts
- FOUND: src/app/api/dashboard/shows/notify/route.ts
- FOUND: commit efdfc58 (shows CRUD and notify APIs)
- FOUND: commit afdecbb (ShowsTab in dashboard-client)
