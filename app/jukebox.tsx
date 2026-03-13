import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Music2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useCallback, useRef, useState } from "react";
import { useThemeColors } from "@/constants/colors";
import { useJukebox } from "@/hooks/useJukebox";
import { useMyCollectedIds } from "@/hooks/useMyCollectedIds";
import { useDiscoverArtist } from "@/hooks/useDiscoverArtist";
import { JukeboxCard } from "@/components/jukebox/JukeboxCard";
import type { JukeboxItem } from "@/types/jukebox";

// --- WebView Pool constants ---
const MAX_ACTIVE_WEBVIEWS = 3;

// --- Empty state ---
function JukeboxEmpty() {
  const colors = useThemeColors();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        paddingTop: 80,
      }}
    >
      <Music2 size={48} color={colors.textTertiary} style={{ marginBottom: 16 }} />
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 18,
          fontFamily: "Poppins_600SemiBold",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        No Finds yet
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 14,
          fontFamily: "Poppins_400Regular",
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Follow people to see their discoveries here
      </Text>
    </View>
  );
}

export default function JukeboxScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  // Data hooks
  const {
    items,
    isFallback,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useJukebox();

  const { collectedIds } = useMyCollectedIds();
  const { mutate: discoverArtistMutate } = useDiscoverArtist();

  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // --- WebView pool (JBX-06): max 3 active WebViews at once ---
  // We track the ordered list of visible item IDs (via onViewableItemsChanged)
  // and cap to MAX_ACTIVE_WEBVIEWS.
  const activeKeysRef = useRef<string[]>([]);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300,
  });

  const onViewableItemsChanged = useRef(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      const visibleIds = info.viewableItems
        .filter((t) => t.isViewable && t.item != null)
        .map((t) => (t.item as JukeboxItem).id);

      // Merge new visible IDs into ordered active list, evict oldest when over limit
      const existingActive = activeKeysRef.current;
      const merged: string[] = [];

      // Keep currently active IDs that are still visible or recently loaded
      for (const id of existingActive) {
        if (visibleIds.includes(id)) merged.push(id);
      }

      // Add newly visible IDs not already in list
      for (const id of visibleIds) {
        if (!merged.includes(id)) merged.push(id);
      }

      // Enforce pool limit — keep only last MAX_ACTIVE_WEBVIEWS
      const capped = merged.slice(-MAX_ACTIVE_WEBVIEWS);
      activeKeysRef.current = capped;
      setActiveKeys(new Set(capped));
    }
  );

  // --- Discover handler (JBX-09) ---
  const handleDiscover = useCallback(
    (performerId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      discoverArtistMutate({ performerId });
    },
    [discoverArtistMutate]
  );

  // --- Infinite scroll ---
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <ChevronLeft size={20} color={colors.textSecondary} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 20,
              fontFamily: "Poppins_700Bold",
            }}
          >
            Jukebox
          </Text>
          <Text
            style={{
              color: colors.textTertiary,
              fontSize: 12,
              fontFamily: "Poppins_400Regular",
              marginTop: -2,
            }}
          >
            {isFallback ? "From the community" : "From people you follow"}
          </Text>
        </View>
      </View>

      {/* Feed */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.pink} size="large" />
        </View>
      ) : (
        <FlatList<JukeboxItem>
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <JukeboxCard
              item={item}
              isPlayerActive={activeKeys.has(item.id)}
              isCollected={collectedIds.has(item.performer_id)}
              onDiscover={handleDiscover}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 100, // floating tab bar
            paddingTop: 4,
            flexGrow: 1,
          }}
          ListEmptyComponent={<JukeboxEmpty />}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator color={colors.pink} />
              </View>
            ) : null
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          viewabilityConfig={viewabilityConfig.current}
          onViewableItemsChanged={onViewableItemsChanged.current}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.pink}
              colors={[colors.pink]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
