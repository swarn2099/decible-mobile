import { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import PagerView from "react-native-pager-view";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { CollectionGrid } from "./GlassGrid";
import { useThemeColors } from "@/constants/colors";
import { RARITY_COLORS } from "@/constants/badges";
import type { CollectionStamp } from "@/types/passport";
import type { BadgeRarity, BadgeWithStatus } from "@/types/badges";

const TAB_LABELS = ["Finds", "Discoveries", "Badges"] as const;

// ─── Rarity glow config ────────────────────────────────────────────────
function getGlowConfig(rarity: BadgeRarity) {
  switch (rarity) {
    case "common":    return { shadowOpacity: 0.2, shadowRadius: 4,  elevation: 2 };
    case "rare":      return { shadowOpacity: 0.35, shadowRadius: 8,  elevation: 4 };
    case "epic":      return { shadowOpacity: 0.5,  shadowRadius: 12, elevation: 6 };
    case "legendary": return { shadowOpacity: 0.7,  shadowRadius: 18, elevation: 8 };
  }
}

// Rarity weight for sorting locked badges (legendary first = lowest weight)
function getRarityWeight(rarity: BadgeRarity): number {
  switch (rarity) {
    case "legendary": return 0;
    case "epic":      return 1;
    case "rare":      return 2;
    case "common":    return 3;
  }
}

// ─── Badge Tab Grid ────────────────────────────────────────────────────
function BadgeGrid({
  badges,
  onBadgeTap,
}: {
  badges: BadgeWithStatus[];
  onBadgeTap: (badge: BadgeWithStatus) => void;
}) {
  const colors = useThemeColors();

  // Sort: earned first (newest first), then locked (legendary first by rarity weight)
  const sorted = [...badges].sort((a, b) => {
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    if (a.earned && b.earned) {
      // Both earned: sort by earned_at descending (newest first)
      const aDate = a.earned_at ? new Date(a.earned_at).getTime() : 0;
      const bDate = b.earned_at ? new Date(b.earned_at).getTime() : 0;
      return bDate - aDate;
    }
    // Both locked: sort by rarity weight (legendary=0 first)
    return getRarityWeight(a.rarity) - getRarityWeight(b.rarity);
  });

  // Build rows of 3
  const rows: BadgeWithStatus[][] = [];
  for (let i = 0; i < sorted.length; i += 3) {
    rows.push(sorted.slice(i, i + 3));
  }

  if (badges.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 64, gap: 12 }}>
        <Text style={{ fontSize: 40 }}>🏅</Text>
        <Text
          style={{
            fontSize: 16,
            fontFamily: "Poppins_500Medium",
            color: colors.textSecondary,
          }}
        >
          No badges yet
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontFamily: "Poppins_400Regular",
            color: colors.textTertiary,
          }}
        >
          Keep collecting to earn badges
        </Text>
      </View>
    );
  }

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <View style={{ padding: 16, paddingBottom: 40 }}>
      {/* Count header — "Badges (3/12)" format */}
      <Text
        style={{
          fontSize: 13,
          fontFamily: "Poppins_500Medium",
          color: colors.textSecondary,
          marginBottom: 16,
        }}
      >
        Badges ({earnedCount}/{badges.length})
      </Text>

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
            const glowConfig = getGlowConfig(badge.rarity);
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
                          // Earned: full color with rarity-scaled glow
                          borderWidth: 2,
                          borderColor: rarityColor,
                          shadowColor: rarityColor,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: glowConfig.shadowOpacity,
                          shadowRadius: glowConfig.shadowRadius,
                          elevation: glowConfig.elevation,
                        }
                      : {
                          // Locked: no border, no background, no glow — pure ghost
                          borderWidth: 0,
                          backgroundColor: "transparent",
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
                      // Locked badges: 0.3 opacity ghost icon
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
                    color: badge.earned ? colors.text : colors.textSecondary,
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
    </View>
  );
}

// ─── Passport Pager ────────────────────────────────────────────────────
interface PassportPagerProps {
  finds: CollectionStamp[];
  discoveries: CollectionStamp[];
  badges: BadgeWithStatus[];
  onViewMore: (type: "find" | "discovery") => void;
  onBadgeTap: (badge: BadgeWithStatus) => void;
  activeTabIndex: SharedValue<number>;
  onTabChange: (index: number) => void;
  // Infinite scroll support
  onFetchMore?: () => void;
  isFetchingMore?: boolean;
}

export function PassportPager({
  finds,
  discoveries,
  badges,
  onBadgeTap,
  activeTabIndex,
  onTabChange,
  onFetchMore,
  isFetchingMore,
}: PassportPagerProps) {
  const { width: screenWidth } = useWindowDimensions();
  const colors = useThemeColors();
  const pagerRef = useRef<PagerView>(null);
  const [activeTab, setActiveTab] = useState(0);

  const TAB_WIDTH = screenWidth / 3;
  const underlineX = useSharedValue(0);

  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: underlineX.value }],
  }));

  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    const position = e.nativeEvent.position;
    setActiveTab(position);
    onTabChange(position);
    activeTabIndex.value = position;
    underlineX.value = withTiming(position * TAB_WIDTH, { duration: 200 });
  };

  const handlePageScroll = (e: {
    nativeEvent: { position: number; offset: number };
  }) => {
    const continuous = e.nativeEvent.position + e.nativeEvent.offset;
    underlineX.value = continuous * TAB_WIDTH;
    activeTabIndex.value = continuous;
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Tab bar */}
      <View
        style={{
          backgroundColor: colors.bg,
          position: "relative",
          borderTopWidth: 1,
          borderTopColor: colors.cardBorder,
          borderBottomWidth: 1,
          borderBottomColor: colors.cardBorder,
          marginTop: 8,
        }}
      >
        <View style={{ flexDirection: "row" }}>
          {TAB_LABELS.map((label, i) => (
            <Pressable
              key={i}
              onPress={() => handleTabPress(i)}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily:
                    activeTab === i
                      ? "Poppins_600SemiBold"
                      : "Poppins_500Medium",
                  color: activeTab === i ? colors.text : colors.textSecondary,
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Animated pink underline */}
        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: 0,
              height: 2,
              width: TAB_WIDTH * 0.5,
              marginLeft: TAB_WIDTH * 0.25,
              backgroundColor: colors.pink,
              borderRadius: 1,
            },
            underlineStyle,
          ]}
        />

      </View>

      {/* PagerView */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handlePageSelected}
        onPageScroll={handlePageScroll}
      >
        {/* Page 0 — Finds (artists YOU added to Decibel — you were first) */}
        <View key="0" style={{ flex: 1 }}>
          <CollectionGrid
            items={finds}
            type="find"
            onEndReached={onFetchMore}
            isLoadingMore={isFetchingMore}
          />
        </View>

        {/* Page 1 — Discoveries (artists you found on Decibel that someone else added) */}
        <View key="1" style={{ flex: 1 }}>
          <CollectionGrid
            items={discoveries}
            type="discovery"
            onEndReached={onFetchMore}
            isLoadingMore={isFetchingMore}
          />
        </View>

        {/* Page 2 — Badges */}
        <ScrollView
          key="2"
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <BadgeGrid badges={badges} onBadgeTap={onBadgeTap} />
        </ScrollView>
      </PagerView>
    </View>
  );
}
