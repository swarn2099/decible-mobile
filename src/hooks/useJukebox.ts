import { useInfiniteQuery } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";
import type { JukeboxItem, JukeboxResponse } from "@/types/jukebox";

export type { JukeboxItem, JukeboxResponse };

export function useJukebox() {
  const query = useInfiniteQuery<JukeboxResponse>({
    queryKey: ["jukebox"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      return apiCall<JukeboxResponse>(`/mobile/jukebox?page=${pageParam as number}`);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasNextPage) return undefined;
      return allPages.length;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — Finds don't change rapidly
    gcTime: 1000 * 60 * 60 * 24,
  });

  // Flatten all pages into a single items array
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  // isFallback from first page (true means no followed-user Finds in last 48h)
  const isFallback = query.data?.pages[0]?.isFallback ?? false;

  return {
    ...query,
    items,
    isFallback,
  };
}
