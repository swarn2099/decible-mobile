import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { apiCall } from "@/lib/api";

// ---------- Types ----------

export type DecibelSearchResult = {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  genres: string[] | null;
  follower_count: number | null;
};

export type SpotifyArtistResult = {
  id: string;
  name: string;
  photo_url: string | null;
  spotify_url: string;
  genres: string[];
  followers: number;
  monthly_listeners?: number;
};

type SpotifySearchResponse = {
  existing: DecibelSearchResult[];
  results: SpotifyArtistResult[];
  spotify_error?: string;
};

// ---------- Hooks ----------

/**
 * Search Decibel's performer database with ILIKE autocomplete.
 * Debouncing is NOT handled here — pass a pre-debounced query.
 */
export function useDecibelSearch(query: string) {
  return useQuery<DecibelSearchResult[]>({
    queryKey: ["decibelSearch", query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performers")
        .select("id, name, slug, photo_url, genres, follower_count")
        .ilike("name", `%${query}%`)
        .limit(10);

      if (error) throw error;
      return (data || []) as DecibelSearchResult[];
    },
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Search Spotify for artists not yet in Decibel via web API.
 * Debouncing is NOT handled here — pass a pre-debounced query.
 */
export function useSpotifySearch(query: string, enabled: boolean) {
  return useQuery<SpotifySearchResponse>({
    queryKey: ["spotifySearch", query],
    queryFn: async () => {
      return apiCall<SpotifySearchResponse>(
        `/spotify/search?q=${encodeURIComponent(query)}`
      );
    },
    enabled: enabled && query.length >= 2,
    staleTime: 60 * 1000, // 60 seconds
  });
}
