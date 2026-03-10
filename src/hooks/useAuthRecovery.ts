import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { resetAuthCounter } from "@/lib/api";
import { queryClient } from "@/providers/QueryProvider";

/**
 * Subscribes to Supabase auth state changes.
 * On SIGNED_IN or TOKEN_REFRESHED:
 *  - Resets the consecutive 401 counter in api.ts
 *  - Clears sessionExpired flag in authStore (dismisses ReAuthModal)
 *  - Refetches all active queries so failed requests auto-retry
 *
 * Mount this hook once in RootNavigator so it's always active.
 */
export function useAuthRecovery() {
  const sessionExpired = useAuthStore((s) => s.sessionExpired);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        resetAuthCounter();
        useAuthStore.getState().setSessionExpired(false);
        // Auto-retry any queries that failed while session was expired
        queryClient.refetchQueries();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { sessionExpired };
}
