---
phase: 8
slug: jukebox
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30 + ts-jest |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npx jest --passWithNoTests --testPathPattern jukebox` |
| **Full suite command** | `npx jest --passWithNoTests` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --passWithNoTests --testPathPattern jukebox`
- **After every plan wave:** Run `npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | MIG-04 | smoke | curl Supabase REST | ❌ manual | ⬜ pending |
| 08-01-02 | 01 | 1 | JBX-02, JBX-03 | unit | `npx jest --testPathPattern useJukebox` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 2 | JBX-06 | unit | `npx jest --testPathPattern EmbeddedPlayer` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 2 | JBX-07 | manual | Device test | manual-only | ⬜ pending |
| 08-03-01 | 03 | 2 | JBX-09 | unit | existing useDiscover tests | ✅ existing | ⬜ pending |
| 08-03-02 | 03 | 2 | JBX-14 | smoke | curl POST /discover + check notification | ❌ manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/__tests__/useJukebox.test.ts` — stubs for JBX-02/03 feed query logic
- [ ] `src/components/jukebox/__tests__/EmbeddedPlayer.test.tsx` — stubs for JBX-06 pool logic

*Most Jukebox validation is manual — embedded WebView audio behavior cannot be tested in Jest*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Embedded players render and play audio | JBX-04, JBX-05 | WebView audio requires real device | Open Jukebox, tap play on Spotify/SC/AM card, verify audio plays |
| Opening Jukebox doesn't interrupt background music | JBX-07 | Audio session behavior requires device | Play music in Spotify app, open Jukebox, verify music continues |
| Discover adds to Passport Discoveries tab | JBX-09 | E2E flow across screens | Tap Discover on Jukebox card, navigate to Passport → Discoveries, verify card appears |
| Map icon replaced with Jukebox icon | JBX-01 | Visual verification | Check Home tab bar, verify music list icon replaces map icon |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
