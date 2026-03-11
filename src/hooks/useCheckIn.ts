import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";
import type { StampData } from "@/types";

// ---------- Types ----------

export type CheckInResult = {
  already_checked_in: boolean;
  stamps: StampData[];
};

export type CheckInInput = {
  venue_id: string;
  performer_ids: string[];
  local_date: string; // YYYY-MM-DD — client-provided to avoid UTC midnight bug
};

// ---------- Helper ----------

/**
 * Returns today's date in YYYY-MM-DD format using the device's local timezone.
 * This prevents the UTC midnight bug for late-night shows.
 */
export function getLocalDate(): string {
  return new Date().toLocaleDateString('en-CA');
}

// ---------- Hook ----------

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation<CheckInResult, Error, CheckInInput>({
    mutationFn: async ({ venue_id, performer_ids, local_date }) => {
      return apiCall<CheckInResult>("/mobile/check-in", {
        method: "POST",
        body: JSON.stringify({ venue_id, performer_ids, local_date }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passportCollections"] });
      queryClient.invalidateQueries({ queryKey: ["myCollectedIds"] });
      queryClient.invalidateQueries({ queryKey: ["passport"] });
    },
  });
}
