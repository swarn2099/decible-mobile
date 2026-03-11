# Phase 5: Share + Polish - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can share their finds via generated share cards, experience a post-found celebration with confetti + badge reveal, browse an artist's fans list, and the app passes a full visual QA for public launch. Requirements: SHR-01 through SHR-06, ART-01, ART-02, POL-01, POL-02.

</domain>

<decisions>
## Implementation Decisions

### Celebration flow
- Enhance existing ConfirmationModal (src/components/collection/ConfirmationModal.tsx) — add "founded" type alongside "collect"/"discover"
- Founded celebration: gold ★ badge reveal (replaces wax seal), full confetti particles, heavy haptic (ImpactFeedbackStyle.Heavy)
- Discovered celebration: purple compass badge, lighter confetti (fewer particles), medium haptic
- Share button appears inline inside the celebration modal after animation completes — tapping it opens the existing ShareSheet bottom sheet with the pre-generated card
- Share card image generation starts immediately when the API confirms the action (before celebration animation plays) — card should be ready by the time user taps Share
- Auto-dismiss timer stays (5 seconds) unless user interacts

### Share card content & API
- **Founder card (9:16 Stories format):** Artist-focused layout — large artist photo (top 60%), artist name, "FOUNDED BY [username]" in gold, Decibel logo + branding at bottom. Always dark background (#0B0B0F).
- **Passport card:** Stats + grid layout — user name at top, key stats (artists found, shows attended, venues), 2x2 grid of top artist photos, Decibel branding. Always dark background.
- Both cards always use dark theme regardless of user's device theme — looks best on Instagram Stories, consistent brand identity
- New backend routes: `/api/share-card/founder` and `/api/share-card/passport` in ~/decibel (next/og ImageResponse). Old `/api/passport/share-card` left as-is.
- Existing ShareSheet (Stories, Message, Copy Link, Save to Photos) used for all sharing — already handles Instagram UTI on iOS, MediaLibrary permissions for Save
- Broken passport share button on Passport tab gets fixed by wiring PassportShareButton to new `/api/share-card/passport` endpoint + ShareSheet (not a separate QA item)

### Artist fans list
- New screen at `/artist/[slug]/fans` (or equivalent route)
- Row design: user avatar, display name, tier badge icon (gold ★ / pink ✓ / purple compass), date found/collected/discovered. Tappable → navigates to user profile.
- Founder row: subtle gold left border or gold background tint, gold ★ badge, "Founder" label. Pinned at top.
- Section headers with counts: "Founder" (1) → "Collected" (N) → "Discovered" (N). Clear tier grouping.
- Fan count on artist profile is tappable → navigates to fans list
- When only the Founder exists: show Founder row + CTA below: "Share this artist to grow their fanbase" with share button (drives virality)
- New backend endpoint: GET `/api/mobile/artist-fans?performer_id=X` returning fans grouped by tier

### QA pass
- Scope: dark/light mode visual audit + bottom padding for floating tab bar on all scrollable screens (POL-01 + POL-02)
- Method: grep-based scan for hardcoded colors (text-white, #fff, raw hex), missing useThemeColors() usage, localhost refs, missing bottom padding. Fix all findings programmatically.
- Not in scope: navigation flow audit, loading/error state review, accessibility audit (those are post-launch)

### Claude's Discretion
- Exact confetti particle count and animation timing for Founded vs Discovered
- Share card typography sizes and spacing within next/og ImageResponse
- Fans list loading skeleton
- Grep patterns for the QA scan
- How to handle edge cases in share card generation (missing artist photo, missing stats)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ConfirmationModal` (src/components/collection/ConfirmationModal.tsx): Has stamp slam animation, confetti for tier-up, wax seal, haptic feedback, auto-dismiss timer — enhance with "founded" type
- `ShareSheet` (src/components/passport/ShareSheet.tsx): Full share sheet with Stories (Instagram UTI on iOS), Message, Copy Link, Save to Photos — reuse as-is
- `SharePrompt` (src/components/collection/SharePrompt.tsx): Simple share trigger with loading overlay — may be superseded by inline Share in ConfirmationModal
- `usePassportShareCard` / `useArtistShareCard` hooks (src/hooks/useShareCard.ts): Download server-generated PNGs to cache, state management — adapt for new endpoints
- `PassportShareButton` (src/components/passport/PassportShareButton.tsx): Existing broken share button on Passport tab — rewire to new endpoint
- `WaxSeal` (src/components/collection/WaxSeal.tsx): Tier-based visual — reference for badge styling but may be replaced by ★/compass for Founded/Discovered
- expo-haptics, expo-sharing, expo-media-library, expo-clipboard: All installed and working

### Established Patterns
- TanStack React Query for data fetching (useQuery/useMutation)
- Reanimated for animations (withSpring, withSequence, withDelay)
- BlurView for modal overlays
- Theme colors via `useThemeColors()` hook — all components must use this
- Poppins font family throughout
- Backend share card generation uses query params → next/og ImageResponse → PNG

### Integration Points
- ConfirmationModal: currently triggered from collect/discover actions — needs to also trigger from Add flow's "Add + Found" action with founded type
- PassportShareButton: rewire from old endpoint to new /api/share-card/passport
- Artist profile screen: make fan count tappable, add navigation to fans list
- Backend ~/decibel/pages/api/: create share-card/founder.tsx and share-card/passport.tsx
- Backend ~/decibel/pages/api/mobile/: create artist-fans.ts endpoint

</code_context>

<specifics>
## Specific Ideas

- Founder share card should make the artist the hero — large photo, clean layout, gold "FOUNDED BY" text
- Share cards always dark theme for Instagram Stories brand consistency
- Fans list with "Share this artist" CTA when only Founder exists — turn every founding into a growth opportunity
- QA is code-level grep scan, not visual walkthrough — efficient and thorough for hardcoded color issues

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-share-polish*
*Context gathered: 2026-03-11*
