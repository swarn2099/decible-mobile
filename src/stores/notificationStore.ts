import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { NotificationPreferences } from "@/lib/notifications";
import { DEFAULT_PREFERENCES } from "@/lib/notifications";

interface NotificationState {
  preferences: NotificationPreferences;
  isLoading: boolean;

  /** Load preferences from Supabase. Inserts defaults if no row exists. */
  loadPreferences: (userId: string) => Promise<void>;

  /** Toggle a single preference key. Optimistically updates local state, then syncs to Supabase. */
  togglePreference: (
    userId: string,
    key: keyof NotificationPreferences
  ) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  preferences: { ...DEFAULT_PREFERENCES },
  isLoading: true,

  loadPreferences: async (userId: string) => {
    set({ isLoading: true });

    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select(
          "nearby_events, badge_unlocks, tier_ups, artist_messages, friend_joins, weekly_recap"
        )
        .eq("user_id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        // No row exists -- insert defaults
        await supabase.from("notification_preferences").insert({
          user_id: userId,
          ...DEFAULT_PREFERENCES,
        });
        set({ preferences: { ...DEFAULT_PREFERENCES }, isLoading: false });
        return;
      }

      if (error) {
        console.warn(
          "[notificationStore] Failed to load preferences:",
          error.message
        );
        set({ isLoading: false });
        return;
      }

      set({
        preferences: {
          nearby_events: data.nearby_events ?? true,
          badge_unlocks: data.badge_unlocks ?? true,
          tier_ups: data.tier_ups ?? true,
          artist_messages: data.artist_messages ?? true,
          friend_joins: data.friend_joins ?? true,
          weekly_recap: data.weekly_recap ?? true,
        },
        isLoading: false,
      });
    } catch (err) {
      console.warn("[notificationStore] Error loading preferences:", err);
      set({ isLoading: false });
    }
  },

  togglePreference: async (
    userId: string,
    key: keyof NotificationPreferences
  ) => {
    const current = get().preferences;
    const newValue = !current[key];

    // Optimistic update
    set({
      preferences: { ...current, [key]: newValue },
    });

    // Sync to Supabase
    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: userId,
          [key]: newValue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.warn(
        "[notificationStore] Failed to sync preference:",
        error.message
      );
      // Revert on failure
      set({ preferences: { ...current } });
    }
  },
}));
