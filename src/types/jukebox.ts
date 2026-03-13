export type JukeboxItem = {
  id: string; // collection.id
  fan_id: string;
  fan_name: string;
  fan_avatar: string | null;
  created_at: string;
  performer_id: string;
  performer_name: string;
  performer_slug: string;
  performer_photo: string | null;
  genres: string[] | null;
  platform: "spotify" | "soundcloud" | "apple_music" | null;
  embed_url: string | null;
  spotify_url: string | null;
  soundcloud_url: string | null;
  apple_music_url: string | null;
};

export type JukeboxResponse = {
  items: JukeboxItem[];
  hasNextPage: boolean;
  isFallback: boolean;
};
