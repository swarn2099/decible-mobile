import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { mmkvPersister } from "@/lib/queryClient";
import type { ReactNode } from "react";

// Keys that survive app restarts (passport + artist profile data only)
const PERSISTED_QUERY_KEY_PREFIXES = [
  "passport",
  "passportStats",
  "artistProfile",
  "myBadges",
  "myCollectedIds",
];

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days -- keeps data for offline viewing
    },
  },
});

const persister = createSyncStoragePersister({
  storage: mmkvPersister,
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        buster: "v2", // bumped from v1 to invalidate old cache shape
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const key = query.queryKey[0];
            if (typeof key !== "string") return false;
            return PERSISTED_QUERY_KEY_PREFIXES.some((prefix) =>
              key.startsWith(prefix)
            );
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
