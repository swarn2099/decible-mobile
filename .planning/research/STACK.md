# Stack Research

**Domain:** React Native + Expo — Decibel v3.0 new features (Glassy Passport, Jukebox, I'm at a Show)
**Researched:** 2026-03-12
**Confidence:** HIGH — verified against actual codebase (package.json, existing scripts), official Expo docs, and npm

---

## Context: What Already Exists (Do NOT Re-research)

The following is the confirmed installed stack in `~/decibel-mobile/package.json`. Nothing here needs installing:

| Already Installed | Version | Notes |
|-------------------|---------|-------|
| Expo SDK | ~55.0.5 | Lock — do not upgrade mid-milestone |
| React Native | 0.83.2 | New Architecture only (Paper dropped in SDK 55) |
| expo-blur | ~55.0.8 | Already installed — core for glassmorphism |
| expo-linear-gradient | ~55.0.8 | Already installed — use for gradient orbs |
| react-native-reanimated | 4.2.1 | Already installed — use for orb animation |
| react-native-gesture-handler | ~2.30.0 | Already installed |
| lottie-react-native | ~7.3.4 | Already installed |
| expo-haptics | ~55.0.8 | Already installed |
| expo-location | ~55.1.2 | Already installed |
| @supabase/supabase-js | ^2.99.0 | Realtime already built into client |
| @tanstack/react-query | ^5.90.21 | Already installed |
| zustand | ^5.0.11 | Already installed |

**The existing VM (`~/decibel/`) already has Playwright `^1.58.2` installed as a dev dependency and Node.js 20.20.0. The backend scraper patterns already exist in `~/decibel/scripts/scrapers/`.**

---

## New Libraries Required for v3.0

### 1. react-native-pager-view (Gesture Tab Swiping — Passport)

**Install:** `npx expo install react-native-pager-view`

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-native-pager-view | 8.0.0 (latest, `npx expo install` resolves correct version) | Swipeable tab pager for Stamps / Finds / Discoveries | New Architecture-only from v7+, matches SDK 55's mandatory New Architecture. Expo's own docs recommend it over manual ScrollView paging. callstack maintains it actively. |

**Why not a manual ScrollView/FlatList swipe:** Pager view handles the gesture competition with nested scrollables (the card grids) correctly. A horizontal ScrollView inside a vertical ScrollView creates gesture conflict on iOS that requires per-platform workarounds. `react-native-pager-view` handles this natively.

**Why not `react-native-tab-view`:** `react-native-tab-view` is a higher-level component that wraps `react-native-pager-view`. It adds a tab bar — but the Passport needs a *custom* frosted glass tab bar, not the default one. Using the raw `react-native-pager-view` and building a custom tab indicator on top is cleaner.

**Integration note:** SDK 55 uses New Architecture exclusively. `react-native-pager-view` v7+ supports New Architecture only. This is the correct version pair.

---

### 2. react-native-webview (Embedded Music Players — Jukebox)

**Install:** `npx expo install react-native-webview`

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-native-webview | ~13.16.0 (Expo resolves correct version) | Render Spotify/SoundCloud/Apple Music embed iframes | The only viable approach for platform-hosted embeds. All three music platforms provide oEmbed/iframe embed URLs specifically for this use case. Runs in an isolated web context — no SDK required on the mobile app side. |

**Lazy loading pattern (critical for Jukebox performance):**

The PRD requires max 3 active WebViews at once. The pattern is:

```tsx
// Use FlatList's onViewableItemsChanged callback
const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

const onViewableItemsChanged = useCallback(({ viewableItems }) => {
  setVisibleIds(new Set(viewableItems.map(i => i.key)));
}, []);

// In each card: only mount WebView when visible
{visibleIds.has(item.id) ? (
  <WebView source={{ uri: item.embedUrl }} style={{ height: 152 }} />
) : (
  <View style={styles.playerPlaceholder} /> // static thumbnail fallback
)}
```

**Do NOT mount WebViews on screen load.** Each WebView spawns a browser process — mounting 10+ simultaneously causes jank and memory pressure on iOS.

**Android-specific note:** WebViews on Android require `allowsInlineMediaPlayback` and `mediaPlaybackRequiresUserAction={true}` to prevent auto-play. Spotify/SoundCloud embeds respect `auto_play=false` in the URL, but the prop ensures system-level compliance.

**iOS-specific note:** Set `allowsInlineMediaPlayback={true}` to prevent the embed from hijacking full-screen playback.

**Embed URL formats to use on the backend (cache in Supabase):**
- Spotify: `https://open.spotify.com/embed/track/{trackId}?theme=0&utm_source=generator`
- SoundCloud: `https://w.soundcloud.com/player/?url={trackUrl}&color=%23FF4D6A&auto_play=false&show_artwork=true&hide_related=true`
- Apple Music: `https://embed.music.apple.com/us/album/{albumId}?i={trackId}&app=music`

---

### 3. expo-blur v55 — Breaking Change for Android (Glassmorphism)

**Already installed** at `~55.0.8`. But SDK 55 changed the Android API significantly — this is a breaking change from prior usage patterns.

**The SDK 55 Android breaking change:**

Prior to SDK 55, `BlurView` on Android was unreliable and hidden behind an experimental flag. In SDK 55, Android blur uses the RenderNode API (Android 12+) via `BlurView V3`. This is now the default but requires a different component structure:

```tsx
// OLD pattern (SDK < 55) — do NOT use
<BlurView intensity={40} tint="dark">
  <CardContent />
</BlurView>

// NEW pattern (SDK 55) — required for Android blur
import { BlurView, BlurTargetView } from 'expo-blur';

const blurRef = useRef(null);

<BlurTargetView ref={blurRef} style={styles.card}>
  <CardContent />
</BlurTargetView>
<BlurView
  blurTarget={blurRef}
  intensity={40}
  tint="dark"
  blurMethod="dimezisBlurViewSdk31Plus"
/>
```

**`blurMethod` options:**
- `"dimezisBlurView"` — blur on all Android versions (RenderScript on < API 31, RenderNode on 31+)
- `"dimezisBlurViewSdk31Plus"` — blur only on Android 12+ (API 31+), falls back to semi-transparent on older — **use this for the passport cards**
- `"none"` — renders a semi-transparent background instead of blur (safe fallback)

**Recommendation:** Use `blurMethod="dimezisBlurViewSdk31Plus"` on the passport card `BlurView`. This gives true frosted glass on modern Android (the vast majority of users in 2026) and gracefully degrades on older devices without breaking.

**iOS behavior is unchanged** — `BlurView` works as before on iOS, no `BlurTargetView` needed.

---

## VM Scraper Service — New Infrastructure

The "I'm at a Show" scraping waterfall runs on the DigitalOcean VM, not on Vercel. This is a new Express.js service separate from the existing scraper scripts in `~/decibel/scripts/scrapers/`.

### Core Technologies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Express.js | ^5.1.0 | HTTP server for scraper service endpoint | Already the VM standard, consistent with Node.js 20. Single endpoint — no need for a heavier framework. |
| Playwright | ^1.58.2 | Headless browser for venue website scraping | **Already installed in `~/decibel/` as a dev dependency at this exact version.** Use the existing installation — do not install separately in the new service. The browser binaries are already present on the VM. |
| @anthropic-ai/sdk | ^0.39.0 (verify with `npm info @anthropic-ai/sdk version`) | LLM layer for Layer 6 — artist name extraction from noisy text | Requires Node.js 20+ (VM is 20.20.0 — compatible). Used for parsing social media captions and venue calendar HTML. |
| @supabase/supabase-js | ^2.99.0 | Write scrape results to `search_results` table | Match the version already in the mobile app to avoid divergence. Use service role key. |
| PM2 | ^5.x (already on VM or `npm install -g pm2`) | Process manager for the scraper service | PRD calls for PM2 explicitly. Keeps service alive across crashes, handles restarts, logs to file. More reliable than tmux for a long-running HTTP service. |

**Do NOT create a separate `~/decibel-scraper/` project.** Create the scraper service at `~/decibel/scraper/` — it's architecturally part of the Decibel backend and already shares Playwright, Supabase client config, and TypeScript tooling with the existing scripts.

**Directory structure recommendation:**
```
~/decibel/scraper/
  index.ts          — Express server, single POST /api/scrape-event endpoint
  layers/
    layer1-db.ts    — Supabase venue/event lookup (runs on Vercel, not here)
    layer2-apis.ts  — RA, DICE, EDMTrain, Songkick, Bandsintown
    layer3-places.ts — Google Places reverse geocode
    layer4-social.ts — Instagram, Facebook, Twitter scraping
    layer5-website.ts — Playwright headless venue website scrape
    layer6-llm.ts   — Anthropic SDK LLM search augmentation
  ecosystem.config.js — PM2 config
```

**PM2 ecosystem.config.js:**
```js
module.exports = {
  apps: [{
    name: 'decibel-scraper',
    script: 'npx tsx scraper/index.ts',
    cwd: '/home/swarn/decibel',
    env: { NODE_ENV: 'production', PORT: 3001 },
    max_memory_restart: '512M',
    restart_delay: 3000,
  }]
};
```

**Security:** The scraper service endpoint must verify a shared secret (`X-Scraper-Secret` header) from the Vercel API before processing any request. This prevents external actors from triggering scrape jobs.

---

## Supabase Realtime — No New Library Required

`@supabase/supabase-js@^2.99.0` is already installed and includes Realtime. This is confirmed by reviewing the existing mobile app installation.

**The pattern for subscribing to scrape results in the mobile app:**

```typescript
// Subscribe to search_results for a specific searchId
const channel = supabase
  .channel(`search-${searchId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'search_results',
    filter: `search_id=eq.${searchId}`,
  }, (payload) => {
    // Handle result — unmount loading state, show venue + lineup
    onResultReceived(payload.new);
    supabase.removeChannel(channel); // clean up immediately
  })
  .subscribe();

// 15-second timeout
const timeout = setTimeout(() => {
  supabase.removeChannel(channel);
  onTimeout(); // show manual fallback form
}, 15_000);
```

**Critical:** Always call `supabase.removeChannel(channel)` after receiving a result or on timeout. Orphaned realtime connections drain battery and hit Supabase's concurrent connection limits.

**Supabase requirement:** The `search_results` table must have realtime enabled. This is done via SQL migration:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE search_results;
```

---

## Animated Gradient Orbs (Passport Background) — No New Library

**Use `expo-linear-gradient` (already installed at `~55.0.8`) + `react-native-reanimated` (already at 4.2.1).**

Do NOT add `@shopify/react-native-skia` just for background orbs. It's a heavy native module and overkill for slow-moving decorative circles.

**Implementation pattern:**

```tsx
// Slow-moving blurred orb: absolute position circle with LinearGradient + Reanimated
const orbX = useSharedValue(0);
const orbY = useSharedValue(0);

useEffect(() => {
  orbX.value = withRepeat(
    withSequence(
      withTiming(40, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
      withTiming(-20, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
    ),
    -1, true
  );
  // similar for orbY
}, []);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: orbX.value }, { translateY: orbY.value }],
}));

<Animated.View style={[styles.orb, animatedStyle]}>
  <LinearGradient
    colors={['rgba(255, 77, 106, 0.15)', 'rgba(155, 109, 255, 0.08)', 'transparent']}
    style={styles.orbGradient}
  />
</Animated.View>
```

**Key trick:** Keep orb `opacity` at 0.4-0.6 and `borderRadius` at the full width/height (making a circle). The BlurView on the cards above the orbs will blur the orb colors, creating the frosted glass "blurring against something colorful" effect. The orbs themselves do not need to be blurred — their soft gradient edges are sufficient.

**Performance:** Set `useNativeDriver: true` equivalent via Reanimated worklets (Reanimated 4 runs on UI thread by default). Keep to 2-3 orbs maximum. Animate `transform` only (translate) — never animate `width`, `height`, or `backgroundColor` as those trigger layout recalculation.

---

## Installation Summary

```bash
# Mobile app — two new libraries
npx expo install react-native-pager-view
npx expo install react-native-webview

# VM scraper service — from ~/decibel directory
npm install express
npm install @anthropic-ai/sdk
# Playwright is already installed — do NOT reinstall
# @supabase/supabase-js is already installed — do NOT reinstall

# PM2 (global, on VM)
npm install -g pm2
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `react-native-pager-view` (raw) | `react-native-tab-view` | If you want a pre-built tab bar with standard styling. For Decibel's custom frosted glass tab indicator, raw pager-view is correct. |
| `react-native-webview` with lazy mount | `react-native-webview` always mounted | Never — always lazy mount in feeds. Each WebView is a separate browser process. |
| `BlurTargetView` + `BlurView` pair (SDK 55 pattern) | Old single-component `BlurView` wrap | Only valid on iOS-only builds. For Android support, use the SDK 55 pattern. |
| Reanimated + LinearGradient for orbs | `@shopify/react-native-skia` | Only if you need real-time canvas rendering (e.g., particle systems, complex path animations). Slow-moving orbs don't need it. |
| Express.js scraper on VM | Python FastAPI | Python FastAPI is valid but introduces a second language on the VM. Node.js matches the existing TypeScript scraper scripts exactly. |
| Scraper in `~/decibel/scraper/` | Standalone `~/decibel-scraper/` | Standalone repo adds CI/CD overhead. The scraper shares Playwright, Supabase config, and TypeScript setup with the existing `~/decibel/` project. |
| PM2 | tmux session | tmux sessions do not survive reboots. PM2 handles restarts, crash recovery, log rotation, and `startup` config for auto-launch on VM reboot. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| CSS `backdrop-filter` polyfill | Not applicable to React Native | `expo-blur` `BlurView` (already installed) |
| `@shopify/react-native-skia` for orbs | 8MB+ native module for decorative background animation | Reanimated + `expo-linear-gradient` (both already installed) |
| Old `BlurView` wrap pattern (pre-SDK 55) | Broken on Android in SDK 55 — requires new `BlurTargetView` + `blurTarget` ref pattern | See SDK 55 BlurView section above |
| `react-native-tab-view` | Higher-level wrapper adds a default tab bar that fights a custom glass tab indicator | `react-native-pager-view` (raw) + custom tab bar component |
| `@react-native-community/viewpager` | Deprecated predecessor to `react-native-pager-view` | `react-native-pager-view` v8 |
| Mounting all WebViews on screen load | Each WebView spawns a browser process. 10 Jukebox cards = 10 browser processes = app kill on low-memory devices | Lazy mount via `onViewableItemsChanged`, max 3 active |
| Vercel for scraping waterfall | Vercel has a 60-second (Pro) function timeout and no persistent process. Playwright headless browsers cannot run on Vercel Edge. | Express.js on DigitalOcean VM |
| `window.EventSource` / SSE for scrape results | Requires HTTP long-polling, not available in React Native's fetch | Supabase Realtime channel subscription (already built into `@supabase/supabase-js`) |
| Polling `/api/scrape-status` endpoint | Wasteful, adds latency on result delivery, hammers the API on 15-second wait | Supabase Realtime INSERT subscription on `search_results` filtered by `search_id` |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| react-native-pager-view 8.0.0 | React Native 0.83.2, New Architecture | v7+ is New Architecture only — required for SDK 55 |
| react-native-webview ~13.16.x | Expo SDK 55, React Native 0.83.x | `npx expo install` resolves correct compatible version |
| expo-blur ~55.0.8 | SDK 55 | Breaking change on Android: requires `BlurTargetView` + `blurTarget` ref pattern. iOS unchanged. |
| @anthropic-ai/sdk ^0.39.x | Node.js 20.20.0 (VM) | Requires Node 20+ — VM is already 20.20.0 |
| Playwright ^1.58.2 | Node.js 20.x | Already installed in `~/decibel/`. Browser binaries already present. |
| PM2 5.x | Node.js 20.x | Install globally on VM. Not a project dependency. |
| Supabase Realtime | @supabase/supabase-js ^2.99.0 | Built-in. Filter syntax: `column=eq.value`. Always clean up channel on result or timeout. |

---

## Sources

- `/home/swarn/decibel-mobile/package.json` — current installed packages (HIGH confidence)
- `/home/swarn/decibel/package.json` — Playwright ^1.58.2 already installed, Node.js 20.20.0 confirmed (HIGH confidence)
- `/home/swarn/decibel/scripts/scrapers/` — existing scraper patterns (HIGH confidence)
- [Expo BlurView docs (SDK 55)](https://docs.expo.dev/versions/latest/sdk/blur-view/) — `BlurTargetView` breaking change, `blurMethod` prop, Android RenderNode API (HIGH confidence)
- [expo-blur SDK 55 discussion](https://github.com/expo/expo/discussions/37905) — `dimezisBlurViewSdk31Plus` fallback behavior confirmed (HIGH confidence)
- [Expo SDK 55 changelog](https://expo.dev/changelog/sdk-55) — New Architecture mandatory, SDK version alignment (HIGH confidence)
- [react-native-pager-view npm](https://www.npmjs.com/package/react-native-pager-view) — v8.0.0 latest, v7+ New Architecture only (HIGH confidence)
- [react-native-webview npm](https://www.npmjs.com/package/react-native-webview) — 13.16.1 latest (HIGH confidence)
- [Supabase Realtime subscribe docs](https://supabase.com/docs/reference/javascript/subscribe) — `postgres_changes` filter syntax `column=eq.value` (HIGH confidence)
- [@anthropic-ai/sdk npm](https://www.npmjs.com/package/@anthropic-ai/sdk) — Node.js 20+ requirement confirmed (HIGH confidence)
- [DigitalOcean PM2 tutorial](https://www.digitalocean.com/community/tutorials/how-to-use-pm2-to-setup-a-node-js-production-environment-on-an-ubuntu-vps) — PM2 ecosystem.config.js pattern (HIGH confidence)

---

*Stack research for: Decibel Mobile v3.0 — Glassy Passport, Jukebox, I'm at a Show*
*Researched: 2026-03-12*
