import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { apiCall } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type {
  PassportStats,
  PassportTimelineEntry,
  CollectionStamp,
} from "@/types/passport";
import { calculateTier, type TierName } from "./useCollection";

const PAGE_SIZE = 20;

// ---------- Types for API response ----------

type PassportApiResponse = {
  fan: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    city: string | null;
    created_at: string;
  };
  collections: CollectionStamp[];
  stats: PassportStats | null;
  hasMore: boolean;
};

// ---------- Hooks ----------

export function usePassportStats() {
  const user = useAuthStore((s) => s.user);

  return useQuery<PassportStats>({
    queryKey: ["passportStats", user?.email],
    queryFn: async () => {
      if (!user?.email) throw new Error("Not authenticated");

      const data = await apiCall<PassportApiResponse>(
        "/mobile/passport?page=0"
      );

      return (
        data.stats ?? {
          totalArtists: 0,
          totalDiscovered: 0,
          totalShows: 0,
          uniqueVenues: 0,
          uniqueCities: 0,
          favoriteGenre: null,
          mostCollectedArtist: null,
          mostVisitedVenue: null,
          currentStreak: 0,
          memberSince: new Date().toISOString(),
        }
      );
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!user?.email,
  });
}

export function usePassportCollections() {
  const user = useAuthStore((s) => s.user);

  return useInfiniteQuery<CollectionStamp[]>({
    queryKey: ["passportCollections", user?.email],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!user?.email) throw new Error("Not authenticated");

      const data = await apiCall<PassportApiResponse>(
        `/mobile/passport?page=${pageParam as number}`
      );

      // Dedup by performer_id — keep highest prestige (founded > collected > discovered)
      // and earliest created_at for same prestige level
      const seen = new Map<string, CollectionStamp>();
      for (const stamp of data.collections) {
        const key = stamp.performer.id;
        const existing = seen.get(key);
        if (!existing) {
          seen.set(key, stamp);
          continue;
        }
        // Prestige: founded > verified > discovered
        const prestigeOf = (s: CollectionStamp) =>
          s.is_founder ? 3 : s.verified ? 2 : 1;
        if (
          prestigeOf(stamp) > prestigeOf(existing) ||
          (prestigeOf(stamp) === prestigeOf(existing) &&
            new Date(stamp.created_at) < new Date(existing.created_at))
        ) {
          seen.set(key, stamp);
        }
      }
      return Array.from(seen.values());
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!user?.email,
  });
}

export type TierProgress = {
  scanCount: number;
  currentTier: TierName;
  nextTier: TierName | null;
  scansNeeded: number;
};

const TIER_THRESHOLDS: { tier: TierName; scans: number }[] = [
  { tier: "network", scans: 1 },
  { tier: "early_access", scans: 3 },
  { tier: "secret", scans: 5 },
  { tier: "inner_circle", scans: 10 },
];

// Helper: get fan ID via API (for hooks that still need direct Supabase for writes)
async function getFanId(email: string): Promise<string | null> {
  try {
    const data = await apiCall<PassportApiResponse>(
      "/mobile/passport?page=0"
    );
    return data.fan.id;
  } catch {
    return null;
  }
}

export { getFanId };

export function useArtistTierProgress(performerId: string | undefined) {
  const user = useAuthStore((s) => s.user);

  return useQuery<TierProgress | null>({
    queryKey: ["tierProgress", user?.email, performerId],
    queryFn: async () => {
      if (!user?.email || !performerId) return null;

      const fanId = await getFanId(user.email);
      if (!fanId) return null;

      // fan_tiers has an RLS policy allowing reads for performers,
      // but we need the API for fan reads. Use the collect API pattern.
      // For now, get tier from the passport collections data
      const data = await apiCall<PassportApiResponse>(
        "/mobile/passport?page=0"
      );

      const stamp = data.collections.find(
        (c) => c.performer.id === performerId
      );
      if (!stamp || !stamp.scan_count) return null;

      const scanCount = stamp.scan_count;
      const currentTier = calculateTier(scanCount);
      const currentIndex = TIER_THRESHOLDS.findIndex(
        (t) => t.tier === currentTier
      );
      const nextThreshold = TIER_THRESHOLDS[currentIndex + 1] ?? null;

      return {
        scanCount,
        currentTier,
        nextTier: nextThreshold?.tier ?? null,
        scansNeeded: nextThreshold ? nextThreshold.scans - scanCount : 0,
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.email && !!performerId,
  });
}
