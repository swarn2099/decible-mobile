import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  UserPlus,
  UserCheck,
  Disc,
} from "lucide-react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColors, Colors } from "@/constants/colors";
import { apiCall } from "@/lib/api";
import { useFollow, useSocialCounts } from "@/hooks/useUserSearch";
import { FindsGrid } from "@/components/passport/FindsGrid";
import { StampsSection } from "@/components/passport/StampsSection";
import { EmptyState } from "@/components/ui/EmptyState";
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

type UserProfileResponse = {
  fan: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    city: string | null;
    created_at: string;
  };
  collections: CollectionStampType[];
  is_following?: boolean;
};

function useUserProfile(fanId: string) {
  return useQuery<UserProfileResponse>({
    queryKey: ["userProfile", fanId],
    queryFn: async () => {
      return apiCall<UserProfileResponse>(
        `/mobile/passport?fan_id=${fanId}&page=0`
      );
    },
    enabled: !!fanId,
  });
}

function StatCell({
  value,
  label,
  onPress,
}: {
  value: string;
  label: string;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      {...(onPress ? { onPress, hitSlop: 8 } : {})}
      style={{ alignItems: "center", flex: 1 }}
    >
      <Text
        style={{
          fontSize: 18,
          fontFamily: "Poppins_700Bold",
          color: colors.text,
          lineHeight: 24,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 11,
          fontFamily: "Poppins_400Regular",
          color: colors.textSecondary,
          marginTop: 1,
        }}
      >
        {label}
      </Text>
    </Wrapper>
  );
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

  const currentFollowing = isFollowing ?? profile?.is_following ?? false;

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

  const collections = profile.collections;
  const finds = collections.filter((c) => !c.verified);
  const stamps = collections.filter((c) => c.verified);

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

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Instagram-style header: Avatar left, stats right */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 16,
          }}
        >
          {/* Row 1: Avatar + Stats */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 20,
            }}
          >
            {/* Avatar */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                overflow: "hidden",
              }}
            >
              {fan.avatar_url ? (
                <Image
                  source={{ uri: fan.avatar_url }}
                  style={{ width: 80, height: 80 }}
                  contentFit="cover"
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

            {/* Stats columns */}
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "space-around",
              }}
            >
              <StatCell
                value={String(socialCounts?.following_count ?? 0)}
                label="Following"
                onPress={() =>
                  router.push({
                    pathname: "/following",
                    params: { fanId: fan.id },
                  })
                }
              />
              <StatCell
                value={String(socialCounts?.followers_count ?? 0)}
                label="Followers"
                onPress={() =>
                  router.push({
                    pathname: "/followers",
                    params: { fanId: fan.id },
                  })
                }
              />
              <StatCell value={String(finds.length)} label="Finds" />
              <StatCell value={String(stamps.length)} label="Stamps" />
            </View>
          </View>

          {/* Row 2: Username */}
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Poppins_700Bold",
              color: colors.text,
              marginTop: 14,
            }}
          >
            {displayName}
          </Text>

          {/* Row 3: City */}
          {fan.city && (
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Poppins_400Regular",
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              {fan.city}
            </Text>
          )}

          {/* Follow / Following button */}
          <TouchableOpacity
            onPress={handleFollow}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginTop: 16,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: currentFollowing ? colors.card : colors.pink,
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

        {/* Finds section */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Poppins_700Bold",
              color: colors.text,
            }}
          >
            Finds
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Poppins_400Regular",
              color: colors.textSecondary,
            }}
          >
            {finds.length} artist{finds.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {finds.length > 0 ? (
          <FindsGrid finds={finds.slice(0, 6)} totalCount={finds.length} />
        ) : (
          <EmptyState
            icon={<Disc size={32} color={colors.textSecondary} />}
            title="No finds yet"
            subtitle="This user hasn't found any artists yet"
          />
        )}

        {/* Stamps section */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 24,
            paddingBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Poppins_700Bold",
              color: colors.text,
            }}
          >
            Stamps
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Poppins_400Regular",
              color: colors.textSecondary,
            }}
          >
            {stamps.length} show{stamps.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {stamps.length > 0 ? (
          <StampsSection
            stamps={stamps.slice(0, 5)}
            totalCount={stamps.length}
          />
        ) : (
          <EmptyState
            icon={<Disc size={32} color={colors.textSecondary} />}
            title="No stamps yet"
            subtitle="This user hasn't checked in at any shows yet"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
