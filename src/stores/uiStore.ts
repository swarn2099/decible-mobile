import { create } from "zustand";
import { MMKV } from "react-native-mmkv";

const uiStorage = new MMKV({ id: "ui-storage" });

const ONBOARDING_KEY = "has_seen_onboarding";

interface UIState {
  hasSeenOnboarding: boolean;
  setOnboardingComplete: () => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  hasSeenOnboarding: uiStorage.getBoolean(ONBOARDING_KEY) ?? false,
  setOnboardingComplete: () => {
    uiStorage.set(ONBOARDING_KEY, true);
    set({ hasSeenOnboarding: true });
  },
  isOnline: true,
  setIsOnline: (online: boolean) => set({ isOnline: online }),
}));
