---
phase: 19-artist-dashboard-monetization
plan: "06"
subsystem: web-dashboard
tags: [links, settings, artist-page, crud-api]
dependency_graph:
  requires: ["19-03"]
  provides: [artist-links-crud, settings-tab, public-page-custom-links]
  affects: [dashboard-client, artist-public-page]
tech_stack:
  added: []
  patterns: [supabase-admin-crud, optimistic-ui-reorder, platform-fallback-strategy]
key_files:
  created:
    - /home/swarn/decibel/src/app/api/dashboard/links/route.ts
  modified:
    - /home/swarn/decibel/src/app/dashboard/dashboard-client.tsx
    - /home/swarn/decibel/src/app/artist/[slug]/page.tsx
    - /home/swarn/decibel/src/app/api/dashboard/shows/notify/route.ts
decisions:
  - "Custom links override auto-detected performer column links on public page; fallback preserves backward compat for unclaimed artists"
  - "Reorder uses optimistic UI update + PUT batch — reload on failure"
  - "Platform labels mapped via PLATFORM_LABELS dict shared between API and client"
metrics:
  duration: "10m"
  completed_date: "2026-03-16"
  tasks: 2
  files: 4
---

# Phase 19 Plan 06: Link-in-Bio Management Summary

**One-liner:** Artist link-in-bio CRUD (GET/POST/PUT/DELETE) with Settings tab UI + public page custom link override using platform fallback strategy.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Links CRUD API | b9ec1d1 | src/app/api/dashboard/links/route.ts |
| 2 | Settings tab + public artist page update | afdecbb | dashboard-client.tsx, artist/[slug]/page.tsx |

## What Was Built

### Links CRUD API (`/api/dashboard/links`)
- **GET**: Returns `{ custom_links, auto_links }` — custom from `artist_links` table, auto-detected from performer columns (spotify_url, apple_music_url, soundcloud_url, mixcloud_url, ra_url, instagram_handle)
- **POST**: Validates platform (11 valid values) and URL format (http/https), inserts with auto-incremented `display_order`
- **PUT**: Batch-updates `display_order` for reordering after validating all IDs belong to this artist
- **DELETE**: Validates ownership before delete

### Settings Tab in Dashboard
- Profile section with public URL display, copy-to-clipboard button, preview link
- Link-in-bio list with up/down arrow reorder (optimistic UI), delete button per link
- Add link form: platform dropdown + URL input + Add button with validation
- Auto-detected links section (read-only, grayed, explains fallback behavior)

### Public Artist Page
- Fetches `artist_links` in parallel with other data
- If custom links exist: uses those (via `platformToLink` helper mapping platform -> icon/label)
- If no custom links: falls back to existing performer column behavior (unclaimed artists unaffected)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed duplicate variable name `body` in shows/notify/route.ts**
- **Found during:** Task 1 build verification
- **Issue:** `body` declared at line 17 for request JSON parsing and redeclared at line 117 for notification body string — TypeScript compilation error
- **Fix:** Renamed notification body variable to `notifBody`, updated references
- **Files modified:** src/app/api/dashboard/shows/notify/route.ts
- **Commit:** b9ec1d1

## Self-Check

### Files verified:
- [x] /home/swarn/decibel/src/app/api/dashboard/links/route.ts — FOUND
- [x] /home/swarn/decibel/src/app/dashboard/dashboard-client.tsx — FOUND (SettingsTab at line 543)
- [x] /home/swarn/decibel/src/app/artist/[slug]/page.tsx — FOUND (getArtistLinks + custom link logic)

### Commits verified:
- [x] b9ec1d1 — links CRUD API
- [x] afdecbb — settings tab + artist page

### Build: PASSED (npm run build — clean output, all routes compiled)

## Self-Check: PASSED
