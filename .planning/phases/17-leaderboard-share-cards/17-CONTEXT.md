# Phase 17: Leaderboard & Share Cards - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning
**Source:** PRD Express Path (DECIBEL_V6_PRD.md Phase 4)

<domain>
## Phase Boundary

This phase adds the competitive engine (leaderboard) and viral sharing (share cards) to complete the fan app for public launch. Two areas:

1. Leaderboard screen accessible from Home (trophy/crown icon)
2. Auto-generated share cards for Instagram Stories

Two repos:
- /home/swarn/decibel-mobile — Leaderboard screen, share card rendering, share sheet
- /home/swarn/decibel — API endpoints for leaderboard rankings

IMPORTANT: v1.0 already built a leaderboard (Phase 5). Check what exists:
- There may be an existing leaderboard screen and API endpoint
- Phase 16 removed the Leaderboard button from Home — it needs to be re-added as a trophy icon
- v1.0 also built share cards (founder + passport) — check existing implementation

</domain>

<decisions>
## Implementation Decisions

### Leaderboard Screen
- Accessible from Home screen via trophy/crown icon (top-right area)
- Three horizontal tabs at top:

**Most Founders:** Ranked by total Founder Badge count. Primary competition metric.

**Highest Influence:** Ranked by Influence Score (total collects on founded artists by other users). Quality metric.

**Trending:** Ranked by artists founded in current week. Resets weekly. New users can win this.

### Leaderboard Row
- Rank number (1, 2, 3 with special styling for top 3 — gold/silver/bronze or similar)
- User avatar
- Username
- Relevant metric (founder count, influence score, or weekly finds)
- Tapping a row navigates to that user's passport

### Time Filters
- All Time | This Month | This Week — applies to Most Founders and Highest Influence
- Trending is always current week only

### Your Position
- If not in visible top rankings, sticky bar at bottom shows current rank and metric

### Share Cards (Instagram Stories format: 1080x1920)

**Founder Share Card (generated on founding an artist):**
- Artist image as full-bleed background with dark gradient overlay
- "FOUNDED BY @username" in bold white text
- Artist name prominent
- "Found at [X]K listeners" — listener count at time of find
- Date of find
- Decibel logo (small, bottom corner)
- QR code or "decibel.live" URL for app download
- Premium designed quality — Spotify Wrapped / Strava tier

**Passport Summary Card (generated on demand from passport):**
- User's avatar
- Username
- Key stats: X Finds, X Founders, X Influence Score
- Top 3 founded artists (small images in a row)
- "decibel.live/@username" URL
- Decibel branding

### Implementation
- Render React Native view off-screen with card layout
- Capture as image using `react-native-view-shot` or `expo-media-library`
- Save to camera roll and open share sheet with Instagram Stories as target

### API Endpoints Needed (in /home/swarn/decibel)
- GET /api/mobile/leaderboard — may already exist, needs 3 ranking types + time filters + user position

### Claude's Discretion
- Exact visual design of top 3 styling (gold/silver/bronze treatments)
- Whether to use react-native-view-shot or expo-media-library for card capture
- Pagination for leaderboard (top 50? top 100?)
- QR code generation library

</decisions>

<specifics>
## Specific Ideas

- v1.0 built share cards in Phase 5 — check existing ShareCard components
- Existing leaderboard endpoint at /api/mobile/leaderboard — check what it returns
- Phase 16 removed Leaderboard button from Home — needs to be re-added as trophy icon in top bar
- react-native-view-shot is the standard approach for off-screen capture in RN
- Share.share() from react-native for the share sheet
- For Instagram Stories targeting, can use expo-sharing or direct Intent on Android

</specifics>

<deferred>
## Deferred Ideas

None — PRD covers phase scope. This completes the fan app (Phases 1-4 equivalent). Ship after this phase while building artist side.

</deferred>

---

*Phase: 17-leaderboard-share-cards*
*Context gathered: 2026-03-16 via PRD Express Path*
