# Phase 18: Artist Profile & Link-in-Bio - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning
**Source:** PRD Express Path (DECIBEL_V6_PRD.md Phase 5)

<domain>
## Phase Boundary

This phase creates the public-facing web presence for Decibel — artist link-in-bio pages and user passport pages. Plus enhanced in-app artist profiles.

Two repos:
- /home/swarn/decibel-mobile — Enhanced in-app artist profile page, collector list screen
- /home/swarn/decibel — SSR web pages (artist link-in-bio at /[artistslug], user passport at /@username)

IMPORTANT: The mobile app already has an artist profile at app/artist/[slug].tsx. Check what exists and enhance, don't rebuild.

The web pages are the big new work here — Next.js dynamic routes with SSR for SEO.

</domain>

<decisions>
## Implementation Decisions

### In-App Artist Profile (decibel-mobile)
**Top section:**
- Artist image (large, hero style)
- Artist name
- Platform icons (Spotify/Apple Music/SoundCloud) — tappable, opens their profile
- Current monthly listeners or follower count
- "Founded by @username on [date]" — founder always credited, always visible, tappable
- "Collected by X people on Decibel" — social proof

**Middle section:**
- Embedded player for their top track (same WebView embed as Jukebox)
- "Find" button if user hasn't collected them yet

**Bottom section:**
- "Collectors" — horizontal scroll or list of user avatars who have collected this artist
- Founder first with gold badge, then sorted by recency

### Collector List Screen (decibel-mobile)
- Full list of collectors for an artist
- Founder at top with gold ★ badge
- Each row: avatar, username, date collected
- Tappable rows navigate to user's passport

### Link-in-Bio Web Page (decibel — /[artistslug])
- Next.js dynamic route: pages or app router
- Server-side rendered for SEO
- Layout:
  - Artist image (hero)
  - Artist name
  - "X people have collected [Artist] on Decibel" — social proof
  - "Founded by @username" — links to founder's web passport
  - Platform links (Spotify, Apple Music, SoundCloud, Instagram, Twitter, YouTube, merch) — styled buttons
  - "Collect on Decibel" CTA — deep links to app or App Store
  - Decibel branding in footer
- OG meta tags for social sharing (artist image, name, collector count)
- 2,164+ artists = 2,164 indexable pages for SEO

### User Passport Web Page (decibel — /@username)
- Public web version of user's passport
- Shows Finds, Founders, Discoveries, stats, badges in read-only format
- Shareable URL
- OG tags for social previews

### Deep Linking
- "Collect on Decibel" button: deep link to app if installed, App Store if not
- Can use expo-linking or a universal link scheme

### API Endpoints (in /home/swarn/decibel)
- GET /api/mobile/artist-fans — may already exist, list of fans for an artist (founder at top)
- The SSR pages query Supabase directly (server-side) — no API needed

### Claude's Discretion
- Whether to use App Router or Pages Router for the web pages (App Router preferred since the project already uses it)
- Exact styling of the link-in-bio page
- Universal link vs custom URL scheme for deep linking
- Whether to use generateMetadata or head tags for OG meta

</decisions>

<specifics>
## Specific Ideas

- Existing artist profile at app/artist/[slug].tsx — enhance, don't rebuild
- Existing artist-fans API at /api/mobile/artist-fans — check what it returns
- The decibel project already has some web pages — check existing routing structure
- For the link-in-bio pages, use Supabase server client with service role for SSR queries
- OG image can be the artist's image_url from the DB
- Deep linking: expo-linking for the mobile side, Apple App Site Association for universal links

</specifics>

<deferred>
## Deferred Ideas

- Upcoming shows section on link-in-bio (Phase 6 — Smart Flyer)
- Link-in-bio customization by artists (Phase 6 — dashboard settings)
- Artist claiming flow (Phase 6 — separate from the public page)

</deferred>

---

*Phase: 18-artist-profile-link-in-bio*
*Context gathered: 2026-03-16 via PRD Express Path*
