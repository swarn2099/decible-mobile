# Pitfalls Research

**Domain:** Live music passport mobile app — URL parsing, Spotify listener scraping, GPS venue matching, server-side share card generation, stamp animation
**Researched:** 2026-03-10
**Confidence:** HIGH (drawn from existing codebase, v4 bugs, and backend implementation patterns)

---

## Critical Pitfalls

### Pitfall 1: Spotify HTML Scrape Returns Zero and Gets Treated as "Under Threshold"

**What goes wrong:**
`scrapeMonthlyListeners()` fetches the Spotify artist HTML page and regex-matches `([\d,]+)\s*monthly listeners`. If Spotify changes their HTML structure, blocks the request, or returns a 429, the function returns `0`. Since `0 < 1_000_000`, the eligibility check passes — a mainstream artist with 10M listeners gets added to Decibel because the scrape silently failed.

The existing backend (`src/lib/spotify.ts:115`) already does this exact pattern. It's the current approach and it will silently pass ineligible artists through when Spotify returns anything unexpected.

**Why it happens:**
The function is written with a broad `catch` that returns `0` on any error — a reasonable "fail open" choice for scraping, but catastrophic when the return value is the eligibility gatekeeper.

**How to avoid:**
Return a sentinel (`null`) instead of `0` on scrape failure. In the eligibility check, treat `null` (scrape failed) differently from `0` (genuinely new/unknown artist). If `null`, either retry once or apply a conservative default (flag for manual review, allow add but tag as `listener_count_unverified: true`). Never silently pass mainstream artists.

```typescript
// Bad: 0 passes the < 1M check
async function scrapeMonthlyListeners(id: string): Promise<number> {
  try { ... } catch { return 0; } // 0 = eligible, wrong!
}

// Good: null = unknown, 0 = verified zero
async function scrapeMonthlyListeners(id: string): Promise<number | null> {
  try { ... } catch { return null; } // caller decides
}
```

**Warning signs:**
- Artists you know are mainstream (Taylor Swift, Drake) appear as eligible
- Scrape hit rate drops — monitor with a counter, log when `null` returned
- Spotify changes the "monthly listeners" text phrasing

**Phase to address:**
Phase 2 — Link-Paste Add Flow (validate-artist-link endpoint)

---

### Pitfall 2: GPS Accuracy Variance Blows the 200m Haversine Match

**What goes wrong:**
iOS and Android GPS accuracy varies dramatically — indoors (most venues), accuracy can degrade to 50-500m circular error. The current `DEFAULT_GEOFENCE_RADIUS = 200` in `useVenueDetection.ts` means a user inside a basement venue with poor GPS signal may not match any nearby venue at all, even when physically present. The opposite is also true: at 200m radius, two adjacent venues in a dense area (e.g., Wicker Park, Chicago) may both match.

**Why it happens:**
200m was chosen as a reasonable geofence but wasn't tested against real indoor GPS accuracy. Expo's `getCurrentPosition()` returns whatever the OS gives — no accuracy thresholding is applied before the haversine comparison.

**How to avoid:**
- Read `position.coords.accuracy` from the GPS result. If accuracy > 300m, either reject and ask user to step outside briefly, or expand the match radius proportionally.
- Store `geofence_radius` per venue in the DB (already on the schema). Set 300m for large outdoor venues, 100m for buildings with clear GPS sightlines.
- Add a "Can't find your venue?" fallback that lets the user pick from a list of venues within 1km.
- Never fail silently — tell the user "GPS accuracy is low, try moving outside" rather than "No venues detected."

**Warning signs:**
- Users reporting they can't check in even when at the venue
- `position.coords.accuracy` consistently > 200 in test scenarios
- Users matching the wrong venue

**Phase to address:**
Phase 3 — Check-In Flow

---

### Pitfall 3: SoundCloud URL Parser Breaks on Non-Artist Pages

**What goes wrong:**
The existing `parseArtistUrl()` in v4 handles `soundcloud.com/{username}` correctly but fails on:
- Track pages: `soundcloud.com/artist-name/track-name` (2 segments — currently returns null correctly, but user gets no feedback)
- Set/playlist pages: `soundcloud.com/artist-name/sets/setname` (3 segments)
- Reposts: `soundcloud.com/artist-name/reposts` (2 segments)
- Mobile redirect URLs: `m.soundcloud.com/{username}` (handled by the `m.` strip, but verify)
- Short URLs from the app share sheet: `snd.sc/XXXX` (not handled at all)

The user pastes a track link instead of an artist link, the parser returns null, and they get a generic "Can't find an artist in this link" error — with no guidance on what to paste.

**Why it happens:**
Most users navigate to an artist by clicking a track in their feed, then share that track URL — not the artist profile URL. The distinction between track and artist URLs is not obvious to users.

**How to avoid:**
- Detect the track/set page case (2+ segments on SoundCloud) and return a specific error: "That's a track link — paste the artist profile link instead: soundcloud.com/artist-name"
- Consider: extract the username from track URLs (`segments[0]`) and treat it as the artist, rather than rejecting. This is arguably the right UX since we know the artist.
- Add `snd.sc` short URL resolution via HTTP redirect follow (a `HEAD` request to the short URL will redirect to the canonical).
- For Apple Music, detect `music.apple.com/us/artist/{name}/{id}` vs album/song paths similarly.

**Warning signs:**
- High abandonment on the Add flow ("can't find an artist" errors in logs)
- User complaints about link paste not working
- Users pasting SoundCloud track/set URLs (most common mistake)

**Phase to address:**
Phase 2 — Link-Paste Add Flow

---

### Pitfall 4: Apple Music Has No Unofficial API — Cross-Referencing by Name Is Unreliable

**What goes wrong:**
The PRD says "Apple Music artists: cross-reference on Spotify by name. If not found on Spotify, default to eligible." Name matching between Apple Music and Spotify is inherently brittle:
- Artists with generic names (e.g., "Disclosure", "Four Tet") may match wrong artist
- Different capitalization, punctuation, or slight name variations cause misses
- An artist not on Spotify at all (legitimately underground) gets a free pass — which is actually the PRD's intended behavior, but creates a loophole for artists who are mainstream on Apple Music only

Apple's official MusicKit JS API requires user login on web and only works in browsers. The MusicKit server token (JWT) approach works for authenticated requests but not for arbitrary artist lookups without the user's library token.

**How to avoid:**
- For Apple Music links, parse the artist ID from the URL (`music.apple.com/us/artist/{name}/{id}` — the numeric ID is the canonical identifier)
- Use the Apple Music API catalog endpoint with a developer JWT (not user token) for artist lookup: `GET /v1/catalog/{storefront}/artists/{id}`
- The Apple Music developer token is a JWT signed with your MusicKit private key — it's separate from the user token and works for catalog queries without user auth
- Cache listener/popularity data — Apple Music doesn't expose monthly listeners, but `relationships.albums` count and popularity score serve as a proxy
- For eligibility: fall back to Spotify name-match only when Apple catalog lookup fails, not as primary strategy

**Warning signs:**
- Apple Music links returning wrong artist data
- Generic names matching incorrect Spotify artists
- Apple Music API 401s (developer JWT expired — they last 6 months max, need rotation)

**Phase to address:**
Phase 2 — Link-Paste Add Flow

---

### Pitfall 5: ImageResponse / Satori Doesn't Support All CSS — Share Cards Break Silently

**What goes wrong:**
Next.js `ImageResponse` (which wraps Satori) renders JSX to PNG using a subset of CSS. Unsupported properties silently have no effect rather than throwing errors. Common traps:
- `background-clip: text` for gradient text — not supported, text renders transparent/invisible
- `gap` on flex containers — partially supported, but verify
- `flexWrap` — supported but `wrap-reverse` is not
- Custom fonts — must be loaded as ArrayBuffer, not via CSS `@import` or Google Fonts URL
- `border-radius` on images — works but only with `overflow: hidden` explicitly set
- `background: linear-gradient(...)` on text — not supported the same way as HTML canvas

The existing share cards in `src/app/api/passport/share-card/route.tsx` already use `display: "flex"` correctly (required on every element, not just containers). But the founder share card and passport mobile card are new and will likely hit these same issues.

**Why it happens:**
Developers write the JSX as they would for a browser, test locally, and it looks fine in Vercel's edge runtime — but subtle CSS is silently dropped.

**How to avoid:**
- Test every share card endpoint with `curl` + save the PNG output before wiring up the mobile app
- Never use gradient text (`backgroundClip: "text"` + `color: "transparent"`) — use a colored `<div>` as a block instead or use `fill` on an SVG element
- Load Poppins font as ArrayBuffer via fetch from a self-hosted URL (not Google Fonts) and pass to `ImageResponse` options
- Reference existing working share cards in the codebase as templates — the pattern is already proven

**Warning signs:**
- Share card renders black rectangle or blank area where text should be
- Gradient text is invisible (transparent)
- Font fallback to system sans-serif instead of Poppins

**Phase to address:**
Phase 5 — Share and Virality

---

### Pitfall 6: Stamp Animation Causes Layout Jank if Not Isolated from Scroll Context

**What goes wrong:**
The rubber stamp animation (scale + translateY slam + ink spread) typically uses React Native `Animated` or `react-native-reanimated`. If the animation is rendered inside a `ScrollView`, the transform can interact with the scroll offset and cause:
- Jitter during the slam if the scroll view re-renders during animation
- The animation running on the JS thread (with `Animated`) causing dropped frames on lower-end devices
- Lottie animations blocking the main thread if large enough

The stamp animation spec calls for haptic feedback on contact, which must be precisely timed with the visual hit frame. If the JS thread is busy, haptics fire late — the mismatch feels wrong immediately.

**How to avoid:**
- Render the stamp animation in a `Modal` or `Portal` above the scroll view, not inside it
- Use `react-native-reanimated` (runs on UI thread) not `Animated` API (runs on JS thread) for the slam/bounce keyframes
- Fire haptics in a `runOnJS` callback from within the reanimated worklet, at the frame when scale reaches minimum (the "contact" point)
- Keep the Lottie ink-spread animation small (< 100KB JSON) and pre-loaded
- Test on an actual device, not simulator — haptic + animation sync only works on hardware

**Warning signs:**
- Animation looks fine on simulator but feels laggy on device
- Haptic fires 200ms after the visual stamp contact
- FPS drops during the stamp slam sequence (check with Flipper or React Native DevTools)

**Phase to address:**
Phase 4 — Passport Redesign (stamp animation is part of the check-in celebration, Phase 3/4 boundary)

---

### Pitfall 7: Check-In Window Is Ambiguous — Users Check In at 2am for Yesterday's Show

**What goes wrong:**
The current `useVenueDetection.ts` uses `todayDate()` which is `new Date().toISOString().slice(0, 10)` — UTC date. A user at a show in Chicago at 1am on Friday night is actually in UTC Saturday. If the event is stored as `2026-03-13` (Friday in Chicago), the UTC date is `2026-03-14`, and no events are found.

Additionally, shows that run past midnight (common for late-night electronic events — the primary Decibel use case) are not covered by a strict "today" filter.

**Why it happens:**
UTC vs local time handling is easy to get wrong. ISO date strings are convenient but ignore timezone.

**How to avoid:**
- Store event dates in the DB as the local Chicago date (the date as advertised), which is already the convention
- In the venue detection query, match against yesterday AND today (or expand to a ±24h window)
- Better: pass the user's local date from the client, not compute it server-side from UTC
- For the check-in API, accept an explicit `event_date` from the client rather than computing it on the backend

**Warning signs:**
- Users at late-night events (after midnight) can't check in
- Events from the previous night show up as "no events" at 1-2am
- Timezone confusion in event date display

**Phase to address:**
Phase 3 — Check-In Flow

---

### Pitfall 8: Duplicate Collection Entries When User Taps Check-In Button Multiple Times

**What goes wrong:**
The check-in flow involves: GPS match → fetch lineup → user taps "Collect" per artist. If the user taps collect twice (impatient tap, double-tap), or navigates away and back, the API may insert duplicate rows in `collections`. The existing `add-artist` endpoint relies on a unique constraint violation (`error.code === "23505"`) to detect duplicates — that's the right pattern, but it must be applied consistently to the check-in endpoint too.

**Why it happens:**
The collect button disables during the pending state (`collectingId === performer.id`) but if the state resets (navigation event, component unmount) before the mutation completes, a second tap is possible.

**How to avoid:**
- Add a unique constraint on `collections(fan_id, performer_id, capture_method)` if not already present — the DB should be the final dedup gate
- On the client, use a `Set` of in-flight performer IDs (not just a single `collectingId` string) so multiple simultaneous collects are tracked
- Return `{ already_collected: true }` from the API on duplicate rather than an error — treat it as idempotent success

**Warning signs:**
- `collections` table has duplicate `(fan_id, performer_id)` rows
- Users see the same artist appear twice in their passport
- 500 errors from the check-in endpoint instead of graceful duplicate handling

**Phase to address:**
Phase 3 — Check-In Flow

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Fetch all venues client-side for Haversine | Simple, no backend join needed (Chicago-only set is small) | Breaks if venue count grows past ~500 or goes multi-city | Acceptable for MVP, add server-side spatial query before multi-city expansion |
| HTML scrape for Spotify monthly listeners | No API contract, works today | Can break with any Spotify frontend deploy; rate limited | Acceptable short-term; cache results in DB and re-scrape on demand only |
| Apple Music cross-reference by name only | Zero API setup required | Wrong artist matches for common names | Never — use Apple Music catalog API with developer JWT |
| ImageResponse edge function with inline styles | Proven pattern, no build tooling | CSS subset limitations bite on new card designs | Acceptable — but test every new card with curl before shipping |
| UTC date for event matching in venue detection | Simplest implementation | Misses late-night shows for US Eastern/Central time | Never — always use local date from client |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Spotify API (Client Credentials) | Assuming followers/genres come back in search results | Client Credentials flow does NOT return followers/genres — only user OAuth token does. Use the refresh token flow in `src/lib/spotify.ts` |
| Spotify HTML scrape | Treating scrape failure (exception/non-200) as "0 listeners" | Return `null` on failure; treat null as "unknown" not "eligible" |
| Apple Music API | Using MusicKit JS (browser-only) in a server context | Use the REST catalog API with a developer JWT (server-signed, not user token) |
| SoundCloud API | Using the hardcoded `client_id` from v4 (`nIjtjiYnjkOhMyh5xrbqEW12DxeJVnic`) | This is an unofficial client ID scraped from the web player. It will rotate without notice. Apply for official API access or build with the expectation it breaks. |
| Expo Location | Calling `getCurrentPosition()` without checking `accuracy` | Always read `coords.accuracy` and handle the high-error case explicitly |
| ImageResponse fonts | Loading Poppins via Google Fonts URL | Must fetch as ArrayBuffer. Use a hosted static URL (Vercel public folder or CDN), not a Google Fonts CSS URL |
| Supabase JWT auth in new API endpoints | Using anon key for service operations | Always use `SUPABASE_SERVICE_ROLE_KEY` for server-side mutations. The anon key respects RLS and will 403 |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching all venues in client-side Haversine | Slow first load if venue count grows; all venue data downloaded every check-in | Cap at 200 venues, add server-side ST_DWithin query for multi-city | ~200+ venues or multi-city expansion |
| Scraping Spotify monthly listeners for every artist add | Each add takes 3+ seconds (scrape timeout); slow for batch adds | Cache `spotify_monthly_listeners` in DB with TTL; scrape once, reuse for 7 days | Every artist add today — already slow |
| Generating share card PNG on every request in edge function | Card generation is CPU-heavy; cold start on Vercel edge adds latency | Cache the PNG in Vercel KV or Supabase Storage with a 1hr TTL | High traffic or card-heavy sharing spikes |
| Re-querying Supabase for lineup on every venue detection refetch | Unnecessary DB load on every app foreground event | Respect the 2-minute `staleTime` in TanStack Query; don't force refetch on every tap | Immediate issue if users hammer "Check Again" button |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Using Supabase anon key in new check-in/tag-performer endpoints | RLS may allow fans to collect on behalf of other fan_ids | Always use service role key server-side; validate the JWT and look up fan_id from email server-side — never trust fan_id from the client body |
| Accepting `spotifyId` from client body as the authoritative artist identifier | Malicious user could pass any Spotify ID (including themselves) | Validate Spotify ID format on server; re-fetch artist data from Spotify API rather than trusting client-supplied `name`, `followers`, `monthlyListeners` |
| Storing Apple Music developer JWT in client-accessible environment variables | Private key leaked, anyone can make authenticated Apple Music API calls | Apple Music JWT must be generated server-side only; never expose the private key in `NEXT_PUBLIC_*` vars |
| Collecting artists at venues the user is not physically at | GPS spoofing; users collecting without attending | GPS cannot be fully spoofed-proof, but add server-side plausibility check: was the user's last check-in location within 50km of the venue? Rate-limit check-ins per fan per day. |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing "No venues detected" without explaining low GPS accuracy | User thinks the feature is broken, not that GPS is weak | Show "Low GPS signal — try moving outside or near a window" when `coords.accuracy > 200` |
| Requiring artist profile URL (not track URL) for link paste with no guidance | High abandonment on the Add flow | Detect track/set links and show contextual instructions: "That's a track — paste the artist profile link" |
| Stamp animation plays before the API confirm | If collect fails after animation, user has seen a stamp that didn't save | Play animation only after API success response; show loading indicator during API call |
| Post-found celebration (confetti + share prompt) blocking dismissal | Feels pushy; users who just want to keep browsing are stuck | Make share prompt dismissible immediately; don't gate navigation on share completion |
| "Add an Artist" and "I'm at a Show" on the same + tab creates ambiguity | Users unsure which action to take; mode confusion | Use clear visual hierarchy: primary button for the context-appropriate action (GPS active = "I'm at a Show" primary); secondary for the other |

---

## "Looks Done But Isn't" Checklist

- [ ] **Link-paste validator:** Test Apple Music URL with artist ID (numeric), not just name slug — `music.apple.com/us/artist/four-tet/3838646`
- [ ] **Spotify eligibility check:** Verify a known mainstream artist (>1M listeners) is rejected even when HTML scrape fails — scrape failure should NOT auto-approve
- [ ] **SoundCloud URL parser:** Test `m.soundcloud.com` (mobile share), `snd.sc` short URLs, track URLs (2-segment path), set URLs
- [ ] **Haversine GPS check-in:** Test indoors with a simulator (accuracy will be very high); verify the "low accuracy" path shows a helpful message, not "no venues"
- [ ] **Date boundary check-in:** Test at 12:30am Chicago time — confirm event still found (event is stored as the previous day's date locally)
- [ ] **Stamp animation:** Fire on device (not simulator); verify haptic fires at visual contact frame, not before/after
- [ ] **Share card PNG:** Curl every new endpoint and open the file — verify Poppins font renders (not system fallback), gradient text is visible
- [ ] **Duplicate collect protection:** Rapidly tap Collect 5 times for the same artist; verify only one collection row is created
- [ ] **Check-in for user who already has the artist collected:** Should succeed (they already have this artist as a Find) but create a Stamp entry; not duplicate-reject the whole collect
- [ ] **"No live music" path in check-in:** Verify this path results in NO stamp created — not even a partial record

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Mainstream artist added due to scrape failure | MEDIUM | Add `listener_count_verified` flag to performers; backfill by re-scraping all performers where flag is null; remove or flag those over threshold |
| Duplicate collection rows inserted | LOW | Add unique constraint migration; write cleanup script to deduplicate keeping oldest row |
| Apple Music developer JWT expired | LOW | Regenerate JWT (6-month max); update `APPLE_MUSIC_DEVELOPER_JWT` environment variable in Vercel; no user action required |
| Share card PNG blank due to Satori CSS issue | LOW | Fix CSS property, redeploy edge function; no data migration needed |
| Wrong venue matched via GPS (false positive) | LOW | Add user "Report wrong venue" flow; manually correct collection venue_id in DB |
| UTC date mismatch causes check-in failure at midnight | HIGH | Requires API change to accept client local date + timezone; existing stamps unaffected but late-night event captures were silently missed |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Spotify scrape returns 0 = eligible | Phase 2 (validate-artist-link endpoint) | Test with known mainstream artist: rejection must occur even when scrape returns null |
| GPS accuracy variance blows 200m match | Phase 3 (Check-In Flow) | Test on device indoors; verify `accuracy > 200` path shows user-facing message |
| SoundCloud track/set/short URL rejection | Phase 2 (URL parser in validate-artist-link) | Unit-test URL parser with 10+ variant URL formats |
| Apple Music name-match unreliability | Phase 2 (validate-artist-link endpoint) | Test with generic artist name ("Disclosure", "Four Tet"); verify correct artist returned |
| ImageResponse CSS subset breaks share cards | Phase 5 (Share and Virality) | `curl` each share card endpoint; open PNG in image viewer before wiring mobile |
| Stamp animation jank / haptic timing | Phase 4 (Passport Redesign / Stamp Animation) | Test on physical device; use Flipper to confirm 60fps during animation |
| UTC vs local date for check-in window | Phase 3 (Check-In Flow) | Test check-in at 12:30am local time; confirm event found |
| Duplicate collection on rapid tap | Phase 3 (Check-In Flow) | Simulate double-tap in test; verify DB has exactly one row |

---

## Sources

- `/home/swarn/decibel/src/lib/spotify.ts` — existing scrapeMonthlyListeners implementation; scrape-returns-zero pattern identified here
- `/home/swarn/decibel-mobile-v4/src/lib/urlParser.ts` — existing URL parser; SoundCloud segment logic, system path exclusions
- `/home/swarn/decibel-mobile-v4/src/hooks/useVenueDetection.ts` — Haversine implementation; UTC date issue identified in `todayDate()`
- `/home/swarn/decibel/src/app/api/passport/share-card/route.tsx` — ImageResponse pattern; CSS usage reference
- `/home/swarn/decibel/src/app/api/mobile/add-artist/route.ts` — duplicate handling via `23505` error code pattern
- `/home/swarn/decibel-mobile-v4/app/(tabs)/collect.tsx` — collectingId single-string pattern; double-tap gap identified
- `/home/swarn/decibel/src/app/api/discover/resolve-link/route.ts` — Instagram scraping approach; link-in-bio detection patterns
- CLAUDE.md (Decibel project) — v4 pitfall list: card spacing, full-width consistency, user profile query bug, listen link validation

---
*Pitfalls research for: Decibel Mobile — link-paste add flow, GPS check-in, stamp animation, share cards*
*Researched: 2026-03-10*
