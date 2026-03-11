import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ChevronLeft, Camera } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { readAsStringAsync } from "expo-file-system";
import { decode } from "base64-arraybuffer";

import { useThemeColors } from "@/constants/colors";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { supabase } from "@/lib/supabase";
import { apiCall } from "@/lib/api";
import type { NotificationPreferences } from "@/lib/notifications";

type PreferenceRow = {
  key: keyof NotificationPreferences;
  label: string;
  subtitle: string;
};

const NOTIFICATION_ROWS: PreferenceRow[] = [
  {
    key: "nearby_events",
    label: "Nearby Events",
    subtitle: "When artists you follow play nearby",
  },
  {
    key: "badge_unlocks",
    label: "Badge Unlocks",
    subtitle: "When you earn a new badge",
  },
  {
    key: "tier_ups",
    label: "Tier Upgrades",
    subtitle: "When you reach a new tier with an artist",
  },
  {
    key: "artist_messages",
    label: "Artist Messages",
    subtitle: "When a DJ sends a message to fans",
  },
  {
    key: "friend_joins",
    label: "Friend Joined",
    subtitle: "When a contact joins Decibel",
  },
  {
    key: "weekly_recap",
    label: "Weekly Recap",
    subtitle: "Your weekly show summary",
  },
];

function getGradientForName(name: string, colors: ReturnType<typeof useThemeColors>): [string, string] {
  const pairs: [string, string][] = [
    [colors.pink, colors.purple],
    [colors.purple, colors.blue],
    [colors.blue, colors.teal],
    [colors.teal, colors.pink],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return pairs[Math.abs(hash) % pairs.length] as [string, string];
}

export default function SettingsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { preferences, isLoading: prefsLoading, loadPreferences, togglePreference } =
    useNotificationStore();

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Load fan profile via API (bypasses RLS)
  const { data: fanProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["fanProfile", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      try {
        const data = await apiCall<{ fan: { id: string; name: string | null; avatar_url: string | null; city: string | null; created_at: string } }>("/mobile/passport?page=0");
        return data.fan;
      } catch {
        return null;
      }
    },
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (fanProfile) {
      setName(fanProfile.name ?? "");
      setAvatarUrl(fanProfile.avatar_url);
    }
  }, [fanProfile]);

  useEffect(() => {
    if (user?.id) {
      loadPreferences(user.id);
    }
  }, [user?.id]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!user?.id) return;
    togglePreference(user.id, key);
  };

  const handleSaveName = useCallback(async () => {
    if (!user?.email || !name.trim()) return;
    setSaving(true);
    try {
      await apiCall("/mobile/settings", {
        method: "POST",
        body: JSON.stringify({ name: name.trim().slice(0, 50) }),
      });

      queryClient.invalidateQueries({ queryKey: ["fanProfile"] });
      queryClient.invalidateQueries({ queryKey: ["passport"] });
      Alert.alert("Saved", "Your name has been updated.");
    } catch (err) {
      Alert.alert("Error", "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }, [user?.email, name, queryClient]);

  const handlePickAvatar = useCallback(async () => {
    if (!user?.email) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const fileExt = asset.uri.split(".").pop()?.toLowerCase() ?? "jpg";
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Read file as base64
      const base64 = await readAsStringAsync(asset.uri, {
        encoding: "base64",
      });

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, decode(base64), {
          contentType: `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update fan record via API (bypasses RLS)
      await apiCall("/mobile/settings", {
        method: "POST",
        body: JSON.stringify({ avatar_url: publicUrl }),
      });

      setAvatarUrl(publicUrl);
      queryClient.invalidateQueries({ queryKey: ["fanProfile"] });
    } catch (err: any) {
      Alert.alert("Upload Failed", err?.message ?? "Could not upload image.");
    } finally {
      setUploadingAvatar(false);
    }
  }, [user?.email, user?.id, queryClient]);

  const displayName = name || fanProfile?.name || "Fan";
  const gradientColors = getGradientForName(displayName, colors);
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 16,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.card,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ChevronLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 22,
            fontFamily: "Poppins_700Bold",
            color: colors.text,
          }}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      >
        {/* Profile section */}
        <Text
          style={{
            fontSize: 13,
            fontFamily: "Poppins_600SemiBold",
            color: colors.gray,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 12,
            marginTop: 8,
          }}
        >
          Profile
        </Text>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          {/* Avatar */}
          <TouchableOpacity
            onPress={handlePickAvatar}
            disabled={uploadingAvatar}
            style={{ marginBottom: 16 }}
          >
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                overflow: "hidden",
              }}
            >
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: 96, height: 96 }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 96,
                    height: 96,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 36,
                      fontFamily: "Poppins_700Bold",
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    {initial}
                  </Text>
                </LinearGradient>
              )}
            </View>
            {/* Camera overlay */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.pink,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: colors.card,
              }}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Camera size={16} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 12,
              fontFamily: "Poppins_400Regular",
              color: colors.gray,
              marginBottom: 16,
            }}
          >
            Tap to change photo
          </Text>

          {/* Name input */}
          <View style={{ width: "100%", marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Poppins_500Medium",
                color: colors.gray,
                marginBottom: 6,
              }}
            >
              Display Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.lightGray}
              maxLength={50}
              style={{
                backgroundColor: colors.bg,
                color: colors.text,
                fontFamily: "Poppins_400Regular",
                fontSize: 16,
                borderRadius: 12,
                height: 48,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSaveName}
            disabled={saving || !name.trim()}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              backgroundColor: saving || !name.trim() ? colors.lightGray : colors.pink,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "Poppins_600SemiBold",
                  color: "#FFFFFF",
                }}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Notifications section */}
        <Text
          style={{
            fontSize: 13,
            fontFamily: "Poppins_600SemiBold",
            color: colors.gray,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 12,
          }}
        >
          Notifications
        </Text>

        {prefsLoading ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 32,
              alignItems: "center",
            }}
          >
            <ActivityIndicator color={colors.teal} />
          </View>
        ) : (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {NOTIFICATION_ROWS.map((row, index) => (
              <View
                key={row.key}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  borderBottomWidth:
                    index < NOTIFICATION_ROWS.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: "Poppins_500Medium",
                      color: colors.text,
                    }}
                  >
                    {row.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Poppins_400Regular",
                      color: colors.gray,
                      marginTop: 2,
                    }}
                  >
                    {row.subtitle}
                  </Text>
                </View>
                <Switch
                  value={preferences[row.key]}
                  onValueChange={() => handleToggle(row.key)}
                  trackColor={{
                    false: colors.lightGray,
                    true: colors.teal,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          onPress={async () => {
            setSigningOut(true);
            await supabase.auth.signOut();
          }}
          disabled={signingOut}
          style={{
            marginTop: 32,
            height: 48,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.pink,
            justifyContent: "center",
            alignItems: "center",
            opacity: signingOut ? 0.5 : 1,
          }}
        >
          {signingOut ? (
            <ActivityIndicator color={colors.pink} size="small" />
          ) : (
            <Text
              style={{
                fontSize: 15,
                fontFamily: "Poppins_600SemiBold",
                color: colors.pink,
              }}
            >
              Sign Out
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
