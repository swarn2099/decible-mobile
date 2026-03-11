import { create } from "zustand";
import { mmkv } from "@/lib/storage";

const ONBOARDING_KEY = "has_seen_onboarding";

interface UIState {
  hasSeenOnboarding: boolean;
  setOnboardingComplete: () => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  hasSeenOnboarding: mmkv.getBoolean(ONBOARDING_KEY) ?? false,
  setOnboardingComplete: () => {
    mmkv.set(ONBOARDING_KEY, true);
    set({ hasSeenOnboarding: true });
  },
  isOnline: true,
  setIsOnline: (online: boolean) => set({ isOnline: online }),
}));
