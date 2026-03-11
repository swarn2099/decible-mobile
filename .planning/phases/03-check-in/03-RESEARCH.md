# Phase 3: Check-In - Research

**Researched:** 2026-03-11
**Domain:** GPS venue detection, check-in wizard UI, Stamp animation (Lottie + Reanimated), backend API (check-in, tag-performer), Supabase schema migration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Multi-step wizard replaces the + tab content (not a new screen/route)
- Step 1: GPS scan + venue confirmation — show venue name, address, distance
- Step 2: Lineup display (Scenario A) or "Is there live music?" prompt (Scenario B)
- Step 3: Stamp animation (full-screen modal overlay)
- Back arrow on wizard returns to + tab mode toggle
- User must explicitly tap "Yes, I'm here" to confirm venue — no auto-advance
- Scenario A: one tap checks in for ALL lineup artists at once (no per-artist selection)
- Scenario B inline "Is there live music?" Yes/No — no modal
- "Yes" advances to tag step which reuses the existing Add flow paste UI (same paste field + useValidateArtistLink + ArtistPreviewCard)
- CTA button text changes to "Tag & Check In" instead of "Add + Found"
- Tagged performers go into user_tagged_events and become visible as lineup for other users checking in at the same venue tonight
- "No" shows brief "No stamp without live music — Decibel is for live shows only" for 2 seconds, then auto-returns to + tab mode toggle
- Full-screen modal overlay with dark background for stamp animation
- Rubber stamp Lottie animation (from LottieFiles.com, customized to Decibel pink)
- Stamp slams down center-screen with medium haptic impact (expo-haptics)
- Ink spread effect on impact, stamp lifts to reveal venue + date + artist name(s)
- For multi-artist lineups: single stamp animation, all artists listed in the revealed stamp
- Primary CTA after animation: "View Passport" button (navigates to Passport tab)
- Secondary: subtle "Done" or tap-to-dismiss returns to + tab
- Multiple nearby venues: show list sorted by distance
- GPS accuracy >200m: error state with "GPS signal too weak" + "Try Again" button, no check-in allowed
- Duplicate check-in (same venue, same night): blocked with message + show existing stamps
- No venues found nearby: "No venues nearby" with "Back to Add" button (Scenario C deferred to v2)
- UTC date fix: pass client local date from mobile app to check-in API

### Claude's Discretion
- Wizard step transition animations (slide, fade, etc.)
- Exact Lottie file selection from LottieFiles.com
- Loading spinner/skeleton during GPS scan
- Ink spread particle details
- Stamp reveal typography and layout within the modal

### Deferred Ideas (OUT OF SCOPE)
- Scenario C (unknown venue — user adds venue name + tags DJ) — deferred to v2
- Venue map view for selecting from multiple venues — future enhancement
- Check-in history / "already checked in" badge on venue — future phase
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TAB-03 | "I'm at a Show" mode initiates the check-in flow | `ImAtAShowView` is a placeholder in `add.tsx` — replace with `CheckInWizard` component |
| CHK-01 | Scenario A: GPS matches known venue with lineup → all lineup artists auto-collected as Stamps | `useVenueDetection` + `/api/mobile/check-in` POST with `venue_id`, `event_date`, `performer_ids[]` |
| CHK-02 | Scenario B: GPS matches venue, no lineup → "Is there live music?" → link-paste → Stamp | Reuse `useValidateArtistLink` + new `/api/mobile/tag-performer` endpoint + `user_tagged_events` table |
| CHK-03 | Scenario C (GPS matches no venue) — DEFERRED TO v2 | Out of scope this phase |
| CHK-04 | "No live music" results in zero stamps | Frontend-only: auto-dismiss after 2s message |
| CHK-05 | GPS permission rationale screen before requesting location | `LocationPermissionModal` already built — trigger from wizard Step 1 |
| CHK-06 | Venue match confirmation: "You're at [Venue Name]" with address and distance | Step 1 of wizard; distance computed by `useVenueDetection` (needs column fix) |
| CHK-07 | Check-in uses client local date (not UTC) | Send `local_date` in POST body from mobile; API receives it instead of computing server-side |
| CHK-08 | GPS accuracy read from coords; graceful handling when accuracy exceeds 200m | `loc.coords.accuracy` (number|null) from expo-location; check in `useLocation.getCurrentPosition` |
| CHK-09 | `user_tagged_events` table stores tagged performers; visible to other users | New Supabase table + `/api/mobile/tag-performer` endpoint + `useVenueDetection` updated to query it |
| CHK-10 | Stamp appears in passport immediately after check-in (optimistic UI) | `queryClient.invalidateQueries({ queryKey: ['passportCollections'] })` after check-in mutation |
| ANIM-01 | Rubber stamp Lottie animation slams down | `LottieView` from `lottie-react-native@7.3.6` with `source={require(...)}`, `autoPlay={false}`, `ref.play()` |
| ANIM-02 | Haptic feedback (medium impact) on stamp contact | `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)` — already in project |
| ANIM-03 | Ink spread effect on impact, stamp lifts to reveal venue + date + artist | Reanimated `withSequence` + `withDelay` sequence after Lottie `onAnimationFinish`; or pure Reanimated if no suitable Lottie found |
</phase_requirements>

---

## Summary

Phase 3 adds the check-in flow: GPS detection, venue confirmation wizard, Stamp creation, and the rubber stamp animation. All core infrastructure is already present — expo-location, expo-haptics, lottie-react-native 7.3.6, Reanimated 4.2.1, LocationPermissionModal, useVenueDetection, and useCollect. The phase is primarily an integration and orchestration effort with three new artifacts: a backend `/api/mobile/check-in` route, a backend `/api/mobile/tag-performer` route, and a `user_tagged_events` Supabase table.

**Two bugs must be fixed** before the check-in wizard can work at all: (1) `useVenueDetection` queries the wrong DB column names (`lat`/`lng`/`geofence_radius` instead of `latitude`/`longitude`/`geofence_radius_meters`), causing zero venue matches silently; (2) GPS accuracy is not currently read from coords, meaning weak-signal scenarios are never caught.

The Lottie animation file is the only external dependency not yet present. `assets/animations/` does not exist. A stamp-press Lottie file must be sourced from LottieFiles.com and committed before the animation step can be implemented. As a fallback, a pure-Reanimated stamp animation can achieve the same visual result (the ConfirmationModal already implements a stamp-slam pattern with withSequence/withSpring that can be adapted).

**Primary recommendation:** Fix `useVenueDetection` column names in Plan 03-02 before any check-in logic. Source Lottie file before Plan 03-03.

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-location | ~55.1.2 | GPS permission + position | Already in project, foreground-only |
| expo-haptics | ~55.0.8 | Haptic feedback on stamp contact | Already used in LocationBanner |
| lottie-react-native | ~7.3.4 (actual: 7.3.6) | Stamp animation JSON playback | Already in package.json |
| react-native-reanimated | 4.2.1 | Overlay + reveal animation | Already used throughout |
| expo-blur | ~55.0.8 | Blur background on stamp modal | Used in ConfirmationModal |
| @tanstack/react-query | existing | Check-in mutation + query invalidation | Project standard |
| react-native-mmkv + zustand | existing | Client state persistence | Project standard |

### Backend (Next.js App Router, src/app/api/mobile/)
| Pattern | Where | Why |
|---------|-------|-----|
| `createClient` (service role) | All mobile routes | Bypasses RLS, consistent with existing routes |
| `admin.auth.getUser(token)` | Auth helper | Already in `add-artist`, `passport`, `validate-artist-link` routes |
| `getAuthEmail` helper function | Copy from existing routes | 4-line pattern used across all mobile endpoints |

**No new packages required.** Everything is already installed.

---

## Architecture Patterns

### Check-In Wizard (client)

The wizard lives entirely inside `ImAtAShowView` in `app/(tabs)/add.tsx`. It is NOT a separate route — it replaces the placeholder `View` in place. A local `wizardStep` state drives rendering: `'idle' | 'scanning' | 'venue_confirm' | 'lineup' | 'tag_performer' | 'stamp_animation'`.

```
add.tsx
  └── AddScreen (mode toggle: 'artist' | 'show')
       ├── AddArtistView (Phase 2, complete)
       └── ImAtAShowView → replaced with CheckInWizard
            ├── Step: scanning (GPS + venue query in progress)
            ├── Step: venue_confirm (show venue name, address, distance)
            │    ├── Scenario A → lineup (list of artists, "Check In All" CTA)
            │    └── Scenario B → no_lineup ("Is there live music?" Yes/No)
            │         └── Yes → tag_performer (paste link + ArtistPreviewCard)
            └── Step: stamp_animation (full-screen Modal)
```

### Recommended File Structure

```
src/
├── components/
│   ├── checkin/
│   │   ├── CheckInWizard.tsx          # top-level wizard (state machine)
│   │   ├── VenueScanStep.tsx          # Step 1: GPS scan + venue list/confirmation
│   │   ├── LineupStep.tsx             # Step 2A: Scenario A — show lineup, "Check In All"
│   │   ├── TagPerformerStep.tsx       # Step 2B: Scenario B — paste link, "Tag & Check In"
│   │   └── StampAnimationModal.tsx    # Step 3: full-screen stamp animation
│   └── location/ (existing)
├── hooks/
│   ├── useCheckIn.ts                  # useMutation → POST /mobile/check-in
│   ├── useTagPerformer.ts             # useMutation → POST /mobile/tag-performer
│   └── useVenueDetection.ts (fix)    # fix column names + accuracy + user_tagged_events
assets/
└── animations/
    └── stamp-press.json               # Lottie file (source from LottieFiles.com)
~/decibel/src/app/api/mobile/
├── check-in/route.ts                  # POST: venue_id, performer_ids[], local_date
└── tag-performer/route.ts             # POST: venue_id, local_date, performer_id, create user_tagged_events row
```

### Pattern 1: Check-In API (backend)

```typescript
// POST /api/mobile/check-in
// Body: { venue_id, performer_ids: string[], local_date: string }
// Returns: { stamps: StampResult[], already_checked_in: boolean }

// Key steps:
// 1. Authenticate via getAuthEmail(req)
// 2. Get fan by email
// 3. Check for duplicate: collections where fan_id + venue_id + event_date = today
// 4. For each performer_id, insert into collections:
//    { fan_id, performer_id, venue_id, event_date: local_date, capture_method: 'location', verified: true }
// 5. Upsert fan_tiers for each performer
// 6. Return stamp data for animation reveal
```

### Pattern 2: Tag Performer API (backend)

```typescript
// POST /api/mobile/tag-performer
// Body: { venue_id, local_date, performer_id }
// Returns: { stamp: StampResult, crowdsourced_lineup_count: number }

// Key steps:
// 1. Authenticate via getAuthEmail(req)
// 2. Insert into user_tagged_events: { fan_id, venue_id, performer_id, event_date }
// 3. Insert into collections: { fan_id, performer_id, venue_id, event_date: local_date, capture_method: 'location', verified: true }
// 4. Return stamp
```

### Pattern 3: useVenueDetection fix + GPS accuracy check

**CRITICAL BUG — must fix before wizard works:**

The Supabase `venues` table uses `latitude`, `longitude`, `geofence_radius_meters` but `useVenueDetection` selects `lat, lng, geofence_radius`. The result is that ALL venue proximity checks silently fail (distance never matches). Fix:

```typescript
// WRONG (current):
.select("id, name, slug, address, lat, lng, geofence_radius")
// ... v.lat == null || v.lng == null ...
// ... haversineDistance(latitude, longitude, v.lat, v.lng) ...
// ... v.geofence_radius ?? DEFAULT_GEOFENCE_RADIUS ...

// CORRECT:
.select("id, name, slug, address, city, latitude, longitude, geofence_radius_meters")
// ... v.latitude == null || v.longitude == null ...
// ... haversineDistance(latitude, longitude, v.latitude, v.longitude) ...
// ... v.geofence_radius_meters ?? DEFAULT_GEOFENCE_RADIUS ...
```

The `Venue` type in `src/types/index.ts` also needs updating to match real DB columns.

### Pattern 4: GPS accuracy guard in useLocation

`expo-location.getCurrentPositionAsync()` returns `LocationObject` where `coords.accuracy` is `number | null` (meters of uncertainty). The current `useLocation` does not expose or check this.

```typescript
// Updated getCurrentPosition return type:
const getCurrentPosition = useCallback(async (): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number | null; // ADD THIS
} | null> => {
  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    accuracy: loc.coords.accuracy,  // ADD THIS
  };
}, [permissionStatus]);
```

The wizard checks `accuracy > 200` (or accuracy === null treated as unknown, allow through with warning) and shows an error state before any venue query.

### Pattern 5: user_tagged_events table (Supabase migration)

New table needed. Does NOT exist yet (confirmed via Supabase query).

```sql
CREATE TABLE user_tagged_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id      uuid NOT NULL REFERENCES fans(id) ON DELETE CASCADE,
  venue_id    uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  performer_id uuid NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  event_date  date NOT NULL,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX user_tagged_events_venue_date_idx ON user_tagged_events(venue_id, event_date);
-- Prevent the same fan tagging the same performer at the same venue+night twice
CREATE UNIQUE INDEX user_tagged_events_unique_idx ON user_tagged_events(fan_id, venue_id, performer_id, event_date);
```

After insertion, `useVenueDetection` must query this table as a secondary performer source (crowdsourced lineup) for Scenario B venues showing no events.

### Pattern 6: StampAnimationModal

The existing `ConfirmationModal` in `src/components/collection/ConfirmationModal.tsx` already implements a stamp-slam animation with Reanimated (`withSequence`, `withSpring`, `withDelay`, ring expansion, `runOnJS(triggerHaptic)`). The `StampAnimationModal` for check-in follows the same pattern, adapted for:
- Venue name (large, prominent) instead of artist name as the hero
- Date in monospace font
- Artist name(s) listed below (single or multiple)
- Lottie animation as the stamp visual (falling from above, then lifting)
- "View Passport" as primary CTA, "Done" as secondary

If no suitable Lottie file is available before Plan 03-03 begins, the fallback is to use the same Reanimated stamp-slam the ConfirmationModal uses — already proven to work.

### Pattern 7: Lottie usage

```typescript
// Source: lottie-react-native 7.3.6 types
import LottieView from 'lottie-react-native';
import { useRef } from 'react';

const animRef = useRef<LottieView>(null);

// Trigger on modal visible:
animRef.current?.play();

// Component:
<LottieView
  ref={animRef}
  source={require('../../assets/animations/stamp-press.json')}
  autoPlay={false}
  loop={false}
  style={{ width: 200, height: 200 }}
  onAnimationFinish={() => {
    // Reveal venue/date/artist text
    // Trigger haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }}
  colorFilters={[{ keypath: 'Stamp Fill', color: '#FF4D6A' }]}
/>
```

**Key: `autoPlay={false}` + `ref.play()` on modal visibility.** `onAnimationFinish` fires once when `loop={false}` and animation ends.

### Anti-Patterns to Avoid

- **Auto-advancing past venue confirmation:** User must explicitly tap "Yes, I'm here" — never skip this step
- **Using server UTC date for event matching:** Always accept `local_date` from client body, never compute `new Date().toISOString().slice(0,10)` in the check-in endpoint
- **Calling useVenueDetection with the unpatched column names:** Fix column names before any check-in work
- **Querying venue table via columns `lat`/`lng`:** The actual columns are `latitude`/`longitude`
- **Playing Lottie animation with `autoPlay={true}`:** It will fire on mount, not on stamp trigger
- **Creating a new screen/route for the wizard:** Stays inside `add.tsx` as a conditional render

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Haptic feedback | Custom vibration API | `expo-haptics` | Platform-consistent, already installed |
| Animation JSON playback | Canvas/SVG frame rendering | `lottie-react-native` | Already installed, JSON-driven, performant |
| Stamp slam spring physics | Manual timers + linear interpolation | Reanimated `withSpring` + `withSequence` | Already in ConfirmationModal, proven pattern |
| GPS coordinates | IP geolocation | `expo-location` foreground | Already installed, precise, permission-gated |
| Blur background on modal | Semi-transparent View | `expo-blur` BlurView | Already installed, used in ConfirmationModal |
| Haversine distance | Google Maps Distance API | Local `haversineDistance()` function | Already implemented in useVenueDetection, pure math, no external call |

---

## Common Pitfalls

### Pitfall 1: useVenueDetection silently returns empty (column mismatch)
**What goes wrong:** Check-in wizard shows "no venues nearby" for users who ARE at a venue.
**Why it happens:** `useVenueDetection` selects `lat, lng, geofence_radius` but the DB has `latitude, longitude, geofence_radius_meters`. Supabase returns null for unknown columns, so all distance checks fail.
**How to avoid:** Fix column names in Plan 03-02 as the FIRST task. Also update the `Venue` TypeScript type.
**Warning signs:** Zero venues returned even when testing at Smartbar/Subterranean.

### Pitfall 2: UTC date mismatch for late-night shows
**What goes wrong:** A check-in at 1am on Saturday matches no event because the server computes Sunday's date in UTC.
**Why it happens:** `new Date().toISOString().slice(0,10)` returns UTC date. Chicago is UTC-5/6.
**How to avoid:** Mobile sends `local_date` in POST body (computed as `new Date().toLocaleDateString('en-CA')` which returns YYYY-MM-DD in local timezone). API uses `body.local_date` directly.
**Warning signs:** Check-ins after midnight return "no event found" even when the venue has today's event.

### Pitfall 3: Lottie `autoPlay` fires on mount, not on stamp trigger
**What goes wrong:** Animation plays when the modal renders, not when the stamp "slams down."
**Why it happens:** `autoPlay={true}` starts playback immediately.
**How to avoid:** Always use `autoPlay={false}` + `ref.current?.play()` triggered by `useEffect` when `visible === true`.

### Pitfall 4: Duplicate check-in allowed
**What goes wrong:** User can check in at the same venue multiple times on the same night.
**Why it happens:** No server-side deduplification.
**How to avoid:** Before inserting to collections, query: `collections WHERE fan_id = X AND venue_id = Y AND event_date = Z`. If rows exist, return `{ already_checked_in: true, existing_stamps: [...] }` with 200 (not error), and the frontend shows "You already checked in at [Venue] tonight!"

### Pitfall 5: Multiple nearby venues — user sees wrong venue
**What goes wrong:** Dense city blocks may have 2+ venues within 200m.
**Why it happens:** Haversine 200m radius is ~half a city block.
**How to avoid:** When `nearbyEvents.length > 1`, show a sorted list of venues with distance badges (VenueScanStep handles this). Do not auto-select the first result.

### Pitfall 6: Lottie colorFilter keypath mismatch
**What goes wrong:** `colorFilters` prop has no effect — wrong keypath name.
**Why it happens:** Keypath must exactly match the layer name in the Lottie JSON file.
**How to avoid:** Open the .json file, find the layer name in `"layers"[n]["nm"]`. Use that exact string.

### Pitfall 7: GPS accuracy null on simulator
**What goes wrong:** Simulator returns `accuracy: null` for location.
**Why it happens:** Simulator doesn't have real GPS hardware.
**How to avoid:** Treat `accuracy === null` as "unknown" — allow check-in to proceed (don't block with "GPS too weak"). Only block when `accuracy !== null && accuracy > 200`.

---

## Code Examples

### Check-in wizard state machine (client)

```typescript
// Source: project pattern from ConfirmationModal + useVenueDetection
type WizardStep =
  | { type: 'scanning' }
  | { type: 'no_venues' }
  | { type: 'venue_select'; venues: ActiveVenueEvent[] }
  | { type: 'venue_confirm'; event: ActiveVenueEvent }
  | { type: 'lineup'; event: ActiveVenueEvent }
  | { type: 'no_lineup'; event: ActiveVenueEvent }
  | { type: 'tag_performer'; event: ActiveVenueEvent }
  | { type: 'gps_weak' }
  | { type: 'stamp'; stamps: StampData[] };
```

### Local date for check-in POST body

```typescript
// Source: MDN + project UTC date fix requirement
function getLocalDate(): string {
  // 'en-CA' locale returns YYYY-MM-DD format
  return new Date().toLocaleDateString('en-CA');
}
// Usage in useCheckIn mutation:
body: JSON.stringify({ venue_id, performer_ids, local_date: getLocalDate() })
```

### GPS accuracy guard

```typescript
// Source: expo-location LocationObjectCoords type
const position = await getCurrentPosition(); // updated to return accuracy
if (position && position.accuracy !== null && position.accuracy > 200) {
  setStep({ type: 'gps_weak' });
  return;
}
```

### useCheckIn hook (mutation)

```typescript
// Pattern matches useCollect, useAddArtist — project standard
export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ venueId, performerIds, localDate }: CheckInArgs) => {
      return apiCall<CheckInResult>('/mobile/check-in', {
        method: 'POST',
        body: JSON.stringify({
          venue_id: venueId,
          performer_ids: performerIds,
          local_date: localDate,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passportCollections'] });
      queryClient.invalidateQueries({ queryKey: ['myCollectedIds'] });
    },
  });
}
```

### Backend check-in route auth helper (copy from existing)

```typescript
// Source: src/app/api/mobile/add-artist/route.ts (established pattern)
async function getAuthEmail(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const { data, error } = await admin.auth.getUser(auth.slice(7));
  if (error || !data.user?.email) return null;
  return data.user.email;
}
```

### Duplicate check-in prevention

```typescript
// In check-in route, before inserting collections:
const { data: existing } = await admin
  .from('collections')
  .select('id, performers(name, slug, photo_url)')
  .eq('fan_id', fan.id)
  .eq('venue_id', venue_id)
  .eq('event_date', local_date);

if (existing && existing.length > 0) {
  return NextResponse.json({
    already_checked_in: true,
    existing_stamps: existing,
  }, { status: 200 }); // NOT 400 — handled gracefully in UI
}
```

### Stamp animation with Reanimated reveal sequence

```typescript
// Source: ConfirmationModal.tsx — established stamp-slam pattern
// Adapt for venue reveal:
stampTranslateY.value = withSpring(0, { damping: 12, stiffness: 180 }, (finished) => {
  if (finished) {
    runOnJS(triggerHaptic)(); // ANIM-02
  }
});
// After slam (~400ms), fade in venue/date/artist text:
venueTextOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
// After text, fade in action buttons:
buttonsOpacity.value = withDelay(700, withTiming(1, { duration: 300 }));
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useVenueDetection queries `lat`, `lng` | DB has `latitude`, `longitude`, `geofence_radius_meters` | Since DB migration | Bug: zero venue matches — fix in Plan 03-02 |
| Venue type has `lat`/`lng`/`geofence_radius` | Actual DB columns are `latitude`/`longitude`/`geofence_radius_meters` | DB from project start | Type mismatch must be fixed |
| `useLocation.getCurrentPosition` returns `{lat, lng}` | Needs to also return `accuracy` | Phase 3 requirement | Needed for CHK-08 accuracy guard |
| `user_tagged_events` table | Does NOT exist yet | n/a | Must be created via Supabase migration before backend route |

**Deprecated/outdated:**
- `ImAtAShowView` placeholder (add.tsx): marked "Coming soon" — fully replaced by CheckInWizard in this phase

---

## Supabase Schema Notes

**Confirmed column names (verified against live DB):**

`venues`: `id, name, slug, address, city, latitude, longitude, geofence_radius_meters, capacity, created_at`
`events`: `id, performer_id, venue_id, event_date, start_time, end_time, is_live, source, external_url, created_at`
`collections`: `id, fan_id, performer_id, venue_id, event_date, capture_method, verified, created_at`
`user_tagged_events`: **does not exist** — needs migration

**`collections.venue_id` is nullable** — existing rows have `venue_id: null`. For stamps from check-in, always set `venue_id`.

**376 venues, 6346 events in DB.** Events for today (2026-03-11) exist — Scenario A is possible.

---

## Open Questions

1. **Lottie file selection**
   - What we know: `lottie-react-native@7.3.6` is installed; `colorFilters` prop accepts `[{keypath, color}]`
   - What's unclear: Which specific LottieFiles.com animation will be used; what its layer keypath names are
   - Recommendation: Claude's discretion — pick a stamp-press animation, test `colorFilters` with `#FF4D6A`. Fallback: pure Reanimated (see ConfirmationModal pattern — already proven)

2. **Supabase migration method**
   - What we know: `user_tagged_events` table does not exist; the project uses Supabase service role client for writes
   - What's unclear: Whether there's a Supabase CLI migration workflow already set up
   - Recommendation: Run the CREATE TABLE SQL via `supabase db push` or directly via the Supabase admin client in a one-time script. Plan 03-01 handles this.

3. **Check-in endpoint URL**
   - What we know: API base is `https://decibel-three.vercel.app/api`; all new mobile endpoints go in `~/decibel/src/app/api/mobile/`
   - What's unclear: Whether the Vercel deployment of `~/decibel` auto-deploys on push to main
   - Recommendation: After creating check-in and tag-performer routes, deploy with `cd ~/decibel && vercel --prod` before testing from mobile

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no jest.config, no vitest.config, no test directories |
| Config file | None — Wave 0 gap |
| Quick run command | n/a — manual EAS preview update + device testing |
| Full suite command | `CI=1 npx eas update --channel preview --environment preview --message "..."` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TAB-03 | "I'm at a Show" opens check-in wizard | manual | EAS preview build | n/a |
| CHK-01 | Scenario A stamps all lineup artists | manual | EAS preview, at venue | n/a |
| CHK-02 | Scenario B tag performer via link paste | manual | EAS preview, at venue | n/a |
| CHK-04 | "No live music" yields zero stamps | manual | EAS preview | n/a |
| CHK-05 | GPS permission rationale shown first | manual | EAS preview, fresh install | n/a |
| CHK-06 | Venue confirmation shows name + distance | manual | EAS preview, at venue | n/a |
| CHK-07 | Late-night shows use local date | unit | Inspect POST body `local_date` field | ❌ Wave 0 |
| CHK-08 | GPS accuracy >200m shows error | manual | Airplane mode + Location | n/a |
| CHK-09 | user_tagged_events visible to others | manual | Two devices, same venue | n/a |
| CHK-10 | Stamp appears in passport immediately | manual | EAS preview | n/a |
| ANIM-01 | Lottie stamp slams down | manual | EAS preview | n/a |
| ANIM-02 | Haptic on stamp contact | manual | Physical device only | n/a |
| ANIM-03 | Ink spread + reveal | manual | EAS preview | n/a |

### Sampling Rate
- **Per task commit:** TypeScript build — `cd /home/swarn/decibel-mobile && npx tsc --noEmit`
- **Per wave merge:** `CI=1 npx eas update --channel preview --environment preview --message "phase-03 wave N"`
- **Phase gate:** Full EAS preview update + manual device verification before `/gsd:verify-work`

### Wave 0 Gaps
- No automated test infrastructure exists in this project — all verification is manual EAS preview + device
- TypeScript compile check (`npx tsc --noEmit`) is the only automated quality gate available

*(No existing test infrastructure — manual testing via EAS preview is the established project pattern)*

---

## Sources

### Primary (HIGH confidence)
- Direct source code inspection: `/home/swarn/decibel-mobile/src/hooks/useVenueDetection.ts`
- Direct source code inspection: `/home/swarn/decibel-mobile/src/hooks/useLocation.ts`
- Direct source code inspection: `/home/swarn/decibel-mobile/src/components/collection/ConfirmationModal.tsx`
- Direct source code inspection: `/home/swarn/decibel-mobile/app/(tabs)/add.tsx`
- Direct source code inspection: `/home/swarn/decibel/src/app/api/mobile/add-artist/route.ts` (auth pattern)
- Direct source code inspection: `/home/swarn/decibel/src/app/api/collect/route.ts` (collection insert pattern)
- Live Supabase DB query: venues columns, events columns, collections columns, user_tagged_events (missing)
- `lottie-react-native/src/types.ts` — verified `LottieViewProps` API (source, autoPlay, loop, onAnimationFinish, colorFilters)
- `expo-location/src/Location.types.ts` — verified `LocationObjectCoords.accuracy: number | null`
- `/home/swarn/decibel-mobile/package.json` — verified all packages installed (lottie, haptics, location, reanimated, blur)

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions — implementation choices locked by Swarn
- REQUIREMENTS.md — CHK/ANIM requirement definitions
- STATE.md — phase context and blockers noted

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json, all versions confirmed
- Architecture: HIGH — existing patterns directly inspected; patterns are copies/adaptations of proven code
- DB schema: HIGH — verified via live Supabase query
- Pitfalls: HIGH — column mismatch bug confirmed by reading both source and DB; UTC issue confirmed by reading existing collect route
- Animation: MEDIUM — Lottie API verified, but specific .json file not yet selected; Reanimated fallback is HIGH confidence

**Research date:** 2026-03-11
**Valid until:** 2026-04-10 (stable libraries, Supabase schema stable until next migration)
