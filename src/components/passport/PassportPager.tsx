import { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import PagerView from "react-native-pager-view";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useThemeColors } from "@/constants/colors";
import { GlassGrid } from "./GlassGrid";
import type { CollectionStamp } from "@/types/passport";

interface PassportPagerProps {
  stamps: CollectionStamp[];
  finds: CollectionStamp[];
  discoveries: CollectionStamp[];
  onViewMore: (type: "stamp" | "find" | "discovery") => void;
  activeTabIndex: SharedValue<number>; // shared with OrbBackground
  onTabChange: (index: number) => void; // for React state sync
}

const TAB_LABELS = ["Stamps", "Finds", "Discoveries"] as const;

export function PassportPager({
  stamps,
  finds,
  discoveries,
  onViewMore,
  activeTabIndex,
  onTabChange,
}: PassportPagerProps) {
  const colors = useThemeColors();
  const { width: screenWidth } = useWindowDimensions();
  const pagerRef = useRef<PagerView>(null);
  const [activeTab, setActiveTab] = useState(0);

  // tabOffset drives smooth pill animation (0..2 continuous during swipe)
  const tabOffset = useSharedValue(0);
  const TAB_WIDTH = screenWidth / 3;

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabOffset.value * TAB_WIDTH }],
  }));

  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  const handlePageSelected = (e: {
    nativeEvent: { position: number };
  }) => {
    const position = e.nativeEvent.position;
    setActiveTab(position);
    onTabChange(position);
    activeTabIndex.value = position;
    tabOffset.value = position;
  };

  const handlePageScroll = (e: {
    nativeEvent: { position: number; offset: number };
  }) => {
    tabOffset.value =
      e.nativeEvent.position + e.nativeEvent.offset;
    // Sync activeTabIndex for OrbBackground — smooth in-between values
    activeTabIndex.value =
      e.nativeEvent.position + e.nativeEvent.offset;
  };

  const tintOverlayColor = colors.isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(0,0,0,0.04)";

  return (
    <View style={{ flex: 1 }}>
      {/* ── Tab bar ── */}
      <View
        style={{
          flexDirection: "row",
          position: "relative",
          marginHorizontal: 16,
          marginBottom: 8,
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: colors.isDark
            ? "rgba(255,255,255,0.04)"
            : "rgba(0,0,0,0.03)",
        }}
      >
        {/* Frosted glass pill — slides behind active tab label */}
        <Animated.View
          style={[
            {
              position: "absolute",
              width: TAB_WIDTH - 32 / 3, // match tab width minus container margins
              height: "100%",
            },
            pillStyle,
          ]}
        >
          <BlurView
            intensity={30}
            tint={colors.isDark ? "dark" : "light"}
            blurMethod="dimezisBlurViewSdk31Plus"
            style={{
              flex: 1,
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: tintOverlayColor,
              }}
            />
          </BlurView>
        </Animated.View>

        {TAB_LABELS.map((label, i) => (
          <Pressable
            key={i}
            onPress={() => handleTabPress(i)}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily:
                  activeTab === i
                    ? "Poppins_600SemiBold"
                    : "Poppins_500Medium",
                color:
                  activeTab === i
                    ? colors.text
                    : colors.textSecondary,
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── PagerView ── */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handlePageSelected}
        onPageScroll={handlePageScroll}
      >
        {/* Page 0 — Stamps */}
        <ScrollView
          key="0"
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          <GlassGrid
            items={stamps}
            type="stamp"
            onViewMore={() => onViewMore("stamp")}
          />
        </ScrollView>

        {/* Page 1 — Finds */}
        <ScrollView
          key="1"
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          <GlassGrid
            items={finds}
            type="find"
            onViewMore={() => onViewMore("find")}
          />
        </ScrollView>

        {/* Page 2 — Discoveries */}
        <ScrollView
          key="2"
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          <GlassGrid
            items={discoveries}
            type="discovery"
            onViewMore={() => onViewMore("discovery")}
          />
        </ScrollView>
      </PagerView>
    </View>
  );
}
