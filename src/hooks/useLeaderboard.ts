import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { apiCall } from "@/lib/api";
import { TIER_COLORS, type TierName } from "./useCollection";
import type {
  FanLeaderboardEntry,
  PerformerLeaderboardEntry,
  LeaderboardTab,
  TimePeriod,
} from "@/types/index";

// Tier thresholds (mirrors web)
const TIER_THRESHOLDS = [
  { min: 10, tier: "inner_circle" },
  { min: 5, tier: "secret" },
  { min: 3, tier: "early_access" },
  { min: 1, tier: "network" },
] as const;

function deriveTier(count: number): string {
  for (const t of TIER_THRESHOLDS) {
    if (count >= t.min) return t.tier;
  }
  return "network";
}

export function getTierColor(tier: string): string {
  return TIER_COLORS[tier as TierName] ?? "#8E8E9A";
}

export function getTierLabel(tier: string): string {
  switch (tier) {
    case "network":
      return "Network";
    case "early_access":
      return "Early Access";
    case "secret":
      return "Secret";
    case "inner_circle":
      return "Inner Circle";
    default:
      return tier;
  }
}

export function useLeaderboard({
  tab,
  period,
}: {
  tab: LeaderboardTab;
  period: TimePeriod;
}) {
  const user = useAuthStore((s) => s.user);

  const query = useQuery<
    (FanLeaderboardEntry | PerformerLeaderboardEntry)[]
  >({
    queryKey: ["leaderboard", tab, period],
    queryFn: async () => {
      const data = await apiCall<{
        entries: (FanLeaderboardEntry | PerformerLeaderboardEntry)[];
      }>(`/mobile/leaderboard?tab=${tab}&period=${period}`);
      return data.entries;
    },
    staleTime: 5 * 60 * 1000,
  });

  const currentFanId = user?.id ?? null;

  return { ...query, currentFanId };
}
