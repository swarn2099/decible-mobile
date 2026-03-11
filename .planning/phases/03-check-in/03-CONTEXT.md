# Phase 3: Check-In - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can check in at a live show and create Stamps proving they were there. Two scenarios: Scenario A (known venue with scraped lineup — auto-stamp all artists) and Scenario B (known venue, no lineup — user tags performer via link paste). Scenario C (unknown venue) is deferred to v2. The "I'm at a Show" mode on the + tab initiates the check-in flow. Rubber stamp animation with haptic feedback celebrates the check-in.

</domain>

<decisions>
## Implementation Decisions

### Check-in screen flow
- Multi-step wizard replaces the + tab content (not a new screen/route)
- Step 1: GPS scan + venue confirmation — show venue name, address, distance
- Step 2: Lineup display (Scenario A) or "Is there live music?" prompt (Scenario B)
- Step 3: Stamp animation (full-screen modal overlay)
- Back arrow on wizard returns to + tab mode toggle
- User must explicitly tap "Yes, I'm here" to confirm venue — no auto-advance
- Scenario A: one tap checks in for ALL lineup artists at once (no per-artist selection)

### Tag performer UX (Scenario B)
- When venue has no lineup, inline prompt on the venue step: "No lineup found for tonight. Is there live music?"
- Yes/No buttons inline (not a modal)
- "Yes" advances to tag step which reuses the existing Add flow paste UI (same paste field + useValidateArtistLink + ArtistPreviewCard)
- CTA button text changes to "Tag & Check In" instead of "Add + Found"
- Tagged performers go into user_tagged_events and become visible as lineup for other users checking in at the same venue tonight (crowdsourced lineup)
- "No" shows brief message "No stamp without live music — Decibel is for live shows only" for 2 seconds, then auto-returns to + tab mode toggle

### Stamp animation
- Full-screen modal overlay with dark background
- Rubber stamp Lottie animation (sourced from LottieFiles.com, customized to Decibel pink)
- Stamp slams down center-screen with medium haptic impact (expo-haptics)
- Ink spread effect on impact, stamp lifts to reveal venue + date + artist name(s)
- For multi-artist lineups: single stamp animation, all artists listed in the revealed stamp
- Primary CTA after animation: "View Passport" button (navigates to Passport tab)
- Secondary: subtle "Done" or tap-to-dismiss returns to + tab

### Edge cases & errors
- Multiple nearby venues: show list sorted by distance with name + address + distance, user picks
- GPS accuracy >200m: error state with "GPS signal too weak" message + "Try Again" button, no check-in allowed
- Duplicate check-in (same venue, same night): blocked with "You already checked in at [Venue] tonight!" + show existing stamps
- No venues found nearby: "No venues nearby — head to a live show and try again!" with "Back to Add" button (Scenario C deferred to v2)
- UTC date fix: pass client local date from mobile app to check-in API (not UTC) for late-night show matching

### Claude's Discretion
- Wizard step transition animations (slide, fade, etc.)
- Exact Lottie file selection from LottieFiles.com
- Loading spinner/skeleton during GPS scan
- Ink spread particle details
- Stamp reveal typography and layout within the modal

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useVenueDetection` (src/hooks/useVenueDetection.ts): Haversine 200m geofence, venue + event queries from Supabase, foreground refresh — core of Step 1
- `useLocation` (src/hooks/useLocation.ts): expo-location permission management, getCurrentPosition (Balanced accuracy) — GPS layer
- `locationStore` (src/stores/locationStore.ts): Zustand/MMKV store for dismissed events, explanation shown flag, permission denied state
- `LocationPermissionModal` (src/components/location/LocationPermissionModal.tsx): rationale screen already built with "Know When You're at a Show" copy
- `LocationBanner` (src/components/location/LocationBanner.tsx): currently handles venue detection + collect on Home screen — reference for venue/artist display patterns
- `useValidateArtistLink` + `ArtistPreviewCard` (Phase 2): link-paste validation + artist preview card — reuse for Scenario B tag flow
- `useCollect` (src/hooks/useCollection.ts): collection mutation with haptics — may need adaptation for bulk stamp creation
- `ConfirmationModal` (src/components/collection/ConfirmationModal.tsx): post-collect modal — reference for celebration UI patterns
- expo-haptics: already installed and used in LocationBanner

### Established Patterns
- TanStack React Query for all data fetching (useQuery/useMutation)
- Zustand + MMKV for persistent client state
- Theme colors via `useThemeColors()` hook — all components must use this
- Poppins font family throughout
- Reanimated for animations (SlideInUp, withSpring, etc.)

### Integration Points
- + tab (app/(tabs)/add.tsx): `ImAtAShowView` placeholder needs replacement with check-in wizard
- Backend: needs POST /mobile/check-in and POST /mobile/tag-performer endpoints
- user_tagged_events table: needs creation in Supabase
- Passport: stamps must appear immediately after check-in (optimistic UI update via query invalidation)

</code_context>

<specifics>
## Specific Ideas

- Venue confirmation should show distance in meters (e.g., "~45m away")
- Multi-venue list should feel like picking from a clean list, not a map
- The stamp reveal should show venue name prominently (largest text), date in monospace, artist names below
- "No stamp without live music" messaging reinforces the app's core identity — live music only

</specifics>

<deferred>
## Deferred Ideas

- Scenario C (unknown venue — user adds venue name + tags DJ) — deferred to v2
- Venue map view for selecting from multiple venues — future enhancement
- Check-in history / "already checked in" badge on venue — future phase

</deferred>

---

*Phase: 03-check-in*
*Context gathered: 2026-03-11*
