---
phase: 20-outreach-growth-engine
plan: "02"
subsystem: vm-cron
tags: [cron, outreach, pm2, email, instagram-dm, milestone]
dependency_graph:
  requires: [20-01]
  provides: [outreach_cron, milestone_cron, pm2_deployment]
  affects: []
tech_stack:
  added: [node-cron, nodemailer, @supabase/supabase-js, ts-node, dotenv]
  patterns: [pm2-cron-deployment, supabase-service-role-vm, nodemailer-smtp]
key_files:
  created:
    - /home/swarn/decibel-outreach/package.json
    - /home/swarn/decibel-outreach/tsconfig.json
    - /home/swarn/decibel-outreach/.env
    - /home/swarn/decibel-outreach/src/lib/supabase.ts
    - /home/swarn/decibel-outreach/src/lib/email.ts
    - /home/swarn/decibel-outreach/src/outreach-cron.ts
    - /home/swarn/decibel-outreach/src/milestone-cron.ts
    - /home/swarn/decibel-outreach/ecosystem.config.js
  modified: []
decisions:
  - "performers table has no email column — initial outreach channel is instagram_dm or manual only; email sending is implemented in email.ts and ready for future use when artist emails are available"
  - "Supabase URL in plan (dgpbzfjsppubzztnszrv) was the old project; actual URL (savcbkbgoadjxkjnteqv) copied from /home/swarn/decibel/.env.local"
  - "Collection counting done client-side in JS to avoid RPC complexity with Supabase JS client"
metrics:
  duration: "4m"
  completed_date: "2026-03-16"
  tasks_completed: 3
  files_created: 8
---

# Phase 20 Plan 02: Daily Outreach Cron + Milestone Cron Summary

Daily cron identifies artists with 10+ collectors not yet contacted and queues IG DM/manual outreach rows; milestone cron detects 25/50/100 threshold crossings and generates share card links — both running under PM2 at /home/swarn/decibel-outreach.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Scaffold project + daily outreach cron | 6e93cea | package.json, tsconfig.json, .env, supabase.ts, email.ts, outreach-cron.ts |
| 2 | Milestone cron + PM2 config + deploy | 9bea82d | milestone-cron.ts, ecosystem.config.js |
| 3 | Verify complete outreach engine | — | (auto-approved checkpoint) |

## What Was Built

### Task 1: Outreach Project Scaffold

- Self-contained Node.js TypeScript project at `/home/swarn/decibel-outreach/`
- `src/lib/supabase.ts`: Supabase client using service role key (copied from /home/swarn/decibel/.env.local)
- `src/lib/email.ts`: Nodemailer transporter with `sendOutreachEmail()` and `sendMilestoneEmail()` — gracefully skips if SMTP vars not set
- `src/outreach-cron.ts`: Runs at 10 AM UTC daily. Queries collections to count per performer, finds artists with 10+ not yet in `artist_outreach` (outreach_type='initial'), fetches founder badge, generates message, queues as instagram_dm or manual channel

### Task 2: Milestone Cron + PM2

- `src/milestone-cron.ts`: Runs at 11 AM UTC daily. Checks 25/50/100 thresholds for all artists. Generates share card URLs (`/api/share-card/milestone`). Inserts milestone rows — UNIQUE constraint prevents duplicates
- `ecosystem.config.js`: PM2 config for `decibel-outreach` and `decibel-milestones` processes
- Both processes started and online (`pm2 list` confirms)
- `pm2 save` called — survives VM reboots

### Verification Output

```
# Outreach dry run:
[2026-03-16T04:52:47Z] Outreach: 1 artists identified for outreach
  [DRY RUN] Max Styler (10 collectors) → channel: manual, founder: A Decibel fan
[2026-03-16T04:52:47Z] Outreach: [DRY RUN] Would process: 1 artists, 0 IG DMs queued, 1 manual flagged

# Milestone dry run:
[2026-03-16T04:53:40Z] Milestones: No artists with 25+ collectors found

# PM2 list:
│ 2  │ decibel-milestones │ ... │ online │
│ 1  │ decibel-outreach   │ ... │ online │
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] performers.image_url doesn't exist — actual column is photo_url**
- **Found during:** Task 1 verification
- **Issue:** Plan spec listed `image_url` as performers column but actual schema uses `photo_url`
- **Fix:** Updated all references in outreach-cron.ts and milestone-cron.ts to `photo_url`
- **Files modified:** src/outreach-cron.ts, src/milestone-cron.ts
- **Commit:** 6e93cea (included in initial commit)

**2. [Rule 1 - Bug] performers.email doesn't exist — no email column on performers table**
- **Found during:** Task 1 verification
- **Issue:** Plan spec listed `email (may be NULL)` as performers column but the initial schema has no email column on performers (email is on fans table only)
- **Fix:** Removed email from performers query; outreach channel defaults to `instagram_dm` or `manual`. Email utility (`sendOutreachEmail`, `sendMilestoneEmail`) preserved in email.ts for future use when artist email data is available. sendMilestoneEmail also preserved for when email-verified artists exist.
- **Files modified:** src/outreach-cron.ts, src/milestone-cron.ts
- **Commit:** 6e93cea (included in initial commit)

**3. [Rule 1 - Bug] Wrong Supabase project URL in plan spec**
- **Found during:** Task 1 scaffold
- **Issue:** Plan specified `dgpbzfjsppubzztnszrv.supabase.co` (old project ID) but live project is `savcbkbgoadjxkjnteqv.supabase.co`
- **Fix:** Used actual URL from /home/swarn/decibel/.env.local
- **Files modified:** .env
- **Commit:** 6e93cea (included in initial commit)

## Self-Check: PASSED

- /home/swarn/decibel-outreach/package.json: FOUND
- /home/swarn/decibel-outreach/tsconfig.json: FOUND
- /home/swarn/decibel-outreach/.env: FOUND
- /home/swarn/decibel-outreach/src/lib/supabase.ts: FOUND
- /home/swarn/decibel-outreach/src/lib/email.ts: FOUND
- /home/swarn/decibel-outreach/src/outreach-cron.ts: FOUND
- /home/swarn/decibel-outreach/src/milestone-cron.ts: FOUND
- /home/swarn/decibel-outreach/ecosystem.config.js: FOUND
- Commit 6e93cea: FOUND
- Commit 9bea82d: FOUND
- PM2 processes online: CONFIRMED
