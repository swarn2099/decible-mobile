---
phase: 5
slug: share-polish
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-11
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30 + ts-jest |
| **Config file** | jest.config.js |
| **Quick run command** | `npx jest` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest`
- **After every plan wave:** Run `npx jest` + `npx tsc --noEmit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | SHR-03 | manual-only | curl test at deploy | N/A | ⬜ pending |
| 05-01-02 | 01 | 1 | SHR-04 | manual-only | curl test at deploy | N/A | ⬜ pending |
| 05-02-00 | 02 | 2 | SHR-01 | unit (W0) | `npx jest --testPathPattern="ConfirmationModal"` | ✅ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | SHR-01 | unit | `npx jest --testPathPattern="ConfirmationModal"` | ✅ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | SHR-02, SHR-05, SHR-06 | type-check | `npx tsc --noEmit` | N/A | ⬜ pending |
| 05-03-00 | 03 | 2 | ART-01 | unit (W0) | `npx jest --testPathPattern="useArtistFans"` | ✅ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | ART-01 | unit | `npx jest --testPathPattern="useArtistFans"` | ✅ W0 | ⬜ pending |
| 05-03-02 | 03 | 2 | ART-02 | manual-only | Already wired — verify navigation | N/A | ⬜ pending |
| 05-03-03 | 03 | 2 | POL-01, POL-02 | type-check | `npx tsc --noEmit` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/components/collection/__tests__/ConfirmationModal.test.ts` — stubs for SHR-01 (founded type rendering) — created by Plan 02 Task 0
- [x] `src/hooks/__tests__/useArtistFans.test.ts` — stubs for ART-01 (tier sort order) — created by Plan 03 Task 0

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Founder share card returns PNG | SHR-03 | Edge runtime not testable in Jest | `curl -I https://decible.live/api/share-card/founder?name=...` |
| Passport share card returns PNG | SHR-04 | Edge runtime not testable in Jest | `curl -I https://decible.live/api/share-card/passport?name=...` |
| Save to Photos permission | SHR-06 | Requires real device | Tap Save in ShareSheet, verify permission prompt + album save |
| Native share sheet opens | SHR-05 | Requires real device | Tap Share in celebration modal, verify OS share sheet |
| Dark/light mode QA | POL-01 | Visual verification | Toggle system theme, verify all screens |
| Bottom padding for tab bar | POL-02 | Visual verification | Scroll to bottom of all scrollable screens |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
