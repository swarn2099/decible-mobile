---
gsd_state_version: 1.0
milestone: v6.0
milestone_name: The Artist Growth Platform
status: planning
stopped_at: Completed 18-03-PLAN.md
last_updated: "2026-03-16T02:50:29.275Z"
last_activity: 2026-03-16 — Roadmap created for v6.0, 51 requirements mapped across 7 phases
progress:
  total_phases: 20
  completed_phases: 16
  total_plans: 40
  completed_plans: 39
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-16)

**Core value:** Fans compete to discover underground artists (Founder badge = social currency). Artists get fan intelligence and direct reach worth $29/month.
**Current focus:** Milestone v6.0 — Phase 14: Bug Fixes & Cleanup

## Current Position

Phase: 14 of 20 (Bug Fixes & Cleanup)
Plan: Not started
Status: Ready to plan
Last activity: 2026-03-16 — Roadmap created for v6.0, 51 requirements mapped across 7 phases

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity (from v1.0 + v3.0 + v3.5):**
- v1.0: 5 phases (1-5), 12 plans completed
- v3.0: 4 phases (6-9), 14 plans completed
- v3.5: 4 phases (10-13), 4 plans completed

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| v1.0 (1-5) | 12 | - | - |
| v3.0 (6-9) | 14 | - | - |
| v3.5 (10-13) | 4 | - | - |

*Updated after each plan completion*
| Phase 14-bug-fixes-cleanup P03 | 5 | 2 tasks | 4 files |
| Phase 14-bug-fixes-cleanup P01 | 15m | 2 tasks | 5 files |
| Phase 14-bug-fixes-cleanup P02 | 8m | 2 tasks | 6 files |
| Phase 15-passport-redesign P02 | 5m | 2 tasks | 2 files |
| Phase 15-passport-redesign P01 | 3m | 2 tasks | 1 files |
| Phase 16-home-screen-feed P01 | 2min | 2 tasks | 3 files |
| Phase 16-home-screen-feed P02 | 5min | 2 tasks | 7 files |
| Phase 17-leaderboard-share-cards P01 | 4min | 2 tasks | 5 files |
| Phase 17-leaderboard-share-cards P02 | 8min | 2 tasks | 5 files |
| Phase 18-artist-profile-link-in-bio P01 | 20min | 2 tasks | 1 files |
| Phase 18-artist-profile-link-in-bio P03 | 8min | 1 tasks | 1 files |

## Accumulated Context

### Decisions

- v6.0: Stamps removed from UI (data preserved), passport tabs = Finds | Founders | Discoveries | Badges
- v6.0: Two repos — decibel-mobile (fan app, Phases 14-17) and decibel (web/API/dashboard, Phases 18-20)
- v6.0: Phases 16-17 need API work in decibel repo alongside mobile
- v6.0: Ship fan app after Phase 17, then build artist side (18-20)
- v6.0: Artist dashboard at $29/month via Stripe Checkout, 14-day free trial, no CC required
- v6.0: Manual artist verification for MVP, automate month 2-3
- [Phase 14-bug-fixes-cleanup]: fan_count from collections(count) join not performers.follower_count (stale platform count)
- [Phase 14-bug-fixes-cleanup]: Share.share() must be triggered after modal dismiss on iOS — 300ms setTimeout workaround
- [Phase 14-bug-fixes-cleanup]: Finds tab includes ALL found artists (including founders) using flat collection filter; founders are a strict subset
- [Phase 14-bug-fixes-cleanup]: Stamp UI hidden in v6.0 (data preserved in DB, no deletions)
- [Phase 14-bug-fixes-cleanup]: contentType field on ParsedArtistUrl to distinguish artist/track/album/song without breaking existing callers
- [Phase 14-bug-fixes-cleanup]: getSpotifyTrack/getSpotifyAlbum added to resolve Spotify content URLs to artist IDs
- [Phase 15-passport-redesign]: CELL_GAP reduced 4->1 and cell height changed from 1.25x to 1:1 square for Instagram-style dense grid
- [Phase 15-passport-redesign]: PassportHeader action buttons are text-based (Share Passport + Edit Profile), not icon circles — matches Instagram compact profile pattern
- [Phase 16-home-screen-feed]: Trending aggregation done in JS (not SQL GROUP BY) to avoid RPC/stored proc complexity
- [Phase 16-home-screen-feed]: Activity feed fallback triggers on both 'user follows nobody' AND 'followed users have no activity'; is_fallback boolean signals UI which label to show
- [Phase 16-home-screen-feed]: TrendingArtistsRow placed in FlatList ListFooterComponent (below feed)
- [Phase 16-home-screen-feed]: Collect button on feed cards uses existing useDiscoverArtist mutation, no new endpoint needed
- [Phase 17-leaderboard-share-cards]: Influence score = sum of other fans collecting performers that the user founded (cross-fan attribution)
- [Phase 17-leaderboard-share-cards]: Trending view always uses current calendar week (Monday to now), ignores period param; period pills hidden when trending tab active
- [Phase 17-leaderboard-share-cards]: Founder card uses full-bleed photo + gradient overlay design (Spotify Wrapped-tier premium)
- [Phase 17-leaderboard-share-cards]: Passport share card passes influence=0 from passport.tsx (no leaderboard hook there yet) — clean fallback
- [Phase 18-artist-profile-link-in-bio]: Founder ID for profile navigation resolved via useArtistFans since FounderInfo type lacks fan_id
- [Phase 18-artist-profile-link-in-bio]: Primary streaming platform priority for EmbeddedPlayer: spotify > soundcloud > apple_music
- [Phase 18-artist-profile-link-in-bio]: Public passport pages use createSupabaseAdmin() for unauthenticated access; ilike() for case-insensitive fan name lookup; route guard rejects non-@ paths to prevent routing conflicts

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-03-16T02:50:29.268Z
Stopped at: Completed 18-03-PLAN.md
Resume file: None
