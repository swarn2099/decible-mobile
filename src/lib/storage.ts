/**
 * In-memory storage shim replacing MMKV while debugging native crash.
 * TODO: restore MMKV once crash is resolved.
 */
const store = new Map<string, string>();

export const mmkv = {
  getString: (key: string): string | undefined => store.get(key),
  set: (key: string, value: string | number | boolean) =>
    store.set(key, String(value)),
  getBoolean: (key: string): boolean | undefined => {
    const v = store.get(key);
    if (v === undefined) return undefined;
    return v === "true";
  },
  delete: (key: string) => store.delete(key),
};

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
