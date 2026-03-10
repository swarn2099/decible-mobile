import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import * as Haptics from "expo-haptics";

// ---------- Tier system ----------

export type TierName = "network" | "early_access" | "secret" | "inner_circle";

export const TIER_COLORS: Record<TierName, string> = {
  network: "#FF4D6A",
  early_access: "#9B6DFF",
  secret: "#4D9AFF",
  inner_circle: "#00D4AA",
};

export const TIER_LABELS: Record<TierName, string> = {
  network: "Network",
  early_access: "Early Access",
  secret: "Secret",
  inner_circle: "Inner Circle",
};

export function calculateTier(scanCount: number): TierName {
  if (scanCount >= 10) return "inner_circle";
  if (scanCount >= 5) return "secret";
  if (scanCount >= 3) return "early_access";
  return "network";
}

// ---------- Collect mutation ----------

export type CollectResult = {
  scan_count: number;
  current_tier: TierName;
  already_collected: boolean;
  tierUp: boolean;
};

export function useCollect() {
  const queryClient = useQueryClient();

  return useMutation<CollectResult, Error, { performerId: string; capture_method?: string }>({
    mutationFn: async ({ performerId, capture_method }) => {
      // Get user email from Supabase auth
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user?.email) {
        throw new Error("Not authenticated — please sign in first");
      }

      const res = await fetch(
        "https://decibel-three.vercel.app/api/collect",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ performer_id: performerId, email: user.email, capture_method }),
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        throw new Error(`Collect failed: ${text}`);
      }

      const data = await res.json();
      const scanCount: number = data.scan_count ?? 1;
      const currentTier = calculateTier(scanCount);
      const previousTier = calculateTier(Math.max(scanCount - 1, 0));
      const tierUp = currentTier !== previousTier;

      return {
        scan_count: scanCount,
        current_tier: currentTier,
        already_collected: data.already_collected ?? false,
        tierUp,
      };
    },
    onSuccess: (result, { performerId }) => {
      // Haptic feedback
      if (result.tierUp) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      // Invalidate fan count for this artist
      queryClient.invalidateQueries({ queryKey: ["artistFanCount", performerId] });
      // Invalidate collected IDs so banner/sheet filter updates immediately
      queryClient.invalidateQueries({ queryKey: ["myCollectedIds"] });
    },
  });
}

// ---------- Discover mutation ----------

export type DiscoverResult = {
  success: boolean;
  already_discovered: boolean;
  is_founder: boolean;
};

export function useDiscover() {
  const queryClient = useQueryClient();

  return useMutation<DiscoverResult, Error, { performerId: string }>({
    mutationFn: async ({ performerId }) => {
      // Get user email from Supabase auth
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user?.email) {
        throw new Error("Not authenticated — please sign in first");
      }

      // Use web API like collect does (bypasses RLS)
      const res = await fetch(
        "https://decibel-three.vercel.app/api/discover",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            performer_id: performerId,
            email: user.email,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        throw new Error(`Discover failed: ${text}`);
      }

      const data = await res.json();
      return {
        success: true,
        already_discovered: data.already_discovered ?? false,
        is_founder: data.is_founder ?? false,
      };
    },
    onSuccess: (_result, { performerId }) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      queryClient.invalidateQueries({ queryKey: ["artistFanCount", performerId] });
      queryClient.invalidateQueries({ queryKey: ["myCollectedIds"] });
      queryClient.invalidateQueries({ queryKey: ["myArtistStatus", performerId] });
      queryClient.invalidateQueries({ queryKey: ["passportCollections"] });
    },
  });
}
