import { useInfiniteQuery } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";
import type { ActivityFeedItem } from "@/types";

const PAGE_SIZE = 20;

type ActivityFeedResponse = {
  items: ActivityFeedItem[];
  has_more: boolean;
  is_fallback: boolean;
};

export function useActivityFeed() {
  const query = useInfiniteQuery<ActivityFeedResponse>({
    queryKey: ["activity-feed"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      return apiCall<ActivityFeedResponse>(
        `/mobile/activity-feed?page=${pageParam as number}&limit=${PAGE_SIZE}`
      );
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.has_more) return undefined;
      return allPages.length;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes — social feed should feel fresh
    gcTime: 1000 * 60 * 60 * 24,
  });

  const isFallback = query.data?.pages[0]?.is_fallback ?? false;

  return { ...query, isFallback };
}
