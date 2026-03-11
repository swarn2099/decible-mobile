import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";
import type { StampData } from "@/types";

// ---------- Types ----------

export type TagPerformerResult = {
  stamp: StampData;
  crowdsourced_lineup_count: number;
};

export type TagPerformerInput = {
  venue_id: string;
  performer_id: string;
  local_date: string; // YYYY-MM-DD — client-provided to avoid UTC midnight bug
};

// ---------- Hook ----------

export function useTagPerformer() {
  const queryClient = useQueryClient();

  return useMutation<TagPerformerResult, Error, TagPerformerInput>({
    mutationFn: async ({ venue_id, performer_id, local_date }) => {
      return apiCall<TagPerformerResult>("/mobile/tag-performer", {
        method: "POST",
        body: JSON.stringify({ venue_id, performer_id, local_date }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passportCollections"] });
      queryClient.invalidateQueries({ queryKey: ["myCollectedIds"] });
      queryClient.invalidateQueries({ queryKey: ["passport"] });
    },
  });
}
