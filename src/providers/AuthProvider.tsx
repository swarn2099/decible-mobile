import { useEffect } from "react";
import type { ReactNode } from "react";
import { AppState } from "react-native";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Extract tokens from a Supabase magic link URL and create a session.
 * Supabase magic links contain tokens as URL fragment params:
 * decibel://auth/callback#access_token=...&refresh_token=...&type=magiclink
 */
async function handleDeepLink(url: string) {
  // Supabase puts tokens in the fragment (#) part of the URL
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) return;

  const fragment = url.substring(hashIndex + 1);
  const params = new URLSearchParams(fragment);

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession]);

  // Handle deep links (magic link callbacks)
  useEffect(() => {
    // Handle URL that opened the app (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Handle URLs while app is open (warm start)
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Refresh session when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return <>{children}</>;
}
