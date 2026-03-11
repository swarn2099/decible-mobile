/**
 * In-memory storage shim replacing MMKV while debugging native crash.
 * TODO: restore MMKV once crash is resolved.
 */
const store = new Map<string, string>();

export const queryCacheStorage = {
  getString: (key: string): string | undefined => store.get(key),
  set: (key: string, value: string) => store.set(key, value),
  delete: (key: string) => store.delete(key),
};

export const mmkvPersister = {
  getItem: (key: string): string | null => {
    return store.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    store.set(key, value);
  },
  removeItem: (key: string): void => {
    store.delete(key);
  },
};
