---
phase: 02-add-flow
plan: "02"
subsystem: mobile-add-flow
tags: [url-parsing, clipboard, artist-validation, react-query, jest]
dependency_graph:
  requires: [02-01]
  provides: [paste-to-preview-flow, url-parser-tests, validate-artist-link-hook, artist-preview-card]
  affects: [app/(tabs)/add.tsx]
tech_stack:
  added: [jest, ts-jest, @types/jest]
  patterns: [useMutation, clipboard-paste, platform-aware-display]
key_files:
  created:
    - jest.config.js
    - src/lib/urlParser.test.ts
    - src/hooks/useValidateArtistLink.ts
    - src/components/add/ArtistPreviewCard.tsx
  modified:
    - src/lib/urlParser.ts
    - app/(tabs)/add.tsx
    - package.json
decisions:
  - "ImAtAShowView shown as placeholder with 'Coming soon' badge — check-in flow is Phase 3"
  - "onAdd/onDiscover wired as console.log stubs — actual actions in Plan 02-03"
  - "ArtistPreviewCard photo fallback uses emoji placeholder instead of broken image"
metrics:
  duration: 8
  completed_date: "2026-03-11T00:37:41Z"
  tasks_completed: 3
  files_changed: 7
---

# Phase 02 Plan 02: Client-Side Paste-to-Preview Flow Summary

**One-liner:** Functional paste screen with Apple Music + spotify.link URL parsing, platform-aware ArtistPreviewCard, and 13-passing jest unit tests.

## What Was Built

### Task 0: Jest Test Infrastructure
Installed `jest`, `@types/jest`, and `ts-jest` as dev dependencies. Created `jest.config.js` with ts-jest preset and `@/` path alias support. Created `src/lib/urlParser.test.ts` with 13 test cases covering all URL variants.

### Task 1: URL Parser Updates + Validate Hook
Extended `ParsedArtistUrl` platform union with `apple_music` and `spotify_short`. Added parsing for:
- `music.apple.com` and `itunes.apple.com` — extracts numeric artist ID from path
- `spotify.link` — returns full URL as artistId for backend redirect resolution

All 13 unit tests pass. Created `useValidateArtistLink` hook using `useMutation` from TanStack Query, calling `POST /mobile/validate-artist-link` with exported `ValidateArtistLinkResult` type.

### Task 2: ArtistPreviewCard + Functional add.tsx
`ArtistPreviewCard` handles 4 states:
1. **Eligible + New to Decibel** → gold "★ Add + Found" button
2. **Eligible + Existing, relationship=none** → purple "◉ Discover" button + founder attribution
3. **Eligible + Already collected** → disabled status badge (Founded/Collected/Discovered)
4. **Ineligible** → rejection banner in pink

**Critical platform-aware stats:**
- Spotify / Apple Music: shows `monthly_listeners` as "X listeners" (or "Listeners unverified" if null)
- SoundCloud: shows `follower_count` as "X followers" (never monthly_listeners)

`add.tsx` `AddArtistView` now:
- Taps clipboard via `Clipboard.getStringAsync()` on paste area press
- Manual URL TextInput with submit-on-go
- Loading spinner (`ActivityIndicator`) during validation
- Error banner with retry
- Renders `ArtistPreviewCard` on success with "Search a different artist" reset
- `onAdd`/`onDiscover` stubbed — wired in Plan 02-03

`ImAtAShowView` rendered with 60% opacity and "Coming soon" purple badge.

## Commits

| Hash | Message |
|------|---------|
| bf12153 | test(02-add-flow-02): install jest infrastructure and add urlParser test stubs |
| a7500b0 | feat(02-add-flow-02): update urlParser with Apple Music + spotify.link, create useValidateArtistLink hook |
| d97d92b | feat(02-add-flow-02): build ArtistPreviewCard and wire functional paste screen on + tab |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files verified present:
- jest.config.js: FOUND
- src/lib/urlParser.test.ts: FOUND
- src/hooks/useValidateArtistLink.ts: FOUND
- src/components/add/ArtistPreviewCard.tsx: FOUND
- 13/13 urlParser tests passing
- No TypeScript errors in modified files
