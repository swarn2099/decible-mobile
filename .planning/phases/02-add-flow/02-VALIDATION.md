---
phase: 2
slug: add-flow
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest + ts-jest (installed in Plan 02-02 Task 0) |
| **Config file** | jest.config.js |
| **Quick run command** | `npx jest src/lib/urlParser.test.ts` |
| **Full suite command** | `npx jest` + Manual E2E on device |
| **Estimated runtime** | ~5 seconds (unit) / ~60 seconds (manual E2E) |

---

## Sampling Rate

- **After every task commit:** Manual curl test of `validate-artist-link` endpoint
- **After every plan wave:** Manual E2E on device — paste a Spotify URL, verify card renders correctly
- **Before `/gsd:verify-work`:** All 5 success criteria manually verified
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | ADD-12 | unit | backend jest (separate project) | n/a | ⬜ pending |
| 02-01-02 | 01 | 1 | ADD-06, ADD-07 | manual | `curl -X POST .../validate-artist-link` | n/a | ⬜ pending |
| 02-01-03 | 01 | 1 | ADD-09 | manual | `curl` with existing artist slug | n/a | ⬜ pending |
| 02-02-00 | 02 | 2 | ADD-04, ADD-05 | unit | `npx jest src/lib/urlParser.test.ts` | Created in task | ⬜ pending |
| 02-02-01 | 02 | 2 | ADD-04, ADD-05 | unit | `npx jest src/lib/urlParser.test.ts` | Yes (from Task 0) | ⬜ pending |
| 02-02-02 | 02 | 2 | ADD-01, ADD-02, ADD-03 | manual | Device E2E — paste link, see preview | n/a | ⬜ pending |
| 02-02-03 | 02 | 2 | TAB-01, TAB-02 | manual | Device E2E — + tab mode toggle | n/a | ⬜ pending |
| 02-03-01 | 03 | 3 | ADD-10 | manual | Device E2E — found/discover flow | n/a | ⬜ pending |
| 02-03-02 | 03 | 3 | ADD-10 | manual | Device E2E — SoundCloud/Apple Music add | n/a | ⬜ pending |
| 02-03-03 | 03 | 3 | NAV-01, NAV-02, NAV-03 | manual | Device E2E — search bar in top bar | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/lib/urlParser.test.ts` — Created in Plan 02-02 Task 0 (jest + ts-jest installed, test stubs written)
- [x] Framework: `npm install --save-dev jest @types/jest ts-jest` — Part of Plan 02-02 Task 0

*Wave 0 is addressed by Plan 02-02 Task 0 which installs jest, creates jest.config.js, and writes urlParser.test.ts stubs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Artist preview card renders name, image, listeners | ADD-01, ADD-02 | UI rendering on device | Paste Spotify URL -> confirm card shows |
| SoundCloud card shows followers (not listeners) | ADD-03 | UI rendering on device | Paste SoundCloud URL -> confirm "X followers" shown |
| Eligibility rejection with card visible | ADD-06, ADD-07 | Requires real API calls | Paste mainstream artist URL -> see rejection |
| Existing artist detection | ADD-09 | Requires DB state | Paste already-added artist -> see Discover action |
| Founder badge assignment | ADD-10, ADD-11 | Requires fresh artist + DB | Add new artist -> verify founder_badges row |
| + tab mode toggle | TAB-01, TAB-02 | UI interaction | Tap toggle -> verify mode switch |
| Search bar in Home top bar | NAV-01 | UI layout | Open Home -> verify search icon position |
| Existing relationship disabled state | ADD-09 | Requires DB state | Paste already-found artist -> see disabled Founded button |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (Plan 02-02 Task 0)
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
