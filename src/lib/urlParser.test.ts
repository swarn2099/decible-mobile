import { parseArtistUrl, extractUrlFromSharedText } from "./urlParser";

describe("parseArtistUrl", () => {
  // Spotify standard — artist URLs (regression)
  test("parses open.spotify.com/artist/{id}", () => {
    const result = parseArtistUrl("https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb");
    expect(result).toEqual({ platform: "spotify", artistId: "4Z8W4fKeB5YxbusRsdQVPb", contentType: "artist" });
  });

  test("parses spotify URI spotify:artist:{id}", () => {
    const result = parseArtistUrl("spotify:artist:4Z8W4fKeB5YxbusRsdQVPb");
    expect(result).toEqual({ platform: "spotify", artistId: "4Z8W4fKeB5YxbusRsdQVPb", contentType: "artist" });
  });

  // Spotify short link
  test("detects spotify.link as spotify_short", () => {
    const result = parseArtistUrl("https://spotify.link/abc123");
    expect(result?.platform).toBe("spotify_short");
  });

  // Spotify track URLs (new)
  test("parses open.spotify.com/track/{id}", () => {
    const result = parseArtistUrl("https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6");
    expect(result).toEqual({
      platform: "spotify",
      artistId: "6rqhFgbbKwnb9MLmUQDhG6",
      contentType: "track",
    });
  });

  test("parses Spotify track URL with tracking params", () => {
    const result = parseArtistUrl("https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6?si=abc123");
    expect(result?.platform).toBe("spotify");
    expect(result?.contentType).toBe("track");
    expect(result?.artistId).toBe("6rqhFgbbKwnb9MLmUQDhG6");
  });

  // Spotify album URLs (new)
  test("parses open.spotify.com/album/{id}", () => {
    const result = parseArtistUrl("https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy");
    expect(result).toEqual({
      platform: "spotify",
      artistId: "4aawyAB9vmqN3uQ7FjRGTy",
      contentType: "album",
    });
  });

  test("parses Spotify album URL with tracking params", () => {
    const result = parseArtistUrl("https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy?si=xyz789");
    expect(result?.platform).toBe("spotify");
    expect(result?.contentType).toBe("album");
    expect(result?.artistId).toBe("4aawyAB9vmqN3uQ7FjRGTy");
  });

  // SoundCloud variants (regression)
  test("parses soundcloud.com/{username}", () => {
    const result = parseArtistUrl("https://soundcloud.com/flume");
    expect(result?.platform).toBe("soundcloud");
    expect(result?.contentType).toBe("artist");
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

  // SoundCloud track URLs (new)
  test("parses soundcloud.com/{username}/{track-slug} as track", () => {
    const result = parseArtistUrl("https://soundcloud.com/flume/never-be-like-you");
    expect(result?.platform).toBe("soundcloud");
    expect(result?.contentType).toBe("track");
    expect(result?.artistId).toBe("flume");
  });

  test("parses m.soundcloud.com/{username}/{track-slug} as track", () => {
    const result = parseArtistUrl("https://m.soundcloud.com/flume/never-be-like-you");
    expect(result?.platform).toBe("soundcloud");
    expect(result?.contentType).toBe("track");
    expect(result?.artistId).toBe("flume");
  });

  // Apple Music — artist URLs (regression with contentType)
  test("parses music.apple.com/us/artist URL", () => {
    const result = parseArtistUrl("https://music.apple.com/us/artist/billie-eilish/1065981054");
    expect(result?.platform).toBe("apple_music");
    expect(result?.artistId).toBe("1065981054");
    expect(result?.contentType).toBe("artist");
  });

  test("parses itunes.apple.com artist URL", () => {
    const result = parseArtistUrl("https://itunes.apple.com/us/artist/billie-eilish/1065981054");
    expect(result?.platform).toBe("apple_music");
    expect(result?.contentType).toBe("artist");
  });

  // Apple Music regional URLs (new)
  test("parses music.apple.com/gb/ (UK) artist URL", () => {
    const result = parseArtistUrl("https://music.apple.com/gb/artist/flume/471580159");
    expect(result?.platform).toBe("apple_music");
    expect(result?.contentType).toBe("artist");
    expect(result?.artistId).toBe("471580159");
  });

  test("parses music.apple.com/jp/ (Japan) artist URL", () => {
    const result = parseArtistUrl("https://music.apple.com/jp/artist/flume/471580159");
    expect(result?.platform).toBe("apple_music");
    expect(result?.contentType).toBe("artist");
    expect(result?.artistId).toBe("471580159");
  });

  test("parses music.apple.com/fr/ (France) artist URL", () => {
    const result = parseArtistUrl("https://music.apple.com/fr/artist/flume/471580159");
    expect(result?.platform).toBe("apple_music");
    expect(result?.contentType).toBe("artist");
  });

  test("parses music.apple.com/de/ (Germany) artist URL", () => {
    const result = parseArtistUrl("https://music.apple.com/de/artist/flume/471580159");
    expect(result?.platform).toBe("apple_music");
    expect(result?.contentType).toBe("artist");
  });

  test("parses music.apple.com/au/ (Australia) artist URL", () => {
    const result = parseArtistUrl("https://music.apple.com/au/artist/flume/471580159");
    expect(result?.platform).toBe("apple_music");
    expect(result?.contentType).toBe("artist");
  });

  // Apple Music song URLs (new) — song is album URL with ?i= param
  test("parses Apple Music song URL with ?i= param as song", () => {
    const result = parseArtistUrl(
      "https://music.apple.com/us/album/say-so-feat-nicki-minaj/1497160922?i=1497160927"
    );
    expect(result?.platform).toBe("apple_music");
    expect(result?.contentType).toBe("song");
    expect(result?.artistId).toBe("1497160922"); // album ID
    expect(result?.contentId).toBe("1497160927"); // track ID
  });

  test("parses Apple Music song URL with GB region and ?i= param", () => {
    const result = parseArtistUrl(
      "https://music.apple.com/gb/album/say-so/1497160922?i=1497160927"
    );
    expect(result?.platform).toBe("apple_music");
    expect(result?.contentType).toBe("song");
    expect(result?.artistId).toBe("1497160922");
  });

  // Apple Music album URLs (new)
  test("parses Apple Music album URL", () => {
    const result = parseArtistUrl(
      "https://music.apple.com/us/album/say-so-feat-nicki-minaj/1497160922"
    );
    expect(result?.platform).toBe("apple_music");
    expect(result?.contentType).toBe("album");
    expect(result?.artistId).toBe("1497160922");
  });

  test("parses Apple Music album URL with JP region", () => {
    const result = parseArtistUrl(
      "https://music.apple.com/jp/album/some-album/1234567890"
    );
    expect(result?.platform).toBe("apple_music");
    expect(result?.contentType).toBe("album");
    expect(result?.artistId).toBe("1234567890");
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

  test("extracts Apple Music URL from share text", () => {
    const result = extractUrlFromSharedText(
      "Listen to this on Apple Music https://music.apple.com/us/album/say-so/1497160922?i=1497160927"
    );
    expect(result).toBe("https://music.apple.com/us/album/say-so/1497160922?i=1497160927");
  });
});
