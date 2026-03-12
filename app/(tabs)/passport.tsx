import { useState, useCallback } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue } from "react-native-reanimated";
import { useQueryClient } from "@tanstack/react-query";
import { Trophy } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/constants/colors";
import { useAuthStore } from "@/stores/authStore";
import {
  usePassportStats,
  usePassportCollections,
  usePassportCollectionsSplit,
} from "@/hooks/usePassport";
import { useFanBadges } from "@/hooks/useBadges";
import { useSocialCounts } from "@/hooks/useUserSearch";
import {
  usePassportShareCardV2,
} from "@/hooks/useShareCard";
import { PassportHeader } from "@/components/passport/PassportHeader";
import { PassportPager } from "@/components/passport/PassportPager";
import { OrbBackground } from "@/components/passport/OrbBackground";
import { BadgeGrid } from "@/components/passport/BadgeGrid";
import { BadgeDetailModal } from "@/components/passport/BadgeDetailModal";
import { ShareSheet } from "@/components/passport/ShareSheet";
import { PassportSkeleton } from "@/components/ui/SkeletonLoader";
import { ErrorState } from "@/components/ui/ErrorState";
import { apiCall } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { BadgeWithStatus } from "@/types/badges";

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
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColors();

  // Modal/sheet state
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStatus | null>(null);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [shareImageUri, setShareImageUri] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | undefined>(undefined);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  // Shared value for OrbBackground + tab pill (BOTH use this)
  const activeTabIndex = useSharedValue(0);
  const [activeTab, setActiveTab] = useState(0);

  const queryClient = useQueryClient();

  const { data: fanProfile } = useFanProfile();
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = usePassportStats();
  const {
    isLoading: collectionsLoading,
    isError: collectionsError,
    refetch: refetchCollections,
  } = usePassportCollections();
  const { stamps, finds, discoveries } = usePassportCollectionsSplit();
  const { data: badges } = useFanBadges();
  const { data: socialCounts } = useSocialCounts();

  const passportShare = usePassportShareCardV2();

  const fanSlug = user?.email?.split("@")[0] ?? "user";
  const allCollections = [...stamps, ...finds, ...discoveries];

  const handleSharePassport = useCallback(async () => {
    if (!stats) return;
    const displayName = fanProfile?.name ?? "Fan";
    const publicUrl = `https://decible.live/u/${encodeURIComponent(fanSlug)}`;

    setShareImageUri(null);
    setShareUrl(publicUrl);
    setIsGeneratingCard(true);
    setShareSheetVisible(true);

    try {
      const topPhotos = allCollections
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
  }, [stats, fanProfile, fanSlug, allCollections, finds, stamps, passportShare]);

  const handleViewMore = useCallback(
    (type: "stamp" | "find" | "discovery") => {
      const routeMap = {
        stamp: "/collection/stamps",
        find: "/collection/finds",
        discovery: "/collection/discoveries",
      };
      router.push(routeMap[type] as any);
    },
    [router]
  );

  const isLoading = statsLoading || collectionsLoading;
  const isError = statsError || collectionsError;

  if (isError && !isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.bg }}
        edges={["top"]}
      >
        <ErrorState
          onRetry={() => {
            refetchStats();
            refetchCollections();
          }}
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.bg }}
        edges={["top"]}
      >
        <PassportSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Orb background — renders behind entire screen (outside SafeAreaView) */}
      <OrbBackground activeTabIndex={activeTabIndex} />

      <SafeAreaView
        style={{ flex: 1, backgroundColor: "transparent" }}
        edges={["top"]}
      >
        {/* Pinned header — NOT in a ScrollView, no gesture conflict */}
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
          onSharePress={handleSharePassport}
          isSharing={passportShare.isLoading || isGeneratingCard}
        />

        {/* 3-tab pager takes remaining flex space */}
        <PassportPager
          stamps={stamps}
          finds={finds}
          discoveries={discoveries}
          activeTabIndex={activeTabIndex}
          onTabChange={setActiveTab}
          onViewMore={handleViewMore}
        />

        {/* Badges section — horizontal scroll row below pager */}
        {badges && badges.length > 0 && (
          <View style={{ maxHeight: 160 }}>
            <BadgeGrid
              badges={badges}
              onBadgeTap={(badge) => setSelectedBadge(badge)}
            />
          </View>
        )}
      </SafeAreaView>

      {/* Leaderboard trophy — absolute overlay top-right (stays above SafeAreaView) */}
      <Pressable
        onPress={() => router.push("/leaderboard")}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{
          position: "absolute",
          top: insets.top + 12,
          right: 16,
          zIndex: 10,
          width: 40,
          height: 40,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Trophy size={20} color={colors.textSecondary} />
      </Pressable>

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
