import { Platform } from "react-native";
import { supabase } from "./supabase";

// ---------- Types ----------

export type NotificationPreferences = {
  nearby_events: boolean;
  badge_unlocks: boolean;
  tier_ups: boolean;
  artist_messages: boolean;
  friend_joins: boolean;
  weekly_recap: boolean;
};

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  nearby_events: true,
  badge_unlocks: true,
  tier_ups: true,
  artist_messages: true,
  friend_joins: true,
  weekly_recap: true,
};

// ---------- Push token registration ----------

/**
 * Upsert the Expo push token for this user+device in Supabase.
 * Supports multiple devices per user.
 */
export async function registerPushToken(
  userId: string,
  token: string
): Promise<void> {
  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: userId,
      expo_push_token: token,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,expo_push_token" }
  );

  if (error) {
    console.warn("[notifications] Failed to register push token:", error.message);
  }
}

// ---------- Deep link routing ----------

/**
 * Map notification data.type to an expo-router path.
 * Called when a user taps a push notification.
 *
 * Supported types:
 *   artist, event, tier_up → /artist/:slug
 *   passport, recap         → /(tabs)/passport
 *   badge                   → /(tabs)/passport?tab=badges
 *   leaderboard             → /leaderboard
 *   friend                  → /(tabs)
 *   settings                → /settings
 */
export function handleNotificationRoute(
  data: Record<string, string>
): string {
  switch (data.type) {
    case "artist":
    case "event":
    case "tier_up":
    case "artist_collected":
      return `/artist/${data.slug}`;
    case "passport":
    case "recap":
      return "/(tabs)/passport";
    case "badge":
      return "/(tabs)/passport?tab=badges";
    case "leaderboard":
      return "/leaderboard";
    case "friend":
      return "/(tabs)";
    case "settings":
      return "/settings";
    default:
      return "/(tabs)";
  }
}
