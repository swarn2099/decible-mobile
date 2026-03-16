import { useState, useCallback, useMemo } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Tabs } from "react-native-collapsible-tab-view";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import {
  usePassportStats,
  usePassportCollections,
} from "@/hooks/usePassport";
import { useFanBadges } from "@/hooks/useBadges";
import { useSocialCounts } from "@/hooks/useUserSearch";
import { usePassportShareCardV2 } from "@/hooks/useShareCard";
import { PassportHeader } from "@/components/passport/PassportHeader";
import { CollectionGrid } from "@/components/passport/GlassGrid";
import { BadgeDetailModal } from "@/components/passport/BadgeDetailModal";
import { ShareSheet } from "@/components/passport/ShareSheet";
import { PassportSkeleton } from "@/components/ui/SkeletonLoader";
import { ErrorState } from "@/components/ui/ErrorState";
import { useThemeColors } from "@/constants/colors";
import { apiCall } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { BadgeWithStatus } from "@/types/badges";
import type { CollectionStamp } from "@/types/passport";

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
        const data = await apiCall<{ fan: FanProfile }>("/mobile/passport?page=0");
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
  const colors = useThemeColors();
  const { width: screenWidth } = useWindowDimensions();

  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStatus | null>(null);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [shareImageUri, setShareImageUri] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | undefined>(undefined);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

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
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePassportCollections();

  const flatCollections: CollectionStamp[] =
    usePassportCollections().data?.pages.flat() ?? [];

  const finds = flatCollections.filter(
    (c) => c.collection_type === "find" || c.is_founder === true
  );
  const discoveries = flatCollections.filter(
    (c) =>
      c.collection_type === "discovery" ||
      (!c.collection_type && !c.is_founder && c.capture_method === "online")
  );

  const { data: badges } = useFanBadges();
  const { data: socialCounts } = useSocialCounts();

  const passportShare = usePassportShareCardV2();
  const user = useAuthStore((s) => s.user);
  const fanSlug = user?.email?.split("@")[0] ?? "user";

  const handleSharePassport = useCallback(async () => {
    if (!stats) return;
    const displayName = fanProfile?.name ?? "Fan";
    const publicUrl = `https://decible.live/u/${encodeURIComponent(fanSlug)}`;

    setShareImageUri(null);
    setShareUrl(publicUrl);
    setIsGeneratingCard(true);
    setShareSheetVisible(true);

    try {
      const topPhotos = finds
        .map((c) => c.performer?.photo_url ?? null)
        .filter((url): url is string => !!url)
        .filter((url, idx, arr) => arr.indexOf(url) === idx)
        .slice(0, 3);

      const uri = await passportShare.generate({
        name: displayName,
        finds: finds.length,
        founders: finds.length,
        influence: 0,
        topPhotos,
        avatarUrl: fanProfile?.avatar_url ?? undefined,
      });
      setShareImageUri(uri);
    } catch {
      // handled by hook
    } finally {
      setIsGeneratingCard(false);
    }
  }, [stats, fanProfile, fanSlug, finds, passportShare]);

  const isLoading = statsLoading || collectionsLoading;
  const isError = statsError || collectionsError;

  if (isError && !isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <ErrorState onRetry={() => { refetchStats(); refetchCollections(); }} />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <PassportSkeleton />
      </SafeAreaView>
    );
  }

  const CELL_GAP = 3;
  const COLUMNS = 3;
  const cellSize = (screenWidth - CELL_GAP * (COLUMNS + 1)) / COLUMNS;

  const renderHeader = () => (
    <PassportHeader
      displayName={fanProfile?.name ?? null}
      avatarUrl={fanProfile?.avatar_url ?? null}
      memberSince={stats?.memberSince ?? fanProfile?.created_at ?? new Date().toISOString()}
      followersCount={socialCounts?.followers_count ?? 0}
      followingCount={socialCounts?.following_count ?? 0}
      findsCount={finds.length}
      discoveriesCount={discoveries.length}
      fanId={fanProfile?.id ?? ""}
      onSharePress={handleSharePassport}
      isSharing={passportShare.isLoading || isGeneratingCard}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["top"]}>
        <Tabs.Container
          renderHeader={renderHeader}
          headerContainerStyle={{ backgroundColor: colors.bg, shadowOpacity: 0, elevation: 0 }}
          containerStyle={{ backgroundColor: colors.bg }}
          renderTabBar={(props) => (
            <View
              style={{
                backgroundColor: colors.bg,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
              }}
            >
              <View style={{ flexDirection: "row" }}>
                {props.tabNames.map((name, i) => {
                  const isActive = props.indexDecimal.value !== undefined
                    ? Math.round(props.indexDecimal.value) === i
                    : i === 0;
                  return (
                    <View key={name} style={{ flex: 1, alignItems: "center", paddingVertical: 12 }}>
                      <Text
                        onPress={() => props.onTabPress(name)}
                        style={{
                          fontSize: 14,
                          fontFamily: isActive ? "Poppins_600SemiBold" : "Poppins_500Medium",
                          color: isActive ? colors.text : colors.textSecondary,
                        }}
                      >
                        {name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        >
          <Tabs.Tab name="Finds">
            <Tabs.FlatList
              data={finds}
              keyExtractor={(item) => item.id}
              numColumns={3}
              columnWrapperStyle={{ gap: CELL_GAP, paddingHorizontal: CELL_GAP }}
              contentContainerStyle={{ gap: CELL_GAP, paddingTop: CELL_GAP, paddingBottom: 120 }}
              renderItem={({ item }) => (
                <CollectionGridCell item={item} type="find" cellSize={cellSize} />
              )}
              ListEmptyComponent={
                <EmptyTab label="No finds yet" description="Add an artist to start your collection!" />
              }
            />
          </Tabs.Tab>

          <Tabs.Tab name="Discoveries">
            <Tabs.FlatList
              data={discoveries}
              keyExtractor={(item) => item.id}
              numColumns={3}
              columnWrapperStyle={{ gap: CELL_GAP, paddingHorizontal: CELL_GAP }}
              contentContainerStyle={{ gap: CELL_GAP, paddingTop: CELL_GAP, paddingBottom: 120 }}
              renderItem={({ item }) => (
                <CollectionGridCell item={item} type="discovery" cellSize={cellSize} />
              )}
              ListEmptyComponent={
                <EmptyTab label="No discoveries yet" description="Discover artists from the feed!" />
              }
            />
          </Tabs.Tab>

          <Tabs.Tab name="Badges">
            <Tabs.ScrollView contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}>
              <BadgeGridSimple badges={badges ?? []} onBadgeTap={setSelectedBadge} />
            </Tabs.ScrollView>
          </Tabs.Tab>
        </Tabs.Container>
      </SafeAreaView>

      {selectedBadge && (
        <BadgeDetailModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
      )}

      <ShareSheet
        visible={shareSheetVisible}
        onClose={() => { setShareSheetVisible(false); setShareImageUri(null); }}
        imageUri={shareImageUri}
        shareUrl={shareUrl}
        isGenerating={isGeneratingCard}
      />
    </View>
  );
}

// ─── Grid Cell (inline, avoids importing the full CollectionGrid FlatList) ────

function CollectionGridCell({
  item,
  type,
  cellSize,
}: {
  item: CollectionStamp;
  type: "find" | "discovery";
  cellSize: number;
}) {
  const colors = useThemeColors();
  const router = useRouter();

  const overlay = () => {
    if (type === "find") {
      return (
        <>
          <Text style={styles.cellName} numberOfLines={1}>{item.performer?.name ?? "Unknown"}</Text>
          <Text style={styles.cellSecondary} numberOfLines={1}>
            {item.is_founder ? "★ Founded" : "Added"}
          </Text>
        </>
      );
    }
    return (
      <>
        <Text style={styles.cellName} numberOfLines={1}>{item.performer?.name ?? "Unknown"}</Text>
        <Text style={styles.cellSecondary} numberOfLines={1}>
          {item.finder_username ? `via @${item.finder_username}` : "Discovered"}
        </Text>
      </>
    );
  };

  return (
    <View
      style={{
        width: cellSize,
        height: cellSize,
        borderRadius: 6,
        overflow: "hidden",
        backgroundColor: colors.card,
      }}
    >
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        {item.performer?.photo_url ? (
          <Image
            source={{ uri: item.performer.photo_url }}
            style={{ width: cellSize, height: cellSize }}
            contentFit="cover"
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.card, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 24, color: colors.textSecondary }}>
              {(item.performer?.name ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      {/* Frost overlay */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "40%",
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
          paddingHorizontal: 6,
          paddingBottom: 4,
        }}
      >
        {overlay()}
      </View>
      {/* Tap target */}
      <View
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        onTouchEnd={() => {
          if (item.performer?.slug) router.push(`/artist/${item.performer.slug}`);
        }}
      />
    </View>
  );
}

const styles = {
  cellName: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  } as const,
  cellSecondary: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontFamily: "Poppins_400Regular",
  } as const,
};

// ─── Simple Badge Grid ───────────────────────────────────────────────────────

function BadgeGridSimple({
  badges,
  onBadgeTap,
}: {
  badges: BadgeWithStatus[];
  onBadgeTap: (badge: BadgeWithStatus) => void;
}) {
  const colors = useThemeColors();

  const sorted = [...badges].sort((a, b) => {
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    return 0;
  });

  if (badges.length === 0) {
    return <EmptyTab label="No badges yet" description="Earn badges by discovering artists!" />;
  }

  const rows: BadgeWithStatus[][] = [];
  for (let i = 0; i < sorted.length; i += 3) {
    rows.push(sorted.slice(i, i + 3));
  }

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row", justifyContent: "flex-start", gap: 16, marginBottom: 20 }}>
          {row.map((badge) => (
            <View
              key={badge.id}
              onTouchEnd={() => onBadgeTap(badge)}
              style={{ alignItems: "center", width: 80 }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: badge.earned ? `${colors.pink}20` : "transparent",
                  opacity: badge.earned ? 1 : 0.3,
                }}
              >
                <Text style={{ fontSize: 28 }}>{badge.icon}</Text>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: badge.earned ? "Poppins_500Medium" : "Poppins_400Regular",
                  color: badge.earned ? colors.text : colors.textSecondary,
                  marginTop: 6,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                {badge.name}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function EmptyTab({ label, description }: { label: string; description: string }) {
  const colors = useThemeColors();
  return (
    <View style={{ alignItems: "center", paddingVertical: 60, paddingHorizontal: 32 }}>
      <Text style={{ fontSize: 16, fontFamily: "Poppins_600SemiBold", color: colors.text, marginBottom: 8 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: colors.textSecondary, textAlign: "center" }}>
        {description}
      </Text>
    </View>
  );
}
