import { MMKV } from "react-native-mmkv";

export const mmkv = new MMKV({ id: "supabase-storage" });

export function createSupabaseStorageAdapter(storage: typeof mmkv) {
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
