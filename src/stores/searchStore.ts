import { create } from "zustand";
import { mmkv } from "@/lib/storage";

const RECENT_SEARCHES_KEY = "recent_searches";
const MAX_RECENT = 5;

interface SearchState {
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  recentSearches: JSON.parse(
    mmkv.getString(RECENT_SEARCHES_KEY) ?? "[]"
  ),
  addRecentSearch: (term: string) => {
    set((state) => {
      const deduped = [term, ...state.recentSearches.filter((t) => t !== term)].slice(
        0,
        MAX_RECENT
      );
      mmkv.set(RECENT_SEARCHES_KEY, JSON.stringify(deduped));
      return { recentSearches: deduped };
    });
  },
  clearRecentSearches: () => {
    mmkv.delete(RECENT_SEARCHES_KEY);
    set({ recentSearches: [] });
  },
}));
