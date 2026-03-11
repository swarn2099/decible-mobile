import { parseArtistUrl, extractUrlFromSharedText } from "./urlParser";

describe("parseArtistUrl", () => {
  // Spotify standard
  test("parses open.spotify.com/artist/{id}", () => {
    const result = parseArtistUrl("https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb");
    expect(result).toEqual({ platform: "spotify", artistId: "4Z8W4fKeB5YxbusRsdQVPb" });
  });

  test("parses spotify URI spotify:artist:{id}", () => {
    const result = parseArtistUrl("spotify:artist:4Z8W4fKeB5YxbusRsdQVPb");
    expect(result).toEqual({ platform: "spotify", artistId: "4Z8W4fKeB5YxbusRsdQVPb" });
  });

  // Spotify short link
  test("detects spotify.link as spotify_short", () => {
    const result = parseArtistUrl("https://spotify.link/abc123");
    expect(result).toEqual({ platform: "spotify_short", artistId: "https://spotify.link/abc123" });
  });

  // SoundCloud variants
  test("parses soundcloud.com/{username}", () => {
    const result = parseArtistUrl("https://soundcloud.com/flume");
    expect(result?.platform).toBe("soundcloud");
  });

  test("parses m.soundcloud.com/{username}", () => {
    const result = parseArtistUrl("https://m.soundcloud.com/flume");
    expect(result?.platform).toBe("soundcloud");
  });

  test("parses www.soundcloud.com/{username}", () => {
    const result = parseArtistUrl("https://www.soundcloud.com/flume");
    expect(result?.platform).toBe("soundcloud");
  });

  test("parses soundcloud without https", () => {
    const result = parseArtistUrl("soundcloud.com/flume");
    expect(result?.platform).toBe("soundcloud");
  });

  // Apple Music
  test("parses music.apple.com artist URL", () => {
    const result = parseArtistUrl("https://music.apple.com/us/artist/billie-eilish/1065981054");
    expect(result).toEqual({ platform: "apple_music", artistId: "1065981054" });
  });

  test("parses itunes.apple.com artist URL", () => {
    const result = parseArtistUrl("https://itunes.apple.com/us/artist/billie-eilish/1065981054");
    expect(result).toEqual({ platform: "apple_music", artistId: "1065981054" });
  });

  // Unsupported platforms
  test("returns null for YouTube URLs", () => {
    expect(parseArtistUrl("https://youtube.com/@someartist")).toBeNull();
  });

  test("returns null for random URLs", () => {
    expect(parseArtistUrl("https://example.com/foo")).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(parseArtistUrl("")).toBeNull();
  });
});

describe("extractUrlFromSharedText", () => {
  test("extracts URL from shared text with surrounding text", () => {
    const result = extractUrlFromSharedText("Check out this artist https://open.spotify.com/artist/abc123 on Spotify!");
    expect(result).toBe("https://open.spotify.com/artist/abc123");
  });
});
