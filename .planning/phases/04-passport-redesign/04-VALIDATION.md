---
phase: 4
slug: passport-redesign
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-11
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | No test framework (pure visual/UI phase) |
| **Config file** | None |
| **Quick run command** | `npx expo export --platform ios 2>&1 \| tail -5` |
| **Full suite command** | `npx expo export --platform ios` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx expo export --platform ios 2>&1 | tail -5`
- **After every plan wave:** EAS preview update + visual verification on device (both themes)
- **Before `/gsd:verify-work`:** Full TypeScript zero-error build + visual QA both themes
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | PASS-01 | build + manual | `npx expo export --platform ios` | N/A | ⬜ pending |
| 04-01-02 | 01 | 1 | PASS-02 | manual | Visual verify both themes | N/A | ⬜ pending |
| 04-01-03 | 01 | 1 | PASS-03 | build + manual | `npx expo export --platform ios` | N/A | ⬜ pending |
| 04-02-01 | 02 | 1 | PASS-04 | build + manual | `npx expo export --platform ios` | N/A | ⬜ pending |
| 04-02-02 | 02 | 1 | PASS-05 | manual | Verify rotation consistency | N/A | ⬜ pending |
| 04-02-03 | 02 | 1 | PASS-06 | manual | Verify stamp data fields | N/A | ⬜ pending |
| 04-02-04 | 02 | 1 | PASS-07 | manual | Toggle device theme | N/A | ⬜ pending |
| 04-02-05 | 02 | 1 | PASS-08 | build + manual | `npx expo export --platform ios` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `assets/textures/paper-grain-light.png` — texture for PASS-04, PASS-07
- [ ] `assets/textures/leather-dark.png` — texture for PASS-04, PASS-07
- [ ] Delete `app/collection.tsx` — route collision with new directory structure
- [ ] Create `app/collection/_layout.tsx` — directory route for PASS-03, PASS-08
- [ ] Update passport API to return platform URLs for Listen button (PASS-01)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Finds grid 2x3 layout with hero photo | PASS-01 | Pure visual layout | Verify 2-column grid, hero photo fills 60%, badge/fan count/Listen visible |
| Gold vs purple border glow | PASS-02 | Visual color distinction | Check Founded (gold) and Discovered (purple) cards side by side |
| Paper grain texture background | PASS-04 | Visual texture rendering | Verify texture visible in both themes |
| Stamp rotation determinism | PASS-05 | Visual consistency | Check same stamp rotates same angle across app restarts |
| Stamp content fields | PASS-06 | Visual data display | Verify venue (prominent), date (monospace), artist name(s) |
| Dark leather + glow vs cream + no glow | PASS-07 | Theme-dependent visual | Toggle system theme, verify stamps section changes |
| Chronological stamp list | PASS-08 | Sort order verification | Open View All Stamps, verify most recent first |

---

## Validation Sign-Off

- [x] All tasks have build verify or manual verification steps
- [x] Sampling continuity: build check after every commit
- [x] Wave 0 covers all missing references (textures, routes, API)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
