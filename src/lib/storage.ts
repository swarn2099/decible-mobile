import { MMKV } from "react-native-mmkv";

export const mmkv = new MMKV({
  id: "supabase-storage",
});

/**
 * Creates a synchronous storage adapter for Supabase Auth
 * that uses MMKV instead of AsyncStorage.
 *
 * MMKV is synchronous and significantly faster than AsyncStorage,
 * which avoids race conditions during session restoration.
 */
export function createSupabaseStorageAdapter(storage: MMKV) {
  return {
    getItem: (key: string): string | null => {
      return storage.getString(key) ?? null;
    },
    setItem: (key: string, value: string): void => {
      storage.set(key, value);
    },
    removeItem: (key: string): void => {
      storage.delete(key);
    },
  };
}
