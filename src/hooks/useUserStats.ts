import { useQuery } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";

type UserStatsResponse = {
  finds: number;
  founders: number;
  influence: number;
};

export function useUserStats() {
  const { data, isLoading } = useQuery<UserStatsResponse>({
    queryKey: ["user-stats"],
    queryFn: () => apiCall<UserStatsResponse>("/mobile/user-stats"),
    staleTime: 2 * 60 * 1000, // 2 minutes — stats feel fresh
    gcTime: 1000 * 60 * 60 * 24,
  });

  return {
    finds: data?.finds ?? 0,
    founders: data?.founders ?? 0,
    influence: data?.influence ?? 0,
    isLoading,
  };
}
