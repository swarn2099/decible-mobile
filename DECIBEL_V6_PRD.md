# DECIBEL v6.0 PRD — "The Artist Growth Platform"

**Milestone:** v6.0  
**GSD Milestone Name:** `v6.0 — The Artist Growth Platform`  
**Author:** Swarn  
**Date:** March 15, 2026  
**Mobile Repo:** /home/swarn/decibel-mobile (React Native, Expo)  
**Web Repo:** /home/swarn/decibel (Next.js, API routes, artist dashboard, link-in-bio pages, website)  
**Stack:** React Native (Expo) + TypeScript (mobile), Next.js + TypeScript (web/artist dashboard/API), Supabase (auth, DB, realtime, storage), Vercel (web hosting), DigitalOcean VM (scraping, crons)  
**Revenue Target:** $5-10K MRR by September 2026  
**Total Estimated Build:** 4-5 weeks across 7 phases

### Repo Assignment Per Phase

| Phase | Repo | Why |
|-------|------|-----|
| Phase 1: Bug Fixes & Cleanup | `/home/swarn/decibel-mobile` | Mobile app fixes |
| Phase 2: Passport Redesign | `/home/swarn/decibel-mobile` | Mobile UI redesign |
| Phase 3: Home Screen & Feed | `/home/swarn/decibel-mobile` + `/home/swarn/decibel` (API routes) | Mobile UI + API endpoints |
| Phase 4: Leaderboard & Share Cards | `/home/swarn/decibel-mobile` + `/home/swarn/decibel` (API routes) | Mobile UI + API endpoints |
| Phase 5: Artist Profile & Link-in-Bio | `/home/swarn/decibel-mobile` (in-app artist page) + `/home/swarn/decibel` (web pages, SSR) | Both repos |
| Phase 6: Artist Dashboard & Monetization | `/home/swarn/decibel` (entire dashboard is web) + `/home/swarn/decibel-mobile` (push notification receiving) | Primarily web repo |
| Phase 7: Outreach & Growth Engine | `/home/swarn/decibel` (cron scripts, email sending) + DigitalOcean VM | Web repo + VM scripts |

---

## Strategic Context

Decibel is pivoting from a fan-only collection app to a two-sided artist growth platform. The fan app remains free and simple — find artists, collect them, build your passport, compete for Founders. But the business is the artist side: a paid dashboard that gives independent artists fan intelligence, direct reach via push notifications, and a link-in-bio page with built-in social proof.

**The fan app generates the data. The artist dashboard monetizes it.**

### Revenue Model

- **Artists:** $29/month for Decibel Pro for Artists (fan intelligence, push notifications, smart flyer, link-in-bio)
- **Fans:** Free core experience. Optional $2.99/month fan premium (premium share cards, profile customization) — nice-to-have, not the business
- **Target:** 175-345 paying artists at $29/month = $5-10K MRR

### Core Loop

Fans find artists → artists accumulate collectors → Decibel emails/DMs artists at 10+ collectors → artists claim profile and start free trial → artists send push notifications to collectors → fans re-engage → fans find more artists → cycle repeats

---

## Phase 1: Fan App Bug Fixes & Cleanup

**Estimated build:** 1-2 days  
**Priority:** Critical — nothing else works until these are fixed

### 1.1 Bug Fixes

**Apple Music URL parsing is broken.** The app must handle all Apple Music URL formats:
- Artist URLs: `https://music.apple.com/us/artist/name/id`
- Song URLs: `https://music.apple.com/us/album/song-name/albumid?i=trackid`
- Album URLs: `https://music.apple.com/us/album/name/id`
- Regional URL variations (different country codes)

Test with at least 10 different Apple Music URLs across artists, songs, and albums before marking complete.

**Stat mismatch bug.** Brendan shows 58 finds when searched but 17 on his profile. The query that powers search results and the query that powers the profile page are pulling from different sources or using different filters. Find the discrepancy and fix it. Both should show the same number. Verify with at least 3 user profiles.

**Venue detection radius is too wide.** The "I'm at a Show" flow detected Joy District when the user was at Hubbard Inn. For now, **remove the "I'm at a Show" flow entirely from the + tab.** Stamps are being deprecated in this version. The entire event check-in flow, venue detection, and stamp creation UI should be hidden (not deleted from codebase — just removed from the UI). The + tab becomes Find-only.

**Share modal is broken.** Fix the existing share functionality so users can share their passport and individual artist cards. This is critical for viral growth.

**Listen links are broken.** When tapping to listen to an artist, the link should open the correct platform (Spotify/Apple Music/SoundCloud) in the native app or browser. Fix for all three platforms.

### 1.2 UI Cleanup — Remove Stamps from UI

- Remove "I'm at a Show" button from the + tab
- Remove Stamps tab from the Passport (was the first tab — remove it)
- Passport tabs become: **Finds | Founders | Discoveries | Badges**
- The Finds tab shows ALL artists the user has found (including those where user is the Founder)
- The Founders tab shows ONLY artists where the user holds the Founder Badge
- Update the header stats to show: **Followers | Following | Finds | Founders**
- Followers and Following are tappable (open list)
- Remove any Stamps count from the UI
- Remove the non-functional map button from Home screen (will be replaced with Jukebox in Phase 3)
- Keep stamp data in the database — don't delete. Just hide from UI.

### 1.3 Song Link Support

**Current:** Users must paste an artist profile URL.  
**New:** Users can paste any song, album, or artist URL from Spotify, Apple Music, or SoundCloud. The app extracts the artist from the metadata.

When a song or album link is pasted:
1. Parse the URL to identify platform and content type
2. Fetch the artist info from the content (track → artist, album → artist)
3. Show the standard artist confirmation card
4. Add a small note: "Found via '[Track Name]'" on the confirmation card
5. Everything else (founder check, eligibility check, collect flow) works the same

This is critical because people share songs, not artist profiles. The friction reduction from this change alone could meaningfully increase find volume.

### 1.4 Acceptance Criteria

- [ ] Apple Music URLs work for artists, songs, and albums across regional variants
- [ ] Stat counts match between search results and profile pages
- [ ] "I'm at a Show" flow is removed from UI
- [ ] Stamps tab removed from passport
- [ ] Passport tabs are: Finds | Founders | Discoveries | Badges
- [ ] Header stats are: Followers | Following | Finds | Founders
- [ ] Founders tab shows only artists where user holds Founder Badge
- [ ] Map button removed from Home screen
- [ ] Share modal works correctly
- [ ] Listen links open correct platform
- [ ] Song/album links are accepted and artist is extracted correctly
- [ ] "Found via [Track Name]" displays on confirmation card for song links
- [ ] All stamp data preserved in database (just hidden from UI)

---

## Phase 2: Passport Redesign (v3.5 Spec)

**Estimated build:** 2-3 days  
**Priority:** High — the passport is the identity of the app

### 2.1 Apply Full v3.5 PRD

Implement the complete passport redesign as specified in DECIBEL_V3.5_PRD.md. Key requirements:

**Login Screen Redesign:**
- Respects device light/dark mode
- Animated gradient orbs background (lower opacity in light mode)
- Tracked-out "D E C I B E L" wordmark in upper third
- Dark-themed email input with pink border glow on focus
- Brand gradient (pink → purple) "Send Magic Link" button with press animation + haptic
- Loading spinner in button, success state with checkmark + "Check your email"
- Stagger fade-in animations on mount
- Social login buttons if auth supports them

**Passport Layout — Instagram Profile Pattern:**
- Compact header: avatar (no colored ring), stats inline (Followers, Following, Finds, Founders — all adjusted for the new tab structure from Phase 1), username, member since
- No settings gear icon — Edit Profile handles settings
- Share Passport + Edit Profile buttons side by side
- No badge teaser icon in header
- Sticky tab bar (Finds | Founders | Discoveries | Badges) that pins to top on scroll
- Swipe gesture between tabs
- Respects device light/dark mode

**Grid — 3-Column Instagram Style:**
- Square cells (1:1 aspect ratio), uniform 1px gap on all sides
- Artist image fills each cell (cover/crop)
- Bottom gradient overlay with ~8px left padding: artist name + metadata
- Finds cells: artist name + platform icon + date
- Founders cells: artist name + gold ★ badge + date
- Discoveries cells: artist name + "via @username" + date
- Badges tab: 3-column grid, earned = vibrant color, locked = dark silhouette
- Haptic feedback + press-down scale animation on cell tap
- No ghost/broken cells for empty positions
- Newest to oldest ordering

**NO gradient orbs on the passport screen.** Orbs are login screen only. Passport background is clean themed background.

### 2.2 Acceptance Criteria

- [ ] All acceptance criteria from DECIBEL_V3.5_PRD.md are met
- [ ] Login screen redesigned with orbs, branded input/button, animations
- [ ] Passport matches Instagram profile layout pattern
- [ ] 3-column grid with correct overlays per tab type
- [ ] Sticky tab bar works with 4 tabs (Finds, Founders, Discoveries, Badges)
- [ ] Light/dark mode works correctly on both login and passport
- [ ] No settings gear, no badge teaser, no colored avatar ring

---

## Phase 3: Home Screen & Feed

**Estimated build:** 2-3 days  
**Priority:** High — this is what makes people open the app

### 3.1 Home Screen Layout

**Top section — Your Stats Bar:**
A compact horizontal bar at the very top (below nav bar). Shows:
- Total Finds count
- Founder count
- Influence Score (total collects across all artists you founded)

These update in real-time as notifications come in. The stats bar is always visible at the top of Home, providing constant awareness of your position.

**Main section — Activity Feed:**
A vertical scrolling feed (FlatList) showing activity from people you follow. Each card is a single event:

**Find Card:** "@brendan found [Artist Name]" — shows finder avatar + username, artist image, artist name, monthly listener count, platform icon, time ago. If the artist has a founder, show "Founded by @username". Includes a "Collect" button (adds as Discovery to your passport) and a small play button to preview their top track.

**Founder Card:** "@holden founded [Artist Name]" — same as Find Card but with gold styling, gold ★ icon, and prominent "FOUNDED" label. This is the higher-signal event in the feed.

**Collect Card:** "@emilia discovered [Artist Name] from @brendan's find" — shows the social chain. Lighter styling than Find/Founder cards.

**Artist Message Card (Phase 6):** When artists send push notifications, they appear in the feed too. Styled differently — artist's image as background, message text overlaid. This is a Phase 6 addition but the feed layout should accommodate this card type from the start.

Feed is sorted by recency. If the user follows nobody or followed users have no recent activity, show a fallback: "Trending on Decibel" — most collected artists this week across the entire platform.

**Bottom section — Trending Artists Row:**
A horizontal scroll row at the bottom of the feed (or pinned above the tab bar). Shows top 5-10 most collected artists this week. Each shows: artist image (circular), name, collector count. Tapping opens the artist profile page. This row is always visible even when the feed is empty.

### 3.2 Jukebox Button

Replace the non-functional map button (top-left of Home screen) with a **Jukebox icon button** (music note or headphone glyph).

Tapping opens the Jukebox screen:
- Queries Finds from followed users in last 48 hours
- For each Find, resolves the artist's top track embed URL (Spotify/SoundCloud/Apple Music)
- Shows vertical scroll of cards: finder info + artist info + embedded player (WebView)
- Lazy-load WebViews (max 3 active at once)
- One-tap Collect button on each card (adds as Discovery)
- Falls back to platform-wide recent Finds if followed users have no recent activity

Embed URLs:
- Spotify: `https://open.spotify.com/embed/track/{trackId}?theme=0`
- SoundCloud: `https://w.soundcloud.com/player/?url={trackUrl}&color=%23FF4D6A&auto_play=false`
- Apple Music: `https://embed.music.apple.com/us/album/{albumId}?i={trackId}`

### 3.3 Supabase Schema Additions

```sql
-- Influence score can be computed on-the-fly or cached
-- Cached approach (recommended for performance):
ALTER TABLE users ADD COLUMN IF NOT EXISTS influence_score INTEGER DEFAULT 0;

-- Function to recalculate influence score
-- Run as a cron every hour or trigger on new collection
-- influence_score = COUNT of all collections by OTHER users on artists where this user is the founder

-- Activity feed query will be a join across:
-- collections (type, user_id, artist_id, created_at)
-- artists (name, image_url, platform, monthly_listeners)
-- users (username, avatar_url)
-- founder_badges (artist_id, user_id)
-- follows (follower_id, following_id)
-- WHERE collections.user_id IN (SELECT following_id FROM follows WHERE follower_id = current_user)
-- ORDER BY collections.created_at DESC
-- LIMIT 20 OFFSET pagination
```

### 3.4 Acceptance Criteria

- [ ] Home screen shows stats bar with Finds, Founders, Influence Score
- [ ] Activity feed loads and displays Find, Founder, and Collect cards
- [ ] Feed is filtered to followed users' activity
- [ ] Fallback "Trending on Decibel" shows when feed is empty
- [ ] Trending Artists horizontal row displays and is tappable
- [ ] Jukebox button replaces map button on Home screen
- [ ] Jukebox loads embedded players for recent finds
- [ ] Max 3 WebViews active at once in Jukebox
- [ ] One-tap Collect from both feed cards and Jukebox cards
- [ ] Collect creates a Discovery entry on the user's passport
- [ ] Notifications sent to finder when someone collects from their find

---

## Phase 4: Leaderboard & Share Cards

**Estimated build:** 2 days  
**Priority:** High — this is the competition engine and viral loop

### 4.1 Leaderboard

Accessible from Home screen via a trophy/crown icon in the top-right area.

**Three ranking views (horizontal tabs at top of leaderboard screen):**

**Most Founders:** Ranked by total Founder Badge count. Simple, primary competition metric.

**Highest Influence:** Ranked by Influence Score (total collects on your founded artists by other users). Quality metric — proves your finds resonate with others.

**Trending:** Ranked by number of artists founded in the current week. Rewards current activity. Resets weekly. New users can win this even if they can't touch the all-time boards.

**Each leaderboard row shows:**
- Rank number (1, 2, 3 with special styling for top 3)
- User avatar
- Username
- The relevant metric (Founder count, Influence Score, or weekly finds)
- Tapping a row navigates to that user's passport

**Time filters:** All Time | This Month | This Week — applies to Most Founders and Highest Influence tabs. Trending is always current week only.

**Your position:** If you're not in the visible top rankings, a sticky bar at the bottom shows your current rank and metric so you always know where you stand.

### 4.2 Share Cards

Auto-generated image cards designed for Instagram Stories (1080x1920 aspect ratio).

**Founder Share Card (generated on founding an artist):**
- Artist image as full-bleed background with dark gradient overlay
- "FOUNDED BY @username" in bold white text
- Artist name prominent
- "Found at [X]K listeners" — shows listener count at time of find
- Date of find
- Decibel logo (small, bottom corner)
- QR code or "decibel.live" URL for app download
- Premium, designed quality — think Spotify Wrapped / Strava share card tier

**Passport Summary Card (generated on demand from passport):**
- User's avatar
- Username
- Key stats: X Finds, X Founders, X Influence Score
- Top 3 founded artists (small images in a row)
- "decibel.live/@username" URL
- Decibel branding

**Implementation:** Render a React Native view off-screen with the card layout, capture it as an image using `react-native-view-shot` or `expo-media-library`. Save to camera roll and open the share sheet with Instagram Stories as a target.

### 4.3 Acceptance Criteria

- [ ] Leaderboard accessible from Home screen
- [ ] Three ranking views: Most Founders, Highest Influence, Trending
- [ ] Time filters work (All Time, This Month, This Week)
- [ ] Your position shown at bottom if not in visible rankings
- [ ] Tapping a leaderboard row navigates to that user's passport
- [ ] Top 3 have distinct visual styling (gold/silver/bronze or similar)
- [ ] Founder Share Card generates on founding with correct data
- [ ] Passport Summary Card generates on demand
- [ ] Share cards are Instagram Stories aspect ratio (1080x1920)
- [ ] Share sheet opens with card image, Instagram Stories as target
- [ ] Cards are high quality — not screenshots, properly designed

---

## Phase 5: Artist Profile Page & Link-in-Bio

**Estimated build:** 3-4 days  
**Priority:** High — this is the public face of Decibel and the artist's entry point

### 5.1 Artist Profile Page (In-App)

When tapping an artist anywhere in the app (from passport, feed, leaderboard, search):

**Top section:**
- Artist image (large, hero style)
- Artist name
- Platform icons (Spotify/Apple Music/SoundCloud) — tappable, opens their profile on that platform
- Current monthly listeners or follower count
- "Founded by @username on [date]" — founder always credited, always visible, tappable to visit founder's passport
- "Collected by X people on Decibel" — social proof

**Middle section:**
- Embedded player for their top track (same WebView embed as Jukebox)
- "Find" button if user hasn't collected them yet — tapping adds to passport as a Find (or Discovery depending on context)

**Bottom section:**
- "Collectors" — horizontal scroll or list of user avatars who have collected this artist, founder first with gold badge, then sorted by recency

### 5.2 Link-in-Bio Page (Web — decibel.live/[artistslug])

A public-facing web page for each artist. This replaces Linktree for musicians.

**Layout:**
- Artist image (hero)
- Artist name
- "X people have collected [Artist] on Decibel" — social proof
- Founded by @username — links to founder's web passport
- Platform links (Spotify, Apple Music, SoundCloud, Instagram, Twitter, YouTube, merch link) — each as a styled button
- Upcoming shows section (if artist has claimed profile and added shows — Phase 6)
- "Collect on Decibel" CTA button — deep links to the app or App Store if not installed
- Decibel branding in footer

**Technical:**
- Next.js dynamic route: `/[artistslug]` or `/artist/[slug]`
- Server-side rendered for SEO (each page is indexable by Google)
- OG meta tags for social sharing (artist image, name, collector count)
- Hosted on Vercel at decibel.live (or decible.live — use existing domain)
- Data sourced from Supabase (same DB as the app)

**SEO value:** With 2,164+ artists in the database, that's 2,164 indexable pages. When someone Googles an emerging artist name, the Decibel page could rank. This is passive, long-term acquisition.

### 5.3 User Passport Web Page (decibel.live/@username)

A public-facing web version of the user's passport. Shows their Finds, Founders, Discoveries, stats, and badges in a read-only format. Shareable URL. OG tags for social previews.

This is what the "Share Passport" button links to (in addition to the share card image).

### 5.4 Acceptance Criteria

- [ ] Artist profile page renders correctly in-app with all sections
- [ ] Founder attribution is visible and tappable
- [ ] Embedded player works for Spotify, SoundCloud, Apple Music
- [ ] Collector list displays with founder highlighted
- [ ] Link-in-bio web page renders at decibel.live/[artistslug]
- [ ] SSR works — pages are SEO-indexable
- [ ] OG meta tags generate correct social previews
- [ ] "Collect on Decibel" button deep-links to app or App Store
- [ ] Platform links on link-in-bio page work correctly
- [ ] User passport web page renders at decibel.live/@username
- [ ] At least 100 artist pages are generated and indexable

---

## Phase 6: Artist Dashboard & Monetization

**Estimated build:** 5-7 days  
**Priority:** Critical — this is the revenue engine

### 6.1 Artist Claiming Flow

**Web-based at artists.decibel.live (or decibel.live/artists/claim):**

1. Artist visits the page (driven by outreach DM/email — see Phase 7)
2. Signs up with email (magic link auth, same Supabase auth as fan app)
3. Searches for their artist name or pastes their Spotify/SoundCloud/Apple Music URL
4. System matches them to an existing artist in the database
5. Verification: Artist must verify they are the real artist. Options:
   - Post a specific code word to their Instagram Story (Decibel checks via scraping)
   - OR connect their Spotify for Artists / SoundCloud account (if API available)
   - OR simple email verification if their email matches the domain on their Linktree/website
   - MVP approach: Manual verification by Swarn for the first 50 artists. Add automated verification in month 2-3.
6. Once verified, artist gets a "Verified" badge on their Decibel profile and access to the dashboard

### 6.2 Artist Dashboard

**Web app at artists.decibel.live (built in /home/swarn/decibel). Next.js, same Supabase backend.**

**Overview tab:**
- Total collector count (big number, prominent)
- Collector growth chart (line chart, last 30/60/90 days)
- Influence ranking (where this artist ranks among all artists on Decibel by collector count)
- Recent collector activity ("@username collected you 2 hours ago")

**Fan Intelligence tab:**
- Full collector list with: username, avatar, date they collected, whether they're the founder, what other artists they also collect
- City breakdown — pie chart or bar chart of which cities your collectors are in (derived from user profile location or IP-based approximation)
- "Fans also collect" — the top 10 other artists that your collectors also have in their passports. This is collaborative filtering data that tells artists who their audience overlaps with (collab opportunities, opening act matches)
- Top fans — sorted by how many of their Decibel friends also collected you (network influence)

**Send Message tab (Push Notifications):**
- Compose a short message (max 280 characters)
- Preview how it will appear as a push notification and in the fan's Home feed
- "Send to all collectors" button
- Rate limit: 1 message per week per artist (prevents spam, maintains signal quality)
- Message history showing past messages and delivery stats (sent count, open count if trackable)

**Technical implementation:**
- Push notifications sent via Expo Push Notification service
- When artist sends a message:
  1. Create entry in `artist_messages` table
  2. Supabase Edge Function triggers
  3. Query all users who have collected this artist
  4. For each user, send push notification via Expo Push API
  5. Message also appears in the fan's Home feed as an Artist Message Card

**Smart Flyer tab:**
- Artist creates a show listing: venue name, date, time, ticket link (optional), description
- On save, Decibel sends a push notification to all collectors within a radius (default 50 miles, configurable)
- The notification says: "[Artist Name] is playing [Venue] on [Date] — tap for details"
- Tapping opens the show detail in the fan app with the ticket link
- This directly solves the "I didn't even know you were in Chicago" problem

**Link-in-Bio Settings tab:**
- Edit the link-in-bio page content: add/remove platform links, add upcoming shows, customize bio text
- Preview the page
- Copy the URL (decibel.live/[artistslug]) — this goes in their Instagram bio

**Account & Billing tab:**
- Current plan (Free Trial / Pro)
- Payment method (Stripe integration)
- Billing history
- Cancel/downgrade

### 6.3 Pricing & Billing

**Free Trial:** 14 days. Full access to all features. No credit card required to start (reduces friction for claiming).

**Decibel Pro for Artists — $29/month:**
- Full fan intelligence dashboard
- 1 push notification per week to all collectors
- Smart Flyer (unlimited show listings with auto-push to local collectors)
- Link-in-bio page with full customization
- Verified artist badge
- Priority support

**Free tier (after trial expires):**
- See total collector count (number only)
- Link-in-bio page (basic, limited customization)
- Verified badge remains
- Fan intelligence, push notifications, and Smart Flyer are locked

**Payment processing:** Stripe Checkout. Monthly subscription. Stripe handles everything — billing, receipts, cancellations, card updates. Webhook to Supabase to update the artist's subscription status.

### 6.4 Supabase Schema Additions

```sql
-- Artist claims (links a user account to an artist profile)
CREATE TABLE IF NOT EXISTS artist_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  artist_id UUID REFERENCES artists(id),
  verified BOOLEAN DEFAULT FALSE,
  verification_method TEXT, -- 'manual', 'instagram', 'email'
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id) -- only one claim per artist
);

-- Artist messages (push notifications from artists)
CREATE TABLE IF NOT EXISTS artist_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id),
  sender_user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL CHECK (char_length(message) <= 280),
  message_type TEXT DEFAULT 'general', -- 'general', 'show_announcement'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  recipient_count INTEGER DEFAULT 0,
  -- Rate limit: check that no message exists for this artist in last 7 days
  CONSTRAINT one_per_week CHECK (true) -- enforce in application logic
);

-- Show listings (Smart Flyer)
CREATE TABLE IF NOT EXISTS artist_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id),
  venue_name TEXT NOT NULL,
  venue_city TEXT,
  venue_lat DOUBLE PRECISION,
  venue_lng DOUBLE PRECISION,
  show_date TIMESTAMPTZ NOT NULL,
  ticket_url TEXT,
  description TEXT,
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_radius_miles INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artist subscriptions (synced from Stripe webhooks)
CREATE TABLE IF NOT EXISTS artist_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'trial', -- 'trial', 'pro', 'free'
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- 'active', 'canceled', 'past_due'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artist link-in-bio content
CREATE TABLE IF NOT EXISTS artist_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id),
  platform TEXT NOT NULL, -- 'spotify', 'apple_music', 'soundcloud', 'instagram', 'twitter', 'youtube', 'merch', 'website'
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.5 Acceptance Criteria

- [ ] Artist claiming flow works end-to-end (signup → search → verify → dashboard)
- [ ] Manual verification works for MVP (Swarn approves via Supabase admin)
- [ ] Dashboard Overview tab shows collector count, growth chart, recent activity
- [ ] Fan Intelligence tab shows full collector list with details
- [ ] City breakdown displays correctly
- [ ] "Fans also collect" shows relevant artist overlap data
- [ ] Push notification compose and send works
- [ ] 1 message per week rate limit enforced
- [ ] Notifications arrive on fan devices via Expo Push
- [ ] Artist messages appear in fan Home feed as Artist Message Cards
- [ ] Smart Flyer: artist can create show listings
- [ ] Smart Flyer: push sent to collectors within radius on show creation
- [ ] Link-in-bio settings: artist can add/remove/reorder platform links
- [ ] Link-in-bio page updates reflect on the public web page (Phase 5)
- [ ] Stripe Checkout integration works for $29/month subscription
- [ ] Free trial: 14 days full access, no credit card required
- [ ] Stripe webhooks update subscription status in Supabase
- [ ] Locked features are properly gated after trial expires
- [ ] Verified badge appears on artist's in-app and web profiles after claiming

---

## Phase 7: Artist Outreach & Growth Engine

**Estimated build:** 2-3 days  
**Priority:** Critical — this is how artists discover Decibel and convert to paying

### 7.1 Automated Outreach Triggers

**Cron job on DigitalOcean VM (runs daily):**

1. Query all artists in the database with 10+ collectors who have NOT been contacted yet
2. For each qualifying artist:
   - Generate a personalized outreach message
   - Store in an `artist_outreach` table with status 'pending'
   - If the artist's Instagram handle is known (from scraping): queue an Instagram DM
   - If their email is known: queue an email
   - If neither: flag for manual outreach by Swarn

**The outreach message template:**

Subject (email): "[X] people on Decibel have collected you"

Body: "Hey [Artist Name] — [X] people on Decibel have collected you as one of their favorite emerging artists. [Founder username] was the first person to add you to the platform. See who your fans are and reach them directly — claim your free profile at decibel.live/claim/[artistslug]. Your first 14 days are free."

**Milestone outreach (ongoing notifications to already-contacted artists):**
- At 25 collectors: "You just hit 25 collectors on Decibel"
- At 50 collectors: "50 fans have collected you"
- At 100 collectors: "You're in the top X% of artists on Decibel"

Each milestone email includes a shareable graphic the artist can post to Instagram (free marketing for Decibel).

### 7.2 Artist Milestone Share Cards

Auto-generated images for artists to share:
- "[Artist Name] — Collected by 50 people on Decibel"
- Artist's image as background
- Collector count prominent
- "See who your fans are → decibel.live/[slug]"
- Decibel branding

When an artist shares this to their Instagram, their followers see Decibel, some download, some collect, and the cycle continues.

### 7.3 Outreach Tracking

```sql
CREATE TABLE IF NOT EXISTS artist_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id),
  channel TEXT, -- 'instagram_dm', 'email', 'manual'
  message_template TEXT,
  collector_count_at_send INTEGER,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'claimed', 'ignored'
  sent_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.4 Acceptance Criteria

- [ ] Cron job runs daily and identifies artists with 10+ collectors not yet contacted
- [ ] Outreach messages are generated with correct personalization
- [ ] Email sending works (Nodemailer or similar, via VM)
- [ ] Instagram DM queue is created for manual sending (fully automated IG DMs are fragile — queue them for Swarn to send manually from @decibellive for now)
- [ ] Milestone notifications trigger at 25, 50, 100 collector thresholds
- [ ] Artist milestone share cards generate as images
- [ ] Outreach status is tracked in artist_outreach table
- [ ] No duplicate outreach — artist is only contacted once per threshold

---

## Infrastructure Notes

### What Runs Where

| Component | Where | Why |
|-----------|-------|-----|
| Fan mobile app | Expo/EAS | React Native, iOS + Android |
| Artist dashboard web app | Vercel | Next.js, SSR, same domain as link-in-bio |
| Link-in-bio pages | Vercel | Next.js dynamic routes, SSR for SEO |
| User passport web pages | Vercel | Next.js dynamic routes |
| Database | Supabase | Auth, Postgres, Realtime, Storage |
| Push notifications | Expo Push API | Triggered by Supabase Edge Functions |
| Payment processing | Stripe | Checkout, webhooks to Supabase |
| Artist scraping (listener counts) | DigitalOcean VM | Daily cron, scrapes Spotify/SoundCloud |
| Artist outreach cron | DigitalOcean VM | Daily cron, generates outreach messages |
| Email sending | DigitalOcean VM | Nodemailer via the outreach cron |
| Embed URL caching | DigitalOcean VM or Vercel cron | Resolve top tracks for Jukebox |

### Expo Push Notifications Setup

If not already configured:
1. `expo install expo-notifications`
2. Configure push notification permissions in app
3. Store Expo push tokens in Supabase `user_push_tokens` table
4. Supabase Edge Function calls Expo Push API to send notifications
5. Handle notification taps — deep link to relevant content (artist profile, feed, etc.)

```sql
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  expo_push_token TEXT NOT NULL,
  platform TEXT, -- 'ios', 'android'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, expo_push_token)
);
```

---

## Phase Execution Order

Execute phases sequentially. Each phase builds on the previous.

1. **Phase 1: Bug Fixes & Cleanup** (1-2 days) — Fix broken things, remove stamps from UI, add song link support
2. **Phase 2: Passport Redesign** (2-3 days) — Apply v3.5 spec, login redesign, Instagram-style grid
3. **Phase 3: Home Screen & Feed** (2-3 days) — Activity feed, Jukebox, trending artists
4. **Phase 4: Leaderboard & Share Cards** (2 days) — Competition engine, viral sharing
5. **Phase 5: Artist Profile & Link-in-Bio** (3-4 days) — In-app artist pages, public web pages, SEO
6. **Phase 6: Artist Dashboard & Monetization** (5-7 days) — Claiming, dashboard, push notifications, Stripe billing
7. **Phase 7: Outreach & Growth Engine** (2-3 days) — Automated artist outreach, milestone cards

**Total: ~18-25 days of build time**

Phases 1-4 are the fan app. Phases 5-7 are the artist/revenue side. The fan app should be shippable after Phase 4 — get it into users' hands while building Phases 5-7 in parallel.

---

## GSD Kickoff Prompt

```
Read CLAUDE.md and DECIBEL_V6_PRD.md.

Initialize a new GSD milestone: "v6.0 — The Artist Growth Platform"

IMPORTANT — Two repos:
- /home/swarn/decibel-mobile — React Native (Expo) fan app
- /home/swarn/decibel — Next.js web app (API routes, artist dashboard, link-in-bio pages, website)

Phases 1-4 are primarily in decibel-mobile (with some API work in decibel).
Phases 5-7 are primarily in decibel (with some mobile work in decibel-mobile for push notifications and in-app artist pages).
Always work in the correct repo for the task. Do not mix web code into the mobile repo or vice versa.

7 phases:
1. Bug Fixes & Cleanup (decibel-mobile) — fix Apple Music URL parsing, stat mismatch, remove stamps from UI, add song/album link support, fix share modal and listen links
2. Passport Redesign (decibel-mobile) — apply v3.5 spec (login redesign, Instagram-style layout, 3-column grid, sticky tabs with Finds/Founders/Discoveries/Badges, light/dark mode)
3. Home Screen & Feed (decibel-mobile + decibel API routes) — activity feed from followed users, stats bar, trending artists row, Jukebox button + screen with embedded players
4. Leaderboard & Share Cards (decibel-mobile + decibel API routes) — three ranking views (Most Founders, Highest Influence, Trending), time filters, auto-generated founder and passport share cards
5. Artist Profile & Link-in-Bio (decibel-mobile for in-app pages + decibel for web pages) — in-app artist pages with founder attribution, public SSR web pages at decibel.live/[slug] and decibel.live/@username
6. Artist Dashboard & Monetization (decibel for web dashboard + decibel-mobile for push notification receiving) — artist claiming flow, web dashboard with fan intelligence + push notifications + smart flyer + link-in-bio settings, Stripe billing at $29/month, 14-day free trial
7. Outreach & Growth Engine (decibel + VM scripts) — daily cron for artist outreach at 10+ collectors, milestone notifications, artist share card generation

This is a two-sided platform. The fan app (Phases 1-4) generates data. The artist dashboard (Phases 5-7) monetizes it. Ship the fan app updates after Phase 4 while building the artist side.

The passport tabs are: Finds | Founders | Discoveries | Badges (stamps removed from UI).
Header stats are: Followers | Following | Finds | Founders.
No stamps, no event check-in, no venue detection in this version.

Start with Phase 1. Run /compact after each phase completes.
```
