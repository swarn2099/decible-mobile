import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { apiCall } from "@/lib/api";

// ---------- Local types (Plan 02 owns these) ----------

export type ArtistProfile = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  photo_url: string | null;
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
  is_chicago_resident: boolean;
  created_at: string;
};

export type ArtistEvent = {
  id: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  external_url: string | null;
  venue: {
    name: string;
    slug: string;
    address: string | null;
  } | null;
};

export type FounderInfo = {
  name: string | null;
  avatar_url: string | null;
  awarded_at: string;
};

export type SimilarArtist = {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  genres: string[] | null;
};

// ---------- Hooks ----------

export function useArtistProfile(slug: string) {
  return useQuery<ArtistProfile | null>({
    queryKey: ["artist", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performers")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // not found
        throw error;
      }
      return data as ArtistProfile;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 1000 * 60 * 60 * 4, // 4 hours -- offline cache
    enabled: !!slug,
  });
}

export function useArtistEvents(performerId: string | undefined) {
  return useQuery<ArtistEvent[]>({
    queryKey: ["artistEvents", performerId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("events")
        .select(
          "id, event_date, start_time, end_time, external_url, venue:venues(name, slug, address)"
        )
        .eq("performer_id", performerId!)
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(6);

      if (error) throw error;

      // Unwrap Supabase join arrays to single objects
      return (data ?? []).map((event: Record<string, unknown>) => ({
        ...event,
        venue: Array.isArray(event.venue) ? event.venue[0] ?? null : event.venue ?? null,
      })) as ArtistEvent[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!performerId,
  });
}

type ArtistStatsResponse = {
  fanCount: number;
  founder: FounderInfo | null;
  userStatus: "founded" | "collected" | "discovered" | "none";
};

export function useArtistFanCount(performerId: string | undefined) {
  return useQuery<number>({
    queryKey: ["artistFanCount", performerId],
    queryFn: async () => {
      const data = await apiCall<ArtistStatsResponse>(
        `/mobile/artist-stats?performerId=${performerId}`
      );
      return data.fanCount;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!performerId,
  });
}

export function useArtistFounder(performerId: string | undefined) {
  return useQuery<FounderInfo | null>({
    queryKey: ["artistFounder", performerId],
    queryFn: async () => {
      const data = await apiCall<ArtistStatsResponse>(
        `/mobile/artist-stats?performerId=${performerId}`
      );
      return data.founder;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!performerId,
  });
}

export function useMyArtistStatus(performerId: string | undefined) {
  return useQuery<"founded" | "collected" | "discovered" | "none">({
    queryKey: ["myArtistStatus", performerId],
    queryFn: async () => {
      const data = await apiCall<ArtistStatsResponse>(
        `/mobile/artist-stats?performerId=${performerId}`
      );
      return data.userStatus ?? "none";
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!performerId,
  });
}

export type ArtistFan = {
  id: string;
  name: string;
  avatar_url: string | null;
  type: "founded" | "collected" | "discovered";
  date: string; // ISO date string — when the fan found/collected/discovered
};

export function useArtistFans(performerId: string | undefined) {
  return useQuery<ArtistFan[]>({
    queryKey: ["artistFans", performerId],
    queryFn: async () => {
      const fans: ArtistFan[] = [];
      const seen = new Set<string>();

      // 1. Check founder
      const { data: founderData } = await supabase
        .from("founder_badges")
        .select("created_at, fans!inner(id, name, avatar_url)")
        .eq("performer_id", performerId!);
      for (const row of founderData ?? []) {
        const fan = Array.isArray(row.fans) ? row.fans[0] : row.fans;
        if (fan?.id && !seen.has(fan.id)) {
          seen.add(fan.id);
          fans.push({ ...fan, type: "founded", date: row.created_at ?? "" });
        }
      }

      // 2. Collections (verified = collected, unverified = discovered)
      const { data: collectionData, error } = await supabase
        .from("collections")
        .select("verified, created_at, fans!inner(id, name, avatar_url)")
        .eq("performer_id", performerId!);
      if (error) throw error;

      for (const row of collectionData ?? []) {
        const fan = Array.isArray(row.fans) ? row.fans[0] : row.fans;
        if (!fan?.id || seen.has(fan.id)) continue;
        seen.add(fan.id);
        fans.push({
          ...fan,
          type: row.verified ? "collected" : "discovered",
          date: row.created_at ?? "",
        });
      }

      // Sort: founded first, then collected, then discovered
      const order = { founded: 0, collected: 1, discovered: 2 };
      fans.sort((a, b) => order[a.type] - order[b.type]);

      return fans;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!performerId,
  });
}

export function useSimilarArtists(
  performerId: string | undefined,
  genres: string[] | null
) {
  return useQuery<SimilarArtist[]>({
    queryKey: ["similarArtists", performerId, genres],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performers")
        .select("id, name, slug, photo_url, genres")
        .overlaps("genres", genres!)
        .neq("id", performerId!)
        .order("follower_count", { ascending: false, nullsFirst: false })
        .limit(8);

      if (error) throw error;
      return (data ?? []) as SimilarArtist[];
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!performerId && !!genres?.length,
  });
}
