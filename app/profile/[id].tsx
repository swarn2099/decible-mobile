import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, UserPlus, UserCheck } from "lucide-react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColors, Colors } from "@/constants/colors";
import { apiCall } from "@/lib/api";
import { useFollow, useSocialCounts } from "@/hooks/useUserSearch";
import { CollectionStamp } from "@/components/passport/CollectionStamp";
import type { CollectionStamp as CollectionStampType } from "@/types/passport";

const GRADIENT_PAIRS = [
  [Colors.pink, Colors.purple],
  [Colors.purple, Colors.blue],
  [Colors.blue, Colors.teal],
  [Colors.teal, Colors.pink],
  [Colors.yellow, Colors.pink],
  [Colors.purple, Colors.teal],
];

function getGradientForName(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length] as [
    string,
    string,
  ];
}

type UserProfile = {
  fan: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    city: string | null;
    created_at: string;
  };
  collections: CollectionStampType[];
  is_following: boolean;
};

function useUserProfile(fanId: string) {
  return useQuery<UserProfile>({
    queryKey: ["userProfile", fanId],
    queryFn: async () => {
      return apiCall<UserProfile>(`/mobile/passport?fan_id=${fanId}&page=0`);
    },
    enabled: !!fanId,
  });
}

export default function UserProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useUserProfile(id ?? "");
  const { data: socialCounts } = useSocialCounts(id);
  const { followMutation, unfollowMutation } = useFollow();

  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);

  const currentFollowing =
    isFollowing ?? profile?.is_following ?? false;

  const handleFollow = useCallback(async () => {
    if (!id) return;
    const newState = !currentFollowing;
    setIsFollowing(newState);
    try {
      if (newState) {
        await followMutation.mutateAsync(id);
      } else {
        await unfollowMutation.mutateAsync(id);
      }
      queryClient.invalidateQueries({ queryKey: ["socialCounts", id] });
    } catch {
      setIsFollowing(!newState);
    }
  }, [id, currentFollowing, followMutation, unfollowMutation, queryClient]);

  if (isLoading || !profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 16,
            gap: 12,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={{ paddingTop: 60, alignItems: "center" }}>
          <ActivityIndicator color={colors.pink} />
        </View>
      </SafeAreaView>
    );
  }

  const fan = profile.fan;
  const displayName = fan.name ?? "Unknown";
  const gradientColors = getGradientForName(displayName);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header with back button */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Poppins_700Bold",
            color: colors.text,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {displayName}
        </Text>
      </View>

      <FlatList
        data={profile.collections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16 }}>
            {/* Avatar + name */}
            <View
              style={{
                alignItems: "center",
                paddingTop: 8,
                paddingBottom: 20,
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  overflow: "hidden",
                  marginBottom: 12,
                }}
              >
                {fan.avatar_url ? (
                  <Image
                    source={{ uri: fan.avatar_url }}
                    style={{ width: 80, height: 80 }}
                  />
                ) : (
                  <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 80,
                      height: 80,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 32,
                        fontFamily: "Poppins_700Bold",
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
              </View>

              <Text
                style={{
                  fontSize: 22,
                  fontFamily: "Poppins_700Bold",
                  color: colors.text,
                }}
              >
                {displayName}
              </Text>

              {fan.city && (
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Poppins_400Regular",
                    color: colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {fan.city}
                </Text>
              )}

              {/* Stats row */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 24,
                  marginTop: 16,
                }}
              >
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/following",
                      params: { fanId: fan.id },
                    })
                  }
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Poppins_600SemiBold",
                      color: colors.text,
                      textAlign: "center",
                    }}
                  >
                    {socialCounts?.following_count ?? 0}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Poppins_400Regular",
                      color: colors.textSecondary,
                    }}
                  >
                    Following
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/followers",
                      params: { fanId: fan.id },
                    })
                  }
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Poppins_600SemiBold",
                      color: colors.text,
                      textAlign: "center",
                    }}
                  >
                    {socialCounts?.followers_count ?? 0}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Poppins_400Regular",
                      color: colors.textSecondary,
                    }}
                  >
                    Followers
                  </Text>
                </TouchableOpacity>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Poppins_600SemiBold",
                      color: colors.text,
                      textAlign: "center",
                    }}
                  >
                    {profile.collections.filter((c) => !c.verified).length}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Poppins_400Regular",
                      color: colors.textSecondary,
                    }}
                  >
                    Finds
                  </Text>
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Poppins_600SemiBold",
                      color: colors.text,
                      textAlign: "center",
                    }}
                  >
                    {profile.collections.filter((c) => c.verified).length}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Poppins_400Regular",
                      color: colors.textSecondary,
                    }}
                  >
                    Stamps
                  </Text>
                </View>
              </View>

              {/* Follow button */}
              <TouchableOpacity
                onPress={handleFollow}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 16,
                  paddingHorizontal: 24,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: currentFollowing
                    ? colors.card
                    : colors.pink,
                  borderWidth: currentFollowing ? 1 : 0,
                  borderColor: colors.cardBorder,
                }}
              >
                {currentFollowing ? (
                  <UserCheck size={16} color={colors.text} />
                ) : (
                  <UserPlus size={16} color="#FFFFFF" />
                )}
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Poppins_600SemiBold",
                    color: currentFollowing ? colors.text : "#FFFFFF",
                  }}
                >
                  {currentFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Collection header */}
            {profile.collections.length > 0 && (
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Poppins_700Bold",
                  color: colors.text,
                  paddingBottom: 8,
                }}
              >
                Collection
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <CollectionStamp
            stamp={item}
            onPress={(s: CollectionStampType) =>
              router.push(`/artist/${s.performer.slug}`)
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}
