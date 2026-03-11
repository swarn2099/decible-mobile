---
phase: 3
slug: check-in
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no jest/vitest config in project |
| **Config file** | None — manual testing via EAS preview is established pattern |
| **Quick run command** | `cd /home/swarn/decibel-mobile && npx tsc --noEmit` |
| **Full suite command** | `CI=1 npx eas update --channel preview --environment preview --message "phase-03"` |
| **Estimated runtime** | ~15 seconds (tsc), ~60 seconds (EAS update) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `CI=1 npx eas update --channel preview --environment preview --message "phase-03 wave N"`
- **Before `/gsd:verify-work`:** Full EAS preview update + manual device verification
- **Max feedback latency:** 15 seconds (tsc check)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | CHK-09 | manual | Supabase table check | n/a | ⬜ pending |
| 03-01-02 | 01 | 1 | CHK-01, CHK-07 | manual | curl POST /mobile/check-in | n/a | ⬜ pending |
| 03-01-03 | 01 | 1 | CHK-02 | manual | curl POST /mobile/tag-performer | n/a | ⬜ pending |
| 03-02-01 | 02 | 2 | TAB-03, CHK-05 | manual | EAS preview, fresh install | n/a | ⬜ pending |
| 03-02-02 | 02 | 2 | CHK-06, CHK-08 | manual | EAS preview, at venue | n/a | ⬜ pending |
| 03-02-03 | 02 | 2 | CHK-01, CHK-10 | manual | EAS preview, at venue with lineup | n/a | ⬜ pending |
| 03-03-01 | 03 | 2 | CHK-02, CHK-03, CHK-04 | manual | EAS preview, at venue no lineup | n/a | ⬜ pending |
| 03-03-02 | 03 | 2 | ANIM-01, ANIM-02, ANIM-03 | manual | EAS preview, physical device | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No test framework setup needed — this project uses TypeScript compile checks + EAS preview deploys as its verification pattern.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GPS venue detection | CHK-01, CHK-06 | Requires physical device at venue | Deploy EAS preview, go to known venue, verify venue confirmation |
| GPS accuracy error | CHK-08 | Requires degraded GPS signal | Enable airplane mode briefly, re-enable, check accuracy handling |
| Haptic feedback | ANIM-02 | Physical device only | Check-in on physical device, feel medium impact haptic |
| Stamp animation visual | ANIM-01, ANIM-03 | Visual quality judgment | Watch full animation on device, verify stamp slam + ink spread + reveal |
| Late-night date | CHK-07 | Time-dependent scenario | Check in after midnight, verify correct event date match |
| Tagged performers visible | CHK-09 | Multi-device scenario | Tag performer on device A, check in on device B at same venue |
| Duplicate check-in block | N/A (CONTEXT) | User flow testing | Check in twice at same venue, verify block message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
