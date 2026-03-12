---
phase: 7
slug: glassy-passport-redesign
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | No Jest/Vitest — EAS build + device testing |
| **Config file** | none — no test framework configured |
| **Quick run command** | `npx expo export --platform ios 2>&1 \| tail -5` |
| **Full suite command** | `CI=1 npx eas update --channel preview --environment preview --message "phase 7 verify"` |
| **Estimated runtime** | ~30 seconds (export), ~120 seconds (EAS deploy) |

---

## Sampling Rate

- **After every task commit:** Run `npx expo export --platform ios 2>&1 | grep -E "error|Error" | head -5`
- **After every plan wave:** Run `npx expo export --platform ios && npx expo export --platform android`
- **Before `/gsd:verify-work`:** Full EAS deploy + manual passport screen walkthrough on iOS + Android
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | MIG-01 | manual-only | Supabase SQL: `SELECT collection_type, count(*) FROM collections GROUP BY collection_type` | N/A | ⬜ pending |
| 07-01-02 | 01 | 1 | MIG-05 | manual-only | Supabase SQL: `SELECT column_name FROM information_schema.columns WHERE table_name='performers'` | N/A | ⬜ pending |
| 07-01-03 | 01 | 1 | MIG-06 | manual-only | Supabase SQL: `SELECT count(*) FROM collections WHERE collection_type='discovery'` | N/A | ⬜ pending |
| 07-01-04 | 01 | 1 | MIG-07 | manual-only | Supabase SQL: `SELECT indexname FROM pg_indexes WHERE tablename='performers' AND indexname LIKE '%spotify%'` | N/A | ⬜ pending |
| 07-01-05 | 01 | 1 | GPASS-14 | smoke | `npx expo export --platform android` (no errors) | N/A | ⬜ pending |
| 07-02-01 | 02 | 2 | GPASS-01 | smoke | `npx expo export --platform ios` (no errors) | N/A | ⬜ pending |
| 07-02-02 | 02 | 2 | GPASS-02 | manual-only | Physical device — swipe between tabs | N/A | ⬜ pending |
| 07-02-03 | 02 | 2 | GPASS-11 | smoke | build check (no TS errors) | N/A | ⬜ pending |
| 07-03-01 | 03 | 3 | GPASS-03 | smoke | build check | N/A | ⬜ pending |
| 07-03-02 | 03 | 3 | GPASS-04 | manual-only | Physical Android device | N/A | ⬜ pending |
| 07-03-03 | 03 | 3 | GPASS-05 | smoke | build check | N/A | ⬜ pending |
| 07-03-04 | 03 | 3 | GPASS-06 | smoke | build check | N/A | ⬜ pending |
| 07-03-05 | 03 | 3 | GPASS-07 | smoke | build check | N/A | ⬜ pending |
| 07-03-06 | 03 | 3 | GPASS-08 | manual-only | Physical device (haptic) | N/A | ⬜ pending |
| 07-03-07 | 03 | 3 | GPASS-13 | smoke | build check | N/A | ⬜ pending |
| 07-04-01 | 04 | 4 | GPASS-09 | smoke | build check | N/A | ⬜ pending |
| 07-04-02 | 04 | 4 | GPASS-10 | smoke | build check | N/A | ⬜ pending |
| 07-04-03 | 04 | 4 | GPASS-12 | manual-only | Android emulator API 30 | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Supabase migration SQL files created before any mobile code (MIG-01, MIG-05, MIG-06, MIG-07)
- [ ] `npx expo install react-native-pager-view` — new dependency for tab pager
- [ ] Verify existing BlurView components compile on Android after SDK 55 BlurTargetView fix

*No test framework to install — EAS build is the integration gate.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tab swipe gesture | GPASS-02 | Gesture requires physical device | Swipe left/right between Stamps, Finds, Discoveries tabs |
| Blur on Android | GPASS-04, GPASS-12 | BlurView rendering varies by device | Test on Android emulator + physical device |
| Haptic feedback | GPASS-08 | Haptic not testable headlessly | Tap card on physical device, feel light impact |
| Orb animation smoothness | GPASS-11 | Animation quality is visual | Watch orbs on passport screen for smooth drift |
| Glass strip legibility | GPASS-05/06/07 | Text-on-blur readability is visual | Check all three card types in dark + light mode |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
