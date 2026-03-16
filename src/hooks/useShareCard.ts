import { useState, useCallback } from "react";
import { File, Paths } from "expo-file-system";
import * as Clipboard from "expo-clipboard";

const API_BASE = "https://decibel-three.vercel.app/api/passport/share-card";
const PUBLIC_BASE = "https://decible.live/u";
const FOUNDER_CARD_BASE = "https://decibel-three.vercel.app/api/share-card/founder";
const PASSPORT_CARD_V2_BASE = "https://decibel-three.vercel.app/api/share-card/passport";

// ---------- Types ----------

type ShareCardState = {
  isLoading: boolean;
  error: string | null;
};

type PassportShareParams = {
  name: string;
  artists: number;
  shows: number;
  venues: number;
  cities: number;
  streak: number;
  genre: string | null;
  topArtists: string[];
  slug: string;
};

type ArtistShareParams = {
  name: string;
  photo: string | null;
  tier: string;
  scans: number;
  venue: string | null;
  fanName: string;
  slug: string;
};

type BadgeShareParams = {
  badge: string;
  fanName: string;
  icon: string;
  rarity: string;
  description: string;
};

type FounderShareParams = {
  artistName: string;
  artistPhoto: string | null;
  fanSlug: string;
  listenerCount?: string; // e.g. "42K"
  foundDate?: string;     // e.g. "Mar 16, 2026"
};

type PassportShareV2Params = {
  name: string;
  finds: number;
  founders: number;
  influence: number;
  topPhotos: string[];
  avatarUrl?: string;
};

// ---------- Helper: download image to cache ----------

async function downloadShareCard(url: string, filename: string): Promise<string> {
  const destination = new File(Paths.cache, `${filename}.png`);
  const downloaded = await File.downloadFileAsync(url, destination);
  return downloaded.uri;
}

// ---------- Hooks ----------

export function usePassportShareCard() {
  const [state, setState] = useState<ShareCardState>({
    isLoading: false,
    error: null,
  });

  const generate = useCallback(async (params: PassportShareParams): Promise<string> => {
    setState({ isLoading: true, error: null });
    try {
      const qs = new URLSearchParams({
        name: params.name,
        artists: String(params.artists),
        shows: String(params.shows),
        venues: String(params.venues),
        cities: String(params.cities),
        streak: String(params.streak),
        slug: params.slug,
      });
      if (params.genre) qs.set("genre", params.genre);
      if (params.topArtists.length > 0) {
        qs.set("topArtists", params.topArtists.join(","));
      }

      const url = `${API_BASE}?${qs.toString()}`;
      const uri = await downloadShareCard(url, `passport-${params.slug}-${Date.now()}`);
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

export function useArtistShareCard() {
  const [state, setState] = useState<ShareCardState>({
    isLoading: false,
    error: null,
  });

  const generate = useCallback(async (params: ArtistShareParams): Promise<string> => {
    setState({ isLoading: true, error: null });
    try {
      const qs = new URLSearchParams({
        name: params.name,
        tier: params.tier,
        scans: String(params.scans),
        fanName: params.fanName,
        slug: params.slug,
      });
      if (params.photo) qs.set("photo", params.photo);
      if (params.venue) qs.set("venue", params.venue);

      const url = `${API_BASE}/artist?${qs.toString()}`;
      const uri = await downloadShareCard(url, `artist-${params.slug}-${Date.now()}`);
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

export function useBadgeShareCard() {
  const [state, setState] = useState<ShareCardState>({
    isLoading: false,
    error: null,
  });

  const generate = useCallback(async (params: BadgeShareParams): Promise<string> => {
    setState({ isLoading: true, error: null });
    try {
      const qs = new URLSearchParams({
        badge: params.badge,
        fanName: params.fanName,
        icon: params.icon,
        rarity: params.rarity,
        description: params.description,
      });

      const url = `${API_BASE}/badge?${qs.toString()}`;
      const uri = await downloadShareCard(url, `badge-${params.badge}-${Date.now()}`);
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

export function useFounderShareCard() {
  const [state, setState] = useState<ShareCardState>({
    isLoading: false,
    error: null,
  });

  const generate = useCallback(async (params: FounderShareParams): Promise<string> => {
    setState({ isLoading: true, error: null });
    try {
      const qs = new URLSearchParams({
        artistName: params.artistName,
        fanSlug: params.fanSlug,
      });
      if (params.artistPhoto) qs.set("artistPhoto", params.artistPhoto);
      if (params.listenerCount) qs.set("listenerCount", params.listenerCount);
      if (params.foundDate) qs.set("foundDate", params.foundDate);

      const url = `${FOUNDER_CARD_BASE}?${qs.toString()}`;
      const uri = await downloadShareCard(
        url,
        `founder-${params.fanSlug}-${Date.now()}`
      );
      setState({ isLoading: false, error: null });
      return uri;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate founder card";
      setState({ isLoading: false, error: msg });
      throw err;
    }
  }, []);

  return { generate, ...state };
}

export function usePassportShareCardV2() {
  const [state, setState] = useState<ShareCardState>({
    isLoading: false,
    error: null,
  });

  const generate = useCallback(async (params: PassportShareV2Params): Promise<string> => {
    setState({ isLoading: true, error: null });
    try {
      const qs = new URLSearchParams({
        name: params.name,
        finds: String(params.finds),
        founders: String(params.founders),
        influence: String(params.influence),
      });
      if (params.topPhotos.length > 0) {
        qs.set("topPhotos", params.topPhotos.join(","));
      }
      if (params.avatarUrl) qs.set("avatarUrl", params.avatarUrl);

      const url = `${PASSPORT_CARD_V2_BASE}?${qs.toString()}`;
      const uri = await downloadShareCard(
        url,
        `passport-v2-${Date.now()}`
      );
      setState({ isLoading: false, error: null });
      return uri;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate passport card";
      setState({ isLoading: false, error: msg });
      throw err;
    }
  }, []);

  return { generate, ...state };
}

export function useSharePassportLink() {
  const [state, setState] = useState<ShareCardState>({
    isLoading: false,
    error: null,
  });

  const copy = useCallback(async (slug: string): Promise<string> => {
    setState({ isLoading: true, error: null });
    try {
      const url = `${PUBLIC_BASE}/${encodeURIComponent(slug)}`;
      await Clipboard.setStringAsync(url);
      setState({ isLoading: false, error: null });
      return url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to copy link";
      setState({ isLoading: false, error: msg });
      throw err;
    }
  }, []);

  return { copy, ...state };
}
