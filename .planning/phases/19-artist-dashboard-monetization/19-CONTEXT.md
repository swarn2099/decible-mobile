# Phase 19: Artist Dashboard & Monetization - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning
**Source:** PRD Express Path (DECIBEL_V6_PRD.md Phase 6)

<domain>
## Phase Boundary

This is the revenue engine. Artists claim their profile, get a web dashboard with fan intelligence, can push notify collectors, create show listings, and pay $29/month via Stripe.

Two repos:
- /home/swarn/decibel — ALL dashboard work (web app, API routes, Stripe webhooks, Supabase Edge Functions)
- /home/swarn/decibel-mobile — Push notification receiving, Artist Message Card in feed, verified badge display

This phase has the most requirements (12). Split into logical chunks:
1. Schema + claiming flow (foundation)
2. Dashboard UI (overview, fan intelligence)
3. Push notifications + artist messages in feed
4. Smart Flyer (show listings)
5. Stripe billing + feature gating
6. Link-in-bio settings
7. Verified badge

</domain>

<decisions>
## Implementation Decisions

### Artist Claiming Flow (DASH-01)
- Web-based at artists.decibel.live or decibel.live/artists/claim
- Artist signs up with email (magic link auth, same Supabase auth)
- Searches for their artist name or pastes Spotify/SoundCloud/Apple Music URL
- System matches to existing artist in DB
- Verification: MVP = manual verification by Swarn for first 50 artists
  - Post specific code to Instagram Story (Decibel checks via scraping) — future
  - Connect Spotify for Artists / SoundCloud — future
  - Email verification if email matches domain — future
- Once verified: "Verified" badge on profile + dashboard access

### Dashboard Overview (DASH-02)
- Total collector count (big number, prominent)
- Collector growth chart (line chart, 30/60/90 days)
- Influence ranking (where artist ranks among all artists by collector count)
- Recent collector activity ("@username collected you 2 hours ago")

### Fan Intelligence (DASH-03)
- Full collector list: username, avatar, date collected, whether founder, other artists they collect
- City breakdown (pie/bar chart) — derived from user profile location or IP approximation
- "Fans also collect" — top 10 other artists that collectors also have (collaborative filtering)
- Top fans — sorted by network influence (how many of their friends also collected you)

### Push Notifications (DASH-04, DASH-05)
- Compose message (max 280 chars)
- Preview as push notification + feed card
- "Send to all collectors" button
- Rate limit: 1 message per week per artist
- Message history with delivery stats
- Technical: Expo Push API
  - Create `artist_messages` table entry
  - Query all users who collected this artist
  - For each, send via Expo Push API using their push token
  - Message appears in fan Home feed as Artist Message Card

### Push Token Setup (mobile side)
- `expo install expo-notifications`
- Configure push notification permissions
- Store Expo push tokens in `user_push_tokens` table
- Handle notification taps — deep link to relevant content

### Smart Flyer (DASH-07)
- Artist creates show listing: venue name, date, time, ticket link, description
- On save: push notification to collectors within radius (default 50 miles, configurable)
- Notification: "[Artist Name] is playing [Venue] on [Date] — tap for details"
- Tapping opens show detail in fan app with ticket link

### Link-in-Bio Settings (DASH-08)
- Edit link-in-bio content: add/remove platform links, add shows, customize bio
- Preview the page
- Copy URL (decibel.live/[artistslug])

### Stripe Billing (DASH-09, DASH-10, DASH-11)
- $29/month Decibel Pro for Artists
- 14-day free trial, NO credit card required to start
- Stripe Checkout for payment
- Stripe webhooks to Supabase to update subscription status
- Free tier after trial: see collector count only, basic link-in-bio, verified badge stays
- Locked after trial: fan intelligence, push notifications, smart flyer

### Verified Badge (DASH-12)
- Appears on artist's in-app profile and web profile after claiming
- Shows in fan app wherever artist name appears

### Supabase Schema (new tables)
```sql
-- artist_claims
CREATE TABLE artist_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  artist_id UUID REFERENCES artists(id),
  verified BOOLEAN DEFAULT FALSE,
  verification_method TEXT,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id)
);

-- artist_messages
CREATE TABLE artist_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID,
  sender_user_id UUID,
  message TEXT NOT NULL CHECK (char_length(message) <= 280),
  message_type TEXT DEFAULT 'general',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  recipient_count INTEGER DEFAULT 0
);

-- artist_shows
CREATE TABLE artist_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID,
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

-- artist_subscriptions
CREATE TABLE artist_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- artist_links
CREATE TABLE artist_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_push_tokens
CREATE TABLE user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  expo_push_token TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, expo_push_token)
);
```

### Claude's Discretion
- Dashboard UI framework (plain Next.js pages with Tailwind, or a component library like shadcn/ui)
- Chart library for growth chart (recharts, chart.js, etc.)
- Exact dashboard layout and navigation
- How to handle manual verification UX (admin approval queue vs. direct Supabase edit)
- Expo Push API integration details
- Stripe webhook handling architecture
- Haversine radius calculation for Smart Flyer notifications

</decisions>

<specifics>
## Specific Ideas

- The decibel web project already has Supabase auth configured
- Stripe env vars will need to be added to Vercel
- For manual verification MVP, Swarn can update `artist_claims.verified = true` directly in Supabase
- The mobile activity feed already shows Find/Founder/Collect cards — add Artist Message Card type
- Push tokens should be registered on app launch after auth
- Stripe Checkout Session is the cleanest integration — redirect to Stripe-hosted page, handle webhook on return

</specifics>

<deferred>
## Deferred Ideas

- Automated artist verification (Instagram scraping, Spotify for Artists OAuth) — month 2-3
- Fan premium subscription ($2.99/month) — not the business
- Email sending for artist notifications — Phase 20 (outreach)

</deferred>

---

*Phase: 19-artist-dashboard-monetization*
*Context gathered: 2026-03-16 via PRD Express Path*
