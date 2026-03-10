/**
 * Database types stub -- will be generated from Supabase schema.
 * For now, provides a placeholder so imports work.
 */
export type Database = {
  public: {
    Tables: Record<string, unknown>;
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
};

/**
 * Common app types used across features.
 */
export type Fan = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Performer = {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  bio: string | null;
  soundcloud_url: string | null;
  spotify_url: string | null;
  spotify_id: string | null;
  mixcloud_url: string | null;
  ra_url: string | null;
  instagram_handle: string | null;
  city: string | null;
  genres: string[] | null;
  follower_count: number | null;
  claimed: boolean;
  is_chicago_resident: boolean | null;
  created_at: string;
};

export type Venue = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  geofence_radius: number | null;
};

export type ActiveVenueEvent = {
  venue: Venue;
  performers: Pick<Performer, "id" | "name" | "slug" | "photo_url">[];
  eventId: string;
  eventDate: string;
  distance: number; // meters from fan
};

export type MapEvent = {
  id: string;
  event_date: string;
  start_time: string | null;
  performer_name: string;
  performer_slug: string;
  performer_photo: string | null;
};

export type MapVenue = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  latitude: number;
  longitude: number;
  event_count: number;
  genres: string[];
  upcoming_events: MapEvent[];
};

export type HomeFeedEvent = {
  id: string;
  event_date: string;
  start_time: string | null;
  external_url: string | null;
  performer: Pick<Performer, "name" | "slug" | "photo_url"> | null;
  venue: Pick<Venue, "name"> | null;
};

// ---------- Leaderboard types ----------

export type FanLeaderboardEntry = {
  rank: number;
  fanId: string;
  name: string;
  count: number;
  topTier: string;
};

export type PerformerLeaderboardEntry = {
  rank: number;
  performerId: string;
  name: string;
  slug: string;
  photoUrl: string | null;
  fanCount: number;
  genres: string[];
};

export type TimePeriod = "weekly" | "monthly" | "allTime";
export type LeaderboardTab = "fans" | "performers";

// ---------- Activity Feed types ----------

export type ActivityFeedAction = "discovered" | "collected" | "founded";

export type ActivityFeedItem = {
  id: string;
  fan_id: string;
  fan_name: string;
  fan_avatar: string | null;
  action: ActivityFeedAction;
  performer_id: string;
  performer_name: string;
  performer_slug: string;
  performer_image: string | null;
  performer_genres: string[] | null;
  venue_name: string | null;
  timestamp: string;
};
