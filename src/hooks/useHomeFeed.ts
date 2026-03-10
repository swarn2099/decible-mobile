import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { HomeFeedEvent, Performer } from "@/types";

// ---------- Weekend Range Logic (ported from web app) ----------

function getUpcomingWeekendRange(): {
  start: string;
  end: string;
  label: string;
  sectionTitle: string;
} {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const monthDay = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const today = fmt(now);

  if (day === 5) {
    // Friday -- show Fri + Sat
    const sat = new Date(now);
    sat.setDate(now.getDate() + 1);
    return {
      start: today,
      end: fmt(sat),
      label: `${monthDay(now)} – ${monthDay(sat)}`,
      sectionTitle: "This Weekend",
    };
  }
  if (day === 6) {
    // Saturday -- show today only
    return {
      start: today,
      end: today,
      label: monthDay(now),
      sectionTitle: "Tonight",
    };
  }
  if (day === 0) {
    // Sunday -- show next Fri + Sat
    const fri = new Date(now);
    fri.setDate(now.getDate() + 5);
    const sat = new Date(fri);
    sat.setDate(fri.getDate() + 1);
    return {
      start: fmt(fri),
      end: fmt(sat),
      label: `${monthDay(fri)} – ${monthDay(sat)}`,
      sectionTitle: "Next Weekend",
    };
  }
  // Mon-Thu -- show upcoming Fri + Sat
  const daysToFri = 5 - day;
  const fri = new Date(now);
  fri.setDate(now.getDate() + daysToFri);
  const sat = new Date(fri);
  sat.setDate(fri.getDate() + 1);
  return {
    start: fmt(fri),
    end: fmt(sat),
    label: `${monthDay(fri)} – ${monthDay(sat)}`,
    sectionTitle: "This Weekend",
  };
}

// ---------- Hooks ----------

export function useUpcomingEvents() {
  const { start, end, sectionTitle } = getUpcomingWeekendRange();

  const query = useQuery<HomeFeedEvent[]>({
    queryKey: ["upcoming-events", start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(
          "id, event_date, start_time, external_url, performer:performers(name, slug, photo_url), venue:venues(name)"
        )
        .gte("event_date", start)
        .lte("event_date", end)
        .order("event_date", { ascending: true })
        .limit(20);

      if (error) throw error;

      // Supabase joins return arrays -- unwrap to single objects
      return (data || []).map((e: Record<string, unknown>) => ({
        ...e,
        performer: Array.isArray(e.performer)
          ? e.performer[0] ?? null
          : e.performer,
        venue: Array.isArray(e.venue) ? e.venue[0] ?? null : e.venue,
      })) as HomeFeedEvent[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { ...query, sectionTitle };
}

export function useChicagoResidents() {
  return useQuery<Pick<Performer, "name" | "slug" | "photo_url" | "genres">[]>({
    queryKey: ["chicago-residents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performers")
        .select("name, slug, photo_url, genres")
        .eq("is_chicago_resident", true)
        .order("follower_count", { ascending: false, nullsFirst: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useRecentlyAdded() {
  return useQuery<
    Pick<Performer, "name" | "slug" | "photo_url" | "genres" | "city">[]
  >({
    queryKey: ["recently-added"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performers")
        .select("name, slug, photo_url, genres, city")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
