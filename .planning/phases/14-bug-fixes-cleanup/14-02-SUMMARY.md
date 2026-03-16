---
phase: 14-bug-fixes-cleanup
plan: "02"
subsystem: add-flow / url-parser / backend-validation
tags: [url-parsing, apple-music, spotify, soundcloud, song-url, backend, mobile]
dependency_graph:
  requires: []
  provides: [song-url-support, apple-music-regional, found-via-track]
  affects: [add-flow, validate-artist-link-api]
tech_stack:
  added: []
  patterns: [TDD red-green, URL regex parsing, iTunes Lookup API, Spotify Web API tracks/albums]
key_files:
  created: []
  modified:
    - src/lib/urlParser.ts
    - src/lib/urlParser.test.ts
    - src/hooks/useValidateArtistLink.ts
    - src/components/add/ArtistPreviewCard.tsx
    - /home/swarn/decibel/src/app/api/mobile/validate-artist-link/route.ts
    - /home/swarn/decibel/src/lib/spotify.ts
decisions:
  - "Use contentType field on ParsedArtistUrl to distinguish artist/track/album/song without breaking existing callers"
  - "For Apple Music album/song identifiers, use apple_album: prefix in identifier field to signal resolution path"
  - "SoundCloud track API response has kind=track and user field — extract artist from user, not top-level"
  - "getSpotifyTrack/getSpotifyAlbum added to spotify lib to resolve content IDs to artist IDs"
metrics:
  duration: "~25 minutes"
  completed: "2026-03-16"
  tasks_completed: 2
  files_changed: 6
---

# Phase 14 Plan 02: Song/Album URL Support & Apple Music Regional Fix Summary

Added song/album URL support across Spotify, Apple Music, and SoundCloud. Users can now paste any link type (artist, song, or album) and the app correctly identifies the artist. Apple Music regional URL variants (/gb/, /jp/, /fr/, /de/, /au/) were already partially working but now fully tested and confirmed.

## What Was Built

### Task 1: Extend URL Parser + Backend

**Mobile urlParser.ts:**
- Extended `ParsedArtistUrl` type with `contentType?: "artist" | "track" | "album" | "song"` and `contentId?: string`
- Spotify: now matches `/track/{id}` and `/album/{id}` in addition to `/artist/{id}`
- Apple Music: now matches `/album/{name}/{id}` paths; detects `?i=` param to distinguish songs vs plain albums; extracts track ID as `contentId`
- SoundCloud: 2-segment paths (`username/track-slug`) now parsed as `contentType: "track"` with `artistId` set to username

**Backend validate-artist-link/route.ts:**
- `ParsedUrl` extended with `contentType` and `contentId` fields
- Spotify tracks: resolved via `GET /tracks/{id}` → `artists[0].id` before eligibility check
- Spotify albums: resolved via `GET /albums/{id}` → `artists[0].id` before eligibility check
- Apple Music songs: resolved via iTunes Lookup API by track ID → `trackName` + `artistName`
- Apple Music albums: resolved via iTunes Lookup API by album ID → `artistName`
- SoundCloud tracks: `kind=track` response → artist extracted from `user` field
- `found_via_track` field added to `ValidateResponse` — set when input was a song/track URL

**spotify.ts:**
- Added `getSpotifyTrack(trackId)` — fetches `/v1/tracks/{id}`, returns name + artists array
- Added `getSpotifyAlbum(albumId)` — fetches `/v1/albums/{id}`, returns name + artists array

**Deployed to production via Vercel.**

### Task 2: Wire "Found via [Track Name]" on Confirmation Card

- `found_via_track?: string` added to `ValidateArtistLinkResult` type
- `ArtistPreviewCard` now shows `♪ Found via "Track Name"` in italic below stats text when `found_via_track` is present
- Styled as subtle informational note using `colors.textSecondary`, fontSize 12, Poppins italic

## Verification

1. `npx jest src/lib/urlParser.test.ts` — 29 tests pass
2. `npx tsc --noEmit` — clean (both mobile and backend)
3. Backend deployed to `https://www.decible.live`

## Deviations from Plan

### Auto-added Missing Functions

**1. [Rule 2 - Missing Functionality] Added getSpotifyTrack and getSpotifyAlbum to spotify lib**
- **Found during:** Task 1 backend implementation
- **Issue:** Backend route's dynamic import of `getSpotifyTrack`/`getSpotifyAlbum` would fail at runtime — functions didn't exist in the spotify lib
- **Fix:** Added both functions following the same pattern as `getSpotifyArtist`, with token retry logic
- **Files modified:** `/home/swarn/decibel/src/lib/spotify.ts`

## Commits

- `3d82cbe` — test(14-02): add failing tests for song/album URL parsing across all platforms
- `99015cb` — feat(14-02): extend validate-artist-link to handle song/album URLs and found_via_track (backend)
- `21e0824` — feat(14-02): add found_via_track field and show it on ArtistPreviewCard

## Self-Check: PASSED

All key files exist. All commits verified in git log.
