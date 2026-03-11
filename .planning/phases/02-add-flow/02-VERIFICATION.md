---
phase: 02-add-flow
verified: 2026-03-11T01:30:00Z
status: passed
score: 17/17 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Paste a Spotify URL on + tab, see artist card, tap Add + Found"
    expected: "Artist preview card renders with photo, name, listener count. Tapping 'Add + Found' calls the backend, shows haptic feedback, navigates to /artist/{slug}"
    why_human: "Full clipboard-to-navigation flow requires physical device / Expo Go; navigation to artist profile requires artist slug to exist in DB"
  - test: "Paste a SoundCloud URL and verify the card shows 'X followers' not 'X listeners'"
    expected: "Follower count displayed as 'X followers' (not monthly_listeners), orange SoundCloud badge visible"
    why_human: "Platform-aware stat display requires live API response with follower_count field; only verifiable on device"
  - test: "Paste a mainstream artist URL (Drake Spotify ID: 3TVXtAsR1Inumwj472S9r4)"
    expected: "Card renders with rejection banner: 'This artist has over 1M monthly listeners and can't be added to Decibel.' No Add+Found button visible"
    why_human: "Requires live scrapeMonthlyListeners response; Spotify scraper may be blocked in dev mode per 02-01 SUMMARY issue"
  - test: "Toggle between 'Add an Artist' and 'I'm at a Show' on + tab"
    expected: "'I'm at a Show' renders at 0.6 opacity with 'Coming soon' purple badge; toggle switch highlights active mode in pink"
    why_human: "Visual rendering and opacity require device"
---

# Phase 2: Add Flow Verification Report

**Phase Goal:** Users can discover and claim underground artists by pasting a streaming link
**Verified:** 2026-03-11T01:30:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | POST /mobile/validate-artist-link with Spotify URL returns artist name, photo, monthly_listeners | VERIFIED | `/home/swarn/decibel/src/app/api/mobile/validate-artist-link/route.ts` lines 309–396: full Spotify resolution branch returns artist.name, photo_url, monthly_listeners |
| 2 | POST /mobile/validate-artist-link with SoundCloud URL returns artist name, photo, follower_count | VERIFIED | route.ts lines 400–484: SoundCloud branch calls widget API, returns follower_count field |
| 3 | POST /mobile/validate-artist-link with Apple Music URL returns artist name and photo, cross-references Spotify for eligibility | VERIFIED | route.ts lines 487–571: Apple Music branch calls probeSpotifyByName(), gates on monthly_listeners >= 1M, defaults eligible |
| 4 | Artists over 1M Spotify monthly listeners are rejected with eligible=false | VERIFIED | route.ts line 335: `if (monthlyListeners !== null && monthlyListeners >= 1_000_000)` returns `eligible: false, rejection_reason: "over_threshold"` |
| 5 | Artists over 100K SoundCloud followers are rejected with eligible=false | VERIFIED | route.ts line 423: `if (followerCount >= 100_000)` returns `eligible: false, rejection_reason: "over_threshold"` |
| 6 | Artists already on Decibel return existing_performer with user_relationship | VERIFIED | route.ts: `findExistingPerformer()` + `getUserRelationship()` pattern used in all three platform branches; returns `founded/collected/discovered/none` |
| 7 | scrapeMonthlyListeners returns null (not 0) on failure; null treated as unverified | VERIFIED | spotify.ts line 116: return type `Promise<number \| null>`; catch block returns `null`; parseInt fallback `|| null`; route.ts gate skips on null |
| 8 | User can paste a Spotify/Apple Music/SoundCloud URL into + tab and see a loading state | VERIFIED | add.tsx lines 119–148: `ActivityIndicator` renders inside paste area when `validateMutation.isPending` |
| 9 | Pasting an unsupported URL shows rejection message | VERIFIED | ArtistPreviewCard.tsx lines 199–207: `rejectionBanner` renders when `!result.eligible`; message text "This artist has over 1M monthly listeners..." for over_threshold; route.ts returns `unsupported_platform` for unrecognized URLs |
| 10 | URL variants (no https, www, m. subdomain, spotify.link, itunes.apple.com) are accepted | VERIFIED | urlParser.ts lines 30–34: adds https:// prefix; line 39: strips www/m subdomains; line 44–47: spotify.link platform; line 50–60: itunes.apple.com; all 13 unit tests pass |
| 11 | Artist preview card shows name, photo, and listener/follower count after validation | VERIFIED | ArtistPreviewCard.tsx: renders artist photo (expo-image), name (line 177), platform-aware stats line 73–77: SoundCloud→formatFollowers, else→formatListeners |
| 12 | SoundCloud artists display follower_count as 'X followers' (not monthly_listeners) | VERIFIED | ArtistPreviewCard.tsx line 75–77: `artist.platform === "soundcloud" ? formatFollowers(artist.follower_count) : formatListeners(artist.monthly_listeners)` |
| 13 | + tab toggle switches between Add an Artist and I'm at a Show modes | VERIFIED | add.tsx lines 305–357: two `TouchableOpacity` toggle buttons setting `mode` state; `mode === "artist" ? <AddArtistView /> : <ImAtAShowView />` line 360 |
| 14 | User who taps Add+Found becomes Founder and is navigated to artist profile | VERIFIED | add.tsx handleAdd (lines 55–79): calls `addMutation.mutate()` with platform-aware input, `onSuccess: router.push('/artist/' + result.performer.slug)` |
| 15 | User who taps Discover creates discovered relationship and is navigated to artist profile | VERIFIED | add.tsx handleDiscover (lines 81–95): calls `discoverMutation.mutate({ performerId: existing.id })`, `onSuccess: router.push('/artist/' + slug)`; discover endpoint inserts `capture_method: "online"` into collections |
| 16 | Home search icon navigates to search screen (Decibel artists and users only) | VERIFIED | index.tsx line 84: `onPress={() => router.push("/search")}` on 40x40 Search icon; search.tsx uses `useDecibelSearch` (Supabase ILIKE on performers table) + `useUserSearch`; `useSpotifySearch` exists but is NOT used in search.tsx |
| 17 | Activity feed shows both Find cards and Stamp cards with correct accent colors | VERIFIED | ActivityFeedCard.tsx lines 9–16: `ACTION_CONFIG` maps founded→gold, collected→pink, discovered→purple; all three action types rendered through single card component |

**Score: 17/17 truths verified**

---

## Required Artifacts

### Backend (~/decibel/)

| Artifact | Status | Details |
|----------|--------|---------|
| `src/app/api/mobile/validate-artist-link/route.ts` | VERIFIED | 576 lines, substantive; all three platform branches + auth + eligibility gating + user relationship |
| `src/lib/spotify.ts` | VERIFIED | `scrapeMonthlyListeners` return type `Promise<number \| null>`, catch returns `null`, parseInt fallback `\|\| null`; exported |
| `src/app/api/mobile/discover/route.ts` | VERIFIED | 131 lines; authenticates, verifies performer, guards duplicate relationships, inserts `collections` row with `capture_method: "online"`, upserts `fan_tiers` |
| `src/app/api/mobile/add-artist/route.ts` | VERIFIED | Handles `spotify`, `soundcloud`, `apple_music` platforms; stores `spotify_id`, `soundcloud_url`, `apple_music_url` per platform |

### Mobile (~/decibel-mobile/)

| Artifact | Status | Details |
|----------|--------|---------|
| `src/lib/urlParser.ts` | VERIFIED | Handles `spotify`, `spotify_short`, `soundcloud`, `apple_music`, `instagram`, `mixcloud`; supports www/m subdomains; adds https prefix for bare URLs |
| `src/lib/urlParser.test.ts` | VERIFIED | 13 tests; all 13 passing (confirmed via `npx jest`) |
| `src/hooks/useValidateArtistLink.ts` | VERIFIED | `useMutation` wrapping `apiCall POST /mobile/validate-artist-link`; exports `ValidateArtistLinkResult` type |
| `src/components/add/ArtistPreviewCard.tsx` | VERIFIED | 319 lines; renders all 4 states (eligible+new, eligible+existing/none, already-has-relationship, ineligible); platform-aware stats; theme colors from `useThemeColors()` |
| `src/hooks/useAddArtist.ts` | VERIFIED | `AddArtistInput` accepts `spotifyId?`, `soundcloudUsername?`, `appleMusicUrl?`, and required `platform`; haptic feedback Heavy (founder) / Medium (not founder) |
| `src/hooks/useDiscoverArtist.ts` | VERIFIED | `useMutation` calling `POST /mobile/discover`; haptic feedback Medium; invalidates `passport` and `fanBadges` queries |
| `app/(tabs)/add.tsx` | VERIFIED | Clipboard paste, TextInput manual entry, loading/error/success states, `<ArtistPreviewCard>` wired with real `handleAdd`/`handleDiscover`, both mutations passed as `isLoading` guard |
| `app/(tabs)/index.tsx` | VERIFIED | Search icon `Pressable` with `router.push("/search")`, 40x40 circle, prominent in top bar |
| `app/search.tsx` | VERIFIED | Uses `useDecibelSearch` (Supabase) + `useUserSearch`; NO external catalog search used |
| `src/components/home/ActivityFeedCard.tsx` | VERIFIED | `ACTION_CONFIG` maps all three action types to correct accent colors |
| `jest.config.js` | VERIFIED | ts-jest preset, node environment, `@/` path alias |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `validate-artist-link/route.ts` | `spotify.ts` | `import { getSpotifyArtist, scrapeMonthlyListeners }` | WIRED | route.ts line 3: exact import confirmed |
| `validate-artist-link/route.ts` | Supabase | `admin.from(...)` | WIRED | Multiple `admin.from("performers")`, `admin.from("collections")`, `admin.from("founder_badges")` calls |
| `add.tsx` | `useValidateArtistLink` | hook invocation | WIRED | add.tsx line 28: `const validateMutation = useValidateArtistLink()` |
| `useValidateArtistLink.ts` | `/mobile/validate-artist-link` | `apiCall POST` | WIRED | hook.ts line 35: `apiCall<ValidateArtistLinkResult>("/mobile/validate-artist-link", { method: "POST", ... })` |
| `add.tsx` | `ArtistPreviewCard` | `<ArtistPreviewCard ...>` render | WIRED | add.tsx line 200: `<ArtistPreviewCard result={...} onAdd={handleAdd} onDiscover={handleDiscover} isLoading={...} />` |
| `ArtistPreviewCard.tsx` | `artist.platform` | SoundCloud conditional for follower_count vs monthly_listeners | WIRED | ArtistPreviewCard.tsx line 75: `artist.platform === "soundcloud" ? formatFollowers(...) : formatListeners(...)` |
| `add.tsx` | `useAddArtist` | `handleAdd` mutation | WIRED | add.tsx line 29: `const addMutation = useAddArtist()`; line 59: `addMutation.mutate({...})` |
| `add.tsx` | `useDiscoverArtist` | `handleDiscover` mutation | WIRED | add.tsx line 30: `const discoverMutation = useDiscoverArtist()`; line 85: `discoverMutation.mutate({ performerId: existing.id })` |
| `add.tsx` | `router.push('/artist/')` | post-add/discover navigation | WIRED | add.tsx line 73: `router.push('/artist/' + result.performer.slug)`; line 89: same pattern |
| `index.tsx` | `app/search.tsx` | search icon `router.push("/search")` | WIRED | index.tsx line 84 |
| `useAddArtist.ts` | `/mobile/add-artist` | `apiCall POST` | WIRED | useAddArtist.ts line 33: `apiCall<AddArtistResult>("/mobile/add-artist", {...})` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ADD-01 | 02-01 | Paste Spotify URL → artist name, image, monthly listeners | SATISFIED | validate-artist-link Spotify branch; ArtistPreviewCard formatListeners |
| ADD-02 | 02-01 | Paste Apple Music URL → artist name, image | SATISFIED | validate-artist-link Apple Music branch; probeSpotifyByName for photo |
| ADD-03 | 02-01 | Paste SoundCloud URL → artist name, image, follower count | SATISFIED | validate-artist-link SoundCloud branch returns follower_count |
| ADD-04 | 02-02 | Rejects unsupported platform URLs | SATISFIED | route.ts parseUrl returns null → unsupported_platform; ArtistPreviewCard rejectionBanner |
| ADD-05 | 02-02 | Handles URL variants (no https, www, m., short links) | SATISFIED | urlParser.ts; all 13 unit tests pass confirming edge cases |
| ADD-06 | 02-01 | Rejects Spotify artists over 1M monthly listeners | SATISFIED | route.ts line 335 gate; `over_threshold` rejection |
| ADD-07 | 02-01 | Rejects SoundCloud artists over 100K followers | SATISFIED | route.ts line 423 gate; `over_threshold` rejection |
| ADD-08 | 02-01 | Apple Music cross-reference Spotify; default eligible if not found | SATISFIED | probeSpotifyByName(); null → eligible per PRD rule |
| ADD-09 | 02-01 | Existing artist shows Discover button (or existing status) | SATISFIED | ArtistPreviewCard renderActionButton: relationship cases founded/collected/discovered/none |
| ADD-10 | 02-03 | New artist → Add+Found → becomes Founder | SATISFIED | handleAdd calls useAddArtist; backend add-artist creates performer + founder_badge |
| ADD-11 | 02-02 | Loading state during link validation | SATISFIED | add.tsx ActivityIndicator inside paste area while `validateMutation.isPending` |
| ADD-12 | 02-01 | scrapeMonthlyListeners returns null (not 0) on failure | SATISFIED | spotify.ts return type `Promise<number \| null>`; all failure paths return null |
| TAB-01 | 02-02 | + tab shows two modes: Add an Artist / I'm at a Show | SATISFIED | add.tsx toggle with two TouchableOpacity buttons and `<AddArtistView>` / `<ImAtAShowView>` conditional |
| TAB-02 | 02-02 | Add an Artist mode shows paste field with platform placeholder text | SATISFIED | add.tsx pasteArea shows "Spotify · Apple Music · SoundCloud" subtext |
| NAV-01 | 02-03 | Search bar on Home screen top bar | SATISFIED | index.tsx 40x40 Search Pressable with `router.push("/search")` |
| NAV-02 | 02-03 | Home search queries Decibel artists and users only | SATISFIED | search.tsx uses useDecibelSearch (Supabase ILIKE) + useUserSearch; useSpotifySearch NOT used |
| NAV-03 | 02-03 | Activity feed shows Find + Stamp cards with correct accents | SATISFIED | ActivityFeedCard ACTION_CONFIG: founded→gold, collected→pink, discovered→purple |

**All 17 requirements satisfied. TAB-03 (check-in flow) explicitly deferred to Phase 3 — not a gap for this phase.**

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/(tabs)/add.tsx` | 103 | `onAdd`/`onDiscover` were stubs in 02-02, replaced in 02-03 — confirmed real handlers in final code | None | Correctly resolved |
| `app/(tabs)/index.tsx` | 103 | Map icon `Pressable onPress={() => {}}` — no-op handler | Info | Map/events feature not in phase scope; placeholder is intentional |

No blocker anti-patterns found. No TODO/FIXME/placeholder comments in phase deliverables. No hardcoded colors found in modified components (all use `useThemeColors()`).

---

## Human Verification Required

### 1. End-to-End Add Flow (Spotify)

**Test:** On a device running the preview build, paste `https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb` on the + tab
**Expected:** Preview card renders with artist photo, name, monthly listener count (or "Listeners unverified" if scraper blocked), Spotify green badge, and "★ Add + Found" gold button
**Why human:** Clipboard read, live Spotify API call, and navigation to artist profile require device

### 2. SoundCloud Platform-Aware Display

**Test:** Paste a SoundCloud artist URL (e.g., `https://soundcloud.com/flume`) on the + tab
**Expected:** Card shows "X followers" (not "X listeners"), orange SoundCloud badge
**Why human:** Requires live SoundCloud widget API response with `followers_count` field

### 3. Eligibility Rejection Rendering

**Test:** Paste Drake's Spotify URL (`https://open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4`)
**Expected:** Rejection banner with "This artist has over 1M monthly listeners and can't be added to Decibel." No Add+Found button
**Why human:** scrapeMonthlyListeners may be blocked in Spotify dev mode (noted in 02-01 SUMMARY); needs live verification

### 4. Mode Toggle Visual

**Test:** Tap between "Add an Artist" and "I'm at a Show" on + tab
**Expected:** Active mode highlighted in pink; I'm at a Show view at 60% opacity with "Coming soon" purple badge
**Why human:** Visual opacity and toggle highlight require device render

---

## Gaps Summary

No gaps. All 17 requirements (ADD-01 through ADD-12, TAB-01, TAB-02, NAV-01, NAV-02, NAV-03) are satisfied by substantive, wired implementations.

The one noted issue — Spotify scraper potentially blocked in dev mode (Spotify app Development Mode restricts catalog) — is a pre-existing infrastructure constraint documented in the 02-01 SUMMARY, not a code gap. The null-safety fix (ADD-12) correctly handles this case by treating null as "unverified/underground" rather than rejecting.

EAS preview deployment confirmed: Update group `fe92162f-e38e-4a1e-ad64-dcf8ad1e7eac`, both iOS and Android platforms.

---

_Verified: 2026-03-11T01:30:00Z_
_Verifier: Claude (gsd-verifier)_
