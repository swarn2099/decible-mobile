import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

/**
 * Returns a Set of performer IDs the current user has collected.
 * Uses a direct lightweight Supabase query (just IDs) rather than
 * deriving from passport cache which may be cold on first search.
 */
export function useMyCollectedIds() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["myCollectedIds", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fan_artist_collections")
        .select("performer_id")
        .eq("fan_id", userId!);

      if (error) throw error;
      return (data ?? []).map((row) => row.performer_id as string);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    collectedIds: new Set<string>(data ?? []),
    isLoading,
  };
}
