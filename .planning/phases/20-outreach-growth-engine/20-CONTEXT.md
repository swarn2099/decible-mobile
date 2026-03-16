# Phase 20: Outreach & Growth Engine - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning
**Source:** PRD Express Path (DECIBEL_V6_PRD.md Phase 7)

<domain>
## Phase Boundary

This phase automates artist outreach and milestone notifications. Runs on the DigitalOcean VM as cron jobs.

Two locations:
- /home/swarn/decibel — API endpoints for share card generation, outreach tracking table migration
- DigitalOcean VM (this machine) — Cron scripts for daily outreach + milestone checks

This is the growth flywheel: artists with 10+ collectors get contacted automatically. Milestone notifications keep them engaged. Share cards give them free marketing material.

</domain>

<decisions>
## Implementation Decisions

### Daily Outreach Cron (OUT-01, OUT-02)
- Runs daily on DigitalOcean VM
- Query artists with 10+ collectors who have NOT been contacted yet
- For each qualifying artist:
  - Generate personalized outreach message
  - Store in `artist_outreach` table with status 'pending'
  - If Instagram handle known: queue Instagram DM (manual sending by Swarn)
  - If email known: send email via Nodemailer
  - If neither: flag for manual outreach

### Outreach Message Template
- Subject (email): "[X] people on Decibel have collected you"
- Body: "Hey [Artist Name] — [X] people on Decibel have collected you as one of their favorite emerging artists. [Founder username] was the first person to add you to the platform. See who your fans are and reach them directly — claim your free profile at decibel.live/claim/[artistslug]. Your first 14 days are free."

### Milestone Notifications (OUT-05)
- At 25 collectors: "You just hit 25 collectors on Decibel"
- At 50 collectors: "50 fans have collected you"
- At 100 collectors: "You're in the top X% of artists on Decibel"
- Each milestone email includes a shareable graphic
- No duplicate outreach — each threshold contacted only once

### Artist Milestone Share Cards (OUT-06)
- Auto-generated images for artists to share
- "[Artist Name] — Collected by 50 people on Decibel"
- Artist's image as background
- Collector count prominent
- "See who your fans are → decibel.live/[slug]"
- Decibel branding
- Can reuse the server-rendered ImageResponse pattern from share-card APIs

### Outreach Tracking Table
```sql
CREATE TABLE artist_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES performers(id),
  channel TEXT, -- 'instagram_dm', 'email', 'manual'
  message_template TEXT,
  collector_count_at_send INTEGER,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'claimed', 'ignored'
  sent_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Email Sending
- Nodemailer on the VM
- Need SMTP credentials (Gmail app password, SendGrid, or similar)
- From: outreach@decibel.live or noreply@decibel.live

### Instagram DM Queue
- NOT automated (IG blocks bot DMs)
- Generate a queue file/table with pre-written messages
- Swarn sends manually from @decibellive account
- Track status in artist_outreach table

### Claude's Discretion
- Script language (Node.js TypeScript recommended since the rest of the stack is TS)
- Cron scheduling tool (node-cron, system crontab, or PM2)
- Email provider (Nodemailer + Gmail app password for MVP)
- Share card generation approach (reuse existing ImageResponse API or generate locally)
- Queue format for Instagram DMs (Supabase table rows vs local JSON file)

</decisions>

<specifics>
## Specific Ideas

- The VM already runs cron jobs (sentinel trading bot uses node-cron + tmux)
- Supabase JS client can be used directly from the VM scripts
- Share card APIs already exist at /api/share-card/ — can create a new /api/share-card/milestone route
- The artist_outreach table needs to be created (similar to Phase 19 migration pattern)
- For Instagram DMs, a simple dashboard query showing pending DMs with copy-paste messages would work

</specifics>

<deferred>
## Deferred Ideas

- Fully automated Instagram DMs (fragile, platforms block bots)
- A/B testing outreach message templates
- Advanced analytics on outreach conversion rates

</deferred>

---

*Phase: 20-outreach-growth-engine*
*Context gathered: 2026-03-16 via PRD Express Path*
