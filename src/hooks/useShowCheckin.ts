import { useCallback, useEffect, useRef, useState } from "react";
import { apiCall } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { getLocalDate } from "@/hooks/useCheckIn";
import type {
  ShowCheckinState,
  ShowSearchResult,
  Venue,
  EnrichedPerformer,
} from "@/types";

// ---------- API response types ----------

type ShowCheckinFoundResponse = {
  status: "found";
  venue: Venue;
  performers: EnrichedPerformer[];
};

type ShowCheckinSearchingResponse = {
  status: "searching";
  search_id: string;
};

type ShowCheckinResponse =
  | ShowCheckinFoundResponse
  | ShowCheckinSearchingResponse;

// ---------- Constants ----------

const TIMEOUT_MS = 15_000; // 15 seconds
const POLL_INTERVAL_MS = 3_000; // 3 second polling fallback
const ELAPSED_INTERVAL_MS = 1_000; // 1 second elapsed timer

// ---------- Hook ----------

export function useShowCheckin() {
  const [state, setState] = useState<ShowCheckinState>({ phase: "idle" });

  // Refs to hold interval/timeout IDs — avoids stale closure issues
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ---------- Cleanup ----------

  const cleanup = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // ---------- Polling fallback (iOS background disconnect) ----------

  const startPolling = useCallback((searchId: string) => {
    // Don't start duplicate pollers
    if (pollRef.current) return;

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await supabase
          .from("search_results")
          .select("*")
          .eq("search_id", searchId)
          .maybeSingle();

        if (data) {
          setState({ phase: "result", result: data as ShowSearchResult });
          cleanup();
        }
      } catch {
        // Ignore poll errors — will retry next interval
      }
    }, POLL_INTERVAL_MS);
  }, [cleanup]);

  // ---------- Start check-in ----------

  const startCheckin = useCallback(
    async (lat: number, lng: number) => {
      cleanup(); // Clear any leftover state from previous runs
      setState({ phase: "scanning" });

      let response: ShowCheckinResponse;
      try {
        response = await apiCall<ShowCheckinResponse>("/mobile/show-checkin", {
          method: "POST",
          body: JSON.stringify({ lat, lng, local_date: getLocalDate() }),
        });
      } catch (err) {
        setState({
          phase: "error",
          message: err instanceof Error ? err.message : "Check-in failed",
        });
        return;
      }

      // Layer 1 hit — DB found a lineup immediately
      if (response.status === "found") {
        setState({
          phase: "layer1_hit",
          venue: response.venue,
          performers: response.performers,
        });
        return;
      }

      // Layer 1 miss — VM scraper is running
      const { search_id: searchId } = response;

      // Initialize waiting state (elapsed = 0)
      setState({ phase: "waiting", searchId, elapsed: 0 });

      // Start elapsed counter (updates state.elapsed every second)
      elapsedTimerRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.phase !== "waiting") return prev;
          return { ...prev, elapsed: prev.elapsed + 1 };
        });
      }, ELAPSED_INTERVAL_MS);

      // Hard timeout at 15 seconds
      timeoutRef.current = setTimeout(() => {
        setState((current) => {
          if (current.phase !== "waiting") return current;
          return { phase: "timeout" };
        });
        cleanup();
      }, TIMEOUT_MS);

      // Subscribe to Supabase Realtime for result row insertion
      const channel = supabase
        .channel(`search:${searchId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "search_results",
            filter: `search_id=eq.${searchId}`,
          },
          (payload) => {
            setState({ phase: "result", result: payload.new as ShowSearchResult });
            cleanup();
          }
        )
        .subscribe((status) => {
          // iOS Realtime disconnect — fall back to polling
          if (status === "CLOSED" || status === "TIMED_OUT") {
            startPolling(searchId);
          }
        });

      channelRef.current = channel;
    },
    [cleanup, startPolling]
  );

  // ---------- Reset ----------

  const reset = useCallback(() => {
    cleanup();
    setState({ phase: "idle" });
  }, [cleanup]);

  return { state, startCheckin, reset };
}
