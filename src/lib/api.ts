import { supabase } from "./supabase";
import { useAuthStore } from "@/stores/authStore";

const API_BASE = "https://decibel-three.vercel.app/api";

// Consecutive 401 counter — reset on successful auth events via resetAuthCounter()
let consecutive401Count = 0;

/**
 * Reset the 401 counter. Called by useAuthRecovery when SIGNED_IN / TOKEN_REFRESHED fires.
 */
export function resetAuthCounter() {
  consecutive401Count = 0;
}

/**
 * Make authenticated API calls to the Decibel web backend.
 * Sends the Supabase access token as a Bearer token.
 *
 * 401 handling:
 *  - First consecutive 401: attempts silent token refresh and retries once.
 *  - Second consecutive 401: triggers sessionExpired modal via authStore.
 */
export async function apiCall<T>(
  path: string,
  options?: RequestInit,
  _isRetry = false
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...options?.headers,
    },
  });

  if (res.ok) {
    // Reset counter on any successful response
    consecutive401Count = 0;
    return res.json();
  }

  if (res.status === 401) {
    consecutive401Count += 1;

    if (consecutive401Count === 1 && !_isRetry) {
      // First 401 — attempt silent token refresh and retry once
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError) {
        consecutive401Count = 0;
        return apiCall<T>(path, options, true);
      }
      // Refresh failed — fall through to second-401 path
      consecutive401Count += 1;
    }

    // Second (or more) consecutive 401 — trigger re-auth modal
    consecutive401Count = 0;
    useAuthStore.getState().setSessionExpired(true);
    const text = await res.text().catch(() => "Session expired");
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const text = await res.text().catch(() => "Unknown error");
  throw new Error(`API error ${res.status}: ${text}`);
}
