import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export type UserSearchResult = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  stamp_count: number;
  is_following: boolean;
};

type UserSearchResponse = {
  users: UserSearchResult[];
};

export function useUserSearch(query: string) {
  return useQuery<UserSearchResult[]>({
    queryKey: ["userSearch", query],
    queryFn: async () => {
      const res = await apiCall<UserSearchResponse>(
        `/mobile/search-users?q=${encodeURIComponent(query)}&limit=10`
      );
      return res.users;
    },
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useFollow() {
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async (targetFanId: string) => {
      return apiCall("/mobile/follow", {
        method: "POST",
        body: JSON.stringify({ target_fan_id: targetFanId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSearch"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (targetFanId: string) => {
      return apiCall(`/mobile/follow?target_fan_id=${targetFanId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSearch"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
  });

  return { followMutation, unfollowMutation };
}

type SocialCountsResponse = {
  following_count: number;
  followers_count: number;
};

export function useSocialCounts(fanId?: string) {
  const user = useAuthStore((s) => s.user);
  const targetId = fanId ?? user?.id;

  return useQuery<SocialCountsResponse>({
    queryKey: ["socialCounts", targetId],
    queryFn: async () => {
      const params = fanId ? `?fan_id=${fanId}` : "";
      return apiCall<SocialCountsResponse>(`/mobile/social-counts${params}`);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!targetId,
  });
}
