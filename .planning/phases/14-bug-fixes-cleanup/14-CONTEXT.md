# Phase 14: Bug Fixes & Cleanup - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning
**Source:** PRD Express Path (DECIBEL_V6_PRD.md, Phase 1)

<domain>
## Phase Boundary

This phase stabilizes the fan app and removes deprecated UI. Specifically:
- Fix 4 bugs (Apple Music parsing, stat mismatch, share modal, listen links)
- Remove stamps/events/venue detection from UI (data preserved in DB)
- Restructure passport tabs and header stats
- Add song/album link support (extract artist from track/album URLs)
- Remove non-functional map button from Home screen

Repo: /home/swarn/decibel-mobile only (no API changes needed)

</domain>

<decisions>
## Implementation Decisions

### Apple Music URL Parsing
- Must handle artist URLs: `https://music.apple.com/us/artist/name/id`
- Must handle song URLs: `https://music.apple.com/us/album/song-name/albumid?i=trackid`
- Must handle album URLs: `https://music.apple.com/us/album/name/id`
- Must handle regional URL variations (different country codes like /gb/, /jp/, etc.)
- Test with at least 10 different Apple Music URLs across artists, songs, and albums

### Stat Mismatch Fix
- Brendan shows 58 finds when searched but 17 on his profile
- The search results query and profile page query are pulling from different sources/filters
- Both must show the same number
- Verify fix with at least 3 user profiles

### UI Cleanup — Stamps Removal
- Remove "I'm at a Show" button from the + tab
- Remove Stamps tab from the Passport (was the first tab)
- Passport tabs become: Finds | Founders | Discoveries | Badges
- Finds tab shows ALL artists the user has found (including those where user is the Founder)
- Founders tab shows ONLY artists where the user holds the Founder Badge
- Header stats become: Followers | Following | Finds | Founders
- Followers and Following remain tappable (open list)
- Remove any Stamps count from the UI
- Remove non-functional map button from Home screen
- Keep stamp data in database — don't delete, just hide from UI

### Song/Album Link Support
- Users can paste any song, album, or artist URL from Spotify, Apple Music, or SoundCloud
- App extracts the artist from the content metadata (track → artist, album → artist)
- Shows standard artist confirmation card
- Adds note: "Found via '[Track Name]'" on the confirmation card for song links
- Everything else (founder check, eligibility check, collect flow) works the same

### Share Modal Fix
- Share functionality must work for passport sharing and individual artist card sharing
- Critical for viral growth

### Listen Links Fix
- Tapping listen should open correct platform (Spotify/Apple Music/SoundCloud) in native app or browser
- Fix for all three platforms
- Only show listen link for platforms where URL actually exists in DB

### Claude's Discretion
- Implementation approach for URL parsing (regex vs URL parsing library)
- How to resolve artist info from song/album URLs (API calls vs scraping)
- Exact UI treatment for "Found via [Track Name]" text on confirmation card
- Strategy for fixing stat mismatch (depends on investigation of actual queries)

</decisions>

<specifics>
## Specific Ideas

- SoundCloud URLs: support with/without https, with/without www, with m. subdomain
- Listen links: detect platform from URL domain (not hardcoded per field) — pattern from v5 bugfix
- City only shown for claimed artists (no default "Chicago") — pattern from v5 bugfix
- The + tab becomes Find-only (no toggle between "Add an Artist" / "I'm at a Show")
- Apple Music cross-reference: if artist not found on Spotify, default to eligible

</specifics>

<deferred>
## Deferred Ideas

None — PRD covers phase scope. Song link support for album URLs may require additional API integration if platform APIs don't easily resolve album → artist, but this should be attempted in this phase.

</deferred>

---

*Phase: 14-bug-fixes-cleanup*
*Context gathered: 2026-03-16 via PRD Express Path*
