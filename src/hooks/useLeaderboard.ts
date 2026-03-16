import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { apiCall } from "@/lib/api";
import type { LeaderboardView, LeaderboardResponse, TimePeriod } from "@/types/index";

export function useLeaderboard({
  view,
  period,
}: {
  view: LeaderboardView;
  period: TimePeriod;
}) {
  const user = useAuthStore((s) => s.user);

  const query = useQuery<LeaderboardResponse>({
    queryKey: ["leaderboard", view, period],
    queryFn: async () => {
      return apiCall<LeaderboardResponse>(
        `/mobile/leaderboard?view=${view}&period=${period}`
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  const entries = query.data?.entries ?? [];
  const userPosition = query.data?.userPosition ?? null;
  const currentFanId = user?.id ?? null;

  return {
    entries,
    userPosition,
    currentFanId,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
