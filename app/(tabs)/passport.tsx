import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useQueryClient } from "@tanstack/react-query";
import { Disc } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/constants/colors";
import { useAuthStore } from "@/stores/authStore";
import { usePassportStats, usePassportCollections } from "@/hooks/usePassport";
import { useFanBadges } from "@/hooks/useBadges";
import { useSocialCounts } from "@/hooks/useUserSearch";
import {
  usePassportShareCardV2,
  useArtistShareCard,
  useBadgeShareCard,
} from "@/hooks/useShareCard";
import { PassportHeader } from "@/components/passport/PassportHeader";
import { StampsSection } from "@/components/passport/StampsSection";
import { FindsGrid } from "@/components/passport/FindsGrid";
import { BadgeGrid } from "@/components/passport/BadgeGrid";
import { BadgeDetailModal } from "@/components/passport/BadgeDetailModal";
import { ShareSheet } from "@/components/passport/ShareSheet";
import { DecibelRefreshControl } from "@/components/ui/PullToRefresh";
import { PassportSkeleton } from "@/components/ui/SkeletonLoader";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiCall } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { BadgeWithStatus } from "@/types/badges";

const VISIBLE_STAMPS = 6;

type FanProfile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  city: string | null;
  created_at: string;
  spotify_connected_at: string | null;
};

function useFanProfile() {
  const user = useAuthStore((s) => s.user);
  return useQuery<FanProfile | null>({
    queryKey: ["fanProfile", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      try {
        const data = await apiCall<{ fan: FanProfile }>(
          "/mobile/passport?page=0"
        );
        return data.fan;
      } catch {
        return null;
      }
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!user?.email,
  });
}

export default function PassportScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColors();
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStatus | null>(
    null
  );
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [shareImageUri, setShareImageUri] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | undefined>(undefined);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const queryClient = useQueryClient();
  const scrollY = useSharedValue(0);

  const { data: fanProfile } = useFanProfile();
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = usePassportStats();
  const {
    data: collectionPages,
    isLoading: collectionsLoading,
    isError: collectionsError,
    refetch: refetchCollections,
  } = usePassportCollections();
  const { data: badges } = useFanBadges();
  const { data: socialCounts } = useSocialCounts();

  const passportShare = usePassportShareCardV2();

  const collections = collectionPages?.pages.flat() ?? [];

  // Split into Finds (online: founded/discovered) and Stamps (live: collected/verified)
  const finds = collections.filter(
    (c) => !c.verified && (c.is_founder || !c.verified)
  );
  const stamps = collections.filter((c) => c.verified);

  const visibleFinds = finds.slice(0, VISIBLE_STAMPS);
  const visibleStamps = stamps.slice(0, 5);

  const fanSlug = user?.email?.split("@")[0] ?? "user";

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["passportStats"] }),
      queryClient.invalidateQueries({ queryKey: ["passportCollections"] }),
      queryClient.invalidateQueries({ queryKey: ["fanProfile"] }),
      queryClient.invalidateQueries({ queryKey: ["fanBadges"] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const handleSharePassport = useCallback(async () => {
    if (!stats) return;
    const displayName = fanProfile?.name ?? "Fan";
    const publicUrl = `https://decible.live/u/${encodeURIComponent(fanSlug)}`;

    setShareImageUri(null);
    setShareUrl(publicUrl);
    setIsGeneratingCard(true);
    setShareSheetVisible(true);

    try {
      // Collect top 4 artist photo URLs (finds first, then stamps)
      const topPhotos = collections
        .map((c) => c.performer?.photo_url ?? null)
        .filter((url): url is string => !!url)
        .filter((url, idx, arr) => arr.indexOf(url) === idx)
        .slice(0, 4);

      const uri = await passportShare.generate({
        name: displayName,
        artistsFound: finds.length,
        showsAttended: stamps.length,
        venues: stats.uniqueVenues,
        topPhotos,
      });
      setShareImageUri(uri);
    } catch {
      // Error handled by hook
    } finally {
      setIsGeneratingCard(false);
    }
  }, [stats, fanProfile, fanSlug, collections, finds, stamps, passportShare]);

  const isLoading = statsLoading || collectionsLoading;
  const isError = statsError || collectionsError;

  if (isError && !isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ErrorState
          onRetry={() => {
            refetchStats();
            refetchCollections();
          }}
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <PassportSkeleton />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <DecibelRefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <PassportHeader
          displayName={fanProfile?.name ?? null}
          avatarUrl={fanProfile?.avatar_url ?? null}
          memberSince={
            stats?.memberSince ??
            fanProfile?.created_at ??
            new Date().toISOString()
          }
          followingCount={socialCounts?.following_count ?? 0}
          followersCount={socialCounts?.followers_count ?? 0}
          findsCount={finds.length}
          stampsCount={stamps.length}
          fanId={fanProfile?.id ?? ""}
          onSettingsPress={() => router.push("/settings")}
          scrollY={scrollY}
        />

        {/* Share Passport button */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 8 }}>
          <TouchableOpacity
            onPress={handleSharePassport}
            activeOpacity={0.85}
            disabled={passportShare.isLoading}
          >
            <LinearGradient
              colors={[colors.purple, colors.pink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "Poppins_700Bold",
                  color: "#FFFFFF",
                }}
              >
                {passportShare.isLoading ? "Generating..." : "Share Passport"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Finds section */}
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
            Finds
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Poppins_400Regular",
              color: colors.lightGray,
            }}
          >
            {finds.length} artist{finds.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {finds.length > 0 ? (
          <FindsGrid finds={visibleFinds} totalCount={finds.length} />
        ) : (
          <EmptyState
            icon={<Disc size={32} color={colors.lightGray} />}
            title="No finds yet"
            subtitle="Add artists from the + tab to start your collection"
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
              color: colors.lightGray,
            }}
          >
            {stamps.length} show{stamps.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {stamps.length > 0 ? (
          <StampsSection stamps={visibleStamps} totalCount={stamps.length} />
        ) : (
          <EmptyState
            icon={<Disc size={32} color={colors.lightGray} />}
            title="No stamps yet"
            subtitle='Check in at a live show from the + tab to earn stamps'
          />
        )}

        {/* Badges section */}
        {badges && badges.length > 0 && (
          <View style={{ paddingTop: 16 }}>
            <BadgeGrid
              badges={badges}
              onBadgeTap={(badge) => setSelectedBadge(badge)}
            />
          </View>
        )}
      </Animated.ScrollView>

      {/* Badge detail modal */}
      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}

      {/* Share sheet */}
      <ShareSheet
        visible={shareSheetVisible}
        onClose={() => {
          setShareSheetVisible(false);
          setShareImageUri(null);
        }}
        imageUri={shareImageUri}
        shareUrl={shareUrl}
        isGenerating={isGeneratingCard}
      />
    </View>
  );
}
