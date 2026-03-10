/**
 * URL parsing utilities for extracting artist info from Spotify, SoundCloud,
 * and Instagram links shared TO Decibel.
 */

export type ParsedArtistUrl = {
  platform: "spotify" | "soundcloud" | "instagram" | "mixcloud";
  artistId: string; // Spotify ID, SoundCloud/Mixcloud username, or Instagram handle
};

/**
 * Parse an artist URL from Spotify, SoundCloud, or Instagram.
 * Returns platform + artistId or null if unrecognized.
 */
export function parseArtistUrl(url: string): ParsedArtistUrl | null {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();

  // Spotify URI format: spotify:artist:{id}
  const spotifyUriMatch = trimmed.match(/^spotify:artist:([a-zA-Z0-9]+)$/);
  if (spotifyUriMatch) {
    return { platform: "spotify", artistId: spotifyUriMatch[1] };
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

  // Spotify: https://open.spotify.com/artist/{id}
  if (hostname === "open.spotify.com") {
    if (segments[0] === "artist" && segments[1]) {
      // Strip tracking params (the ID is alphanumeric)
      const artistId = segments[1].split("?")[0];
      if (/^[a-zA-Z0-9]+$/.test(artistId)) {
        return { platform: "spotify", artistId };
      }
    }
    return null;
  }

  // SoundCloud: https://soundcloud.com/{username}
  if (hostname === "soundcloud.com") {
    // Must have exactly one path segment (username), not a sub-page
    if (segments.length === 1 && segments[0]) {
      const username = segments[0];
      // Skip SoundCloud system paths
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
      if (!systemPaths.includes(username.toLowerCase())) {
        return { platform: "soundcloud", artistId: username };
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
