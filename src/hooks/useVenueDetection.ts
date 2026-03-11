import { useEffect } from "react";
import { AppState } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useLocation } from "./useLocation";
import type { ActiveVenueEvent, Venue, Performer } from "@/types";

const DEFAULT_GEOFENCE_RADIUS = 200; // meters

/**
 * Haversine distance between two lat/lng points in meters.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Get today's date in YYYY-MM-DD using LOCAL timezone (not UTC).
 * This prevents the UTC midnight bug where a 1am show lands on the wrong day.
 */
function todayDate(): string {
  return new Date().toLocaleDateString('en-CA');
}

type VenueDetectionOptions = {
  enabled?: boolean;
};

export function useVenueDetection({ enabled = true }: VenueDetectionOptions = {}) {
  const { hasPermission, getCurrentPosition } = useLocation();

  const queryEnabled = hasPermission && enabled;

  const {
    data: nearbyEvents = [],
    isLoading: isChecking,
    refetch,
  } = useQuery<ActiveVenueEvent[]>({
    queryKey: ["venueDetection"],
    queryFn: async (): Promise<ActiveVenueEvent[]> => {
      const position = await getCurrentPosition();
      if (!position) return [];

      const { latitude, longitude } = position;

      // Fetch all venues (small Chicago-only set) — use correct DB column names
      const { data: venues, error: venueError } = await supabase
        .from("venues")
        .select("id, name, slug, address, city, latitude, longitude, geofence_radius_meters");

      if (venueError || !venues) return [];

      // Filter to venues within geofence radius
      const nearbyVenues: (Venue & { distance: number })[] = [];
      for (const v of venues) {
        if (v.latitude == null || v.longitude == null) continue;
        const dist = haversineDistance(latitude, longitude, v.latitude, v.longitude);
        const radius = v.geofence_radius_meters ?? DEFAULT_GEOFENCE_RADIUS;
        if (dist <= radius) {
          nearbyVenues.push({ ...v, distance: dist } as Venue & { distance: number });
        }
      }

      if (nearbyVenues.length === 0) return [];

      const today = todayDate();

      // For each nearby venue, check for active events today
      const results: ActiveVenueEvent[] = [];

      for (const venue of nearbyVenues) {
        const { data: events, error: eventError } = await supabase
          .from("events")
          .select(
            "id, event_date, performer_id, performers(id, name, slug, photo_url)"
          )
          .eq("venue_id", venue.id)
          .eq("event_date", today);

        if (eventError || !events || events.length === 0) {
          // No scraped events — check user_tagged_events for crowdsourced performers
          const { data: tagged } = await supabase
            .from("user_tagged_events")
            .select("performer_id, performers(id, name, slug, photo_url)")
            .eq("venue_id", venue.id)
            .eq("event_date", today);

          if (tagged && tagged.length > 0) {
            const taggedPerformers: Pick<Performer, "id" | "name" | "slug" | "photo_url">[] = [];
            for (const row of tagged) {
              const p = row.performers as unknown as Pick<
                Performer,
                "id" | "name" | "slug" | "photo_url"
              > | null;
              if (p && !taggedPerformers.some((existing) => existing.id === p.id)) {
                taggedPerformers.push(p);
              }
            }
            if (taggedPerformers.length > 0) {
              results.push({
                venue,
                performers: taggedPerformers,
                eventId: `crowdsourced-${venue.id}-${today}`,
                eventDate: today,
                distance: venue.distance,
              });
            }
          }
          continue;
        }

        // Group performers from all events at this venue
        const performers: Pick<Performer, "id" | "name" | "slug" | "photo_url">[] = [];
        const eventIds: string[] = [];

        for (const event of events) {
          eventIds.push(event.id);
          // performers comes back as a single object (FK relation) or null
          const p = event.performers as unknown as Pick<
            Performer,
            "id" | "name" | "slug" | "photo_url"
          > | null;
          if (p) {
            // Avoid duplicates
            if (!performers.some((existing) => existing.id === p.id)) {
              performers.push(p);
            }
          }
        }

        if (performers.length > 0) {
          results.push({
            venue,
            performers,
            eventId: eventIds[0], // primary event ID
            eventDate: today,
            distance: venue.distance,
          });
        }
      }

      return results;
    },
    enabled: queryEnabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Re-check venue proximity when app returns to foreground
  useEffect(() => {
    if (!queryEnabled) return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        refetch();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [queryEnabled, refetch]);

  return {
    nearbyEvents,
    isChecking,
    refetch,
  };
}

export type { ActiveVenueEvent };
