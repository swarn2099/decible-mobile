# Decibel Database Schema — Full Dump

> Generated 2026-03-24 from Supabase project `savcbkbgoadjxkjnteqv`

---

## Table of Contents

1. [All Tables + Columns](#1-all-tables--columns)
2. [Row Counts](#2-row-counts)
3. [Foreign Keys](#3-foreign-keys)
4. [Indexes & Unique Constraints](#4-indexes--unique-constraints)
5. [RLS Policies](#5-rls-policies)
6. [Functions & Triggers](#6-functions--triggers)
7. [Sample Performer Data](#7-sample-performer-data)
8. [User Stats](#8-user-stats)
9. [Observations & Issues](#9-observations--issues)

---

## 1. All Tables + Columns

### artist_claims
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | YES | NULL |
| performer_id | uuid | NO | NULL |
| verified | boolean | YES | false |
| verification_method | text | YES | NULL |
| claimed_at | timestamptz | YES | now() |

### artist_links
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| artist_id | uuid | NO | NULL |
| platform | text | NO | NULL |
| url | text | NO | NULL |
| display_order | integer | YES | 0 |
| created_at | timestamptz | YES | now() |

### artist_messages
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| artist_id | uuid | NO | NULL |
| sender_user_id | uuid | YES | NULL |
| message | text | NO | NULL |
| message_type | text | YES | 'general' |
| sent_at | timestamptz | YES | now() |
| recipient_count | integer | YES | 0 |

### artist_outreach
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| artist_id | uuid | NO | NULL |
| channel | text | NO | NULL |
| outreach_type | text | NO | 'initial' |
| message_text | text | YES | NULL |
| collector_count_at_send | integer | NO | NULL |
| milestone_threshold | integer | YES | NULL |
| status | text | NO | 'pending' |
| sent_at | timestamptz | YES | NULL |
| claimed_at | timestamptz | YES | NULL |
| created_at | timestamptz | YES | now() |

### artist_shows
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| artist_id | uuid | NO | NULL |
| venue_name | text | NO | NULL |
| venue_city | text | YES | NULL |
| venue_lat | double precision | YES | NULL |
| venue_lng | double precision | YES | NULL |
| show_date | timestamptz | NO | NULL |
| ticket_url | text | YES | NULL |
| description | text | YES | NULL |
| notification_sent | boolean | YES | false |
| notification_radius_miles | integer | YES | 50 |
| created_at | timestamptz | YES | now() |

### artist_subscriptions
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| artist_id | uuid | NO | NULL |
| stripe_customer_id | text | YES | NULL |
| stripe_subscription_id | text | YES | NULL |
| plan | text | YES | 'trial' |
| trial_ends_at | timestamptz | YES | NULL |
| current_period_end | timestamptz | YES | NULL |
| status | text | YES | 'active' |
| created_at | timestamptz | YES | now() |

### collections
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| fan_id | uuid | YES | NULL |
| performer_id | uuid | YES | NULL |
| venue_id | uuid | YES | NULL |
| event_date | date | YES | NULL |
| capture_method | text | NO | 'qr' |
| verified | boolean | YES | true |
| created_at | timestamptz | YES | now() |
| collection_type | text | YES | 'stamp' |

### events
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| performer_id | uuid | YES | NULL |
| venue_id | uuid | YES | NULL |
| event_date | date | NO | NULL |
| start_time | timestamptz | YES | NULL |
| end_time | timestamptz | YES | NULL |
| is_live | boolean | YES | false |
| source | text | YES | 'manual' |
| external_url | text | YES | NULL |
| created_at | timestamptz | YES | now() |

### fan_badges
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| fan_id | uuid | YES | NULL |
| badge_id | text | NO | NULL |
| earned_at | timestamptz | YES | now() |

### fan_follows
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| follower_id | uuid | NO | NULL |
| following_id | uuid | NO | NULL |
| created_at | timestamptz | YES | now() |

### fan_tiers
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| fan_id | uuid | YES | NULL |
| performer_id | uuid | YES | NULL |
| scan_count | integer | YES | 1 |
| current_tier | text | YES | 'network' |
| last_scan_date | timestamptz | YES | now() |

### fans
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| email | text | YES | NULL |
| phone | text | YES | NULL |
| name | text | YES | NULL |
| city | text | YES | NULL |
| app_installed | boolean | YES | false |
| created_at | timestamptz | YES | now() |
| avatar_url | text | YES | NULL |
| spotify_refresh_token | text | YES | NULL |
| spotify_connected_at | timestamptz | YES | NULL |

### founder_badges
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| fan_id | uuid | NO | NULL |
| performer_id | uuid | NO | NULL |
| awarded_at | timestamptz | NO | now() |

### messages
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| performer_id | uuid | YES | NULL |
| subject | text | YES | NULL |
| body | text | NO | NULL |
| target_tier | text | YES | NULL |
| sent_at | timestamptz | YES | now() |
| recipient_count | integer | YES | 0 |
| open_count | integer | YES | 0 |
| click_count | integer | YES | 0 |

### notification_preferences
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | NULL |
| nearby_events | boolean | YES | true |
| badge_unlocks | boolean | YES | true |
| tier_ups | boolean | YES | true |
| artist_messages | boolean | YES | true |
| friend_joins | boolean | YES | true |
| weekly_recap | boolean | YES | true |
| updated_at | timestamptz | YES | now() |

### notifications_log
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | NULL |
| type | text | NO | NULL |
| title | text | NO | NULL |
| body | text | NO | NULL |
| data | jsonb | YES | '{}' |
| sent_at | timestamptz | YES | now() |
| read_at | timestamptz | YES | NULL |

### performers
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| name | text | NO | NULL |
| slug | text | NO | NULL |
| bio | text | YES | NULL |
| photo_url | text | YES | NULL |
| soundcloud_url | text | YES | NULL |
| mixcloud_url | text | YES | NULL |
| ra_url | text | YES | NULL |
| instagram_handle | text | YES | NULL |
| city | text | YES | 'Chicago' |
| genres | text[] | YES | '{}' |
| follower_count | integer | YES | 0 |
| claimed | boolean | YES | false |
| claimed_by | uuid | YES | NULL |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |
| is_chicago_resident | boolean | YES | false |
| spotify_url | text | YES | NULL |
| spotify_id | text | YES | NULL |
| monthly_listeners | integer | YES | NULL |
| spotify_embed_url | text | YES | NULL |
| soundcloud_embed_url | text | YES | NULL |
| apple_music_embed_url | text | YES | NULL |
| top_track_cached_at | timestamptz | YES | NULL |
| verified | boolean | YES | false |

### push_tokens
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | NULL |
| expo_push_token | text | NO | NULL |
| platform | text | YES | 'ios' |
| updated_at | timestamptz | YES | now() |

### scraped_profiles
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| performer_id | uuid | YES | NULL |
| source | text | NO | NULL |
| raw_data | jsonb | NO | NULL |
| scraped_at | timestamptz | YES | now() |

### search_results
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| search_id | uuid | NO | NULL |
| user_id | uuid | NO | NULL |
| confidence | text | NO | NULL |
| venue_name | text | YES | NULL |
| venue_id | uuid | YES | NULL |
| artists | jsonb | NO | '[]' |
| source | text | NO | NULL |
| created_at | timestamptz | YES | now() |

### spotify_tokens
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NO | 1 |
| refresh_token | text | NO | NULL |
| updated_at | timestamptz | YES | now() |

### venue_submissions
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| fan_id | uuid | NO | NULL |
| venue_name | text | NO | NULL |
| venue_id | uuid | YES | NULL |
| lat | double precision | YES | NULL |
| lng | double precision | YES | NULL |
| performer_name | text | YES | NULL |
| platform_url | text | YES | NULL |
| event_date | date | NO | NULL |
| created_at | timestamptz | YES | now() |

### venues
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| name | text | NO | NULL |
| slug | text | NO | NULL |
| address | text | YES | NULL |
| city | text | YES | 'Chicago' |
| latitude | double precision | NO | NULL |
| longitude | double precision | NO | NULL |
| geofence_radius_meters | integer | YES | 100 |
| capacity | integer | YES | NULL |
| created_at | timestamptz | YES | now() |

---

## 2. Row Counts

| Table | Rows |
|-------|------|
| artist_claims | 0 |
| artist_links | 0 |
| artist_messages | 0 |
| artist_outreach | 1 |
| artist_shows | 0 |
| artist_subscriptions | 0 |
| **collections** | **267** |
| **events** | **8,559** |
| fan_badges | 19 |
| fan_follows | 9 |
| fan_tiers | 153 |
| **fans** | **13** |
| **founder_badges** | **182** |
| messages | 0 |
| notification_preferences | 4 |
| notifications_log | 0 |
| **performers** | **4,094** |
| push_tokens | 0 |
| scraped_profiles | 0 |
| search_results | 0 |
| spotify_tokens | 1 |
| venue_submissions | 0 |
| **venues** | **384** |

---

## 3. Foreign Keys

| Table | Column | References | Foreign Column |
|-------|--------|------------|----------------|
| artist_outreach | artist_id | performers | id |
| venue_submissions | venue_id | venues | id |
| venue_submissions | fan_id | fans | id |
| search_results | venue_id | venues | id |
| fan_follows | following_id | fans | id |
| fan_follows | follower_id | fans | id |
| fan_badges | fan_id | fans | id |
| founder_badges | performer_id | performers | id |
| founder_badges | fan_id | fans | id |
| scraped_profiles | performer_id | performers | id |
| messages | performer_id | performers | id |
| fan_tiers | performer_id | performers | id |
| fan_tiers | fan_id | fans | id |
| collections | venue_id | venues | id |
| collections | performer_id | performers | id |
| collections | fan_id | fans | id |
| events | venue_id | venues | id |
| events | performer_id | performers | id |

### Missing FK Constraints (columns reference other tables but have no formal FK)

- `artist_claims.user_id` → should reference fans or auth.users
- `artist_claims.performer_id` → should reference performers (has unique constraint but no FK)
- `artist_links.artist_id` → should reference performers
- `artist_messages.artist_id` → should reference performers
- `artist_messages.sender_user_id` → should reference fans or auth.users
- `artist_shows.artist_id` → should reference performers
- `artist_subscriptions.artist_id` → should reference performers
- `performers.claimed_by` → should reference fans
- `push_tokens.user_id` → should reference fans or auth.users
- `notification_preferences.user_id` → should reference fans or auth.users
- `notifications_log.user_id` → should reference fans or auth.users

---

## 4. Indexes & Unique Constraints

### Unique Constraints (beyond PKs)

| Table | Constraint | Columns |
|-------|-----------|---------|
| artist_claims | artist_claims_performer_id_key | performer_id |
| artist_outreach | idx_artist_outreach_initial | artist_id WHERE outreach_type = 'initial' |
| artist_outreach | idx_artist_outreach_milestone | (artist_id, milestone_threshold) WHERE milestone_threshold IS NOT NULL |
| artist_subscriptions | artist_subscriptions_artist_id_key | artist_id |
| collections | collections_fan_id_performer_id_event_date_key | (fan_id, performer_id, event_date) |
| fan_badges | fan_badges_fan_id_badge_id_key | (fan_id, badge_id) |
| fan_follows | fan_follows_follower_id_following_id_key | (follower_id, following_id) |
| fan_tiers | fan_tiers_fan_id_performer_id_key | (fan_id, performer_id) |
| fans | fans_email_key | email |
| founder_badges | founder_badges_performer_unique | performer_id |
| notification_preferences | notification_preferences_user_id_key | user_id |
| performers | performers_slug_key | slug |
| performers | performers_spotify_id_key | spotify_id |
| push_tokens | push_tokens_user_token_unique | (user_id, expo_push_token) |
| venues | venues_slug_key | slug |

### Performance Indexes

| Table | Index | Columns |
|-------|-------|---------|
| artist_claims | artist_claims_user_id_idx | user_id |
| artist_claims | artist_claims_performer_id_idx | performer_id |
| artist_links | artist_links_artist_id_idx | artist_id |
| artist_messages | artist_messages_artist_id_idx | artist_id |
| artist_messages | artist_messages_sent_at_idx | sent_at DESC |
| artist_outreach | idx_artist_outreach_artist | artist_id |
| artist_outreach | idx_artist_outreach_status | status |
| artist_shows | artist_shows_artist_id_idx | artist_id |
| artist_shows | artist_shows_show_date_idx | show_date |
| artist_subscriptions | artist_subscriptions_artist_id_idx | artist_id |
| artist_subscriptions | artist_subscriptions_stripe_customer_idx | stripe_customer_id |
| collections | idx_collections_fan | fan_id |
| collections | idx_collections_performer | performer_id |
| events | idx_events_venue | venue_id |
| events | idx_events_performer | performer_id |
| fan_badges | idx_fan_badges_fan_id | fan_id |
| fan_follows | idx_fan_follows_follower | follower_id |
| fan_follows | idx_fan_follows_following | following_id |
| fan_tiers | idx_fan_tiers_performer | performer_id |
| founder_badges | idx_founder_badges_fan_id | fan_id |
| notifications_log | idx_notifications_log_user_sent | (user_id, sent_at) |
| performers | idx_performers_city | city |
| performers | idx_performers_slug | slug |
| search_results | search_results_search_id_idx | search_id |
| search_results | search_results_user_id_idx | user_id |
| venue_submissions | venue_submissions_venue_date_idx | (venue_id, event_date) |
| venues | idx_venues_city | city |

---

## 5. RLS Policies

| Table | Policy | Permission | Roles | Command | Condition |
|-------|--------|------------|-------|---------|-----------|
| venues | Public read venues | PERMISSIVE | public | SELECT | true |
| events | Public read events | PERMISSIVE | public | SELECT | true |
| fan_tiers | Public read fan_tiers | PERMISSIVE | public | SELECT | true |
| collections | Public read collections | PERMISSIVE | public | SELECT | true |
| performers | Public read performers | PERMISSIVE | public | SELECT | true |
| notifications_log | Users can read own notifications | PERMISSIVE | public | SELECT | auth.uid() = user_id |
| notification_preferences | Users can insert own preferences | PERMISSIVE | public | INSERT | auth.uid() = user_id |
| notification_preferences | Users can read own preferences | PERMISSIVE | public | SELECT | auth.uid() = user_id |
| notification_preferences | Users can update own preferences | PERMISSIVE | public | UPDATE | auth.uid() = user_id |
| venue_submissions | Fans can insert own submissions | PERMISSIVE | public | INSERT | fan_id matched via email lookup from auth.users |
| search_results | Users can read own search results | PERMISSIVE | public | SELECT | auth.uid() = user_id |

### Tables With NO RLS Policies

- fans
- founder_badges
- fan_badges
- fan_follows
- messages
- push_tokens
- artist_claims
- artist_links
- artist_messages
- artist_outreach
- artist_shows
- artist_subscriptions
- scraped_profiles
- spotify_tokens

These tables rely on service role access from the API layer.

---

## 6. Functions & Triggers

**None.** Zero public schema functions, zero triggers on public schema tables.

---

## 7. Sample Performer Data

All samples from the initial SoundCloud scrape (2026-03-06):

| Name | Slug | Photo | Bio | SoundCloud Followers | Genres | Spotify Data |
|------|------|-------|-----|---------------------|--------|-------------|
| Old Coke | old-coke | NULL | NULL | 2 | [electronic] | None |
| Play Dead | play-dead | Yes | Yes (band bio) | 23 | [house tech house] | None |
| Rob The Bank | rob-the-bank | NULL | NULL | 5 | [electronic] | None |
| STAR SEED | star-seed | Yes | NULL | 94 | [chillstep edm future bass melodic bass] | None |
| RTST | rtst | Yes | NULL | 1 | [electronic house deep house garage uk funky] | None |

All have `city = 'Chicago'` (default), `claimed = false`, `verified = false`. No Spotify URLs, IDs, or monthly listener data. User-added artists would have Spotify/Apple Music fields populated.

---

## 8. User Stats

| ID | Name | Email | Created | Founded | Collected | Discovered | Total Collections |
|----|------|-------|---------|---------|-----------|------------|-------------------|
| 103111be... | swarn2099 | swarn2099@gmail.com | Mar 6 | 16 | 0 | 0 | 33 |
| 56118bf8... | AGulia | guliaarunima@gmail.com | Mar 6 | 0 | 0 | 0 | 1 |
| 659bdd74... | Maddie | maddiedaniell5@gmail.com | Mar 7 | 1 | 0 | 0 | 4 |
| bd0794d8... | Emilia.kacprzak | emily.kacprzak@gmail.com | Mar 7 | 26 | 0 | 0 | 29 |
| d9371763... | Cliff Heights | cullymax@gmail.com | Mar 7 | 13 | 0 | 0 | 24 |
| e3a02d58... | B Way | bwahe8@gmail.com | Mar 7 | 55 | 0 | 0 | 78 |
| 6f90db21... | Kyle | kyleaeddy@gmail.com | Mar 7 | 18 | 0 | 0 | 21 |
| d436cb91... | (no name) | ejl5346@sbcglobal.net | Mar 8 | 0 | 0 | 0 | 1 |
| e3bcb2ba... | (no name) | test@test.com | Mar 10 | 0 | 0 | 0 | 0 |
| ff0ef912... | Test Bot | testbot@decibel.test | Mar 11 | 0 | 0 | 0 | 0 |
| 903d28d0... | App Reviewer | apple-review@decibel.app | Mar 12 | 0 | 0 | 0 | 0 |
| c64c0ed1... | gigashaan | guliaeshaan@gmail.com | Mar 14 | 0 | 0 | 0 | 0 |
| 975b9b08... | Holden | holden.leming@gmail.com | Mar 14 | 53 | 0 | 0 | 76 |

---

## 9. Observations & Issues

### Data Issues
1. **Zero "collected" or "discovered" collection types** — all 267 collections appear to be stamps or the default type. The `collection_type` column defaults to `'stamp'` so the app may not be setting it correctly for founded/discovered actions.
2. **`fans.name` used instead of `username`** — the mobile app references `username` but the DB column is `name`. No dedicated `username` column exists.
3. **All fans have `city = NULL`** except Test Bot — city is never being set during signup.
4. **`performers.city` defaults to `'Chicago'`** — every scraped artist gets Chicago regardless of actual location. This was flagged as a known pitfall.
5. **3 test/dead accounts** — test@test.com, testbot@decibel.test, apple-review@decibel.app (0 collections each).
6. **`capture_method` defaults to `'qr'`** — likely outdated from v1, should default to 'app' or 'link'.

### Schema Issues
1. **11 columns missing FK constraints** — see Section 3. Data integrity relies entirely on the API layer.
2. **No triggers or functions** — no automated denormalization, no cascade behaviors, no computed fields.
3. **Multiple empty tables** (artist_claims, artist_links, artist_messages, artist_shows, artist_subscriptions, messages, push_tokens, scraped_profiles, search_results, venue_submissions) — these were created for future features but never populated.
4. **RLS gaps** — fans, founder_badges, fan_badges, fan_follows have no RLS policies. Anyone with the anon key could read all user data.
5. **`collections` unique constraint on `(fan_id, performer_id, event_date)`** — this means a user can't collect the same artist twice on the same date even at different venues. May cause issues with multiple shows per day.

### Naming Inconsistencies
- `artist_*` tables use `artist_id` to reference performers, but it's the same `performers.id`
- `fans` table uses `id` but `collections`/`founder_badges`/`fan_tiers` reference it as `fan_id`
- Some tables use `user_id` (notification_preferences, push_tokens) while others use `fan_id` (collections, founder_badges) — both reference the same fans table
