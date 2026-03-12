---
phase: 6
slug: bug-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (via Expo / React Native preset) |
| **Config file** | Existing `__tests__/` directories under `src/hooks/` and `src/components/collection/` |
| **Quick run command** | `npx jest --testPathPattern="useCollection\|SharePrompt\|leaderboard" --passWithNoTests` |
| **Full suite command** | `npx jest --passWithNoTests` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="useCollection\|SharePrompt\|leaderboard" --passWithNoTests`
- **After every plan wave:** Run `npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | BUG-01 | unit | `npx jest --testPathPattern="useCollection" --passWithNoTests` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | BUG-02 | unit | `npx jest --testPathPattern="useArtistProfile" --passWithNoTests` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | BUG-03 | unit | `npx jest --testPathPattern="SharePrompt" --passWithNoTests` | ❌ W0 | ⬜ pending |
| 06-01-04 | 01 | 1 | BUG-04 | manual smoke | Launch app → navigate to leaderboard | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/__tests__/useCollection.test.ts` — covers BUG-01 (mock `/mobile/discover`, verify 409 handling)
- [ ] `src/components/collection/__tests__/SharePrompt.test.ts` — covers BUG-03 (verify `onDone` + `setLoading(false)` in all paths)

*Note: BUG-02 verification is a code review check (apple_music_url inclusion). BUG-04 is manual smoke test (screen renders with data).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Leaderboard screen renders with tabs and data | BUG-04 | Full screen with navigation, tab switching, and FlatList — integration test would be brittle | 1. Open app 2. Navigate to leaderboard 3. Verify Fans tab shows ranked entries 4. Switch to Performers tab 5. Switch period filters |
| Share sheet opens with card image | BUG-03 | Native OS share sheet cannot be tested in Jest | 1. Open artist profile 2. Tap share 3. Verify share sheet appears with card or text fallback |
| Discover button adds to passport | BUG-01 | End-to-end flow requires live API | 1. Open artist profile (undiscovered) 2. Tap Discover 3. Verify passport shows new discovery |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
