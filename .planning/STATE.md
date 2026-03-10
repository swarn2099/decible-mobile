# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** Discover underground artists before anyone else (Finds) and prove you were at the show (Stamps) — a live music passport.
**Current focus:** Phase 2 — Add Flow

## Current Position

Phase: 2 of 5 (Add Flow)
Plan: 0 of 3 in current phase
Status: Ready to plan
Last activity: 2026-03-10 — Roadmap created. Phase 1 already complete and deployed.

Progress: [██░░░░░░░░] 9% (1/11 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 1 (Phase 1)
- Average duration: unknown
- Total execution time: unknown

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Scaffold | 1/1 | - | - |

**Recent Trend:**
- Last 5 plans: (insufficient data)
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

- Link-paste over text search: prevents adding mainstream artists, intentional friction filters for real fans
- 3 tabs (Home, +, Passport): simpler than v4's 4 tabs, + button emphasizes primary action
- Finds vs Stamps visual separation: different aesthetics match different user motivations
- Scenario C (unknown venue) deferred to v2: adds significant complexity for edge-case check-ins

### Pending Todos

None yet.

### Blockers/Concerns

- **Before Phase 2:** Confirm Apple Music developer JWT provisioned. If not, Phase 2 ships Spotify + SoundCloud only with Apple Music as fast follow (PRD fallback "default to eligible" handles the gap).
- **Before Phase 3:** Verify venue DB coverage for target Chicago venues (Smartbar, Spybar, Schubas, Subterranean). Missing venues = Scenario A silently falls through to B.
- **Before Phase 4:** Source Lottie animation files (stamp-press, ink-spread, confetti) from LottieFiles.com. Verify commercial license per file. Commit to assets/animations/ before starting.
- **Before Phase 5:** Confirm Poppins font is hosted as a static asset accessible from Vercel Edge runtime (not Google Fonts CSS URL).
- **Critical bug to fix in Phase 2:** Spotify scraper returns `0` on failure — silently approves mainstream artists. Fix to return `null`, treat as "unverified" not "eligible" (spotify.ts in ~/decibel).
- **Critical bug to fix in Phase 3:** UTC date mismatch — check-ins after midnight match wrong event day. Fix: pass client local date from mobile app to check-in API.

## Session Continuity

Last session: 2026-03-10
Stopped at: Roadmap created — ready to run /gsd:plan-phase 2
Resume file: None
