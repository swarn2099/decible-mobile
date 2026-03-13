import { useState, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSharedValue } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { X } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import {
  usePassportStats,
  usePassportCollections,
  usePassportCollectionsSplit,
} from "@/hooks/usePassport";
import { useFanBadges } from "@/hooks/useBadges";
import { useSocialCounts } from "@/hooks/useUserSearch";
import { usePassportShareCardV2 } from "@/hooks/useShareCard";
import { PassportHeader } from "@/components/passport/PassportHeader";
import { PassportPager } from "@/components/passport/PassportPager";
import { OrbBackground } from "@/components/passport/OrbBackground";
import { BadgeDetailModal } from "@/components/passport/BadgeDetailModal";
import { ShareSheet } from "@/components/passport/ShareSheet";
import { PassportSkeleton } from "@/components/ui/SkeletonLoader";
import { ErrorState } from "@/components/ui/ErrorState";
import { RARITY_COLORS } from "@/constants/badges";
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

const BG = "#0B0B0F";

// ─── Badges Full-Screen Modal ────────────────────────────────────────
function BadgesModal({
  visible,
  badges,
  onClose,
  onBadgeTap,
}: {
  visible: boolean;
  badges: BadgeWithStatus[];
  onClose: () => void;
  onBadgeTap: (badge: BadgeWithStatus) => void;
}) {
  const earnedCount = badges.filter((b) => b.earned).length;
  const sorted = [...badges].sort((a, b) => {
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    return 0;
  });

  // Build rows of 3
  const rows: BadgeWithStatus[][] = [];
  for (let i = 0; i < sorted.length; i += 3) {
    rows.push(sorted.slice(i, i + 3));
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: BG }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontFamily: "Poppins_700Bold",
                color: "#FFFFFF",
              }}
            >
              Badges ({earnedCount}/{badges.length})
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={24} color="#8E8E93" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {rows.map((row, rowIdx) => (
              <View
                key={rowIdx}
                style={{
                  flexDirection: "row",
                  gap: 12,
                  marginBottom: 20,
                  justifyContent: "center",
                }}
              >
                {row.map((badge) => {
                  const rarityColor = RARITY_COLORS[badge.rarity];

                  return (
                    <TouchableOpacity
                      key={badge.id}
                      style={{ width: "30%", alignItems: "center" }}
                      onPress={() => onBadgeTap(badge)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                          overflow: "hidden",
                          alignItems: "center",
                          justifyContent: "center",
                          ...(badge.earned
                            ? {
                                borderWidth: 2,
                                borderColor: rarityColor,
                                shadowColor: rarityColor,
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.4,
                                shadowRadius: 8,
                                elevation: 4,
                              }
                            : {
                                backgroundColor: "#15151C",
                              }),
                        }}
                      >
                        {badge.earned && (
                          <LinearGradient
                            colors={[`${rarityColor}33`, `${rarityColor}15`]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                            }}
                          />
                        )}
                        <Text
                          style={{
                            fontSize: 28,
                            opacity: badge.earned ? 1 : 0.3,
                          }}
                        >
                          {badge.icon}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontFamily: badge.earned
                            ? "Poppins_500Medium"
                            : "Poppins_400Regular",
                          fontSize: 11,
                          color: badge.earned ? "#FFFFFF" : "#8E8E93",
                          marginTop: 6,
                          textAlign: "center",
                        }}
                        numberOfLines={1}
                      >
                        {badge.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ─── Passport Screen ─────────────────────────────────────────────────
export default function PassportScreen() {
  const router = useRouter();

  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStatus | null>(null);
  const [badgesModalVisible, setBadgesModalVisible] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [shareImageUri, setShareImageUri] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | undefined>(undefined);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  const activeTabIndex = useSharedValue(0);
  const [_activeTab, setActiveTab] = useState(0);

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
  const user = useAuthStore((s) => s.user);
  const fanSlug = user?.email?.split("@")[0] ?? "user";
  const allCollections = [...stamps, ...finds, ...discoveries];

  const badgesEarned = badges?.filter((b) => b.earned).length ?? 0;
  const badgesTotal = badges?.length ?? 0;

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
      <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}>
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
      <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}>
        <PassportSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <OrbBackground activeTabIndex={activeTabIndex} />

      <SafeAreaView
        style={{ flex: 1, backgroundColor: "transparent" }}
        edges={["top"]}
      >
        <PassportHeader
          displayName={fanProfile?.name ?? null}
          avatarUrl={fanProfile?.avatar_url ?? null}
          memberSince={
            stats?.memberSince ??
            fanProfile?.created_at ??
            new Date().toISOString()
          }
          followersCount={socialCounts?.followers_count ?? 0}
          findsCount={finds.length}
          stampsCount={stamps.length}
          fanId={fanProfile?.id ?? ""}
          onSettingsPress={() => router.push("/settings")}
          onSharePress={handleSharePassport}
          isSharing={passportShare.isLoading || isGeneratingCard}
          badgesEarned={badgesEarned}
          badgesTotal={badgesTotal}
          onBadgesPress={() => setBadgesModalVisible(true)}
        />

        <PassportPager
          stamps={stamps}
          finds={finds}
          discoveries={discoveries}
          activeTabIndex={activeTabIndex}
          onTabChange={setActiveTab}
          onViewMore={handleViewMore}
        />
      </SafeAreaView>

      {/* Badges full-screen modal */}
      {badges && badges.length > 0 && (
        <BadgesModal
          visible={badgesModalVisible}
          badges={badges}
          onClose={() => setBadgesModalVisible(false)}
          onBadgeTap={(badge) => {
            setBadgesModalVisible(false);
            setSelectedBadge(badge);
          }}
        />
      )}

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
