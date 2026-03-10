import { MMKV } from "react-native-mmkv";

/**
 * MMKV instance dedicated to TanStack Query cache persistence.
 * Separate from the Supabase auth storage to avoid key collisions.
 */
export const queryCacheStorage = new MMKV({
  id: "tanstack-query-cache",
});

/**
 * Synchronous persister adapter for @tanstack/react-query-persist-client.
 * Falls back to simple MMKV get/set if the persist-client package isn't available.
 */
export const mmkvPersister = {
  getItem: (key: string): string | null => {
    return queryCacheStorage.getString(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    queryCacheStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    queryCacheStorage.delete(key);
  },
};
