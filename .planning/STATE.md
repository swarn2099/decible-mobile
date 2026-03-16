---
gsd_state_version: 1.0
milestone: v6.0
milestone_name: The Artist Growth Platform
status: planning
stopped_at: Completed 19-07-PLAN.md
last_updated: "2026-03-16T04:10:25.098Z"
last_activity: 2026-03-16 — Roadmap created for v6.0, 51 requirements mapped across 7 phases
progress:
  total_phases: 20
  completed_phases: 18
  total_plans: 47
  completed_plans: 47
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
| Phase 18-artist-profile-link-in-bio P02 | 8min | 1 tasks | 1 files |
| Phase 19-artist-dashboard-monetization P01 | 12m | 2 tasks | 3 files |
| Phase 19-artist-dashboard-monetization P02 | 4m | 2 tasks | 6 files |
| Phase 19-artist-dashboard-monetization P03 | 13m | 2 tasks | 4 files |
| Phase 19-artist-dashboard-monetization P04 | 6m | 2 tasks | 6 files |
| Phase 19-artist-dashboard-monetization P06 | 10m | 2 tasks | 4 files |
| Phase 19-artist-dashboard-monetization P05 | 10m | 2 tasks | 3 files |
| Phase 19-artist-dashboard-monetization P07 | 12m | 2 tasks | 5 files |

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
- [Phase 18-artist-profile-link-in-bio]: App Store URL used for Collect on Decibel CTA — universal links require Apple AASA file (separate infra task, deferred)
- [Phase 18-artist-profile-link-in-bio]: Listen links ordered Spotify > Apple Music > SoundCloud > Mixcloud > RA > Instagram (primary platforms first)
- [Phase 19-artist-dashboard-monetization]: Migration endpoint uses Supabase Management API (SUPABASE_ACCESS_TOKEN) as primary DDL path; pg client is fallback when SUPABASE_DB_PASSWORD is set
- [Phase 19-artist-dashboard-monetization]: Phase 19 tables: artist_claims (UNIQUE performer_id for exclusive ownership), artist_messages, artist_shows, artist_subscriptions (UNIQUE artist_id), artist_links
- [Phase 19-artist-dashboard-monetization]: Dashboard queries artist_claims first, falls back to performers.claimed_by for legacy compat
- [Phase 19-artist-dashboard-monetization]: Trial subscription created at claim time (not at verification) — 14-day clock starts on claim
- [Phase 19-artist-dashboard-monetization]: Fan Intelligence loaded client-side on tab click — avoids blocking initial dashboard render with heavy cross-collect joins
- [Phase 19-artist-dashboard-monetization]: Growth chart uses pure SVG polyline with linearGradient defs — no external chart library added to bundle
- [Phase 19-artist-dashboard-monetization]: Activity feed artist_message items merged in JS (not SQL) sorted by timestamp — keeps feed endpoint stateless and avoids complex cross-table JOIN pagination
- [Phase 19-artist-dashboard-monetization]: ActivityFeedItem type extended with optional fields (type/artist_message/artist_slug) rather than union type — avoids breaking all existing feed renders
- [Phase 19-artist-dashboard-monetization]: Custom links override auto-detected performer column links on public page; fallback preserves backward compat for unclaimed artists
- [Phase 19-artist-dashboard-monetization]: City-level radius filtering uses fans.city ILIKE venue_city for MVP; fallback to all collectors when city yields 0 matches; GPS precision deferred
- [Phase 19-artist-dashboard-monetization]: Show notify endpoint inserts artist_messages record (show_announcement) so show promotions appear in Messages feed history
- [Phase 19-artist-dashboard-monetization]: Stripe v20 breaking change: current_period_end moved to subscription items — read from sub.items.data[0]
- [Phase 19-artist-dashboard-monetization]: Stripe env vars required for production billing; build succeeds without them, graceful 503 at runtime

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-03-16T04:10:25.091Z
Stopped at: Completed 19-07-PLAN.md
Resume file: None
