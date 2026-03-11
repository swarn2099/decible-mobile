/**
 * Passport types — mirrors web app's src/lib/types/passport.ts
 */

export interface PassportStats {
  totalArtists: number; // unique performers collected (verified)
  totalDiscovered: number; // unique performers discovered (online)
  totalShows: number; // total verified collection entries
  uniqueVenues: number;
  uniqueCities: number;
  favoriteGenre: string | null;
  mostCollectedArtist: { name: string; count: number } | null;
  mostVisitedVenue: { name: string; count: number } | null;
  currentStreak: number; // consecutive weeks with a verified scan
  memberSince: string;
}

export interface PassportTimelineEntry {
  id: string; // collection id
  performer: {
    id: string;
    name: string;
    slug: string;
    photo_url: string | null;
    genres: string[];
    city: string;
    platform_url: string | null; // first non-null of spotify_url / soundcloud_url / apple_music_url
  };
  venue: { name: string } | null;
  event_date: string | null;
  capture_method: "qr" | "nfc" | "location" | "online";
  verified: boolean;
  created_at: string;
  scan_count: number | null;
  current_tier: string | null;
  is_founder?: boolean;
  fan_count: number; // total collection entries for this performer
}

export interface CollectionStamp extends PassportTimelineEntry {
  /** Seeded rotation in degrees (-3 to +3) from collection id hash */
  rotation: number;
}
