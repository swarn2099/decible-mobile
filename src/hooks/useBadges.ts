import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { BADGE_DEFINITIONS } from "@/constants/badges";
import type { BadgeWithStatus } from "@/types/badges";
import { apiCall } from "@/lib/api";

type BadgesResponse = {
  earned: { badge_id: string; earned_at: string }[];
  totalFans: number;
  holderCounts: Record<string, number>;
};

/**
 * Fetch fan's earned badges via web API and merge with all definitions.
 * Returns sorted array: earned first (most recent), then locked (alphabetically).
 */
export function useFanBadges() {
  const user = useAuthStore((s) => s.user);
  const email = user?.email ?? null;

  return useQuery<BadgeWithStatus[]>({
    queryKey: ["fanBadges", email],
    enabled: !!email,
    staleTime: 10 * 60 * 1000,

    queryFn: async () => {
      if (!email) return [];

      const data = await apiCall<BadgesResponse>("/mobile/badges");

      const earnedMap = new Map<string, string>();
      for (const row of data.earned) {
        earnedMap.set(row.badge_id, row.earned_at);
      }

      const allBadges: BadgeWithStatus[] = Object.values(BADGE_DEFINITIONS).map(
        (def) => {
          const earnedAt = earnedMap.get(def.id) ?? null;
          const holders = data.holderCounts[def.id] ?? 0;
          const rarityPercent =
            data.totalFans > 0
              ? Math.round((holders / data.totalFans) * 100)
              : null;

          return {
            ...def,
            earned: !!earnedAt,
            earned_at: earnedAt,
            rarity_percent: rarityPercent,
          };
        }
      );

      allBadges.sort((a, b) => {
        if (a.earned && !b.earned) return -1;
        if (!a.earned && b.earned) return 1;
        if (a.earned && b.earned) {
          return (
            new Date(b.earned_at!).getTime() -
            new Date(a.earned_at!).getTime()
          );
        }
        return a.name.localeCompare(b.name);
      });

      return allBadges;
    },
  });
}
