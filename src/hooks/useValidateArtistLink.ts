import { useMutation } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";

// ---------- Types ----------

export type ValidateArtistLinkResult = {
  eligible: boolean;
  rejection_reason?: "over_threshold" | "unsupported_platform";
  artist?: {
    name: string;
    photo_url: string | null;
    platform: "spotify" | "soundcloud" | "apple_music";
    spotify_id?: string;
    soundcloud_username?: string;
    apple_music_url?: string;
    monthly_listeners?: number | null;
    follower_count?: number;
    genres: string[];
  };
  existing_performer?: {
    id: string;
    name: string;
    slug: string;
    photo_url: string | null;
    user_relationship: "founded" | "collected" | "discovered" | "none";
    founder_name: string | null;
  };
};

// ---------- Hook ----------

export function useValidateArtistLink() {
  return useMutation<ValidateArtistLinkResult, Error, { url: string }>({
    mutationFn: async ({ url }) => {
      return apiCall<ValidateArtistLinkResult>("/mobile/validate-artist-link", {
        method: "POST",
        body: JSON.stringify({ url }),
      });
    },
  });
}
