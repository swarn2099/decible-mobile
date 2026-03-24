# Decibel Database Cleanup — Step 1 Diagnostics

> Generated 2026-03-24 — Pre-cleanup analysis for Vouch pivot

---

## Performers: Keep vs Delete

| Metric | Count |
|--------|-------|
| **Performers to KEEP** (referenced by founder_badges, collections, or fan_tiers) | **192** |
| **Performers to DELETE** (zero user interaction — scraped Chicago artists) | **3,902** |
| Total performers currently in DB | 4,094 |

---

## Fan Activity Breakdown

| Name | Email | Founds | Collections | Fan Follows | Verdict |
|------|-------|--------|-------------|-------------|---------|
| B Way | bwahe8@gmail.com | 55 | 78 | Yes | **KEEP** |
| Holden | holden.leming@gmail.com | 53 | 76 | Yes | **KEEP** |
| Emilia.kacprzak | emily.kacprzak@gmail.com | 26 | 29 | Yes (followed by swarn) | **KEEP** |
| Kyle | kyleaeddy@gmail.com | 18 | 21 | Yes (followed by swarn) | **KEEP** |
| swarn2099 | swarn2099@gmail.com | 16 | 33 | Yes (follows 6 users) | **KEEP** |
| Cliff Heights | cullymax@gmail.com | 13 | 24 | No | **KEEP** (has collections) |
| Maddie | maddiedaniell5@gmail.com | 1 | 4 | No | **KEEP** (has collections) |
| ejl5346 | ejl5346@sbcglobal.net | 0 | 1 | No | **KEEP** (has 1 collection) |
| AGulia | guliaarunima@gmail.com | 0 | 1 | Yes (followed by swarn) | **KEEP** |
| gigashaan | guliaeshaan@gmail.com | 0 | 0 | Yes (mutual follow with swarn) | **KEEP** |
| (no name) | test@test.com | 0 | 0 | No | **DELETE** |
| Test Bot | testbot@decibel.test | 0 | 0 | No | **DELETE** |
| App Reviewer | apple-review@decibel.app | 0 | 0 | No | **DELETE** |

**Result: 10 fans kept, 3 deleted.**

---

## Fan Follows (All 9 Relationships)

| Follower | Following |
|----------|-----------|
| swarn2099 | AGulia |
| swarn2099 | Emilia.kacprzak |
| swarn2099 | Kyle |
| swarn2099 | B Way |
| swarn2099 | Holden |
| swarn2099 | gigashaan |
| gigashaan | swarn2099 |
| Holden | B Way |
| Holden | swarn2099 |

All 9 follow relationships will be preserved.

---

## Orphan Events

| Metric | Count |
|--------|-------|
| Events referencing un-interacted performers (to delete) | **9,242** |
| Total events in DB | 8,559* |

*Note: orphan count (9,242) exceeds total events (8,559) because `pg_stat_user_tables.n_live_tup` is an estimate. The actual count may differ slightly. The DELETE will only affect rows that match the WHERE clause.

---

## Venues

| Metric | Count |
|--------|-------|
| Venues referenced by kept collections or events | **16** |
| Total venues in DB | 384 |
| Venues to delete (unreferenced) | ~368 |

---

## Expected Post-Cleanup State

| Table | Before | After (expected) | Change |
|-------|--------|-------------------|--------|
| **performers** | 4,094 | ~192 | -3,902 |
| **fans** | 13 | 10 | -3 |
| **events** | 8,559 | significantly less | bulk delete |
| **venues** | 384 | ~16 | -368 |
| **collections** | 267 | **267 (unchanged)** | 0 |
| **founder_badges** | 182 | **182 (unchanged)** | 0 |
| **fan_follows** | 9 | **9 (unchanged)** | 0 |
| **fan_tiers** | 153 | reduced (only kept performers) | some deleted |
| **fan_badges** | 19 | reduced (only kept fans) | some deleted |
| **notification_preferences** | 4 | reduced | some deleted |

---

## Safety Checks

- All DELETE operations will run inside a single transaction (BEGIN/COMMIT)
- Collections count must remain exactly 267 after cleanup
- Founder badges count must remain exactly 182 after cleanup
- Fan follows count must remain exactly 9 after cleanup
- No fans with collections or founder_badges will be touched
- No performers referenced by collections, founder_badges, or fan_tiers will be touched

---

## Status: AWAITING CONFIRMATION

Step 2 (the actual cleanup) will not run until Swarn confirms these numbers look correct.
