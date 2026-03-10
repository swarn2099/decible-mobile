# Phase 2: Add Flow — Research

**Researched:** 2026-03-10
**Domain:** React Native link-paste UX, Spotify/SoundCloud/Apple Music API resolution, eligibility gating, Decibel backend integration
**Confidence:** HIGH

---

## Summary

Phase 2 wires up the core discovery mechanic: user pastes a streaming link, the backend resolves it to an artist, checks eligibility (under 1M Spotify listeners / 100K SoundCloud followers), checks if the artist is already on Decibel, and either makes the user the Founder or lets them Discover. The + tab shell already exists (mode toggle, placeholder views). The scaffold for almost all pieces is already present — the research reveals that **most of the heavy lifting is already built** in the existing codebase; Phase 2 is primarily about wiring, not building from scratch.

The backend already has a `discover/resolve-link` POST endpoint with Spotify + SoundCloud resolution and an eligibility gate. The mobile app already has `urlParser.ts`, `useAddArtist` hook, and `add-artist` backend route. The gap is (1) a new mobile-facing `validate-artist-link` endpoint that adapts `resolve-link` for the link-paste UX, (2) Apple Music URL support in the client-side parser, (3) the paste screen UI with real-time validation state, and (4) the found/discover confirmation screen.

**Primary recommendation:** Build `validate-artist-link` as a thin wrapper around the existing `resolve-link` logic. Port `urlParser.ts` from v4 with Apple Music added. Build the paste screen and artist preview card as the primary UX surface.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADD-01 | Paste Spotify URL — see name, image, monthly listener count | Spotify API via `getSpotifyArtist()` already returns this; `validate-artist-link` endpoint aggregates it |
| ADD-02 | Paste Apple Music URL — see name and image | Need Apple Music artist ID extraction + MusicKit JS or name-based Spotify cross-reference for eligibility |
| ADD-03 | Paste SoundCloud URL — see name, image, follower count | SoundCloud widget API (`api-widget.soundcloud.com/resolve`) already used in `resolve-link` |
| ADD-04 | Reject unsupported platforms with specific message | `urlParser.ts` platform detection handles this; unsupported = null return |
| ADD-05 | Handle URL variants (no https, www, m., spotify.link short links) | Existing `urlParser.ts` handles `https://`, `http://`, `www.`, `m.`; `spotify.link` requires a redirect-follow step |
| ADD-06 | Reject Spotify artists over 1M monthly listeners | `scrapeMonthlyListeners()` + `followers` from Spotify API; existing `resolve-link` has this gate |
| ADD-07 | Reject SoundCloud artists over 100K followers | `followers_count` from SoundCloud widget API; existing gate uses 1M threshold — must tune to 100K for SoundCloud |
| ADD-08 | Apple Music: cross-reference Spotify; if not found, default eligible | `probeSpotify(name)` function in `resolve-link` does this cross-reference |
| ADD-09 | Artist already on Decibel → show Discover button (or existing status) | `findExistingPerformer()` in `resolve-link` + check `collections` for current user's existing relationship |
| ADD-10 | Artist NOT on Decibel → "Add + Found" → become Founder | `add-artist` route already creates performer + founder_badge; needs confirmation screen |
| ADD-11 | Loading state during validation and fetch | Standard `useMutation` + local loading state in paste screen |
| ADD-12 | Spotify scraper returns null (not 0) on failure | Bug in `scrapeMonthlyListeners()` in `~/decibel/src/lib/spotify.ts` — returns `0`, must return `null` |
| TAB-01 | + tab shows two modes: Add an Artist / I'm at a Show | Already scaffolded in `app/(tabs)/add.tsx` |
| TAB-02 | Add an Artist mode shows paste field with placeholder | Placeholder UI exists; needs to become functional TextInput |
| TAB-03 | I'm at a Show mode initiates check-in flow | Out of Phase 2 scope (Phase 3); stub with "Coming soon" or disabled state |
| NAV-01 | Search bar relocated to Home screen top bar | Home screen already has Search icon button in top bar (`router.push("/search")`) — just verify routing works |
| NAV-02 | Home search queries existing Decibel artists and users only | `useDecibelSearch` + `useUserSearch` already do this; search screen already built |
| NAV-03 | Activity feed shows both Find and Stamp cards | Already implemented in Phase 1 |
</phase_requirements>

---

## What Already Exists (Do NOT Rebuild)

| Piece | Location | Status |
|-------|----------|--------|
| + tab with mode toggle | `app/(tabs)/add.tsx` | Scaffolded, needs wiring |
| URL parser (Spotify + SoundCloud) | `src/lib/urlParser.ts` | Working, missing Apple Music + spotify.link |
| Spotify artist fetch | `~/decibel/src/lib/spotify.ts` — `getSpotifyArtist()` | Working |
| Spotify monthly listener scrape | `~/decibel/src/lib/spotify.ts` — `scrapeMonthlyListeners()` | BUG: returns 0 on failure, must be null |
| SoundCloud widget API resolution | `~/decibel/src/app/api/discover/resolve-link/route.ts` — `resolveSoundCloud()` | Working, `followers_count` field present |
| Eligibility gate logic | `resolve-link/route.ts` (MAX_FOLLOWERS = 1M for all) | Needs separate 100K gate for SoundCloud |
| Find existing performer in DB | `resolve-link/route.ts` — `findExistingPerformer()` | Working (checks spotify_id, soundcloud_url, instagram_handle, name) |
| Add artist + grant founder badge | `~/decibel/src/app/api/mobile/add-artist/route.ts` | Working |
| `useAddArtist` hook | `src/hooks/useAddArtist.ts` | Working, calls `/mobile/add-artist` |
| Home search bar icon → search screen | `app/(tabs)/index.tsx` | Already routed to `/search` |
| Search screen (artists + users) | `app/search.tsx` | Fully built in Phase 1 |
| Activity feed (Find + Stamp cards) | `app/(tabs)/index.tsx` | Fully built in Phase 1 |
| Auth pattern (Bearer token → fan lookup) | All `/mobile/*` routes | Standard pattern established |

---

## What Needs to Be Built

### Backend (Plan 02-01)

**New endpoint: `POST /mobile/validate-artist-link`**

Location: `~/decibel/src/app/api/mobile/validate-artist-link/route.ts`

This is a mobile-facing adaptation of `discover/resolve-link`. Key differences:
- Auth via Bearer token (mobile JWT pattern), NOT Supabase server client
- Returns current user's existing relationship with the artist (founded / collected / discovered / none)
- Enforces separate thresholds: Spotify 1M monthly listeners, SoundCloud 100K followers
- Returns `apple_music_url` field stored on performer (needed for ADD-02)
- Does NOT do Instagram/RA/TikTok/YouTube resolution (not supported in Decibel v1)

**Response shape:**
```typescript
{
  eligible: boolean;
  rejection_reason?: string; // "over_threshold" | "unsupported_platform"
  artist?: {
    name: string;
    photo_url: string | null;
    platform: "spotify" | "soundcloud" | "apple_music";
    spotify_id?: string;
    soundcloud_username?: string;
    apple_music_url?: string;
    monthly_listeners?: number | null; // null = unverified (Spotify failure case)
    follower_count?: number;
    genres: string[];
  };
  existing_performer?: {
    id: string;
    name: string;
    slug: string;
    photo_url: string | null;
    user_relationship: "founded" | "collected" | "discovered" | "none";
    founder_name: string | null;
  };
}
```

**Bug fix required (ADD-12):** In `~/decibel/src/lib/spotify.ts`, `scrapeMonthlyListeners()` returns `0` on failure. Change to return `null`. Update call sites to treat `null` as "unverified" (not over threshold). This is a **critical fix** — `0` silently passes mainstream artists through the eligibility gate.

**Apple Music (ADD-02, ADD-08):**
- No Apple Music developer JWT confirmed yet (see STATE.md blocker)
- Parse `music.apple.com/us/artist/{name}/{id}` URLs to extract the artist name
- Cross-reference by name on Spotify via `probeSpotify()` for eligibility check
- If Spotify cross-reference fails or returns no match: default to eligible (PRD rule)
- Store `apple_music_url` on the performer record

**SoundCloud threshold (ADD-07):**
- SoundCloud widget API returns `followers_count`
- Gate at 100K (not 1M like the existing `resolve-link`)
- SoundCloud client ID in use: `nIjtjiYnjkOhMyh5xrbqEW12DxeJVnic` (hardcoded, no env var currently)

### Client (Plan 02-02)

**1. Update `src/lib/urlParser.ts`** — add Apple Music and `spotify.link` support:

```typescript
// Apple Music: https://music.apple.com/us/artist/{name}/{id}
if (hostname === "music.apple.com") {
  // path: /us/artist/{name}/{id} or /artist/{name}/{id}
  const artistIdx = segments.indexOf("artist");
  if (artistIdx >= 0 && segments[artistIdx + 2]) {
    return { platform: "apple_music", artistId: segments[artistIdx + 2] };
  }
  // id-only path: /us/artist/{id}
  if (artistIdx >= 0 && segments[artistIdx + 1]) {
    return { platform: "apple_music", artistId: segments[artistIdx + 1] };
  }
}

// spotify.link short links — must be resolved via HTTP redirect
if (hostname === "spotify.link") {
  return { platform: "spotify_short", artistId: segments[0] };
}
```

Short `spotify.link` URLs require the backend to follow a redirect to get the real Spotify artist URL.

**2. `useValidateArtistLink` hook** — new hook at `src/hooks/useValidateArtistLink.ts`:
- `useMutation` calling `POST /mobile/validate-artist-link`
- Input: raw pasted URL string
- Output: the response shape above
- States: idle → loading → success (eligible/ineligible) → error

**3. Paste screen** — replace the placeholder in `AddArtistView` in `app/(tabs)/add.tsx`:
- Real `TextInput` or a "tap to paste" Pressable that reads from clipboard via `expo-clipboard`
- On paste/change: debounce 300ms → call `useValidateArtistLink`
- Loading state: spinner inside input area
- Use `Clipboard.getStringAsync()` from `expo-clipboard` (already installed)

**4. `ArtistPreviewCard` component** at `src/components/add/ArtistPreviewCard.tsx`:
- Shows artist photo (large), name, badge/platform, listener/follower count
- States: eligible (shows "Add + Found" or "Discover"), ineligible (shows rejection message + artist info), existing-and-founded/discovered (shows current status)

### Client (Plan 02-03)

**5. `FoundConfirmScreen`** or modal — shown after user taps "Add + Found":
- Calls `useAddArtist` mutation → navigates to artist profile on success
- Haptic (Heavy for Founded, Medium for Discovered) already wired in `useAddArtist`
- Invalidates `passport` and `fanBadges` queries on success

**6. NAV-01 verification** — the Home screen top bar already has the Search icon routing to `/search`. Verify the search screen handles both artists and users (it does). No changes needed unless the icon styling needs adjustment.

---

## Standard Stack

| Library | Version | Purpose |
|---------|---------|---------|
| `expo-clipboard` | ~55.0.8 | Reading pasted URLs from clipboard |
| `@tanstack/react-query` | ^5.90.21 | `useMutation` for validate + add |
| `expo-haptics` | ~55.0.8 | Haptic feedback on found/discover |
| Supabase JS | ^2.99.0 | DB checks in backend route |
| `expo-image` | ~55.0.6 | Artist photo display |

No new libraries needed. All required packages are already installed.

---

## Architecture Patterns

### Backend Route Pattern (established)

```typescript
// Source: ~/decibel/src/app/api/mobile/add-artist/route.ts
async function getAuthEmail(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const { data, error } = await admin.auth.getUser(auth.slice(7));
  if (error || !data.user?.email) return null;
  return data.user.email;
}
// Then: email → fans table lookup → fan_id
```

### Client API Call Pattern (established)

```typescript
// Source: src/lib/api.ts
return apiCall<ValidateArtistLinkResult>("/mobile/validate-artist-link", {
  method: "POST",
  body: JSON.stringify({ url }),
});
```

### Clipboard Paste Pattern

```typescript
// expo-clipboard — already installed
import * as Clipboard from "expo-clipboard";

const text = await Clipboard.getStringAsync();
// Then run through parseArtistUrl(text)
```

### Paste Screen State Machine

```
IDLE → [user pastes] → LOADING → ELIGIBLE (+ Add/Discover buttons)
                                → INELIGIBLE (rejection card)
                                → ERROR (network/parse failure)
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Spotify API auth + token refresh | OAuth flow from scratch | `getAccessToken()` in `~/decibel/src/lib/spotify.ts` |
| SoundCloud follower fetch | Playwright scraper | `api-widget.soundcloud.com/resolve` (already used) |
| Apple Music eligibility | Apple Music API JWT | Name-based Spotify cross-reference via `probeSpotify()` |
| Existing performer lookup | Custom DB query | `findExistingPerformer()` in `resolve-link/route.ts` — extract and reuse |
| Clipboard reading | Native module | `expo-clipboard` (installed) |
| Debounced input | `setTimeout` + `useEffect` | Single 300ms `debounce` or just validate on "paste" tap — not on keystroke |

---

## Common Pitfalls

### Pitfall 1: Spotify Scraper Returns 0 on Failure (ADD-12)
**What goes wrong:** `scrapeMonthlyListeners()` returns `0` when the scrape fails (timeout, bot block, etc.). `0 < 1_000_000` is true, so the artist passes eligibility silently. A mainstream artist with 50M listeners gets added as if underground.
**Fix:** Return `null` on failure. In the validate endpoint, treat `null` as "unverified" — pass through eligible but flag as unverified. Do NOT reject unverified artists.
**Warning sign:** Monthly listener count shows as 0 in the preview card.

### Pitfall 2: SoundCloud Threshold Mismatch
**What goes wrong:** The existing `resolve-link` uses 1M followers as the threshold for all platforms. SoundCloud threshold per PRD is 100K. Forgetting to set platform-specific gates in the new endpoint.
**Fix:** In `validate-artist-link`, gate SoundCloud at `followers_count >= 100_000` and Spotify at `monthly_listeners >= 1_000_000` (if not null).

### Pitfall 3: User Relationship Not Checked
**What goes wrong:** An artist already on Decibel shows "Add + Found" to users who already discovered them. The backend `add-artist` route checks for performer existence but doesn't check the current user's `collections` or `founder_badges` relationship.
**Fix:** In `validate-artist-link`, after finding an existing performer, also query `collections` and `founder_badges` for `(fan_id, performer_id)` to return `user_relationship`.

### Pitfall 4: spotify.link Short Links Not Resolved Client-Side
**What goes wrong:** The URL `https://spotify.link/abc123` can't be parsed client-side to a Spotify artist ID without following a redirect. Client-side `new URL()` gives you `spotify.link` hostname, not the final Spotify ID.
**Fix:** Send the raw URL to the backend; the backend follows the redirect server-side (or use `fetch` with `redirect: "follow"`). The client parser should flag `spotify_short` platform and let the backend handle resolution.

### Pitfall 5: Apple Music URL Variants
**What goes wrong:** `music.apple.com/us/artist/bennett-coast/123` vs `music.apple.com/artist/123` — multiple path structures.
**Fix:** The parser should find the `artist` segment and take the numeric ID after it. Also handle `itunes.apple.com` (legacy) with the same logic.

### Pitfall 6: Double-Tap Add
**What goes wrong:** User taps "Add + Found" twice quickly before the mutation resolves, creating two records.
**Fix:** Disable the button while `useAddArtist.isPending` is true.

### Pitfall 7: Bottom Padding on Add Screen
**What goes wrong:** Content hides behind floating tab bar when artist preview card is rendered.
**Fix:** Already handled (`<View style={{ height: 100 }} />` at bottom of `add.tsx`). Keep it when replacing placeholder with functional content.

---

## Code Examples

### SoundCloud Widget API (verified from resolve-link route)
```typescript
// Source: ~/decibel/src/app/api/discover/resolve-link/route.ts
const SOUNDCLOUD_CLIENT_ID = "nIjtjiYnjkOhMyh5xrbqEW12DxeJVnic";

const apiUrl = `https://api-widget.soundcloud.com/resolve?url=${encodeURIComponent(scUrl)}&format=json&client_id=${SOUNDCLOUD_CLIENT_ID}`;
const res = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });
const data = await res.json();
// data.username, data.avatar_url, data.followers_count, data.permalink_url
```

### Spotify Artist Fetch (verified from spotify.ts)
```typescript
// Source: ~/decibel/src/lib/spotify.ts
export async function getSpotifyArtist(artistId: string): Promise<SpotifyArtistResult | null>
// Returns: { id, name, photo_url, monthly_listeners (null!), genres, spotify_url, followers }
// Note: monthly_listeners is always null from the API — scrapeMonthlyListeners() is needed
```

### scrapeMonthlyListeners Bug Fix (ADD-12)
```typescript
// CURRENT (broken):
async function scrapeMonthlyListeners(artistId: string): Promise<number> {
  try { ... return parseInt(...) || 0; }
  catch { return 0; } // BUG: 0 passes eligibility check
}

// FIXED:
async function scrapeMonthlyListeners(artistId: string): Promise<number | null> {
  try { ... return parseInt(...) || null; }
  catch { return null; } // null = unverified
}
```

### Clipboard Paste Pattern
```typescript
import * as Clipboard from "expo-clipboard";

const handlePaste = async () => {
  const text = await Clipboard.getStringAsync();
  if (text) {
    setPastedUrl(text);
    validateMutation.mutate({ url: text });
  }
};
```

### User Relationship Query Pattern
```typescript
// In validate-artist-link backend
const [collectionsRow, founderRow] = await Promise.all([
  admin.from("collections").select("id").eq("fan_id", fanId).eq("performer_id", performerId).maybeSingle(),
  admin.from("founder_badges").select("fan_id").eq("performer_id", performerId).maybeSingle(),
]);
const isThisUserFounder = founderRow?.fan_id === fanId;
const hasCollected = !!collectionsRow;
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Deezer API for artist search | Eliminated — link paste only | Removes mainstream artist risk |
| Text search for external catalogs | Link paste only | Intentional friction filters real fans |
| `scrapeMonthlyListeners` returns 0 | Must return null (ADD-12) | Fixes silent eligibility bypass |
| `resolve-link` uses 1M threshold for all | `validate-artist-link` uses platform-specific thresholds | Correct gates per PRD |

---

## Open Questions

1. **Apple Music developer JWT**
   - What we know: Apple Music API requires a signed JWT from a developer account. PRD fallback: if Apple Music artist not found on Spotify, default to eligible.
   - What's unclear: Whether the JWT is provisioned. STATE.md flags this as a blocker.
   - Recommendation: Build Apple Music URL parsing (client) + name-based Spotify cross-reference (backend) now. The JWT path is a future enhancement. Default-eligible fallback covers the gap.

2. **spotify.link redirect resolution**
   - What we know: These are Spotify short links that redirect to `open.spotify.com/artist/{id}`.
   - What's unclear: Whether `fetch` with `redirect: "follow"` from the Next.js backend will work or if Spotify blocks server-side redirect following.
   - Recommendation: Try `fetch(url, { redirect: "follow" })` in the backend. If blocked, parse the redirect URL from a 301/302 Location header manually.

3. **SoundCloud client ID stability**
   - What we know: `nIjtjiYnjkOhMyh5xrbqEW12DxeJVnic` is hardcoded in the backend (not an env var). This is the widget API client ID used by the web player.
   - What's unclear: How stable this ID is long-term (it's semi-public but not official).
   - Recommendation: Move to `SOUNDCLOUD_CLIENT_ID` env var for production hygiene. The existing hardcoded value works today.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no jest.config, no vitest.config, no test/ directory in decibel-mobile |
| Config file | None — Wave 0 gap |
| Quick run command | n/a until framework installed |
| Full suite command | n/a |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADD-04 | `parseArtistUrl()` rejects unsupported platforms | unit | `jest src/lib/urlParser.test.ts` | ❌ Wave 0 |
| ADD-05 | `parseArtistUrl()` handles URL variants | unit | `jest src/lib/urlParser.test.ts` | ❌ Wave 0 |
| ADD-06 | Eligibility gate rejects >1M Spotify listeners | manual | curl validate-artist-link with known mainstream artist | n/a |
| ADD-07 | Eligibility gate rejects >100K SoundCloud followers | manual | curl validate-artist-link with known mainstream SC artist | n/a |
| ADD-09 | Existing performer → returns user_relationship | manual | curl with existing artist slug | n/a |
| ADD-12 | scrapeMonthlyListeners returns null on failure | unit | backend jest (separate project) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Manual curl test of `validate-artist-link` endpoint
- **Per wave merge:** Manual E2E on device — paste a Spotify URL, verify card renders correctly
- **Phase gate:** All 5 success criteria manually verified before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/urlParser.test.ts` — covers ADD-04, ADD-05 URL parsing edge cases
- [ ] Framework: `npm install --save-dev jest @types/jest ts-jest` if unit tests are desired

*(Note: The decibel-mobile project has no test infrastructure. Given the primarily UI/integration nature of this phase, manual E2E testing on device is the practical validation path. URL parser unit tests are the one high-value automated opportunity.)*

---

## Sources

### Primary (HIGH confidence)
- Direct code reading: `~/decibel/src/app/api/discover/resolve-link/route.ts` — full resolve logic, SoundCloud API, eligibility gate, `findExistingPerformer`
- Direct code reading: `~/decibel/src/lib/spotify.ts` — `getSpotifyArtist`, `scrapeMonthlyListeners` (bug confirmed at line 125-130)
- Direct code reading: `~/decibel/src/app/api/mobile/add-artist/route.ts` — add performer + founder badge flow
- Direct code reading: `~/decibel-mobile/src/lib/urlParser.ts` — current URL parser (missing Apple Music)
- Direct code reading: `~/decibel-mobile/src/hooks/useAddArtist.ts` — existing mutation hook
- Direct code reading: `~/decibel-mobile/app/(tabs)/add.tsx` — existing + tab scaffold
- Direct code reading: `~/decibel-mobile/app/(tabs)/index.tsx` — Home screen with search icon already wired to `/search`
- Direct code reading: `~/decibel-mobile/app/search.tsx` — search screen (artists + users, fully built)
- Direct code reading: `~/decibel-mobile/package.json` — confirmed expo-clipboard installed

### Secondary (MEDIUM confidence)
- SoundCloud widget API endpoint pattern: verified from live backend code. Client ID stability is not guaranteed long-term.
- Apple Music URL structure: inferred from standard App Store URL patterns. No official API documentation consulted.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed in package.json, all patterns verified from live code
- Architecture: HIGH — existing patterns directly readable from codebase
- Pitfalls: HIGH — ADD-12 bug confirmed by reading spotify.ts line 125-130; threshold mismatch confirmed by comparing PRD vs resolve-link code
- Apple Music handling: MEDIUM — fallback strategy is clear from PRD, implementation details for URL parsing inferred

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (SoundCloud widget API client ID could rotate; Spotify scraping could break on HTML changes)
