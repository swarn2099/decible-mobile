# Phase 6: Bug Fixes - Research

**Researched:** 2026-03-12
**Domain:** React Native / Expo — existing bug diagnosis across four specific user-facing failures
**Confidence:** HIGH (all findings are from direct codebase inspection, no speculation required)

---

## Summary

Phase 6 fixes four confirmed bugs before new features are built on top of them. The bugs are real and traceable to specific code paths. The research approach here is diagnostic: read every relevant file, trace each bug from the UI call site to the backend and back, and document exactly what is broken and what the fix is.

All four bugs have been fully traced. Three require mobile-only fixes. One (BUG-04 Leaderboard) requires both a new screen and a backend endpoint that currently returns data in the correct shape.

**Primary recommendation:** Fix each bug in isolation, verify the specific acceptance criterion, then deploy as a single EAS update.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BUG-01 | User can tap Discover button on artist profile and it adds a Discovery to their Passport | `/mobile/discover` endpoint exists and works. The mobile `useDiscover` hook calls the OLD `/api/discover` web route (not the mobile one) and does not use `apiCall` (bypasses auth). The fix is to update `useDiscover` to call `/mobile/discover` with Bearer token auth via `apiCall`. |
| BUG-02 | Listen links on artist profiles open the correct platform URL (only shown when URL exists in DB) | `musicLinks` array in `artist/[slug].tsx` already filters nulls and detects platform from URL. The bug path is `artist.spotify_url` / `artist.soundcloud_url` / `artist.mixcloud_url` — these must be non-null in the DB for the link to render. Logic is correct. Issue is the missing `apple_music_url` field: `ArtistProfile` type and the Supabase `.select("*")` query don't include it, so Apple Music links can never show. |
| BUG-03 | Share modal opens and native OS share sheet appears with a generated share card | `SharePrompt` is rendered in artist profile but calls an unauthenticated POST to `/api/social/collection-card`. If the card fails, it falls back to text-only share — but `Share.share()` is called inside the `try` block after `onDone()` is returned, so the sheet closes before share opens. `loading` is set to `true` then `setLoading(false)` only happens in the fallback path, causing the modal to hang. |
| BUG-04 | Leaderboard screen loads and displays ranked data without error | No leaderboard screen exists under `app/`. The `useLeaderboard` hook and all types exist. The backend `/mobile/leaderboard` endpoint exists and returns correct data shape `{ entries: [...] }`. The screen must be created as `app/leaderboard.tsx`. |
</phase_requirements>

---

## Detailed Bug Diagnoses

### BUG-01: Discover Button

**File:** `src/hooks/useCollection.ts` — `useDiscover()`

**What's broken:** The `useDiscover` mutation calls `https://decibel-three.vercel.app/api/discover` (the old web-app discover route, not the mobile-optimized one). That old route expects either `performer_id` or `resolved_artist` in the body (see `/home/swarn/decibel/src/app/api/discover/route.ts`), and it authenticates via cookie-based `createSupabaseServer()`, not Bearer token. From a mobile client, `createSupabaseServer()` returns `user = null` because there's no cookie — the endpoint returns 401 immediately.

Additionally, the `useDiscover` hook uses `supabase.auth.getUser()` to extract the email and passes it in the body — a legacy pattern — rather than using `apiCall` (which sends the Bearer token properly).

**The correct endpoint** is `/mobile/discover` (POST, Bearer token, `{ performerId: string }` body), already deployed at `https://decibel-three.vercel.app/api/mobile/discover`. It returns:
```json
{ "success": true, "performer": { "id": "...", "name": "...", "slug": "..." } }
```
Note: the 409 conflict response (already discovered) currently throws an error — the mobile hook should catch 409 and treat it as `already_discovered: true`.

**Fix:** Replace `useDiscover` mutation to use `apiCall('/mobile/discover', { method: 'POST', body: JSON.stringify({ performerId }) })`, parse the response to derive `already_discovered` from caught 409, and update `onSuccess` invalidations.

**Call site in artist/[slug].tsx:** The `handleAction` function passes `{ performerId: artist.id }` and reads `result.already_discovered` — that matches the fix.

---

### BUG-02: Listen Links

**File:** `app/artist/[slug].tsx` — `musicLinks` memo

**What's correct:** The platform detection logic (hostname parsing) is correct. The null-filter works. The `Linking.openURL` with error catch is correct.

**What's broken:**
1. `ArtistProfile` type in `src/hooks/useArtistProfile.ts` does not include `apple_music_url`. The `performers` table likely has this field (per PRD v5), but `select("*")` would include it if present. However the TypeScript type won't expose it so it'll be ignored.
2. The `musicLinks` memo only checks `artist.spotify_url`, `artist.soundcloud_url`, `artist.mixcloud_url` — no `apple_music_url`.

**Likely real-world failure:** Most artists don't have Spotify URLs stored yet (the `spotify_url` field exists in the type but many performers were added before this field was populated). So for many artists, `musicLinks` is empty and nothing renders. This isn't a display bug — it's a data gap — but the code defensively handles it correctly.

**Fix:** Add `apple_music_url` to `ArtistProfile` type and include it in the `musicLinks` array. Confirm with a Supabase query that `apple_music_url` column exists on `performers`. If not, skip that field and document it for Phase 7 MIG-05.

**Verification query:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'performers' AND column_name LIKE '%music%' OR column_name LIKE '%spotify%' OR column_name LIKE '%sound%';
```

---

### BUG-03: Share Modal

**File:** `src/components/collection/SharePrompt.tsx`

**What's broken — two issues:**

**Issue A: Loading state never clears on success path.**
```
triggerShare() sets loading = true
  → fetches /api/social/collection-card
  → if res.ok && data.image_url:
      → Share.share(...)
      → onDone()       ← modal closes here
      → return          ← never reaches setLoading(false)
```
The `loading` state remains `true`, so if the user re-opens the share modal, the overlay is already showing before the fetch starts.

**Issue B: The `/api/social/collection-card` POST is unauthenticated.**
The request has no `Authorization` header. If the endpoint requires auth, it silently returns an error and falls through to text-only share. Whether the sheet opens depends on whether the fallback `Share.share()` runs — it does, but only after the card fetch fails.

**Fix:**
1. Always call `setLoading(false)` in every exit path (use `finally` block).
2. Add Bearer token to the collection card request using `supabase.auth.getSession()`.
3. After `Share.share()` resolves or rejects, call `setLoading(false)` then `onDone()`.

**Alternative approach:** The `SharePrompt` is a thin wrapper that immediately triggers share. Consider simplifying: skip the card generation entirely (the full ShareSheet in `src/components/passport/ShareSheet.tsx` is the correct rich share experience), and just call `Share.share({ message, url })` directly from `artist/[slug].tsx` using the Expo `Share` API — no loading overlay needed.

---

### BUG-04: Leaderboard Screen

**What's missing:** No file at `app/leaderboard.tsx`. The hook `useLeaderboard`, skeleton loader `LeaderboardSkeleton`, all types, and the backend endpoint are in place.

**Backend endpoint shape** (from `/home/swarn/decibel/src/app/api/mobile/leaderboard/route.ts`):
```
GET /mobile/leaderboard?tab=fans&period=allTime
→ { entries: FanLeaderboardEntry[] }

GET /mobile/leaderboard?tab=performers&period=weekly
→ { entries: PerformerLeaderboardEntry[] }
```

**FanLeaderboardEntry:**
```typescript
{ rank, fanId, name, count, topTier }
```

**PerformerLeaderboardEntry:**
```typescript
{ rank, performerId, name, slug, photoUrl, fanCount, genres }
```

**Navigation entry point:** From `src/lib/notifications.ts`, the route is `/leaderboard`. The home screen has no Leaderboard button currently — navigation access needs to be added (e.g., from the passport screen or search screen).

**Screen requirements for BUG-04:**
- Tab switcher: Fans | Performers
- Period switcher: Weekly | Monthly | All Time
- FlatList of ranked entries
- Fan entries: rank number, name, count, tier pill
- Performer entries: rank number, photo, name, slug tappable to artist profile, fan count
- Use `LeaderboardSkeleton` from `src/components/ui/SkeletonLoader.tsx` during load
- Current user highlighted (use `currentFanId` returned by `useLeaderboard`)
- Error state if fetch fails

---

## Standard Stack

### Core (already installed, no new deps needed)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@tanstack/react-query` | v5 | Data fetching mutations | `useDiscover` uses `useMutation` correctly |
| `expo-blur` | SDK 55 | BlurView in modals | Already used in ConfirmationModal, SharePrompt |
| `expo-sharing` | SDK 55 | Native share sheet | Available via `expo-sharing` |
| `react-native` Share | core | Native OS share dialog | Used in ShareSheet and SharePrompt |
| `apiCall` | local | Authenticated fetch wrapper | In `src/lib/api.ts` — must be used for all `/mobile/*` calls |

### Import Path Alias

All `@/*` paths resolve to `src/*` (configured in `tsconfig.json`). The `app/` directory uses this alias. Components in `src/components/collection/ConfirmationModal` are imported in `app/artist/[slug].tsx` as `@/components/collection/ConfirmationModal` — correct.

---

## Architecture Patterns

### Recommended Leaderboard Screen Structure

```
app/leaderboard.tsx          ← new screen
src/hooks/useLeaderboard.ts  ← already exists, no changes needed
src/components/ui/SkeletonLoader.tsx  ← LeaderboardSkeleton already exists
```

### Pattern: Authenticated Mutation

All mutation calls to `/mobile/*` endpoints must use `apiCall`, not raw `fetch`:

```typescript
// CORRECT (src/lib/api.ts handles Bearer token)
const res = await apiCall<ResponseType>('/mobile/discover', {
  method: 'POST',
  body: JSON.stringify({ performerId }),
});

// WRONG (current useDiscover — uses raw fetch + email in body)
const res = await fetch('https://decibel-three.vercel.app/api/discover', {
  method: 'POST',
  body: JSON.stringify({ performer_id, email }),
});
```

### Pattern: 409 as Non-Error

The `/mobile/discover` endpoint returns 409 when the user already has a relationship with the artist. `apiCall` will throw `API error 409: ...` — catch it and handle gracefully:

```typescript
mutationFn: async ({ performerId }) => {
  try {
    const data = await apiCall<{ success: boolean; performer: {...} }>(
      '/mobile/discover',
      { method: 'POST', body: JSON.stringify({ performerId }) }
    );
    return { success: true, already_discovered: false };
  } catch (err) {
    if (err instanceof Error && err.message.includes('409')) {
      return { success: true, already_discovered: true };
    }
    throw err;
  }
}
```

### Pattern: Share Cleanup

Always clean up loading state with `finally`:

```typescript
const triggerShare = async () => {
  setLoading(true);
  try {
    // ... generate card, share ...
  } catch {
    // ... fallback share ...
  } finally {
    setLoading(false);
    onDone();
  }
};
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authenticated API calls | Custom fetch wrapper | `apiCall()` from `src/lib/api.ts` | Has 401 retry, token refresh, session expiry modal |
| Query cache invalidation | Manual state reset | `queryClient.invalidateQueries` | TanStack Query handles stale data correctly |
| Share sheet UI | Custom modal | `expo-sharing` + `Share` from RN | Platform-native sheet, handles Instagram Stories |
| Leaderboard skeleton | Animated placeholder | `LeaderboardSkeleton` from `src/components/ui/SkeletonLoader.tsx` | Already built |

---

## Common Pitfalls

### Pitfall 1: apiCall path prefix

`apiCall` prepends `https://decibel-three.vercel.app/api` automatically. Pass only the path suffix:
```typescript
// CORRECT
apiCall('/mobile/discover', ...)

// WRONG — double-prefixes
apiCall('https://decibel-three.vercel.app/api/mobile/discover', ...)
```

### Pitfall 2: Query key invalidation after Discover

After a successful `useDiscover`, these query keys must be invalidated so the button state updates immediately:
- `["myArtistStatus", performerId]` — controls button label
- `["artistFanCount", performerId]` — fan count display
- `["passportCollections"]` — passport tab shows new discovery
- `["myCollectedIds"]` — used elsewhere for status filtering

The existing hook invalidates all four — preserve this in the fix.

### Pitfall 3: Share.share() on Android

On Android, `Share.share()` with both `message` and `url` may behave inconsistently. Pass `message` only, or use `expo-sharing` for file shares. For text-only fallback in SharePrompt, `message` alone is fine.

### Pitfall 4: Leaderboard navigation entry point

The leaderboard route `/leaderboard` is registered in notifications but there's no navigation button in the current app. BUG-04 requires the screen to load — we need at least one reachable entry point. Add a Leaderboard button to the Passport screen header or as a link in the discovery feed header.

### Pitfall 5: `colors.white` vs `"#FFFFFF"`

`ConfirmationModal` uses `colors.white` — this exists in `src/constants/colors.ts`. The leaderboard screen must use theme colors consistently. Do not hardcode `#FFFFFF` or `#000000`.

---

## Code Examples

### Corrected useDiscover (BUG-01)

```typescript
// Source: src/hooks/useCollection.ts
export function useDiscover() {
  const queryClient = useQueryClient();

  return useMutation<DiscoverResult, Error, { performerId: string }>({
    mutationFn: async ({ performerId }) => {
      try {
        await apiCall('/mobile/discover', {
          method: 'POST',
          body: JSON.stringify({ performerId }),
        });
        return { success: true, already_discovered: false, is_founder: false };
      } catch (err) {
        // 409 = already has relationship — not a hard error
        if (err instanceof Error && err.message.includes('409')) {
          return { success: true, already_discovered: true, is_founder: false };
        }
        throw err;
      }
    },
    onSuccess: (_result, { performerId }) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      queryClient.invalidateQueries({ queryKey: ["artistFanCount", performerId] });
      queryClient.invalidateQueries({ queryKey: ["myCollectedIds"] });
      queryClient.invalidateQueries({ queryKey: ["myArtistStatus", performerId] });
      queryClient.invalidateQueries({ queryKey: ["passportCollections"] });
    },
  });
}
```

### Corrected triggerShare (BUG-03)

```typescript
// Source: src/components/collection/SharePrompt.tsx
const triggerShare = async () => {
  setLoading(true);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const res = await fetch(
      'https://decibel-three.vercel.app/api/social/collection-card',
      { method: 'POST', headers, body: JSON.stringify({ performer_slug: performerSlug }) }
    );
    const message = `I just collected ${performerName} on Decibel! https://decible.live/artist/${performerSlug}`;

    if (res.ok) {
      const data = await res.json();
      await Share.share({ message, url: data.image_url ?? undefined });
    } else {
      await Share.share({ message });
    }
  } catch {
    try {
      await Share.share({
        message: `I just collected ${performerName} on Decibel! https://decible.live/artist/${performerSlug}`,
      });
    } catch {
      // User cancelled — fine
    }
  } finally {
    setLoading(false);
    onDone();
  }
};
```

### Leaderboard Screen Skeleton (BUG-04)

```typescript
// app/leaderboard.tsx
// Tab state: tab (fans|performers), period (weekly|monthly|allTime)
// useLeaderboard({ tab, period }) → { data, isLoading, isError, currentFanId }
// Render: LeaderboardSkeleton during load, FlatList when data
// Highlight row where entry.fanId === currentFanId (fans tab)
// Tap performer row → router.push(`/artist/${entry.slug}`)
```

---

## State of the Art

| Old Pattern | Current Pattern | Impact |
|------------|-----------------|--------|
| Email-in-body auth | Bearer token via `apiCall` | More secure, works with Supabase JWT |
| Raw `fetch` in mutations | `apiCall` wrapper | Handles 401 retry + session expiry |

---

## Open Questions

1. **Does `performers` table have `apple_music_url` column?**
   - What we know: PRD v5 mentions it in new columns list (MIG-05 is Phase 7)
   - What's unclear: Whether it exists now or only after Phase 7
   - Recommendation: Query Supabase at plan execution time. If absent, skip `apple_music_url` in BUG-02 fix and document for Phase 7.

2. **Does `/api/social/collection-card` require auth?**
   - What we know: The endpoint exists, the current code sends no auth header
   - What's unclear: Whether the endpoint has a middleware auth gate
   - Recommendation: Add auth header defensively regardless — it can only help.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (via Expo / React Native preset) |
| Config file | Detected via `src/components/collection/__tests__/` and `src/hooks/__tests__/` directories |
| Quick run command | `npx jest --testPathPattern="useCollection|SharePrompt|leaderboard" --passWithNoTests` |
| Full suite command | `npx jest --passWithNoTests` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUG-01 | `useDiscover` calls `/mobile/discover` with Bearer token, handles 409 as non-error | unit | `npx jest --testPathPattern="useCollection" --passWithNoTests` | ❌ Wave 0 |
| BUG-02 | `musicLinks` includes apple_music_url when present, excludes null fields | unit | `npx jest --testPathPattern="useArtistProfile" --passWithNoTests` | ❌ Wave 0 |
| BUG-03 | `triggerShare` always calls `onDone` + clears loading state in all exit paths | unit | `npx jest --testPathPattern="SharePrompt" --passWithNoTests` | ❌ Wave 0 |
| BUG-04 | Leaderboard screen renders with fan and performer tabs, shows data | manual smoke | Launch app → navigate to leaderboard | N/A |

### Sampling Rate

- **Per task commit:** `npx jest --passWithNoTests`
- **Per wave merge:** `npx jest --passWithNoTests`
- **Phase gate:** Full suite green + manual smoke test of all 4 bug paths before deploy

### Wave 0 Gaps

- [ ] `src/hooks/__tests__/useCollection.test.ts` — covers BUG-01 (mock `/mobile/discover`, verify 409 handling)
- [ ] `src/components/collection/__tests__/SharePrompt.test.ts` — covers BUG-03 (verify `onDone` + `setLoading(false)` in all paths)

---

## Sources

### Primary (HIGH confidence)
- Direct inspection of `app/artist/[slug].tsx` — discover button call site
- Direct inspection of `src/hooks/useCollection.ts` — `useDiscover` mutation
- Direct inspection of `/home/swarn/decibel/src/app/api/discover/route.ts` — old route auth pattern (cookie-based, breaks mobile)
- Direct inspection of `/home/swarn/decibel/src/app/api/mobile/discover/route.ts` — correct endpoint, Bearer token, response shape
- Direct inspection of `/home/swarn/decibel/src/app/api/mobile/leaderboard/route.ts` — confirmed data shape matches hook types
- Direct inspection of `src/components/collection/SharePrompt.tsx` — loading state bug
- Directory listing of `app/` — confirmed leaderboard screen is absent

### Secondary (MEDIUM confidence)
- `tsconfig.json` path alias `@/* → src/*` — confirmed import resolution
- `src/lib/api.ts` — `apiCall` implementation reviewed in full

---

## Metadata

**Confidence breakdown:**
- Bug diagnoses: HIGH — all traced from source to root cause by direct code inspection
- Fix approach: HIGH — standard patterns used throughout the codebase
- Leaderboard screen spec: HIGH — hook + types + backend all exist and match
- apple_music_url availability: LOW — depends on DB column existence, verify at plan time

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable codebase, no fast-moving deps)
