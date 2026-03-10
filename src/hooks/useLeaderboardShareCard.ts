import { useState, useCallback } from "react";
import { File, Paths } from "expo-file-system";
import type { TimePeriod } from "@/types/index";

const API_BASE = "https://decibel-three.vercel.app/api/leaderboard/share-card";

// ---------- Types ----------

type ShareCardState = {
  isLoading: boolean;
  error: string | null;
};

type RankCardParams = {
  rank: number;
  name: string;
  count: number;
  tier: string;
  period: TimePeriod;
  topArtists: string[]; // photo URLs of top collected artists
};

// ---------- Helper: download image to cache ----------

async function downloadShareCard(url: string, filename: string): Promise<string> {
  const destination = new File(Paths.cache, `${filename}.png`);
  const downloaded = await File.downloadFileAsync(url, destination);
  return downloaded.uri;
}

// ---------- Hook ----------

export function useLeaderboardShareCard() {
  const [state, setState] = useState<ShareCardState>({
    isLoading: false,
    error: null,
  });

  const generate = useCallback(async (params: RankCardParams): Promise<string> => {
    setState({ isLoading: true, error: null });
    try {
      const qs = new URLSearchParams({
        rank: String(params.rank),
        name: params.name,
        count: String(params.count),
        tier: params.tier,
        period: params.period,
      });
      if (params.topArtists.length > 0) {
        qs.set("topArtists", params.topArtists.join(","));
      }

      const url = `${API_BASE}?${qs.toString()}`;
      const uri = await downloadShareCard(url, `rank-${params.rank}-${Date.now()}`);
      setState({ isLoading: false, error: null });
      return uri;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate card";
      setState({ isLoading: false, error: msg });
      throw err;
    }
  }, []);

  return { generate, ...state };
}
