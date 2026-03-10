---
phase: 2
slug: add-flow
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected — no jest/vitest config in decibel-mobile |
| **Config file** | None — Wave 0 installs if unit tests desired |
| **Quick run command** | `npx jest src/lib/urlParser.test.ts` (after Wave 0) |
| **Full suite command** | Manual E2E on device |
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
| 02-01-01 | 01 | 1 | ADD-12 | unit | backend jest (separate project) | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | ADD-06, ADD-07 | manual | `curl -X POST .../validate-artist-link` | n/a | ⬜ pending |
| 02-01-03 | 01 | 1 | ADD-09 | manual | `curl` with existing artist slug | n/a | ⬜ pending |
| 02-02-01 | 02 | 1 | ADD-04, ADD-05 | unit | `npx jest src/lib/urlParser.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | ADD-01, ADD-02 | manual | Device E2E — paste link, see preview | n/a | ⬜ pending |
| 02-02-03 | 02 | 1 | TAB-01, TAB-02, TAB-03 | manual | Device E2E — + tab mode toggle | n/a | ⬜ pending |
| 02-03-01 | 03 | 2 | ADD-08, ADD-10, ADD-11 | manual | Device E2E — found/discover flow | n/a | ⬜ pending |
| 02-03-02 | 03 | 2 | NAV-01, NAV-02, NAV-03 | manual | Device E2E — search bar in top bar | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/urlParser.test.ts` — stubs for ADD-04, ADD-05 URL parsing edge cases
- [ ] Framework: `npm install --save-dev jest @types/jest ts-jest` if unit tests desired

*Note: The decibel-mobile project has no test infrastructure. Given the primarily UI/integration nature of this phase, manual E2E testing on device is the practical validation path. URL parser unit tests are the one high-value automated opportunity.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Artist preview card renders name, image, listeners | ADD-01, ADD-02 | UI rendering on device | Paste Spotify URL → confirm card shows |
| Eligibility rejection with card visible | ADD-06, ADD-07 | Requires real API calls | Paste mainstream artist URL → see rejection |
| Existing artist detection | ADD-09 | Requires DB state | Paste already-added artist → see Discover action |
| Founder badge assignment | ADD-10, ADD-11 | Requires fresh artist + DB | Add new artist → verify founder_badges row |
| + tab mode toggle | TAB-01, TAB-02 | UI interaction | Tap toggle → verify mode switch animation |
| Search bar in Home top bar | NAV-01 | UI layout | Open Home → verify search icon position |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
