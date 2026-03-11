---
phase: 02-add-flow
plan: "03"
subsystem: add-flow
tags: [mutations, navigation, multi-platform, discover, deploy]
dependency_graph:
  requires: [02-02]
  provides: [add-flow-complete, discover-endpoint, multi-platform-add]
  affects: [passport-tab, activity-feed, artist-profile]
tech_stack:
  added: [react-native-worklets, react-native-nitro-modules, expo-updates]
  patterns: [platform-aware-mutation, invalidate-on-success, router-push-after-mutation]
key_files:
  created:
    - src/hooks/useDiscoverArtist.ts
    - ~/decibel/src/app/api/mobile/discover/route.ts
  modified:
    - src/hooks/useAddArtist.ts
    - app/(tabs)/add.tsx
    - ~/decibel/src/app/api/mobile/add-artist/route.ts
    - app.json
decisions:
  - "Remove expo-linking and expo-haptics from app.json plugins — neither has app.plugin.js, EAS config plugin resolution was throwing on them"
  - "Patch app.json slug from 'decibel' to 'decibel-mobile' to match EAS project registry"
  - "Install expo-updates, react-native-worklets, babel-preset-expo, react-native-nitro-modules as missing bundler deps"
metrics:
  duration_minutes: 45
  completed_date: "2026-03-11"
  tasks_completed: 3
  files_changed: 8
---

# Phase 02 Plan 03: Wire Add Flow Actions + Deploy — Summary

Complete end-to-end Add Flow: useAddArtist updated for multi-platform (Spotify/SoundCloud/Apple Music), useDiscoverArtist hook created, both actions wired to real mutations in add.tsx with post-success navigation, and discover backend endpoint deployed. NAV requirements verified, EAS deploy config fixed, app published to preview.

## What Was Built

### Task 1: Multi-platform useAddArtist + backend discover endpoint

`src/hooks/useAddArtist.ts` updated — `AddArtistInput` now accepts `spotifyId?`, `soundcloudUsername?`, `appleMusicUrl?`, and `platform: "spotify" | "soundcloud" | "apple_music"`. The mutation sends the full platform-aware payload to `/mobile/add-artist`.

Backend `add-artist` route updated to handle all three platforms:
- Spotify: existing behavior (uses `spotifyId`, stores `spotify_url`)
- SoundCloud: lookup/insert by `soundcloud_url` constructed from `soundcloudUsername`
- Apple Music: lookup/insert by `apple_music_url`
- No longer requires `spotifyId` — requires `name` + one platform identifier

New `discover` endpoint created at `POST /mobile/discover`:
- Authenticates via Bearer token
- Verifies performer exists
- Guards against duplicate relationships (checks both `collections` and `founder_badges`)
- Inserts `collections` row with `capture_method: "online"`
- Upserts `fan_tiers` for tier tracking
- Returns `{ success, performer: { id, name, slug } }`

Both backend changes deployed via git push (auto-deploy to Vercel).

### Task 2: Wire onAdd and onDiscover in add.tsx

`src/hooks/useDiscoverArtist.ts` created — calls `POST /mobile/discover` with `performerId`, fires `Haptics.ImpactFeedbackStyle.Medium` on success, invalidates `passport` and `fanBadges` queries.

`app/(tabs)/add.tsx` wired with real handlers:
- `handleAdd`: extracts `artist` from `validateMutation.data`, calls `addMutation.mutate()` with platform-aware input, navigates to `/artist/{slug}` on success
- `handleDiscover`: extracts `existing_performer.id` from `validateMutation.data`, calls `discoverMutation.mutate({ performerId })`, navigates to `/artist/{slug}` on success
- `isLoading={addMutation.isPending || discoverMutation.isPending}` passed to `ArtistPreviewCard` — prevents double-taps
- `handleReset` also resets addMutation and discoverMutation

Existing relationship state rendering confirmed working via `ArtistPreviewCard` — when `user_relationship` is "founded"/"collected"/"discovered", shows disabled status button (no action available).

### Task 3: NAV-01/02/03 verification + EAS deploy

**NAV-01** (Home search icon): Confirmed — `Pressable` with `router.push("/search")` in `index.tsx` header, 40x40px circle button, prominent.

**NAV-02** (Search queries Decibel only): Confirmed — `useDecibelSearch` hits Supabase `performers` table with ILIKE, `useUserSearch` hits `/mobile/search-users`. `useSpotifySearch` exists but is NOT used in `search.tsx`.

**NAV-03** (Activity feed shows Find + Stamp cards): Confirmed — `ACTION_CONFIG` in `ActivityFeedCard.tsx` maps: `founded` → gold, `discovered` → purple, `collected` → pink. Both find and stamp card types render.

**EAS deploy fixes:**
- Removed `expo-linking` and `expo-haptics` from `app.json` plugins (no `app.plugin.js` in either package)
- Changed `app.json` slug from `"decibel"` to `"decibel-mobile"` to match EAS project registry
- Installed missing bundler dependencies: `expo-updates`, `react-native-worklets`, `babel-preset-expo`, `react-native-nitro-modules`
- Deployed successfully to EAS preview: Update group `fe92162f-e38e-4a1e-ad64-dcf8ad1e7eac`

## Commits

| Hash | Message |
|------|---------|
| 947ce04 | feat(02-03): update useAddArtist for multi-platform support |
| 37591f3 | feat(02-03): wire Add+Found and Discover actions with navigation |
| b286bab | feat(02-03): verify NAV-01/02/03 and fix EAS deploy configuration |
| 94ec414 | feat(api): support SoundCloud/Apple Music in add-artist + add discover endpoint (backend) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] EAS deploy failing due to invalid app.json plugins**
- **Found during:** Task 3
- **Issue:** `expo-linking` and `expo-haptics` listed in `app.json` plugins array but neither has `app.plugin.js`. EAS config plugin resolution failed with "Unable to resolve a valid config plugin".
- **Fix:** Removed both from the plugins array. `expo-haptics` requires no config plugin (pure JS). `expo-linking` handles deep links via `scheme` field.
- **Files modified:** `app.json`

**2. [Rule 3 - Blocking] app.json slug mismatch with EAS project**
- **Found during:** Task 3
- **Issue:** `"slug": "decibel"` but EAS project registry has slug `decibel-mobile`. EAS update refused to run.
- **Fix:** Updated slug to `"decibel-mobile"`.
- **Files modified:** `app.json`

**3. [Rule 3 - Blocking] Missing bundler dependencies for EAS export**
- **Found during:** Task 3
- **Issue:** `expo-updates` (required for OTA), `react-native-worklets` (required by reanimated plugin), `babel-preset-expo` (required by Metro), and `react-native-nitro-modules` (required by react-native-mmkv v3) were not installed.
- **Fix:** Installed all four with `--legacy-peer-deps` (existing react-dom peer conflict).
- **Files modified:** `package.json`, `package-lock.json`

## Self-Check: PASSED

Files verified present:
- src/hooks/useAddArtist.ts: FOUND (contains soundcloudUsername)
- src/hooks/useDiscoverArtist.ts: FOUND
- ~/decibel/src/app/api/mobile/discover/route.ts: FOUND
- app/(tabs)/add.tsx: FOUND (contains useDiscoverArtist + router.push)

Commits verified:
- 947ce04 (update useAddArtist): FOUND
- 37591f3 (wire add/discover + navigation): FOUND
- b286bab (NAV verification + EAS fixes): FOUND
- 94ec414 (backend — add-artist multi-platform + discover endpoint): FOUND

EAS deploy verified:
- Update group ID: fe92162f-e38e-4a1e-ad64-dcf8ad1e7eac
- Branch: preview
- Runtime version: 1.0.0
- Platforms: android, ios
