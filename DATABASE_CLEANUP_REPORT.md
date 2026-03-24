# Decibel → Vouch Database Cleanup Report

> Executed 2026-03-24 against Supabase project `savcbkbgoadjxkjnteqv`

---

## Safety Check Results

| Constraint | Expected | Actual | Status |
|-----------|----------|--------|--------|
| collections count | 267 | **267** | PASS |
| founder_badges count | 182 | **182** | PASS |
| follows count | 9 | **9** | PASS |

---

## Final Table Counts

| Table | Before | After | Change |
|-------|--------|-------|--------|
| **users** (was `fans`) | 13 | **10** | -3 (test accounts removed) |
| **items** (was `performers`) | 4,094 | **192** | -3,902 (scraped artists removed) |
| **founder_badges** | 182 | **182** | unchanged |
| **collections** | 267 | **267** | unchanged |
| **follows** (was `fan_follows`) | 9 | **9** | unchanged |
| fan_tiers | 153 | **0** | cleared (not needed for Vouch) |
| fan_badges | 19 | **0** | cleared (not needed for Vouch) |
| events | 8,559 | **0** | cleared (not needed for Vouch) |
| venues | 384 | **0** | cleared (not needed for Vouch) |
| notification_preferences | 4 | **0** | cleared |
| notifications_log | 0 | **0** | already empty |
| push_tokens | 0 | **0** | already empty |
| artist_outreach | 1 | **0** | cleared |
| venue_submissions | 0 | **0** | already empty |
| search_results | 0 | **0** | already empty |
| scraped_profiles | 0 | **0** | already empty |
| artist_claims | 0 | **0** | already empty |
| artist_links | 0 | **0** | already empty |
| artist_messages | 0 | **0** | already empty |
| artist_shows | 0 | **0** | already empty |
| artist_subscriptions | 0 | **0** | already empty |
| messages | 0 | **0** | already empty |
| spotify_tokens | 1 | **1** | untouched |

---

## Remaining Users (10)

| Name | Email | Founder Badges | Collections |
|------|-------|----------------|-------------|
| B Way | bwahe8@gmail.com | 55 | 78 |
| Holden | holden.leming@gmail.com | 53 | 76 |
| Emilia.kacprzak | emily.kacprzak@gmail.com | 26 | 29 |
| Kyle | kyleaeddy@gmail.com | 18 | 21 |
| swarn2099 | swarn2099@gmail.com | 16 | 33 |
| Cliff Heights | cullymax@gmail.com | 13 | 24 |
| Maddie | maddiedaniell5@gmail.com | 1 | 4 |
| gigashaan | guliaeshaan@gmail.com | 0 | 0 |
| AGulia | guliaarunima@gmail.com | 0 | 1 |
| (no name) | ejl5346@sbcglobal.net | 0 | 1 |

### Deleted Users (3)
- test@test.com
- testbot@decibel.test
- apple-review@decibel.app

---

## Remaining Items: 192

All 192 items have `category = 'music'` (confirmed). These are exclusively artists that at least one real user founded or collected.

---

## Schema Changes

### Table Renames
| Old Name | New Name |
|----------|----------|
| fans | **users** |
| performers | **items** |
| fan_follows | **follows** |

### Column Renames

**founder_badges:**
| Old Column | New Column |
|------------|------------|
| fan_id | **user_id** |
| performer_id | **item_id** |

**collections:**
| Old Column | New Column |
|------------|------------|
| fan_id | **user_id** |
| performer_id | **item_id** |

### New Columns

**items.category** — `text NOT NULL DEFAULT 'music'`
- All 192 existing rows set to `'music'`
- Future categories: restaurants, coffee shops, etc.

**founder_badges.metric_snapshot** — `jsonb DEFAULT '{}'`
- For storing point-in-time metrics when a user vouches
- Music example: `{"monthly_listeners": 312, "snapshot_date": "2026-03-24"}`
- Restaurant example: `{"google_reviews": 14, "rating": 4.2, "snapshot_date": "2026-03-24"}`

### Collections Schema (post-rename)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | YES | NULL |
| item_id | uuid | YES | NULL |
| venue_id | uuid | YES | NULL |
| event_date | date | YES | NULL |
| capture_method | text | NO | 'qr' |
| verified | boolean | YES | true |
| created_at | timestamptz | YES | now() |
| collection_type | text | YES | 'stamp' |

### Founder Badges Schema (post-rename)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | NULL |
| item_id | uuid | NO | NULL |
| awarded_at | timestamptz | NO | now() |
| metric_snapshot | jsonb | YES | '{}' |

---

## Data Cleared (venue_id nulled)

All `collections.venue_id` values were set to NULL before deleting venues. This means existing collections no longer reference any venue. This is intentional — Vouch doesn't track venue-based check-ins in the same way.

---

## Tables Still Existing But Empty (candidates for DROP later)

These tables were cleared but not dropped (per safety rules):
- fan_tiers
- fan_badges
- events
- venues
- notification_preferences
- notifications_log
- push_tokens
- artist_outreach
- venue_submissions
- search_results
- scraped_profiles
- artist_claims
- artist_links
- artist_messages
- artist_shows
- artist_subscriptions
- messages
- spotify_tokens

Consider dropping these in a future migration once the Vouch schema is finalized.

---

## Active Schema Summary (Vouch Core)

```
users (10 rows)
  └── follows (9 rows) — user-to-user social graph
  └── collections (267 rows) — user vouches for items
  └── founder_badges (182 rows) — first-to-vouch recognition

items (192 rows, all category='music')
  └── collections (referenced by item_id)
  └── founder_badges (referenced by item_id, unique per item)
```
