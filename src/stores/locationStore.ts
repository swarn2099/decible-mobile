import { create } from "zustand";
import { MMKV } from "react-native-mmkv";

const locationStorage = new MMKV({ id: "location-storage" });

const DISMISSED_KEY = "dismissed_event_ids";
const EXPLANATION_KEY = "has_shown_explanation";
const PERMISSION_DENIED_KEY = "permission_denied";

interface LocationState {
  /** Event IDs the fan dismissed (tapped X on banner) */
  dismissedEventIds: string[];
  dismissEvent: (eventId: string) => void;
  isEventDismissed: (eventId: string) => boolean;
  /** Clear dismissed list (call daily or on app restart) */
  clearDismissed: () => void;

  /** Whether we've shown the location explanation before OS prompt */
  hasShownExplanation: boolean;
  setExplanationShown: () => void;

  /** Whether location permission was explicitly denied */
  permissionDenied: boolean;
  setPermissionDenied: (denied: boolean) => void;
}

function loadDismissed(): string[] {
  const raw = locationStorage.getString(DISMISSED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export const useLocationStore = create<LocationState>((set, get) => ({
  dismissedEventIds: loadDismissed(),

  dismissEvent: (eventId: string) => {
    const current = get().dismissedEventIds;
    if (current.includes(eventId)) return;
    const updated = [...current, eventId];
    locationStorage.set(DISMISSED_KEY, JSON.stringify(updated));
    set({ dismissedEventIds: updated });
  },

  isEventDismissed: (eventId: string) => {
    return get().dismissedEventIds.includes(eventId);
  },

  clearDismissed: () => {
    locationStorage.delete(DISMISSED_KEY);
    set({ dismissedEventIds: [] });
  },

  hasShownExplanation: locationStorage.getBoolean(EXPLANATION_KEY) ?? false,

  setExplanationShown: () => {
    locationStorage.set(EXPLANATION_KEY, true);
    set({ hasShownExplanation: true });
  },

  permissionDenied: locationStorage.getBoolean(PERMISSION_DENIED_KEY) ?? false,

  setPermissionDenied: (denied: boolean) => {
    locationStorage.set(PERMISSION_DENIED_KEY, denied);
    set({ permissionDenied: denied });
  },
}));
