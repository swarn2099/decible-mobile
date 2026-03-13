---
phase: 9
slug: im-at-a-show
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30 + ts-jest 29 |
| **Config file** | `jest.config.js` (exists) |
| **Quick run command** | `npx jest --testPathPattern="useShowCheckin\|confidence\|layer" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="useShowCheckin|confidence" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | MIG-02 | manual-only | — (Supabase console) | N/A | ⬜ pending |
| 09-01-02 | 01 | 1 | MIG-03 | manual-only | — (Supabase console) | N/A | ⬜ pending |
| 09-01-03 | 01 | 1 | INFRA-01 | unit | `npx jest scrapeWithBrowser` | ❌ W0 | ⬜ pending |
| 09-01-04 | 01 | 1 | INFRA-02 | manual-only | — (PM2 config check) | N/A | ⬜ pending |
| 09-01-05 | 01 | 1 | INFRA-03 | unit | `npx jest scrapeWithBrowser -t "error"` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 2 | SHOW-03 | unit | `npx jest useShowCheckin -t "layer1"` | ❌ W0 | ⬜ pending |
| 09-02-02 | 02 | 2 | SHOW-09, SHOW-10 | unit | `npx jest layer2 --no-coverage` | ❌ W0 | ⬜ pending |
| 09-02-03 | 02 | 2 | SHOW-11 | unit | `npx jest layer3 --no-coverage` | ❌ W0 | ⬜ pending |
| 09-03-01 | 03 | 2 | SHOW-13 | unit | `npx jest layer5 --no-coverage` | ❌ W0 | ⬜ pending |
| 09-03-02 | 03 | 2 | SHOW-14 | unit | `npx jest layer6 --no-coverage` | ❌ W0 | ⬜ pending |
| 09-03-03 | 03 | 2 | SHOW-22 | unit | `npx jest show-checkin --no-coverage` | ❌ W0 | ⬜ pending |
| 09-04-01 | 04 | 3 | SHOW-16 | unit | `npx jest useShowCheckin -t "realtime"` | ❌ W0 | ⬜ pending |
| 09-04-02 | 04 | 3 | SHOW-25 | unit | `npx jest useShowCheckin -t "polling"` | ❌ W0 | ⬜ pending |
| 09-04-03 | 04 | 3 | SHOW-15 | manual-only | — (visual check) | N/A | ⬜ pending |
| 09-05-01 | 05 | 3 | SHOW-17 | unit | `npx jest confidence -t "tier"` | ❌ W0 | ⬜ pending |
| 09-05-02 | 05 | 3 | SHOW-18, SHOW-19 | manual-only | — (form UX check) | N/A | ⬜ pending |
| 09-05-03 | 05 | 3 | SHOW-06 | unit | `npx jest useShowCheckin -t "founder"` | ❌ W0 | ⬜ pending |
| 09-05-04 | 05 | 3 | SHOW-07, SHOW-08 | manual-only | — (animation + summary visual) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/__tests__/useShowCheckin.test.ts` — stubs for SHOW-03, SHOW-06, SHOW-16, SHOW-25
- [ ] `src/lib/__tests__/confidence.test.ts` — stubs for SHOW-17 confidence tier logic
- [ ] `~/decibel/scraper/__tests__/scrapeWithBrowser.test.ts` — stubs for INFRA-01, INFRA-03

*Existing jest infrastructure covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DB migrations applied | MIG-02, MIG-03 | DDL changes, Supabase console | Run migration SQL, verify tables + RLS + Realtime publication |
| PM2 config correct | INFRA-02 | Runtime process management | `pm2 start ecosystem.config.js`, verify `max_memory_restart` |
| Loading screen UX | SHOW-15 | Visual/animation | Trigger scrape, verify "Finding out..." screen renders |
| Manual fallback form | SHOW-18, SHOW-19 | Form UX | Wait 15s timeout, verify form appears with venue autocomplete + link paste |
| Stamp + Founder animation | SHOW-07, SHOW-08 | Haptic + animation | Check in with Founder-eligible artist, verify confetti + haptic + summary |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
