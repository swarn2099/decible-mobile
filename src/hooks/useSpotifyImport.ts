import { useState } from "react";
import * as AuthSession from "expo-auth-session";
import { apiCall } from "@/lib/api";

const SPOTIFY_CLIENT_ID = "3e5cc6aff80943d285c97668e82c6e44";
const SPOTIFY_SCOPES = ["user-top-read"];

// PKCE OAuth discovery for Spotify
const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

export type ImportedArtist = {
  name: string;
  performer_id: string;
  photo_url: string | null;
  already_discovered: boolean;
  has_upcoming_show: boolean;
  next_show?: { venue_name: string; event_date: string };
};

export type ImportResults = {
  imported: number;
  already_had: number;
  skipped_mainstream: number;
  artists: ImportedArtist[];
};

export type SpotifyImportState =
  | "idle"
  | "authenticating"
  | "importing"
  | "done"
  | "error";

export function useSpotifyImport() {
  const [state, setState] = useState<SpotifyImportState>("idle");
  const [results, setResults] = useState<ImportResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create PKCE request
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "decibel",
    path: "spotify/callback",
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: SPOTIFY_CLIENT_ID,
      scopes: SPOTIFY_SCOPES,
      usePKCE: true,
      redirectUri,
    },
    discovery
  );

  const connect = async () => {
    setState("authenticating");
    setError(null);

    try {
      const result = await promptAsync();

      if (result.type !== "success" || !result.params.code) {
        if (result.type === "cancel" || result.type === "dismiss") {
          setState("idle");
          return;
        }
        throw new Error("Spotify authentication failed");
      }

      // Exchange auth code for tokens
      setState("importing");

      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId: SPOTIFY_CLIENT_ID,
          code: result.params.code,
          redirectUri,
          extraParams: {
            code_verifier: request!.codeVerifier!,
          },
        },
        discovery
      );

      if (!tokenResult.accessToken) {
        throw new Error("Failed to get Spotify access token");
      }

      // Send to our API for import
      const importData = await apiCall<ImportResults>(
        "/mobile/spotify/import",
        {
          method: "POST",
          body: JSON.stringify({
            spotify_access_token: tokenResult.accessToken,
            spotify_refresh_token: tokenResult.refreshToken ?? null,
          }),
        }
      );

      setResults(importData);
      setState("done");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setState("error");
    }
  };

  const reset = () => {
    setState("idle");
    setResults(null);
    setError(null);
  };

  return {
    state,
    results,
    error,
    connect,
    reset,
    isReady: !!request,
  };
}
