import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { apiCall } from "@/lib/api";

// ---------- Types ----------

export type AddArtistResult = {
  already_exists: boolean;
  performer: { id: string; name: string; slug: string };
  is_founder: boolean;
  founder_name: string | null;
};

export type AddArtistInput = {
  spotifyId?: string;           // Spotify artists
  soundcloudUsername?: string;  // SoundCloud artists
  appleMusicUrl?: string;       // Apple Music artists
  platform: "spotify" | "soundcloud" | "apple_music";
  name: string;
  photoUrl: string | null;
  genres: string[];
  followers: number;
  monthlyListeners?: number;
};

// ---------- Hook ----------

export function useAddArtist() {
  const queryClient = useQueryClient();

  return useMutation<AddArtistResult, Error, AddArtistInput>({
    mutationFn: async (input) => {
      return apiCall<AddArtistResult>("/mobile/add-artist", {
        method: "POST",
        body: JSON.stringify({
          spotifyId: input.spotifyId || "",
          soundcloudUsername: input.soundcloudUsername || "",
          appleMusicUrl: input.appleMusicUrl || "",
          platform: input.platform,
          name: input.name,
          photoUrl: input.photoUrl,
          genres: input.genres,
          followers: input.followers,
          monthlyListeners: input.monthlyListeners,
        }),
      });
    },
    onSuccess: (result) => {
      if (result.is_founder) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      queryClient.invalidateQueries({ queryKey: ["passport"] });
      queryClient.invalidateQueries({ queryKey: ["fanBadges"] });
    },
  });
}
