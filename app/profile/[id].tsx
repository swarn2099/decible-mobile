import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  UserPlus,
  UserCheck,
} from "lucide-react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSharedValue } from "react-native-reanimated";
import { useThemeColors, Colors } from "@/constants/colors";
import { apiCall } from "@/lib/api";
import { useFollow, useSocialCounts } from "@/hooks/useUserSearch";
import { PassportPager } from "@/components/passport/PassportPager";
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
  const activeTabIndex = useSharedValue(0);
  const [activeTab, setActiveTab] = useState(0);

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

  const handleViewMore = useCallback(
    (type: "find" | "discovery") => {
      const routeMap = {
        find: "/collection/finds",
        discovery: "/collection/discoveries",
      };
      router.push({
        pathname: routeMap[type] as any,
        params: { fanId: id },
      });
    },
    [router, id]
  );

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
  // Finds: all artists the user has found, including those where user is the Founder
  const finds = collections.filter(
    (c) => c.collection_type === "find" || c.is_founder === true
  );
  // Founders: subset of Finds where user holds the Founder Badge
  const founders = collections.filter((c) => c.is_founder === true);
  const discoveries = collections.filter(
    (c) =>
      c.collection_type === "discovery" ||
      (!c.collection_type && !c.verified && !c.is_founder && c.capture_method === "online")
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "transparent" }}
        edges={["top"]}
      >
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

        {/* Profile header: Avatar + Stats + Follow */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: 12,
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
              <StatCell value={String(founders.length)} label="Founders" />
            </View>
          </View>

          {/* City */}
          {fan.city && (
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Poppins_400Regular",
                color: colors.textSecondary,
                marginTop: 10,
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
              marginTop: 14,
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

        {/* 4-tab pager with glass cards — same as passport */}
        <PassportPager
          finds={finds}
          founders={founders}
          discoveries={discoveries}
          badges={[]}
          activeTabIndex={activeTabIndex}
          onTabChange={setActiveTab}
          onViewMore={handleViewMore}
          onBadgeTap={() => {}}
          onFetchMore={undefined}
          isFetchingMore={false}
        />
      </SafeAreaView>
    </View>
  );
}
