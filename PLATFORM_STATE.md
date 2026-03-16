# Decibel — Platform State (March 16, 2026)

## What It Is

A two-sided music platform. Fans discover and collect underground artists, building a passport. Artists get a paid dashboard with fan intelligence, push notifications, and a link-in-bio page. The fan app generates the data; the artist dashboard monetizes it.

---

## Fan App (React Native / Expo)

### Home Screen
- **Stats bar** at top: Artists (total collection) | Founders (artists you added first) | Influence (how many people collected your founded artists)
- **Trending Artists row** below stats: horizontal scroll of top collected artists this week, sorted descending, shows fan count, tappable to artist profile
- **Activity feed** from followed users: Find cards, Founder cards, Collect cards, Artist Message cards
- Feed falls back to "Trending on Decibel" when you follow nobody or followed users have no activity
- **One-tap Collect** button on feed cards — adds artist as Discovery to your passport with optimistic UI
- **Jukebox button** (top left) — opens screen with embedded players for recent finds from followed users, max 3 WebViews active
- **Leaderboard button** (trophy icon, top left) — opens competitive rankings
- **Search button** (top right) — searches Decibel artists and users
- Pull-to-refresh on the entire feed

### Add Flow (+ Tab)
- **Link paste only** — paste a Spotify, Apple Music, or SoundCloud URL
- Supports **artist, song, and album URLs** — extracts the artist from track/album metadata
- Apple Music regional variants fully supported (US, GB, JP, FR, DE, AU, etc.)
- Shows "Found via [Track Name]" on confirmation card when a song URL is pasted
- Eligibility threshold: under 1M Spotify monthly listeners / 100K SoundCloud followers
- Founder badge (gold ★) awarded to the first person to add an artist
- Post-found celebration with confetti animation, badge reveal, haptic feedback, share prompt

### Passport (Instagram-style)
- **Collapsible header** — scrolls away as you browse, tab bar sticks to top (react-native-collapsible-tab-view)
- Header shows: avatar, username, member since, Followers | Following | Finds | Discoveries
- "Share Passport" (gradient button) + "Edit Profile" (surface button) side by side
- **3 tabs:** Finds | Discoveries | Badges
  - **Finds** = artists you added to the platform via the Add flow (includes founders)
  - **Discoveries** = artists you collected via the Discover button (someone else added them)
  - **Badges** = earned (vibrant color + glow) vs locked (ghost, 0.3 opacity)
- 3-column grid, 3px gaps, 6px rounded corners, frost overlay with artist name + context
- Swipe gestures between tabs

### Leaderboard
- **3 ranking views:** Most Founders | Highest Influence | Trending (current week)
- Time filters: All Time | This Month | This Week (Trending is always current week)
- Top 3 have gold/silver/bronze podium styling
- Sticky bar at bottom shows your rank if you're not in visible top
- Tapping any row navigates to that user's passport

### Share Cards (1080x1920, Instagram Stories format)
- **Founder Share Card** — generated on founding: full-bleed artist photo, dark gradient, "FOUNDED BY @username", artist name, listener count at time of find, date, Decibel branding
- **Passport Summary Card** — generated on demand: avatar, username, Finds/Founders/Influence stats, top 3 founded artist photos, decibel.live/@username URL
- Share sheet targets Instagram Stories

### Artist Profile (in-app)
- Hero image with gradient overlay
- Artist name, monthly listener count
- Fan count ("X fans on Decibel")
- **Founder card** — gold-tinted card showing who founded the artist and when, tappable to founder's profile
- Discover/Founded/Collected action button with proper state hierarchy
- Listen links for all platforms (Spotify, Apple Music, SoundCloud, Mixcloud) — opens native apps
- Horizontal collector avatar row (max 8, founder gets gold ring, "See all" link)

### User Profiles
- Same Instagram-style layout as your own passport
- Loads ALL collections (paginated fetch)
- Shows correct follower/following counts for that user
- Following/followers pages show find counts per user
- Follow/unfollow with optimistic UI

### Search
- Searches existing Decibel artists by name (with fan count)
- Searches Decibel users by name (with find count)

### Other
- Dark/light mode based on device system preferences
- Poppins font throughout (Regular, Medium, SemiBold, Bold)
- Floating pill tab bar with blur background
- Login with magic link (email), animated gradient orbs background

---

## Artist Dashboard (Next.js Web App)

### Claim Flow (`decibel.live/dashboard/claim`)
- Artist signs up with email (magic link, same Supabase auth)
- 3-step flow: search by name or paste streaming URL → confirm artist card → success
- Already-claimed artists shown as grayed out
- Auto-creates 14-day free trial subscription on claim
- Manual verification by Swarn for MVP (set `verified = true` in Supabase)
- Verified badge appears on artist's in-app and web profiles

### Dashboard (`decibel.live/dashboard`)
Routes based on claim state: unclaimed → redirect to /claim, pending → verification banner, verified → full dashboard

**5 tabs:**

**Overview (always free):**
- Total collector count (big gradient number)
- Growth chart (SVG polyline, last 90 days cumulative)
- Recent collector activity feed with avatars
- Subscription badge (Trial / Pro / Expired)

**Fan Intelligence (Pro only):**
- Full collector list (200 max): username, avatar, date, founder badge, other artists they collect (up to 3)
- City breakdown bar chart (top 10 cities)
- "Fans also collect" — top 10 artist overlap (collaborative filtering)

**Messages (Pro only):**
- Compose message (280 char max)
- "Send to All Collectors" button
- 1 message per week rate limit (shows countdown to next available)
- Message history with delivery stats (recipient count per message)
- Push notifications sent via Expo Push API
- Messages appear in fan Home feed as Artist Message Cards

**Shows / Smart Flyer (Pro only):**
- Create show listing: venue name, city, date, ticket URL, description
- Future-date validation
- "Notify Fans" button — pushes to collectors (city-filtered when possible)
- Upcoming/Past badges on show cards
- "Fans Notified" green badge after sending

**Settings (always free):**
- Public URL with copy button + preview link
- Custom link management: add, reorder (up/down), delete platform links
- Auto-detected streaming links shown in read-only
- Link-in-bio page updates reflect on the public web page

### Billing
- **$29/month** Decibel Pro for Artists
- **14-day free trial**, no credit card required
- Stripe Checkout integration (redirect to Stripe-hosted page)
- Stripe webhooks update subscription status in Supabase
- Trial countdown banner on every tab
- Locked feature overlay (blur) on Fan Intelligence, Messages, Shows after trial expires
- Overview + Settings remain free forever
- **Requires manual Stripe setup** (product, webhook, env vars in Vercel)

---

## Public Web Pages (Next.js SSR)

### Artist Link-in-Bio (`decibel.live/artist/[slug]`)
- Server-side rendered for SEO
- Artist image, name, collector count, founder attribution
- Spotify + Apple Music + SoundCloud listen links (auto-detected from DB)
- "Collect on Decibel" CTA button (links to App Store)
- Custom links from artist dashboard (when claimed)
- OG meta tags for social sharing (iMessage, Twitter)
- 2,164+ indexable artist pages

### User Passport (`decibel.live/@username`)
- Public read-only passport page
- SSR with ISR (1-hour revalidation)
- Shows finds, founders, discoveries, stats
- OG meta tags with avatar and collection count
- Route guard rejects non-@ paths

---

## Growth Engine (DigitalOcean VM)

### Outreach Cron (`decibel-outreach`, daily 10 AM UTC)
- Identifies artists with 10+ collectors not yet contacted
- Queues Instagram DM outreach (pre-written personalized messages for Swarn to send manually)
- Email sending infrastructure built (Nodemailer), needs SMTP credentials
- Tracks all outreach in `artist_outreach` table with dedup constraints

### Milestone Cron (`decibel-milestones`, daily 11 AM UTC)
- Checks collector thresholds: 25 (Rising Artist), 50 (Fan Favorite), 100 (Breakout Artist)
- Generates milestone share card URLs for each threshold
- No duplicate notifications (UNIQUE constraint on artist + threshold)

### Milestone Share Cards (`decibel.live/api/share-card/milestone`)
- Server-rendered 1080x1920 PNG
- Artist name, photo, collector count, tier label, Decibel branding
- Shareable by artists to Instagram

---

## Infrastructure

| Component | Where | Status |
|-----------|-------|--------|
| Fan mobile app | Expo/EAS (iOS preview) | Live |
| API routes | Vercel (decible.live) | Live |
| Artist dashboard | Vercel (decible.live/dashboard) | Live |
| Link-in-bio pages | Vercel (SSR) | Live |
| Database | Supabase | Live |
| Push notifications | Expo Push API | Built |
| Outreach crons | DigitalOcean VM (PM2) | Running |
| Stripe billing | Built, needs env vars | Pending setup |

---

## Database Tables

**Existing:** fans, performers, collections, founder_badges, venues, events, fan_follows, fan_tiers, fan_artist_collections

**Added in v6.0:** artist_claims, artist_messages, artist_shows, artist_subscriptions, artist_links, artist_outreach, user_push_tokens

**New columns:** performers.verified, performers.spotify_id, performers.apple_music_url

---

## What Needs Manual Setup

1. **Stripe** — Create product ($29/month), webhook endpoint, add 4 env vars to Vercel
2. **First 50 artists** — Set `artist_claims.verified = true` in Supabase after they claim
3. **SMTP** — Add email credentials to `/home/swarn/decibel-outreach/.env` for outreach emails
4. **Instagram outreach** — Swarn sends queued DMs manually from @decibellive

---

## Stats

- **7 phases** completed in v6.0 (Phases 14-20)
- **51 requirements** defined, all executed
- **21 plans** across both repos
- **2,164+ artists** in the database
- **Target:** 175-345 paying artists at $29/month = $5-10K MRR
