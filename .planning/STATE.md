---
gsd_state_version: 1.0
milestone: v3.0
milestone_name: The Living Passport
status: executing
stopped_at: Completed 09-04-PLAN.md
last_updated: "2026-03-13T16:14:18.724Z"
last_activity: "2026-03-12 — Plan 07-01 complete: DB migrations applied, pager-view installed, passport API extended, BlurTargetView fix on 3 modals"
progress:
  total_phases: 9
  completed_phases: 7
  total_plans: 24
  completed_plans: 23
  percent: 14
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-12)

**Core value:** Discover underground artists before anyone else (Finds) and prove you were at the show (Stamps) — a live music passport.
**Current focus:** Phase 7 — Glassy Passport Redesign (3-way collection split, pager tabs, visual overhaul)

## Current Position

Phase: 7 of 9 (Glassy Passport Redesign)
Plan: 1 of N in current phase (07-01 complete)
Status: Phase 7 in progress
Last activity: 2026-03-12 — Plan 07-01 complete: DB migrations applied, pager-view installed, passport API extended, BlurTargetView fix on 3 modals

Progress: [██░░░░░░░░] 14%

## Performance Metrics

**Velocity (from v1.0):**
- Total plans completed: 11
- Average duration: ~20 min/plan

**By Phase (v1.0):**

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Scaffold | 1/1 | Complete |
| 2. Add Flow | 3/3 | Complete |
| 3. Check-In | 3/3 | Complete |
| 4. Passport Redesign | 2/2 | Complete |
| 5. Share + Polish | 3/3 | Complete |
| Phase 07-glassy-passport-redesign P02 | 3 | 2 tasks | 5 files |
| Phase 07-glassy-passport-redesign P03 | 4 | 2 tasks | 3 files |
| Phase 07-glassy-passport-redesign P04 | 15 | 2 tasks | 7 files |
| Phase 08-jukebox P01 | 25 | 2 tasks | 5 files |
| Phase 08-jukebox P02 | 15 | 2 tasks | 4 files |
| Phase 08-jukebox P03 | 4 | 2 tasks | 3 files |
| Phase 09-im-at-a-show P01 | 429 | 2 tasks | 11 files |
| Phase 09-im-at-a-show P02 | 274 | 2 tasks | 5 files |
| Phase 09-im-at-a-show P03 | 420 | 2 tasks | 5 files |
| Phase 09-im-at-a-show P04 | 202 | 2 tasks | 4 files |

## Accumulated Context

### Decisions

- Link-paste over text search: prevents adding mainstream artists, intentional friction filters for real fans
- 3 tabs (Home, +, Passport): simpler than v4's 4 tabs, + button emphasizes primary action
- Finds vs Stamps visual separation: different aesthetics match different user motivations
- DB migrations front-loaded into each phase that needs them (not a separate phase)
- BlurTargetView pattern established (Phase 7-01): all modal blur backgrounds use BlurTargetView ref + BlurView blurTarget — StampAnimationModal, SharePrompt, ConfirmationModal all converted
- collection_type 3-way split established: stamp (verified live), find (online+founder), discovery (online no-founder) — 133 rows backfilled in DB
- LLM Layer 6 confidence "low" results NEVER auto-collect — require platform link paste from user
- Fire-and-forget VM dispatch: Vercel handles Layer 1 fast path, unawaited POST to VM on miss, mobile subscribes to Realtime by searchId
- Realtime RLS: search_results table requires SELECT policy scoped to user_id = auth.uid() or events drop silently
- iOS Realtime background disconnect: polling fallback required in Phase 9 — confirmed bug supabase/realtime #1088
- apiCall pattern: all mobile API mutations use apiCall from @/lib/api — never raw fetch with manual auth (established in Phase 6)
- SharePrompt finally block: async share flows use finally to guarantee loading state cleanup regardless of success/failure
- Leaderboard trophy nav: absolute overlay on passport screen (zIndex 10), not a PassportHeader modification — lower surface area
- [Phase 07-glassy-passport-redesign]: GlassCard Android pattern: rotation on outer Animated.View, overflow:hidden on inner Pressable — prevents Android clipping bug on rotated views
- [Phase 07-glassy-passport-redesign]: OrbBackground uses LinearGradient radial falloff (no BlurView on orbs) — low overhead, perceived blur from large size + low opacity
- [Phase 07-glassy-passport-redesign]: PassportPager tab pill: tabOffset SharedValue drives smooth mid-swipe animation via onPageScroll, synced to React state in onPageSelected
- [Phase 07-glassy-passport-redesign]: passport.tsx no-parent-ScrollView pattern: OrbBackground sibling behind SafeAreaView, PassportPager(flex:1) prevents PagerView gesture conflicts
- [Phase 07-04]: GlassCard simplified prop: BlurView in passport grid, LinearGradient in View More FlatLists — same component, different render path for perf
- [Phase 07-04]: passport-collections endpoint separate from /passport route — avoids bloating the heavy main route with type-filter-only use cases
- [Phase 08-jukebox]: isFallback=true when fan has no followees OR followees have no recent Finds — both cases serve global feed
- [Phase 08-jukebox]: Jukebox embed URL derivation: fire-and-forget backfill pattern — derive on miss, upsert performers table without blocking response
- [Phase 08-jukebox]: WebView pool uses ref for ordered eviction + state Set for render — avoids stale closure in onViewableItemsChanged callback
- [Phase 08-jukebox]: EmbeddedPlayer placeholder preserves exact height to prevent FlatList layout jumps on pool eviction
- [Phase 08-jukebox]: userId for sendPushNotification uses fan.id (fans table UUID) — follows existing collect/route.ts pattern
- [Phase 09-im-at-a-show]: Used Supabase Management API (PAT) for migrations — psql not installed, supabase db execute removed in CLI 2.78.1
- [Phase 09-im-at-a-show]: Scraper as standalone ~/decibel/scraper/ project — isolates Playwright from Vercel build env, clean PM2 process boundary
- [Phase 09-im-at-a-show]: SCRAPER_SHARED_SECRET generated as crypto.randomUUID() = 19ee0dae-fd1a-4b85-8222-1895fab1233f — must be added to Vercel env for VM-to-Vercel calls
- [Phase 09-im-at-a-show]: Layer 2 runs in parallel with Layer 3 via Promise.all — geocode and event APIs are both I/O bound, no benefit to sequencing
- [Phase 09-im-at-a-show]: Songkick source skips gracefully when SONGKICK_API_KEY env var not set — avoids auth errors when key not configured
- [Phase 09-im-at-a-show]: Layer 6 always returns confidence low — LLM web search results require user confirmation via link paste
- [Phase 09-im-at-a-show]: tsconfig.json excludes scraper/ from Vercel build — @anthropic-ai/sdk not installed in Vercel project
- [Phase 09-im-at-a-show]: show-checkin POST enriches performers with is_founder_available for instant UI state without extra roundtrip
- [Phase 09-im-at-a-show]: lastPositionRef stores lat/lng from GPS scan for startCheckin() call — avoids second GPS request in handleConfirmVenue
- [Phase 09-im-at-a-show]: show_result placeholder in CheckInWizard until Plan 09-05 confidence-aware collection UI

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 9 Layer 2: validate RA GraphQL schema, EDMTrain rate limits, Songkick API status (post-Suno acquisition, MEDIUM confidence) before writing layer2 module
- Phase 9: Realtime reconnection must be tested on physical iOS device (not simulator) with app backgrounded during 15s scrape window

## Session Continuity

Last session: 2026-03-13T16:14:18.718Z
Stopped at: Completed 09-04-PLAN.md
Resume file: None
