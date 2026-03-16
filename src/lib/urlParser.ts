/**
 * URL parsing utilities for extracting artist info from Spotify, SoundCloud,
 * and Instagram links shared TO Decibel.
 */

export type ParsedArtistUrl = {
  platform: "spotify" | "spotify_short" | "soundcloud" | "apple_music" | "instagram" | "mixcloud";
  artistId: string; // Spotify ID, SoundCloud/Mixcloud username, Instagram handle, Apple Music numeric ID (or content ID), or full URL for spotify_short
  contentType?: "artist" | "track" | "album" | "song"; // type of content the URL points to
  contentId?: string; // for Apple Music songs: the track ID from ?i= param
};

/**
 * Parse an artist URL from Spotify, SoundCloud, Apple Music, or Instagram.
 * Returns platform + artistId (+ optional contentType/contentId) or null if unrecognized.
 *
 * For song/track URLs, artistId holds the track/album ID and contentType indicates
 * the content type. The backend will resolve these to the artist.
 */
export function parseArtistUrl(url: string): ParsedArtistUrl | null {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();

  // Spotify URI format: spotify:artist:{id}
  const spotifyUriMatch = trimmed.match(/^spotify:artist:([a-zA-Z0-9]+)$/);
  if (spotifyUriMatch) {
    return { platform: "spotify", artistId: spotifyUriMatch[1], contentType: "artist" };
  }

  // Try parsing as URL
  let parsed: URL;
  try {
    // Handle missing protocol
    const withProtocol =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;
    parsed = new URL(withProtocol);
  } catch {
    return null;
  }

  const hostname = parsed.hostname.replace(/^(www|m)\./, "");
  // Clean pathname: remove trailing slashes and get segments
  const pathname = parsed.pathname.replace(/\/+$/, "");
  const segments = pathname.split("/").filter(Boolean);

  // spotify.link short URLs — backend must resolve the redirect
  if (hostname === "spotify.link") {
    return { platform: "spotify_short", artistId: trimmed };
  }

  // Apple Music: music.apple.com/{region}/... or itunes.apple.com/{region}/...
  if (hostname === "music.apple.com" || hostname === "itunes.apple.com") {
    const artistIdx = segments.indexOf("artist");
    if (artistIdx >= 0) {
      // Artist URL: /region/artist/{name}/{id} or /region/artist/{id}
      // Prefer the numeric ID after the name segment (index + 2), fall back to index + 1
      const idSegment = segments[artistIdx + 2] || segments[artistIdx + 1];
      if (idSegment) {
        return { platform: "apple_music", artistId: idSegment, contentType: "artist" };
      }
    }

    // Album URL: /region/album/{name}/{id}
    const albumIdx = segments.indexOf("album");
    if (albumIdx >= 0) {
      // Get album ID — it's the last numeric segment after "album"
      const idSegment = segments[albumIdx + 2] || segments[albumIdx + 1];
      if (idSegment && /^\d+$/.test(idSegment)) {
        // Song URL: album URL with ?i= param (song within album)
        const trackId = parsed.searchParams.get("i");
        if (trackId) {
          return {
            platform: "apple_music",
            artistId: idSegment, // album ID
            contentType: "song",
            contentId: trackId, // track ID
          };
        }
        // Plain album URL
        return { platform: "apple_music", artistId: idSegment, contentType: "album" };
      }
    }

    return null;
  }

  // Spotify: https://open.spotify.com/artist/{id} | /track/{id} | /album/{id}
  if (hostname === "open.spotify.com") {
    if (segments.length >= 2 && segments[1]) {
      const contentId = segments[1].split("?")[0];
      if (/^[a-zA-Z0-9]+$/.test(contentId)) {
        const contentType = segments[0];
        if (contentType === "artist") {
          return { platform: "spotify", artistId: contentId, contentType: "artist" };
        }
        if (contentType === "track") {
          return { platform: "spotify", artistId: contentId, contentType: "track" };
        }
        if (contentType === "album") {
          return { platform: "spotify", artistId: contentId, contentType: "album" };
        }
      }
    }
    return null;
  }

  // SoundCloud: https://soundcloud.com/{username} or {username}/{track-slug}
  if (hostname === "soundcloud.com") {
    // System paths to skip
    const systemPaths = [
      "discover",
      "stream",
      "search",
      "upload",
      "you",
      "charts",
      "stations",
      "people",
      "messages",
      "settings",
      "notifications",
      "pro",
      "go",
      "creators",
      "pages",
      "terms-of-use",
      "privacy",
      "imprint",
      "popular",
    ];

    if (segments.length >= 1 && segments[0]) {
      const username = segments[0];
      if (systemPaths.includes(username.toLowerCase())) {
        return null;
      }
      // Two-segment path: {username}/{track-slug} → track
      if (segments.length === 2 && segments[1]) {
        return { platform: "soundcloud", artistId: username, contentType: "track" };
      }
      // One-segment path: {username} → artist
      if (segments.length === 1) {
        return { platform: "soundcloud", artistId: username, contentType: "artist" };
      }
    }
    return null;
  }

  // Mixcloud: https://www.mixcloud.com/{username}
  if (hostname === "mixcloud.com") {
    if (segments.length === 1 && segments[0]) {
      const username = segments[0];
      const systemPaths = [
        "discover",
        "categories",
        "competitions",
        "upload",
        "settings",
        "messages",
      ];
      if (!systemPaths.includes(username.toLowerCase())) {
        return { platform: "mixcloud", artistId: username };
      }
    }
    return null;
  }

  // Instagram: https://instagram.com/{handle} or https://www.instagram.com/{handle}
  if (hostname === "instagram.com") {
    if (segments.length === 1 && segments[0]) {
      const handle = segments[0];
      // Skip Instagram system paths
      const systemPaths = [
        "explore",
        "reels",
        "stories",
        "direct",
        "accounts",
        "about",
        "legal",
        "p",
        "reel",
        "tv",
      ];
      if (!systemPaths.includes(handle.toLowerCase())) {
        return { platform: "instagram", artistId: handle };
      }
    }
    return null;
  }

  return null;
}

/**
 * Extract the first URL from shared text.
 * Android shares text/plain which may contain extra text around the URL.
 * e.g. "Check out this artist https://open.spotify.com/artist/123 on Spotify!"
 */
export function extractUrlFromSharedText(text: string): string | null {
  if (!text || typeof text !== "string") return null;

  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/i;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}
