# Pitfalls Research

**Domain:** React Native + Expo — Glassmorphism UI, Jukebox (embedded music players), Supabase Realtime check-in, VM scraper waterfall, collection type migration
**Researched:** 2026-03-12
**Confidence:** HIGH (drawn from existing codebase, official docs, confirmed GitHub issues)

> This file extends the v2.x PITFALLS.md. Pitfalls documented there (Spotify scrape returning 0, GPS accuracy variance, UTC date mismatch, duplicate collect, SoundCloud URL parser) still apply. This file covers only the NEW surface area introduced by v3.0: Glassy Passport, Jukebox, and the "I'm at a Show" check-in system.

---

## Critical Pitfalls

### Pitfall 1: BlurView Android Requires BlurTargetView Wrapper — No-op Without It

**What goes wrong:**
In Expo SDK 55 (which this project is on — `expo-blur ~55.0.8`), the Android blur API was significantly changed. `BlurView` on Android requires the blurred content to be wrapped in a `BlurTargetView` component, and its ref must be passed to `BlurView` via the `blurTarget` prop. Without this, `BlurView` renders as a transparent overlay with no blur effect on Android — the cards look correct on iOS but completely flat (no glass effect) on Android. The property `experimentalBlurMethod` was also renamed to `blurMethod` in SDK 55.

The existing codebase already uses `BlurView` in three places (`StampAnimationModal`, `SharePrompt`, `ConfirmationModal`) using the old API shape — all three will break on Android if the Glassy Passport adds more BlurViews without the new pattern.

**Why it happens:**
Developers test on iOS Simulator (blur works natively) and ship. The Android path silently produces no blur. The breaking API change in SDK 55 (`blurTarget` requirement) is documented but easy to miss.

**How to avoid:**
```tsx
// SDK 55+ correct Android pattern
import { BlurView, BlurTargetView } from "expo-blur";

// WRONG — works on iOS, transparent on Android
<BlurView intensity={40} tint="dark" style={styles.card} />

// CORRECT — works on both platforms
<BlurTargetView ref={blurTargetRef} style={styles.cardBackground}>
  {/* The content you want to appear behind the blur */}
</BlurTargetView>
<BlurView
  blurTarget={blurTargetRef}
  intensity={40}
  tint="dark"
  blurMethod="dimezisBlurViewSdk31Plus"  // falls back to 'none' on Android < 12
  style={styles.card}
>
  {/* Card content on top */}
</BlurView>
```

On Android API < 31 (Android 11 and below), set a fallback: `blurMethod="dimezisBlurViewSdk31Plus"` falls back to `'none'` automatically — use the semi-transparent background (`rgba(21, 21, 28, 0.85)`) as the visual on those devices. Do not let the card be invisible.

Additionally: the `blurReductionFactor` (default: 4) means Android blur intensity appears ~4x lower than iOS at the same `intensity` value. Set `intensity={80}` on Android to visually match `intensity={40}` on iOS, or use `Platform.select` to pass different values.

**Warning signs:**
- Passport cards look flat/unblurred on an Android device
- No error thrown — blur simply doesn't render
- Existing `StampAnimationModal` BlurView worked in v2.x only because it's a full-screen modal with no content behind it to blur (the blur effect was cosmetic)

**Phase to address:**
Phase 3 (Glassy Passport Redesign) — day one, before building any glass card component

---

### Pitfall 2: BlurView Renders Before FlatList Dynamic Content — Glass Effect Is Static/Wrong

**What goes wrong:**
Expo's official docs state: "The blur effect does not update when BlurView is rendered before dynamic content is rendered using FlatList." If the Glassy Passport grid is implemented as a `FlatList` of cards where each card wraps a `BlurView`, the blur renders once on mount based on whatever content is behind it at that moment — then freezes. Scrolling causes cards to move but the blur background does not update, creating a broken parallax effect where blur artifacts from the initial render persist.

**Why it happens:**
`BlurView` captures a snapshot of its background layer at render time. Dynamic lists paint items after the first render cycle, so the blur captures an empty/wrong background.

**How to avoid:**
- Render the blur as a single full-page background element, not per-card. One `BlurView` covering the whole passport screen with the animated gradient orbs behind it. Individual cards use semi-transparent backgrounds that let the single blur layer show through.
- Do NOT put a `BlurView` inside each `FlatList` item or each grid card.
- The "glass" appearance comes from: `rgba(255,255,255,0.08)` card background + `1px solid rgba(255,255,255,0.12)` border + the page-level blur behind everything. This is actually the correct glassmorphism pattern anyway.

**Warning signs:**
- Cards show blur of the content that was visible at initial mount, not what's currently behind them
- Scrolling the grid creates smear/artifact effect
- Performance drops when many BlurViews are mounted simultaneously (each is an independent GPU layer)

**Phase to address:**
Phase 3 (Glassy Passport Redesign) — architecture decision before building grid layout

---

### Pitfall 3: Multiple WebViews in FlatList — Audio Ducking Kills iOS Background Playback

**What goes wrong:**
On iOS, any `WebView` that plays audio activates the audio session and ducks (reduces volume of) all other audio — including the user's currently playing music from Spotify, Apple Music, or any other audio app. This is a system-level behavior for AVAudioSession. The moment the Jukebox screen mounts even one WebView with an embed (even paused, even muted), iOS may reassert audio session control depending on the embed's HTML. When the user leaves the Jukebox screen, the session may not release, leaving their music ducked or paused.

On Android, WebView audio mixes without ducking — this specific issue is iOS-only.

**Why it happens:**
`react-native-webview` does not expose audio session configuration. The Spotify, SoundCloud, and Apple Music embeds use HTML5 Audio which claims the iOS audio session on `canplaythrough` — even before the user taps play.

**How to avoid:**
- Set `mediaPlaybackRequiresUserAction={true}` on all WebViews. This prevents the embed from acquiring the audio session until the user explicitly taps play.
- Set `allowsInlineMediaPlayback={true}` on iOS (required for embeds to play inline rather than going fullscreen, which also helps with session management).
- On unmount of the Jukebox screen, explicitly destroy active WebViews by setting a key prop that changes, forcing remount from scratch.
- Test by: opening Spotify on the device → play a song → open Jukebox → verify Spotify keeps playing. This is the exact user scenario.

```tsx
<WebView
  source={{ uri: embedUrl }}
  mediaPlaybackRequiresUserAction={true}
  allowsInlineMediaPlayback={true}
  // Do NOT set allowsFullscreenVideo — it changes audio session behavior
/>
```

**Warning signs:**
- User's background music pauses when Jukebox screen opens
- Music doesn't resume when leaving Jukebox
- Happens even when no WebView embed has been tapped/played

**Phase to address:**
Phase 1 (Jukebox) — WebView configuration from the start

---

### Pitfall 4: WebView `onMessage` Prop Change Creates BatchedBridge Leak

**What goes wrong:**
There is a confirmed React Native WebView bug: every time the `onMessage` prop reference changes (including on every re-render if the callback is defined inline), a new callback is registered in `BatchedBridge` and the old one is never released. In a FlatList with 10-20 WebView cards, each re-render (caused by loading states, collect button state changes, scroll position updates) multiplies the leaks. This causes growing memory usage over time and eventual crashes on lower-end Android devices after scrolling through 50+ cards in a session.

**Why it happens:**
Developers define `onMessage` inline as an arrow function: `onMessage={(e) => handleMessage(e)}`. The arrow function is a new object every render, triggering the bridge leak on every render cycle.

**How to avoid:**
- Define `onMessage` handlers with `useCallback` and stable dependency arrays.
- Better: if the Jukebox embeds don't need two-way communication (they don't — they just play audio), don't pass `onMessage` at all. Spotify/SoundCloud/Apple Music embeds don't require JS bridge communication.
- Use `key` prop to force remount only when `embedUrl` changes, not on every state update in the parent component.

```tsx
// WRONG — creates new function every render
<WebView onMessage={(e) => console.log(e)} />

// CORRECT — stable reference
const handleMessage = useCallback((e: WebViewMessageEvent) => {
  // handle
}, []); // no deps = never changes
<WebView onMessage={handleMessage} />

// BEST for Jukebox — no onMessage needed
<WebView source={{ uri: embedUrl }} />
```

**Warning signs:**
- Memory grows linearly as user scrolls through Jukebox
- App crashes after extended Jukebox sessions (especially Android)
- Flipper's memory profiler shows BatchedBridge callbacks accumulating

**Phase to address:**
Phase 1 (Jukebox) — WebView implementation

---

### Pitfall 5: Max 3 Active WebViews — Unmounting Does Not Stop Audio

**What goes wrong:**
The PRD correctly specifies "max 3 active WebViews at any time" using `onViewableItemsChanged`. The implementation trap is: unmounting a WebView by removing it from the React tree stops rendering but does NOT stop the underlying audio playback on iOS. The web content in a WebView has its own JavaScript execution context — if `autoPlay` was activated by the user, unmounting the React component does not fire `pause()` on the audio element inside the WebView's web context.

Result: user scrolls past 3 cards that were playing previews, the WebViews unmount, but audio from all three continues. Three simultaneous audio streams play simultaneously with no visible player or stop control.

**Why it happens:**
React unmount lifecycle does not communicate into the WebView's internal JavaScript context. The bridge closes but the audio thread (a native process on iOS) continues.

**How to avoid:**
Before unmounting a WebView, inject JavaScript to stop playback:

```tsx
const webviewRef = useRef<WebView>(null);

// Call this BEFORE unmounting (in the visibility-change callback)
const stopPlayback = () => {
  webviewRef.current?.injectJavaScript(`
    try {
      document.querySelectorAll('audio, video').forEach(el => {
        el.pause();
        el.currentTime = 0;
      });
      // Spotify iframe: post message to pause
      document.querySelectorAll('iframe').forEach(iframe => {
        try { iframe.contentWindow.postMessage('{"method":"pause"}', '*'); } catch(e) {}
      });
    } catch(e) {}
    true; // required for injectJavaScript
  `);
};

// In onViewableItemsChanged — when card scrolls out of view:
// 1. Call stopPlayback() on that card's ref
// 2. Then unmount the WebView
```

**Warning signs:**
- Multiple audio streams playing after scrolling past several cards
- No visible UI to stop playback after scrolling
- Users report audio continuing after leaving the Jukebox screen

**Phase to address:**
Phase 1 (Jukebox) — viewability tracking + WebView lifecycle

---

### Pitfall 6: Supabase Realtime Subscription Stuck in CLOSED Loop on iOS Background/Foreground

**What goes wrong:**
The check-in flow subscribes to `search_results` filtered by `searchId` to receive scraper results. On iOS, when the user switches away from the app during the 15-second scraping window (e.g., to check a text message), the app goes to background. Supabase Realtime's WebSocket connection closes (iOS kills background network connections aggressively). When the user returns, the subscription status cycles between `CLOSED` and attempts to reconnect — but does not successfully re-subscribe in all cases. The exponential backoff (1s, 2s, 5s, 10s) runs, but the subscription may never reach `SUBSCRIBED` again in the same app session without an explicit disconnect/reconnect.

The practical result: the scraper finishes and writes to `search_results`, but the app never receives the realtime event. The user sees the 15-second timeout fire and gets the manual form — even though the scraper found their venue.

**Why it happens:**
Supabase's realtime-js client does auto-reconnect but the reconnection loop can get stuck on `CLOSED` when the WebSocket handshake fails mid-session. There is a confirmed issue (#1088 in supabase/realtime) where `TIMED_OUT` leads to a stuck reconnection loop.

**How to avoid:**
- Set a hard 15-second client-side timeout via `setTimeout` that is independent of the realtime subscription.
- On `AppState` change to `active` (foreground), explicitly call `supabase.removeChannel(channel)` and re-subscribe with a fresh channel rather than relying on auto-reconnect.
- Poll as fallback: if subscription status is not `SUBSCRIBED` within 3 seconds of mounting, fall back to polling `search_results` every 2 seconds until timeout.

```typescript
useEffect(() => {
  let channel: RealtimeChannel | null = null;
  let pollInterval: NodeJS.Timeout | null = null;

  const subscribeOrPoll = () => {
    channel = supabase.channel(`search:${searchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'search_results',
        filter: `search_id=eq.${searchId}`,
      }, handleResult)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && pollInterval) {
          clearInterval(pollInterval); // realtime working, stop polling
          pollInterval = null;
        }
        if (status === 'CLOSED' || status === 'TIMED_OUT') {
          // Fall back to polling
          if (!pollInterval) {
            pollInterval = setInterval(() => pollSearchResult(searchId), 2000);
          }
        }
      });
  };

  subscribeOrPoll();

  const appStateSub = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      // Force fresh subscription on foreground
      if (channel) supabase.removeChannel(channel);
      subscribeOrPoll();
    }
  });

  const hardTimeout = setTimeout(() => showManualFallback(), 15000);

  return () => {
    if (channel) supabase.removeChannel(channel);
    if (pollInterval) clearInterval(pollInterval);
    clearTimeout(hardTimeout);
    appStateSub.remove();
  };
}, [searchId]);
```

**Warning signs:**
- Scraper finds venue but app shows manual form
- Realtime subscription status stuck on `CLOSED` in logs after backgrounding
- Works perfectly when staying on the app, breaks when user switches away

**Phase to address:**
Phase 2 ("I'm at a Show") — realtime subscription setup

---

### Pitfall 7: Supabase Realtime RLS Silently Blocks Events if SELECT Policy Is Missing

**What goes wrong:**
`search_results` is a new table created for the check-in scraper. If RLS is enabled on it (Supabase enables RLS by default on new tables), and no `SELECT` policy is defined for the authenticated user, Realtime events are silently dropped — the row is written by the scraper, but the subscribing client never receives the event. No error is thrown. The subscription stays `SUBSCRIBED`. Events just don't arrive.

This is easy to miss because: (1) the scraper writes with the service role key which bypasses RLS, (2) the insert succeeds, (3) the app's realtime subscription is active and shows as `SUBSCRIBED` — but the event is never forwarded to the client because RLS blocks the SELECT.

**Why it happens:**
Supabase Realtime uses Postgres logical replication. Before forwarding an event to a client, it checks if that client's JWT can SELECT the row. If not, it drops the event rather than returning an error.

**How to avoid:**
Create an explicit SELECT policy on `search_results` allowing the authenticated user to read rows where `user_id = auth.uid()` (or where `search_id` matches — add `user_id` to the `search_results` table for this purpose):

```sql
-- Add user_id to search_results so RLS can filter correctly
ALTER TABLE search_results ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- RLS policy: user can only receive results for their own searches
CREATE POLICY "Users can read own search results"
ON search_results FOR SELECT
USING (auth.uid() = user_id);
```

The scraper service writes `user_id` when creating the `search_results` row (pass it from the Vercel API as part of the scrape request).

**Warning signs:**
- Realtime subscription shows `SUBSCRIBED` but no events received
- Manually querying `search_results` from the client confirms the row exists
- Issue disappears when RLS is disabled (confirms it's the policy, not the subscription)

**Phase to address:**
Phase 2 ("I'm at a Show") — schema setup before writing the scraper

---

### Pitfall 8: Playwright Unclosed Browser Contexts Cause VM Memory Exhaustion

**What goes wrong:**
Each check-in request to the VM scraper service may spawn a Playwright browser context for Layers 4-5 (social media scraping, venue website scraping). If a request handler throws an error before `context.close()` is called, the browser context stays open. After ~50 check-in requests, the VM accumulates dozens of open Chromium instances and runs out of memory (~1GB RAM on a DigitalOcean basic droplet). PM2 restarts the process, but the restart takes 10-30 seconds — during which all in-flight check-ins fail.

**Why it happens:**
`try/catch` blocks that don't include `finally { await context.close(); }`. Any await that throws (network timeout, Playwright timeout, unexpected HTML structure) skips the close call.

**How to avoid:**
Always use `try/finally` pattern:

```typescript
const browser = await chromium.launch();
const context = await browser.newContext();
try {
  const page = await context.newPage();
  await page.goto(url, { timeout: 8000 });
  // ... scraping ...
  return result;
} finally {
  await context.close(); // ALWAYS runs, even on throw
}
```

Additionally:
- Use a shared browser instance (launch once on service start, reuse across requests) rather than launching a new browser per request. Launching Chromium takes ~2-3 seconds and is the primary latency source.
- Set PM2 `max_memory_restart: "512M"` as a safety net — but don't rely on it as the primary protection.
- Add a request queue: process max 3 scraping requests in parallel to cap resource usage.

**Warning signs:**
- VM memory climbs over time and never falls (run `htop` on the VM)
- `ps aux | grep chrome` shows accumulating Chromium processes
- PM2 restart logs at irregular intervals

**Phase to address:**
Phase 2 ("I'm at a Show") — VM scraper service architecture, before any layer uses Playwright

---

### Pitfall 9: LLM Layer (Layer 6) Invents Artist Names — "Hallucinated" Founders

**What goes wrong:**
Layer 6 asks Claude (web search enabled): "What live music is happening at [venue] tonight?" Claude may return plausible-sounding but incorrect artist names, especially for small venues with no indexed events. These names are passed to the check-in flow as `confidence: "low"`, prefill the manual form, and the user (trusting the app) confirms them. The artist is created in the platform DB under a hallucinated name. A Founder badge is awarded. The artist is now permanently indexed with a fake name.

This is the hardest category to recover from — the data corruption is in the DB, spread to other users who might discover the hallucinated artist via Jukebox.

**Why it happens:**
LLMs fill uncertainty with confident-sounding answers. A prompt asking for "live music tonight at [venue]" will always get an answer — the model doesn't say "I don't know." Without grounding (a link, a booking URL, a flyer image), the answer is fabricated.

**How to avoid:**
- Only pass Layer 6 results to the UI as `confidence: "low"` — NEVER auto-collect from LLM results. The user must explicitly confirm AND paste a platform link to verify the artist exists.
- Require a platform link even for `confidence: "low"` results. The confirm UI says: "We think [Artist] might be playing. To add them, paste their Spotify/SoundCloud link." No link, no stamp.
- Log the source of every artist creation. If `source_layer = 6` and no platform link, flag for manual review.
- Do not use Layer 6 results as artist name suggestions in the autocomplete — only use them as the venue/show context (e.g., "might be a jazz night"), not as specific artist names.

**Warning signs:**
- Artists with names like "Local DJ" or "House DJ" appearing as Founders
- Artist profiles with no platform URL (spotify_url, soundcloud_url, apple_music_url all null)
- Founder badges awarded to artists that don't appear in any platform's database

**Phase to address:**
Phase 2 ("I'm at a Show") — Layer 6 result handling, confidence level gating

---

### Pitfall 10: Adding "discovery" Type to Collections Breaks Existing `capture_method` Queries

**What goes wrong:**
The v1.0 codebase models collection types via `capture_method` ("qr" | "nfc" | "location" | "online") in `PassportTimelineEntry` (see `/home/swarn/decibel-mobile/src/types/passport.ts:32`). The v3.0 PRD introduces a new `type` field ("find" | "stamp" | "discovery") as a separate semantic layer. If the migration adds a `type` column and new API endpoints filter on `type`, but the existing passport endpoint and `usePassportCollections` hook still filters on `capture_method`, the two systems describe overlapping concepts with different semantics.

The immediate breakage: the existing Stamps section on the current Passport screen filters by `capture_method: "location"` (verified live attendance). The new Stamps tab will filter by `type: "stamp"`. If these are not identical datasets in the DB, the old screen and new screen will show different items — and neither will be obviously wrong.

**Why it happens:**
Incremental schema evolution without a clear deprecation plan. The old column stays, a new column is added, two parallel concepts coexist in the DB and codebase with no enforced equivalence.

**How to avoid:**
- Map the semantic equivalence explicitly in the migration:
  - `capture_method: "location"` = `type: "stamp"`
  - `capture_method: "online"` = `type: "find"` (if it was a new artist add)
  - New: `type: "discovery"` (from Jukebox collect — no `capture_method` equivalent)
- Backfill the new `type` column from `capture_method` in the migration:
  ```sql
  ALTER TABLE collections ADD COLUMN IF NOT EXISTS collection_type TEXT;
  UPDATE collections SET collection_type =
    CASE capture_method
      WHEN 'location' THEN 'stamp'
      WHEN 'nfc' THEN 'stamp'
      WHEN 'qr' THEN 'stamp'
      WHEN 'online' THEN 'find'
      ELSE 'find'
    END
  WHERE collection_type IS NULL;
  ```
- Update ALL existing API endpoints and hooks to use `collection_type` instead of `capture_method` as the filter.
- Do not leave `capture_method` as the source of truth for any new UI — it's legacy.

**Warning signs:**
- Stamps section shows different count on old screen vs. new Passport tabs
- Existing `usePassportCollections` returns finds where only stamps are expected
- New "Discoveries" tab is always empty even after using Jukebox to collect

**Phase to address:**
Phase 3 (Glassy Passport Redesign) — DB migration must be the very first step, before any UI code is written

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Per-card BlurView in grid | Simple component model | GPU-heavy, blur-on-FlatList render bug, fragmented performance | Never — use single page-level blur layer |
| Don't pass `blurTarget` on Android (use old API) | Simpler code | Invisible cards on Android | Never — SDK 55 requires new API |
| Inline `onMessage` arrow function in WebView | Quick to write | BatchedBridge memory leak, crashes on long sessions | Never |
| Trust Layer 6 LLM results as confirmed artist names | Better UX for rare venue edge cases | Permanent hallucinated data in DB with Founder badges | Never — always require platform link confirmation |
| Use `capture_method` as the collection type filter in new UI | Avoid migration | Two parallel systems, diverging data, increasing confusion | Never — migrate at Phase 3 start |
| Launch new Playwright browser per scrape request | Simple implementation | Memory exhaustion on VM within hours | Acceptable only in development; production must reuse browser instance |
| Skip polling fallback for Supabase Realtime | Less code | Check-ins silently fail when iOS backgrounds the app | Never — polling fallback is required for production |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `expo-blur` SDK 55 on Android | Using `<BlurView intensity={40} tint="dark" />` without `BlurTargetView` | Wrap blurred content in `<BlurTargetView ref={ref}>`, pass ref to `blurTarget` prop |
| `expo-blur` blur intensity | Same `intensity` value on iOS and Android looks wildly different | Use `blurReductionFactor` or `Platform.select({ ios: 40, android: 80 })` |
| Spotify embed URL | Using `open.spotify.com/track/{id}` directly | Embed URL format: `open.spotify.com/embed/track/{id}?theme=0` — different path |
| SoundCloud widget embed | Using `soundcloud.com/artist/track` as embed src | Must use widget format: `w.soundcloud.com/player/?url={encoded_track_url}&auto_play=false` |
| Apple Music embed | Building embed URL from track URL | Format: `embed.music.apple.com/us/album/{albumId}?i={trackId}` — requires parsing albumId + trackId from original URL |
| Supabase Realtime on new table | Enabling realtime on table without SELECT RLS policy | Add `ALTER PUBLICATION supabase_realtime ADD TABLE search_results;` AND create SELECT policy for auth.uid() |
| VM scraper to Supabase | Using anon key from environment variable | Scraper must use service role key to bypass RLS; never commit this key to the VM repo |
| Playwright on shared browser | Calling `browser.close()` in a cleanup handler | Don't close the shared browser on request end — only close the page/context |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 12 BlurViews in Passport grid (one per card) | Dropped frames on scroll, high GPU usage | Single page-level BlurView, semi-transparent card backgrounds | Immediately on mid-range Android devices |
| 20 WebViews in Jukebox FlatList (all mounted) | 600+ MB memory usage, audio chaos | Max 3 active WebViews via onViewableItemsChanged, destroy off-screen ones | ~10 cards scrolled on low-end devices |
| Animated gradient orbs using CSS `@keyframes` (not reanimated) | Jank during scroll on JS thread | Use react-native-reanimated worklets for all animations; never `Animated.loop` on JS thread | First use on any device with background JS work |
| Re-subscribing to Supabase Realtime on every state change | WebSocket connection thrashed, duplicate events | Create channel once, use ref/memo, clean up only on unmount | Immediately if AppState listener isn't careful |
| Playwright launching new browser per check-in request | 3-second latency per request, memory blows up within hours | Single shared browser instance, context-per-request, finally-close pattern | ~20 concurrent requests |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Passing `fan_id` from client body to scraper endpoint | Any user can submit check-ins on behalf of another fan | Extract fan_id server-side from JWT at Vercel; pass it to VM scraper in the server-to-server request, not from client body |
| VM scraper service accessible on public IP without auth | Any internet user can trigger expensive LLM + Playwright scrapes | Add a shared secret header (`X-Scraper-Secret`) validated on the VM; Vercel includes this secret when calling the VM |
| Storing Anthropic API key in PM2 ecosystem.config.js committed to git | Key leaked in repo history | Use environment variables loaded from `.env` (gitignored), not hardcoded in ecosystem.config.js |
| `search_results` table without `user_id` column | Realtime RLS cannot filter per-user; all users receive all scrape results | Add `user_id` to `search_results` at table creation; include in RLS SELECT policy |
| Auto-collecting all lineup artists without user confirmation for new artists (Founders) | User receives Founder badge for an artist they've never heard of | Founder badge + Find creation requires explicit per-artist confirmation (shown in the lineup UI, not auto-collected) |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| "Finding what's playing here..." with no progress signal | User doesn't know if it's working or hung | Show animated scanning visualization with "Checking event databases... Checking social media..." layer-by-layer progress |
| Showing partial lineup confidence as "confirmed" | User collects artists who may not be playing, leading to distrust | Confidence tinting: high = green checkmark, medium = yellow "Looks like:", low = prefilled form with "Is this right?" |
| Jukebox plays music without visual "now playing" indicator | User confused about which card is playing | Active card gets a pulsing border/glow + volume icon — clear which embed is active |
| Discovery tab empty with no explanation for new users | Looks broken; no prompt to use Jukebox | Empty state: "Collect artists from Jukebox to build your Discovery collection. Tap Jukebox to start." with a direct tap-through |
| Glass cards with no haptic on tap | Tactile feedback expected on a "physical" passport metaphor | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` on every card press — already in PRD, verify it's actually wired up |

---

## "Looks Done But Isn't" Checklist

- [ ] **BlurView on Android:** Test on a physical Android device (not iOS simulator). Cards must show visual glass effect. Fallback to `rgba(21,21,28,0.85)` on Android API < 31 must not render invisible cards.
- [ ] **Jukebox audio conflict:** Play Spotify on device, open Jukebox — verify Spotify keeps playing. No embed should auto-play on mount.
- [ ] **WebView stop on scroll-away:** Scroll past 4 cards in Jukebox; verify audio from cards 1-4 has stopped. Check via `injectJavaScript` pause call fires before unmount.
- [ ] **Realtime subscription with app backgrounded:** Start check-in, background app for 5 seconds, return. Verify result still arrives (or polling fallback activates) — not just the 15s timeout.
- [ ] **RLS on search_results:** Verify a row inserted by scraper (service role) is received by the subscribing client. Test by inserting a row directly and checking realtime event fires.
- [ ] **Collection type migration:** Query `collections` table after migration; verify every row has a non-null `collection_type` value. Zero null rows acceptable.
- [ ] **Hallucinated artist prevention:** Confirm that a `confidence: "low"` check-in result from Layer 6 CANNOT create a collection without a platform link pasted by the user.
- [ ] **Playwright browser not leaked:** After 10 check-in requests in quick succession on the VM, run `ps aux | grep chrome` — should show 1 browser process (shared), not 10.
- [ ] **Discovery collection type visible in Passport:** After using Jukebox to collect one artist, verify it appears in the Discoveries tab (not Finds, not Stamps).
- [ ] **iOS audio session released on Jukebox exit:** After leaving Jukebox screen, background music resumes. Test explicitly: play music, open Jukebox, scroll through 3 cards, tap back — music should still be playing.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Hallucinated artist names in DB as Founders | HIGH | Add `source_layer` column to track creation source; identify `source_layer=6` + no platform URL rows; contact users who collected them; delete + revoke badges |
| BlurView invisible on Android (wrong API) | LOW | Component-level fix only; no data affected; redeploy OTA update |
| Memory exhaustion on VM scraper | MEDIUM | PM2 restart recovers service; then fix Playwright `finally` blocks; in-flight check-ins during crash will timeout to manual form |
| Realtime subscription never fires (RLS blocked) | LOW | Add SELECT policy migration; no data loss; users who failed to check in must re-try |
| collection_type null rows after partial migration | MEDIUM | Run backfill SQL again (idempotent via WHERE IS NULL); force TanStack Query cache invalidation on next app open |
| Duplicate audio from multiple WebViews | LOW | Add `injectJavaScript` pause call before unmount; OTA deploy |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| BlurView Android API change (BlurTargetView required) | Phase 3 start — day 1 | Test on physical Android before writing any glass card; check `blurMethod` prop is set |
| BlurView before FlatList dynamic content | Phase 3 — architecture decision | Single page-level BlurView confirmed in design; no per-card BlurView in grid |
| WebView audio ducking on iOS | Phase 1 (Jukebox) — WebView config | Play Spotify, open Jukebox, verify no audio interruption |
| WebView onMessage BatchedBridge leak | Phase 1 (Jukebox) — WebView implementation | No `onMessage` prop on Jukebox WebViews (not needed); all other WebViews use useCallback |
| Unmounted WebView continues playing audio | Phase 1 (Jukebox) — viewability tracking | Scroll past 4 cards; verify audio stops via device speakers |
| Supabase Realtime iOS background reconnect loop | Phase 2 (check-in) — subscription setup | Background app during 15s scrape window; verify result received or polling fallback activates |
| RLS silently blocks Realtime events | Phase 2 (check-in) — DB schema setup | CREATE SELECT policy before any realtime test |
| Playwright memory leak on VM | Phase 2 (check-in) — VM scraper architecture | Implement shared browser + context-per-request + finally-close pattern from day 1 |
| Layer 6 LLM hallucinated artist names | Phase 2 (check-in) — Layer 6 integration | Require platform link for all confidence:low collects; no auto-collect from LLM names |
| collection_type migration breaks existing passport queries | Phase 3 (Glassy Passport) — DB migration step | Run migration before building any new UI; verify zero null collection_type rows |

---

## Sources

- `expo-blur` SDK 55 docs: https://docs.expo.dev/versions/latest/sdk/blur-view/ — BlurTargetView requirement for Android confirmed
- expo/expo GitHub Discussion #37905: Android BlurView V3 upgrade requirements for SDK 55
- expo/expo Issue #23239: SDK 49+ Android blur performance regression (affects all versions through 55)
- react-native-webview Issue #3205: iOS WebView audio ducks background Spotify playback
- react-native-webview Issue #3168 + #3152: Memory leak via `onMessage` prop change and BatchedBridge accumulation
- supabase/realtime Issue #1088: Realtime reconnection stuck in CLOSED loop on iOS
- drdroid.io — Supabase Realtime client-side memory leak stack diagnosis: https://drdroid.io/stack-diagnosis/supabase-realtime-client-side-memory-leak
- Supabase Realtime + RLS docs: https://supabase.com/docs/guides/realtime/postgres-changes — "SELECT permissions are essential for Realtime to function properly, even if your application logic doesn't directly use SELECT operations"
- Playwright Issue #15400: Memory leak from unclosed browser contexts in long-running Node.js processes
- `/home/swarn/decibel-mobile/src/components/checkin/StampAnimationModal.tsx` — existing BlurView usage with old API (no BlurTargetView); will break on Android with new content-behind-it use cases
- `/home/swarn/decibel-mobile/src/types/passport.ts` — `capture_method` field; documents the semantic mismatch with v3.0 `type` field

---

*Pitfalls research for: Decibel Mobile v3.0 — Glassy Passport, Jukebox embedded players, check-in scraping waterfall, Supabase Realtime, collection type migration*
*Researched: 2026-03-12*
