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

type AddArtistInput = {
  spotifyId: string;
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
    mutationFn: async ({
      spotifyId,
      name,
      photoUrl,
      genres,
      followers,
      monthlyListeners,
    }) => {
      return apiCall<AddArtistResult>("/mobile/add-artist", {
        method: "POST",
        body: JSON.stringify({
          spotifyId,
          name,
          photoUrl,
          genres,
          followers,
          monthlyListeners,
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
