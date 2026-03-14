import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { DecibelRefreshControl } from "@/components/ui/PullToRefresh";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, ListMusic, Compass, Trophy } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import {
  ActivityFeedCard,
  ActivityFeedEmpty,
} from "@/components/home/ActivityFeedCard";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import type { ActivityFeedItem } from "@/types";

function GradientTitle() {
  const colors = useThemeColors();
  return (
    <Svg height={36} width={180}>
      <Defs>
        <SvgLinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={colors.pink} />
          <Stop offset="0.5" stopColor={colors.purple} />
          <Stop offset="1" stopColor={colors.blue} />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill="url(#grad)"
        fontSize="28"
        fontWeight="bold"
        fontFamily="Poppins_700Bold"
        x="90"
        y="28"
        textAnchor="middle"
      >
        DECIBEL
      </SvgText>
    </Svg>
  );
}

export default function HomeScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const activityFeed = useActivityFeed();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await activityFeed.refetch();
    setRefreshing(false);
  }, [activityFeed]);

  const feedItems = useMemo(
    () => activityFeed.data?.pages.flatMap((p) => p.items) ?? [],
    [activityFeed.data]
  );

  const handleLoadMoreFeed = useCallback(() => {
    if (activityFeed.hasNextPage && !activityFeed.isFetchingNextPage) {
      activityFeed.fetchNextPage();
    }
  }, [activityFeed]);

  const ListHeader = (
    <>
      {/* Top bar: Map | DECIBEL | Search */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 8,
          paddingBottom: 12,
          paddingHorizontal: 20,
        }}
      >
        <View style={{ flex: 1, flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => router.push("/jukebox")}
            hitSlop={12}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ListMusic size={20} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/leaderboard")}
            hitSlop={12}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trophy size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <GradientTitle />

        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Pressable
            onPress={() => router.push("/search")}
            hitSlop={12}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Search size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Discovery Feed Header */}
      <View style={{ marginBottom: 16, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ marginRight: 8 }}>
            <Compass size={14} color={colors.purple} />
          </View>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              fontFamily: "Poppins_600SemiBold",
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            Discovery Feed
          </Text>
        </View>
        <Text
          style={{
            color: colors.textDim,
            fontSize: 12,
            fontFamily: "Poppins_400Regular",
            marginTop: 2,
          }}
        >
          See what fans are discovering
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top"]}
    >
      <FlatList<ActivityFeedItem>
        data={feedItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <ActivityFeedCard item={item} />
          </View>
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          activityFeed.isLoading ? (
            <View style={{ paddingVertical: 32, alignItems: "center" }}>
              <ActivityIndicator color={colors.pink} />
            </View>
          ) : (
            <View style={{ paddingHorizontal: 20 }}>
              <ActivityFeedEmpty />
            </View>
          )
        }
        ListFooterComponent={
          <>
            {activityFeed.isFetchingNextPage && (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator color={colors.pink} />
              </View>
            )}
            <View style={{ height: 20 }} />
          </>
        }
        onEndReached={handleLoadMoreFeed}
        onEndReachedThreshold={0.3}
        refreshControl={
          <DecibelRefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />
    </SafeAreaView>
  );
}
