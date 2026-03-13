# Phase 8: Jukebox - Research

**Researched:** 2026-03-13
**Domain:** React Native WebView, social music feed, embedded audio players, push notifications
**Confidence:** HIGH

## Summary

Phase 8 builds the Jukebox — a social music feed where users browse Finds from people they follow,
listen via embedded Spotify/SoundCloud/Apple Music players, and one-tap Discover artists. The core
technical challenge is WebView lifecycle management: max-3 active WebViews to prevent memory blow-up,
stopping audio before unmount, and ensuring opening the Jukebox does not interrupt background music
already playing on the device (a known iOS pain point with WebView).

The backend work is straightforward: a new GET `/api/mobile/jukebox` endpoint (following the pattern
of the existing activity-feed endpoint), augmented discover endpoint behavior (finder notification),
and a DB migration for `event_artists` (MIG-04). The notification sending infrastructure already exists
in `src/lib/pushNotifications.ts` on the Vercel backend — reuse it.

The embed URL columns (`spotify_embed_url`, `soundcloud_embed_url`, `apple_music_embed_url`) were
already added to `performers` in MIG-05 (Phase 7). They just need to be populated and served by the
jukebox endpoint.

**Primary recommendation:** Install `react-native-webview@13`, use `mediaPlaybackRequiresUserAction={true}`
globally, manage a max-3 active WebView pool via `onViewableItemsChanged`, and inject pause JS before
unmounting. The `/api/mobile/discover` endpoint already exists — extend it to send the finder a push
notification rather than creating a new endpoint.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MIG-04 | `event_artists` junction table created (if not existing) | No references to this table exist in codebase — must be created; schema: id, event_id, performer_id, sort_order |
| JBX-01 | Map button on Home screen replaced with Jukebox icon button | `Map` icon in `app/(tabs)/index.tsx` line 96 — swap with `Headphones` or `ListMusic` from lucide-react-native, navigate to `/jukebox` |
| JBX-02 | Jukebox feed shows Finds from followed users in last 48 hours | `fan_follows` table exists; query `collections` where `collection_type = 'find'` and `fan_id IN (following_ids)` and `created_at >= now()-48h` |
| JBX-03 | Fallback to all platform Finds when followed-user finds empty | After followed-user query returns 0 rows, re-query without `fan_id` filter |
| JBX-04 | Card shows finder avatar + username + time ago, artist name + platform badge | All fields available from `collections JOIN fans JOIN performers` query |
| JBX-05 | Embedded player via react-native-webview (Spotify, SoundCloud, Apple Music) | react-native-webview@13; embed URL columns already on performers table (MIG-05) |
| JBX-06 | Max 3 WebViews active at once via onViewableItemsChanged lazy loading | Standard FlatList pattern with `viewabilityConfig` + Set of active item keys |
| JBX-07 | WebView audio does not interrupt iOS background music (mediaPlaybackRequiresUserAction) | Set `mediaPlaybackRequiresUserAction={true}` on all WebView instances |
| JBX-08 | Unmounted WebViews have audio stopped via injectJavaScript before unmount | `useEffect` cleanup: call `webViewRef.current?.injectJavaScript("document.querySelectorAll('audio,video').forEach(el => el.pause())")` |
| JBX-09 | One-tap Discover collect button with haptic feedback | Reuse `useDiscoverArtist` hook — already calls `POST /mobile/discover` + haptic |
| JBX-10 | Finder receives notification when someone collects from their Find | Extend `/api/mobile/discover` route: after insert, look up the collection's original finder_fan_id, call `sendPushNotification` from `src/lib/pushNotifications.ts` |
| JBX-11 | Empty state when no Finds available | Standard EmptyState component per existing patterns |
| JBX-12 | Embed URLs cached on performers table for repeat loads | Columns exist (MIG-05); jukebox endpoint returns them; populate on artist add if missing |
| JBX-13 | GET /api/mobile/jukebox endpoint returns feed data | New file: `src/app/api/mobile/jukebox/route.ts` |
| JBX-14 | POST /api/mobile/discover endpoint creates Discovery collection entry | Endpoint ALREADY EXISTS at `src/app/api/mobile/discover/route.ts` — extend, don't recreate |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-webview | ^13.x | Render Spotify/SoundCloud/Apple Music iframes | Community standard for WebView in RN; official Expo-maintained fork |
| expo-haptics | ~55.0.8 (already installed) | Haptic on Discover tap | Already in project |
| lucide-react-native | ^0.577.0 (already installed) | Jukebox icon in home header | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | ^5 (already installed) | useInfiniteQuery for jukebox feed | Same as activity-feed pattern |
| expo-notifications | ~55.0.11 (already installed) | Push notification token storage | Already wired in useNotifications |

### Not Needed
- No new state management libraries
- No audio libraries (react-native-track-player is explicitly deferred to v4+)
- No new animation libraries

**Installation:**
```bash
cd /home/swarn/decibel-mobile && npx expo install react-native-webview
```

Note: `npx expo install` (not `npm install`) ensures the version compatible with Expo SDK 55 is selected.
Expo SDK 55 targets React Native 0.83.x — react-native-webview 13.x supports this.

---

## Architecture Patterns

### Recommended Project Structure (new files only)
```
app/
├── jukebox.tsx                    # Jukebox screen (new Expo Router route)
src/
├── components/
│   └── jukebox/
│       ├── JukeboxCard.tsx        # Card: finder info + artist + platform badge + Discover button
│       └── EmbeddedPlayer.tsx     # WebView wrapper with pool management
├── hooks/
│   └── useJukebox.ts              # useInfiniteQuery for jukebox feed
decibel/src/app/api/mobile/
└── jukebox/
    └── route.ts                   # GET endpoint
```

### Pattern 1: WebView Pool (max-3 active)

**What:** FlatList with `onViewableItemsChanged` tracks which items are visible. A Set stores keys of
the 3 most recently visible items. Items not in the set render a placeholder instead of a WebView.

**When to use:** Any FlatList containing embedded players — prevents memory exhaustion.

**Key props:**
```typescript
// Source: react-native-webview README + community patterns
const viewabilityConfig = {
  itemVisiblePercentThreshold: 50,  // item must be 50% visible
  minimumViewTime: 300,             // avoid firing on fast scrolls
};

// In onViewableItemsChanged callback:
// Keep only the 3 most recently visible item keys in a Set
// EmbeddedPlayer checks: if not in activeKeys set → render <View style={styles.playerPlaceholder}/>
```

**Example:**
```typescript
// EmbeddedPlayer.tsx
export function EmbeddedPlayer({ embedUrl, isActive }: { embedUrl: string; isActive: boolean }) {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (!isActive) {
      // Stop audio when pool evicts this player
      webViewRef.current?.injectJavaScript(
        "document.querySelectorAll('audio,video').forEach(el => el.pause()); true;"
      );
    }
  }, [isActive]);

  if (!isActive) {
    return <View style={styles.placeholder} />;
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: embedUrl }}
      mediaPlaybackRequiresUserAction={true}  // JBX-07: do not interrupt background music
      allowsInlineMediaPlayback={true}         // needed for iOS inline playback
      javaScriptEnabled={true}
      scrollEnabled={false}
      style={styles.player}
    />
  );
}
```

### Pattern 2: Jukebox Feed API Query (following-with-fallback)

**What:** Server endpoint first queries Finds from followed users in last 48h. If result is empty,
falls back to all-platform Finds. This fallback logic runs server-side in the endpoint.

**Example:**
```typescript
// GET /api/mobile/jukebox route.ts (simplified)
// Step 1: get fan's following list
const { data: following } = await admin
  .from("fan_follows")
  .select("following_id")
  .eq("follower_id", fanId);

const followingIds = following?.map(f => f.following_id) ?? [];
const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

let query = admin
  .from("collections")
  .select(`id, fan_id, created_at, collection_type,
    fans!inner(id, name, avatar_url),
    performers!inner(id, name, slug, photo_url, genres,
      spotify_url, soundcloud_url, apple_music_embed_url,
      spotify_embed_url, soundcloud_embed_url)`)
  .eq("collection_type", "find")
  .gte("created_at", cutoff)
  .order("created_at", { ascending: false })
  .range(from, to);

// Social feed: filter by following; fallback = no filter
if (followingIds.length > 0) {
  query = query.in("fan_id", followingIds);
}
const { data, error } = await query;

// If following-filtered result is empty, re-query without fan_id filter
const isFallback = followingIds.length === 0 || (data?.length === 0);
```

### Pattern 3: Finder Notification on Collect

**What:** When `/api/mobile/discover` runs successfully, look up which fan first created a `find`
collection for that performer, then send them a push notification. Reuse existing `sendPushNotification`
from `src/lib/pushNotifications.ts`.

**Important:** The discover endpoint currently uses `capture_method: 'online'` and does not set
`collection_type`. It must be updated to set `collection_type: 'discovery'` AND send the finder
notification. The finder is the fan with a `find` collection OR a `founder_badge` for the performer —
use `founder_badges` first, fall back to earliest `find` collection.

```typescript
// After successful discover insert in discover/route.ts:
// Find original finder (founder_badge → earliest find collection)
const { data: founderBadge } = await admin
  .from("founder_badges")
  .select("fan_id")
  .eq("performer_id", performerId)
  .maybeSingle();

const finderFanId = founderBadge?.fan_id ?? (
  await admin.from("collections")
    .select("fan_id")
    .eq("performer_id", performerId)
    .eq("collection_type", "find")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
)?.data?.fan_id;

if (finderFanId && finderFanId !== fan.id) {
  // Look up user_id for this fan (push_tokens uses auth user_id, not fan_id)
  const { data: finderFan } = await admin.from("fans").select("email").eq("id", finderFanId).single();
  const { data: finderUser } = await admin.auth.admin.listUsers(); // OR look up by email
  // ... send notification (see pushNotifications.ts pattern)
}
```

**Note:** The `push_tokens` table uses `user_id` (Supabase auth UUID), not `fan_id`. The notification
library's `sendPushNotification` expects `userId` = the auth user UUID. The pattern to resolve
fan_id → user_id: `admin.auth.admin.getUserByEmail(finderFan.email)`.

### Pattern 4: Navigation — Jukebox Route

**What:** JBX-01 requires the map icon on Home to navigate to Jukebox. The Jukebox screen is a
full-page modal-style route (not a tab), accessible via `router.push("/jukebox")`. It does NOT
replace a tab in the tab bar — it replaces the MAP BUTTON in the home header only.

```typescript
// In app/(tabs)/index.tsx — replace Map icon press handler:
import { ListMusic } from "lucide-react-native";
// ...
<Pressable onPress={() => router.push("/jukebox")} ...>
  <ListMusic size={20} color={colors.textSecondary} />
</Pressable>
```

The Jukebox screen lives at `app/jukebox.tsx` (sibling to `app/(tabs)/`), with a back header.

### Anti-Patterns to Avoid

- **Do NOT mount all WebViews at once** — 20+ embedded iframes will OOM on low-end devices
- **Do NOT use `mediaPlaybackRequiresUserAction={false}`** — interrupts background Spotify/Apple Music
- **Do NOT create a new discover endpoint** — `/api/mobile/discover` already exists, extend it
- **Do NOT look for `collection_type = 'find'` on founder items** — founders have `founder_badge` rows, their collections may be `collection_type = 'find'` OR legacy nulls; query both
- **Do NOT fire push notifications synchronously blocking the discover response** — use `void sendPushNotification(...)` fire-and-forget after returning the response

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Push notification dispatch | Custom fetch to Expo API | `sendPushNotification` in `src/lib/pushNotifications.ts` | Already has daily-cap, multi-device, preference checks |
| Discover mutation | New hook | `useDiscoverArtist` in `src/hooks/useDiscoverArtist.ts` | Already handles haptic + cache invalidation |
| Auth in API routes | Custom JWT parsing | `getAuthEmail` pattern (copy from passport/route.ts) | Established across all mobile endpoints |
| Embed URL construction | Custom URL builder | Store pre-built embed URLs in performers table columns | Embed URL formats differ subtly per platform; caching avoids re-derivation |

**Key insight:** The backend's push notification and discover infrastructure is already built. Phase 8
is primarily an extension/wiring phase, not a ground-up build.

---

## Common Pitfalls

### Pitfall 1: iOS Background Audio Interruption
**What goes wrong:** Opening any WebView that loads Spotify/SoundCloud embed pauses background music
(e.g., user listening to Apple Music before opening Jukebox).
**Why it happens:** WKWebView registers its own audio session category on init, regardless of whether
audio plays. This is an iOS audio session interrupt mode conflict.
**How to avoid:** `mediaPlaybackRequiresUserAction={true}` defers audio session registration until
the user explicitly taps play. Also: mount WebViews lazily (only when isActive=true in the pool).
**Warning signs:** Users report music pausing when opening the Jukebox screen.

### Pitfall 2: WebView Memory Accumulation
**What goes wrong:** Scrolling through 20 Jukebox cards allocates 20 WebViews, causing OOM crashes
or severe jank, especially on Android.
**Why it happens:** React Native doesn't garbage-collect WebView native views while the component
is mounted, even if off-screen.
**How to avoid:** The max-3 pool pattern. Items not in the active set render a static placeholder
View, not a WebView. The pool evicts the oldest item when a new one becomes visible.
**Warning signs:** Memory climbing linearly with scroll position in Xcode Instruments.

### Pitfall 3: injectJavaScript on Unmounted WebView
**What goes wrong:** `webViewRef.current?.injectJavaScript(...)` throws or silently fails when
called after the component unmounts.
**Why it happens:** The ref may still hold a reference to a deallocated native view.
**How to avoid:** Call inject in `useEffect` cleanup (when `isActive` goes false), before the
component re-renders to null. The `?.` optional chain handles the null case safely.

### Pitfall 4: collection_type Not Set on Discover
**What goes wrong:** New Discoveries created via the Jukebox show up as `null` collection_type,
breaking the Passport tab's Discoveries section filter.
**Why it happens:** The existing `/api/mobile/discover` endpoint sets `capture_method: 'online'`
but does not set `collection_type` (pre-MIG-06 code pattern).
**How to avoid:** Update the insert in `discover/route.ts` to include `collection_type: 'discovery'`.

### Pitfall 5: fan_id vs user_id in Push Tokens
**What goes wrong:** Finder notification fails to send because `push_tokens.user_id` is a Supabase
auth UUID, but you only have the finder's `fan_id`.
**Why it happens:** Two separate ID spaces: `fans.id` (app row) vs Supabase auth `users.id`.
**How to avoid:** Look up `fans.email` by `fan_id`, then call
`admin.auth.admin.getUserByEmail(email)` to get the auth UUID for `sendPushNotification`.

### Pitfall 6: Embed URL May Not Be Populated
**What goes wrong:** `spotify_embed_url` is null for most existing artists — the column was added
but not populated on existing rows.
**How to avoid:** The jukebox endpoint should derive embed URLs at query time if the stored value
is null, using the artist's existing `spotify_url` / `soundcloud_url` (convert to embed format).
Cache the derived value back into the column for future requests. Add this derivation logic to the
jukebox endpoint.

**Spotify embed URL derivation:**
`https://open.spotify.com/artist/ABC123` → `https://open.spotify.com/embed/artist/ABC123`

**SoundCloud embed URL derivation:**
`https://soundcloud.com/artist-slug` → `https://w.soundcloud.com/player/?url=https://soundcloud.com/artist-slug&auto_play=false&visual=true`

**Apple Music embed URL derivation:**
`https://music.apple.com/us/artist/name/123456789` → `https://embed.music.apple.com/us/artist/name/123456789`

---

## Code Examples

### JukeboxCard skeleton
```typescript
// Source: project patterns (ActivityFeedCard, FindGlassCard)
type JukeboxItem = {
  id: string;              // collection.id
  fan_id: string;
  fan_name: string;
  fan_avatar: string | null;
  created_at: string;
  performer_id: string;
  performer_name: string;
  performer_slug: string;
  performer_photo: string | null;
  platform: 'spotify' | 'soundcloud' | 'apple_music';
  embed_url: string | null;
  is_collected: boolean;   // has current user already discovered this artist?
};
```

### Jukebox endpoint response shape
```typescript
// GET /api/mobile/jukebox?page=0
{
  items: JukeboxItem[];
  hasNextPage: boolean;
  isFallback: boolean;  // true when showing all-platform finds (not following-only)
}
```

### Notification type for finder
```typescript
// data object passed to sendPushNotification
{
  type: "artist_collected",   // routes to /artist/:slug in handleNotificationRoute (extend)
  slug: performer.slug,
  collectorName: fan.name ?? "Someone"
}
```
Add `case "artist_collected":` to `handleNotificationRoute` in `src/lib/notifications.ts`.

### viewabilityConfig for WebView pool
```typescript
const viewabilityConfig = useRef({
  itemVisiblePercentThreshold: 50,
  minimumViewTime: 300,
}).current;

// Track active keys (max 3)
const activeKeysRef = useRef<Set<string>>(new Set());

const onViewableItemsChanged = useCallback(
  ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const visibleKeys = viewableItems.map(v => v.key ?? '').filter(Boolean);
    // Add new, evict oldest if > 3
    const next = new Set([...visibleKeys, ...activeKeysRef.current]);
    while (next.size > 3) {
      const [first] = next;
      next.delete(first);
    }
    activeKeysRef.current = next;
    setActiveKeys(new Set(next)); // trigger re-render
  },
  []
);
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Mount all WebViews in list | Pool max-3 active WebViews | Prevents OOM on Android, jank on iOS |
| mediaPlaybackRequiresUserAction defaults (wrong docs) | Explicitly set `true` | Prevents iOS background music interruption |
| Direct fetch to Expo push | `sendPushNotification` from lib | Daily cap, multi-device, preference checks |

**Deprecated/outdated:**
- Do NOT use the old `react-native-community/react-native-webview` package name — it migrated to `react-native-webview/react-native-webview`. The npm package name `react-native-webview` is correct.
- The `capture_method: 'online'` pattern on the discover endpoint is legacy — new code must also set `collection_type: 'discovery'`.

---

## Open Questions

1. **Embed URL population for existing artists**
   - What we know: MIG-05 added the columns but did not populate them. The jukebox endpoint will need to derive and cache embed URLs for existing artists.
   - What's unclear: How many artists have null embed URLs vs valid `spotify_url` values.
   - Recommendation: Derive at query time in the jukebox endpoint; upsert back if null (fire-and-forget update). Don't add a backfill migration — too many edge cases with null source URLs.

2. **MIG-04 necessity**
   - What we know: `event_artists` junction table is listed in REQUIREMENTS.md as MIG-04 for Phase 8. However, Phase 8 (Jukebox) doesn't obviously use event-to-artist relationships.
   - What's unclear: Whether this migration is prep for Phase 9 (Show Check-in) rather than Jukebox.
   - Recommendation: Create the migration as specified (the plan explicitly lists it in 08-01). The table is simple: `event_artists(id, event_id, performer_id, sort_order)`. The existing `events` table uses a single `performer_id` FK — the junction table enables multi-artist events for Phase 9.

3. **Discover button state in Jukebox cards**
   - What we know: `useMyCollectedIds` hook exists and tracks which performers the user has collected.
   - What's unclear: Whether to show the Discover button as disabled/hidden once already collected.
   - Recommendation: Query `useMyCollectedIds` and set `is_collected: true` on Jukebox items; hide the Discover button (or show "In Passport") for already-collected artists.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30 + ts-jest |
| Config file | `/home/swarn/decibel-mobile/jest.config.js` |
| Quick run command | `cd /home/swarn/decibel-mobile && npx jest src/hooks/__tests__/ --testPathPattern jukebox` |
| Full suite command | `cd /home/swarn/decibel-mobile && npx jest` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| JBX-02/03 | Feed returns following-Finds, fallback when empty | unit (logic) | N/A — API tested manually via curl | ❌ Wave 0 (optional) |
| JBX-06 | Pool evicts oldest when > 3 active | unit | `npx jest --testPathPattern EmbeddedPlayer` | ❌ Wave 0 |
| JBX-07 | mediaPlaybackRequiresUserAction prop present | smoke/visual | Manual device test | manual-only |
| JBX-09 | useDiscoverArtist called on tap | unit | existing `useDiscoverArtist` tests | ✅ (existing hook tested) |
| MIG-04 | event_artists table exists | smoke | curl Supabase REST | manual |

### Sampling Rate
- **Per task commit:** `cd /home/swarn/decibel-mobile && npx jest --passWithNoTests`
- **Per wave merge:** `cd /home/swarn/decibel-mobile && npx jest`
- **Phase gate:** Full suite green + EAS preview update deployed before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/__tests__/useJukebox.test.ts` — covers JBX-02/03 feed query logic
- [ ] `src/components/jukebox/__tests__/EmbeddedPlayer.test.tsx` — covers JBX-06 pool logic

*(Most Jukebox validation is manual — embedded WebView audio behavior cannot be tested in Jest)*

---

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/lib/pushNotifications.ts` — full push notification infrastructure
- Project codebase: `src/app/api/mobile/discover/route.ts` — existing discover endpoint
- Project codebase: `src/app/api/mobile/activity-feed/route.ts` — following-based query pattern
- Project codebase: `app/(tabs)/index.tsx` — Map icon location (line 96-98)
- Project codebase: `supabase/migrations/20260312_performers_embed_urls.sql` — embed URL columns confirmed

### Secondary (MEDIUM confidence)
- [react-native-webview iOS audio discussion](https://github.com/react-native-webview/react-native-webview/discussions/3204) — confirms `mediaPlaybackRequiresUserAction={true}` as the fix for background music interruption
- [Spotify Embeds docs](https://developer.spotify.com/documentation/embeds) — embed URL format `open.spotify.com/embed/{type}/{id}`
- [SoundCloud Widget API](https://developers.soundcloud.com/docs/api/html5-widget) — embed URL format `w.soundcloud.com/player/?url=...`
- [Apple Music embed](https://embed.music.apple.com) — embed domain is `embed.music.apple.com` (not `music.apple.com/embed`)

### Tertiary (LOW confidence)
- react-native-webview version for Expo SDK 55: use `npx expo install react-native-webview` to get the correct compatible version; training data suggests ~13.x but let expo resolve it

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — packages are well-established, embed URL formats are stable
- Architecture: HIGH — all patterns derived directly from existing project code
- Pitfalls: HIGH for WebView audio (documented GitHub issues), MEDIUM for embed URL derivation (platform-specific quirks)
- Notification pattern: HIGH — `pushNotifications.ts` is battle-tested in project

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable domain — WebView API and embed formats rarely change)
