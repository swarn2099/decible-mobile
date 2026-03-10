# Feature Research

**Domain:** Live music passport — artist discovery + show attendance logging (mobile)
**Researched:** 2026-03-10
**Confidence:** HIGH (deep PRD context, training knowledge of comparable apps: Bandsintown, Songkick, Foursquare/Swarm, Letterboxd, Last.fm, Spotify)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Artist link validation with clear error states | Users paste a wrong URL constantly; silent failures or generic errors cause immediate abandonment | MEDIUM | Must handle short links (spotify.link), subdomains (m.soundcloud.com), missing https prefix. Error message must be specific: "Paste a Spotify, Apple Music, or SoundCloud artist link." |
| Loading state during link fetch | Network calls take 500ms-3s; no spinner = users tap again, double-submit | LOW | Skeleton or progress indicator on the paste field after input |
| Eligibility rejection with clear explanation | Rejection without reason feels like a bug. "This artist has over 1M monthly listeners" sets the right expectation and educates about Decibel's purpose | LOW | Show the artist card + listener count alongside the rejection message — proves the check ran |
| Already-on-Decibel detection | If user pastes a link for an artist already in DB, they must NOT see "Add" — they see Discover or their existing status | MEDIUM | Cross-reference performers table by spotify_id / soundcloud_slug / apple_music_id before calling the add flow |
| GPS permission rationale screen | iOS requires a usage description string; users deny location permission when they don't understand why. "We need your location to match you to a venue" gets higher accept rate | LOW | One-screen explanation before `requestForegroundPermissionsAsync()`. Show only once, remember result. |
| Venue match confirmation | After GPS match, always confirm: "You're at Smartbar — is this right?" Users distrust silent auto-matching, especially in dense areas or multi-venue buildings | LOW | Show venue name, address, distance. "Not this venue?" fallback link |
| Check-in loading state | Venue lookup + scraper call can take 2-5 seconds. Spinner with "Checking tonight's lineup..." keeps user engaged | LOW | Don't block UI — show optimistic venue name, then fill in lineup when ready |
| Stamp persisted in passport immediately | After check-in, stamp must appear in Passport tab before user navigates away. If they have to pull-to-refresh to see it, it feels broken | MEDIUM | Optimistic UI update via React Query cache invalidation after successful check-in API call |
| Finds grid is tappable | Artist cards in the 2x3 Finds grid must tap through to the artist profile. If tapping does nothing, the section feels decorative | LOW | Each card wraps in Pressable → artist profile push |
| Stamps grouped logically | Users scanning their stamp history expect chronological order, most recent first. Random order feels broken | LOW | ORDER BY event_date DESC in the stamps query |
| Share sheet uses native OS sheet | Custom share buttons that don't trigger the iOS/Android native share sheet feel wrong — users expect the system share UX | LOW | React Native `Share.share()` for text/URL, `expo-sharing` for files |
| Share card actually saves to photos | "Save to Camera Roll" is the most-used share action after Instagram Stories. It must work without errors | LOW | `expo-media-library` with `MEDIA_LIBRARY` permission. Handle permission denial gracefully |
| Post-found state persists | If user closes the celebration modal and reopens the artist profile, button must still read "★ Founded" — not reset to "Discover" | LOW | Zustand store update + React Query cache invalidation after Found |

---

### Differentiators (Competitive Advantage)

Features that set Decibel apart from Bandsintown, Songkick, Last.fm, and generic collection apps.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Founder badge (one-of-one) | Scarcity mechanics borrowed from NFTs/trading cards. Being the first is permanent and visible to everyone — drives competitive discovery behavior among Group A users | MEDIUM | DB-level uniqueness: only one founder_badge row per performer. Race condition handling: if two users paste the same artist link simultaneously, first successful INSERT wins; second gets "Discover" button |
| Link-paste-only adding (intentional friction) | Forces users to find the artist on Spotify/SoundCloud first — this filters casual users and ensures only real fans add artists. No mainstream acts slip through. Directly enforces the underground mandate. | MEDIUM | The friction IS the feature. Bandsintown and Songkick allow any search — Decibel's restriction is differentiation, not a limitation |
| Eligibility threshold enforcement | 1M Spotify / 100K SoundCloud cap makes "Found" badges credibly underground. A user who founded ODESZA (35M listeners) would be meaningless. The cap is what gives the collection meaning. | HIGH | Requires on-demand Spotify scraper call (spotifyscraper Python lib on VM) or Spotify oEmbed. Monthly listener data stales fast — store `spotify_listeners_updated_at` and re-check if >7 days old |
| Check-in creates stamps, not just check-ins | Foursquare/Swarm check you into venues. Decibel stamps artists to your passport. The distinction matters: your collection is artists you've seen live, not venues you've visited. | MEDIUM | A single check-in can produce multiple stamps (full lineup collected). The stamp contains artist + venue + date — not just venue + date |
| Scenario B: user-tagged lineups accumulate over time | When no scraped lineup exists, user-tagged events build a community-sourced venue database. Second user checking in that night sees "John tagged DJ Heather here earlier — is she still playing?" This is real network-effect value that no other app has. | HIGH | Requires `user_tagged_events` table + smart suggestion UI. The "last Friday pattern" detection (recurring residencies) is Beta 2 but the table needs to exist now |
| Analog passport aesthetic for Stamps | Letterboxd uses movie poster grids. Strava uses segment maps. Decibel's Stamps section with paper grain, rotated stamps, and ink textures creates a physical diary feeling that screenshots beautifully — organic social sharing | HIGH | Paper grain texture as a React Native image overlay on the stamps section background. Per-stamp random rotation (-3° to +3°) via `Math.random()` seeded by stamp ID (deterministic, so rotation doesn't change on re-render) |
| Rubber stamp animation on check-in | No music app has this. It's tactile, surprising, and memorable. Users will record their screen the first time they check in and post it. First-impression moments drive word-of-mouth | HIGH | Lottie animation (stamp down → ink spread → lift reveal) + `expo-haptics` medium impact. Keep Lottie file small (<50KB). Test on low-end Android |
| Post-found celebration with share prompt | Immediate "Share your claim?" prompt after founding converts the high-emotion moment into organic marketing. Instagram Stories formatted at 9:16 is key — most users are on mobile posting to Stories, not feed | MEDIUM | Share card generated server-side (Puppeteer/html-to-image on Vercel serverless) as PNG. Mobile app fetches URL, downloads PNG, calls native Share API |
| Finds vs Stamps as two distinct visual languages | Other collection apps use one list or one grid for everything. Decibel's dual visual system (clean digital gallery for Finds, textured analog diary for Stamps) signals that these are different things with different meaning | HIGH | Two separate components with zero shared layout logic. FindsGrid: 2-column CSS grid. StampsSection: absolute positioning for rotation, custom texture overlay |
| Founder share card with artist photo | Shareable "I found this artist first" card designed for Instagram Stories. If the artist blows up later, users resurface the card. Time-stamped cultural credibility. No other app creates this artifact. | MEDIUM | Server-side PNG generation. Dark gradient background, large artist photo, "★ FOUNDED BY @username" text, Decibel wordmark, date. 9:16 ratio for Stories. Also generate 1:1 square for feed posts. |
| Collection hierarchy (Founded > Collected > Discovered) | Letterboxd has one state: watched. Decibel has three with clear value hierarchy. Collected (live, GPS-verified) outranks Discovered (online) but only Founded is truly scarce. The hierarchy creates status gradients within a single artist's fanbase. | LOW | Already implemented in DB and button logic. The Finds vs Stamps redesign makes the hierarchy visually obvious for the first time |
| Fans list ranked by collection type | Artist profile shows fans in order: Founder first (gold, permanent top), then Collected, then Discovered. This is a social ranking that motivates repeat attendance (to get Collected status) and early discovery (to get Founded). | LOW | Already partially designed (PRD 6.6). The Founder always pins to top regardless of when they were added. Ties within Collected broken by collected_at date (earlier = higher) |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems Decibel should deliberately avoid.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Text search for external artist catalogs | Users want to type "Peggy Gou" and find her instead of hunting for a link | Opens the door to adding any mainstream artist, destroying the "underground" mandate. Spotify search returns Taylor Swift and Billie Eilish. You'd need eligibility filtering on every search result, creating a confusing UX. | Link-paste only. The friction of finding the link is the filter. If you can't find a SoundCloud link for an artist, they're probably not underground enough. |
| Deezer API integration | Deezer has a large catalog and was previously used | Deezer's API is unreliable in the US, has rate limits, and doesn't provide monthly listener counts for eligibility checking. Already removed from v4. | Spotify oEmbed + SoundCloud API + Apple Music API covers 95%+ of underground artists |
| Auto-detect user location in background | Users want passive check-ins (app detects you're at Smartbar automatically) | Background location is an iOS/Android nightmare: battery drain, permission friction, frequent permission revocation, App Store scrutiny. Users feel surveilled. | "While Using" permission only, triggered by explicit "I'm at a Show" tap. Explicit intent = zero ambiguity about why location is accessed. |
| Rating artists from Finds (online-only) | Users want to rate artists they've discovered without seeing them live | Dilutes the Volume Rating System's value proposition. If anyone can rate, ratings become meaningless. The value is specifically that only people who showed up can rate. (Also: Volume Rating is Beta 2 anyway) | Volume Rating gated to Collected (GPS-verified) fans only. This is the rule, not a bug. |
| Venue creation open to all users | Group B users want to add their favorite bars and restaurants | TouchTunes bars, clubs with just DJs playing recorded music, and karaoke bars would flood the venue DB. Every venue Decibel adds must have confirmed live music potential. | Venues added via Scenario C check-in are legitimate because the user is tagging a live performer simultaneously. The live performer tag is the signal, not the venue addition. |
| Instagram auto-posting without approval | Auto-post to @decibellive when artists are Founded | Risk: posting embarrassing content, the artist dislikes the attention, or the post violates terms. Requires human review loop at this scale. | Beta 2 feature with a curation queue (Claude Code on VM generates candidates, Swarn approves). Not for initial launch. |
| Fantasy Music League in current milestone | "While we're building, let's add fantasy league data collection" | Requires daily Spotify listener scraper cron, separate tournament DB tables, draft logic, scoring engine — a full product within the product. Scope explosion. | Beta 2. The Spotify listener data already gets stored on performers table (spotify_monthly_listeners). That's the only groundwork to lay now. |
| Real-time "who's here now" map | Users want to see friends at venues live | Requires WebSocket or polling infrastructure, location sharing consent flows, privacy considerations. Battery drain. A feature requiring continuous engagement from both the viewer and the person being viewed. | "Who's Out Tonight" is Beta 2. The activity feed (async, pull) serves social proof at launch. |
| Push notifications for friend check-ins | "Get notified when Brendan checks in at Smartbar" | Notification fatigue is immediate. Users disable push within days. At small user counts, notifications feel stalker-y. | Activity feed serves this. Explicit follow → feed card is less intrusive. Weekly recap (Beta 2) is the right notification surface. |
| QR code scanning for artist claim | "Add artist by scanning a venue poster QR code" | QR codes on venue posters are rare and inconsistent (most link to Linktree or Facebook events, not artist profiles). Adds a camera permission, a QR parsing dependency, and a new UX flow for marginal coverage. | Link paste handles 100% of the use case. If a poster has a Spotify QR, users can use the camera app to resolve it, then copy the URL and paste it into Decibel. |

---

## Feature Dependencies

```
Link-Paste Add Flow
    └──requires──> URL Parser (detect platform from URL)
                       └──requires──> Platform API calls (Spotify oEmbed, SoundCloud API, Apple Music)
                                          └──requires──> Eligibility Check (monthly listener count)
                                                             └──requires──> Spotify Scraper (for listener count)
    └──requires──> performers DB lookup (detect already-on-Decibel)
    └──requires──> founder_badges DB check (is user the Founder?)

Check-In Flow (Scenario A)
    └──requires──> GPS permission ("While Using")
    └──requires──> Venue DB with GPS coordinates (Haversine match)
    └──requires──> Scraped lineup data (RA/DICE/EDMTrain/19hz) OR user_tagged_events
    └──produces──> Stamp (collections table, type: collected)
    └──produces──> Stamp animation

Check-In Flow (Scenario B)
    └──requires──> Scenario A (GPS + venue match)
    └──requires──> Link-Paste Add Flow (for tagging the DJ)
    └──produces──> user_tagged_events row
    └──produces──> Stamp

Check-In Flow (Scenario C)
    └──requires──> GPS (no venue match)
    └──requires──> user_tagged_events table
    └──requires──> Link-Paste Add Flow (tag performer)
    └──produces──> New venue in venues table
    └──produces──> Stamp

Stamp Animation
    └──requires──> Lottie file (rubber stamp press + ink spread)
    └──requires──> expo-haptics
    └──enhances──> Check-In Flow (plays after Stamp is created)

Passport Redesign — Finds Grid
    └──requires──> collections table query (type: founded OR discovered)
    └──requires──> performers table join (photo, name, genres)
    └──enhances──> Artist profile navigation (tap-through)

Passport Redesign — Stamps Section
    └──requires──> collections table query (type: collected)
    └──requires──> venues table join (venue name, location)
    └──requires──> performers table join (artist name)

Founder Share Card
    └──requires──> Link-Paste Add Flow (must have Founded successfully)
    └──requires──> /api/share-card/founder endpoint (server-side PNG)
    └──requires──> expo-media-library (save to photos)
    └──requires──> React Native Share API

Passport Share Card
    └──requires──> Passport Redesign (visual source of truth for the card)
    └──requires──> /api/share-card/passport endpoint (server-side PNG)

Post-Found Celebration
    └──requires──> Lottie confetti animation
    └──requires──> Founder Share Card generation
    └──enhances──> Link-Paste Add Flow (plays after successful Found)

Fans List Screen
    └──requires──> /api/mobile/artist-fans endpoint
    └──requires──> founder_badges table (to pin Founder at top)
    └──enhances──> Artist Profile (tap fan count → fans list)
```

### Dependency Notes

- **Check-In Scenarios B and C require the Link-Paste flow:** When no lineup is found, the tag-a-DJ sub-flow reuses the same URL parser + platform API call + eligibility check as the standalone Add flow. Build Add flow first (Phase 2), then Check-In (Phase 3).
- **Stamp animation requires a Stamp being created:** Don't animate until the API call succeeds. Optimistic animation before confirmation risks showing a stamp that failed to save.
- **Passport redesign unlocks the share card's visual quality:** If Finds grid and Stamps section are redesigned first, the Passport Share Card can pull the same visual language and look cohesive. Build Phase 4 before Phase 5.
- **Server-side PNG generation is shared by both share cards:** `/api/share-card/founder` and `/api/share-card/passport` use the same Puppeteer/html-to-image infrastructure. Build one, get the other cheap.
- **user_tagged_events conflicts with scraped lineup data:** They are additive, not exclusive. Scraped lineup takes priority when available; user-tagged fills the gap. The check-in flow must check scraped data first, then fall back to user-tagged events.

---

## MVP Definition

### Launch With (current milestone — Phases 2-5)

These are required to move from Phase 1 (scaffold complete) to a shippable product:

- [ ] **Link-paste Add flow with eligibility check** — the core Group A mechanic. Without this, Artist Hunters cannot add new artists. The Deezer replacement is blocking.
- [ ] **+ tab "Add an Artist" / "I'm at a Show" toggle** — without this, both primary actions are unreachable. The tab is a placeholder today.
- [ ] **Check-in Scenario A (known venue + lineup)** — the core Group B mechanic. Smartbar, Spybar, Schubas all have scraped lineups. This covers 70%+ of real check-ins in the target Chicago market.
- [ ] **Check-in Scenario B (tag DJ)** — covers the gap when scraper has no lineup. Without this, users who check in at a venue on a night without scraped data get nothing.
- [ ] **Stamp animation** — not cosmetic. The animation IS the moment. Without it, check-in feels like filling out a form. This is the emotional hook for Group B.
- [ ] **Passport Finds grid (2x3)** — replaces the current flat list. The gallery aesthetic is required for the share card to look designed, not like a screenshot.
- [ ] **Passport Stamps section (analog aesthetic)** — the paper grain + rotated stamps is the core identity of the "passport" metaphor. Without it, the tab is just a list of check-ins.
- [ ] **Founder share card** — captures the high-emotion moment. Post-found celebration with share prompt drives the first wave of organic installs.
- [ ] **Passport share card** — "Share Passport" button already exists in Phase 1; it's broken. Fixing it with a designed card is Phase 5.

### Add After Validation (v1.x — Beta 2)

- [ ] **Check-in Scenario C (unknown venue)** — covers edge cases. Launch without it; Scenario C adds complexity and the Chicago market has enough known venues for beta.
- [ ] **Recurring lineup suggestions** — "Last Friday, DJ Heather was here. Is she playing tonight?" — requires `user_tagged_events` data accumulation over weeks of real usage. Can't test without live users.
- [ ] **Volume Rating System** — gated to Collected fans. Add after check-ins are working and the Collected user base has grown.
- [ ] **Fantasy Music League** — requires daily Spotify scraper cron. Separate project. Add when 200+ active Founded artists exist.
- [ ] **"Who's Out Tonight" friend map** — requires WebSocket infrastructure and critical mass (50+ concurrent active users) to be useful.

### Future Consideration (v2+)

- [ ] **DJ Monetization (Pro/Agency tiers)** — shelved until 500+ active users per PRD.
- [ ] **Instagram auto-posting** — @decibellive content engine. Not for beta launch.
- [ ] **Weekly recap push notifications** — notification fatigue risk before product-market fit.
- [ ] **Website conversion funnel (artist SEO pages)** — separate project (~/decibel Next.js app).

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Link-paste Add flow + eligibility check | HIGH | HIGH | P1 |
| + tab toggle (Add / Check In) | HIGH | LOW | P1 |
| Check-in Scenario A (known venue + lineup) | HIGH | MEDIUM | P1 |
| Stamp animation (rubber stamp + haptic) | HIGH | MEDIUM | P1 |
| Passport Finds grid redesign | HIGH | MEDIUM | P1 |
| Passport Stamps analog redesign | HIGH | HIGH | P1 |
| Founder share card | HIGH | MEDIUM | P1 |
| Check-in Scenario B (tag DJ + user_tagged_events) | MEDIUM | HIGH | P1 |
| Post-found celebration (confetti + badge reveal) | MEDIUM | MEDIUM | P1 |
| Passport share card | MEDIUM | LOW (reuses infra) | P2 |
| Artist fans list screen | MEDIUM | LOW | P2 |
| Check-in Scenario C (unknown venue) | LOW | HIGH | P2 |
| Recurring lineup suggestions | LOW | HIGH | P3 |
| Fantasy Music League | LOW | HIGH | P3 |

**Priority key:**
- P1: Required for current milestone (Phases 2-5)
- P2: Include if time allows, defer otherwise
- P3: Beta 2 only

---

## Competitor Feature Analysis

| Feature | Bandsintown / Songkick | Foursquare / Swarm | Last.fm | Decibel Approach |
|---------|------------------------|-------------------|---------|------------------|
| Adding artists | Search any artist by name | N/A | Scrobble from streaming | Link-paste only with eligibility gate — forces underground discovery |
| Check-in | RSVP before the show, "I was here" after | Venue check-in, any location | Scrobble during listening (not live) | GPS-matched to venue + live performer required — stamps prove you were there |
| Collection display | List of past shows by date | List of visited venues with check-in counts | List of scrobbled tracks | Dual aesthetic: digital gallery (Finds) + analog passport (Stamps) — visually distinct and shareable |
| Social proof | Friends attending same show | Friends who checked in | Friends' scrobbles in feed | Activity feed with Find cards + Stamp cards, follow-based |
| Scarcity / status | None | Mayorships (first/most check-ins at venue) | None | Founder badge (one-of-one per artist, permanent) |
| Share cards | None | None | "Year in music" annual recap | Post-found Founder card (immediate, every Found) + Passport card (on demand) |
| Eligibility filter | None — Drake and Taylor Swift in catalog | N/A | None | Hard cap at 1M Spotify / 100K SoundCloud monthly listeners |
| Platform coverage | Ticketed events only | Any venue | Any music | Any underground artist on Spotify, Apple Music, or SoundCloud |

**Key insight:** No competitor combines (1) artist discovery with eligibility gating, (2) GPS-verified live attendance stamps, and (3) a designed share card system. Each competitor does one piece. Decibel is the first to connect discovery → live attendance → social proof in a single passport metaphor.

---

## Sources

- PRD v5 (DECIBEL_PRD_v5.md) — primary product specification, HIGH confidence
- DESIGN_SYSTEM.md — component and animation specifications, HIGH confidence
- CLAUDE.md (project) — constraints and architectural decisions, HIGH confidence
- Training knowledge: Bandsintown, Songkick, Foursquare/Swarm, Last.fm, Letterboxd, Spotify Wrapped, Strava — feature comparison, MEDIUM confidence (training data, not verified against current live products)
- Note: WebSearch and Brave Search unavailable during this research session. Competitor analysis derived from training data through August 2025.

---
*Feature research for: Decibel — Live Music Passport*
*Researched: 2026-03-10*
