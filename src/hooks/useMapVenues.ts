import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MapVenue, MapEvent } from "@/types";

type MapFilters = {
  genre?: string | null;
  tonight?: boolean;
};

function todayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function useMapVenues(filters: MapFilters = {}) {
  const { genre, tonight } = filters;

  const query = useQuery<MapVenue[]>({
    queryKey: ["mapVenues", genre ?? "all", tonight ?? false],
    queryFn: async () => {
      const today = todayDateString();

      let q = supabase
        .from("venues")
        .select(
          "id, name, slug, address, latitude, longitude, events(id, event_date, start_time, external_url, performer:performers(name, slug, photo_url, genres))"
        );

      if (tonight) {
        q = q.eq("events.event_date", today);
      } else {
        q = q.gte("events.event_date", today);
      }

      const { data, error } = await q;

      if (error) throw error;
      if (!data) return [];

      // Transform raw rows into MapVenue[]
      const venues: MapVenue[] = [];

      for (const row of data as any[]) {
        if (row.latitude == null || row.longitude == null) continue;

        const events: MapEvent[] = [];
        const genreSet = new Set<string>();

        const rawEvents = Array.isArray(row.events) ? row.events : [];
        for (const ev of rawEvents) {
          const performer = ev.performer;
          if (performer) {
            events.push({
              id: ev.id,
              event_date: ev.event_date,
              start_time: ev.start_time,
              performer_name: performer.name,
              performer_slug: performer.slug,
              performer_photo: performer.photo_url,
            });
            if (Array.isArray(performer.genres)) {
              performer.genres.forEach((g: string) => genreSet.add(g.toLowerCase()));
            }
          }
        }

        if (events.length === 0) continue;

        const venueGenres = Array.from(genreSet);

        // Client-side genre filter
        if (genre && !venueGenres.some((g) => g.includes(genre.toLowerCase()))) {
          continue;
        }

        venues.push({
          id: row.id,
          name: row.name,
          slug: row.slug,
          address: row.address,
          latitude: row.latitude,
          longitude: row.longitude,
          event_count: events.length,
          genres: venueGenres,
          upcoming_events: events,
        });
      }

      return venues;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    venues: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    error: query.error,
  };
}
