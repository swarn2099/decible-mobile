# Phase 16: Home Screen & Feed - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning
**Source:** PRD Express Path (DECIBEL_V6_PRD.md Phase 3)

<domain>
## Phase Boundary

This phase rebuilds the Home screen with:
- Stats bar at top (Finds, Founders, Influence Score)
- Activity feed from followed users (Find/Founder/Collect cards)
- Trending artists horizontal row
- Jukebox button + screen with embedded players
- One-tap Collect from feed and Jukebox

Two repos involved:
- /home/swarn/decibel-mobile — Home screen UI, Jukebox screen, feed cards
- /home/swarn/decibel — API endpoints for activity feed, trending artists, influence score, collect action, notification

IMPORTANT: v3.0 (phase 8) already built a Jukebox. Check what exists before rebuilding:
- The existing Jukebox uses embedded WebView players
- The existing activity feed may need restructuring for the new card types

</domain>

<decisions>
## Implementation Decisions

### Stats Bar (top of Home screen)
- Compact horizontal bar below nav bar
- Shows: Total Finds count, Founder count, Influence Score
- Influence Score = total collects across all artists you founded (by other users)
- Updates in real-time as notifications come in
- Always visible at top of Home

### Activity Feed (main section)
- Vertical scrolling FlatList showing activity from followed users
- Each card is a single event:

**Find Card:** "@username found [Artist Name]" — finder avatar + username, artist image, artist name, monthly listener count, platform icon, time ago. If artist has founder, show "Founded by @username". Includes "Collect" button + small play button.

**Founder Card:** "@username founded [Artist Name]" — same as Find but gold styling, gold ★, "FOUNDED" label. Higher-signal event.

**Collect Card:** "@username discovered [Artist Name] from @founder's find" — shows social chain. Lighter styling.

- Feed sorted by recency
- If user follows nobody or no recent activity: fallback "Trending on Decibel" — most collected artists this week

### Trending Artists Row (bottom section)
- Horizontal scroll row at bottom of feed (or pinned above tab bar)
- Top 5-10 most collected artists this week
- Each: circular artist image, name, collector count
- Tapping opens artist profile
- Always visible even when feed is empty

### Jukebox Button
- Replace the map button (top-left of Home, already removed in Phase 14) with Jukebox icon
- Actually, Phase 14 noted the Home screen has Jukebox + Leaderboard + Search buttons already — verify what exists

### Jukebox Screen
- Queries Finds from followed users in last 48 hours
- Resolves artist's top track embed URL (Spotify/SoundCloud/Apple Music)
- Vertical scroll of cards: finder info + artist info + embedded player (WebView)
- Lazy-load WebViews (max 3 active at once)
- One-tap Collect button on each card (adds as Discovery)
- Falls back to platform-wide recent Finds if followed users have no recent activity

Embed URLs:
- Spotify: `https://open.spotify.com/embed/track/{trackId}?theme=0`
- SoundCloud: `https://w.soundcloud.com/player/?url={trackUrl}&color=%23FF4D6A&auto_play=false`
- Apple Music: `https://embed.music.apple.com/us/album/{albumId}?i={trackId}`

### One-tap Collect
- Tapping "Collect" on a feed card or Jukebox card adds the artist as a Discovery to the user's passport
- Sends notification to the original finder ("@username collected [Artist] from your find")

### API Endpoints Needed (in /home/swarn/decibel)
- GET /api/mobile/activity-feed — already exists, may need restructuring for new card types
- GET /api/mobile/trending-artists — new, returns top collected artists this week
- GET /api/mobile/user-stats — new, returns finds/founders/influence score for current user
- POST /api/mobile/discover — already exists, used for one-tap collect
- POST /api/mobile/notify-finder — new, notifies finder when someone collects from their find

### Supabase Schema
- May need `influence_score` column on fans table (or compute on-the-fly)
- Activity feed query joins: collections, performers, fans, founder_badges, follows

### Claude's Discretion
- Whether to compute influence score on-the-fly or cache it
- Exact layout proportions for stats bar
- How to handle the "play" button on feed cards (inline preview vs navigate to Jukebox)
- Pagination strategy for activity feed
- Whether to reuse existing Jukebox or rebuild

</decisions>

<specifics>
## Specific Ideas

- v3.0 already has a Jukebox screen — check ~/decibel-mobile/app/jukebox.tsx or similar
- Existing activity feed endpoint at /api/mobile/activity-feed — check what it returns
- apiCall pattern: all mobile API mutations use apiCall from @/lib/api — never raw fetch
- The Collect action should use the existing /api/mobile/discover endpoint
- Feed dedup pattern from memory: fan_id + performer_id + action key, keep most recent

</specifics>

<deferred>
## Deferred Ideas

- Artist Message Card in feed (Phase 6 addition) — layout should accommodate but don't build yet
- Real-time feed updates via Supabase Realtime — nice-to-have, not required for this phase

</deferred>

---

*Phase: 16-home-screen-feed*
*Context gathered: 2026-03-16 via PRD Express Path*
