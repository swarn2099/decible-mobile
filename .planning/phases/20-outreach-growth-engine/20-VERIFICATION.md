---
phase: 20-outreach-growth-engine
verified: 2026-03-16T05:00:00Z
status: gaps_found
score: 3/4 success criteria verified
gaps:
  - truth: "Outreach emails are sent with correct artist name, collector count, and dashboard link"
    status: partial
    reason: "sendOutreachEmail is implemented in email.ts but is never called in outreach-cron.ts because performers table has no email column. sendMilestoneEmail is imported but never called in milestone-cron.ts for the same reason. Email infrastructure is built and ready but is structurally unreachable until artist email data exists in the DB."
    artifacts:
      - path: "/home/swarn/decibel-outreach/src/outreach-cron.ts"
        issue: "Does not import or call sendOutreachEmail. Channel logic only branches to instagram_dm or manual."
      - path: "/home/swarn/decibel-outreach/src/milestone-cron.ts"
        issue: "Imports sendMilestoneEmail but never calls it. Channel always resolves to instagram_dm or manual."
    missing:
      - "Either add email column to performers table with artist contact data, OR document that OUT-03 is intentionally deferred pending artist email data (update REQUIREMENTS.md)"
human_verification:
  - test: "Visit https://decible.live/api/share-card/milestone?artistName=Test+Artist&collectorCount=50&milestone=50 in a browser"
    expected: "Renders a 1080x1920 PNG with 'Test Artist', '50 COLLECTORS', 'Fan Favorite' badge, and Decibel branding. Pink-to-purple gradient accent lines top and bottom."
    why_human: "Endpoint redirects to www.decible.live which times out from the VM. Route code is substantive and correct. The existing founder share card also redirects to www — this is site-wide. SUMMARY confirms HTTP 200 was returned at time of deploy. Need to confirm the image renders correctly in a browser."
  - test: "SSH into VM, run: cd /home/swarn/decibel-outreach && npx ts-node src/outreach-cron.ts --run-now --dry-run"
    expected: "Lists artists with 10+ collectors not yet contacted. Each entry shows artist name, collector count, channel (instagram_dm or manual), founder name, and first ~100 chars of message text."
    why_human: "The single artist found at deploy time (Max Styler, 10 collectors) may have changed. Confirm cron still connects to Supabase and queries correctly."
  - test: "Run: npx ts-node src/milestone-cron.ts --run-now --dry-run"
    expected: "No artists with 25+ collectors found (or lists any that have crossed thresholds since deploy). No errors."
    why_human: "Current data had 0 artists at 25+ collectors. Confirm cron still runs cleanly."
---

# Phase 20: Outreach Growth Engine Verification Report

**Phase Goal:** Decibel automatically identifies artists who have earned attention, sends personalized outreach, and notifies them of collector milestones — driving artist signups without manual effort.
**Verified:** 2026-03-16T05:00:00Z
**Status:** gaps_found (1 gap + 3 human items)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Daily cron identifies artists with 10+ collectors not yet contacted; outreach rows created with correct personalization | VERIFIED | outreach-cron.ts L33-94: full query pipeline, collector counting, dedup filter, message generation. Dry-run output in SUMMARY: "1 artists identified". |
| 2 | Instagram DM queue generated with pre-written personalized messages | VERIFIED | outreach-cron.ts L124-133: channel='instagram_dm' branch inserts row with `message_text` containing artist name, collector count, founder name, claim URL. |
| 3 | Milestone notifications at 25/50/100 thresholds; no duplicate per threshold | VERIFIED | milestone-cron.ts L76-92: queries existing milestone rows, builds sentMilestones set, skips any already-notified. UNIQUE DB index `idx_artist_outreach_milestone` enforces at DB level too. |
| 4 | Milestone share card images generate with correct artist name and collector count | HUMAN NEEDED | route.tsx exists, is 284 lines, correct 1080x1920 dimensions, renders artistName + collectorCount + milestone badge. Site-wide HTTP 307 redirect prevents curl verification from VM. |

**Score: 3/4 truths fully verified (4th needs human)**

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `/home/swarn/decibel/src/app/api/admin/migrate-phase20/route.ts` | Migration endpoint for artist_outreach table | VERIFIED | 147 lines. Supabase Management API primary + pg fallback. GET handler with admin secret auth. Commit fc18990. |
| `/home/swarn/decibel/supabase/migrations/20260316_phase20_artist_outreach.sql` | Version-controlled DDL | VERIFIED | 32 lines. All required columns, UNIQUE indexes, status/artist indexes. Commit fc18990. |
| `/home/swarn/decibel/src/app/api/share-card/milestone/route.tsx` | Artist milestone share card | VERIFIED (code) | 284 lines. Edge runtime. 1080x1920. artistName, collectorCount, milestone badge rendered. Initials fallback. Claim CTA. Commit 4330353. Live endpoint returns 307 (site-wide redirect to www) — see Human Verification. |

### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `/home/swarn/decibel-outreach/src/outreach-cron.ts` | Daily outreach cron | VERIFIED | 187 lines (exceeds 80 min). Cron scheduled 0 10 * * *. Full pipeline: collections query → count → filter uncontacted → get founder → generate message → insert. --dry-run and --run-now flags. |
| `/home/swarn/decibel-outreach/src/milestone-cron.ts` | Milestone threshold cron | VERIFIED | 189 lines (exceeds 60 min). Cron scheduled 0 11 * * *. 25/50/100 thresholds. Dedup via sentMilestones set + DB UNIQUE constraint. Share card URL generation. |
| `/home/swarn/decibel-outreach/src/lib/email.ts` | Nodemailer email utility | VERIFIED (structure) | 135 lines. Exports sendOutreachEmail and sendMilestoneEmail. SMTP env var guard. Milestone-specific subject lines. HTML email templates. NOT called in crons — see Gaps. |
| `/home/swarn/decibel-outreach/src/lib/supabase.ts` | Supabase VM client | VERIFIED | 18 lines. createClient with service role key. Exports `supabase`. |
| `/home/swarn/decibel-outreach/ecosystem.config.js` | PM2 config | VERIFIED | Both `decibel-outreach` and `decibel-milestones` apps defined. autorestart: true. cwd correct. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| outreach-cron.ts | artist_outreach table | supabase.from('artist_outreach').insert() | WIRED | L139: inserts with artist_id, channel, outreach_type, message_text, collector_count_at_send, status |
| outreach-cron.ts | email.ts sendOutreachEmail | import + call | NOT WIRED | Not imported. Performers have no email column — email branch never reached. |
| milestone-cron.ts | artist_outreach table | supabase.from('artist_outreach').select('artist_id, milestone_threshold') | WIRED | L76-81: queries existing milestones before inserting new ones. Pattern matches key_links spec. |
| milestone-cron.ts | email.ts sendMilestoneEmail | import + call | PARTIAL | Imported at L6 but never called. Channel always instagram_dm or manual (no email column on performers). |
| milestone-cron.ts | share card URL | string interpolation to generate URL | WIRED | L113-118: generates full share card URL with all params. Correct endpoint path. |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| OUT-01 | 20-02 | Daily cron identifies artists with 10+ collectors not yet contacted | SATISFIED | outreach-cron.ts L51-78: filters to eligibleIds >= 10, removes contactedIds |
| OUT-02 | 20-02 | Outreach messages generated with correct personalization | SATISFIED | outreach-cron.ts L119: message includes artist name, collector count, founder name, claim URL |
| OUT-03 | 20-02 | Email sending works via VM | PARTIAL — email.ts is built but never called | sendOutreachEmail/sendMilestoneEmail never invoked. No email column on performers. Deferred. |
| OUT-04 | 20-02 | Instagram DM queue created for manual sending | SATISFIED | outreach-cron.ts L126-129: channel='instagram_dm', status='pending' row inserted |
| OUT-05 | 20-02 | Milestone notifications at 25, 50, 100 collector thresholds | SATISFIED | milestone-cron.ts L101-108: iterates MILESTONE_THRESHOLDS [25, 50, 100], skips crossed ones |
| OUT-06 | 20-01 | Artist milestone share cards generated as images | SATISFIED (code) | share-card/milestone/route.tsx: 1080x1920 PNG, correct params rendered. Human verify needed for live render. |
| OUT-07 | 20-01 + 20-02 | No duplicate outreach (one contact per threshold) | SATISFIED | DB: idx_artist_outreach_initial + idx_artist_outreach_milestone UNIQUE indexes. Code: sentMilestones Set + contactedIds Set checks. UNIQUE constraint violation (code 23505) handled gracefully. |

**Orphaned requirements:** None. All OUT-01 through OUT-07 appear in Plan 01 or Plan 02 requirements fields.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| milestone-cron.ts | 6 | `import { sendMilestoneEmail }` — imported but never called | Warning | Dead import. emailsSent counter always stays 0 in summary log. Misleads future devs. |
| outreach-cron.ts | — | sendOutreachEmail never imported | Info | Email capability exists in email.ts but is unreachable from the cron. Consistent with known limitation (no performers.email column). |

No blocker anti-patterns found. No TODO/FIXME/placeholder comments. No empty implementations.

---

## PM2 Process Status

Both processes verified online at time of verification:

```
│ 2  │ decibel-milestones  │ online │
│ 1  │ decibel-outreach    │ online │
```

`pm2 save` was called — both processes survive VM reboots.

---

## Human Verification Required

### 1. Milestone Share Card Renders Correctly

**Test:** In a browser, visit:
`https://decible.live/api/share-card/milestone?artistName=Test+Artist&collectorCount=50&milestone=50`

**Expected:** A 1080x1920 PNG image with:
- Dark background (#0B0B0F)
- "DECIBEL" wordmark at top
- "TA" initials in pink-to-purple gradient circle (no photo provided)
- "Test Artist" in large white bold text
- "50 COLLECTORS" in pink-to-purple gradient text
- "FAN FAVORITE ON DECIBEL" badge pill in pink
- "Fan Favorite" label below
- "Claim your free artist profile → decibel.live/claim" CTA
- "The Underground Music Passport" tagline at bottom
- Pink-to-purple gradient accent lines top and bottom

**Why human:** The endpoint redirects from decible.live → www.decible.live, and the www domain times out from the VM. All other share card routes (e.g., /api/share-card/founder) exhibit the same 307 redirect. This is site-wide Vercel routing behavior, not specific to the milestone route. SUMMARY reported HTTP 200 at deploy time. Code review confirms the route is substantive and correct.

### 2. Outreach Cron Dry Run

**Test:** SSH into VM, run:
```
cd /home/swarn/decibel-outreach && npx ts-node src/outreach-cron.ts --run-now --dry-run
```

**Expected:** Lists any artists with 10+ collectors not yet in artist_outreach. At deploy time: Max Styler (10 collectors, manual channel). Count may differ now.

**Why human:** Data-dependent. Confirms live Supabase connection still works and query returns correct results.

### 3. Milestone Cron Dry Run

**Test:** SSH into VM, run:
```
cd /home/swarn/decibel-outreach && npx ts-node src/milestone-cron.ts --run-now --dry-run
```

**Expected:** "No artists with 25+ collectors found" (or lists any that have reached 25+ since deploy). No errors.

**Why human:** Data-dependent. Confirms milestone threshold detection works correctly.

---

## Gaps Summary

**One structural gap (OUT-03):** Email sending is built but unreachable. The `sendOutreachEmail` function in `email.ts` is correct and well-formed, but `outreach-cron.ts` never imports or calls it because the `performers` table has no `email` column. The `sendMilestoneEmail` function is imported in `milestone-cron.ts` but never called for the same reason. The `emailsSent` counter in milestone-cron.ts always logs as 0.

This was a known schema deviation discovered during implementation (SUMMARY 20-02, deviation #2). The email infrastructure was intentionally preserved for future use.

**Resolution options:**
1. Add an `email` column to the `performers` table and populate it as artists are added — then wire up the email calls.
2. Formally mark OUT-03 as "deferred" in REQUIREMENTS.md with a note that it requires performers.email data.

The gap does not block the primary goal (automated artist discovery and outreach via IG DM/manual queue) but does mean email sending — a stated success criterion — is not functional.

---

_Verified: 2026-03-16T05:00:00Z_
_Verifier: Claude (gsd-verifier)_
