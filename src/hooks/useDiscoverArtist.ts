import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { apiCall } from "@/lib/api";

// ---------- Types ----------

type DiscoverInput = { performerId: string };
type DiscoverResult = {
  success: boolean;
  performer: { id: string; name: string; slug: string };
};

// ---------- Hook ----------

export function useDiscoverArtist() {
  const queryClient = useQueryClient();

  return useMutation<DiscoverResult, Error, DiscoverInput>({
    mutationFn: async ({ performerId }) => {
      return apiCall<DiscoverResult>("/mobile/discover", {
        method: "POST",
        body: JSON.stringify({ performerId }),
      });
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      queryClient.invalidateQueries({ queryKey: ["passport"] });
      queryClient.invalidateQueries({ queryKey: ["fanBadges"] });
    },
  });
}
