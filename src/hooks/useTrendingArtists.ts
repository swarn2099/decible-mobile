import { useQuery } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";

export type TrendingArtist = {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  collector_count: number;
};

type TrendingArtistsResponse = {
  artists: TrendingArtist[];
};

export function useTrendingArtists() {
  const { data, isLoading } = useQuery<TrendingArtistsResponse>({
    queryKey: ["trending-artists"],
    queryFn: () => apiCall<TrendingArtistsResponse>("/mobile/trending-artists"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 1000 * 60 * 60 * 24,
  });

  return {
    artists: data?.artists ?? [],
    isLoading,
  };
}
